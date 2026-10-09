import type { faq } from "@/lib/i18n/messages/faq-en";
import type { DeepString } from "@/lib/i18n/messages/types";

export const faqEs: DeepString<typeof faq> = {
  meta: {
    title: "FAQ",
    description: "Así funcionan el matching, los pagos y las valoraciones en comtor.",
  },
  proOffer:
    " Suscríbete a Pro por {price} al mes y la comisión baja al {proFee} %. Vale para cada pago en el que una de las dos partes tenga Pro.",
  items: {
    matching: {
      question: "¿Cómo funciona el matching?",
      answer:
        "Las marcas publican una solicitud con nicho, idiomas del contenido, mínimo de seguidores y categoría de producto. Los creadores eligen hasta 3 nichos. En «Para ti» ven las solicitudes de esos nichos, si están en su idioma de contenido y una de sus plataformas llega al mínimo de seguidores. En «Todo» ven cada solicitud que encaja con su idioma y su alcance. Nadie aprueba los matches a mano: una solicitud que encaja aparece en el feed.",
    },
    reachOut: {
      question: "¿Cómo me pongo en contacto?",
      answer:
        "Toca «Me interesa» en una solicitud que encaje. Se abre un chat donde ambas partes se escriben directamente. Las dos ven también el email de contacto de la otra.",
    },
    payments: {
      question: "¿Cómo funcionan los pagos?",
      answer:
        "La marca paga al creador a través de comtor, nunca directamente. El dinero queda retenido hasta que el creador publique y envíe el enlace. Entonces la marca tiene {days} días para aprobar la publicación, lo que libera el dinero al instante, o para avisar de un problema. ¿Sin respuesta tras {days} días? El dinero se libera automáticamente. comtor se queda el {fee} % de cada pago.{proOffer}",
    },
    pro: {
      question: "¿Qué es el plan Pro?",
      answer:
        "Una suscripción mensual opcional para marcas y creadores ({price} al mes). Baja la comisión del {fee} % al {proFee} % en cada pago en el que la marca o el creador tenga Pro. Con una de las partes basta. Pro se amortiza cuando pasan por tu cuenta unos {breakEven} al mes. Stripe te cobra cada mes. Gestiónalo o cancélalo en Ajustes. Las primeras {foundingBrands} marcas y los primeros {foundingCreators} creadores tienen Pro gratis mientras exista su cuenta.",
    },
    noPost: {
      question: "¿Y si el creador nunca publica?",
      answer:
        "La marca cancela el pago en cualquier momento antes de que el creador envíe la publicación y recupera el importe completo. Si se envía una publicación pero algo falla (falta, la han retirado, no es lo acordado), la marca avisa del problema en {days} días. El dinero sigue retenido mientras revisamos el caso. Después lo liberamos al creador o reembolsamos a la marca. Un pago liberado no se puede revertir. Las valoraciones de ambas partes muestran quién es fiable antes de pagar.",
    },
    realMoney: {
      question: "¿Es dinero real?",
      answer: "Sí. Los pagos de colaboraciones y la suscripción Pro pasan por Stripe. El dinero real se mueve entre cuentas bancarias reales.",
    },
    followers: {
      question: "¿Cómo se verifican los seguidores?",
      answer:
        "Los creadores los indican ellos mismos. Cada plataforma enlaza a la cuenta real, así que compruebas la cifra verdadera antes de contactar.",
    },
    reviews: {
      question: "¿Puedo dejar una valoración?",
      answer:
        "Sí. Cuando se libera un pago, cada parte puede dejar una puntuación y un comentario breve. Las valoraciones aparecen en los perfiles públicos y ayudan a elegir con quién trabajar.",
    },
    contact: {
      question: "¿Cómo contacto con vosotros?",
      answer: "Encuentra nuestros datos de contacto en la página de Aviso legal.",
    },
  },
};
