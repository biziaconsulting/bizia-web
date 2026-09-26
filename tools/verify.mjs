#!/usr/bin/env node
// Functional checks against the dev server (node tools/dev-server.mjs).
//   node tools/verify.mjs [--base http://localhost:4600]
// Crawls every internal link, checks SEO tags and JSON-LD on each page,
// exercises the form (validation, success with the mock webhook, no-JS POST),
// the demo-to-form carry, the menu, and keyboard focus order.
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const argv = process.argv.slice(2);
const BASE = argv[argv.indexOf('--base') + 1] || 'http://localhost:4600';
const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { Element.prototype.requestPointerLock = function () {}; });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

// ------------------------------------------------------------ crawl + SEO --
const PAGES = ['/', '/soluciones', '/preguntas-frecuentes', '/contacto', '/nosotros', '/aviso-legal', '/privacidad', '/cookies'];
const links = new Set();
const titles = new Set(), descs = new Set();
for (const p of PAGES) {
  const res = await page.goto(BASE + p, { waitUntil: 'domcontentloaded' });
  ok(`status ${p}`, res.status() === 200, String(res.status()));
  const info = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent);
    return {
      title: document.title, desc: q('meta[name=description]')?.content, canonical: q('link[rel=canonical]')?.href,
      ogUrl: q('meta[property="og:url"]')?.content, ogImg: q('meta[property="og:image"]')?.content, robots: q('meta[name=robots]')?.content,
      h1: document.querySelectorAll('h1').length, lang: document.documentElement.lang, ld,
      links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
      imgsNoAlt: [...document.querySelectorAll('img:not([alt])')].length,
      emDash: /\u2014/.test(document.body.innerText),
    };
  });
  info.links.forEach((l) => links.add(l));
  ok(`one h1 ${p}`, info.h1 === 1, `h1=${info.h1}`);
  ok(`lang es ${p}`, info.lang === 'es');
  ok(`title/desc ${p}`, !!info.title && !!info.desc && info.desc.length >= 70 && info.desc.length <= 170, `${info.title.length}c / ${info.desc?.length}c`);
  ok(`canonical ${p}`, info.canonical === `https://www.biziaconsulting.com${p === '/' ? '/' : p}` && info.ogUrl === info.canonical, info.canonical);
  ok(`no em dash ${p}`, !info.emDash);
  ok(`img alt ${p}`, info.imgsNoAlt === 0);
  titles.add(info.title); descs.add(info.desc);
  let ldOk = true, types = [];
  try { info.ld.forEach((t) => { const j = JSON.parse(t); (j['@graph'] || [j]).forEach((n) => types.push([].concat(n['@type']).join('/'))); }); } catch (e) { ldOk = false; }
  ok(`json-ld ${p}`, ldOk && types.length > 0, types.join(', '));
}
ok('unique titles', titles.size === PAGES.length);
ok('unique descriptions', descs.size === PAGES.length);

// internal links resolve (anchors included)
const internal = [...links].filter((l) => l.startsWith('/') || l.startsWith('#'));
for (const l of internal) {
  if (l.startsWith('#')) continue;
  const [path, hash] = l.split('#');
  const r = await page.request.get(BASE + path);
  let anchorOk = true;
  if (hash) {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    anchorOk = await page.evaluate((h) => !!document.getElementById(h), hash);
  }
  ok(`link ${l}`, r.status() === 200 && anchorOk, `${r.status()}${hash && !anchorOk ? ' missing #' + hash : ''}`);
}
for (const f of ['/robots.txt', '/sitemap.xml', '/site.webmanifest', '/favicon.ico', '/assets/og-image.jpg', '/assets/icon-512.png']) {
  const r = await page.request.get(BASE + f);
  ok(`asset ${f}`, r.status() === 200, String(r.status()));
}
const sm = await (await page.request.get(BASE + '/sitemap.xml')).text();
ok('sitemap lists 5 indexable pages', (sm.match(/<loc>/g) || []).length === 5);
const nf = await page.request.get(BASE + '/esto-no-existe');
ok('404 status for unknown path', nf.status() === 404);

