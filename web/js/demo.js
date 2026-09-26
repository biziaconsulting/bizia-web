/* BizIA · demo.js — the peak and the signature move.
   The paper that the camera pushes off the desk in the hero comes back here,
   scattered, and puts itself in order: input, prepared, pending, output.
   Everything on the board is real markup computed from the fictional cases
   in #demo-data; scroll progress (--sc-p, written by the engine on the act)
   decides how far each sheet has flown in and filled. */
(function () {
  'use strict';
  var sec = document.querySelector('.demo');
  var dataEl = document.getElementById('demo-data');
  if (!sec || !dataEl) return;

  var CASES = JSON.parse(dataEl.textContent);
  var CASE_KEY = 'bizia-demo-case';
  var flow = sec.querySelector('.board__flow');
  var board = sec.querySelector('[data-board]');
  var tabs = Array.prototype.slice.call(sec.querySelectorAll('.case'));
  var links = Array.prototype.slice.call(sec.querySelectorAll('.board__link'));
  var foot = sec.querySelector('.demo__foot');
  var note = sec.querySelector('[data-carry-note]');
  var cta = sec.querySelector('[data-carry]');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobileMQ = matchMedia('(max-width: 860px)');
  var current = CASES[0];
  var animated = !(sec.classList.contains("is-static") || reduce);
  var PHASE = [0.2, 0.37, 0.53, 0.69];   // when each sheet starts filling
  var last = -1;

  var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var ease = function (x) { x = clamp01(x); return 1 - Math.pow(1 - x, 3); };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };

  // ----------------------------------------------------------- render ---
  function lineHtml(l, i) {
    var st = ' style="--i:' + i + '"';
    if (l.k) return '<p class="ln ln--kv"' + st + '><span>' + esc(l.k) + '</span><b>' + esc(l.v) + '</b></p>';
    if (l.c) return '<p class="ln ln--check"' + st + '><span class="box" aria-hidden="true"></span>' + esc(l.c) + '</p>';
    return '<p class="ln' + (l.mark ? ' ln--mark' : '') + (l.dim ? ' ln--dim' : '') + '"' + st + '>' + esc(l.t) + '</p>';
  }
  function render(c) {
    flow.innerHTML = c.sheets.map(function (s, i) {
      return '<li class="dsheet dsheet--' + i + '" style="--n:' + s.lines.length + '">' +
        '<div class="dsheet__paper">' +
        '<p class="dsheet__kind"><span>' + String(i + 1).padStart(2, '0') + '</span>' + esc(s.kind) + '</p>' +
        '<h3 class="dsheet__title">' + esc(s.title) + '</h3>' +
        '<div class="dsheet__body">' + s.lines.map(lineHtml).join('') + '</div>' +
        (s.stamp ? '<p class="dsheet__stamp">' + esc(s.stamp) + '</p>' : '') +
        '</div></li>';
    }).join('');
    sheets = Array.prototype.slice.call(flow.children);
    last = -1;
    if (animated) apply(true);
  }
  var sheets = Array.prototype.slice.call(flow.children);

  // ------------------------------------------------------------- tabs ---
  function select(id, remember) {
    var c = CASES.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    current = c;
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-case') === id;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on) board.setAttribute('aria-labelledby', t.id);
    });
    render(c);
    if (note) note.textContent = 'Añadiremos el ejemplo «' + c.tab + '» a tu solicitud.';
    if (remember) remember_(c);
  }
  function remember_(c) {
    try { localStorage.setItem(CASE_KEY, JSON.stringify({ id: c.id, carry: c.carry })); } catch (e) {}
    document.dispatchEvent(new CustomEvent('bizia:carry', { detail: { id: c.id, carry: c.carry } }));
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t.getAttribute('data-case'), true); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      else if (k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (k === 'Home') n = tabs[0];
      else if (k === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); n.focus(); select(n.getAttribute('data-case'), true); }
    });
  });
  if (cta) cta.addEventListener('click', function () { remember_(current); });

  // A returning visitor sees the case they chose last time.
  try {
    var saved = JSON.parse(localStorage.getItem(CASE_KEY) || 'null');
    if (saved && saved.id && saved.id !== current.id) select(saved.id, false);
  } catch (e) {}

  if (!animated) return; // CSS shows the finished board

  // ------------------------------------------------------- choreography ---
  // Desktop: all four sheets fly in scattered, land in a row, then fill in
  // order while the connectors draw. Phone: the same sheets as a deck; the
  // front sheet fills, then lifts away to reveal the next.
  function readP() {
    var v = parseFloat(sec.style.getPropertyValue('--sc-p'));
    return isNaN(v) ? 0 : v;
  }
  function set(el, k, v) { el.style.setProperty(k, v.toFixed(4)); }

  function apply(force) {
    var p = readP();
    if (!force && Math.abs(p - last) < 0.0005) return;
    last = p;
    var mobile = mobileMQ.matches;
    var active = -1;

    if (!mobile) {
      sheets.forEach(function (s, i) {
        var fly = ease((p - 0.015 - i * 0.04) / 0.2);
        var fill = clamp01((p - PHASE[i]) / 0.12);
        var stamp = clamp01((p - PHASE[i] - 0.13) / 0.05);
        set(s, '--fly', fly); set(s, '--fill', fill); set(s, '--stamp', stamp);
        set(s, '--hl', clamp01((p - PHASE[i] - 0.08) / 0.08));
        s.style.removeProperty('--mt'); s.style.removeProperty('--ms'); s.style.removeProperty('--mo'); s.style.removeProperty('--mz');
        if (fill > 0 && fill < 1) active = i;
      });
      links.forEach(function (l, k) { l.style.setProperty('--link', clamp01((p - PHASE[k + 1] + 0.04) / 0.05).toFixed(4)); });
      if (active < 0 && p >= PHASE[3] + 0.12) active = 3;
    } else {
      var a = clamp01((p - 0.06) / 0.82) * (sheets.length - 1); // front index, fractional
      sheets.forEach(function (s, i) {
        var d = i - a;
        var fill = clamp01((a - i + 0.75) / 0.6);
        set(s, '--fly', 1); set(s, '--fill', fill);
        set(s, '--stamp', clamp01((a - i + 0.12) / 0.12));
        set(s, '--hl', fill);
        var mt, ms, mo;
        if (d >= 0) { mt = Math.min(d, 3) * 14; ms = 1 - Math.min(d, 3) * 0.045; mo = d > 2.6 ? 0 : 1; }
        else { mt = d * 90; ms = 1 + d * 0.03; mo = clamp01(1 + d * 2.4); }
        s.style.setProperty('--mt', mt.toFixed(1) + 'px');
        s.style.setProperty('--ms', ms.toFixed(4));
        s.style.setProperty('--mo', mo.toFixed(3));
        s.style.setProperty('--mz', String(d < 0 ? 1 : 10 - Math.round(d * 2)));
        if (Math.abs(d) < 0.5) active = i;
      });
    }
    sheets.forEach(function (s, i) { s.classList.toggle('is-active', i === active); });
    if (foot) foot.style.setProperty('--foot', (0.35 + 0.65 * clamp01((p - 0.82) / 0.08)).toFixed(3));
  }

  var on = false;
  function tick() { if (!on) return; apply(false); requestAnimationFrame(tick); }
  new IntersectionObserver(function (en) {
    var was = on; on = en[0].isIntersecting;
    if (on && !was) requestAnimationFrame(tick);
  }, { rootMargin: '20% 0px' }).observe(sec);
  mobileMQ.addEventListener && mobileMQ.addEventListener('change', function () { apply(true); });
  apply(true);
})();
