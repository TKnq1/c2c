import type { founding } from "@/lib/i18n/messages/founding-en";
import type { DeepString } from "@/lib/i18n/messages/types";

// Die Founding Brands: Die ersten Marken bekommen Pro, solange ihr Konto besteht (src/lib/founding.ts).
export const foundingDe: DeepString<typeof founding> = {
  teaser: "Die ersten {total} Marken bekommen Pro kostenlos, solange ihr Konto besteht. Noch {left} Plätze frei.",
  teaserLast: "Die ersten {total} Marken bekommen Pro kostenlos, solange ihr Konto besteht. Nur noch 1 Platz frei.",
  ofTotal: "von {total} Founding Brands",
  title: "Pro ist für dich dauerhaft kostenlos.",
  body: "Solange dein Konto besteht. comtor behält {pro} % statt {standard} % von jeder Zahlung.",
  perkFee: "{pro} % statt {standard} % Gebühr auf jede Zahlung",
  perkPrice: "Kein Monatspreis, kein Abo, nichts zu kündigen",
  doneLine: "Founding Brand Nr. {n}: Pro ist für dich kostenlos, solange dein Konto besteht.",
  planTitle: "Pro · Founding Brand Nr. {n}",
  planBody:
    "Pro ist für dich kostenlos, solange dein Konto besteht: {pro} % statt {standard} % auf jede Zahlung. Du musst nichts bezahlen und nichts kündigen.",
  feeLine: "Founding Brand Nr. {n}: {pro} % Gebühr pro Zahlung statt {standard} %.",
};
