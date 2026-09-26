#!/usr/bin/env node
// Assembles web/*.html from src/pages/*.html plus the shared layout below.
// Edit src/, then run `node tools/build.mjs`. Never edit web/*.html by hand:
// the next build overwrites them.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SITE, NAV, FAQ, STEPS, REASONS, TOOLS, OTHER_TASKS, icon,
  orgNode, websiteNode, serviceNodes, faqNode,
} from '../src/data.mjs';
import { CASES } from '../src/demo-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src', 'pages');
const OUT = path.join(ROOT, 'web');
const V = Date.now().toString(36); // cache-buster for css/js

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ------------------------------------------------------------------ pages --
const PAGES = [
  {
    src: 'index.html', out: 'index.html', path: '/', key: 'home',
    title: 'BizIA · IA a medida para asesorías y gestorías en Donostia',
    desc: 'Soluciones a medida con agentes de IA para asesorías y gestorías de Donostia-San Sebastián. Adaptadas a tus procedimientos y con formación para tu equipo.',
    scripts: ['/js/hero.js', '/js/demo.js'], modules: ['/js/map.js'], hero: true,
    schema: () => [...serviceNodes()],
  },
  {
    src: 'soluciones.html', out: 'soluciones.html', path: '/soluciones', key: 'soluciones',
    title: 'Soluciones con agentes de IA y formación | BizIA',
    desc: 'Implantamos soluciones a medida con agentes de IA para gestión documental, comunicaciones y organización del trabajo, y formamos a tu equipo para usarlas.',
    crumbs: [['Soluciones', '/soluciones']],
    schema: () => [...serviceNodes()],
  },
  {
    src: 'preguntas-frecuentes.html', out: 'preguntas-frecuentes.html', path: '/preguntas-frecuentes', key: 'preguntas',
    title: 'Preguntas frecuentes sobre IA en tu despacho | BizIA',
    desc: 'Seguridad, software, plazos, precio y supervisión humana: respuestas claras antes de implantar agentes de IA en tu asesoría o gestoría.',
    crumbs: [['Preguntas frecuentes', '/preguntas-frecuentes']],
    schema: (url) => [faqNode(url)],
  },
  {
    src: 'contacto.html', out: 'contacto.html', path: '/contacto', key: 'contacto',
    title: 'Contacto y conversación gratuita | BizIA',
    desc: 'Reserva una conversación gratuita de 25 minutos. Estamos en la Universidad de Deusto, Campus San Sebastián, Camino de Mundaiz 50, Donostia.',
    crumbs: [['Contacto', '/contacto']], modules: ['/js/map.js'], type: 'ContactPage',
  },
  {
    src: 'nosotros.html', out: 'nosotros.html', path: '/nosotros', key: 'nosotros',
    title: 'Nosotros | BizIA',
    desc: 'Quiénes somos: tres estudiantes de ADE y Derecho que detectaron un problema real en las asesorías y decidieron resolverlo con IA. Conoce el equipo detrás de BizIA.',
    crumbs: [['Nosotros', '/nosotros']], type: 'AboutPage',
  },
  {
    src: 'aviso-legal.html', out: 'aviso-legal.html', path: '/aviso-legal', key: 'legal',
    title: 'Aviso legal | BizIA', desc: 'Aviso legal del sitio web de BizIA Consulting: titularidad, condiciones de uso, propiedad intelectual y legislación aplicable.',
    crumbs: [['Aviso legal', '/aviso-legal']], robots: 'noindex, follow',
  },
  {
    src: 'privacidad.html', out: 'privacidad.html', path: '/privacidad', key: 'legal',
    title: 'Política de privacidad | BizIA', desc: 'Cómo trata BizIA los datos personales que recibe a través del formulario de contacto de este sitio web y cómo ejercer tus derechos.',
    crumbs: [['Política de privacidad', '/privacidad']], robots: 'noindex, follow',
  },
  {
    src: 'cookies.html', out: 'cookies.html', path: '/cookies', key: 'legal',
    title: 'Política de cookies | BizIA', desc: 'Qué cookies utiliza el sitio web de BizIA, para qué sirven y cómo aceptar, rechazar o cambiar tu consentimiento en cualquier momento.',
    crumbs: [['Política de cookies', '/cookies']], robots: 'noindex, follow',
  },
  {
    src: '404.html', out: '404.html', path: '/404', key: '404',
    title: 'Página no encontrada | BizIA', desc: 'Esta página no existe.', robots: 'noindex, follow', noSchema: true,
  },
];

