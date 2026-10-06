import { NICHES, PLATFORM_FEE_RATE, RELEASE_REVIEW_DAYS } from "@/lib/constants";

// The German search landing pages (/ugc and /ugc/<slug>). One page per niche, each with its own text: a
// page only earns its place in search if it says something the others don't. Add a niche by adding an entry
// here; it is picked up by the page, its share image and the sitemap. No invented numbers, quotes or
// testimonials, and no "escrow" wording on public pages until the payment model is cleared (see
// docs/legal-readiness.md).

type Niche = (typeof NICHES)[number];

export type UgcNichePage = {
  slug: string;
  niche: Niche;
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

export const UGC_NICHE_PAGES: UgcNichePage[] = [
  {
    slug: "beauty",
    niche: "Beauty",
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
