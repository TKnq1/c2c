import type { founding } from "@/lib/i18n/messages/founding-en";
import type { DeepString } from "@/lib/i18n/messages/types";

// Les places fondatrices : les premières marques et les premiers créateurs ont Pro tant que leur compte existe
// (src/lib/founding.ts).
export const foundingFr: DeepString<typeof founding> = {
  teaser: "Les {total} premières marques ont Pro gratuit, tant que leur compte existe. Il reste {left} places.",
  teaserLast: "Les {total} premières marques ont Pro gratuit, tant que leur compte existe. Il reste 1 place.",
  ofTotal: "sur {total} marques fondatrices",
  title: "Pro est gratuit pour toi, pour toujours.",
  body: "Tant que ton compte existe. comtor garde {pro} % au lieu de {standard} % de chaque paiement.",
  perkFee: "{pro} % au lieu de {standard} % de frais sur chaque paiement",
  perkPrice: "Pas de prix mensuel, pas d’abonnement, rien à résilier",
  doneLine: "Marque fondatrice n° {n} : Pro est gratuit pour toi tant que ton compte existe.",
  planTitle: "Pro · Marque fondatrice n° {n}",
  planBody:
    "Pro est gratuit pour toi tant que ton compte existe : {pro} % au lieu de {standard} % sur chaque paiement. Tu ne paies rien et n’as rien à résilier.",
  feeLine: "Marque fondatrice n° {n} : {pro} % de frais par paiement au lieu de {standard} %.",
  creator: {
    teaser: "Les {total} premiers créateurs ont Pro gratuit, tant que leur compte existe. Il reste {left} places.",
    teaserLast: "Les {total} premiers créateurs ont Pro gratuit, tant que leur compte existe. Il reste 1 place.",
    ofTotal: "sur {total} créateurs fondateurs",
    body: "Tant que ton compte existe. comtor garde {pro} % au lieu de {standard} % de chaque paiement, tu gardes donc {keep} %.",
    doneLine: "Créateur fondateur n° {n} : Pro est gratuit pour toi tant que ton compte existe.",
    planTitle: "Pro · Créateur fondateur n° {n}",
    feeLine: "Créateur fondateur n° {n} : {pro} % de frais par paiement au lieu de {standard} %.",
  },
};