// --------------------------------------------------------------- partials --
function header(page) {
  const home = page.key === 'home';
  const tabs = NAV.map((n) => {
    const current = (page.key === 'soluciones' && n.href === '/soluciones') ||
      (page.key === 'preguntas' && n.href === '/preguntas-frecuentes') ||
      (page.key === 'nosotros' && n.href === '/nosotros');
    return `<li><a class="tab" href="${n.href}"${n.home ? ` data-home="${n.home}"` : ''}${current ? ' aria-current="page"' : ''}>` +
      `<span class="tab__stamp">${icon('check', 'ic ic--xs')}</span><span class="tab__label">${n.label}</span><span class="tab__bar" aria-hidden="true"></span></a></li>`;
  }).join('');
  return `
<header class="bar${home ? ' bar--over' : ''}" data-bar>
  <div class="bar__inner">
    <a class="bar__logo" href="/" aria-label="BizIA Consulting, inicio"><img src="/assets/logo.webp" width="640" height="279" alt="BizIA Consulting"></a>
    <nav class="tabs" aria-label="Principal"><ul>${tabs}</ul></nav>
    <a class="btn btn--primary bar__cta" href="/contacto" data-home="#contacto"${page.key === 'contacto' ? ' aria-current="page"' : ''}>${SITE.cta}</a>
    <button class="bar__menu" type="button" aria-expanded="false" aria-controls="menu">${icon('menu')}<span>Menú</span></button>
  </div>
</header>
<div class="menu" id="menu" hidden>
  <div class="menu__panel" role="dialog" aria-modal="true" aria-label="Menú">
    <button class="menu__close" type="button" aria-label="Cerrar menú">${icon('x')}</button>
    <ul class="menu__list">
      <li><a href="/">Inicio</a></li>
      ${NAV.map((n) => `<li><a href="${n.href}"${n.home ? ` data-home="${n.home}"` : ''}>${n.label}</a></li>`).join('')}
      <li><a href="/contacto" data-home="#contacto">Contacto</a></li>
    </ul>
    <a class="btn btn--primary btn--lg" href="/contacto" data-home="#contacto">${SITE.cta}</a>
    <p class="menu__meta">${SITE.address.street} · ${SITE.address.postal} ${SITE.address.city}</p>
  </div>
</div>`;
}

function footer() {
  const a = SITE.address;
  return `
<footer class="foot">
  <div class="wrap foot__grid">
    <div class="foot__brand">
      <a href="/" class="foot__logo" aria-label="BizIA Consulting, inicio"><img src="/assets/logo.webp" width="640" height="279" alt="BizIA Consulting" loading="lazy" decoding="async"></a>
      <p>IA hecha a medida de tus procesos. Soluciones con agentes de IA para asesorías y gestorías, adaptadas a tus procedimientos.</p>
      <address>${a.place}<br>${a.street} · ${a.postal} ${a.city}</address>
      <a class="btn btn--light" href="/contacto" data-home="#contacto">${SITE.cta}</a>
    </div>
    <nav class="foot__col" aria-label="Navegación del pie">
      <h2 class="foot__h">Navegación</h2>
      <ul>
        <li><a href="/">Inicio</a></li>
        <li><a href="/soluciones">Soluciones</a></li>
        <li><a href="/soluciones#ejemplos">Ejemplos</a></li>
        <li><a href="/soluciones#como-trabajamos">Cómo trabajamos</a></li>
        <li><a href="/preguntas-frecuentes">Preguntas frecuentes</a></li>
        <li><a href="/nosotros">Nosotros</a></li>
        <li><a href="/contacto">Contacto</a></li>
      </ul>
    </nav>
    <div class="foot__col">
      <h2 class="foot__h">Legal</h2>
      <ul>
        <li><a href="/aviso-legal">Aviso legal</a></li>
        <li><a href="/privacidad">Política de privacidad</a></li>
        <li><a href="/cookies">Política de cookies</a></li>
        <li><button type="button" class="linkbtn" data-cookie-open>Preferencias de cookies</button></li>
      </ul>
    </div>
    <div class="foot__col foot__powered">
      <h2 class="foot__h">Powered by</h2>
      <a class="foot__deusto" href="${SITE.deusto}" target="_blank" rel="noopener"><img src="/assets/deusto-emprende.webp" width="300" height="102" alt="Deusto Emprende" loading="lazy" decoding="async"></a>
      <div class="foot__social">
        <a href="${SITE.linkedin}" target="_blank" rel="noopener" aria-label="BizIA en LinkedIn">${icon('linkedin')}</a>
        <a href="mailto:${SITE.email}" aria-label="Escríbenos a ${SITE.email}">${icon('mail')}</a>
      </div>
    </div>
  </div>
  <div class="wrap foot__base">
    <p>© 2026 BizIA. Todos los derechos reservados.</p>
    <p>Hecho con IA, supervisado por personas.</p>
  </div>
</footer>
<a class="dock" href="/contacto" data-home="#contacto" data-dock>${SITE.cta}${icon('arrow', 'ic ic--sm')}</a>
<div class="cookie" data-cookie hidden>
  <div class="cookie__in" role="region" aria-label="Aviso de cookies">
    <p>Usamos cookies analíticas (Google Analytics) solo si las aceptas, para entender de forma agregada cómo se usa la web. <a href="/cookies">Más información</a>.</p>
    <div class="cookie__actions">
      <button type="button" class="btn btn--ghost-dark" data-cookie-choice="denied">Rechazar</button>
      <button type="button" class="btn btn--primary" data-cookie-choice="granted">Aceptar</button>
    </div>
  </div>
</div>`;
}

