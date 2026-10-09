import type { founding } from "@/lib/i18n/messages/founding-en";
import type { DeepString } from "@/lib/i18n/messages/types";

// Las plazas fundadoras: las primeras marcas y los primeros creadores tienen Pro mientras exista su cuenta
// (src/lib/founding.ts).
export const foundingEs: DeepString<typeof founding> = {
  teaser: "Las primeras {total} marcas tienen Pro gratis mientras exista su cuenta. Quedan {left} plazas.",
  teaserLast: "Las primeras {total} marcas tienen Pro gratis mientras exista su cuenta. Queda solo 1 plaza.",
  ofTotal: "de {total} marcas fundadoras",
  title: "Pro es gratis para ti, para siempre.",
  body: "Mientras exista tu cuenta. comtor se queda el {pro} % en lugar del {standard} % de cada pago.",
  perkFee: "{pro} % en lugar del {standard} % de comisión en cada pago",
  perkPrice: "Sin precio mensual, sin suscripción, nada que cancelar",
  doneLine: "Marca fundadora n.º {n}: Pro es gratis para ti mientras exista tu cuenta.",
  planTitle: "Pro · Marca fundadora n.º {n}",
  planBody:
    "Pro es gratis para ti mientras exista tu cuenta: {pro} % en lugar del {standard} % en cada pago. No pagas nada y no tienes nada que cancelar.",
  feeLine: "Marca fundadora n.º {n}: {pro} % de comisión por pago en lugar del {standard} %.",
  creator: {
    teaser: "Los primeros {total} creadores tienen Pro gratis mientras exista su cuenta. Quedan {left} plazas.",
    teaserLast: "Los primeros {total} creadores tienen Pro gratis mientras exista su cuenta. Queda solo 1 plaza.",
    ofTotal: "de {total} creadores fundadores",
    body: "Mientras exista tu cuenta. comtor se queda el {pro} % en lugar del {standard} % de cada pago, así que tú te quedas el {keep} %.",
    doneLine: "Creador fundador n.º {n}: Pro es gratis para ti mientras exista tu cuenta.",
    planTitle: "Pro · Creador fundador n.º {n}",
    feeLine: "Creador fundador n.º {n}: {pro} % de comisión por pago en lugar del {standard} %.",
  },
};
