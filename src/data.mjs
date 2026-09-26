// Single source of truth for copy that appears on more than one page, and for
// the structured data. Copy is the live site's, corrected against the revised
// business plan (see BRIEF.md). No invented figures, prices or testimonials.

export const SITE = {
  url: 'https://biziaconsulting.com',
  name: 'BizIA',
  legalName: 'BizIA Consulting',
  email: 'info@biziaconsulting.com',
  linkedin: 'https://www.linkedin.com/company/bizia-consulting/',
  deusto: 'https://www.deusto.es/es/inicio/somos-deusto/centros-universitarios/otros-centros/deusto-emprende',
  ga: 'G-MCGLZXXY9X',
  cta: 'Reservar conversación gratuita',
  lastmod: '2026-09-26',
  address: {
    place: 'Universidad de Deusto (Campus San Sebastián)',
    street: 'Camino de Mundaiz, 50',
    postal: '20012',
    city: 'Donostia-San Sebastián',
    region: 'Gipuzkoa',
    country: 'ES',
    lat: 43.3094825,
    lng: -1.9756864,
  },
};

SITE.directions = `https://www.google.com/maps/dir/?api=1&destination=${SITE.address.lat},${SITE.address.lng}`;

// Navigation. `href` is a real URL (crawlable, sitelink-friendly). On the home
// page, `home` names the in-page section the tab scrolls to and tracks.
export const NAV = [
  { label: 'Soluciones', href: '/soluciones', home: '#soluciones' },
  { label: 'Ejemplos', href: '/soluciones#ejemplos', home: '#ejemplos' },
  { label: 'Cómo trabajamos', href: '/soluciones#como-trabajamos', home: '#como-trabajamos' },
  { label: 'Preguntas', href: '/preguntas-frecuentes', home: '#preguntas' },
  { label: 'Nosotros', href: '/nosotros' },
];

export const FAQ = [
  {
    q: '¿Es seguro? Manejamos datos fiscales muy sensibles.',
    a: 'Trabajamos en el entorno y con las cuentas de tu despacho, con permisos limitados a la tarea acordada. Antes de empezar documentamos dónde se ejecuta cada tarea y qué datos se transmiten, y en las demostraciones solo usamos ejemplos ficticios. Tu información no se copia a cuentas personales.',
  },
  {
    q: 'Ya tengo software (A3, Sage, Holded). ¿Esto lo sustituye?',
    a: 'No. Trabajamos sobre las herramientas y licencias que ya usas y comprobamos primero si permiten resolver el caso. Si hiciera falta algo más, te lo explicamos con sus costes antes de empezar.',
  },
  {
    q: '¿Es complicado de implantar? No tengo tiempo ni un equipo técnico.',
    a: 'Nos encargamos de la configuración, las pruebas y la formación. Solo necesitamos a una persona de tu equipo que participe y algunos ejemplos de la tarea. El plazo orientativo es de dos o tres semanas desde que tengamos los accesos.',
  },
  {
    q: '¿Y si la IA se equivoca en algo fiscal?',
    a: 'Por diseño, la IA propone y una persona de tu equipo revisa y aprueba. Las comunicaciones externas quedan como borradores y los criterios profesionales los define siempre tu despacho. BizIA no presta asesoramiento fiscal ni jurídico.',
  },
  {
    q: '¿Cuánto cuesta?',
    a: 'La primera conversación es gratuita. Si decides avanzar, la implantación es un proyecto con precio y alcance cerrados, y el acompañamiento mensual es opcional y sin permanencia. Te damos la cifra concreta en la propuesta, sin sorpresas.',
  },
  {
    q: '¿Cuándo se nota el retorno?',
    a: 'Lo medimos en lugar de prometerlo. Acordamos ejemplos de tu despacho, comparamos el tiempo total de la tarea incluida la revisión y comprobamos a los catorce días que tu equipo la sigue usando.',
  },
];

export const STEPS = [
  {
    n: '01', t: 'Conversación gratuita',
    d: '25 minutos para entender una tarea concreta de tu despacho y una demostración breve con ejemplos ficticios. Sin coste y sin compromiso.',
  },
  {
    n: '02', t: 'Implantación',
    d: 'Un proyecto con precio y alcance cerrados. Configuramos la solución en tu entorno, la probamos con ejemplos de tu despacho y formamos a tu equipo. Plazo orientativo: dos o tres semanas.',
  },
  {
    n: '03', t: 'Seguimiento',
    d: 'Revisamos el uso a los catorce días e incluimos 30 días de soporte para dudas y ajustes menores. Después, acompañamiento mensual opcional y sin permanencia.',
  },
];

