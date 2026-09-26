#!/usr/bin/env node
// Regression checks for the centred hero (from the multi-lens review).
//   node tools/hero-check.mjs [--base http://localhost:4600]
import { chromium } from 'playwright-core';

const argv = process.argv.slice(2);
const BASE = argv[argv.indexOf('--base') + 1] || 'http://localhost:4600';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
let fails = 0;
const ok = (name, pass, detail = '') => { if (!pass) fails++; console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
async function open(w, h, mobile = false, reduced = false) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  await ctx.addInitScript(() => {
    Element.prototype.requestPointerLock = function () {};
    try { localStorage.setItem('bizia-cookie-consent', 'denied'); } catch (e) {}
  });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await page.waitForTimeout(1200);
  return { ctx, page };
}
const measure = (page) => page.evaluate(() => {
  const t = document.querySelector('.hero__title');
  const lh = parseFloat(getComputedStyle(t).lineHeight) || parseFloat(getComputedStyle(t).fontSize);
  const c = document.querySelector('.hero__copy').getBoundingClientRect();
  const bar = document.querySelector('.bar__inner').getBoundingClientRect();
  const ghost = document.querySelector('.hero .btn--ghost');
  const acts = document.querySelector('.hero__actions').getBoundingClientRect();
  return {
    lines: Math.round(t.getBoundingClientRect().height / lh),
    gradRects: document.querySelector('.hero__title .grad').getClientRects().length,
    copyTop: Math.round(c.top), copyBottom: Math.round(c.bottom), barBottom: Math.round(bar.bottom),
    centreOffset: Math.round((c.left + c.width / 2) - innerWidth / 2),
    ghostVisible: getComputedStyle(ghost).display !== 'none',
    actionsWidth: Math.round(acts.width),
    overflow: document.documentElement.scrollWidth - innerWidth,
  };
});

// 1. headline stays on two lines and "a medida" never splits
for (const [w, h] of [[1280, 720], [1366, 768], [1440, 900], [1520, 855], [1536, 864], [1536, 730], [1600, 900], [1920, 1080], [1920, 900], [2560, 1440]]) {
  const { ctx, page } = await open(w, h);
  const m = await measure(page);
  ok(`${w}x${h} headline 2 lines, gradient phrase whole`, m.lines === 2 && m.gradRects === 1, `lines=${m.lines} gradRects=${m.gradRects}`);
  ok(`${w}x${h} copy clear of nav, centred, no overflow`, m.copyTop >= m.barBottom + 8 && Math.abs(m.centreOffset) <= 1 && m.overflow <= 0, `top=${m.copyTop} bar=${m.barBottom} off=${m.centreOffset}`);
  await ctx.close();
}
// 2. landscape phones and small screens clear the nav; CTAs where there is room
for (const [w, h, mob, ghostExpected] of [[915, 412, true, true], [896, 414, true, true], [932, 430, true, true], [844, 390, true, false], [740, 360, true, false], [360, 640, true, true], [375, 667, true, true], [390, 844, true, true], [768, 1024, true, true]]) {
  const { ctx, page } = await open(w, h, mob);
  const m = await measure(page);
  ok(`${w}x${h} copy clear of nav`, m.copyTop >= m.barBottom + 8 && m.copyBottom <= h, `top=${m.copyTop} bottom=${m.copyBottom} bar=${m.barBottom}`);
  ok(`${w}x${h} second CTA ${ghostExpected ? 'shown' : 'hidden (no room)'}`, m.ghostVisible === ghostExpected);
  if (w === 768) ok('768x1024 CTAs capped to the text measure', m.actionsWidth <= 400, `width=${m.actionsWidth}`);
  ok(`${w}x${h} no horizontal overflow`, m.overflow <= 0, String(m.overflow));
  await ctx.close();
}
// 3. the copy stays lit and leaves with the hero; nothing empty in between
for (const [w, h, mob, red] of [[1440, 900, false, false], [390, 844, true, false], [1440, 900, false, true]]) {
  const { ctx, page } = await open(w, h, mob, red);
  const samples = [];
  for (const f of [0, 0.3, 0.6, 0.7, 0.9, 1.2, 1.5]) {
    await page.evaluate((y) => scrollTo(0, y), f * h);
    await page.waitForTimeout(250);
    samples.push(await page.evaluate(() => {
      const c = document.querySelector('.hero__copy');
      const r = c.getBoundingClientRect();
      return { o: +parseFloat(getComputedStyle(c).opacity).toFixed(2), onScreen: r.bottom > 0 && r.top < innerHeight };
    }));
  }
  const bad = samples.filter((s) => s.onScreen && s.o < 0.99);
  ok(`${w}x${h}${red ? ' reduced' : ''} copy fully lit whenever on screen`, bad.length === 0, samples.map((s) => `${s.o}${s.onScreen ? '' : '(off)'}`).join(' '));
  // 4. keyboard focus coming back from below lands on a visible CTA
  await page.evaluate(() => scrollTo(0, 0));
  await page.focus('.offer a.link');
  await page.keyboard.press('Shift+Tab');
  await page.waitForTimeout(300);
  const f = await page.evaluate(() => {
    const a = document.activeElement; const r = a.getBoundingClientRect();
    const c = document.querySelector('.hero__copy');
    return { txt: (a.textContent || '').trim().slice(0, 24), inHero: !!a.closest('.hero__copy'), o: parseFloat(getComputedStyle(c).opacity), vis: r.top >= 0 && r.bottom <= innerHeight };
  });
  ok(`${w}x${h}${red ? ' reduced' : ''} Shift+Tab into hero lands on a visible CTA`, f.inHero && f.o > 0.99 && f.vis, JSON.stringify(f));
  await ctx.close();
}
await browser.close();
console.log(fails ? `\n${fails} FAILED` : '\nall hero checks passed');
process.exit(fails ? 1 : 0);
