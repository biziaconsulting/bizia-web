# BizIA Web 2.0

Nueva web de biziaconsulting.com: estática (HTML, CSS y JS), con una función de Vercel para el formulario.

## Estructura

```
web/                 ← carpeta que se publica (raíz del proyecto en Vercel)
  *.html             páginas generadas: NO se editan a mano
  css/ js/           estilos y scripts (scrollcraft.* es el motor: no se toca)
  api/audit.mjs      POST /api/audit → reenvía el formulario al webhook de n8n
  assets/ fonts/ vendor/
  vercel.json        URLs limpias, cabeceras de seguridad y CSP
src/pages/*.html     contenido de cada página (aquí se edita el texto)
src/data.mjs         textos compartidos: navegación, FAQ, pasos, dirección y datos estructurados
src/demo-data.mjs    los tres ejemplos ficticios de la demostración
tools/build.mjs      genera web/*.html, sitemap.xml, robots.txt y el manifest
tools/dev-server.mjs servidor local igual que Vercel, con un webhook de prueba
tools/verify.mjs     103 comprobaciones: enlaces, SEO, formulario, teclado, móvil
BRIEF.md             decisiones de diseño
```

## Trabajar en local

```bash
npm install
```

```bash
node tools/build.mjs
```

```bash
node tools/dev-server.mjs
```

Luego abre http://localhost:4600. En local, el formulario escribe en `lab/webhook-log.jsonl` en lugar de enviar a n8n.

## Publicar en Vercel

1. En el proyecto de Vercel donde está ahora biziaconsulting.com, configura:
   - Framework Preset: **Other**
   - Root Directory: **web**
   - Build Command: vacío
2. En Environment Variables, añade **`N8N_WEBHOOK_URL`** con la URL del webhook de n8n que usa hoy el formulario. La encontrarás en la configuración del proyecto actual. Opcionalmente, añade `N8N_WEBHOOK_SECRET`; se envía en la cabecera `X-Webhook-Secret`.
3. Despliega. Las URLs que ya existen no cambian: `/nosotros`, `/aviso-legal`, `/privacidad` y `/cookies`.

El payload que recibe n8n tiene los mismos campos que lee la plantilla de email actual: `nombre, despacho, email, telefono, empleados, software, mensaje, enviadoEn, origen`. También se añade `consentimiento`.

## Después de publicar (SEO y sitelinks)

- En Google Search Console, envía `https://biziaconsulting.com/sitemap.xml` y pide la indexación de `/`, `/soluciones`, `/preguntas-frecuentes`, `/contacto` y `/nosotros`.
- Revisa los datos estructurados en https://search.google.com/test/rich-results
- Google decide si muestra sitelinks. La web se lo pone fácil: páginas propias con títulos únicos, navegación coherente, breadcrumbs, sitemap y datos de organización.

## Pendiente

- Los textos legales siguen siendo plantillas con campos entre [corchetes] (NIF, domicilio, fechas). Están en `noindex` hasta que se completen.
- Cualquier cambio de texto se hace en `src/`, y después se ejecuta `node tools/build.mjs`.
