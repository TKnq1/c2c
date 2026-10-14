import { PLATFORM_FEE_RATE, PLATFORMS, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import type { UgcContent, UgcFaqItem, UgcNichePage } from "@/lib/ugc/types";

// Spanish version of the UGC search pages (/es/ugc ...). Same structure as content-de.ts / seo-pages.ts:
// same niches, same number of cards, steps and questions. No invented numbers, quotes or testimonials, and no
// "escrow" wording on public pages until the payment model is cleared (see docs/legal-readiness.md): the money
// is "retenido" (held back).

const NBSP = " ";
const FEE = `${PLATFORM_FEE_RATE * 100}${NBSP}%`;
const PRO_FEE = `${PRO_PLATFORM_FEE_RATE * 100}${NBSP}%`;
const PRO_PRICE = `${PRO_SUBSCRIPTION_PRICE_CENTS / 100}${NBSP}€`;

const PLATFORM_LIST = `${PLATFORMS.slice(0, -1).join(", ")} y ${PLATFORMS[PLATFORMS.length - 1]}`;

// Questions every page answers the same way, because the answer is the same.
function sharedFaqs(): UgcFaqItem[] {
  return [
    {
      question: "¿Cómo funciona el pago?",
      answer: `La marca paga a través de la plataforma, no directamente al creador. El dinero queda retenido hasta que el creador publica el post, envía el enlace y la marca lo aprueba. La marca tiene ${RELEASE_REVIEW_DAYS} días para revisarlo y puede avisar de un problema en ese plazo. Si no responde, el pago se libera automáticamente. Los pagos pasan por Stripe.`,
    },
    {
      question: "¿Cuánto cuesta comtor?",
      answer: `Registrarse es gratis y no hay cuota fija. comtor se queda ${FEE} de cada pago. La comisión se descuenta del cobro del creador. La marca paga exactamente el importe acordado. Marcas y creadores pueden contratar un plan Pro opcional por ${PRO_PRICE} al mes. Entonces la comisión es de ${PRO_FEE} en cada pago en el que una de las dos partes tenga Pro.`,
    },
    {
      question: "¿Hay que marcar los posts de pago como publicidad?",
      answer:
        "En Alemania, los posts de pago suelen tener que marcarse como publicidad. Acordad la marcación en el chat antes de publicar. Esto no es asesoramiento jurídico.",
    },
    {
      question: "¿Cómo se comprueban las cifras de seguidores?",
      answer:
        "Las cifras las indican los propios creadores. Cada plataforma que añade un creador está enlazada a su cuenta real. Así las marcas ven el dato por sí mismas antes del primer mensaje. Las marcas fijan un mínimo de seguidores en su solicitud. Solo los creadores que encajan la ven.",
    },
  ];
}

// The two questions about finding each other, for the pages that don't need a niche-specific answer.
function matchingFaqs(opts: {
  label: string;
  brandWho: string;
  creatorFrom: string;
  categories?: string;
}): UgcFaqItem[] {
  const hint = opts.categories ? ` (${opts.categories})` : "";
  return [
    {
      question: `¿Cómo encuentro creadores que encajen con mi ${opts.brandWho}?`,
      answer: `Publicas una solicitud: nicho ${opts.label}, idioma del contenido, mínimo de seguidores, categoría de producto${hint}, presupuesto, plataforma y entregables. Los creadores que han elegido ${opts.label} como nicho y encajan en idioma y alcance la ven en su feed. Si les interesa, te escriben por el chat. comtor no revisa las solicitudes a mano.`,
    },
    {
      question: `¿Dónde encuentro encargos ${opts.creatorFrom} como creador?`,
      answer: `Creas tu perfil, eliges hasta tres nichos, por ejemplo ${opts.label}, y añades tus plataformas con el número de seguidores de cada una. En el feed ves las solicitudes de tus nichos en “Para ti” y todo lo que encaja con tu idioma y alcance en “Todo”, cada una con presupuesto y requisitos. Con un toque en “Me interesa” abres el chat con la marca.`,
    },
  ];
}

const niches: UgcNichePage[] = [
  {
    slug: "beauty",
    niche: "Beauty",
    label: "Belleza",
    title: "Encuentra creadores UGC para marcas de belleza",
    description:
      "Las marcas de belleza encuentran creadores UGC para vídeos de rutina, unboxings y fotos de producto. Los creadores encuentran encargos de pago. Empieza gratis.",
    heading: "Encuentra creadores UGC para marcas de belleza",
    ogLines: ["Encuentra creadores UGC", "para marcas de belleza."],
    lead: "Cuidado de la piel, maquillaje, cabello, perfumes: quien compra belleza quiere ver cómo queda en personas reales. comtor une marcas de belleza con creadores que hacen justo esos vídeos y fotos. Los creadores encuentran aquí encargos de pago de su nicho.",
    formats: [
      {
        title: "Vídeo de rutina",
        text: "Rutina de mañana o de noche donde el producto aparece paso a paso. Funciona en orgánico y como anuncio.",
      },
      {
        title: "Unboxing y primeras impresiones",
        text: "Desempaquetar, probar y decir con sinceridad qué te llama la atención. Ideal para novedades y sets.",
      },
      {
        title: "Aplicación al detalle",
        text: "Cómo se aplica, cómo se siente, cuánto dura. Primeros planos en vez de aspecto de estudio.",
      },
      {
        title: "Fotos del día a día",
        text: "Fotos de producto en el baño, en el tocador o de viaje, para la tienda, las redes y los anuncios.",
      },
    ],
    faqs: [
      {
        question: "¿Cómo encuentro creadores que encajen con mi marca de belleza?",
        answer:
          "Publicas una solicitud: nicho Belleza, idioma del contenido, mínimo de seguidores, categoría de producto, presupuesto, plataforma y qué quieres recibir. Los creadores que han elegido Belleza como nicho y encajan en idioma y alcance la ven en su feed. Quien tiene interés te escribe por el chat. comtor no revisa las solicitudes a mano.",
      },
      {
        question: "¿Dónde encuentro encargos de marcas de belleza como creador?",
        answer:
          "Creas tu perfil, eliges hasta tres nichos, por ejemplo Belleza, y añades tus plataformas con el número de seguidores de cada una. En el feed ves las solicitudes de tus nichos en “Para ti” y todo lo que encaja con tu idioma y alcance en “Todo”, cada una con presupuesto y requisitos. Con un toque en “Me interesa” abres el chat con la marca.",
      },
      {
        question: "¿Recibo el producto gratis?",
        answer:
          "Lo decide la marca en su solicitud: ahí figura si el producto está incluido. Lo demás, como los entregables y la fecha, lo acordáis antes en el chat.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "fitness",
    niche: "Fitness",
    label: "Fitness",
    title: "Encuentra creadores UGC para marcas de fitness",
    description:
      "Las marcas de fitness encuentran creadores UGC para vídeos de entrenamiento, pruebas de producto y demos de apps. Los creadores encuentran encargos de pago. Empieza gratis.",
    heading: "Encuentra creadores UGC para marcas de fitness",
    ogLines: ["Encuentra creadores UGC", "para marcas de fitness."],
    lead: "Ropa deportiva, material, suplementos, apps de fitness: en fitness convence lo que la gente usa de verdad. comtor une marcas de fitness con creadores que muestran el entrenamiento y el día a día con credibilidad. Los creadores encuentran aquí encargos de pago de su nicho.",
    formats: [
      {
        title: "Entrenamiento con producto",
        text: "Una sesión donde se ve la ropa, el material o el accesorio en uso.",
      },
      {
        title: "Prueba tras unas semanas",
        text: "Balance sincero: ajuste, durabilidad, manejo. Ayuda a decidir la compra.",
      },
      {
        title: "Día a día y rutina",
        text: "Plan de entrenamiento, meal prep o rutina de mañana donde el producto es parte natural del día.",
      },
      {
        title: "Demo de app o tracker",
        text: "Grabación de pantalla con comentarios: cómo es un entrenamiento con la app y qué muestra el tracker.",
      },
    ],
    faqs: [
      {
        question: "¿Cómo encuentro creadores que encajen con mi marca de fitness?",
        answer:
          "Publicas una solicitud: nicho Fitness, idioma del contenido, mínimo de seguidores, categoría de producto (por ejemplo ropa deportiva, suplementos o app), presupuesto, plataforma y entregables. Los creadores que han elegido Fitness como nicho y encajan en idioma y alcance la ven en su feed. Si les interesa, te escriben por el chat.",
      },
      {
        question: "¿Dónde encuentro encargos de marcas de fitness como creador?",
        answer:
          "Creas tu perfil, eliges hasta tres nichos, por ejemplo Fitness, y añades tus plataformas con el número de seguidores de cada una. En el feed ves las solicitudes de tus nichos en “Para ti” y todo lo que encaja con tu idioma y alcance en “Todo”. Con “Me interesa” abres el chat.",
      },
      {
        question: "¿Qué se aplica a los suplementos y a las afirmaciones sobre sus efectos?",
        answer:
          "Las afirmaciones sobre salud y efectos están sujetas a normas estrictas. Con los complementos alimenticios, acordad en el chat antes de grabar qué se puede decir y qué no. Esto no es asesoramiento jurídico.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "food",
    niche: "Food",
    label: "Comida",
    title: "Encuentra creadores UGC para marcas de comida",
    description:
      "Las marcas de comida encuentran creadores UGC para vídeos de recetas, catas y fotos gastronómicas. Los creadores encuentran encargos de pago. Empieza gratis.",
    heading: "Encuentra creadores UGC para marcas de comida",
    ogLines: ["Encuentra creadores UGC", "para marcas de comida."],
    lead: "Snacks, bebidas, especias, cajas de cocina, ingredientes de repostería: en comida y bebida cuenta si dan ganas de probarlo ya. comtor une marcas de comida con creadores que cocinan, prueban y enseñan. Los creadores encuentran aquí encargos de pago de su nicho.",
    formats: [
      {
        title: "Vídeo de receta",
        text: "Un plato o una bebida paso a paso, con el producto como ingrediente. Muestra cómo se usa.",
      },
      {
        title: "Cata y primeras impresiones",
        text: "Probar y describir con sinceridad lo que se nota. Va bien con novedades, sabores y sets de regalo.",
      },
      {
        title: "Unboxing de cajas de cocina",
        text: "Abrir y presentar una caja de cocina, un pack de prueba o un set de regalo.",
      },
      {
        title: "Día a día y meal prep",
        text: "Desayuno, cocinar para la semana o el snack de media tarde: el producto como parte normal del día.",
      },
      {
        title: "Fotos de comida",
        text: "Platos y productos fotografiados para la tienda, las redes y los anuncios.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Comida",
        brandWho: "marca de comida",
        creatorFrom: "de marcas de comida",
        categories: "por ejemplo comida y bebida",
      }),
      {
        question: "¿Quién se encarga del envío de los productos?",
        answer:
          "Lo acordáis antes en el chat. La solicitud solo indica si el producto está incluido. Cómo y cuándo llega lo pactáis antes, sobre todo con productos refrigerados o perecederos.",
      },
      {
        question: "¿Qué se aplica a las afirmaciones sobre salud y efectos?",
        answer:
          "Afirmaciones como “saludable” o “refuerza el sistema inmunitario” están reguladas con rigor en alimentación. Acordad antes en el chat qué se puede decir. Esto no es asesoramiento jurídico.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "mode",
    niche: "Fashion",
    label: "Moda",
    title: "Encuentra creadores UGC para marcas de moda",
    description:
      "Las marcas de moda encuentran creadores UGC para vídeos de outfits, pruebas de ropa y fotos de estilismo. Los creadores encuentran encargos de pago. Empieza gratis.",
    heading: "Encuentra creadores UGC para marcas de moda",
    ogLines: ["Encuentra creadores UGC", "para marcas de moda."],
    lead: "Ropa, zapatos, accesorios, joyas: la moda se compra porque uno se ve con ella puesta. comtor une marcas de moda con creadores que llevan las prendas, las combinan y enseñan cómo sientan en el día a día. Los creadores encuentran aquí encargos de pago de su nicho.",
    formats: [
      {
        title: "Vídeo de outfit",
        text: "Una prenda, varios looks: cómo combinarla para el trabajo, el tiempo libre y la noche.",
      },
      {
        title: "Prueba con opinión sincera",
        text: "Ajuste, material y talla frente a la tabla de tallas, con tus propias palabras.",
      },
      {
        title: "Haul y unboxing",
        text: "Abrir el pedido y presentar las prendas una por una.",
      },
      {
        title: "Fotos de estilismo del día a día",
        text: "Looks en la calle, en una cafetería o en casa, para la tienda, las redes y los anuncios.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Moda",
        brandWho: "marca de moda",
        creatorFrom: "de marcas de moda",
      }),
      {
        question: "¿Qué pasa con la talla y el ajuste?",
        answer:
          "La talla la acordáis antes en el chat, para que la prenda te quede bien y el post salga bien. Si el producto está incluido, lo indica la solicitud de la marca.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "tech",
    niche: "Tech",
    label: "Tecnología",
    title: "Encuentra creadores UGC para marcas de tecnología",
    description:
      "Las marcas de tecnología encuentran creadores UGC para unboxings, pruebas de uso diario y demos de apps. Los creadores encuentran encargos de pago. Empieza gratis.",
    heading: "Encuentra creadores UGC para marcas de tecnología",
    ogLines: ["Encuentra creadores UGC", "para marcas de tecnología."],
    lead: "Gadgets, accesorios, hogar inteligente, software y apps: en tecnología, quien compra quiere ver cómo funciona el producto en el día a día. comtor une marcas de tecnología con creadores que desempaquetan, configuran y explican. Los creadores encuentran aquí encargos de pago de su nicho.",
    formats: [
      {
        title: "Unboxing y configuración",
        text: "Abrir, encender, configurar: los primeros minutos con el producto, tal como los vive el comprador.",
      },
      {
        title: "Prueba de uso diario",
        text: "Una semana con el producto: qué funciona, qué molesta y para quién merece la pena.",
      },
      {
        title: "Demo de una función",
        text: "Grabación de pantalla o primer plano que explica una función que suele pasar desapercibida.",
      },
      {
        title: "Cómo se hace",
        text: "Tutorial corto: cómo resuelvo un problema típico con el producto.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Tecnología",
        brandWho: "marca de tecnología",
        creatorFrom: "de marcas de tecnología",
        categories: "por ejemplo electrónica o software/app",
      }),
      {
        question: "¿Cómo accedo como creador a dispositivos o software?",
        answer:
          "Con dispositivos, la marca indica en la solicitud si el producto está incluido. Con software y apps, acordáis en el chat cómo obtienes acceso a una cuenta de prueba o a una versión completa.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "reisen",
    niche: "Travel",
    label: "Viajes",
    title: "Encuentra creadores UGC para empresas de viajes",
    description:
      "Hoteles, agencias y marcas de viajes encuentran creadores UGC para reels de viaje, recorridos por alojamientos y fotos. Empieza gratis.",
    heading: "Encuentra creadores UGC para empresas de viajes",
    ogLines: ["Encuentra creadores UGC", "para empresas de viajes."],
    lead: "Hoteles, alojamientos vacacionales, touroperadores, maletas y apps de viaje: los viajes se reservan según las imágenes y experiencias de otros. comtor une empresas de viajes con creadores que muestran lugares y alojamientos tal como se viven allí. Los creadores encuentran aquí encargos de pago de su nicho.",
    formats: [
      {
        title: "Reel de viaje",
        text: "Un lugar en 30 segundos: la llegada, los mejores momentos y un consejo para llevarte.",
      },
      {
        title: "Recorrido por el alojamiento",
        text: "Habitación, vistas, desayuno, detalles: cómo se ve y se siente de verdad.",
      },
      {
        title: "Tres consejos in situ",
        text: "Formato corto con sitios favoritos, comida y rutas fuera de lo típico.",
      },
      {
        title: "Lista de equipaje y accesorios",
        text: "Maleta, mochila, adaptador: productos en uso real durante el viaje.",
      },
      {
        title: "Serie de fotos",
        text: "Imágenes del lugar y del alojamiento, para la web, las redes y los anuncios.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Viajes",
        brandWho: "empresa de viajes",
        creatorFrom: "del sector viajes",
      }),
      {
        question: "¿Quién paga el viaje y el alojamiento?",
        answer:
          "Lo acordáis antes en el chat y lo dejáis por escrito. La solicitud indica el presupuesto del post. Si el viaje, el alojamiento o servicios en destino van incluidos, lo pactáis de forma expresa.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "gaming",
    niche: "Gaming",
    label: "Gaming",
    title: "Encuentra creadores UGC para marcas de gaming",
    description:
      "Las marcas de gaming encuentran creadores UGC para clips de gameplay, pruebas de hardware y primeras impresiones. Los creadores encuentran encargos de pago. Empieza gratis.",
    heading: "Encuentra creadores UGC para marcas de gaming",
    ogLines: ["Encuentra creadores UGC", "para marcas de gaming."],
    lead: "Juegos, consolas, hardware de PC, accesorios y apps de gaming: los jugadores se fían de quien juega de verdad. comtor une marcas de gaming con creadores que juegan, prueban y comentan. Los creadores encuentran aquí encargos de pago de su nicho.",
    formats: [
      {
        title: "Clip de gameplay",
        text: "Una escena del juego con comentarios: qué lo hace especial y qué destaca.",
      },
      {
        title: "Primeras impresiones",
        text: "Las primeras horas en un juego nuevo, sin guion y con sinceridad.",
      },
      {
        title: "Prueba de hardware",
        text: "Ratón, auriculares, teclado o mando en uso: tacto, calidad y comodidad en el día a día.",
      },
      {
        title: "Highlights de un directo o una sesión",
        text: "Los mejores momentos de un directo o de una partida, en un montaje corto.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Gaming",
        brandWho: "marca de gaming",
        creatorFrom: "de marcas de gaming",
      }),
      {
        question: "¿En qué plataformas puedo publicar?",
        answer: `Los creadores añaden sus plataformas con el número de seguidores de cada una: ${PLATFORM_LIST}. La marca indica en su solicitud dónde debe publicarse.`,
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "lifestyle",
    niche: "Lifestyle",
    label: "Estilo de vida",
    title: "Encuentra creadores UGC para marcas de estilo de vida",
    description:
      "Las marcas de estilo de vida encuentran creadores UGC para vídeos del día a día, looks de hogar y fotos de producto. Los creadores encuentran encargos de pago. Empieza gratis.",
    heading: "Encuentra creadores UGC para marcas de estilo de vida",
    ogLines: ["Encuentra creadores UGC", "para marcas de estilo de vida."],
    lead: "Hogar, limpieza, organización, bienestar, accesorios: los productos de estilo de vida convencen cuando se ven en la vida real. comtor une marcas de estilo de vida con creadores que muestran su día a día. Los creadores encuentran aquí encargos de pago de su nicho.",
    formats: [
      {
        title: "Un día con el producto",
        text: "De la mañana a la noche: dónde aparece el producto en el día a día y qué te facilita.",
      },
      {
        title: "Look de hogar",
        text: "Una casa, un rincón o una estantería decorados con el producto. Muestra cómo queda en una vivienda real.",
      },
      {
        title: "Unboxing y montaje",
        text: "Abrir, montar y probar, con los tropiezos incluidos.",
      },
      {
        title: "Rutina y hábitos",
        text: "Rutina de mañana, de noche o de domingo donde el producto aparece con naturalidad.",
      },
      {
        title: "Fotos del día a día",
        text: "Fotos de producto en situaciones reales, para la tienda, las redes y los anuncios.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Estilo de vida",
        brandWho: "marca de estilo de vida",
        creatorFrom: "de marcas de estilo de vida",
      }),
      {
        question: "¿Y si mi contenido mezcla varios temas?",
        answer:
          "Puedes elegir hasta tres nichos, por ejemplo Estilo de vida, Moda y Comida. En el feed ves primero las solicitudes de esos nichos en “Para ti” y todo lo que encaja con tu idioma y alcance en “Todo”.",
      },
      ...sharedFaqs(),
    ],
  },
];

export const ugcContentEs: UgcContent = {
  htmlLang: "es",
  ogLocale: "es_ES",
  ui: {
    hubTitle: "Encuentra y contrata creadores UGC",
    hubDescription:
      "Las marcas encuentran creadores UGC para vídeos y fotos, los creadores encargos de pago. Publica una solicitud, acuerda en el chat, paga a través de la plataforma. Gratis.",
    hubIntro:
      "Las marcas necesitan vídeos y fotos de personas reales, y los creadores quieren cobrar por ellos. comtor une a ambos: la marca publica una solicitud, los creadores que encajan responden y el pago pasa por la plataforma.",
    signupNote: "Regístrate gratis. comtor funciona en el navegador y eliges el idioma al empezar.",
    creatorCardTitle: "¿Eres creador?",
    creatorCardBody:
      "Así encuentras encargos UGC de pago y cobras a través de la plataforma: ganar dinero como creador UGC.",
    byNicheTitle: "UGC por nicho",
    howTitle: "Así funciona comtor",
    forBrands: "Para marcas",
    forCreators: "Para creadores",
    hubBrandSteps: [
      "Publica una solicitud: nicho, idioma, mínimo de seguidores, categoría de producto, presupuesto y entregables.",
      "Los creadores responden: quien encaja ve la solicitud en el feed y te escribe por el chat.",
      "Paga y aprueba: pagas a través de la plataforma y apruebas el post cuando esté bien.",
    ],
    hubCreatorSteps: [
      "Crea tu perfil: hasta tres nichos y tus plataformas con el número de seguidores de cada una.",
      "Mira las solicitudes: en el feed ves presupuesto y requisitos antes de contactar.",
      "Publica y cobra: tras publicar, envías el enlace. Cuando la marca lo apruebe (como máximo a los {days} días), se libera el pago.",
    ],
    faqTitle: "Preguntas frecuentes",
    formatsTitle: "Estos formatos funcionan en el nicho “{label}”",
    nicheBrandSteps: [
      "Publica una solicitud: nicho {label}, idioma, mínimo de seguidores, presupuesto y entregables.",
      "Los creadores responden: quien encaja ve la solicitud en el feed y te escribe por el chat.",
      "Paga y aprueba: pagas a través de la plataforma y apruebas el post cuando esté bien.",
    ],
    nicheCreatorSteps: [
      "Crea tu perfil: hasta tres nichos, por ejemplo {label}, y tus plataformas con el número de seguidores de cada una.",
      "Mira las solicitudes: en el feed ves presupuesto y requisitos antes de contactar.",
      "Publica y cobra: tras publicar, envías el enlace. Cuando la marca lo apruebe (como máximo a los {days} días), se libera el pago.",
    ],
    nicheReadyTitle: "¿Listo para tu primer encargo en el nicho “{label}”?",
    overviewLead: "Qué es el UGC y cómo funciona comtor, te lo explicamos en un resumen:",
    overviewLink: "Encuentra creadores UGC",
    creatorCrumb: "Hazte creador",
    creatorFooterLink: "Hazte creador",
    creatorDoingTitle: "Qué hacen los creadores UGC",
    creatorStartTitle: "Así empiezas en comtor",
    creatorTipsTitle: "Consejos para buen contenido UGC",
    creatorReadyTitle: "¿Listo para tu primer encargo de pago?",
    creatorBrandHint: "¿Buscas creadores para tu marca? Qué es el UGC y cómo funciona comtor, te lo explicamos en un resumen:",
    nicheNavLabel: "UGC por nicho",
  },
  niches,
  hubFaqs: [
    {
      question: "¿Qué es el UGC?",
      answer:
        "UGC significa User Generated Content, contenido creado por usuarios. En marketing son vídeos y fotos que personas reales hacen para una marca: probar el producto, grabarlo, enseñarlo. La marca los usa en sus canales, en la tienda o en anuncios. Cuenta el contenido, no el alcance del creador.",
    },
    {
      question: "¿Qué diferencia hay con el marketing de influencers?",
      answer:
        "En el marketing de influencers manda el alcance de una persona: el post sale en su canal. En el UGC manda el contenido, y también creadores pequeños pueden hacer buenos vídeos. En comtor la marca indica en su solicitud qué plataforma y qué mínimo de seguidores quiere, y puede dejar ambos abiertos.",
    },
    {
      question: "¿Cómo encuentro creadores UGC para mi marca?",
      answer:
        "Creas un perfil de marca gratis y publicas una solicitud: nicho, idioma, categoría de producto, presupuesto y qué quieres recibir. Los creadores que encajan la ven en su feed y te escriben por el chat.",
    },
    ...sharedFaqs(),
  ],
  creator: {
    title: "Gana dinero como creador UGC",
    description:
      "Encuentra encargos de pago de marcas como creador UGC: mira solicitudes con presupuesto, acuerda en el chat y cobra a través de la plataforma. Gratis.",
    heading: "Gana dinero como creador UGC",
    ogLines: ["Gana dinero", "como creador UGC."],
    lead: "Los creadores UGC hacen vídeos y fotos para marcas, tal como los haría un cliente real al enseñar un producto. En comtor ves solicitudes de pago con presupuesto y requisitos, muestras interés con un toque y acuerdas el resto en el chat. Cobras a través de la plataforma.",
    doing: [
      {
        title: "Vídeos de producto",
        text: "Probar un producto, grabarlo y enseñar con sinceridad cómo funciona en el día a día.",
      },
      {
        title: "Unboxings y primeras impresiones",
        text: "Desempaquetar, probar y decir qué te llama la atención. Sin estudio, pero con credibilidad.",
      },
      {
        title: "Usos y tutoriales",
        text: "Enseñar paso a paso cómo se usa un producto y qué te facilita.",
      },
      {
        title: "Fotos en situaciones reales",
        text: "Fotos de producto en el día a día, para la tienda, las redes y los anuncios de la marca.",
      },
    ],
    steps: [
      "Crea tu perfil: elige hasta tres nichos, añade tus plataformas con el número de seguidores de cada una e indica el idioma de tu contenido.",
      "Mira las solicitudes: en el feed ves presupuesto, plataforma y entregables antes de contactar.",
      "Muestra interés: con “Me interesa” abres el chat con la marca y acordáis detalles y fecha.",
      "Publica y envía el enlace: tras publicar el post, envías su enlace.",
      `Cobra: la marca aprueba el post, como máximo a los ${RELEASE_REVIEW_DAYS} días, y el pago se transfiere a tu cuenta.`,
    ],
    tips: [
      {
        title: "Enseña el producto pronto",
        text: "En los primeros segundos debe quedar claro de qué trata y qué hace el producto.",
      },
      {
        title: "Habla con naturalidad",
        text: "Impresiones sinceras con tus propias palabras suelen convencer más que un texto aprendido de memoria.",
      },
      {
        title: "Cuida la luz y el sonido",
        text: "Luz natural y un sitio tranquilo suelen bastar. Buena imagen y sonido claro se notan.",
      },
      {
        title: "Aclara el uso antes",
        text: "Acuerda en el chat dónde puede usar la marca tus contenidos, antes de grabar.",
      },
    ],
    faqs: [
      {
        question: "¿Necesito muchos seguidores?",
        answer:
          "Lo decide la marca: cada solicitud indica un mínimo de seguidores, y algunas marcas no ponen límite. En “Para ti” ves las solicitudes de tus nichos y en “Todo” lo que encaja con tu idioma y alcance.",
      },
      {
        question: "¿En qué plataformas puedo publicar?",
        answer: `Añades tus plataformas con el número de seguidores: ${PLATFORM_LIST}. La marca indica en su solicitud dónde debe publicarse.`,
      },
      {
        question: "¿Con qué rapidez cobro?",
        answer: `En cuanto la marca aprueba tu post, el pago se libera a tu favor. La marca tiene ${RELEASE_REVIEW_DAYS} días para hacerlo. Si no responde, el pago se libera automáticamente. El cobro pasa por Stripe.`,
      },
      {
        question: "¿Tengo que registrar una actividad económica como creador UGC?",
        answer:
          "Depende de tu situación, por ejemplo de cuánto y con qué frecuencia ganes. En Alemania, normalmente tienes que declarar los ingresos a efectos fiscales. Si tienes dudas, consulta a un asesor fiscal. Esto no es asesoramiento fiscal ni jurídico.",
      },
      ...sharedFaqs(),
    ],
  },
};
