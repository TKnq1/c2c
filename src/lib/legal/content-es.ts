import { FOUNDING_BRAND_LIMIT, FOUNDING_CREATOR_LIMIT, PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_PRICE_CENTS, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import { formatCents } from "@/lib/format";
import type { LegalContent, LegalSection } from "@/lib/legal/types";

// The Spanish legal texts (courtesy translation). Same structure as en.ts: keep them in step with en.ts and with
// the German texts in de.ts (the German version governs).
function esTerms(): LegalSection[] {
  return [
  {
    title: "Ámbito de aplicación y operador",
    body: [
      "Estas condiciones se aplican al uso que hagas de comtor (comtor.app). El operador es Teethawat Kanpai, empresario individual (Einzelunternehmen) en Berlín, Alemania (véase el Aviso legal). Al crear una cuenta aceptas estas condiciones. Para los usuarios en Alemania, se aplica la versión alemana de estas condiciones.",
      "comtor es únicamente la plataforma técnica. Una colaboración es un contrato entre la marca y el creador. El operador no es parte de él, no emplea al creador y no vende el producto de la marca.",
    ],
  },
  {
    title: "Quién puede usar comtor",
    body: [
      "Debes tener al menos 18 años o estar autorizado para obligar a la empresa en cuyo nombre actúas. Eres responsable de tu acceso y de que sea veraz lo que figura en tu perfil. Una cuenta por persona o empresa.",
    ],
  },
  {
    title: "El servicio",
    body: [
      "Las marcas publican una solicitud: qué quieren que se cree, en qué plataforma, con qué presupuesto y para cuándo. Los creadores que encajan pueden mostrar interés, acordar un precio en el chat y cobrar a través de comtor.",
      "No prometemos una coincidencia, un número de visualizaciones, una venta ni ningún ingreso. Lo que ganes o gastes depende de los acuerdos que cierres con otros usuarios.",
    ],
  },
  {
    title: "Lo que subes",
    body: [
      "Conservas los derechos sobre lo que subes. Nos permites alojarlo, mostrarlo a otros usuarios y conservar una copia de seguridad mientras permanezca en comtor, para que el servicio pueda funcionar. Este permiso termina cuando se elimina el contenido, salvo las copias que debamos conservar por ley.",
      "El trabajo que un creador realiza para una marca pertenece a quien ambos acuerden. No adquirimos derechos sobre ese trabajo.",
    ],
  },
  {
    title: "Tu responsabilidad",
    body: [
      "Las marcas son responsables de sus solicitudes, de sus afirmaciones sobre el producto y de los derechos sobre las fotos que suben. Los creadores son responsables de sus publicaciones y deben marcarlas como publicidad cuando la ley lo exija (en Alemania, por ejemplo, como “Werbung” o “Anzeige”).",
      "Si una marca envía un producto, ese envío es un asunto entre la marca y el creador. Nosotros no lo vendemos ni lo enviamos. Una fianza, cuando una solicitud la exige, es una garantía entre ambos, no una tarifa nuestra.",
      "Si un tercero presenta una reclamación contra nosotros por un contenido que hayas subido, un producto que hayas enviado o una colaboración que hayas acordado, y la culpa es tuya, asumirás la reclamación y los costes razonables de la defensa. Si eres consumidor, esto se aplica solo en la medida en que la ley lo permita.",
    ],
  },
  {
    title: "Tarifas",
    body: [
      `Cobramos una comisión de plataforma del ${PLATFORM_FEE_RATE * 100} % en cada pago realizado a través de comtor. Las marcas pueden suscribirse a Pro por ${formatCents(PRO_PRICE_CENTS.brand)}/mes y los creadores por ${formatCents(PRO_PRICE_CENTS.creator)}/mes. Mientras Pro esté activo, la comisión es del ${PRO_PLATFORM_FEE_RATE * 100} % en cada pago en el que la marca o el creador tenga Pro. Pro se renueva cada mes hasta que lo canceles en Ajustes. Al cancelarlo se detiene la siguiente renovación. No hay tarifa por publicar. Las primeras ${FOUNDING_BRAND_LIMIT} marcas (marcas fundadoras) y los primeros ${FOUNDING_CREATOR_LIMIT} creadores (creadores fundadores) que se registraron en comtor tienen Pro gratis mientras exista su cuenta. Ese Pro no tiene precio mensual, no se puede transferir y termina con la cuenta. Podemos retirarlo si alguien incumple estas condiciones.`,
      "La comisión de plataforma solo se retiene cuando un pago se libera al creador. Si se reembolsa un pago retenido, la marca recupera ese pago y no retenemos ninguna comisión sobre él.",
    ],
  },
  {
    title: "Pagos retenidos para ti",
    body: [
      `Cuando una marca paga, retenemos el dinero hasta que el creador envíe el enlace de la publicación en vivo. La marca dispone entonces de ${RELEASE_REVIEW_DAYS} días para aprobarla, lo que libera el pago al creador menos nuestra comisión, o para comunicar un problema. Si la marca no hace ninguna de las dos cosas, el pago se libera. Si se comunica un problema, el dinero permanece retenido mientras lo revisamos, y después lo liberamos al creador o lo reembolsamos a la marca.`,
      "Una marca puede cancelar y recibir un reembolso antes de que el creador envíe el enlace. Una vez liberado un pago, no se puede revertir a través de comtor. Stripe procesa los pagos con tarjeta y los cobros. Nunca vemos el número completo de la tarjeta.",
    ],
  },
  {
    title: "Conducta",
    body: [
      "No inventes cifras de seguidores, no publiques reseñas falsas, no subas nada sobre lo que no tengas derechos ni saques un acuerdo de comtor para evitar la comisión. Podemos eliminar contenido y suspender o cerrar una cuenta que incumpla estas condiciones o la ley.",
      "Para denunciar contenido ilícito, o para pedirnos que revisemos de nuevo algo que hemos eliminado, escribe a info@comtor.app. Lo revisaremos y te comunicaremos el resultado.",
      "Si eliminamos contenido o suspendemos una cuenta, te comunicamos el motivo por correo electrónico. Puedes oponerte a la decisión en info@comtor.app. La revisaremos de nuevo y te responderemos.",
      "Solo pueden dejar una reseña los usuarios cuya colaboración se haya completado y pagado a través de comtor.",
    ],
  },
  {
    title: "Responsabilidad",
    body: [
      "Respondemos sin limitación por dolo y negligencia grave, por daños a la vida, la integridad física o la salud, y conforme a la Ley de Responsabilidad por Productos (Produkthaftungsgesetz). En caso de negligencia leve, solo respondemos si incumplimos una obligación esencial del contrato, y únicamente por los daños típicos y previsibles para este tipo de contrato.",
      "Si eres una empresa, esa responsabilidad por negligencia leve se limita a las tarifas que nos hayas pagado en los doce meses anteriores a la reclamación, o a 100 € si pagaste menos. Este límite no se aplica a los casos del párrafo anterior.",
      "No respondemos de la calidad, la legalidad ni los plazos de una colaboración, una publicación o un producto que los usuarios acuerden entre sí.",
    ],
  },
  {
    title: "Cierre de tu cuenta",
    body: [
      "Puedes eliminar tu cuenta en Ajustes. Podemos suspender o cerrar una cuenta que incumpla estas condiciones. Los pagos pendientes se concluyen conforme a las reglas de pago anteriores.",
    ],
  },
  {
    title: "Si eres consumidor",
    body: [
      "Si eres consumidor en la UE, puede aplicarse un derecho legal de desistimiento de 14 días a Pro y a otros servicios de pago que nos compres a distancia. Una colaboración que acuerdes con otro usuario es un contrato con ese usuario, no con nosotros. Sigue aplicándose la legislación imperativa de consumo del país donde vives.",
    ],
  },
  {
    title: "Ley aplicable y tribunales",
    body: [
      "Se aplica la ley alemana. Si eres una empresa, son competentes los tribunales de Berlín. Si eres consumidor, puedes demandarnos en el lugar donde vives, y nosotros solo te demandamos en el lugar donde vives.",
      "Solo puedes compensar un crédito que no discutamos o que haya sido reconocido por un tribunal.",
    ],
  },
  {
    title: "Cambios",
    body: [
      "Podemos actualizar estas condiciones. Te avisaremos por correo electrónico de un cambio significativo al menos 15 días antes de que se aplique. Si no lo aceptas, puedes eliminar tu cuenta hasta entonces.",
    ],
  },
  ];
}

const ES_SENTRY = "Functional Software, Inc. (Sentry), EE. UU., registra informes de errores de nuestro sitio web y de la app (texto del error, página solicitada, navegador) para que podamos encontrar y corregir errores (RGPD art. 6.1.f).";

const ES_SERVICE_PROVIDERS = "Proveedores de servicios";

function esPrivacy({ sentry }: { sentry: boolean }): LegalSection[] {
  const sections: LegalSection[] = [
  {
    title: "Quién es el responsable",
    body: [
      "El responsable del tratamiento conforme al RGPD es Teethawat Kanpai, Sonnenscheinpfad 64, 12277 Berlín, Alemania (véase el Aviso legal). Para cualquier asunto relativo a tus datos, escribe a info@comtor.app.",
    ],
  },
  {
    title: "Tu cuenta",
    body: [
      "Tu dirección de correo electrónico, una contraseña con hash (nunca se almacena en texto plano), si eres marca o creador, si tu correo está verificado y, si activas la autenticación de dos factores, el secreto que se utiliza para comprobar tus códigos. Lo necesitamos para gestionar tu cuenta (RGPD art. 6.1.b). Te enviamos correos para verificar tu dirección, para restablecer tu contraseña cuando lo pides y para avisarte cuando se ha cambiado tu contraseña.",
      "Si suspendemos una cuenta por incumplir nuestras condiciones, guardamos cuándo y por qué, para que la decisión pueda revisarse más adelante (RGPD art. 6.1.f).",
      "Al registrarte también guardamos cuándo aceptaste las condiciones y esta política de privacidad y de qué versión se trataba, así como que confirmaste tener al menos 18 años. Esta es nuestra prueba de ello (RGPD art. 6.1.b y f).",
      "Los pasos de configuración que has visto o completado se guardan con tu cuenta, para que podamos mejorar la configuración (RGPD art. 6.1.f).",
      "Al final de la configuración te preguntamos, de forma voluntaria, cómo nos conociste (por ejemplo, un buscador o un amigo). Solo si respondes, guardamos con tu cuenta la opción que elegiste, para ver qué canales nos traen personas (RGPD art. 6.1.a). Puedes omitir la pregunta. La respuesta se elimina con la cuenta.",
      "Si llegas a nosotros mediante un enlace con datos de campaña (por ejemplo, de un anuncio) y te registras, guardamos esos datos (fuente, medio, campaña) con tu cuenta, para ver qué publicidad lleva a registros (RGPD art. 6.1.f). No instalamos ninguna cookie ni usamos ningún rastreador para esto: los datos solo están en la dirección del enlace y solo se guardan cuando te registras. Los eliminamos con la cuenta.",
      "Necesitamos tu dirección de correo electrónico y tu contraseña para celebrar y ejecutar un contrato contigo. Sin ellas no hay cuenta. Todo lo demás que introduces es opcional, salvo lo que se requiere para los cobros (Stripe verifica tu identidad para ello).",
    ],
  },
  {
    title: "Perfiles y solicitudes",
    body: [
      "Lo que introduces en tu perfil: en el caso de las marcas, nombre de la empresa, logotipo, sitio web, nicho, descripción y enlaces sociales; en el caso de los creadores, nombre público, imagen, nicho, biografía, idioma, y plataformas con número de seguidores y enlaces. Las solicitudes de una marca incluyen título, descripción, fotos, presupuesto, plataforma y contenido, fecha límite de publicación y datos del producto.",
      "Los perfiles y las solicitudes se muestran a otros usuarios (así funciona la coincidencia) y se almacenan en nuestros servidores (RGPD art. 6.1.b).",
    ],
  },
  {
    title: "Mensajes, ofertas y pagos",
    body: [
      "Los mensajes, las ofertas y los enlaces que los creadores envían para sus publicaciones se almacenan y son visibles para la otra parte de la conversación. Para los pagos conservamos el importe, la comisión, el estado y las fechas; el pago en sí se realiza a través de Stripe, y nunca vemos los datos completos de tu tarjeta. Las reseñas, las denuncias y los bloqueos se almacenan para que esas funciones operen (RGPD art. 6.1.b).",
    ],
  },
  {
    title: "Correos que te enviamos",
    body: [
      "Los correos de la cuenta (verificación, restablecimiento de contraseña, cambio de contraseña) se envían porque tienes una cuenta (RGPD art. 6.1.b). Se envían a través de Resend.",
      "Las novedades ocasionales del producto son aparte y opcionales. Si marcas esa casilla al crear una cuenta, o la activas en Ajustes, te enviamos un enlace por correo. El consentimiento es el botón de esa página, no abrir el correo. Guardamos el momento en que lo confirmaste (RGPD art. 6.1.a). Puedes detenerlo en Ajustes y entonces dejamos de enviarlo. Una solicitud sin confirmar no es un consentimiento.",
      "Enviamos correos promocionales solo a personas que lo aceptaron previamente (RGPD art. 6.1.a, § 7 apartado 2 n.º 3 UWG). No basta con una dirección guardada en una lista. Guardamos el nombre y la dirección de correo electrónico, una nota sobre cómo y cuándo lo aceptaste y qué mensaje te enviamos (registro de envíos, 90 días). No registramos si abres un correo o haces clic en un enlace. Cada uno de estos correos te indica por qué lo recibes y tiene un enlace para darte de baja (también como baja con un clic en tu programa de correo).",
      "Puedes retirar tu consentimiento en cualquier momento, con el enlace del correo o escribiendo a info@comtor.app. Entonces eliminamos tu dirección y el registro de envíos. Solo conservamos un hash de la dirección, para no volver a escribirte por error (RGPD art. 6.1.c y f).",
    ],
  },
  {
    title: "Lista de espera",
    body: [
      "Si dejas tu dirección de correo electrónico en nuestra página de inicio para enterarte de cuándo estarán disponibles las apps para iOS y Android, la guardamos junto con si elegiste marca o creador, y primero te enviamos un correo con un enlace para confirmar que la dirección es tuya (doble confirmación, double opt-in). Solo cuando la has confirmado la usamos, únicamente para ese correo (RGPD art. 6.1.a); guardamos el momento en que confirmaste como prueba de tu consentimiento. Si no confirmas, no volverás a recibir nada de nosotros y la dirección se elimina después de 30 días. Cuando las apps estén disponibles y te lo hayamos comunicado, la dirección se elimina. Puedes retirar tu consentimiento en cualquier momento escribiendo a info@comtor.app, y la eliminaremos de inmediato.",
    ],
  },
  {
    title: "Seguridad y registros",
    body: [
      "Cada inicio de sesión registra la hora, si tuvo éxito, tu dirección IP y tu navegador, para que puedas ver tus inicios de sesión recientes en Ajustes y para que podamos detener abusos como el intento de adivinar contraseñas. Cuando usas comtor, nuestro proveedor de alojamiento también procesa datos técnicos (dirección IP, hora, página solicitada, navegador) para entregarlo y mantenerlo seguro. Ambos se basan en nuestro interés legítimo en un servicio seguro (RGPD art. 6.1.f). Eliminamos el registro de inicios de sesión después de 90 días, la dirección IP guardada al registrarte después de 7 días y los contadores de abuso después de 24 horas.",
    ],
  },
  {
    title: "Cookies, almacenamiento local y notificaciones",
    body: [
      "Solo usamos cookies estrictamente necesarias: una que mantiene tu sesión iniciada (30 días desde tu última visita), dos de corta duración del inicio de sesión (protección contra solicitudes falsificadas y la dirección a la que volver) y una para el idioma que elegiste (un año). Al cambiar tu contraseña se cierra la sesión en tus otros dispositivos. Tus ajustes de apariencia y sonido, si has descartado el aviso de instalación y si elegiste marca o creador en nuestra página de inicio se guardan en el almacenamiento local de tu navegador y nunca se nos envían. No hay cookies de analítica ni de publicidad.",
      "Contamos con qué frecuencia se abren nuestra página de inicio y el comienzo del registro, sin cookie y sin reconocerte: por día solo un número por página y origen (el nombre del sitio web de referencia, o la fuente y la campaña del enlace). No guardamos tu dirección IP, la cadena de tu navegador ni ningún identificador tuyo. Esto sirve para ver qué publicidad y qué páginas traen visitantes (RGPD art. 6.1.f).",
      "En las páginas donde configuras los cobros, Stripe carga sus propios scripts. Pueden instalar cookies o identificadores de dispositivo propios para prevenir el fraude (véase la política de privacidad de Stripe).",
      "Las notificaciones push solo se envían si las activas (RGPD art. 6.1.a). En un navegador las entrega su servicio push (de Apple, Google o Mozilla, según tu navegador). En la app de comtor para iPhone o Android guardamos un token de tu dispositivo y las enviamos a través del Apple Push Notification service o de Firebase Cloud Messaging de Google. Puedes desactivarlas en cualquier momento en Ajustes, en tu navegador o en los ajustes de tu teléfono. Los correos sobre tu cuenta, como la verificación y los restablecimientos de contraseña, se envían a través de Resend.",
    ],
  },
  {
    title: ES_SERVICE_PROVIDERS,
    body: [
      "Estos proveedores tratan datos por encargo nuestro y según nuestras instrucciones (RGPD art. 28): Vercel Inc., EE. UU., que aloja el sitio web y la app; Neon Inc., EE. UU., cuya base de datos utilizamos, alojada en Fráncfort, Alemania; Resend Inc., EE. UU., que entrega nuestros correos (de cuenta, de contacto y de la lista de espera); y Google Ireland Limited, que entrega las notificaciones push a la app de Android a través de Firebase Cloud Messaging.",
      "Stripe se encarga de los pagos, los cobros y las verificaciones de identidad necesarias para los cobros. Para parte de este tratamiento, Stripe Payments Europe, Ltd. (Irlanda) es responsable por sí misma. Véase la política de privacidad de Stripe.",
      "Las notificaciones push a la app de iPhone las entrega Apple Inc., EE. UU., a través del Apple Push Notification service.",
      "Cuando los datos llegan a EE. UU., la transferencia se basa en el Marco de Privacidad de Datos UE-EE. UU. o en las Cláusulas Contractuales Tipo de la UE.",
    ],
  },
  {
    title: "Cuánto tiempo conservamos los datos",
    body: [
      "Conservamos tus datos mientras tengas una cuenta. Cuando eliminas tu cuenta en Ajustes, se eliminan con ella tu perfil, tus solicitudes, tus mensajes y todo lo vinculado a ellos.",
      "La excepción son los registros de pagos (importe, comisión, estado, fecha e identificadores de Stripe). Debemos conservarlos durante el tiempo que exijan el derecho tributario y mercantil, de 8 a 10 años según el registro (RGPD art. 6.1.c, §§ 147 AO y 257 HGB). Se anonimizan para que ya no remitan a ti. Stripe conserva sus propios registros de pagos según exige la ley.",
      "Otros plazos: registro de inicios de sesión 90 días, dirección IP guardada al registrarte 7 días, contadores de abuso 24 horas, registro de envíos de correos promocionales 90 días, direcciones de la lista de espera sin confirmar 30 días.",
    ],
  },
  {
    title: "Tus derechos",
    body: [
      "Puedes solicitar el acceso a tus datos (RGPD art. 15), su rectificación (art. 16), supresión (art. 17) o limitación (art. 18), y recibirlos en un formato portable (art. 20). La exportación en Ajustes te da una copia en cualquier momento. Puedes oponerte al tratamiento basado en el interés legítimo (art. 21) y retirar cualquier consentimiento para el futuro (art. 7.3). Basta con que escribas a info@comtor.app.",
      "También tienes derecho a presentar una reclamación ante una autoridad de protección de datos. En nuestro caso, es la Comisionada de Protección de Datos y Libertad de Información de Berlín (Berliner Beauftragte für Datenschutz und Informationsfreiheit).",
    ],
  },
  {
    title: "Sin decisiones automatizadas",
    body: [
      "Las solicitudes que ve un creador se determinan mediante reglas sencillas (nicho, idioma del contenido y número de seguidores), no mediante una decisión automatizada con efectos jurídicos o significativos de modo similar (RGPD art. 22).",
    ],
  },
  {
    title: "Cambios",
    body: ["Actualizamos esta política cuando cambia el servicio; la fecha que figura arriba indica la versión vigente."],
  },
  ];
  // Sentry is named only where it is switched on, so the text matches what runs.
  return sentry
    ? sections.map((section) =>
        section.title === ES_SERVICE_PROVIDERS ? { ...section, body: [section.body[0], ES_SENTRY, ...section.body.slice(1)] } : section,
      )
    : sections;
}

const ES_LICENSES: LegalSection[] = [
  {
    title: "Software de código abierto",
    body: [
      "comtor está construido con software de código abierto. Cada paquete se rige por su propia licencia, en su mayoría MIT, Apache-2.0, ISC y BSD. Los textos de las licencias de todo con lo que se construye la app desplegada figuran en el archivo enlazado más abajo.",
    ],
  },
  {
    title: "Fuentes tipográficas",
    body: [
      "El texto está compuesto en Lato, Copyright (c) 2010-2014 by tyPoland Lukasz Dziedzic (team@latofonts.com) con el nombre de fuente reservado \"Lato\", bajo la SIL Open Font License, versión 1.1.",
    ],
  },
  {
    title: "Iconos y nombres de marcas",
    body: [
      "Los iconos de la interfaz proceden de Feather e Ionicons (ambos con licencia MIT); los símbolos de las plataformas sociales son de Simple Icons (CC0). Los nombres y logotipos de Instagram, TikTok, YouTube, Twitch y X pertenecen a sus titulares y se muestran únicamente para nombrar la plataforma.",
    ],
  },
  {
    title: "Fotos",
    body: [
      "Las fotos de producto de la página de inicio proceden de Unsplash y se usan bajo la Unsplash License. Las marcas, los creadores y las valoraciones que se muestran en los ejemplos son inventados.",
    ],
  },
];

export const legalEs: LegalContent = {
  htmlLang: "es",
  notice: "Esta página es una traducción de cortesía. Si hay diferencias, prevalece la versión alemana.",
  updated: "7 de octubre de 2026",
  ui: {
    termsTitle: "Condiciones del servicio",
    termsDescription: "Las condiciones para usar comtor.",
    privacyTitle: "Política de privacidad",
    privacyDescription: "Qué datos personales trata comtor, por qué y qué derechos tienes.",
    imprintTitle: "Aviso legal",
    imprintDescription: "Información conforme al § 5 DDG.",
    vatLabel: "Número de identificación a efectos del IVA",
    licensesTitle: "Licencias de código abierto",
    licensesDescription: "Qué software, fuentes e imágenes usa comtor y bajo qué licencias.",
    licensesTextFile: "Textos de las licencias de todos los paquetes de código abierto (archivo de texto)",
    licensesOfl: "Lato: SIL Open Font License",
  },
  terms: esTerms,
  privacy: esPrivacy,
  imprint: {
    lead: "Información conforme al § 5 DDG.",
    rows: [
      { label: "Prestador del servicio", lines: ["Teethawat Kanpai", "Empresario individual (Einzelunternehmen)", "Sonnenscheinpfad 64", "12277 Berlín, Alemania"] },
      { label: "Contacto", lines: ["info@comtor.app", "+49 172 4134526"] },
      { label: "Responsable del contenido", lines: ["Teethawat Kanpai, dirección indicada arriba (§ 18 apdo. 2 MStV)"] },
    ],
    disputeTitle: "Resolución de litigios en materia de consumo",
    dispute: "No estamos dispuestos ni obligados a participar en procedimientos de resolución de litigios ante una junta arbitral de consumo.",
  },
  licenses: ES_LICENSES,
};
