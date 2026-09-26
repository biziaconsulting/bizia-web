# BizIA Web 2.0

Nueva web de biziaconsulting.com: estática (HTML, CSS y JS), con una función de Vercel para el formulario.

## Estructura

```
web/                 ← carpeta que se publica (raíz del proyecto en Vercel)
  *.html             páginas generadas: NO se editan a mano
  css/ js/           estilos y scripts (scrollcraft.* es el motor: no se toca)
  api/audit.mjs      POST /api/audit → envía el formulario por email con Resend
  assets/ fonts/ vendor/
  vercel.json        URLs limpias, cabeceras de seguridad y CSP
src/pages/*.html     contenido de cada página (aquí se edita el texto)
src/data.mjs         textos compartidos: navegación, FAQ, pasos, dirección y datos estructurados
src/demo-data.mjs    los tres ejemplos ficticios de la demostración
tools/build.mjs      genera web/*.html, sitemap.xml, robots.txt y el manifest
tools/dev-server.mjs servidor local igual que Vercel, con un Resend simulado
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

Luego abre http://localhost:4600. En local, el formulario no envía emails: guarda lo que se mandaría a Resend en `lab/webhook-log.jsonl`.

## Publicar en Vercel

1. Importa el repo en Vercel. No hace falta tocar nada: el `vercel.json` de la raíz ya indica que se publica `web/`, sin instalación ni build (también funciona si pones Root Directory `web`).
2. Conecta Resend al proyecto desde **Vercel → Integrations (Marketplace) → Resend**. La integración crea la variable **`RESEND_API_KEY`**. También puedes crearla a mano con una API key de resend.com.
3. En Resend, verifica el dominio **biziaconsulting.com** (registros DNS). Sin dominio verificado, Resend no permite enviar desde `web@biziaconsulting.com`.
4. Opcional, en Environment Variables:
   - `CONTACT_TO_EMAIL`: a quién llega el formulario (por defecto `info@biziaconsulting.com`; admite varios separados por coma).
   - `CONTACT_FROM_EMAIL`: remitente (por defecto `BizIA Web <web@biziaconsulting.com>`).
5. Despliega. Las URLs que ya existen no cambian: `/nosotros`, `/aviso-legal`, `/privacidad` y `/cookies`.

Cada solicitud llega como un email con todos los campos del formulario, la fecha, la página de origen y un botón para responder. El «Responder» del email va directamente a la persona que escribió.

## Después de publicar (SEO y sitelinks)

- En Google Search Console, envía `https://biziaconsulting.com/sitemap.xml` y pide la indexación de `/`, `/soluciones`, `/preguntas-frecuentes`, `/contacto` y `/nosotros`.
- Revisa los datos estructurados en https://search.google.com/test/rich-results
- Google decide si muestra sitelinks. La web se lo pone fácil: páginas propias con títulos únicos, navegación coherente, breadcrumbs, sitemap y datos de organización.

## Pendiente

- Los textos legales siguen siendo plantillas con campos entre [corchetes] (NIF, domicilio, fechas). Están en `noindex` hasta que se completen.
- Cualquier cambio de texto se hace en `src/`, y después se ejecuta `node tools/build.mjs`.
