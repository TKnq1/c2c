import { UGC_CREATOR_PAGE, UGC_HUB_FAQS, UGC_NICHE_PAGES } from "@/lib/seo-pages";
import type { UgcContent } from "@/lib/ugc/types";

// German is the default and the source: the niche pages, the overview questions and the creator page live in
// src/lib/seo-pages.ts. Here they are joined with the page texts.
export const ugcContentDe: UgcContent = {
  htmlLang: "de",
  ogLocale: "de_DE",
  ui: {
    hubTitle: "UGC-Creator finden und beauftragen",
    hubDescription:
      "Marken finden UGC-Creator für Videos und Fotos, Creator bezahlte Aufträge. Anfrage einstellen, im Chat absprechen, über die Plattform bezahlen. Kostenlos.",
    hubIntro:
      "Marken brauchen Videos und Fotos von echten Menschen, Creator wollen dafür bezahlt werden. comtor bringt beide zusammen: Die Marke stellt eine Anfrage ein, passende Creator melden sich, bezahlt wird über die Plattform.",
    signupNote: "Kostenlos anmelden. comtor läuft im Browser, die Sprache wählst du beim Start.",
    creatorCardTitle: "Du bist Creator?",
    creatorCardBody:
      "So findest du bezahlte UGC-Aufträge und wirst über die Plattform bezahlt: Als UGC-Creator Geld verdienen.",
    byNicheTitle: "UGC nach Nische",
    howTitle: "So funktioniert comtor",
    forBrands: "Für Marken",
    forCreators: "Für Creator",
    hubBrandSteps: [
      "Anfrage einstellen: Nische, Sprache, Mindestzahl an Followern, Produktkategorie, Budget und Lieferumfang.",
      "Creator melden sich: Wer passt, sieht die Anfrage im Feed und schreibt dir im Chat.",
      "Bezahlen und freigeben: Du zahlst über die Plattform und gibst den Post frei, wenn er passt.",
    ],
    hubCreatorSteps: [
      "Profil anlegen: Bis zu drei Nischen und deine Plattformen mit der jeweiligen Followerzahl.",
      "Anfragen ansehen: Im Feed siehst du Budget und Anforderungen, bevor du dich meldest.",
      "Posten und bezahlt werden: Nach dem Post reichst du den Link ein. Sobald die Marke ihn freigibt (spätestens nach {days} Tagen), wird die Zahlung ausgezahlt.",
    ],
    faqTitle: "Häufige Fragen",
    formatsTitle: "Diese Formate funktionieren in der Nische „{label}“",
    nicheBrandSteps: [
      "Anfrage einstellen: Nische {label}, Sprache, Mindestzahl an Followern, Budget und Lieferumfang.",
      "Creator melden sich: Wer passt, sieht die Anfrage im Feed und schreibt dir im Chat.",
      "Bezahlen und freigeben: Du zahlst über die Plattform und gibst den Post frei, wenn er passt.",
    ],
    nicheCreatorSteps: [
      "Profil anlegen: Bis zu drei Nischen, zum Beispiel {label}, und deine Plattformen mit der jeweiligen Followerzahl.",
      "Anfragen ansehen: Im Feed siehst du Budget und Anforderungen, bevor du dich meldest.",
      "Posten und bezahlt werden: Nach dem Post reichst du den Link ein. Sobald die Marke ihn freigibt (spätestens nach {days} Tagen), wird die Zahlung ausgezahlt.",
    ],
    nicheReadyTitle: "Bereit für deinen ersten Auftrag in der Nische „{label}“?",
    overviewLead: "Was UGC ist und wie comtor funktioniert, erklären wir im Überblick:",
    overviewLink: "UGC-Creator finden",
    creatorCrumb: "Creator werden",
    creatorFooterLink: "Creator werden",
    creatorDoingTitle: "Was UGC-Creator machen",
    creatorStartTitle: "So startest du auf comtor",
    creatorTipsTitle: "Tipps für gute UGC-Inhalte",
    creatorReadyTitle: "Bereit für deinen ersten bezahlten Auftrag?",
    creatorBrandHint: "Du suchst Creator für deine Marke? Was UGC ist und wie comtor funktioniert, erklären wir im Überblick:",
    nicheNavLabel: "UGC nach Nische",
  },
  niches: UGC_NICHE_PAGES,
  hubFaqs: UGC_HUB_FAQS,
  creator: UGC_CREATOR_PAGE,
};
