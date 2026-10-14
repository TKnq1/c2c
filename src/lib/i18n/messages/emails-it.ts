import type { emails } from "@/lib/i18n/messages/emails-en";
import type { DeepString } from "@/lib/i18n/messages/types";

export const emailsIt: DeepString<typeof emails> = {
  chrome: {
    pasteLink: "Il pulsante non funziona? Incolla questo link nel browser:",
    stop: "Annulla l’iscrizione a queste email",
    tagline: "I brand incontrano i creator giusti.",
    imprint: "Note legali",
    privacy: "Privacy",
    numberLocale: "it-IT",
  },
  welcome: {
    subject: "Benvenuto su comtor – conferma la tua email",
    preview: "Grazie per esserti registrato. Un tocco e la tua email è confermata.",
    heading: "Benvenuto su comtor.",
    bodyCreator: "Grazie per esserti registrato. Conferma la tua email, poi scorri le offerte dei brand con il budget già sulla scheda.",
    bodyBrand: "Grazie per esserti registrato. Conferma la tua email, poi pubblica la tua prima richiesta. I creator si fanno avanti.",
    foundingCreator:
      "Sei il creator fondatore n. {number}. Pro è gratis per te finché esiste il tuo account. comtor trattiene il {pro}% di ogni pagamento invece del {standard}%, e tu tieni il {keep}%.",
    foundingBrand:
      "Sei il brand fondatore n. {number}. Pro è gratis per te finché esiste il tuo account. comtor trattiene il {pro}% di ogni pagamento invece del {standard}%.",
    action: "Conferma l’email",
    note: "Il link vale 24 ore. Non ti sei registrato su comtor? Allora puoi ignorare questa email.",
  },
  foundingNotice: {
    subject: "Pro è gratis per te, per sempre",
    previewCreator: "Sei tra i primi creator su comtor.",
    previewBrand: "Sei tra i primi brand su comtor.",
    heading: "Hai Pro, per sempre.",
    bodyCreator:
      "Sei tra i primi {limit} creator su comtor (creator fondatore n. {number}). Per questo Pro è gratis per te finché esiste il tuo account. comtor trattiene il {pro}% invece del {standard}% di ogni pagamento, quindi tu tieni il {keep}%. Non devi fare nulla.",
    bodyBrand:
      "Sei tra i primi {limit} brand su comtor (brand fondatore n. {number}). Per questo Pro è gratis per te finché esiste il tuo account. comtor trattiene il {pro}% invece del {standard}% di ogni pagamento. Non devi fare nulla.",
    subscription: "Il tuo abbonamento Pro di prima è ancora attivo e continua a essere addebitato. Puoi disdirlo nelle Impostazioni e tenere Pro.",
    action: "Vedi il tuo piano",
    note: "Ricevi questa email perché hai un account comtor. Riguarda il tuo piano e non è pubblicità.",
  },
  marketingWelcome: {
    note: "Ricevi questa email perché hai accettato di ricevere comunicazioni da comtor. Puoi interromperle in qualsiasi momento con il link qui sotto.",
    noteWithReason:
      "Ricevi questa email perché hai accettato di ricevere comunicazioni da comtor ({reason}). Puoi interromperle in qualsiasi momento con il link qui sotto.",
    hint: "Dai prima un’occhiata. La registrazione è sulla pagina.",
    creator: {
      preview: "Guadagna pubblicando sui social.",
      heading: "Guadagna pubblicando sui social.",
      headingNamed: "{name}, guadagna pubblicando sui social.",
      body: "Su comtor i brand pubblicano un lavoro pagato e tu scorri quelli che vuoi. Il budget è sulla scheda. Il brand paga prima che tu pubblichi, e tu tieni il {keep}%.",
      steps: {
        swipe: {
          title: "Scorri una richiesta.",
          text: "A destra la vuoi, a sinistra passi. Il brand vede il tuo profilo e può scriverti.",
        },
        budget: {
          title: "Il budget è sulla scheda.",
          text: "Basta DM sulla tua tariffa. Ogni richiesta dice quanto paga, cosa pubblicare e se il prodotto è incluso.",
        },
        paid: {
          title: "Pagato prima di pubblicare.",
          text: "Accetta l’offerta e il brand paga per primo. I soldi restano trattenuti finché il tuo post non è online.",
        },
        keep: {
          title: "Tu tieni il {keep}%.",
          text: "Il brand ha {days} giorni per approvare il tuo post. Se non risponde, i soldi arrivano comunque a te. Con Pro ({price} € al mese) tieni il {proKeep}%.",
        },
      },
      crowdOne: "brand già presente",
      crowdMany: "brand già presenti",
      action: "Vedi le richieste pagate",
    },
    brand: {
      preview: "Fai crescere il tuo brand con i creator.",
      heading: "Fai crescere il tuo brand con i creator.",
      headingNamed: "{name}, fai crescere il tuo brand con i creator.",
      body: "Su comtor pubblichi il prodotto, il budget e cosa creare. I creator adatti scorrono a destra e si fanno avanti. Paghi quando vi accordate. I soldi restano trattenuti finché il post non è online.",
      steps: {
        post: {
          title: "Pubblica prodotto e budget.",
          text: "Foto, budget, piattaforma e cosa pubblicare. I creator la ricevono come scheda nel loro feed.",
        },
        come: {
          title: "I creator vengono da te.",
          text: "I creator della tua nicchia scorrono a destra. Vedi copertura e recensioni e scegli chi fa per te.",
        },
        chat: {
          title: "Accordatevi in chat.",
          text: "Invia un’offerta. Quando il creator accetta, paghi e i soldi restano trattenuti finché il post non è online.",
        },
        paidOut: {
          title: "Poi arriva il pagamento.",
          text: "Controlli prima il post online. Nessun canone: comtor trattiene il {fee}% di ogni pagamento, o il {proFee}% con Pro ({price} € al mese).",
        },
      },
      crowdOne: "creator già presente",
      crowdMany: "creator già presenti",
      action: "Pubblica la tua prima richiesta",
    },
  },
  verification: {
    subject: "Conferma la tua email di comtor",
    preview: "Conferma che l’indirizzo è tuo. Il link vale 24 ore.",
    heading: "Conferma la tua email.",
    body: "Conferma che questo indirizzo appartiene al tuo account comtor.",
    action: "Conferma l’email",
    note: "Il link vale 24 ore. Non ti sei registrato su comtor? Allora puoi ignorare questa email.",
  },
  passwordReset: {
    subject: "Reimposta la password di comtor",
    preview: "Scegli una nuova password. Il link vale 1 ora.",
    heading: "Reimposta la password.",
    body: "Qualcuno ha chiesto di reimpostare la password di comtor. Se eri tu, scegline una nuova.",
    action: "Scegli una nuova password",
    note: "Il link funziona una sola volta, per 1 ora. Una nuova password ti disconnette ovunque. Non l’hai chiesto tu? Ignora questa email e la password resta la stessa.",
  },
  passwordChanged: {
    subject: "La tua password di comtor è cambiata",
    preview: "Se eri tu, è tutto a posto.",
    heading: "La tua password è cambiata.",
    body: "La password di comtor è appena cambiata e abbiamo disconnesso gli altri tuoi dispositivi. Se eri tu, è tutto a posto.",
    action: "Reimposta la password",
    note: "Non eri tu? Reimposta subito la password. Così disconnetti chi l’ha cambiata.",
  },
  accountSuspended: {
    subject: "Il tuo account comtor è stato sospeso",
    preview: "Ecco il motivo e come opporti.",
    heading: "Il tuo account è stato sospeso.",
    body: "Abbiamo sospeso il tuo account comtor. Motivo: {reason} Finché è sospeso, non puoi accedere. Chiudiamo le richieste aperte di un account brand.",
    action: "Opponiti a questa decisione",
    objectSubject: "Account sospeso",
    note: "Se pensi sia un errore, rispondi a questa email o scrivi a info@comtor.app. Lo riesamineremo e ti risponderemo.",
  },
  test: {
    subject: "Email di prova di comtor",
    preview: "Se leggi questo messaggio, le email di comtor funzionano.",
    heading: "Funziona.",
    body: "Questa è un’email di prova dall’area admin. Se è nella tua posta, arrivano anche le email di registrazione, conferma e password.",
    action: "Apri comtor",
    note: "Inviata da un admin da /admin/email. Non devi fare nulla.",
  },
  marketingConsent: {
    subject: "Conferma le novità di comtor",
    preview: "Un pulsante, poi possiamo inviarti ogni tanto novità su comtor.",
    heading: "Conferma le novità sul prodotto.",
    body: "Hai chiesto di ricevere ogni tanto email su comtor. Premi il pulsante nella pagina successiva per confermare. Fino ad allora questo indirizzo non riceve novità sul prodotto.",
    action: "Controlla e conferma",
    note: "Non l’hai chiesto tu? Ignora l’email. Non si attiva nulla finché non premi il pulsante.",
  },
  waitlistConfirmation: {
    subject: "Conferma il tuo posto nella lista d’attesa di comtor",
    preview: "Un tocco e ti scriviamo il giorno in cui escono le app.",
    heading: "Conferma la tua email.",
    body: "Hai chiesto di sapere quando le app di comtor escono su iOS e Android. Conferma che questo indirizzo è tuo e sei in lista.",
    action: "Conferma l’email",
    note: "Ti invieremo una sola email, il giorno in cui escono le app. Non ti sei iscritto? Allora ignora questa email e non ti scriveremo.",
  },
  // A deal notice and the documents of a deal (src/lib/deals/notices.ts, billing). {number}: document number, {title}: request title, {replaces}: the cancelled document.
  dealNotice: {
    headingAction: "Il tuo deal ha bisogno di te.",
    headingNews: "Novità sul tuo deal.",
    action: "Apri in comtor",
    note: "Ricevi questa e-mail perché sono in gioco una scadenza, un annullamento o del denaro. Questi avvisi non si possono disattivare.",
  },
  dealDocument: {
    invoice: { subject: "La tua fattura {number}", heading: "La tua fattura è pronta.", body: "La fattura {number} per «{title}» è allegata in PDF. La trovi anche in Deal, Fatture." },
    credit: { subject: "La tua nota di credito {number}", heading: "La tua nota di credito è pronta.", body: "La nota di credito {number} per «{title}» è allegata in PDF. La trovi anche in Deal, Fatture." },
    corrected: { subject: "Documento corretto: {replaces} sostituito da {number}", heading: "Un documento è stato corretto.", body: "Il documento {replaces} per «{title}» è stato annullato e sostituito da {number}. L’annullamento e il nuovo documento sono allegati in PDF." },
    action: "Apri il documento",
    note: "Ricevi questa e-mail perché è stato emesso un documento per uno dei tuoi deal. Conservalo per la tua contabilità.",
  },
};