function crumbsHtml(page) {
  if (!page.crumbs) return '';
  const items = [['Inicio', '/'], ...page.crumbs];
  return `<nav class="crumbs" aria-label="Ruta de navegación"><ol class="wrap">${items.map(([n, h], i) =>
    i === items.length - 1 ? `<li><span aria-current="page">${n}</span></li>` : `<li><a href="${h}">${n}</a></li>`).join('')}</ol></nav>`;
}

function faqList(items, hLevel = 3) {
  return items.map((f, i) => `
      <details class="qa"${i === 0 ? ' open' : ''}>
        <summary><h${hLevel} class="qa__q">${f.q}</h${hLevel}><span class="qa__icon" aria-hidden="true">${icon('plus')}</span></summary>
        <div class="qa__a"><p>${f.a}</p></div>
      </details>`).join('');
}

function stepsBlock({ headingTag = 'h2', id = 'como-trabajamos', kinetic = true } = {}) {
  return `
<section class="steps" id="${id}" data-sc-act="flow" aria-labelledby="${id}-h">
  <div class="wrap">
    <div class="steps__head">
      <${headingTag} id="${id}-h" class="h2"${kinetic ? ' data-sc-cue="0.03 1 0.12 0" data-sc-kinetic="lines"' : ' data-sc-in'}>Del primer contacto al uso diario</${headingTag}>
      <p class="body" data-sc-in>Un camino claro y por fases. Empiezas sin coste y avanzas solo si lo que ves te convence.</p>
    </div>
    <div class="route">
      <svg class="route__line" viewBox="0 0 1000 10" preserveAspectRatio="none" aria-hidden="true"><path class="route__ghost" d="M0 5 H1000"/><path class="route__ink" d="M0 5 H1000" pathLength="1"/></svg>
      <svg class="route__line route__line--v" viewBox="0 0 10 1000" preserveAspectRatio="none" aria-hidden="true"><path class="route__ghost" d="M5 0 V1000"/><path class="route__ink" d="M5 0 V1000" pathLength="1"/></svg>
      <ol class="route__steps">
        ${STEPS.map((s, i) => `<li class="step" style="--at:${(0.22 + i * 0.1333).toFixed(3)}">
          <span class="step__node" aria-hidden="true"><span class="step__n">${s.n}</span><span class="step__ok">${icon('check', 'ic ic--sm')}</span></span>
          <h3 class="step__t">${s.t}</h3>
          <p class="step__d">${s.d}</p>
        </li>`).join('')}
      </ol>
    </div>
    <p class="steps__cta"><a class="btn btn--primary btn--lg" href="/contacto" data-home="#contacto">${SITE.cta}${icon('arrow', 'ic ic--sm')}</a></p>
  </div>
</section>`;
}

