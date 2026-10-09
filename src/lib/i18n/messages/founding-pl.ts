import type { founding } from "@/lib/i18n/messages/founding-en";
import type { DeepString } from "@/lib/i18n/messages/types";

// Miejsca założycielskie: pierwsze marki i pierwsi twórcy dostają Pro, dopóki istnieje ich konto
// (src/lib/founding.ts).
export const foundingPl: DeepString<typeof founding> = {
  teaser: "Pro za darmo dla pierwszych {total} marek, dopóki istnieje ich konto. Zostało {left} miejsc.",
  teaserLast: "Pro za darmo dla pierwszych {total} marek, dopóki istnieje ich konto. Zostało tylko 1 miejsce.",
  ofTotal: "z {total} marek założycielskich",
  title: "Pro jest dla ciebie darmowe na stałe.",
  body: "Dopóki istnieje twoje konto. comtor zatrzymuje {pro}% zamiast {standard}% każdej płatności.",
  perkFee: "Prowizja {pro}% zamiast {standard}% od każdej płatności",
  perkPrice: "Bez opłaty miesięcznej, bez subskrypcji, nic do anulowania",
  doneLine: "Marka założycielska nr {n}: Pro jest dla ciebie darmowe, dopóki istnieje twoje konto.",
  planTitle: "Pro · Marka założycielska nr {n}",
  planBody:
    "Pro jest dla ciebie darmowe, dopóki istnieje twoje konto: {pro}% zamiast {standard}% od każdej płatności. Nic nie płacisz i nic nie anulujesz.",
  feeLine: "Marka założycielska nr {n}: prowizja {pro}% od płatności zamiast {standard}%.",
  creator: {
    teaser: "Pro za darmo dla pierwszych {total} twórców, dopóki istnieje ich konto. Zostało {left} miejsc.",
    teaserLast: "Pro za darmo dla pierwszych {total} twórców, dopóki istnieje ich konto. Zostało tylko 1 miejsce.",
    ofTotal: "z {total} twórców założycieli",
    body: "Dopóki istnieje twoje konto. comtor zatrzymuje {pro}% zamiast {standard}% każdej płatności, więc zatrzymujesz {keep}%.",
    doneLine: "Twórca założyciel nr {n}: Pro jest dla ciebie darmowe, dopóki istnieje twoje konto.",
    planTitle: "Pro · Twórca założyciel nr {n}",
    feeLine: "Twórca założyciel nr {n}: prowizja {pro}% od płatności zamiast {standard}%.",
  },
};
