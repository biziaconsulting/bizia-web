// POST /api/audit (Vercel Node function, ES module)
// Receives the "Reservar conversación gratuita" form and emails it through
// Resend (https://resend.com), e.g. via the Vercel Marketplace integration.
//
// Env:
//   RESEND_API_KEY       required. Set automatically by the Vercel + Resend integration.
//   CONTACT_TO_EMAIL     optional. Recipient(s), comma-separated. Default info@biziaconsulting.com.
//   CONTACT_FROM_EMAIL   optional. Sender on a domain verified in Resend.
//                        Default "BizIA Web <web@biziaconsulting.com>".
//
// Works with and without JavaScript: JSON in, JSON out for the page script;
// a urlencoded POST (no JS) gets a 303 back to the form with ?enviado=1 or
// ?error=1, so personal data never travels in a URL.

const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[audit] RESEND_API_KEY is not set');
    return reply(500, { ok: false, error: 'Formulario no configurado' }, 'error');
  }
  const to = (process.env.CONTACT_TO_EMAIL || 'info@biziaconsulting.com').split(',').map((s) => s.trim()).filter(Boolean);
  const from = process.env.CONTACT_FROM_EMAIL || 'BizIA Web <web@biziaconsulting.com>';
  const enviadoEn = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'short', timeStyle: 'short' }).format(new Date());

  const rows = [
    ['Nombre', clean.nombre], ['Despacho', clean.despacho], ['Email', clean.email],
    ['Teléfono', clean.telefono || '(no indicado)'], ['Nº de empleados', clean.empleados || '(no indicado)'],
    ['Software principal', clean.software || '(no indicado)'], ['¿Qué le quita más tiempo?', clean.mensaje || '(no indicado)'],
    ['Consentimiento', 'Sí'], ['Enviado', enviadoEn], ['Origen', origen],
  ];
  const html = `<!doctype html><html lang="es"><body style="margin:0;padding:24px;background:#FBF1EB;font-family:Arial,Helvetica,sans-serif;color:#1C1C1C">
<table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #EADBD2">
<tr><td style="padding:20px 28px;background:#B3301E;color:#FFF8F4;font-size:14px;letter-spacing:.08em;text-transform:uppercase;font-weight:bold">Nueva solicitud de conversación gratuita</td></tr>
<tr><td style="padding:24px 28px"><h2 style="margin:0 0 20px;font-size:20px">${esc(clean.despacho)}</h2>
<table role="presentation" width="100%" style="font-size:15px;line-height:1.5">
${rows.map(([k, v]) => `<tr><td style="padding:8px 12px 8px 0;color:#5E4A42;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:8px 0;vertical-align:top">${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('')}
</table>
<p style="margin:24px 0 0"><a href="mailto:${esc(clean.email)}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#B3301E;color:#fff;text-decoration:none;font-weight:bold">Responder a ${esc(clean.nombre)}</a></p>
</td></tr></table></body></html>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(process.env.RESEND_API_URL || 'https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from, to, reply_to: clean.email,
        subject: `Nueva solicitud de conversación gratuita: ${clean.despacho} (${clean.nombre})`,
        html, text,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!r.ok) {
      console.error('[audit] Resend answered', r.status, (await r.text().catch(() => '')).slice(0, 300));
      return reply(502, { ok: false, error: 'No se pudo enviar la solicitud' }, 'error');
    }
    return reply(200, { ok: true }, 'enviado');
  } catch (e) {
    clearTimeout(timer);
    console.error('[audit] Resend request failed', e && e.name);
    return reply(502, { ok: false, error: 'No se pudo enviar la solicitud' }, 'error');
  }
}
