// Renders web/assets/og-image.jpg (1200x630) from real HTML: the desk from the
// first frame, the brand gradient, the logo. Needs the dev server on :4600.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const bg = fs.readFileSync('lab/og-bg.jpg').toString('base64');
const html = `<!doctype html><html><head><link rel="stylesheet" href="/css/site.css"><style>
body{margin:0;width:1200px;height:630px;overflow:hidden;background:#140E0B;font-family:Inter,sans-serif}
.bg{position:absolute;inset:0;background:url(data:image/jpeg;base64,${bg}) center/cover;transform:scale(1.04)}
.s{position:absolute;inset:0;background:radial-gradient(70% 90% at 0% 100%,rgba(150,34,20,.42),transparent 70%),linear-gradient(90deg,rgba(20,14,11,.95) 0%,rgba(20,14,11,.86) 40%,rgba(20,14,11,.35) 70%,rgba(20,14,11,.1) 100%)}
.c{position:absolute;left:72px;right:72px;bottom:70px}
.logo{position:absolute;left:72px;top:60px;background:#FBF1EB;border-radius:18px;padding:12px 18px}
.logo img{height:52px;display:block}
h1{margin:0 0 20px;font:620 84px/0.98 Sora,sans-serif;letter-spacing:-.045em;color:#FBF1EB}
p{margin:0;font:500 28px/1.35 Inter,sans-serif;color:#EADCD2}
</style></head><body><div class="bg"></div><div class="s"></div>
<div class="logo"><img src="/assets/logo.webp"></div>
<div class="c"><h1>IA hecha <span class="grad">a medida</span><br>de tus procesos.</h1><p>Agentes de IA para asesorías y gestorías · Donostia-San Sebastián</p></div>
</body></html>`;
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.route('http://og.local/', (r) => r.fulfill({ contentType: 'text/html', body: html }));
await p.goto('http://localhost:4600/404');
await p.setContent(html.replace('<head>', '<head><base href="http://localhost:4600/">'), { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: 'web/assets/og-image.jpg', type: 'jpeg', quality: 86 });
await b.close();
console.log('og-image.jpg written');
