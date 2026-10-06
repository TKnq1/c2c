import { NICHES, PLATFORM_FEE_RATE, PLATFORMS, RELEASE_REVIEW_DAYS } from "@/lib/constants";

// The German search landing pages (/ugc and /ugc/<slug>). One page per niche, each with its own text: a
// page only earns its place in search if it says something the others don't. Add a niche by adding an entry
// here; it is picked up by the page, its share image and the sitemap. No invented numbers, quotes or
// testimonials, and no "escrow" wording on public pages until the payment model is cleared (see
// docs/legal-readiness.md).

type Niche = (typeof NICHES)[number];

export type UgcNichePage = {
  slug: string;
  niche: Niche;
  // The niche's name in the German app (src/lib/i18n/messages/screens-de.ts), as people see it after choosing
  // German in the wizard.
  label: string;
  // <title> (the site adds " · comtor") and meta description.
  title: string;
  description: string;
  heading: string;
  // The heading split over two lines for the share image.
  ogLines: [string, string];
  lead: string;
  formats: { title: string; text: string }[];
  // Niche-specific questions; the shared ones follow (see ugcFaqs).
  faqs: { question: string; answer: string }[];
};

const NBSP = " ";
const FEE = `${PLATFORM_FEE_RATE * 100}${NBSP}%`;

// Questions every page answers the same way, because the answer is the same.
function sharedFaqs(): { question: string; answer: string }[] {
  return [
    {
      question: "Wie läuft die Bezahlung ab?",
      answer: `Die Marke zahlt über die Plattform und nicht direkt an den Creator. Das Geld wird erst freigegeben, wenn der Creator den Beitrag gepostet und den Link eingereicht hat und die Marke ihn bestätigt. Die Marke hat dafür ${RELEASE_REVIEW_DAYS} Tage Zeit und kann in dieser Zeit ein Problem melden. Reagiert sie nicht, wird die Zahlung automatisch freigegeben. Die Zahlungen laufen über Stripe.`,
    },
    {
      question: "Was kostet comtor?",
      answer: `Die Anmeldung ist kostenlos und es gibt keine Grundgebühr. comtor behält ${FEE} jeder Zahlung, sie werden von der Auszahlung des Creators abgezogen. Die Marke zahlt genau den vereinbarten Betrag. Für Marken, die regelmäßig Aufträge vergeben, gibt es ein optionales Pro-Abo mit niedrigerer Gebühr.`,
    },
    {
      question: "Müssen bezahlte Beiträge als Werbung gekennzeichnet werden?",
      answer:
        "In Deutschland in der Regel ja: Wer für einen Beitrag bezahlt wird, muss ihn als Werbung kennzeichnen, wenn der kommerzielle Zweck nicht ohnehin erkennbar ist. Klärt die Kennzeichnung vor dem Posten im Chat ab. Das ist keine Rechtsberatung.",
    },
    {
      question: "Wie werden die Follower-Zahlen geprüft?",
      answer:
        "Sie sind selbst angegeben. Jede Plattform, die ein Creator einträgt, ist mit dem echten Account verlinkt, sodass Marken die Zahl vor der ersten Nachricht selbst nachsehen können. Marken legen in ihrer Anfrage eine Mindestzahl fest, nur passende Creator sehen sie.",
    },
  ];
}

// The two questions about finding each other, for the pages that don't need a niche-specific answer.
function matchingFaqs(opts: {
  label: string;
  brandWho: string;
  creatorFrom: string;
  categories?: string;
}): { question: string; answer: string }[] {
  const hint = opts.categories ? ` (${opts.categories})` : "";
  return [
    {
      question: `Wie finde ich als ${opts.brandWho} passende Creator?`,
      answer: `Du stellst eine Anfrage ein: Nische ${opts.label}, Sprache der Inhalte, Mindestzahl an Followern, Produktkategorie${hint}, Budget, Plattform und Lieferumfang. Creator, die ${opts.label} als Nische gewählt haben und zu Sprache und Reichweite passen, sehen sie in ihrem Feed und melden sich bei Interesse im Chat. Eine manuelle Freigabe durch comtor gibt es nicht.`,
    },
    {
      question: `Wo finde ich als Creator Aufträge ${opts.creatorFrom}?`,
      answer: `Du legst dein Profil an, wählst bis zu drei Nischen, zum Beispiel ${opts.label}, und trägst deine Plattformen mit Followerzahl ein. Im Feed siehst du unter „Für dich“ Anfragen aus deinen Nischen und unter „Alle“ alles, was zu deiner Sprache und Reichweite passt, jeweils mit Budget und Anforderungen. Mit einem Tipp auf „Interessiert“ startest du den Chat mit der Marke.`,
    },
  ];
}