function contactBlock(page) {
  const a = SITE.address;
  const origin = `biziaconsulting.com${page.path === '/' ? '/' : page.path}`;
  const opts = (arr) => arr.map((o) => `<option>${o}</option>`).join('');
  return `
<section class="contact" id="contacto" data-sc-act="flow" aria-labelledby="contacto-h">
  <div class="wrap contact__grid">
    <div class="contact__copy">
      <h2 id="contacto-h" class="h2" data-sc-in>Hablemos de una tarea de tu despacho</h2>
      <p class="lede" data-sc-in>Cuéntanos cómo es tu despacho y qué tarea te gustaría resolver. Te proponemos una conversación de 25 minutos con una demostración breve. Sin coste y sin compromiso.</p>
      <ul class="assure" data-sc-in data-sc-stagger="60">
        <li>${icon('clock', 'ic ic--sm')}Respuesta en menos de 24 h laborables</li>
        <li>${icon('shield', 'ic ic--sm')}Tus datos, tratados conforme al RGPD</li>
        <li>${icon('hand', 'ic ic--sm')}Si no encaja, te lo decimos antes de empezar</li>
      </ul>
      <form class="form" action="/api/audit" method="post" novalidate data-form>
        <div class="form__grid">
          <div class="field"><label for="f-nombre">Nombre</label><input id="f-nombre" name="nombre" type="text" autocomplete="name" required maxlength="120"><p class="field__err" id="f-nombre-err"></p></div>
          <div class="field"><label for="f-despacho">Nombre del despacho</label><input id="f-despacho" name="despacho" type="text" autocomplete="organization" required maxlength="160"><p class="field__err" id="f-despacho-err"></p></div>
          <div class="field"><label for="f-email">Email profesional</label><input id="f-email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="160"><p class="field__err" id="f-email-err"></p></div>
          <div class="field"><label for="f-telefono">Teléfono <span class="opt">(opcional)</span></label><input id="f-telefono" name="telefono" type="tel" autocomplete="tel" inputmode="tel" maxlength="40"><p class="field__err" id="f-telefono-err"></p></div>
          <div class="field"><label for="f-empleados">Nº de empleados</label><select id="f-empleados" name="empleados"><option value="">Selecciona…</option>${opts(['1–3', '3–10', '10–25', 'Más de 25'])}</select></div>
          <div class="field"><label for="f-software">Software principal</label><select id="f-software" name="software"><option value="">Selecciona…</option>${opts(['A3', 'Sage', 'Holded', 'Otro / varios'])}</select></div>
          <div class="field field--full"><label for="f-mensaje">¿Qué te quita más tiempo? <span class="opt">(opcional)</span></label><textarea id="f-mensaje" name="mensaje" rows="4" maxlength="2000"></textarea></div>
          <div class="field field--full field--check"><input id="f-consent" name="consent" type="checkbox" value="si" required><label for="f-consent">Acepto que BizIA trate mis datos para contactarme sobre la conversación gratuita, conforme a su <a href="/privacidad">política de privacidad</a>.</label><p class="field__err" id="f-consent-err"></p></div>
        </div>
        <div class="hp" aria-hidden="true"><label for="f-web">Web</label><input id="f-web" name="web" type="text" tabindex="-1" autocomplete="off"></div>
        <input type="hidden" name="origen" value="${origin}">
        <input type="hidden" name="t0" value="">
        <div class="form__submit">
          <button class="btn btn--primary btn--lg" type="submit">${SITE.cta}${icon('arrow', 'ic ic--sm')}</button>
          <p class="form__note">Gratis y sin compromiso. Nunca compartimos tus datos.</p>
        </div>
        <div class="form__status" role="status" aria-live="polite"></div>
      </form>
    </div>
    <div class="contact__place">
      <div class="place" data-place>
        <div class="map" data-map data-lat="${a.lat}" data-lng="${a.lng}" role="region" aria-label="Mapa: ${a.place}, ${a.street}, ${a.city}">
          <div class="map__canvas"></div>
          <div class="map__fallback">
            <span class="map__pin">${icon('pin')}</span>
            <p>${a.place}<br>${a.street}</p>
          </div>
          <button class="map__reset" type="button" hidden>Volver a BizIA</button>
        </div>
        <div class="place__card">
          <img class="place__mark" src="/assets/mark.webp" width="128" height="128" alt="" aria-hidden="true">
          <div>
            <p class="place__name">BizIA Consulting</p>
            <address>${a.place}<br>${a.street} · ${a.postal} ${a.city}</address>
          </div>
          <div class="place__links">
            <a class="btn btn--primary btn--sm" href="${SITE.directions}" target="_blank" rel="noopener">${icon('nav', 'ic ic--sm')}Cómo llegar</a>
            <a class="btn btn--ghost-dark btn--sm" href="mailto:${SITE.email}">${icon('mail', 'ic ic--sm')}${SITE.email}</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

function band() {
  return `
<section class="band">
  <div class="wrap band__in" data-sc-in>
    <p class="band__t">¿Hablamos de una tarea de tu despacho?</p>
    <a class="btn btn--primary btn--lg" href="/contacto">${SITE.cta}${icon('arrow', 'ic ic--sm')}</a>
  </div>
</section>`;
}

// ----------------------------------------------------------- demo board --
function sheetBody(s) {
  return s.lines.map((l, i) => {
    const st = `style="--i:${i}"`;
    if (l.k) return `<p class="ln ln--kv" ${st}><span>${l.k}</span><b>${l.v}</b></p>`;
    if (l.c) return `<p class="ln ln--check" ${st}><span class="box" aria-hidden="true"></span>${l.c}</p>`;
    return `<p class="ln${l.mark ? ' ln--mark' : ''}${l.dim ? ' ln--dim' : ''}" ${st}>${l.t}</p>`;
  }).join('');
}
function demoBoard() {
  const c = CASES[0];
  return c.sheets.map((s, i) => `
          <li class="dsheet dsheet--${i}" style="--n:${s.lines.length}">
            <div class="dsheet__paper">
              <p class="dsheet__kind"><span>${String(i + 1).padStart(2, '0')}</span>${s.kind}</p>
              <h3 class="dsheet__title">${s.title}</h3>
              <div class="dsheet__body">${sheetBody(s)}</div>
              ${s.stamp ? `<p class="dsheet__stamp">${s.stamp}</p>` : ''}
            </div>
          </li>`).join('');
}

const PARTIALS = {
  'faq:home': () => faqList(FAQ.slice(0, 3)),
  'faq:all': () => faqList(FAQ, 2),
  steps: () => stepsBlock(),
  'steps:static': () => stepsBlock({ kinetic: false }),
  contact: (page) => contactBlock(page),
  band: () => band(),
  'demo:board': () => demoBoard(),
  'demo:tabs': () => CASES.map((c, i) => `<button class="case" type="button" role="tab" id="case-${c.id}" aria-selected="${i === 0}" aria-controls="demo-board" data-case="${c.id}"${i ? ' tabindex="-1"' : ''}>${c.tab.replace(/ (\S+)$/, '<span class="case__more"> $1</span>')}</button>`).join(''),
  'demo:json': () => `<script type="application/json" id="demo-data">${JSON.stringify(CASES).replace(/</g, '\\u003c')}</script>`,
  reasons: () => REASONS.map((r, i) => `
        <article class="reason" style="--k:${i}">
          <div class="reason__in" data-sc-tilt="5">
            <span class="reason__dot" aria-hidden="true">${icon(["pin", "check", "target", "hand", "shield", "clock"][i], "ic ic--sm")}</span>
            <h3 class="reason__t">${r.t}</h3>
            <p>${r.d}</p>
          </div>
        </article>`).join(''),
  tools: () => {
    const li = TOOLS.map((t) => `<li>${t}</li>`).join('');
    return `<ul>${li}</ul><ul aria-hidden="true">${li}</ul>`;
  },
  'other-tasks': () => OTHER_TASKS.map((t) => `<li><h3>${t.t}</h3><p>${t.d}</p></li>`).join(''),
  cta: () => SITE.cta,
  email: () => SITE.email,
  linkedin: () => SITE.linkedin,
};

function expand(html, page) {
  return html
    .replace(/<!--\s*@([\w:-]+)\s*-->/g, (m, k) => {
      if (!PARTIALS[k]) throw new Error(`Unknown partial @${k} in ${page.src}`);
      return PARTIALS[k](page);
    })
    .replace(/\{\{icon:([\w-]+)(?::([\w -]+))?\}\}/g, (m, n, cls) => icon(n, cls || 'ic ic--sm'));
}

// ---------------------------------------------------------------- schema --
function schemaFor(page) {
  const url = `${SITE.url}${page.path === '/' ? '/' : page.path}`;
  const webpage = {
    '@type': page.type || 'WebPage',
    '@id': `${url}#webpage`,
    url, name: page.title, description: page.desc, inLanguage: 'es-ES',
    isPartOf: { '@id': `${SITE.url}/#website` },
    about: { '@id': `${SITE.url}/#organization` },
    primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE.url}/assets/og-image.jpg` },
  };
  const graph = [orgNode(), websiteNode(), webpage];
  if (page.crumbs) {
    const items = [['Inicio', '/'], ...page.crumbs];
    const bc = {
      '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
      itemListElement: items.map(([n, h], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: `${SITE.url}${h}` })),
    };
    webpage.breadcrumb = { '@id': bc['@id'] };
    graph.push(bc);
  }
  if (page.schema) graph.push(...page.schema(url));
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

// ---------------------------------------------------------------- layout --
function layout(page, body) {
  const url = `${SITE.url}${page.path === '/' ? '/' : page.path}`;
  const robots = page.robots || 'index, follow, max-image-preview:large, max-snippet:-1';
  const heroPreload = page.hero ? `
