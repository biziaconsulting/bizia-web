/* BizIA · map.js — the close lands somewhere real.
   MapLibre (self-hosted) with OpenFreeMap's free vector style, recoloured to
   the page. While the visitor scrolls through the contact section the camera
   travels from La Concha to Mundaiz, tilts and settles on the pin; the moment
   they drag or zoom, the camera is theirs and a "Volver a BizIA" control
   appears. Loaded only when the section approaches. No key, no cookies. */
const el = document.querySelector('[data-map]');
const STYLE = 'https://tiles.openfreemap.org/styles/positron';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function webgl() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

if (el && webgl()) {
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); boot().catch((err) => console.warn('[map]', err)); }
  }, { rootMargin: '900px 0px' });
  io.observe(el);
}

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const ease = (x) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

async function boot() {
  const { Map, Marker, NavigationControl, AttributionControl } = await import('/vendor/maplibre/maplibre-gl.mjs');
  if (!document.querySelector('link[data-maplibre]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = '/vendor/maplibre/maplibre-gl.css'; css.setAttribute('data-maplibre', '');
    document.head.appendChild(css);
  }

  const target = [parseFloat(el.dataset.lng), parseFloat(el.dataset.lat)];
  const START = { center: [-1.9855, 43.3185], zoom: 12.4, pitch: 0, bearing: 0 };     // La Concha, the whole city
  const END = { center: target, zoom: 16.3, pitch: 56, bearing: -24 };                 // Mundaiz, tilted
  const section = el.closest('.contact') || el;

  const map = new Map({
    container: el.querySelector('.map__canvas'),
    style: STYLE,
    center: reduce ? END.center : START.center,
    zoom: reduce ? END.zoom : START.zoom,
    pitch: reduce ? END.pitch : START.pitch,
    bearing: reduce ? END.bearing : START.bearing,
    attributionControl: false,
    cooperativeGestures: true,
    maxPitch: 70,
    locale: {
      'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + rueda para acercar el mapa',
      'CooperativeGesturesHandler.MacHelpText': 'Usa ⌘ + rueda para acercar el mapa',
      'CooperativeGesturesHandler.MobileHelpText': 'Usa dos dedos para mover el mapa',
      'NavigationControl.ZoomIn': 'Acercar',
      'NavigationControl.ZoomOut': 'Alejar',
      'NavigationControl.ResetBearing': 'Orientar al norte',
    },
  });
  map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
  map.addControl(new AttributionControl({ compact: true }), 'bottom-right');

  map.on('style.load', () => recolour(map));

  // the pin: the brand mark on paper, with a slow pulse
  const pin = document.createElement('div');
  pin.className = 'bpin';
  pin.setAttribute('role', 'img');
  pin.setAttribute('aria-label', 'BizIA Consulting, Universidad de Deusto, Campus San Sebastián');
  pin.innerHTML = '<span class="bpin__ring"></span><span class="bpin__core"><img src="/assets/mark.webp" width="28" height="28" alt=""></span>';
  new Marker({ element: pin, anchor: 'center' }).setLngLat(target).addTo(map);

  map.once('load', () => {
    el.classList.add('is-live');
    // start with the attribution folded on small maps; the (i) button opens it
    if (el.clientWidth < 640) el.querySelectorAll('.maplibregl-compact-show').forEach((a) => a.classList.remove('maplibregl-compact-show'));
    drive(true);
  });

  // ---- the camera follows the scroll until the visitor takes it --------
  let owned = false;
  let lastT = -1;
  const reset = el.querySelector('.map__reset');
  const takeOver = (e) => {
    if (!e || !e.originalEvent || owned) return;
    owned = true;
    if (reset) reset.hidden = false;
  };
  map.on('dragstart', takeOver);
  map.on('zoomstart', takeOver);
  map.on('rotatestart', takeOver);
  map.on('pitchstart', takeOver);
  if (reset) reset.addEventListener('click', () => {
    reset.hidden = true;
    map.flyTo({ ...END, duration: reduce ? 0 : 1600, essential: true });
    setTimeout(() => { owned = false; lastT = -1; }, reduce ? 0 : 1700);
  });

  function progress() {
    const r = section.getBoundingClientRect();
    const vh = innerHeight;
    // 0 when the section's top meets the bottom of the viewport,
    // 1 when the map has been fully on screen for a while.
    return clamp01((vh - r.top) / (vh * 1.15));
  }
  function drive(force) {
    if (owned || reduce) return;
    const t = ease(progress());
    if (!force && Math.abs(t - lastT) < 0.001) return;
    lastT = t;
    map.jumpTo({
      center: [lerp(START.center[0], END.center[0], t), lerp(START.center[1], END.center[1], t)],
      zoom: lerp(START.zoom, END.zoom, t),
      pitch: lerp(START.pitch, END.pitch, t),
      bearing: lerp(START.bearing, END.bearing, t),
    });
  }
  let on = false;
  const loop = () => { if (!on) return; drive(false); requestAnimationFrame(loop); };
  new IntersectionObserver((en) => {
    const was = on; on = en[0].isIntersecting;
    if (on && !was) requestAnimationFrame(loop);
  }).observe(el);
}

// Positron is a quiet grey base. Warm it to the page: peach land, bone roads,
// a muted sea, charcoal labels, and extruded buildings for depth when tilted.
function recolour(map) {
  const C = {
    land: '#F6E6DC', water: '#CFD8DA', park: '#E9E3CC', road: '#FFFCFA', roadEdge: '#E6CFC2',
    building: '#EBD3C6', label: '#5E4A42', labelHalo: '#FBF1EB',
  };
  const style = map.getStyle();
  for (const layer of style.layers) {
    const id = layer.id;
    const set = (prop, val) => { try { map.setPaintProperty(id, prop, val); } catch (e) {} };
    if (layer.type === 'background') set('background-color', C.land);
    else if (layer.type === 'fill') {
      if (/water|ocean|lake|river/.test(id)) set('fill-color', C.water);
      else if (/park|wood|grass|landcover|landuse/.test(id)) set('fill-color', C.park);
      else if (/building/.test(id)) set('fill-color', C.building);
      else if (/land|earth/.test(id)) set('fill-color', C.land);
    } else if (layer.type === 'line') {
      if (/water|river|waterway/.test(id)) set('line-color', C.water);
      else if (/casing/.test(id)) set('line-color', C.roadEdge);
      else if (/road|highway|street|path|bridge|tunnel|rail/.test(id)) set('line-color', /rail/.test(id) ? C.roadEdge : C.road);
    } else if (layer.type === 'symbol') {
      set('text-color', C.label);
      set('text-halo-color', C.labelHalo);
    }
  }
  // 3D buildings on the same vector source, visible when the camera tilts in.
  const src = Object.keys(style.sources).find((k) => style.sources[k].type === 'vector');
  if (src && !map.getLayer('bizia-3d')) {
    const firstSymbol = style.layers.find((l) => l.type === 'symbol');
    try {
      map.addLayer({
        id: 'bizia-3d', type: 'fill-extrusion', source: src, 'source-layer': 'building', minzoom: 14.5,
        paint: {
          'fill-extrusion-color': '#EAD0C2',
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], ['get', 'height'], 8],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
          'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 14.5, 0, 15.5, 0.88],
        },
      }, firstSymbol ? firstSymbol.id : undefined);
    } catch (e) { /* style without building layer: stay flat */ }
  }
}
