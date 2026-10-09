import type { founding } from "@/lib/i18n/messages/founding-en";
import type { DeepString } from "@/lib/i18n/messages/types";

// Os lugares fundadores: as primeiras marcas e os primeiros criadores recebem o Pro enquanto a conta existir
// (src/lib/founding.ts).
export const foundingPt: DeepString<typeof founding> = {
  teaser: "As primeiras {total} marcas recebem o Pro grátis, enquanto a conta existir. Restam {left} lugares.",
  teaserLast: "As primeiras {total} marcas recebem o Pro grátis, enquanto a conta existir. Resta só 1 lugar.",
  ofTotal: "de {total} marcas fundadoras",
  title: "O Pro é grátis para ti, para sempre.",
  body: "Enquanto a tua conta existir. A comtor fica com {pro}% em vez de {standard}% de cada pagamento.",
  perkFee: "{pro}% em vez de {standard}% de comissão em cada pagamento",
  perkPrice: "Sem preço mensal, sem subscrição, nada para cancelar",
  doneLine: "Marca fundadora n.º {n}: o Pro é grátis para ti enquanto a tua conta existir.",
  planTitle: "Pro · Marca fundadora n.º {n}",
  planBody:
    "O Pro é grátis para ti enquanto a tua conta existir: {pro}% em vez de {standard}% em cada pagamento. Não pagas nada e não tens nada para cancelar.",
  feeLine: "Marca fundadora n.º {n}: comissão de {pro}% por pagamento em vez de {standard}%.",
  creator: {
    teaser: "Os primeiros {total} criadores recebem o Pro grátis, enquanto a conta existir. Restam {left} lugares.",
    teaserLast: "Os primeiros {total} criadores recebem o Pro grátis, enquanto a conta existir. Resta só 1 lugar.",
    ofTotal: "de {total} criadores fundadores",
    body: "Enquanto a tua conta existir. A comtor fica com {pro}% em vez de {standard}% de cada pagamento, por isso ficas com {keep}%.",
    doneLine: "Criador fundador n.º {n}: o Pro é grátis para ti enquanto a tua conta existir.",
    planTitle: "Pro · Criador fundador n.º {n}",
    feeLine: "Criador fundador n.º {n}: comissão de {pro}% por pagamento em vez de {standard}%.",
  },
};