<link rel="preload" as="image" href="/assets/hero-poster.webp" media="(min-width: 861px)" fetchpriority="high">
<link rel="preload" as="image" href="/assets/hero-poster-m.webp" media="(max-width: 860px)" fetchpriority="high">` : '';
  const scripts = [
    `<script src="/js/scrollcraft.js?v=${V}" defer></script>`,
    ...(page.scripts || []).map((s) => `<script src="${s}?v=${V}" defer></script>`),
    `<script src="/js/site.js?v=${V}" defer></script>`,
    ...(page.modules || []).map((s) => `<script type="module" src="${s}?v=${V}"></script>`),
  ].join('\n');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.desc)}">
<meta name="robots" content="${robots}">
${page.key === '404' ? '' : `<link rel="canonical" href="${url}">`}
<meta name="theme-color" content="#FBF1EB">
<meta name="author" content="BizIA Consulting">
<meta property="og:type" content="website">
<meta property="og:site_name" content="BizIA">
<meta property="og:locale" content="es_ES">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.url}/assets/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="BizIA Consulting: IA hecha a medida de tus procesos.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.title)}">
<meta name="twitter:description" content="${esc(page.desc)}">
<meta name="twitter:image" content="${SITE.url}/assets/og-image.jpg">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/fonts/sora-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>${heroPreload}
<link rel="stylesheet" href="/css/scrollcraft.css?v=${V}">
<link rel="stylesheet" href="/css/site.css?v=${V}">
${page.noSchema ? '' : `<script type="application/ld+json">${schemaFor(page)}</script>`}
</head>
<body class="p-${page.key}" data-page="${page.key}">
<a class="skip" href="#main">Saltar al contenido</a>
<div class="sc-grain" aria-hidden="true"></div>
${header(page)}
<main id="main">
${crumbsHtml(page)}
${body}
</main>
${footer()}
${scripts}
</body>
</html>
`;
}

// ------------------------------------------------------------------ build --
for (const page of PAGES) {
  const raw = fs.readFileSync(path.join(SRC, page.src), 'utf8');
  const html = layout(page, expand(raw, page));
  if (/\u2014/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) {
    throw new Error(`Em dash found in ${page.src}. Use a period, comma, colon or parentheses.`);
  }
  fs.writeFileSync(path.join(OUT, page.out), html);
  console.log('built', page.out);
}

// sitemap: only the pages worth a sitelink. Legal templates are noindex.
const indexable = PAGES.filter((p) => !p.robots && p.key !== '404');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map((p) => `  <url><loc>${SITE.url}${p.path === '/' ? '/' : p.path}</loc><lastmod>${SITE.lastmod}</lastmod><changefreq>monthly</changefreq><priority>${p.path === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, 'site.webmanifest'), JSON.stringify({
  name: 'BizIA Consulting', short_name: 'BizIA', lang: 'es', start_url: '/', display: 'browser',
  background_color: '#FBF1EB', theme_color: '#FBF1EB',
  icons: [
    { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}, null, 2));
console.log('built sitemap.xml robots.txt site.webmanifest');
