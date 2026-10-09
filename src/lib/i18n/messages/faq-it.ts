import type { faq } from "@/lib/i18n/messages/faq-en";
import type { DeepString } from "@/lib/i18n/messages/types";

export const faqIt: DeepString<typeof faq> = {
  meta: {
    title: "FAQ",
    description: "Come funzionano match, pagamenti e recensioni su comtor.",
  },
  proOffer:
    " Abbonati a Pro per {price} al mese e la commissione scende al {proFee}%. Vale per ogni pagamento in cui almeno una delle parti ha Pro.",
  items: {
    matching: {
      question: "Come funziona il matching?",
      answer:
        "I brand pubblicano una richiesta con nicchia, lingue dei contenuti, numero minimo di follower e categoria di prodotto. I creator scelgono fino a 3 nicchie. In “Per te” vedono le richieste di quelle nicchie, se sono nella loro lingua e una delle loro piattaforme supera il minimo di follower. In “Tutte” vedono ogni richiesta adatta a lingua e portata. Nessuno approva i match a mano: una richiesta adatta compare nel feed.",
    },
    reachOut: {
      question: "Come contatto qualcuno?",
      answer:
        "Tocca “Mi interessa” su una richiesta adatta. Si apre una chat in cui le due parti si scrivono direttamente. Entrambe vedono anche l’email di contatto dell’altra.",
    },
    payments: {
      question: "Come funzionano i pagamenti?",
      answer:
        "Il brand paga il creator tramite comtor, mai direttamente. I soldi restano trattenuti finché il creator non pubblica e invia il link. Poi il brand ha {days} giorni per approvare il post, e i soldi arrivano subito al creator, oppure per segnalare un problema. Nessuna risposta dopo {days} giorni? I soldi vengono sbloccati in automatico. comtor trattiene il {fee}% di ogni pagamento.{proOffer}",
    },
    pro: {
      question: "Cos’è il piano Pro?",
      answer:
        "Un abbonamento mensile facoltativo per brand e creator ({price} al mese). Abbassa la commissione dal {fee}% al {proFee}% su ogni pagamento in cui il brand o il creator ha Pro. Basta una delle parti. Pro si ripaga quando passano dal tuo account circa {breakEven} al mese. Stripe addebita ogni mese. Gestiscilo o annullalo nelle Impostazioni. I primi {foundingBrands} brand e i primi {foundingCreators} creator hanno Pro gratis finché il loro account esiste.",
    },
    noPost: {
      question: "E se il creator non pubblica?",
      answer:
        "Il brand annulla il pagamento in qualsiasi momento prima che il creator invii il post e riceve l’importo intero. Se il post è inviato ma qualcosa non va (manca, è stato rimosso, non è come concordato), il brand segnala un problema entro {days} giorni. I soldi restano trattenuti mentre verifichiamo il caso. Poi li sblocchiamo al creator o rimborsiamo il brand. Un pagamento sbloccato non si può annullare. Le recensioni di entrambe le parti mostrano chi è affidabile prima che tu paghi.",
    },
    realMoney: {
      question: "Sono soldi veri?",
      answer: "Sì. I pagamenti delle collab e l’abbonamento Pro passano da Stripe. Soldi veri si muovono tra conti bancari veri.",
    },
    followers: {
      question: "Come si verificano i follower?",
      answer:
        "Li inseriscono i creator stessi. Ogni piattaforma rimanda all’account reale, così controlli il numero vero prima di scrivere.",
    },
    reviews: {
      question: "Posso lasciare una recensione?",
      answer:
        "Sì. Quando un pagamento è sbloccato, ogni parte può lasciare una valutazione e un breve commento. Le recensioni compaiono sui profili pubblici e aiutano gli altri a scegliere con chi lavorare.",
    },
    contact: {
      question: "Come vi contatto?",
      answer: "Trovi i nostri recapiti nella pagina Note legali.",
    },
  },
};