export const REASONS = [
  { t: 'Centrados en asesorías y gestorías', d: 'Empezamos por despachos de Donostia-San Sebastián y trabajamos sobre las tareas, los documentos y los criterios de cada uno, no sobre ejemplos genéricos.' },
  { t: 'Con el software que ya usas', d: 'Antes de proponer nada comprobamos si tus licencias actuales resuelven el caso. Solo añadimos herramientas cuando mejoran el resultado.' },
  { t: 'Tu equipo, autónomo', d: 'Formamos a quienes van a usar la solución para que puedan repetir la tarea y sepan cuándo revisar o pedir ayuda.' },
  { t: 'La IA propone, las personas deciden', d: 'Todo lo que tiene efecto fiscal o legal pasa por una persona. Las comunicaciones externas quedan como borradores para revisión.' },
  { t: 'Datos en tu entorno', d: 'Usamos las cuentas de tu despacho con permisos limitados a cada tarea, documentamos qué datos se transmiten y nunca copiamos expedientes a cuentas personales.' },
  { t: 'Soporte incluido', d: '30 días de soporte tras la entrega y una revisión a los catorce días para comprobar que la solución se sigue usando.' },
];

export const TOOLS = ['ChatGPT', 'Claude', 'Codex', 'Claude Code', 'Grok Bot', 'n8n', 'Microsoft 365', 'Google Workspace'];

export const OTHER_TASKS = [
  { t: 'Propuestas de servicios', d: 'Borradores a partir de una ficha del cliente y de la tabla de precios que aprueba tu despacho.' },
  { t: 'Resúmenes de documentos', d: 'Con referencias a las páginas o los apartados utilizados, para revisarlos en segundos.' },
  { t: 'Manuales y listas de comprobación', d: 'A partir del procedimiento que nos explica el responsable, para trabajar igual cada vez.' },
];

// ---------------------------------------------------------------- icons ----
// Lucide-style strokes (ISC). Decorative unless a label is passed.
const P = {
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  pin: '<path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0v1M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
  nav: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
};
export function icon(name, cls = 'ic') {
  return `<svg class="${cls}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name]}</svg>`;
}

// -------------------------------------------------------- structured data --
export function orgNode() {
  const a = SITE.address;
  return {
    '@type': ['ProfessionalService', 'Organization'],
    '@id': `${SITE.url}/#organization`,
    name: SITE.legalName,
    alternateName: SITE.name,
    url: `${SITE.url}/`,
    logo: { '@type': 'ImageObject', url: `${SITE.url}/assets/icon-512.png`, width: 512, height: 512 },
    image: `${SITE.url}/assets/og-image.jpg`,
    email: SITE.email,
    description: 'Soluciones a medida con agentes de IA y formación aplicada para asesorías y gestorías de Donostia-San Sebastián.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${a.street} (${a.place})`,
      postalCode: a.postal,
      addressLocality: a.city,
      addressRegion: a.region,
      addressCountry: a.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: a.lat, longitude: a.lng },
    hasMap: SITE.directions,
    areaServed: [
      { '@type': 'City', name: 'Donostia-San Sebastián' },
      { '@type': 'AdministrativeArea', name: 'Gipuzkoa' },
    ],
    knowsLanguage: 'es',
    sameAs: [SITE.linkedin],
    makesOffer: [
      { '@type': 'Offer', itemOffered: { '@id': `${SITE.url}/soluciones#soluciones-a-medida` } },
      { '@type': 'Offer', itemOffered: { '@id': `${SITE.url}/soluciones#formacion` } },
    ],
  };
}
export function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: `${SITE.url}/`,
    name: SITE.name,
    alternateName: [SITE.legalName, 'BizIA Consulting Donostia'],
    inLanguage: 'es-ES',
    publisher: { '@id': `${SITE.url}/#organization` },
  };
}
export function serviceNodes() {
  const provider = { '@id': `${SITE.url}/#organization` };
  const area = { '@type': 'City', name: 'Donostia-San Sebastián' };
  return [
    {
      '@type': 'Service', '@id': `${SITE.url}/soluciones#soluciones-a-medida`,
      name: 'Soluciones a medida con agentes de IA',
      serviceType: 'Implantación de agentes de IA para asesorías y gestorías',
      description: 'Diseño e implantación de soluciones con agentes de IA para gestión documental, preparación de comunicaciones y organización del trabajo, adaptadas a los procedimientos del despacho.',
      provider, areaServed: area, url: `${SITE.url}/soluciones#soluciones-a-medida`,
    },
    {
      '@type': 'Service', '@id': `${SITE.url}/soluciones#formacion`,
      name: 'Formación aplicada al equipo',
      serviceType: 'Taller de IA aplicada para despachos',
      description: 'Taller para un grupo pequeño con ejercicios elegidos previamente y materiales preparados, para que cada participante pueda repetir una tarea con IA.',
      provider, areaServed: area, url: `${SITE.url}/soluciones#formacion`,
    },
  ];
}
export function faqNode(url) {
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
