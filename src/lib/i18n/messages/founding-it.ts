import type { founding } from "@/lib/i18n/messages/founding-en";
import type { DeepString } from "@/lib/i18n/messages/types";

// I posti Founding: i primi brand e i primi creator hanno Pro finché il loro account esiste
// (src/lib/founding.ts).
export const foundingIt: DeepString<typeof founding> = {
  teaser: "I primi {total} brand hanno Pro gratis finché il loro account esiste. Posti rimasti: {left}.",
  teaserLast: "I primi {total} brand hanno Pro gratis finché il loro account esiste. Resta solo 1 posto.",
  ofTotal: "di {total} brand fondatori",
  title: "Pro è gratis per te, per sempre.",
  body: "Finché il tuo account esiste. comtor trattiene il {pro}% invece del {standard}% di ogni pagamento.",
  perkFee: "Commissione del {pro}% invece del {standard}% su ogni pagamento",
  perkPrice: "Nessun prezzo mensile, nessun abbonamento, niente da disdire",
  doneLine: "Brand fondatore n. {n}: Pro è gratis per te finché il tuo account esiste.",
  planTitle: "Pro · Brand fondatore n. {n}",
  planBody:
    "Pro è gratis per te finché il tuo account esiste: il {pro}% invece del {standard}% su ogni pagamento. Non devi pagare nulla né disdire nulla.",
  feeLine: "Brand fondatore n. {n}: commissione del {pro}% a pagamento invece del {standard}%.",
  creator: {
    teaser: "I primi {total} creator hanno Pro gratis finché il loro account esiste. Posti rimasti: {left}.",
    teaserLast: "I primi {total} creator hanno Pro gratis finché il loro account esiste. Resta solo 1 posto.",
    ofTotal: "di {total} creator fondatori",
    body: "Finché il tuo account esiste. comtor trattiene il {pro}% invece del {standard}% di ogni pagamento, quindi tu tieni il {keep}%.",
    doneLine: "Creator fondatore n. {n}: Pro è gratis per te finché il tuo account esiste.",
    planTitle: "Pro · Creator fondatore n. {n}",
    feeLine: "Creator fondatore n. {n}: commissione del {pro}% a pagamento invece del {standard}%.",
  },
};
