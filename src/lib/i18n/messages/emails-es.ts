import type { emails } from "@/lib/i18n/messages/emails-en";
import type { DeepString } from "@/lib/i18n/messages/types";

export const emailsEs: DeepString<typeof emails> = {
  chrome: {
    pasteLink: "¿No funciona el botón? Pega este enlace en tu navegador:",
    stop: "Dejar de recibir estos emails",
    tagline: "Las marcas encuentran a los creadores adecuados.",
    imprint: "Aviso legal",
    privacy: "Privacidad",
    numberLocale: "es-ES",
  },
  welcome: {
    subject: "Te damos la bienvenida a comtor: verifica tu email",
    preview: "Gracias por registrarte. Un toque y tu email queda verificado.",
    heading: "Te damos la bienvenida a comtor.",
    bodyCreator: "Gracias por registrarte. Verifica tu email y desliza deals de marcas, con el presupuesto en la propia tarjeta.",
    bodyBrand: "Gracias por registrarte. Verifica tu email y publica tu primera solicitud. Los creadores vendrán a ti.",
    foundingCreator:
      "Eres el creador fundador n.º {number}. Pro es gratis para ti mientras exista tu cuenta. comtor se queda el {pro} % de cada pago en lugar del {standard} %, y tú te quedas el {keep} %.",
    foundingBrand:
      "Eres la marca fundadora n.º {number}. Pro es gratis para ti mientras exista tu cuenta. comtor se queda el {pro} % de cada pago en lugar del {standard} %.",
    action: "Verificar email",
    note: "El enlace funciona durante 24 horas. ¿No te registraste en comtor? Entonces puedes ignorar este email.",
  },
  foundingNotice: {
    subject: "Pro es gratis para ti, para siempre",
    previewCreator: "Eres uno de los primeros creadores de comtor.",
    previewBrand: "Eres una de las primeras marcas de comtor.",
    heading: "Tienes Pro, para siempre.",
    bodyCreator:
      "Eres uno de los primeros {limit} creadores de comtor (creador fundador n.º {number}). Por eso Pro es gratis para ti mientras exista tu cuenta. comtor se queda el {pro} % de cada pago en lugar del {standard} %, y tú te quedas el {keep} %. No tienes que hacer nada.",
    bodyBrand:
      "Eres una de las primeras {limit} marcas de comtor (marca fundadora n.º {number}). Por eso Pro es gratis para ti mientras exista tu cuenta. comtor se queda el {pro} % de cada pago en lugar del {standard} %. No tienes que hacer nada.",
    subscription: "Tu suscripción Pro anterior sigue activa y se sigue cobrando. Puedes cancelarla en Ajustes y conservar Pro.",
    action: "Ver tu plan",
    note: "Recibes este email porque tienes una cuenta de comtor. Trata de tu plan y no es publicidad.",
  },
  marketingWelcome: {
    note: "Recibes este email porque aceptaste recibir novedades de comtor. Puedes darte de baja cuando quieras con el enlace de abajo.",
    noteWithReason:
      "Recibes este email porque aceptaste recibir novedades de comtor ({reason}). Puedes darte de baja cuando quieras con el enlace de abajo.",
    hint: "Échale un vistazo primero. El registro está en la página.",
    creator: {
      preview: "Gana dinero publicando en redes sociales.",
      heading: "Gana dinero publicando en redes sociales.",
      headingNamed: "{name}, gana dinero publicando en redes sociales.",
      body: "En comtor las marcas publican un deal de pago y tú deslizas los que quieres. El presupuesto está en la tarjeta. La marca paga antes de que publiques y tú te quedas el {keep} %.",
      steps: {
        swipe: {
          title: "Desliza un deal.",
          text: "A la derecha, lo quieres. A la izquierda, pasas. La marca ve tu perfil y puede escribirte.",
        },
        budget: {
          title: "El presupuesto está en la tarjeta.",
          text: "Se acabaron los DMs sobre tu tarifa. Cada solicitud indica cuánto paga, qué publicar y si incluye el producto.",
        },
        paid: {
          title: "Pagado antes de publicar.",
          text: "Aceptas la oferta y la marca paga primero. El dinero queda retenido hasta que tu publicación esté en línea.",
        },
        keep: {
          title: "Te quedas el {keep} %.",
          text: "La marca tiene {days} días para aprobar tu publicación. Si no responde, el dinero es tuyo igualmente. Con Pro ({price} € al mes) te quedas el {proKeep} %.",
        },
      },
      crowdOne: "marca ya está aquí",
      crowdMany: "marcas ya están aquí",
      action: "Ver deals de pago",
    },
    brand: {
      preview: "Haz crecer tu marca con creadores de contenido.",
      heading: "Haz crecer tu marca con creadores de contenido.",
      headingNamed: "{name}, haz crecer tu marca con creadores de contenido.",
      body: "En comtor publicas el producto, el presupuesto y qué crear. Los creadores que encajan deslizan a la derecha y vienen a ti. Pagas cuando os ponéis de acuerdo. El dinero queda retenido hasta que la publicación esté en línea.",
      steps: {
        post: {
          title: "Publica el producto y el presupuesto.",
          text: "Fotos, presupuesto, plataforma y qué publicar. Los creadores lo ven como una tarjeta en su feed.",
        },
        come: {
          title: "Los creadores vienen a ti.",
          text: "Creadores de tu nicho deslizan a la derecha. Ves su alcance y sus reseñas y eliges a quien encaja.",
        },
        chat: {
          title: "Acordadlo en el chat.",
          text: "Envía una oferta. Cuando la acepten, pagas y el dinero queda retenido hasta que la publicación esté en línea.",
        },
        paidOut: {
          title: "Entonces se paga.",
          text: "Primero revisas la publicación en línea. Sin cuota base: comtor se queda el {fee} % de cada pago, o el {proFee} % con Pro ({price} € al mes).",
        },
      },
      crowdOne: "creador ya está aquí",
      crowdMany: "creadores ya están aquí",
      action: "Publica tu primer deal",
    },
  },
  verification: {
    subject: "Verifica tu email de comtor",
    preview: "Confirma que es tu dirección. El enlace funciona durante 24 horas.",
    heading: "Verifica tu email.",
    body: "Confirma que esta dirección pertenece a tu cuenta de comtor.",
    action: "Verificar email",
    note: "El enlace funciona durante 24 horas. ¿No te registraste en comtor? Entonces puedes ignorar este email.",
  },
  passwordReset: {
    subject: "Restablece tu contraseña de comtor",
    preview: "Elige una contraseña nueva. El enlace funciona durante 1 hora.",
    heading: "Restablece tu contraseña.",
    body: "Alguien pidió restablecer tu contraseña de comtor. Si fuiste tú, elige una nueva.",
    action: "Elegir una contraseña nueva",
    note: "El enlace funciona una vez y durante 1 hora. Una contraseña nueva cierra tu sesión en todas partes. ¿No lo pediste tú? Ignora este email y tu contraseña seguirá igual.",
  },
  passwordChanged: {
    subject: "Se cambió tu contraseña de comtor",
    preview: "Si fuiste tú, no tienes que hacer nada.",
    heading: "Se cambió tu contraseña.",
    body: "Acabamos de cambiar tu contraseña de comtor y cerramos la sesión en tus otros dispositivos. Si fuiste tú, no tienes que hacer nada.",
    action: "Restablecer contraseña",
    note: "¿No fuiste tú? Restablece tu contraseña ahora mismo. Así se cierra la sesión de quien la cambió.",
  },
  accountSuspended: {
    subject: "Se suspendió tu cuenta de comtor",
    preview: "Aquí tienes el motivo y cómo recurrir.",
    heading: "Se suspendió tu cuenta.",
    body: "Hemos suspendido tu cuenta de comtor. Motivo: {reason} Mientras esté suspendida, no puedes iniciar sesión. Cerramos las solicitudes abiertas de una cuenta de marca.",
    action: "Recurrir esta decisión",
    objectSubject: "Cuenta suspendida",
    note: "Si crees que es un error, responde a este email o escribe a info@comtor.app. Lo revisaremos de nuevo y te responderemos.",
  },
  test: {
    subject: "Email de prueba de comtor",
    preview: "Si puedes leer esto, el email de comtor funciona.",
    heading: "Funciona.",
    body: "Este es un email de prueba del área de administración. Si está en tu bandeja de entrada, los emails de registro, verificación y contraseña también llegan.",
    action: "Abrir comtor",
    note: "Enviado por un administrador desde /admin/email. No tienes que hacer nada.",
  },
  marketingConsent: {
    subject: "Confirma las novedades de comtor",
    preview: "Un botón y podremos enviarte novedades ocasionales sobre comtor.",
    heading: "Confirma las novedades del producto.",
    body: "Pediste recibir emails ocasionales sobre comtor. Pulsa el botón de la página siguiente para confirmarlo. Hasta entonces, esta dirección no recibe novedades del producto.",
    action: "Revisar y confirmar",
    note: "¿No lo pediste? Ignora el email. No se activa nada hasta que pulses el botón.",
  },
  waitlistConfirmation: {
    subject: "Confirma tu plaza en la lista de espera de comtor",
    preview: "Un toque y te avisamos el día que salgan las apps.",
    heading: "Confirma tu email.",
    body: "Pediste que te avisáramos cuando las apps de comtor salgan en iOS y Android. Confirma que esta dirección es tuya y entrarás en la lista.",
    action: "Confirmar email",
    note: "Te enviaremos un solo email, el día que salgan las apps. ¿No te apuntaste? Ignora este email y no sabrás nada más de nosotros.",
  },
  // A deal notice and the documents of a deal (src/lib/deals/notices.ts, billing). {number}: document number, {title}: request title, {replaces}: the cancelled document.
  dealNotice: {
    headingAction: "Tu deal te necesita.",
    headingNews: "Novedades sobre tu deal.",
    action: "Abrir en comtor",
    note: "Recibes este correo porque hay un plazo, una cancelación o dinero de por medio. Estos avisos no se pueden desactivar.",
  },
  dealDocument: {
    invoice: { subject: "Tu factura {number}", heading: "Tu factura está lista.", body: "La factura {number} de «{title}» va adjunta en PDF. También la encuentras en Deals, Facturas." },
    credit: { subject: "Tu nota de abono {number}", heading: "Tu nota de abono está lista.", body: "La nota de abono {number} de «{title}» va adjunta en PDF. También la encuentras en Deals, Facturas." },
    corrected: { subject: "Documento corregido: {replaces} sustituido por {number}", heading: "Se corrigió un documento.", body: "El documento {replaces} de «{title}» se anuló y se sustituyó por {number}. La anulación y el nuevo documento van adjuntos en PDF." },
    action: "Abrir el documento",
    note: "Recibes este correo porque se emitió un documento de uno de tus deals. Guárdalo para tu contabilidad.",
  },
};
