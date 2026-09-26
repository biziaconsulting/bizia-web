/* BizIA · site.js
   Page-level behaviour around the scrollcraft engine: act modes per device,
   the folder-tab index, menu, dock, marquee, cookies + GA, and the form.
   The engine itself is untouched; everything here reads the DOM it drives. */
(function () {
  'use strict';

  var doc = document;
  var body = doc.body;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = matchMedia('(max-width: 860px)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var isHome = body.getAttribute('data-page') === 'home';
  var GA_ID = 'G-MCGLZXXY9X';
  var CONSENT_KEY = 'bizia-cookie-consent';
  var CASE_KEY = 'bizia-demo-case';

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };

  // ---------------------------------------------------------- act modes --
  // A pinned act exists for choreography. On a phone, or with motion off,
  // the same content reads better as an ordinary section, so release it
  // BEFORE the engine mounts and measures.
  Array.prototype.forEach.call(doc.querySelectorAll('[data-sc-act]'), function (el) {
    var act = el.getAttribute('data-sc-act');
    var release = el.hasAttribute('data-sc-mobile') && (small || reduce);
    if (el.classList.contains('demo') && reduce) release = true;
    if (release) {
      el.setAttribute('data-sc-act', 'flow');
      el.removeAttribute('data-sc-span');
      Array.prototype.forEach.call(el.querySelectorAll('[data-sc-pan]'), function (r) { r.removeAttribute('data-sc-pan'); });
      el.setAttribute('data-mode', 'flow');
      if (el.classList.contains('demo')) el.classList.add('is-static');
    } else {
      el.setAttribute('data-mode', act);
      if (act === 'pin') {
        Array.prototype.forEach.call(el.querySelectorAll('.pile'), function (p) {
          p.removeAttribute('data-sc-in'); p.removeAttribute('data-sc-stagger');
        });
      }
    }
  });

  if (window.ScrollCraft) window.ScrollCraft.mount(body);

  // ------------------------------------------------------------ jumping --
  // A pinned act is measured from its own top (its stage already clears the
  // bar); data-jump lands part-way into its travel so the choreography has
  // already happened. Anything else clears the fixed bar.
  function targetY(el) {
    var top = el.getBoundingClientRect().top + scrollY;
    var mode = el.getAttribute('data-mode');
    if (mode === 'pin' || mode === 'pan' || mode === 'scrub') {
      var jump = parseFloat(el.getAttribute('data-jump') || '0');
      return top + Math.max(el.offsetHeight - innerHeight, 0) * jump;
    }
    return top - (parseFloat(getComputedStyle(doc.documentElement).scrollPaddingTop) || 0);
  }
  function jumpTo(hash) {
    var el = hash && hash.length > 1 ? doc.getElementById(hash.slice(1)) : null;
    if (!el) return false;
    var y = targetY(el);
    scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', hash);
    var focusable = el.querySelector('h2, h1');
    if (focusable) { focusable.setAttribute('tabindex', '-1'); focusable.focus({ preventScroll: true }); }
    return true;
  }
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var hash = null;
    if (isHome && a.hasAttribute('data-home')) hash = a.getAttribute('data-home');
    else if (a.getAttribute('href') && a.getAttribute('href').charAt(0) === '#') hash = a.getAttribute('href');
    if (!hash) return;
    if (jumpTo(hash)) { e.preventDefault(); closeMenu(); }
  });

  // --------------------------------------------- the folder-tab index ----
  var tabs = [];
  if (isHome) {
    Array.prototype.forEach.call(doc.querySelectorAll('.tabs .tab[data-home]'), function (t) {
      var sec = doc.getElementById(t.getAttribute('data-home').slice(1));
      if (sec) tabs.push({ el: t, sec: sec, done: false, p: -1 });
    });
  }
  function trackTabs() {
    var vh = innerHeight;
    for (var i = 0; i < tabs.length; i++) {
      var T = tabs[i];
      var r = T.sec.getBoundingClientRect();
      var p = clamp01((vh * 0.4 - r.top) / Math.max(r.height, 1));
      if (Math.abs(p - T.p) > 0.002) { T.el.style.setProperty('--tp', p.toFixed(3)); T.p = p; }
      var active = p > 0 && p < 1;
      T.el.classList.toggle('is-active', active);
      if (active) T.el.setAttribute('aria-current', 'location'); else T.el.removeAttribute('aria-current');
      if (p >= 0.995 && !T.done) { T.done = true; T.el.classList.add('is-done'); }
    }
  }

  // ----------------------------------------------------------------- dock --
  var dock = doc.querySelector('[data-dock]');
  var dockBlockers = [];
  var dockBlocked = false;
  if (dock && 'IntersectionObserver' in window) {
    var blockEls = doc.querySelectorAll('#contacto, .foot, .band, .menu');
    var seen = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) seen.add(en.target); else seen.delete(en.target); });
      dockBlocked = seen.size > 0;
    }, { threshold: 0 });
    Array.prototype.forEach.call(blockEls, function (el) { io.observe(el); dockBlockers.push(el); });
  }
  var hero = doc.querySelector('.hero');
  function trackDock() {
    if (!dock) return;
    var start = hero ? hero.offsetHeight - innerHeight * 0.4 : 360;
    var cookieOpen = cookie && !cookie.hidden;
    dock.classList.toggle('is-on', scrollY > start && !dockBlocked && !menuOpen && !cookieOpen);
  }

  // ------------------------------------------------------------- frame ---
  var ticking = false;
  function frame() {
    ticking = false;
    trackTabs();
    trackDock();
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  addEventListener('load', request);
  request();

  // --------------------------------------------------------------- menu ---
  var menu = doc.getElementById('menu');
  var menuBtn = doc.querySelector('.bar__menu');
  var menuOpen = false;
  function openMenu() {
    if (!menu) return;
    menu.hidden = false; menuOpen = true;
    menuBtn.setAttribute('aria-expanded', 'true');
    var first = menu.querySelector('a, button');
    if (first) first.focus();
    request();
  }
  function closeMenu() {
    if (!menu || !menuOpen) return;
    menu.hidden = true; menuOpen = false;
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.focus({ preventScroll: true });
    request();
  }
  if (menu && menuBtn) {
    menuBtn.addEventListener('click', function () { menuOpen ? closeMenu() : openMenu(); });
    menu.querySelector('.menu__close').addEventListener('click', closeMenu);
    menu.addEventListener('click', function (e) { if (e.target === menu) closeMenu(); });
    doc.addEventListener('keydown', function (e) {
      if (!menuOpen) return;
      if (e.key === 'Escape') { closeMenu(); return; }
      if (e.key === 'Tab') {
        var f = menu.querySelectorAll('a, button');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  // ------------------------------------------------------------ marquee ---
  // The strip drifts on its own and answers the wheel: scroll fast and it
  // runs with you, scroll up and it reverses, hover and it settles.
  var mq = doc.querySelector('[data-marquee] .marquee__track');
  if (mq && !reduce) {
    var mqX = 0, mqV = 0, mqDir = -1, mqHover = false, mqOn = false, lastY = scrollY, lastT = performance.now();
    var unit = function () { var u = mq.firstElementChild; return u ? u.getBoundingClientRect().width : 0; };
    var mqW = unit();
    addEventListener('resize', function () { mqW = unit(); });
    if (fine) {
      mq.parentNode.addEventListener('pointerenter', function () { mqHover = true; });
      mq.parentNode.addEventListener('pointerleave', function () { mqHover = false; });
    }
    new IntersectionObserver(function (en) {
      var was = mqOn; mqOn = en[0].isIntersecting;
      if (mqOn && !was) { lastT = performance.now(); requestAnimationFrame(mqTick); }
    }).observe(mq.parentNode);
    var mqTick = function (t) {
      if (!mqOn) return;
      var dt = Math.min((t - lastT) / 1000, 0.05); lastT = t;
      var dy = scrollY - lastY; lastY = scrollY;
      if (dy) mqDir = dy > 0 ? -1 : 1;
      var target = (mqHover ? 0 : 38) + Math.min(Math.abs(dy) / Math.max(dt, 0.008) * 0.45, 1400);
      mqV += (target - mqV) * 0.08;
      mqX += mqDir * mqV * dt;
      if (mqW) { if (mqX <= -mqW) mqX += mqW; if (mqX > 0) mqX -= mqW; }
      mq.style.transform = 'translate3d(' + mqX.toFixed(2) + 'px,0,0)';
      requestAnimationFrame(mqTick);
    };
  }

  // ---------------------------------------- pointer depth on page heads ---
  var ph = doc.querySelector('.phead');
  if (ph && fine && !reduce) {
    var tx = 0, ty = 0, cx = 0, cy = 0, run = false;
    var loop = function () {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      ph.style.setProperty('--mx', cx.toFixed(3)); ph.style.setProperty('--my', cy.toFixed(3));
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) requestAnimationFrame(loop); else run = false;
    };
    addEventListener('pointermove', function (e) {
      if (scrollY > ph.offsetHeight) return;
      tx = (e.clientX / innerWidth) * 2 - 1; ty = (e.clientY / innerHeight) * 2 - 1;
      if (!run) { run = true; requestAnimationFrame(loop); }
    }, { passive: true });
  }

  // ------------------------------------------------------ cookies + GA ---
  var cookie = doc.querySelector('[data-cookie]');
  function gtagLoaded() { return !!doc.getElementById('ga-script'); }
  function loadGA() {
    if (gtagLoaded()) { window.gtag && window.gtag('consent', 'update', { analytics_storage: 'granted' }); return; }
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
    var s = doc.createElement('script');
    s.async = true; s.id = 'ga-script';
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    doc.head.appendChild(s);
  }
  function denyGA() {
    if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
    ['_ga', '_ga_' + GA_ID.replace('G-', '')].forEach(function (n) {
      doc.cookie = n + '=; Max-Age=0; path=/';
      doc.cookie = n + '=; Max-Age=0; path=/; domain=.' + location.hostname.replace(/^www\./, '');
    });
  }
  function readConsent() {
    var v = (store.get(CONSENT_KEY) || '').toLowerCase();
    if (/granted|accept|true|yes/.test(v)) return 'granted';
    if (/denied|reject|false|no/.test(v)) return 'denied';
    return null;
  }
  var consent = readConsent();
  if (consent === 'granted') loadGA();
  if (cookie) {
    if (!consent) cookie.hidden = false;
    cookie.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cookie-choice]');
      if (!b) return;
      var c = b.getAttribute('data-cookie-choice');
      store.set(CONSENT_KEY, c);
      if (c === 'granted') loadGA(); else denyGA();
      cookie.hidden = true; request();
    });
    Array.prototype.forEach.call(doc.querySelectorAll('[data-cookie-open]'), function (b) {
      b.addEventListener('click', function () {
        cookie.hidden = false; request();
        var btn = cookie.querySelector('[data-cookie-choice="granted"]'); if (btn) btn.focus();
      });
    });
  }

  // --------------------------------------------------------------- form ---
  var form = doc.querySelector('[data-form]');
  if (form) initForm(form);

  function initForm(form) {
    var status = form.querySelector('.form__status');
    var t0 = form.querySelector('[name="t0"]');
    if (t0) t0.value = String(Date.now());
    var msg = form.querySelector('[name="mensaje"]');

    function carry(text) {
      if (!msg || !text) return;
      if (!msg.value.trim() || msg.getAttribute('data-autofill') === '1') {
        msg.value = text; msg.setAttribute('data-autofill', '1');
      }
    }
    try { var saved = JSON.parse(store.get(CASE_KEY) || 'null'); if (saved && saved.carry) carry(saved.carry); } catch (e) {}
    doc.addEventListener('bizia:carry', function (e) { carry(e.detail && e.detail.carry); });
    if (msg) msg.addEventListener('input', function () { msg.setAttribute('data-autofill', '0'); });

    var q = new URLSearchParams(location.search);
    if (q.get('enviado') === '1') showSent(form, null);
    else if (q.get('error') === '1') showError();

    var rules = {
      nombre: function (v) { return v.trim().length >= 2 ? '' : 'Escribe tu nombre.'; },
      despacho: function (v) { return v.trim().length >= 2 ? '' : 'Escribe el nombre del despacho.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Escribe un email válido.'; },
      telefono: function (v) { return !v.trim() || /^[+()\d\s.-]{6,20}$/.test(v.trim()) ? '' : 'Revisa el teléfono.'; }
    };
    function setErr(field, text) {
      var input = form.querySelector('[name="' + field + '"]');
      var err = doc.getElementById(input.id + '-err');
      if (text) { input.setAttribute('aria-invalid', 'true'); if (err) { err.textContent = text; input.setAttribute('aria-describedby', err.id); } }
      else { input.removeAttribute('aria-invalid'); if (err) err.textContent = ''; }
      return !text;
    }
    function validate() {
      var ok = true, first = null;
      Object.keys(rules).forEach(function (k) {
        var el = form.querySelector('[name="' + k + '"]');
        var good = setErr(k, rules[k](el.value));
        if (!good) { ok = false; first = first || el; }
      });
      var c = form.querySelector('[name="consent"]');
      if (!setErr('consent', c.checked ? '' : 'Necesitamos tu consentimiento para contactarte.')) { ok = false; first = first || c; }
      if (first) first.focus();
      return ok;
    }
    Object.keys(rules).forEach(function (k) {
      var el = form.querySelector('[name="' + k + '"]');
      el.addEventListener('blur', function () { if (el.value || el.getAttribute('aria-invalid')) setErr(k, rules[k](el.value)); });
    });

    function showError(text) {
      status.className = 'form__status is-error';
      status.innerHTML = '';
      status.appendChild(doc.createTextNode(text || 'No hemos podido enviar tu solicitud. Inténtalo de nuevo o escríbenos a '));
      if (!text) {
        var a = doc.createElement('a'); a.href = 'mailto:info@biziaconsulting.com'; a.textContent = 'info@biziaconsulting.com';
        status.appendChild(a); status.appendChild(doc.createTextNode('.'));
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = ''; status.className = 'form__status';
      if (!validate()) return;
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = typeof v === 'string' ? v : ''; });
      data.consent = true;
      form.classList.add('is-sending');
      var btn = form.querySelector('button[type="submit"]');
      btn.setAttribute('aria-disabled', 'true');
      fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok, j: j }; });
      }).then(function (res) {
        form.classList.remove('is-sending'); btn.removeAttribute('aria-disabled');
        if (res.ok) {
          store.del(CASE_KEY);
          if (window.gtag && readConsent() === 'granted') window.gtag('event', 'generate_lead', { form: 'conversacion_gratuita' });
          showSent(form, data);
        } else if (res.j && res.j.field) {
          setErr(res.j.field, res.j.error || 'Revisa este campo.');
        } else {
          showError();
        }
      }).catch(function () {
        form.classList.remove('is-sending'); btn.removeAttribute('aria-disabled');
        showError();
      });
    });
  }

  function showSent(form, data) {
    var box = doc.createElement('div');
    box.className = 'sent'; box.setAttribute('tabindex', '-1');
    box.innerHTML = '<div class="sent__icon"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></div><h3></h3><p></p>';
    var h = box.querySelector('h3'), p = box.querySelector('p');
    if (data) {
      h.textContent = 'Gracias, ' + data.nombre.trim().split(/\s+/)[0] + '.';
      p.textContent = 'Hemos recibido tu solicitud. Revisaremos la información de ' + (data.despacho.trim() || 'tu despacho') +
        ' y te escribiremos a ' + data.email.trim() + ' en menos de 24 h laborables para proponerte la conversación.';
    } else {
      h.textContent = 'Gracias.';
      p.textContent = 'Hemos recibido tu solicitud. Te escribiremos en menos de 24 h laborables para proponerte la conversación.';
    }
    form.innerHTML = '';
    form.appendChild(box);
    box.focus({ preventScroll: true });
  }
})();
