import type { faq } from "@/lib/i18n/messages/faq-en";
import type { DeepString } from "@/lib/i18n/messages/types";

export const faqDe: DeepString<typeof faq> = {
  meta: {
    title: "FAQ",
    description: "So funktionieren Matching, Zahlungen und Bewertungen bei comtor.",
  },
  proOffer:
    " Abonniere Pro für {price} im Monat, und die Gebühr sinkt auf {proFee} %. Das gilt für jede Zahlung, bei der eine der beiden Seiten Pro hat.",
  items: {
    matching: {
      question: "Wie funktioniert das Matching?",
      answer:
        "Marken stellen eine Anfrage mit Nische, Inhaltssprachen, Mindestzahl an Followern und Produktkategorie ein. Creator wählen bis zu 3 Nischen. Unter „Für dich“ sehen sie Anfragen aus diesen Nischen, wenn die Anfrage in ihrer Inhaltssprache verfasst ist und eine ihrer Plattformen die Follower-Mindestzahl erreicht. Unter „Alle“ sehen sie jede Anfrage, die zu Sprache und Reichweite passt. Niemand prüft Matches von Hand: Eine passende Anfrage erscheint im Feed.",
    },
    reachOut: {
      question: "Wie nehme ich Kontakt auf?",
      answer:
        "Tippe bei einer passenden Anfrage auf „Interessiert“. Das öffnet einen Chat, in dem sich beide Seiten direkt schreiben. Beide sehen außerdem die Kontakt-E-Mail der anderen Seite.",
    },
    payments: {
      question: "Wie laufen Zahlungen?",
      answer:
        "Die Marke bezahlt den Creator über comtor, nie direkt. Das Geld wird zurückgehalten, bis der Creator gepostet und den Link eingereicht hat. Dann hat die Marke {days} Tage Zeit, den Post freizugeben (das Geld geht sofort an den Creator) oder ein Problem zu melden. Keine Antwort nach {days} Tagen? Dann wird das Geld automatisch freigegeben. comtor behält {fee} % jeder Zahlung.{proOffer}",
    },
    pro: {
      question: "Was ist der Pro-Tarif?",
      answer:
        "Ein optionales Monatsabo für Marken und Creator ({price} im Monat). Es senkt die Gebühr von {fee} % auf {proFee} % bei jeder Zahlung, bei der die Marke oder der Creator Pro hat. Eine Seite reicht. Pro rechnet sich, sobald etwa {breakEven} im Monat über dein Konto laufen. Stripe rechnet monatlich ab. Verwalte oder kündige es in den Einstellungen. Die ersten {foundingBrands} Marken und die ersten {foundingCreators} Creator bekommen Pro kostenlos, solange ihr Konto besteht.",
    },
    noPost: {
      question: "Was, wenn der Creator nie postet?",
      answer:
        "Die Marke storniert die Zahlung jederzeit, bevor der Creator den Post einreicht, und bekommt den vollen Betrag zurück. Ist ein Post eingereicht, aber stimmt etwas nicht (fehlt, gelöscht, nicht wie abgesprochen), meldet die Marke innerhalb von {days} Tagen ein Problem. Das Geld bleibt zurückgehalten, während wir den Fall prüfen. Danach geben wir es an den Creator frei oder erstatten es der Marke. Eine freigegebene Zahlung lässt sich nicht rückgängig machen. Bewertungen beider Seiten zeigen dir vor der Zahlung, wer verlässlich ist.",
    },
    realMoney: {
      question: "Ist das echtes Geld?",
      answer: "Ja. Zahlungen für Kooperationen und das Pro-Abo laufen über Stripe. Echtes Geld fließt zwischen echten Bankkonten.",
    },
    followers: {
      question: "Wie werden Followerzahlen geprüft?",
      answer:
        "Creator tragen sie selbst ein. Jede Plattform verlinkt auf den echten Account, so prüfst du die tatsächliche Zahl, bevor du Kontakt aufnimmst.",
    },
    reviews: {
      question: "Kann ich eine Bewertung abgeben?",
      answer:
        "Ja. Sobald eine Zahlung freigegeben ist, kann jede Seite eine Bewertung mit kurzem Kommentar abgeben. Bewertungen stehen auf öffentlichen Profilen und helfen anderen bei der Wahl.",
    },
    contact: {
      question: "Wie erreiche ich euch?",
      answer: "Unsere Kontaktdaten findest du im Impressum.",
    },
  },
};
