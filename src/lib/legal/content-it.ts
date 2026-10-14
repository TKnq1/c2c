import { FOUNDING_BRAND_LIMIT, FOUNDING_CREATOR_LIMIT, PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import { formatCents } from "@/lib/format";
import type { LegalContent, LegalSection } from "@/lib/legal/types";

// The Italian legal texts, a courtesy translation of en.ts. Keep them in step with the English and German texts
// (the German version governs).
function itTerms(): LegalSection[] {
  return [
  {
    title: "Ambito di applicazione e gestore",
    body: [
      "Queste condizioni si applicano all’uso di comtor (comtor.app). Il gestore è Teethawat Kanpai, imprenditore individuale (Einzelunternehmer) a Berlino, Germania (vedi Impressum). Creando un account accetti queste condizioni. Per gli utenti in Germania vale la versione tedesca di queste condizioni.",
      "comtor è solo la piattaforma tecnica. Una collaborazione è un contratto tra il brand e il creator. Il gestore non ne è parte, non assume il creator alle proprie dipendenze e non vende il prodotto del brand.",
    ],
  },
  {
    title: "Chi può usare comtor",
    body: [
      "Devi avere almeno 18 anni oppure essere autorizzato a vincolare l’azienda per cui agisci. Sei responsabile del tuo accesso e della veridicità di quanto indicato nel tuo profilo. Un account per persona o azienda.",
    ],
  },
  {
    title: "Il servizio",
    body: [
      "I brand pubblicano una richiesta: cosa vogliono far realizzare, su quale piattaforma, con quale budget e per quando. I creator idonei possono manifestare interesse, concordare un prezzo in chat ed essere pagati tramite comtor.",
      "Non promettiamo alcuna corrispondenza, alcun numero di visualizzazioni, alcuna vendita né alcun reddito. Ciò che guadagni o spendi dipende dagli accordi che prendi con gli altri utenti.",
    ],
  },
  {
    title: "Cosa carichi",
    body: [
      "Mantieni i diritti su ciò che carichi. Ci autorizzi a ospitarlo, mostrarlo agli altri utenti e conservarne una copia di backup, finché resta su comtor, in modo che il servizio possa funzionare. Questa autorizzazione termina quando il contenuto viene eliminato, fatte salve le copie che siamo tenuti a conservare per legge.",
      "Il lavoro che un creator realizza per un brand appartiene a chi i due concordano. Non acquisiamo diritti su quel lavoro.",
    ],
  },
  {
    title: "La tua responsabilità",
    body: [
      "I brand sono responsabili delle loro richieste, delle loro dichiarazioni sul prodotto e dei diritti sulle foto che caricano. I creator sono responsabili dei loro post e devono contrassegnarli come pubblicità dove la legge lo richiede (in Germania, ad esempio, come «Werbung» o «Anzeige»).",
      "Se un brand spedisce un prodotto, la spedizione riguarda solo il brand e il creator. Noi non lo vendiamo e non lo spediamo. Una cauzione, se una richiesta la prevede, è una garanzia tra le due parti, non una commissione nostra.",
      "Se un terzo avanza una pretesa nei nostri confronti a causa di un contenuto che hai caricato, di un prodotto che hai spedito o di una collaborazione che hai concordato, e la colpa è tua, ti farai carico della pretesa e dei ragionevoli costi di difesa. Se sei un consumatore, ciò vale solo nei limiti consentiti dalla legge.",
    ],
  },
  {
    title: "Commissioni",
    body: [
      `Applichiamo una commissione di piattaforma del ${PLATFORM_FEE_RATE * 100}% su ogni pagamento effettuato tramite comtor. I brand e i creator possono abbonarsi a Pro per ${formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/mese. Finché Pro è attivo, la commissione è del ${PRO_PLATFORM_FEE_RATE * 100}% su ogni pagamento per cui il brand o il creator ha Pro. Pro si rinnova ogni mese finché non lo disdici nelle Impostazioni. La disdetta interrompe il rinnovo successivo. Non c’è alcuna commissione per la pubblicazione. I primi ${FOUNDING_BRAND_LIMIT} brand (brand fondatori) e i primi ${FOUNDING_CREATOR_LIMIT} creator (creator fondatori) che si sono registrati su comtor ottengono Pro gratuitamente per tutto il tempo in cui esiste il loro account. Questo Pro non ha un prezzo mensile, non è trasferibile e termina con l’account. Possiamo revocarlo se qualcuno viola queste condizioni.`,
      "La commissione di piattaforma viene trattenuta solo quando un pagamento è liberato al creator. Se un pagamento trattenuto viene rimborsato, il brand riceve indietro quell’importo e noi non tratteniamo alcuna commissione su di esso.",
    ],
  },
  {
    title: "Pagamenti trattenuti per te",
    body: [
      `Quando un brand paga, tratteniamo il denaro finché il creator non invia il link al post pubblicato. Il brand ha poi ${RELEASE_REVIEW_DAYS} giorni per approvarlo, il che libera il pagamento al creator al netto della nostra commissione, oppure per segnalare un problema. Se il brand non fa né l’una né l’altra cosa, il pagamento viene liberato. Se viene segnalato un problema, il denaro resta trattenuto mentre lo esaminiamo, e poi lo liberiamo al creator oppure lo rimborsiamo al brand.`,
      "Un brand può annullare ed essere rimborsato prima che il creator invii il link. Dopo che un pagamento è stato liberato, non può essere annullato tramite comtor. I pagamenti con carta e i versamenti sono elaborati da Stripe. Non vediamo mai il numero completo della carta.",
    ],
  },
  {
    title: "Condotta",
    body: [
      "Non inventare numeri di follower, non pubblicare recensioni false, non caricare nulla su cui non hai diritti e non spostare un accordo fuori da comtor per evitare la commissione. Possiamo rimuovere contenuti e sospendere o chiudere un account che viola queste condizioni o la legge.",
      "Per segnalare contenuti illeciti, o per chiederci di riesaminare qualcosa che abbiamo rimosso, scrivi a info@comtor.app. Lo esamineremo e ti comunicheremo l’esito.",
      "Se rimuoviamo un contenuto o sospendiamo un account, te ne comunichiamo il motivo via e-mail. Puoi opporti alla decisione scrivendo a info@comtor.app. La riesamineremo e ti risponderemo.",
      "Solo gli utenti la cui collaborazione è stata completata e pagata tramite comtor possono lasciare una recensione.",
    ],
  },
  {
    title: "Responsabilità",
    body: [
      "Siamo responsabili senza limiti in caso di dolo e colpa grave, per lesioni alla vita, al corpo o alla salute e ai sensi della legge tedesca sulla responsabilità per danno da prodotto (Produkthaftungsgesetz). In caso di colpa lieve siamo responsabili solo se violiamo un obbligo essenziale per il contratto, e solo per il danno tipico e prevedibile per questo tipo di contratto.",
      "Se sei un’azienda, tale responsabilità per colpa lieve è limitata alle commissioni che ci hai pagato nei dodici mesi precedenti la pretesa, oppure a 100 € se hai pagato meno. Questo limite non si applica ai casi del paragrafo precedente.",
      "Non siamo responsabili della qualità, della liceità o della tempistica di una collaborazione, di un post o di un prodotto che gli utenti concordano tra loro.",
    ],
  },
  {
    title: "Chiusura del tuo account",
    body: [
      "Puoi eliminare il tuo account nelle Impostazioni. Possiamo sospendere o chiudere un account che viola queste condizioni. I pagamenti in sospeso vengono conclusi secondo le regole sui pagamenti riportate sopra.",
    ],
  },
  {
    title: "Se sei un consumatore",
    body: [
      "Se sei un consumatore nell’UE, per Pro e per gli altri servizi a pagamento che acquisti da noi a distanza può valere un diritto di recesso legale di 14 giorni. Una collaborazione che concordi con un altro utente è un contratto con quell’utente, non con noi. Rimane comunque applicabile il diritto imperativo a tutela dei consumatori del paese in cui vivi.",
    ],
  },
  {
    title: "Legge e tribunali",
    body: [
      "Si applica il diritto tedesco. Se sei un’azienda, sono competenti i tribunali di Berlino. Se sei un consumatore, puoi citarci in giudizio nel luogo in cui vivi, e noi ti citiamo in giudizio solo nel luogo in cui vivi.",
      "Puoi compensare solo un credito che non contestiamo o che è stato accertato da un tribunale.",
    ],
  },
  {
    title: "Modifiche",
    body: [
      "Possiamo aggiornare queste condizioni. Ti informeremo via e-mail di una modifica rilevante almeno 15 giorni prima della sua applicazione. Se non la accetti, puoi eliminare il tuo account fino ad allora.",
    ],
  },
  ];
}

const IT_SERVICE_PROVIDERS = "Fornitori di servizi";

const IT_SENTRY = "Functional Software, Inc. (Sentry), USA, registra le segnalazioni di errore del nostro sito web e della nostra app (testo dell’errore, pagina richiesta, browser) per consentirci di individuare e correggere gli errori (art. 6, par. 1, lett. f GDPR).";

function itPrivacy({ sentry }: { sentry: boolean }): LegalSection[] {
  const sections: LegalSection[] = [
  {
    title: "Chi è responsabile",
    body: [
      "Il titolare del trattamento ai sensi del GDPR è Teethawat Kanpai, Sonnenscheinpfad 64, 12277 Berlino, Germania (vedi Impressum). Per qualsiasi questione riguardante i tuoi dati, scrivi a info@comtor.app.",
    ],
  },
  {
    title: "Il tuo account",
    body: [
      "Il tuo indirizzo e-mail, una password sottoposta a hash (mai memorizzata in chiaro), se sei un brand o un creator, se la tua e-mail è verificata e, se attivi l’autenticazione a due fattori, il segreto usato per verificare i tuoi codici. Ci serve per gestire il tuo account (art. 6, par. 1, lett. b GDPR). Ti scriviamo per verificare il tuo indirizzo, per reimpostare la tua password quando lo richiedi e per avvisarti quando la tua password è stata modificata.",
      "Se sospendiamo un account per violazione dei nostri termini, memorizziamo quando e perché, in modo che la decisione possa essere riesaminata in seguito (art. 6, par. 1, lett. f GDPR).",
      "Quando ti registri memorizziamo anche quando hai accettato le condizioni e questa informativa sulla privacy e in quale versione, e che hai confermato di avere almeno 18 anni. Questa è la nostra prova (art. 6, par. 1, lett. b e f GDPR).",
      "Quali passaggi della configurazione hai visto o completato viene memorizzato con il tuo account, in modo da poter migliorare la configurazione (art. 6, par. 1, lett. f GDPR).",
      "Al termine della configurazione ti chiediamo, in modo facoltativo, come ci hai conosciuto (ad esempio un motore di ricerca o un amico). Solo se rispondi, memorizziamo l’opzione scelta con il tuo account, per capire quali canali ci portano utenti (art. 6, par. 1, lett. a GDPR). Puoi saltare la domanda. La risposta viene eliminata insieme all’account.",
      "Se arrivi da noi tramite un link con dettagli di campagna (ad esempio da un annuncio) e ti registri, memorizziamo tali dettagli (fonte, mezzo, campagna) con il tuo account, per capire quale pubblicità porta alle registrazioni (art. 6, par. 1, lett. f GDPR). Per questo non impostiamo alcun cookie e non usiamo alcun tracker: i dettagli sono solo nell’indirizzo del link e vengono memorizzati solo quando ti registri. Li eliminiamo insieme all’account.",
      "Ci servono il tuo indirizzo e-mail e la tua password per concludere e adempiere un contratto con te. Senza di essi non c’è un account. Tutto il resto che inserisci è facoltativo, tranne ciò che è richiesto per i versamenti (a tal fine Stripe verifica la tua identità).",
    ],
  },
  {
    title: "Profili e richieste",
    body: [
      "Ciò che inserisci nel tuo profilo: per i brand, nome dell’azienda, logo, sito web, settore, descrizione e link social; per i creator, nome visualizzato, immagine, settore, bio, lingua e piattaforme con numero di follower e link. Le richieste di un brand comprendono titolo, descrizione, foto, budget, piattaforma e contenuto, data di pubblicazione e dettagli del prodotto.",
      "I profili e le richieste vengono mostrati agli altri utenti (è così che funziona l’abbinamento) e memorizzati sui nostri server (art. 6, par. 1, lett. b GDPR).",
    ],
  },
  {
    title: "Messaggi, offerte e pagamenti",
    body: [
      "I messaggi, le offerte e i link che i creator inviano per i loro post vengono memorizzati e sono visibili all’altra parte della conversazione. Per i pagamenti conserviamo importo, commissione, stato e date; il pagamento stesso passa attraverso Stripe e non vediamo mai i dati completi della tua carta. Recensioni, segnalazioni e blocchi vengono memorizzati affinché queste funzioni operino (art. 6, par. 1, lett. b GDPR).",
    ],
  },
  {
    title: "E-mail che ti inviamo",
    body: [
      "Le e-mail dell’account (verifica, reimpostazione della password, password modificata) vengono inviate perché hai un account (art. 6, par. 1, lett. b GDPR). Partono tramite Resend.",
      "Le novità occasionali sul prodotto sono separate e facoltative. Se selezioni quella casella quando crei un account, o la attivi nelle Impostazioni, ti inviamo un link. Il consenso è il pulsante su quella pagina, non l’apertura dell’e-mail. Memorizziamo il momento in cui hai confermato (art. 6, par. 1, lett. a GDPR). Puoi interromperle nelle Impostazioni, e noi smettiamo. Una richiesta non confermata non costituisce consenso.",
      "Inviamo e-mail promozionali solo a persone che vi hanno acconsentito in precedenza (art. 6, par. 1, lett. a GDPR, § 7, par. 2, n. 3 UWG). Un indirizzo salvato in un elenco non è sufficiente. Memorizziamo il nome e l’indirizzo e-mail, una nota su come e quando hai acconsentito e quale messaggio ti abbiamo inviato (registro degli invii, 90 giorni). Non registriamo se apri un’e-mail o clicchi su un link. Ognuna di queste e-mail ti spiega perché la ricevi e contiene un link di disiscrizione (anche come disiscrizione con un clic nel tuo programma di posta).",
      "Puoi revocare il tuo consenso in qualsiasi momento, con il link nell’e-mail o scrivendo a info@comtor.app. Eliminiamo quindi il tuo indirizzo e il registro degli invii. Conserviamo soltanto un hash dell’indirizzo, per non scriverti di nuovo per errore (art. 6, par. 1, lett. c e f GDPR).",
    ],
  },
  {
    title: "Lista d’attesa",
    body: [
      "Se lasci il tuo indirizzo e-mail sulla nostra home page per sapere quando saranno disponibili le app per iOS e Android, lo memorizziamo insieme all’indicazione se hai scelto brand o creator, e ti inviamo prima un’e-mail con un link per confermare che l’indirizzo è tuo (double opt-in). Solo dopo la tua conferma lo utilizziamo, per quella sola e-mail (art. 6, par. 1, lett. a GDPR); conserviamo il momento della tua conferma come prova del tuo consenso. Se non confermi, non avrai più nostre notizie e l’indirizzo viene eliminato dopo 30 giorni. Una volta che le app sono disponibili e te lo abbiamo comunicato, l’indirizzo viene eliminato. Puoi revocare il tuo consenso in qualsiasi momento scrivendo a info@comtor.app, e lo elimineremo subito.",
    ],
  },
  {
    title: "Sicurezza e registri",
    body: [
      "Ogni accesso registra l’ora, se è riuscito, il tuo indirizzo IP e il tuo browser, in modo che tu possa vedere i tuoi accessi recenti nelle Impostazioni e che noi possiamo fermare abusi come i tentativi di indovinare la password. Quando usi comtor, il nostro fornitore di hosting tratta inoltre dati tecnici (indirizzo IP, ora, pagina richiesta, browser) per fornire il servizio e mantenerlo sicuro. Entrambi si fondano sul nostro legittimo interesse a un servizio sicuro (art. 6, par. 1, lett. f GDPR). Eliminiamo il registro degli accessi dopo 90 giorni, l’indirizzo IP registrato alla registrazione dopo 7 giorni e i contatori contro gli abusi dopo 24 ore.",
    ],
  },
  {
    title: "Cookie, archiviazione locale e notifiche",
    body: [
      "Usiamo solo cookie strettamente necessari: uno che ti mantiene connesso (30 giorni dalla tua ultima visita), due di breve durata per l’accesso (protezione contro richieste falsificate e indirizzo a cui tornare) e uno per la lingua che hai scelto (un anno). La modifica della password disconnette i tuoi altri dispositivi. Le tue impostazioni di aspetto e audio, se hai chiuso il suggerimento di installazione e se hai scelto brand o creator sulla nostra home page vengono salvate nell’archiviazione locale del tuo browser e non ci vengono mai inviate. Non ci sono cookie di analisi o pubblicitari.",
      "Contiamo quante volte vengono aperte la nostra home page e l’inizio della registrazione, senza cookie e senza riconoscerti: al giorno solo un numero per pagina e per provenienza (il nome del sito web di provenienza, oppure la fonte e la campagna dal link). Non memorizziamo il tuo indirizzo IP, la stringa del tuo browser né alcun identificativo che ti riguardi. Questo serve a capire quale pubblicità e quali pagine portano visitatori (art. 6, par. 1, lett. f GDPR).",
      "Sulle pagine in cui configuri i versamenti, Stripe carica i propri script. Possono impostare cookie o identificativi del dispositivo propri per prevenire le frodi (vedi l’informativa sulla privacy di Stripe).",
      "Le notifiche push vengono inviate solo se le attivi (art. 6, par. 1, lett. a GDPR). In un browser vengono recapitate dal relativo servizio push (di Apple, Google o Mozilla, a seconda del tuo browser). Nell’app comtor per iPhone o Android memorizziamo un token per il tuo dispositivo e le inviamo tramite Apple Push Notification service o Firebase Cloud Messaging di Google. Puoi disattivarle in qualsiasi momento nelle Impostazioni, nel tuo browser o nelle impostazioni del tuo telefono. Le e-mail relative al tuo account, come la verifica e la reimpostazione della password, vengono inviate tramite Resend.",
    ],
  },
  {
    title: IT_SERVICE_PROVIDERS,
    body: [
      "Questi fornitori trattano dati per nostro conto e secondo le nostre istruzioni (art. 28 GDPR): Vercel Inc., USA, che ospita il sito web e l’app; Neon Inc., USA, di cui usiamo il database, ospitato a Francoforte, Germania; Resend Inc., USA, che recapita le nostre e-mail (account, comunicazioni commerciali e lista d’attesa); e Google Ireland Limited, che recapita le notifiche push all’app Android tramite Firebase Cloud Messaging.",
      "I pagamenti, i versamenti e le verifiche di identità richieste per i versamenti sono gestiti da Stripe. Per una parte di questo trattamento, Stripe Payments Europe, Ltd. (Irlanda) è essa stessa responsabile. Vedi l’informativa sulla privacy di Stripe.",
      "Le notifiche push all’app per iPhone sono recapitate da Apple Inc., USA, tramite Apple Push Notification service.",
      "Quando i dati arrivano negli USA, il trasferimento si fonda sull’EU–U.S. Data Privacy Framework o sulle clausole contrattuali standard dell’UE.",
    ],
  },
  {
    title: "Per quanto tempo conserviamo i dati",
    body: [
      "Conserviamo i tuoi dati finché hai un account. Quando elimini il tuo account nelle Impostazioni, il tuo profilo, le richieste, i messaggi e tutto ciò che vi è collegato vengono eliminati insieme ad esso.",
      "L’eccezione sono i documenti di pagamento (importo, commissione, stato, data e identificativi Stripe). Dobbiamo conservarli per tutto il tempo richiesto dal diritto tributario e commerciale, da 8 a 10 anni a seconda del documento (art. 6, par. 1, lett. c GDPR, § 147 AO e § 257 HGB). Vengono resi anonimi in modo da non riferirsi più a te. Stripe conserva i propri documenti di pagamento come richiesto dalla legge.",
      "Altri periodi: registro degli accessi 90 giorni, indirizzo IP registrato alla registrazione 7 giorni, contatori contro gli abusi 24 ore, registro degli invii delle e-mail promozionali 90 giorni, indirizzi non confermati della lista d’attesa 30 giorni.",
    ],
  },
  {
    title: "I tuoi diritti",
    body: [
      "Puoi chiedere l’accesso ai tuoi dati (art. 15 GDPR), la loro rettifica (art. 16), cancellazione (art. 17) o limitazione (art. 18), e riceverli in un formato portabile (art. 20). L’esportazione nelle Impostazioni ti fornisce una copia in qualsiasi momento. Puoi opporti al trattamento fondato sul legittimo interesse (art. 21) e revocare qualsiasi consenso per il futuro (art. 7, par. 3). Scrivi semplicemente a info@comtor.app.",
      "Hai inoltre il diritto di proporre reclamo a un’autorità di controllo per la protezione dei dati. Per noi è la Commissaria di Berlino per la protezione dei dati e la libertà d’informazione (Berliner Beauftragte für Datenschutz und Informationsfreiheit).",
    ],
  },
  {
    title: "Nessuna decisione automatizzata",
    body: [
      "Quali richieste vede un creator è stabilito da semplici regole (settore, lingua del contenuto e numero di follower), non da un processo decisionale automatizzato che produca effetti giuridici o effetti analoghi significativi (art. 22 GDPR).",
    ],
  },
  {
    title: "Modifiche",
    body: ["Aggiorniamo questa informativa quando il servizio cambia; la data in alto indica la versione attuale."],
  },
  ];
  // Sentry is named only where it is switched on, so the text matches what runs.
  return sentry
    ? sections.map((section) =>
        section.title === IT_SERVICE_PROVIDERS ? { ...section, body: [section.body[0], IT_SENTRY, ...section.body.slice(1)] } : section,
      )
    : sections;
}

const IT_LICENSES: LegalSection[] = [
  {
    title: "Software open source",
    body: [
      "comtor è realizzato con software open source. Ogni pacchetto è soggetto alla propria licenza, per lo più MIT, Apache-2.0, ISC e BSD. I testi delle licenze di tutto ciò con cui è realizzata l’app distribuita si trovano nel file collegato qui sotto.",
    ],
  },
  {
    title: "Font",
    body: [
      "Il testo è composto in Lato, Copyright (c) 2010-2014 by tyPoland Lukasz Dziedzic (team@latofonts.com) with Reserved Font Name \"Lato\", con licenza SIL Open Font License, Version 1.1.",
    ],
  },
  {
    title: "Icone e nomi di marchi",
    body: [
      "Le icone dell’interfaccia provengono da Feather e Ionicons (entrambe con licenza MIT); i marchi delle piattaforme social provengono da Simple Icons (CC0). I nomi e i loghi di Instagram, TikTok, YouTube, Twitch e X appartengono ai rispettivi titolari e sono mostrati solo per indicare la piattaforma.",
    ],
  },
  {
    title: "Foto",
    body: [
      "Le foto dei prodotti nella landing page provengono da Unsplash e sono usate secondo la Unsplash License. I brand, i creator e le valutazioni mostrati negli esempi sono inventati.",
    ],
  },
];

export const legalIt: LegalContent = {
  htmlLang: "it",
  notice: "Questa pagina è una traduzione di cortesia. In caso di differenze prevale la versione tedesca.",
  updated: "7 ottobre 2026",
  ui: {
    termsTitle: "Termini di servizio",
    termsDescription: "Le condizioni per l’uso di comtor.",
    privacyTitle: "Informativa sulla privacy",
    privacyDescription: "Quali dati personali comtor tratta, perché, e quali diritti hai.",
    imprintTitle: "Note legali (Impressum)",
    imprintDescription: "Informazioni ai sensi del § 5 DDG.",
    vatLabel: "Partita IVA (numero di identificazione ai fini IVA)",
    licensesTitle: "Licenze open source",
    licensesDescription: "Quali software, font e immagini comtor utilizza, e con quali licenze.",
    licensesTextFile: "Testi delle licenze di tutti i pacchetti open source (file di testo)",
    licensesOfl: "Lato: SIL Open Font License",
  },
  terms: itTerms,
  privacy: itPrivacy,
  imprint: {
    lead: "Informazioni ai sensi del § 5 DDG.",
    rows: [
      { label: "Fornitore del servizio", lines: ["Teethawat Kanpai", "Imprenditore individuale (Einzelunternehmen)", "Sonnenscheinpfad 64", "12277 Berlino, Germania"] },
      { label: "Contatti", lines: ["info@comtor.app", "+49 172 4134526"] },
      { label: "Responsabile dei contenuti", lines: ["Teethawat Kanpai, indirizzo come sopra (§ 18, par. 2 MStV)"] },
    ],
    disputeTitle: "Risoluzione delle controversie con i consumatori",
    dispute: "Non siamo disposti né obbligati a partecipare a procedure di risoluzione delle controversie dinanzi a un organismo di conciliazione per i consumatori.",
  },
  licenses: IT_LICENSES,
};
