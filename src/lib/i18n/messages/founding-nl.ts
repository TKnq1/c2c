import type { founding } from "@/lib/i18n/messages/founding-en";
import type { DeepString } from "@/lib/i18n/messages/types";

// De Founding-plekken: de eerste merken en de eerste creators krijgen Pro zolang hun account bestaat
// (src/lib/founding.ts).
export const foundingNl: DeepString<typeof founding> = {
  teaser: "De eerste {total} merken krijgen Pro gratis, zolang hun account bestaat. Nog {left} plekken vrij.",
  teaserLast: "De eerste {total} merken krijgen Pro gratis, zolang hun account bestaat. Nog maar 1 plek vrij.",
  ofTotal: "van {total} founding brands",
  title: "Pro is voor jou voorgoed gratis.",
  body: "Zolang je account bestaat. comtor houdt {pro}% in plaats van {standard}% van elke betaling in.",
  perkFee: "{pro}% in plaats van {standard}% kosten op elke betaling",
  perkPrice: "Geen maandprijs, geen abonnement, niets op te zeggen",
  doneLine: "Founding brand nr. {n}: Pro is gratis voor jou, zolang je account bestaat.",
  planTitle: "Pro · Founding brand nr. {n}",
  planBody:
    "Pro is gratis voor jou, zolang je account bestaat: {pro}% in plaats van {standard}% op elke betaling. Je betaalt niets en hoeft niets op te zeggen.",
  feeLine: "Founding brand nr. {n}: {pro}% kosten per betaling in plaats van {standard}%.",
  creator: {
    teaser: "De eerste {total} creators krijgen Pro gratis, zolang hun account bestaat. Nog {left} plekken vrij.",
    teaserLast: "De eerste {total} creators krijgen Pro gratis, zolang hun account bestaat. Nog maar 1 plek vrij.",
    ofTotal: "van {total} founding creators",
    body: "Zolang je account bestaat. comtor houdt {pro}% in plaats van {standard}% van elke betaling in, dus jij houdt {keep}% over.",
    doneLine: "Founding creator nr. {n}: Pro is gratis voor jou, zolang je account bestaat.",
    planTitle: "Pro · Founding creator nr. {n}",
    feeLine: "Founding creator nr. {n}: {pro}% kosten per betaling in plaats van {standard}%.",
  },
};
