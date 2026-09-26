#!/usr/bin/env node
// Local server that behaves like the Vercel deployment of web/:
//   - cleanUrls (/nosotros -> nosotros.html), 404.html for misses
//   - the "/(.*)" headers from web/vercel.json (so CSP problems show up here)
//   - POST /api/audit runs the real function in web/api/audit.mjs
//   - a mock Resend API at /__mock/resend that appends email payloads to
//     lab/webhook-log.jsonl (MOCK_FAIL=1 makes it answer 500)
//
//   node tools/dev-server.mjs [--port 4600]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB = path.join(ROOT, 'web');
const LAB = path.join(ROOT, 'lab');
const argv = process.argv.slice(2);
const PORT = parseInt(argv[argv.indexOf('--port') + 1] || process.env.PORT || '4600', 10) || 4600;

process.env.RESEND_API_URL = process.env.RESEND_API_URL || `http://localhost:${PORT}/__mock/resend`;
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_local_mock';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.mp4': 'video/mp4',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const vercel = JSON.parse(fs.readFileSync(path.join(WEB, 'vercel.json'), 'utf8'));
const globalHeaders = (vercel.headers.find((h) => h.source === '/(.*)') || { headers: [] }).headers
  .filter((h) => h.key !== 'Strict-Transport-Security')
  .map((h) => (h.key === 'Content-Security-Policy' ? { ...h, value: h.value.replace('; upgrade-insecure-requests', '') } : h));

function resolve(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0]);
  if (p.endsWith('/') && p !== '/') p = p.slice(0, -1);
  const cands = p === '/' ? ['index.html'] : [p.slice(1), `${p.slice(1)}.html`, path.join(p.slice(1), 'index.html')];
  for (const c of cands) {
    const f = path.join(WEB, c);
    if (!f.startsWith(WEB)) return null;
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  }
  return null;
}

function readBody(req) {
  return new Promise((ok) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => ok(Buffer.concat(chunks).toString('utf8')));
  });
}

http.createServer(async (req, res) => {
  const url = req.url;
  globalHeaders.forEach((h) => res.setHeader(h.key, h.value));

  if (url.startsWith('/__mock/resend')) {
    const raw = await readBody(req);
    fs.mkdirSync(LAB, { recursive: true });
    fs.appendFileSync(path.join(LAB, 'webhook-log.jsonl'), raw + '\n');
    if (process.env.MOCK_FAIL === '1') { res.statusCode = 500; return res.end('mock failure'); }
    res.setHeader('Content-Type', 'application/json');
    return res.end('{"id":"mock"}');
  }

  if (url.split('?')[0] === '/api/audit') {
    const raw = await readBody(req);
    const ct = String(req.headers['content-type'] || '');
    try { req.body = /json/.test(ct) ? JSON.parse(raw || '{}') : Object.fromEntries(new URLSearchParams(raw)); }
    catch (e) { req.body = raw; }
    const mod = await import(pathToFileURL(path.join(WEB, 'api', 'audit.mjs')).href + '?t=' + Date.now());
    return mod.default(req, res);
  }

  const file = resolve(url);
  if (!file) {
    res.statusCode = 404;
    res.setHeader('Content-Type', TYPES['.html']);
    return fs.createReadStream(path.join(WEB, '404.html')).pipe(res);
  }
  const stat = fs.statSync(file);
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Content-Length': stat.size,
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`BizIA dev: http://localhost:${PORT}  (email -> ${process.env.RESEND_API_URL})`);
});