// ------------------------------------------------------------------ form --
const log = 'lab/webhook-log.jsonl';
const before = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).length : 0;
await page.goto(BASE + '/contacto', { waitUntil: 'networkidle' });
await page.click('.form button[type=submit]');
const errs = await page.$$eval('.field__err', (els) => els.map((e) => e.textContent).filter(Boolean));
ok('empty submit shows field errors', errs.length >= 4, errs.join(' | '));
ok('focus moves to first invalid field', await page.evaluate(() => document.activeElement?.id === 'f-nombre'));
await page.fill('#f-nombre', 'Prueba Verificación');
await page.fill('#f-despacho', 'Despacho de Prueba');
await page.fill('#f-email', 'prueba@example.com');
await page.selectOption('#f-empleados', '3–10');
await page.selectOption('#f-software', 'Holded');
await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
await page.$eval('#f-consent', (el) => { if (!el.checked) el.click(); });
ok('consent checkbox toggles', await page.$eval('#f-consent', (el) => el.checked));
await page.waitForTimeout(2700); // the API ignores forms sent faster than a person types
await page.click('.form button[type=submit]');
await page.waitForSelector('.sent', { timeout: 8000 }).catch(() => {});
const sentText = await page.$eval('.form', (f) => f.innerText).catch(() => '');
ok('JS submit shows success', /Gracias, Prueba/.test(sentText), sentText.slice(0, 80).replace(/\n/g, ' '));
const after = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean) : [];
const last = after.length > before ? JSON.parse(after[after.length - 1]) : null;
ok('Resend received the email', !!last && last.reply_to === 'prueba@example.com' && /Despacho de Prueba/.test(last.subject) && /Prueba Verificaci/.test(last.html) && /biziaconsulting\.com\/contacto/.test(last.text) && Array.isArray(last.to),
  last ? Object.keys(last).join(',') : 'nothing');

// no-JS POST: 303 back to the page, never personal data in the URL
const nojs = await page.request.post(BASE + '/api/audit', {
  form: { nombre: 'Sin JS', despacho: 'Despacho X', email: 'x@example.com', consent: 'si', origen: 'biziaconsulting.com/contacto' },
  maxRedirects: 0,
});
const loc = nojs.headers()['location'] || '';
ok('no-JS POST redirects 303 without personal data', nojs.status() === 303 && loc === '/contacto?enviado=1#contacto' && !/x@example|Sin/.test(loc), `${nojs.status()} ${loc}`);
const bad = await page.request.post(BASE + '/api/audit', { data: { nombre: 'A', despacho: '', email: 'no', consent: true } });
ok('API rejects invalid input with 400', bad.status() === 400);
const get = await page.request.get(BASE + '/api/audit');
ok('API rejects GET with 405', get.status() === 405);

// --------------------------------------------------- demo carries to form --
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.removeItem('bizia-demo-case'));
await page.evaluate(() => document.getElementById('ejemplos').scrollIntoView());
await page.waitForTimeout(400);
await page.click('#case-documentacion');
await page.waitForTimeout(200);
const boardTitle = await page.$eval('.dsheet--0 .dsheet__title', (e) => e.textContent);
ok('tab switches the board', boardTitle === 'Tabla de seguimiento', boardTitle);
const msg = await page.$eval('#f-mensaje', (e) => e.value);
ok('chosen example carries into the form', /Documentación pendiente/.test(msg), msg.slice(0, 60));
await page.keyboard.press('ArrowLeft');
const sel = await page.$eval('.case[aria-selected="true"]', (e) => e.id);
ok('tabs follow arrow keys', sel === 'case-cliente-nuevo', sel);

// ------------------------------------------------------------ keyboard ---
await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
const order = [];
for (let i = 0; i < 12; i++) {
  await page.keyboard.press('Tab');
  order.push(await page.evaluate(() => {
    const a = document.activeElement; const cs = getComputedStyle(a);
    return `${a.tagName.toLowerCase()}:${(a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 24)}|${cs.outlineStyle !== 'none' ? 'ring' : 'no-ring'}`;
  }));
}
ok('first tab stop is the skip link', order[0].startsWith('a:Saltar al contenido'), order[0]);
ok('focus rings visible', order.every((o) => o.endsWith('ring')), order.join(' > '));

// --------------------------------------------------------------- menu ---
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mp = await m.newPage();
await mp.goto(BASE + '/nosotros', { waitUntil: 'domcontentloaded' });
await mp.click('.bar__menu');
const open = await mp.$eval('#menu', (e) => !e.hidden);
await mp.keyboard.press('Escape');
const closed = await mp.$eval('#menu', (e) => e.hidden);
ok('mobile menu opens and closes with Escape', open && closed);
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - innerWidth);
ok('no horizontal overflow at 390px', overflow <= 0, String(overflow));
await m.close();

ok('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));
await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
fs.writeFileSync('lab/verify.json', JSON.stringify(results, null, 2));
process.exit(failed.length ? 1 : 0);