const PLATFORM_LIST = `${PLATFORMS.slice(0, -1).join(", ")} und ${PLATFORMS[PLATFORMS.length - 1]}`;

export const UGC_NICHE_PAGES: UgcNichePage[] = [
  {
    slug: "beauty",
    niche: "Beauty",
    label: "Beauty",
    title: "UGC-Creator für Beauty-Marken finden",
    description:
      "Beauty-Marken finden UGC-Creator für Routine-Videos, Unboxings und Produktfotos. Creator finden bezahlte Aufträge aus ihrer Nische. Kostenlos starten.",
    heading: "UGC-Creator für Beauty-Marken finden",
    ogLines: ["UGC-Creator für", "Beauty-Marken finden."],
    lead: "Hautpflege, Make-up, Haarpflege, Düfte: Wer ein Beauty-Produkt kauft, will sehen, wie es bei echten Menschen aussieht. comtor bringt Beauty-Marken mit Creatorn zusammen, die genau solche Videos und Fotos machen, und Creatorn mit bezahlten Aufträgen aus ihrer Nische.",
    formats: [
      {
        title: "Routine-Video",
        text: "Morgen- oder Abendroutine, in der das Produkt Schritt für Schritt vorkommt. Funktioniert organisch und als Anzeige.",
      },
      {
        title: "Unboxing und erste Eindrücke",
        text: "Auspacken, ausprobieren, ehrlich sagen, was auffällt. Gut für Neuheiten und Sets.",
      },
      {
        title: "Anwendung im Detail",
        text: "Wie wird das Produkt aufgetragen, wie fühlt es sich an, wie lange hält es? Nahaufnahmen statt Studio-Look.",
      },
      {
        title: "Fotos im Alltag",
        text: "Produktfotos im Bad, am Schminktisch oder unterwegs, für Shop, Social Media und Anzeigen.",
      },
    ],
    faqs: [
      {
        question: "Wie finde ich als Beauty-Marke passende Creator?",
        answer:
          "Du stellst eine Anfrage ein: Nische Beauty, Sprache der Inhalte, Mindestzahl an Followern, Produktkategorie, Budget, Plattform und was geliefert werden soll. Creator, die Beauty als Nische gewählt haben und zu Sprache und Reichweite passen, sehen sie in ihrem Feed. Wer interessiert ist, meldet sich bei dir im Chat. Eine manuelle Freigabe durch comtor gibt es nicht.",
      },
      {
        question: "Wo finde ich als Creator Aufträge von Beauty-Marken?",
        answer:
          "Du legst dein Profil an, wählst bis zu drei Nischen, zum Beispiel Beauty, und trägst deine Plattformen mit Followerzahl ein. Im Feed siehst du unter „Für dich“ Anfragen aus deinen Nischen und unter „Alle“ alles, was zu deiner Sprache und Reichweite passt, jeweils mit Budget und Anforderungen. Mit einem Tipp auf „Interessiert“ öffnest du den Chat mit der Marke.",
      },
      {
        question: "Bekomme ich das Produkt kostenlos?",
        answer:
          "Das legt die Marke in ihrer Anfrage fest: Dort steht, ob das Produkt dabei ist. Alles Weitere, etwa Lieferumfang und Termin, klärt ihr vorher im Chat.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "fitness",
    niche: "Fitness",
    label: "Fitness",
    title: "UGC-Creator für Fitness-Marken finden",
    description:
      "Fitness-Marken finden UGC-Creator für Workout-Videos, Produkttests und App-Demos. Creator finden bezahlte Aufträge aus ihrer Nische. Kostenlos starten.",
    heading: "UGC-Creator für Fitness-Marken finden",
    ogLines: ["UGC-Creator für", "Fitness-Marken finden."],
    lead: "Sportbekleidung, Equipment, Supplements, Fitness-Apps: Im Fitness-Bereich überzeugt, was Menschen wirklich benutzen. comtor bringt Fitness-Marken mit Creatorn zusammen, die Training und Alltag glaubwürdig zeigen, und Creatorn mit bezahlten Aufträgen aus ihrer Nische.",
    formats: [
      {
        title: "Workout mit Produkt",
        text: "Eine Trainingseinheit, in der Kleidung, Equipment oder Zubehör im Einsatz zu sehen ist.",
      },
      {
        title: "Produkttest nach ein paar Wochen",
        text: "Ehrlicher Rückblick: Passform, Haltbarkeit, Handhabung. Hilft Käufern bei der Entscheidung.",
      },
      {
        title: "Alltag und Routine",
        text: "Trainingsplan, Meal-Prep oder Morgenroutine, in der das Produkt ein natürlicher Teil des Tages ist.",
      },
      {
        title: "App- und Tracker-Demo",
        text: "Bildschirmaufnahme mit Kommentar: Wie läuft ein Training mit der App, was zeigt der Tracker?",
      },
    ],
    faqs: [
      {
        question: "Wie finde ich als Fitness-Marke passende Creator?",
        answer:
          "Du stellst eine Anfrage ein: Nische Fitness, Sprache der Inhalte, Mindestzahl an Followern, Produktkategorie (zum Beispiel Sportbekleidung, Supplements oder App), Budget, Plattform und Lieferumfang. Creator, die Fitness als Nische gewählt haben und zu Sprache und Reichweite passen, sehen sie in ihrem Feed und melden sich bei Interesse im Chat.",
      },
      {
        question: "Wo finde ich als Creator Aufträge von Fitness-Marken?",
        answer:
          "Du legst dein Profil an, wählst bis zu drei Nischen, zum Beispiel Fitness, und trägst deine Plattformen mit Followerzahl ein. Im Feed siehst du unter „Für dich“ Anfragen aus deinen Nischen und unter „Alle“ alles, was zu deiner Sprache und Reichweite passt. Mit „Interessiert“ startest du den Chat.",
      },
      {
        question: "Was gilt bei Supplements und Aussagen zur Wirkung?",
        answer:
          "Für Aussagen zu Gesundheit und Wirkung gelten strenge Regeln. Sprecht bei Nahrungsergänzungsmitteln vor dem Dreh im Chat ab, was gesagt werden darf und was nicht. Das ist keine Rechtsberatung.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "food",
    niche: "Food",
    label: "Essen",
    title: "UGC-Creator für Food-Marken finden",
    description:
      "Food-Marken finden UGC-Creator für Rezept-Videos, Verkostungen und Food-Fotos. Creator finden bezahlte Aufträge aus ihrer Nische. Kostenlos starten.",
    heading: "UGC-Creator für Food-Marken finden",
    ogLines: ["UGC-Creator für", "Food-Marken finden."],
    lead: "Snacks, Getränke, Gewürze, Kochboxen, Backzutaten: Bei Essen und Trinken zählt, ob man es sofort selbst probieren möchte. comtor bringt Food-Marken mit Creatorn zusammen, die kochen, probieren und zeigen, und Creatorn mit bezahlten Aufträgen aus ihrer Nische.",
    formats: [
      {
        title: "Rezept-Video",
        text: "Ein Gericht oder Getränk Schritt für Schritt, mit dem Produkt als Zutat. Zeigt, wie man es verwendet.",
      },
      {
        title: "Verkostung und erste Eindrücke",
        text: "Probieren und ehrlich beschreiben, was auffällt. Passt zu Neuheiten, Sorten und Geschenksets.",
      },
      {
        title: "Unboxing der Box",
        text: "Kochbox, Probierpaket oder Geschenkset auspacken und vorstellen.",
      },
      {
        title: "Alltag und Meal-Prep",
        text: "Frühstück, Vorkochen für die Woche oder der Snack zwischendurch: das Produkt als normaler Teil des Tages.",
      },
      {
        title: "Food-Fotos",
        text: "Gerichte und Produkte fotografiert, für Shop, Social Media und Anzeigen.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Essen",
        brandWho: "Food-Marke",
        creatorFrom: "von Food-Marken",
        categories: "zum Beispiel Essen und Getränke",
      }),
      {
        question: "Wer kümmert sich um den Versand der Produkte?",
        answer:
          "Die Marke legt in ihrer Anfrage fest, ob das Produkt dabei ist. Wie und wann es ankommt, vor allem bei gekühlten oder schnell verderblichen Waren, stimmt ihr vorher im Chat ab.",
      },
      {
        question: "Was gilt bei Aussagen zu Gesundheit und Wirkung?",
        answer:
          "Aussagen wie „gesund“ oder „stärkt das Immunsystem“ sind bei Lebensmitteln streng geregelt. Sprecht vorher im Chat ab, was gesagt werden darf. Das ist keine Rechtsberatung.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "mode",
    niche: "Fashion",
    label: "Mode",
    title: "UGC-Creator für Mode-Marken finden",
    description:
      "Mode-Marken finden UGC-Creator für Outfit-Videos, Anproben und Styling-Fotos. Creator finden bezahlte Aufträge aus ihrer Nische. Kostenlos starten.",
    heading: "UGC-Creator für Mode-Marken finden",
    ogLines: ["UGC-Creator für", "Mode-Marken finden."],
    lead: "Kleidung, Schuhe, Accessoires, Schmuck: Mode wird gekauft, weil man sich darin sehen kann. comtor bringt Mode-Marken mit Creatorn zusammen, die Teile tragen, kombinieren und zeigen, wie sie im Alltag sitzen, und Creatorn mit bezahlten Aufträgen aus ihrer Nische.",
    formats: [
      {
        title: "Outfit-Video",
        text: "Ein Teil, mehrere Looks: wie sich ein Stück kombinieren lässt, für Arbeit, Freizeit und Abend.",
      },
      {
        title: "Anprobe mit ehrlichem Feedback",
        text: "Passform, Material und Größe im Vergleich zur Größentabelle, in eigenen Worten.",
      },
      {
        title: "Haul und Unboxing",
        text: "Lieferung auspacken und die Teile der Reihe nach vorstellen.",
      },
      {
        title: "Styling-Fotos im Alltag",
        text: "Looks auf der Straße, im Café oder zu Hause, für Shop, Social Media und Anzeigen.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Mode",
        brandWho: "Mode-Marke",
        creatorFrom: "von Mode-Marken",
        categories: "zum Beispiel Mode",
      }),
      {
        question: "Was ist mit Größe und Passform?",
        answer:
          "Die Größe klärt ihr vorab im Chat, damit das Teil passt und der Beitrag gelingt. Ob das Produkt dabei ist, steht in der Anfrage der Marke.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "tech",
    niche: "Tech",
    label: "Technik",
    title: "UGC-Creator für Tech-Marken finden",
    description:
      "Tech-Marken finden UGC-Creator für Unboxings, Alltagstests und App-Demos. Creator finden bezahlte Aufträge aus ihrer Nische. Kostenlos starten.",
    heading: "UGC-Creator für Tech-Marken finden",
    ogLines: ["UGC-Creator für", "Tech-Marken finden."],
    lead: "Gadgets, Zubehör, Smart Home, Software und Apps: Bei Technik wollen Käufer sehen, wie ein Produkt im Alltag funktioniert. comtor bringt Tech-Marken mit Creatorn zusammen, die auspacken, einrichten und erklären, und Creatorn mit bezahlten Aufträgen aus ihrer Nische.",
    formats: [
      {
        title: "Unboxing und Einrichtung",
        text: "Auspacken, einschalten, einrichten: die ersten Minuten mit dem Produkt, so wie Käufer sie erleben.",
      },
      {
        title: "Alltagstest",
        text: "Eine Woche mit dem Produkt: Was klappt, was nervt, für wen lohnt es sich?",
      },
      {
        title: "Feature-Demo",
        text: "Bildschirmaufnahme oder Nahaufnahme mit Erklärung einer Funktion, die man sonst übersieht.",
      },
      {
        title: "So geht’s",
        text: "Kurzes Tutorial: Wie löse ich mit dem Produkt ein typisches Problem?",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Technik",
        brandWho: "Tech-Marke",
        creatorFrom: "von Tech-Marken",
        categories: "zum Beispiel Elektronik oder Software/App",
      }),
      {
        question: "Wie bekomme ich als Creator Zugang zu Geräten oder Software?",
        answer:
          "Bei Geräten legt die Marke in der Anfrage fest, ob das Produkt dabei ist. Bei Software und Apps stimmt ihr im Chat ab, wie du Zugang zu einem Testkonto oder einer Vollversion bekommst.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "reisen",
    niche: "Travel",
    label: "Reisen",
    title: "UGC-Creator für Reiseanbieter finden",
    description:
      "Hotels, Reiseanbieter und Reisemarken finden UGC-Creator für Reise-Reels, Unterkunfts-Rundgänge und Fotos. Kostenlos starten.",
    heading: "UGC-Creator für Reiseanbieter finden",
    ogLines: ["UGC-Creator für", "Reiseanbieter finden."],
    lead: "Hotels, Ferienunterkünfte, Reiseveranstalter, Gepäck und Reise-Apps: Reisen bucht man nach den Bildern und Erfahrungen anderer. comtor bringt Reiseanbieter mit Creatorn zusammen, die Orte und Unterkünfte so zeigen, wie man sie vor Ort erlebt, und Creatorn mit bezahlten Aufträgen aus ihrer Nische.",
    formats: [
      {
        title: "Reise-Reel",
        text: "Ein Ort in 30 Sekunden: Ankunft, die besten Momente, ein Tipp zum Mitnehmen.",
      },
      {
        title: "Unterkunft im Rundgang",
        text: "Zimmer, Aussicht, Frühstück, Details: wie es wirklich aussieht und sich anfühlt.",
      },
      {
        title: "Drei Tipps vor Ort",
        text: "Kurzes Format mit Lieblingsorten, Essen und Wegen abseits der bekannten Route.",
      },
      {
        title: "Packliste und Reise-Zubehör",
        text: "Koffer, Rucksack, Adapter: Produkte im echten Einsatz unterwegs.",
      },
      {
        title: "Foto-Serie",
        text: "Bilder von Ort und Unterkunft, für Website, Social Media und Anzeigen.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Reisen",
        brandWho: "Reiseanbieter",
        creatorFrom: "aus dem Reisebereich",
      }),
      {
        question: "Wer zahlt Anreise und Unterkunft?",
        answer:
          "Das klärt ihr vorher im Chat und haltet es fest. Die Anfrage nennt das Budget für den Beitrag. Ob Reise, Unterkunft oder Leistungen vor Ort zusätzlich enthalten sind, vereinbart ihr ausdrücklich.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "gaming",
    niche: "Gaming",
    label: "Gaming",
    title: "UGC-Creator für Gaming-Marken finden",
    description:
      "Gaming-Marken finden UGC-Creator für Gameplay-Clips, Hardware-Tests und erste Eindrücke. Creator finden bezahlte Aufträge. Kostenlos starten.",
    heading: "UGC-Creator für Gaming-Marken finden",
    ogLines: ["UGC-Creator für", "Gaming-Marken finden."],
    lead: "Spiele, Konsolen, PC-Hardware, Zubehör und Gaming-Apps: Spieler vertrauen Leuten, die selbst spielen. comtor bringt Gaming-Marken mit Creatorn zusammen, die spielen, testen und kommentieren, und Creatorn mit bezahlten Aufträgen aus ihrer Nische.",
    formats: [
      {
        title: "Gameplay-Clip",
        text: "Eine Szene aus dem Spiel mit Kommentar: Was macht es besonders, was fällt auf?",
      },
      {
        title: "Erste Eindrücke",
        text: "Die ersten Stunden in einem neuen Spiel, offen und ohne Drehbuch.",
      },
      {
        title: "Hardware-Test",
        text: "Maus, Headset, Tastatur oder Controller im Einsatz: Gefühl, Qualität, Alltagstauglichkeit.",
      },
      {
        title: "Highlights aus Stream oder Session",
        text: "Die besten Momente aus einem Stream oder einer Spielrunde, kurz geschnitten.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Gaming",
        brandWho: "Gaming-Marke",
        creatorFrom: "von Gaming-Marken",
      }),
      {
        question: "Auf welchen Plattformen kann ich posten?",
        answer: `Creator tragen ihre Plattformen mit Followerzahl ein: ${PLATFORM_LIST}. Die Marke legt in ihrer Anfrage fest, wo gepostet werden soll.`,
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "lifestyle",
    niche: "Lifestyle",
    label: "Lifestyle",
    title: "UGC-Creator für Lifestyle-Marken finden",
    description:
      "Lifestyle-Marken finden UGC-Creator für Alltags-Videos, Home-Looks und Produktfotos. Creator finden bezahlte Aufträge. Kostenlos starten.",
    heading: "UGC-Creator für Lifestyle-Marken finden",
    ogLines: ["UGC-Creator für", "Lifestyle-Marken finden."],
    lead: "Wohnen, Haushalt, Organisation, Wellness, Accessoires: Lifestyle-Produkte überzeugen, wenn man sie im echten Alltag sieht. comtor bringt Lifestyle-Marken mit Creatorn zusammen, die ihren Alltag zeigen, und Creatorn mit bezahlten Aufträgen aus ihrer Nische.",
    formats: [
      {
        title: "Ein Tag mit dem Produkt",
        text: "Vom Morgen bis zum Abend: wo das Produkt im Alltag auftaucht und was es leichter macht.",
      },
      {
        title: "Home-Look",
        text: "Wohnung, Ecke oder Regal mit dem Produkt eingerichtet. Zeigt, wie es in echten vier Wänden wirkt.",
      },
      {
        title: "Unboxing und Aufbau",
        text: "Auspacken, aufbauen, ausprobieren, inklusive der Stolpersteine.",
      },
      {
        title: "Routine und Gewohnheiten",
        text: "Morgen-, Abend- oder Sonntagsroutine, in der das Produkt natürlich vorkommt.",
      },
      {
        title: "Alltagsfotos",
        text: "Produktfotos in echten Situationen, für Shop, Social Media und Anzeigen.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Lifestyle",
        brandWho: "Lifestyle-Marke",
        creatorFrom: "von Lifestyle-Marken",
      }),
      {
        question: "Was, wenn mein Content mehrere Themen mischt?",
        answer:
          "Du kannst bis zu drei Nischen wählen, zum Beispiel Lifestyle, Mode und Essen. Im Feed siehst du unter „Für dich“ zuerst Anfragen aus diesen Nischen und unter „Alle“ alles, was zu deiner Sprache und Reichweite passt.",
      },
      ...sharedFaqs(),
    ],
  },
];

export function getUgcNichePage(slug: string): UgcNichePage | undefined {
  return UGC_NICHE_PAGES.find((page) => page.slug === slug);
}

// Questions for the overview page /ugc.
export const UGC_HUB_FAQS: { question: string; answer: string }[] = [
  {
    question: "Was ist UGC?",
    answer:
      "UGC steht für User Generated Content. Im Marketing sind das Videos und Fotos, die echte Menschen für eine Marke erstellen: Produkt ausprobieren, filmen, zeigen. Die Marke nutzt sie auf ihren Kanälen, im Shop oder in Anzeigen. Es zählt der Inhalt, nicht die Reichweite des Creators.",
  },
  {
    question: "Was ist der Unterschied zu Influencer-Marketing?",
    answer:
      "Beim Influencer-Marketing steht die Reichweite einer Person im Mittelpunkt: Der Beitrag erscheint auf ihrem Kanal. Bei UGC steht der Inhalt im Mittelpunkt, auch kleinere Creator können gute Videos liefern. Auf comtor legt die Marke in ihrer Anfrage fest, welche Plattform und welche Mindestzahl an Followern sie möchte, und kann beides offen halten.",
  },
  {
    question: "Wie finde ich UGC-Creator für meine Marke?",
    answer:
      "Du legst kostenlos ein Markenprofil an und stellst eine Anfrage ein: Nische, Sprache, Produktkategorie, Budget und was geliefert werden soll. Passende Creator sehen sie in ihrem Feed und melden sich im Chat.",
  },
  ...sharedFaqs(),
];

export const UGC_PATH = "/ugc";
export const ugcNicheHref = (slug: string) => `${UGC_PATH}/${slug}`;
