#!/usr/bin/env node
// Targeted screenshots for verification.
//   node tools/snap.mjs --url http://localhost:4600/ --out lab/snap --w 1440 --h 900 \
//     --at "top; .hero@0.5; .demo@0.3; #contacto" [--mouse 0.9,0.2] [--reduced] [--dsf 1]
// A target is "y:1234", "top", "bottom", or "<selector>[@fraction]" where the
// fraction is progress through the element's pinned travel (height - vh).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i > -1 && argv[i + 1] ? argv[i + 1] : d; };
const URL = arg('--url', 'http://localhost:4600/');
const OUT = path.resolve(arg('--out', 'lab/snap'));
const W = +arg('--w', 1440), H = +arg('--h', 900), DSF = +arg('--dsf', 1);
const AT = arg('--at', 'top').split(';').map((s) => s.trim()).filter(Boolean);
const MOUSE = arg('--mouse', null);
const REDUCED = argv.includes('--reduced');
const MOBILE = argv.includes('--mobile');
const PREFIX = arg('--prefix', '');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const ctx = await browser.newContext({
  viewport: { width: W, height: H }, deviceScaleFactor: DSF,
  reducedMotion: REDUCED ? 'reduce' : 'no-preference',
  isMobile: MOBILE, hasTouch: MOBILE,
  userAgent: MOBILE ? 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36' : undefined,
});
await ctx.addInitScript(() => {
  Element.prototype.requestPointerLock = function () {};
  Element.prototype.setPointerCapture = function () {};
  try { localStorage.setItem('bizia-cookie-consent', 'denied'); } catch (e) {}
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
page.on('requestfailed', (r) => errors.push('failed: ' + r.url() + ' ' + (r.failure() || {}).errorText));
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

for (let i = 0; i < AT.length; i++) {
  const t = AT[i];
  const y = await page.evaluate((t) => {
    const vh = innerHeight;
    if (t === 'top') return 0;
    if (t === 'bottom') return document.documentElement.scrollHeight;
    if (t.startsWith('y:')) return parseFloat(t.slice(2));
    const [sel, frac] = t.split('@');
    const el = document.querySelector(sel);
    if (!el) return -1;
    const top = el.getBoundingClientRect().top + scrollY;
    return top + Math.max(el.offsetHeight - vh, 0) * (frac ? parseFloat(frac) : 0);
  }, t);
  if (y < 0) { console.log('missing', t); continue; }
  // walk there so scroll-driven state updates like a reader's would
  const from = await page.evaluate(() => scrollY);
  const steps = 12;
  for (let s = 1; s <= steps; s++) {
    await page.evaluate((yy) => scrollTo(0, yy), from + (y - from) * (s / steps));
    await page.waitForTimeout(40);
  }
  if (MOUSE) {
    const [mx, my] = MOUSE.split(',').map(Number);
    await page.mouse.move(W / 2, H / 2);
    await page.mouse.move(W * mx, H * my, { steps: 12 });
  }
  await page.waitForTimeout(+arg('--wait', 1300));
  const name = `${PREFIX}${String(i).padStart(2, '0')}-${t.replace(/[^a-z0-9@.]+/gi, '_')}.png`;
  await page.screenshot({ path: path.join(OUT, name) });
  console.log('shot', name, 'y=', Math.round(y));
}
if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].join('\n'));
await browser.close();
