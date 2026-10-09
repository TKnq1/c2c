import type { faq } from "@/lib/i18n/messages/faq-en";
import type { DeepString } from "@/lib/i18n/messages/types";

export const faqNl: DeepString<typeof faq> = {
  meta: {
    title: "FAQ",
    description: "Zo werken matching, betalingen en beoordelingen bij comtor.",
  },
  proOffer:
    " Neem Pro voor {price} per maand en de kosten dalen naar {proFee}%. Dat geldt voor elke betaling waarbij een van beide kanten Pro heeft.",
  items: {
    matching: {
      question: "Hoe werkt matching?",
      answer:
        "Merken plaatsen een verzoek met een niche, contenttalen, een minimum aantal volgers en een productcategorie. Creators kiezen maximaal 3 niches. Onder “Voor jou” zien ze verzoeken in die niches, als het verzoek in hun contenttaal staat en een van hun platforms het minimum aan volgers haalt. Onder “Alles” zien ze elk verzoek dat bij hun taal en bereik past. Niemand keurt matches handmatig goed: een passend verzoek verschijnt in de feed.",
    },
    reachOut: {
      question: "Hoe neem ik contact op?",
      answer:
        "Tik op “Geïnteresseerd” bij een passend verzoek. Dan opent een chat waarin beide kanten elkaar direct schrijven. Beiden zien ook het contact-e-mailadres van de ander.",
    },
    payments: {
      question: "Hoe werken betalingen?",
      answer:
        "Het merk betaalt de creator via comtor, nooit direct. Het geld wordt vastgehouden tot de creator heeft gepost en de link heeft ingestuurd. Daarna heeft het merk {days} dagen om de post goed te keuren, waarna het geld meteen vrijkomt, of om een probleem te melden. Geen reactie na {days} dagen? Dan komt het geld automatisch vrij. comtor houdt {fee}% van elke betaling.{proOffer}",
    },
    pro: {
      question: "Wat is het Pro-abonnement?",
      answer:
        "Een optioneel maandabonnement voor merken en creators ({price} per maand). Het verlaagt de kosten van {fee}% naar {proFee}% bij elke betaling waarbij het merk of de creator Pro heeft. Eén kant is genoeg. Pro verdient zich terug zodra ongeveer {breakEven} per maand via je account loopt. Stripe rekent maandelijks af. Beheer of zeg het op in Instellingen. De eerste {foundingBrands} merken en de eerste {foundingCreators} creators krijgen Pro gratis, zolang hun account bestaat.",
    },
    noPost: {
      question: "Wat als de creator nooit post?",
      answer:
        "Het merk annuleert de betaling op elk moment voordat de creator de post instuurt en krijgt het volledige bedrag terug. Is er een post ingestuurd, maar klopt er iets niet (ontbreekt, verwijderd, niet zoals afgesproken)? Dan meldt het merk binnen {days} dagen een probleem. Het geld blijft vastgehouden terwijl we de zaak bekijken. Daarna betalen we het uit aan de creator of storten we het terug aan het merk. Een vrijgegeven betaling kun je niet terugdraaien. Beoordelingen van beide kanten laten zien wie betrouwbaar is, nog voordat je betaalt.",
    },
    realMoney: {
      question: "Is dit echt geld?",
      answer: "Ja. Betalingen voor samenwerkingen en het Pro-abonnement lopen via Stripe. Echt geld gaat tussen echte bankrekeningen.",
    },
    followers: {
      question: "Hoe worden aantallen volgers gecontroleerd?",
      answer:
        "Creators vullen ze zelf in. Elk platform linkt naar het echte account, dus je ziet het werkelijke aantal voordat je contact opneemt.",
    },
    reviews: {
      question: "Kan ik een beoordeling achterlaten?",
      answer:
        "Ja. Zodra een betaling is vrijgegeven, kan elke kant een cijfer en een korte reactie achterlaten. Beoordelingen staan op openbare profielen en helpen anderen kiezen met wie ze werken.",
    },
    contact: {
      question: "Hoe neem ik contact met jullie op?",
      answer: "Onze contactgegevens staan op de Impressum-pagina.",
    },
  },
};
