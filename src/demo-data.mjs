// The three worked examples from the revised business plan, rendered with
// FICTIONAL data. The page labels them as such. Each case is four sheets:
// input, prepared, pending, output. Line shapes:
//   { t }            a line of text        { t, mark }  a highlighted fragment
//   { k, v }         a labelled field      { c }        a checklist item
export const CASES = [
  {
    id: 'reuniones',
    tab: 'Reuniones',
    carry: 'Me interesa el ejemplo «Reuniones»: notas de la reunión, resumen, información pendiente y borrador de correo.',
    sheets: [
      {
        kind: 'Entrada', title: 'Notas de la reunión',
        lines: [
          { t: 'Reunión con Ferretería Ejemplo, S.L. (Ana)' },
          { t: 'quieren pasar a cuota trimestral', mark: true },
          { t: 'falta el contrato de alquiler del local', mark: true },
          { t: 'entra un empleado nuevo el día 1', mark: true },
          { t: 'llamar antes del viernes', dim: true },
        ],
      },
      {
        kind: 'Preparado', title: 'Resumen estructurado',
        lines: [
          { k: 'Cliente', v: 'Ferretería Ejemplo, S.L.' },
          { k: 'Asunto', v: 'Cambio a cuota trimestral' },
          { k: 'Novedad', v: 'Alta de un empleado' },
          { k: 'Plazo', v: 'Antes del viernes' },
        ],
      },
      {
        kind: 'Pendiente', title: 'Información que falta',
        lines: [
          { c: 'Contrato de alquiler del local' },
          { c: 'Datos del nuevo empleado' },
          { c: 'Confirmar la fecha de alta' },
        ],
      },
      {
        kind: 'Salida', title: 'Borrador de correo',
        lines: [
          { t: 'Hola, Ana:' },
          { t: 'Gracias por la reunión de hoy. Para preparar el cambio a cuota trimestral necesitamos:' },
          { t: '· El contrato de alquiler del local.' },
          { t: '· Los datos del nuevo empleado.' },
          { t: 'Un saludo.' },
        ],
        stamp: 'Borrador · revisar antes de enviar',
      },
    ],
  },
  {
    id: 'cliente-nuevo',
    tab: 'Cliente nuevo',
    carry: 'Me interesa el ejemplo «Cliente nuevo»: ficha del cliente, propuesta de bienvenida, documentación necesaria y borradores de solicitud.',
    sheets: [
      {
        kind: 'Entrada', title: 'Ficha del cliente',
        lines: [
          { k: 'Nombre', v: 'Estudio Ejemplo (Mikel)' },
          { k: 'Actividad', v: 'Diseño gráfico' },
          { k: 'Servicios', v: 'Fiscal y contable' },
          { k: 'Alta', v: 'Este mes' },
        ],
      },
      {
        kind: 'Preparado', title: 'Propuesta de bienvenida',
        lines: [
          { t: 'Bienvenida al despacho', mark: true },
          { t: 'Servicios acordados: fiscal y contable' },
          { t: 'Persona de contacto en el despacho' },
          { t: 'Próximos pasos y calendario' },
        ],
      },
      {
        kind: 'Pendiente', title: 'Documentación necesaria',
        lines: [
          { c: 'Copia del DNI' },
          { c: 'Certificado de situación censal' },
          { c: 'Datos bancarios para domiciliar' },
        ],
      },
      {
        kind: 'Salida', title: 'Borrador de solicitud',
        lines: [
          { t: 'Hola, Mikel:' },
          { t: 'Para completar tu alta, según nuestro procedimiento, necesitamos:' },
          { t: '· Copia del DNI.' },
          { t: '· Certificado de situación censal.' },
          { t: 'Puedes enviarlos respondiendo a este correo.' },
        ],
        stamp: 'Borrador · revisar antes de enviar',
      },
    ],
  },
  {
    id: 'documentacion',
    tab: 'Documentación pendiente',
    carry: 'Me interesa el ejemplo «Documentación pendiente»: tabla de seguimiento, solicitudes, borradores por cliente y resumen para el responsable.',
    sheets: [
      {
        kind: 'Entrada', title: 'Tabla de seguimiento',
        lines: [
          { k: 'Cliente Ejemplo A', v: 'Facturas: pendiente' },
          { k: 'Cliente Ejemplo B', v: 'Extractos: recibido' },
          { k: 'Cliente Ejemplo C', v: 'Contrato: pendiente' },
          { k: 'Cliente Ejemplo D', v: 'Justificantes: pendiente' },
          { k: 'Cliente Ejemplo E', v: 'Sin email', },
        ],
      },
      {
        kind: 'Preparado', title: 'Solicitudes necesarias',
        lines: [
          { t: 'A: facturas del trimestre', mark: true },
          { t: 'C: contrato de préstamo', mark: true },
          { t: 'D: justificantes de gastos', mark: true },
          { t: 'B: nada pendiente', dim: true },
        ],
      },
      {
        kind: 'Pendiente', title: 'Borradores por cliente',
        lines: [
          { c: 'A: «Hola, necesitamos las facturas…»' },
          { c: 'C: «Hola, nos falta el contrato…»' },
          { c: 'D: «Hola, ¿nos envías los justificantes…»' },
        ],
        stamp: 'Borradores · revisar antes de enviar',
      },
      {
        kind: 'Aviso', title: 'Resumen para el responsable',
        lines: [
          { k: 'Por revisar', v: '3 borradores' },
          { k: 'Al día', v: '1 cliente' },
          { k: 'Incompleto', v: 'Cliente E sin email' },
          { t: 'La fila incompleta se señala y no se inventa ningún dato.', dim: true },
        ],
      },
    ],
  },
];
