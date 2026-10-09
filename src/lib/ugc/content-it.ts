import { PLATFORM_FEE_RATE, PLATFORMS, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import type { UgcCard, UgcContent, UgcCreatorPage, UgcFaqItem, UgcNichePage } from "@/lib/ugc/types";

// Italian UGC search pages. Same structure as the German source (src/lib/seo-pages.ts, content-de.ts). No
// invented numbers, quotes or testimonials, and no "escrow" wording on public pages ("trattenuto" instead).

const NBSP = " ";
const FEE = `${PLATFORM_FEE_RATE * 100}%`;
const PRO_FEE = `${PRO_PLATFORM_FEE_RATE * 100}%`;
const PRO_PRICE = `${PRO_SUBSCRIPTION_PRICE_CENTS / 100}${NBSP}€`;

// Questions every page answers the same way, because the answer is the same.
function sharedFaqs(): UgcFaqItem[] {
  return [
    {
      question: "Come funziona il pagamento?",
      answer: `Il brand paga tramite la piattaforma, non direttamente al creator. Il denaro viene trattenuto finché il creator non pubblica il post e invia il link, e il brand non lo approva. Il brand ha ${RELEASE_REVIEW_DAYS} giorni per farlo e può segnalare un problema. Se non risponde, il pagamento viene rilasciato in automatico. I pagamenti passano da Stripe.`,
    },
    {
      question: "Quanto costa comtor?",
      answer: `Iscriversi è gratis e non c’è nessun canone fisso. comtor trattiene il ${FEE} di ogni pagamento. La commissione viene detratta dal pagamento al creator. Il brand paga esattamente l’importo concordato. Brand e creator possono attivare un abbonamento Pro facoltativo a ${PRO_PRICE} al mese. Così la commissione scende al ${PRO_FEE} su ogni pagamento in cui almeno una delle due parti ha Pro.`,
    },
    {
      question: "I post a pagamento vanno segnalati come pubblicità?",
      answer:
        "In Germania i post a pagamento di solito vanno segnalati come pubblicità. Chiarite la dicitura in chat prima di pubblicare. Questa non è consulenza legale.",
    },
    {
      question: "Come vengono verificati i numeri dei follower?",
      answer:
        "I numeri li indicano i creator stessi. Ogni piattaforma inserita è collegata all’account vero, così i brand controllano il numero prima del primo messaggio. I brand fissano un minimo nella loro richiesta. Solo i creator adatti la vedono.",
    },
  ];
}

// The two questions about finding each other, for the pages that don't need a niche-specific answer.
function matchingFaqs(opts: {
  label: string;
  brandWho: string;
  creatorFrom: string;
  categories?: string;
}): UgcFaqItem[] {
  const hint = opts.categories ? ` (${opts.categories})` : "";
  return [
    {
      question: `Come trovo i creator giusti per ${opts.brandWho}?`,
      answer: `Pubblichi una richiesta: nicchia ${opts.label}, lingua dei contenuti, minimo di follower, categoria di prodotto${hint}, budget, piattaforma e cosa deve essere consegnato. I creator che hanno scelto ${opts.label} come nicchia e che combaciano per lingua e copertura la vedono nel feed. Se sono interessati, ti scrivono in chat. comtor non controlla le richieste a mano.`,
    },
    {
      question: `Dove trovo incarichi ${opts.creatorFrom}?`,
      answer: `Crei il profilo, scegli fino a tre nicchie, per esempio ${opts.label}, e inserisci le tue piattaforme con i follower. Nel feed vedi in “Per te” le richieste delle tue nicchie e in “Tutte” tutto ciò che combacia con la tua lingua e la tua copertura, ognuna con budget e requisiti. Con un tocco su “Interessato” avvii la chat con il brand.`,
    },
  ];
}

const PLATFORM_LIST = `${PLATFORMS.slice(0, -1).join(", ")} e ${PLATFORMS[PLATFORMS.length - 1]}`;

const niches: UgcNichePage[] = [
  {
    slug: "beauty",
    niche: "Beauty",
    label: "Bellezza",
    title: "Trova creator UGC per brand di bellezza",
    description:
      "I brand di bellezza trovano creator UGC per video routine, unboxing e foto prodotto. I creator trovano incarichi pagati nella loro nicchia. Inizia gratis.",
    heading: "Trova creator UGC per brand di bellezza",
    ogLines: ["Trova creator UGC per", "brand di bellezza."],
    lead: "Skincare, make-up, haircare, profumi: chi compra un prodotto di bellezza vuole vederlo su persone vere. comtor mette in contatto i brand di bellezza con creator che fanno proprio questi video e queste foto. I creator trovano qui incarichi pagati nella loro nicchia.",
    formats: [
      {
        title: "Video routine",
        text: "Routine del mattino o della sera, con il prodotto passo dopo passo. Funziona come contenuto organico e come annuncio.",
      },
      {
        title: "Unboxing e prime impressioni",
        text: "Apri, prova, racconta con onestà cosa noti. Ideale per novità e set.",
      },
      {
        title: "Applicazione nel dettaglio",
        text: "Come si applica, come si sente sulla pelle, quanto dura? Primi piani, non look da studio.",
      },
      {
        title: "Foto di tutti i giorni",
        text: "Foto prodotto in bagno, alla toeletta o in giro, per shop, social e annunci.",
      },
    ],
    faqs: [
      {
        question: "Come trovo i creator giusti per il mio brand di bellezza?",
        answer:
          "Pubblichi una richiesta: nicchia Bellezza, lingua dei contenuti, minimo di follower, categoria di prodotto, budget, piattaforma e cosa deve essere consegnato. I creator che hanno scelto Bellezza come nicchia e che combaciano per lingua e copertura la vedono nel feed. Chi è interessato ti scrive in chat. comtor non controlla le richieste a mano.",
      },
      {
        question: "Dove trovo incarichi di brand di bellezza?",
        answer:
          "Crei il profilo, scegli fino a tre nicchie, per esempio Bellezza, e inserisci le tue piattaforme con i follower. Nel feed vedi in “Per te” le richieste delle tue nicchie e in “Tutte” tutto ciò che combacia con la tua lingua e la tua copertura, ognuna con budget e requisiti. Con un tocco su “Interessato” apri la chat con il brand.",
      },
      {
        question: "Ricevo il prodotto gratis?",
        answer:
          "Lo decide il brand nella sua richiesta: lì c’è scritto se il prodotto è incluso. Tutto il resto, come cosa consegnare e quando, lo chiarite prima in chat.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "fitness",
    niche: "Fitness",
    label: "Fitness",
    title: "Trova creator UGC per brand di fitness",
    description:
      "I brand di fitness trovano creator UGC per video di allenamento, test prodotto e demo di app. I creator trovano incarichi pagati nella loro nicchia. Inizia gratis.",
    heading: "Trova creator UGC per brand di fitness",
    ogLines: ["Trova creator UGC per", "brand di fitness."],
    lead: "Abbigliamento sportivo, attrezzi, integratori, app di fitness: nel fitness convince ciò che le persone usano davvero. comtor mette in contatto i brand di fitness con creator che mostrano allenamento e vita quotidiana in modo credibile. I creator trovano qui incarichi pagati nella loro nicchia.",
    formats: [
      {
        title: "Allenamento con il prodotto",
        text: "Una sessione in cui si vedono abbigliamento, attrezzi o accessori in uso.",
      },
      {
        title: "Test prodotto dopo qualche settimana",
        text: "Bilancio onesto: vestibilità, durata, uso. Aiuta chi deve decidere se comprare.",
      },
      {
        title: "Giornata tipo e routine",
        text: "Scheda di allenamento, meal prep o routine del mattino, con il prodotto come parte naturale della giornata.",
      },
      {
        title: "Demo di app e tracker",
        text: "Registrazione dello schermo con commento: come va un allenamento con l’app, cosa mostra il tracker?",
      },
    ],
    faqs: [
      {
        question: "Come trovo i creator giusti per il mio brand di fitness?",
        answer:
          "Pubblichi una richiesta: nicchia Fitness, lingua dei contenuti, minimo di follower, categoria di prodotto (per esempio abbigliamento sportivo, integratori o app), budget, piattaforma e cosa deve essere consegnato. I creator che hanno scelto Fitness come nicchia e che combaciano per lingua e copertura la vedono nel feed. Se sono interessati, ti scrivono in chat.",
      },
      {
        question: "Dove trovo incarichi di brand di fitness?",
        answer:
          "Crei il profilo, scegli fino a tre nicchie, per esempio Fitness, e inserisci le tue piattaforme con i follower. Nel feed vedi in “Per te” le richieste delle tue nicchie e in “Tutte” tutto ciò che combacia con la tua lingua e la tua copertura. Con “Interessato” avvii la chat.",
      },
      {
        question: "Cosa vale per gli integratori e per le affermazioni sugli effetti?",
        answer:
          "Per le affermazioni su salute ed effetti valgono regole severe. Con gli integratori alimentari chiarite in chat, prima delle riprese, cosa si può dire e cosa no. Questa non è consulenza legale.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "food",
    niche: "Food",
    label: "Cibo",
    title: "Trova creator UGC per brand di cibo",
    description:
      "I brand di cibo trovano creator UGC per video ricetta, degustazioni e foto food. I creator trovano incarichi pagati nella loro nicchia. Inizia gratis.",
    heading: "Trova creator UGC per brand di cibo",
    ogLines: ["Trova creator UGC per", "brand di cibo."],
    lead: "Snack, bevande, spezie, box da cucinare, ingredienti per dolci: con cibo e bevande conta se vuoi assaggiare subito. comtor mette in contatto i brand di cibo con creator che cucinano, assaggiano e mostrano. I creator trovano qui incarichi pagati nella loro nicchia.",
    formats: [
      {
        title: "Video ricetta",
        text: "Un piatto o una bevanda passo dopo passo, con il prodotto come ingrediente. Mostra come si usa.",
      },
      {
        title: "Degustazione e prime impressioni",
        text: "Assaggia e descrivi con onestà cosa noti. Funziona per novità, gusti e confezioni regalo.",
      },
      {
        title: "Unboxing di box da cucinare",
        text: "Apri e presenta una box da cucinare, un pacco assaggio o una confezione regalo.",
      },
      {
        title: "Vita quotidiana e meal prep",
        text: "Colazione, cucina per la settimana o lo snack di metà giornata: il prodotto come parte normale del giorno.",
      },
      {
        title: "Foto food",
        text: "Piatti e prodotti fotografati, per shop, social e annunci.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Cibo",
        brandWho: "il mio brand di cibo",
        creatorFrom: "di brand di cibo",
        categories: "per esempio Cibo e bevande",
      }),
      {
        question: "Chi si occupa della spedizione dei prodotti?",
        answer:
          "Lo chiarite prima in chat. La richiesta indica solo se il prodotto è incluso. Come e quando arriva, soprattutto per merce refrigerata o deperibile, lo concordate prima.",
      },
      {
        question: "Cosa vale per le affermazioni su salute ed effetti?",
        answer:
          "Frasi come “fa bene” o “rafforza le difese immunitarie” sono regolate in modo severo per gli alimenti. Chiarite prima in chat cosa si può dire. Questa non è consulenza legale.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "mode",
    niche: "Fashion",
    label: "Moda",
    title: "Trova creator UGC per brand di moda",
    description:
      "I brand di moda trovano creator UGC per video outfit, prove abiti e foto di styling. I creator trovano incarichi pagati nella loro nicchia. Inizia gratis.",
    heading: "Trova creator UGC per brand di moda",
    ogLines: ["Trova creator UGC per", "brand di moda."],
    lead: "Abiti, scarpe, accessori, gioielli: la moda si compra perché ti ci vedi dentro. comtor mette in contatto i brand di moda con creator che indossano i capi, li abbinano e mostrano come stanno nella vita di tutti i giorni. I creator trovano qui incarichi pagati nella loro nicchia.",
    formats: [
      {
        title: "Video outfit",
        text: "Un capo, più look: come abbinarlo per lavoro, tempo libero e sera.",
      },
      {
        title: "Prova con feedback onesto",
        text: "Vestibilità, materiale e taglia rispetto alla guida alle taglie, con parole tue.",
      },
      {
        title: "Haul e unboxing",
        text: "Apri il pacco e presenta i capi uno dopo l’altro.",
      },
      {
        title: "Foto di styling quotidiano",
        text: "Look in strada, al bar o a casa, per shop, social e annunci.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Moda",
        brandWho: "il mio brand di moda",
        creatorFrom: "di brand di moda",
      }),
      {
        question: "E la taglia e la vestibilità?",
        answer:
          "La taglia la chiarite prima in chat, così il capo veste bene e il post riesce. Se il prodotto è incluso, lo trovi nella richiesta del brand.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "tech",
    niche: "Tech",
    label: "Tech",
    title: "Trova creator UGC per brand tech",
    description:
      "I brand tech trovano creator UGC per unboxing, test quotidiani e demo di app. I creator trovano incarichi pagati nella loro nicchia. Inizia gratis.",
    heading: "Trova creator UGC per brand tech",
    ogLines: ["Trova creator UGC per", "brand tech."],
    lead: "Gadget, accessori, smart home, software e app: con la tecnologia chi compra vuole vedere come funziona un prodotto ogni giorno. comtor mette in contatto i brand tech con creator che aprono, configurano e spiegano. I creator trovano qui incarichi pagati nella loro nicchia.",
    formats: [
      {
        title: "Unboxing e configurazione",
        text: "Apri, accendi, configura: i primi minuti con il prodotto, come li vive chi compra.",
      },
      {
        title: "Test quotidiano",
        text: "Una settimana con il prodotto: cosa funziona, cosa dà fastidio, per chi vale la pena?",
      },
      {
        title: "Demo di una funzione",
        text: "Registrazione dello schermo o primo piano, con la spiegazione di una funzione che di solito sfugge.",
      },
      {
        title: "Come si fa",
        text: "Tutorial breve: come risolvo un problema tipico con il prodotto?",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Tech",
        brandWho: "il mio brand tech",
        creatorFrom: "di brand tech",
        categories: "per esempio Elettronica o Software/App",
      }),
      {
        question: "Come ottengo l’accesso a dispositivi o software da creator?",
        answer:
          "Per i dispositivi il brand indica nella richiesta se il prodotto è incluso. Per software e app concordate in chat come ricevi un account di prova o la versione completa.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "reisen",
    niche: "Travel",
    label: "Viaggi",
    title: "Trova creator UGC per operatori del turismo",
    description:
      "Hotel, operatori e brand di viaggio trovano creator UGC per Reel di viaggio, tour degli alloggi e foto. Inizia gratis.",
    heading: "Trova creator UGC per operatori del turismo",
    ogLines: ["Trova creator UGC per", "operatori del turismo."],
    lead: "Hotel, case vacanza, tour operator, bagagli e app di viaggio: un viaggio si prenota guardando le immagini e le esperienze degli altri. comtor mette in contatto gli operatori del turismo con creator che mostrano luoghi e alloggi come si vivono sul posto. I creator trovano qui incarichi pagati nella loro nicchia.",
    formats: [
      {
        title: "Reel di viaggio",
        text: "Un luogo in 30 secondi: arrivo, i momenti migliori, un consiglio da portare via.",
      },
      {
        title: "Tour dell’alloggio",
        text: "Camera, vista, colazione, dettagli: com’è davvero e come ci si sta.",
      },
      {
        title: "Tre consigli sul posto",
        text: "Formato breve con posti del cuore, cibo e percorsi lontani dagli itinerari noti.",
      },
      {
        title: "Lista valigia e accessori da viaggio",
        text: "Valigia, zaino, adattatori: prodotti in uso vero, in viaggio.",
      },
      {
        title: "Serie di foto",
        text: "Immagini del luogo e dell’alloggio, per sito, social e annunci.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Viaggi",
        brandWho: "la mia attività di viaggi",
        creatorFrom: "nel settore viaggi",
      }),
      {
        question: "Chi paga viaggio e alloggio?",
        answer:
          "Lo chiarite prima in chat e lo mettete per iscritto. La richiesta indica il budget per il post. Se viaggio, alloggio o servizi sul posto sono inclusi, lo concordate in modo esplicito.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "gaming",
    niche: "Gaming",
    label: "Gaming",
    title: "Trova creator UGC per brand di gaming",
    description:
      "I brand di gaming trovano creator UGC per clip di gameplay, test hardware e prime impressioni. I creator trovano incarichi pagati. Inizia gratis.",
    heading: "Trova creator UGC per brand di gaming",
    ogLines: ["Trova creator UGC per", "brand di gaming."],
    lead: "Giochi, console, hardware PC, accessori e app di gaming: i giocatori si fidano di chi gioca davvero. comtor mette in contatto i brand di gaming con creator che giocano, testano e commentano. I creator trovano qui incarichi pagati nella loro nicchia.",
    formats: [
      {
        title: "Clip di gameplay",
        text: "Una scena dal gioco con commento: cosa lo rende speciale, cosa salta all’occhio?",
      },
      {
        title: "Prime impressioni",
        text: "Le prime ore in un gioco nuovo, in modo aperto e senza copione.",
      },
      {
        title: "Test hardware",
        text: "Mouse, cuffie, tastiera o controller in uso: sensazione, qualità, praticità di ogni giorno.",
      },
      {
        title: "Highlight da stream o sessione",
        text: "I momenti migliori di uno stream o di una partita, montati in breve.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Gaming",
        brandWho: "il mio brand di gaming",
        creatorFrom: "di brand di gaming",
      }),
      {
        question: "Su quali piattaforme posso pubblicare?",
        answer: `I creator inseriscono le loro piattaforme con i follower: ${PLATFORM_LIST}. Il brand indica nella richiesta dove pubblicare.`,
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "lifestyle",
    niche: "Lifestyle",
    label: "Lifestyle",
    title: "Trova creator UGC per brand lifestyle",
    description:
      "I brand lifestyle trovano creator UGC per video di vita quotidiana, look per la casa e foto prodotto. I creator trovano incarichi pagati. Inizia gratis.",
    heading: "Trova creator UGC per brand lifestyle",
    ogLines: ["Trova creator UGC per", "brand lifestyle."],
    lead: "Casa, faccende domestiche, organizzazione, benessere, accessori: i prodotti lifestyle convincono quando li vedi nella vita vera. comtor mette in contatto i brand lifestyle con creator che mostrano le loro giornate. I creator trovano qui incarichi pagati nella loro nicchia.",
    formats: [
      {
        title: "Una giornata con il prodotto",
        text: "Dal mattino alla sera: dove compare il prodotto nella giornata e cosa semplifica.",
      },
      {
        title: "Look per la casa",
        text: "Casa, angolo o scaffale arredati con il prodotto. Mostra come sta in una casa vera.",
      },
      {
        title: "Unboxing e montaggio",
        text: "Apri, monta, prova, compresi gli intoppi.",
      },
      {
        title: "Routine e abitudini",
        text: "Routine del mattino, della sera o della domenica, con il prodotto in modo naturale.",
      },
      {
        title: "Foto di tutti i giorni",
        text: "Foto prodotto in situazioni vere, per shop, social e annunci.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Lifestyle",
        brandWho: "il mio brand lifestyle",
        creatorFrom: "di brand lifestyle",
      }),
      {
        question: "E se i miei contenuti mescolano più temi?",
        answer:
          "Puoi scegliere fino a tre nicchie, per esempio Lifestyle, Moda e Cibo. Nel feed vedi prima in “Per te” le richieste di queste nicchie e in “Tutte” tutto ciò che combacia con la tua lingua e la tua copertura.",
      },
      ...sharedFaqs(),
    ],
  },
];

const hubFaqs: UgcFaqItem[] = [
  {
    question: "Cos’è l’UGC?",
    answer:
      "UGC sta per User Generated Content. Nel marketing sono video e foto che persone vere creano per un brand: provano il prodotto, filmano, mostrano. Il brand li usa sui suoi canali, nello shop o negli annunci. Conta il contenuto, non la copertura del creator.",
  },
  {
    question: "Che differenza c’è con l’influencer marketing?",
    answer:
      "Nell’influencer marketing conta la copertura di una persona: il post esce sul suo canale. Nell’UGC conta il contenuto, e anche i creator più piccoli possono fare buoni video. Su comtor il brand indica nella richiesta quale piattaforma e quale minimo di follower vuole, e può lasciare aperti entrambi.",
  },
  {
    question: "Come trovo creator UGC per il mio brand?",
    answer:
      "Crei gratis un profilo brand e pubblichi una richiesta: nicchia, lingua, categoria di prodotto, budget e cosa deve essere consegnato. I creator adatti la vedono nel feed e ti scrivono in chat.",
  },
  ...sharedFaqs(),
];

const doing: UgcCard[] = [
  {
    title: "Video prodotto",
    text: "Provi un prodotto, lo filmi e mostri con onestà come funziona nella vita di tutti i giorni.",
  },
  {
    title: "Unboxing e prime impressioni",
    text: "Apri, provi, racconti cosa noti. Niente studio, ma credibilità.",
  },
  {
    title: "Applicazioni e tutorial",
    text: "Mostri passo dopo passo come si usa un prodotto e cosa semplifica.",
  },
  {
    title: "Foto in situazioni vere",
    text: "Foto prodotto nella vita quotidiana, per shop, social e annunci del brand.",
  },
];

const tips: UgcCard[] = [
  {
    title: "Mostra subito il prodotto",
    text: "Nei primi secondi deve essere chiaro di cosa si tratta e cosa sa fare il prodotto.",
  },
  {
    title: "Parla in modo naturale",
    text: "Impressioni oneste con parole tue convincono di solito più di un testo imparato a memoria.",
  },
  {
    title: "Cura luce e audio",
    text: "Spesso bastano luce naturale e un posto tranquillo. Immagine buona e audio chiaro si notano.",
  },
  {
    title: "Chiarisci l’uso prima",
    text: "Concorda in chat dove il brand può usare i tuoi contenuti, prima di girare.",
  },
];

const creatorPage: UgcCreatorPage = {
  title: "Guadagna come creator UGC",
  description:
    "Trova incarichi pagati dai brand come creator UGC: guarda le richieste con il budget, accordati in chat, ricevi il pagamento tramite la piattaforma. Gratis.",
  heading: "Guadagna come creator UGC",
  ogLines: ["Guadagna come", "creator UGC."],
  lead: "I creator UGC fanno video e foto per i brand, come li mostrerebbe un cliente vero. Su comtor vedi richieste pagate con budget e requisiti, mostri interesse con un tocco e concordi tutto il resto in chat. Vieni pagato tramite la piattaforma.",
  doing,
  steps: [
    "Crea il profilo: scegli fino a tre nicchie, inserisci le tue piattaforme con i follower e indica la lingua dei tuoi contenuti.",
    "Guarda le richieste: nel feed vedi budget, piattaforma e consegna prima di farti avanti.",
    "Mostra interesse: con “Interessato” apri la chat con il brand e concordi dettagli e scadenza.",
    "Pubblica e invia il link: dopo il post invii il link al tuo post.",
    `Ricevi il pagamento: il brand approva il post, al più tardi dopo ${RELEASE_REVIEW_DAYS} giorni, e il pagamento viene accreditato a te.`,
  ],
  tips,
  faqs: [
    {
      question: "Servono tanti follower?",
      answer:
        "Lo decide il brand: ogni richiesta indica un minimo di follower, alcuni brand non fissano nessun limite. In “Per te” vedi le richieste delle tue nicchie e in “Tutte” tutto ciò che combacia con la tua lingua e la tua copertura.",
    },
    {
      question: "Su quali piattaforme posso pubblicare?",
      answer: `Inserisci le tue piattaforme con i follower: ${PLATFORM_LIST}. Il brand indica nella richiesta dove pubblicare.`,
    },
    {
      question: "Quanto ci mette ad arrivare il mio denaro?",
      answer: `Appena il brand approva il tuo post, il pagamento parte verso di te. Il brand ha ${RELEASE_REVIEW_DAYS} giorni per farlo. Se non risponde, il pagamento viene rilasciato in automatico. Il pagamento in uscita passa da Stripe.`,
    },
    {
      question: "Devo aprire una partita IVA come creator UGC?",
      answer:
        "Dipende dalla tua situazione, per esempio da quanto spesso e quanto guadagni. In Germania di solito devi dichiarare i guadagni al fisco. Nel dubbio, chiedi a un commercialista. Questa non è consulenza fiscale né legale.",
    },
    ...sharedFaqs(),
  ],
};

export const ugcContentIt: UgcContent = {
  htmlLang: "it",
  ogLocale: "it_IT",
  ui: {
    hubTitle: "Trova e ingaggia creator UGC",
    hubDescription:
      "I brand trovano creator UGC per video e foto, i creator incarichi pagati. Pubblica una richiesta, accordati in chat, paga tramite la piattaforma. Gratis.",
    hubIntro:
      "I brand hanno bisogno di video e foto di persone vere, i creator vogliono essere pagati. comtor li mette in contatto: il brand pubblica una richiesta, i creator adatti si fanno avanti, si paga tramite la piattaforma.",
    signupNote: "Iscriviti gratis. comtor funziona nel browser, la lingua la scegli all’inizio.",
    creatorCardTitle: "Sei un creator?",
    creatorCardBody:
      "Scopri come trovare incarichi UGC pagati e ricevere il pagamento tramite la piattaforma: guadagna come creator UGC.",
    byNicheTitle: "UGC per nicchia",
    howTitle: "Come funziona comtor",
    forBrands: "Per i brand",
    forCreators: "Per i creator",
    hubBrandSteps: [
      "Pubblica una richiesta: nicchia, lingua, minimo di follower, categoria di prodotto, budget e consegna.",
      "I creator si fanno avanti: chi è adatto vede la richiesta nel feed e ti scrive in chat.",
      "Paga e approva: paghi tramite la piattaforma e approvi il post quando va bene.",
    ],
    hubCreatorSteps: [
      "Crea il profilo: fino a tre nicchie e le tue piattaforme con i relativi follower.",
      "Guarda le richieste: nel feed vedi budget e requisiti prima di farti avanti.",
      "Pubblica e ricevi il pagamento: dopo il post invii il link. Appena il brand lo approva (al più tardi dopo {days} giorni), il pagamento ti viene accreditato.",
    ],
    faqTitle: "Domande frequenti",
    formatsTitle: "Questi formati funzionano nella nicchia “{label}”",
    nicheBrandSteps: [
      "Pubblica una richiesta: nicchia {label}, lingua, minimo di follower, budget e consegna.",
      "I creator si fanno avanti: chi è adatto vede la richiesta nel feed e ti scrive in chat.",
      "Paga e approva: paghi tramite la piattaforma e approvi il post quando va bene.",
    ],
    nicheCreatorSteps: [
      "Crea il profilo: fino a tre nicchie, per esempio {label}, e le tue piattaforme con i relativi follower.",
      "Guarda le richieste: nel feed vedi budget e requisiti prima di farti avanti.",
      "Pubblica e ricevi il pagamento: dopo il post invii il link. Appena il brand lo approva (al più tardi dopo {days} giorni), il pagamento ti viene accreditato.",
    ],
    nicheReadyTitle: "Pronto per il tuo primo incarico nella nicchia “{label}”?",
    overviewLead: "Cos’è l’UGC e come funziona comtor, spiegato in breve:",
    overviewLink: "Trova creator UGC",
    creatorCrumb: "Diventa creator",
    creatorFooterLink: "Diventa creator",
    creatorDoingTitle: "Cosa fanno i creator UGC",
    creatorStartTitle: "Come iniziare su comtor",
    creatorTipsTitle: "Consigli per buoni contenuti UGC",
    creatorReadyTitle: "Pronto per il tuo primo incarico pagato?",
    creatorBrandHint: "Cerchi creator per il tuo brand? Cos’è l’UGC e come funziona comtor, spiegato in breve:",
    nicheNavLabel: "UGC per nicchia",
  },
  niches,
  hubFaqs,
  creator: creatorPage,
};
