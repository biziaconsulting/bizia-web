// POST /api/audit (Vercel Node function, ES module)
// Receives the "Reservar conversación gratuita" form and forwards it to the
// n8n webhook with the same field names the existing notification template
// reads (body.nombre, body.despacho, ... body.enviadoEn, body.origen).
//
// Env:
//   N8N_WEBHOOK_URL      required. The production webhook URL.
//   N8N_WEBHOOK_SECRET   optional. Sent as X-Webhook-Secret if set.
//
// Works with and without JavaScript: JSON in, JSON out for the page script;
// a urlencoded POST (no JS) gets a 303 back to the form with ?enviado=1 or
// ?error=1, so personal data never travels in a URL.

const FIELDS = ['nombre', 'despacho', 'email', 'telefono', 'empleados', 'software', 'mensaje'];
const MAX = { nombre: 120, despacho: 160, email: 160, telefono: 40, empleados: 20, software: 40, mensaje: 2000 };

function parseBody(req) {
  const b = req.body;
  if (b && typeof b === 'object') return b;
  if (typeof b === 'string' && b) {
    try { return JSON.parse(b); } catch (e) { return Object.fromEntries(new URLSearchParams(b)); }
  }
  return {};
}

export default async function handler(req, res) {
  const accept = String(req.headers['accept'] || '');
  const ctype = String(req.headers['content-type'] || '');
  const wantsJson = /json/.test(accept) || /json/.test(ctype);

  const b = parseBody(req);
  const origen = String(b.origen || 'biziaconsulting.com').slice(0, 120);
  const back = /\/contacto/.test(origen) ? '/contacto' : '/';

  const reply = (status, obj, flag) => {
    if (!wantsJson && flag) {
      res.statusCode = 303;
      res.setHeader('Location', `${back}?${flag}=1#contacto`);
      return res.end();
    }
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(JSON.stringify(obj));
  };

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(405, { ok: false, error: 'Método no permitido' });
  }

  // Bots: the hidden field is filled, or the form was sent faster than a
  // person can type. Answer as if accepted and forward nothing.
  const t0 = Number(b.t0);
  if (b.web || (t0 && Date.now() - t0 < 2500)) return reply(200, { ok: true }, 'enviado');

  const clean = {};
  for (const f of FIELDS) clean[f] = String(b[f] == null ? '' : b[f]).trim().slice(0, MAX[f]);

  if (clean.nombre.length < 2) return reply(400, { ok: false, field: 'nombre', error: 'Escribe tu nombre.' }, 'error');
  if (clean.despacho.length < 2) return reply(400, { ok: false, field: 'despacho', error: 'Escribe el nombre del despacho.' }, 'error');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean.email)) return reply(400, { ok: false, field: 'email', error: 'Escribe un email válido.' }, 'error');
  const consent = b.consent === true || /^(si|sí|on|true|1)$/i.test(String(b.consent || ''));
  if (!consent) return reply(400, { ok: false, field: 'consent', error: 'Necesitamos tu consentimiento para contactarte.' }, 'error');

  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    console.error('[audit] N8N_WEBHOOK_URL is not set');
    return reply(500, { ok: false, error: 'Formulario no configurado' }, 'error');
  }

  const payload = {
    ...clean,
    consentimiento: 'sí',
    enviadoEn: new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'short', timeStyle: 'short' }).format(new Date()),
    origen,
  };
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.N8N_WEBHOOK_SECRET) headers['X-Webhook-Secret'] = process.env.N8N_WEBHOOK_SECRET;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload), signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) {
      console.error('[audit] webhook answered', r.status);
      return reply(502, { ok: false, error: 'No se pudo registrar la solicitud' }, 'error');
    }
    return reply(200, { ok: true }, 'enviado');
  } catch (e) {
    clearTimeout(timer);
    console.error('[audit] webhook failed', e && e.name);
    return reply(502, { ok: false, error: 'No se pudo registrar la solicitud' }, 'error');
  }
}
