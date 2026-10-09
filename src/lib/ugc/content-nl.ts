import { PLATFORM_FEE_RATE, PLATFORMS, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import type { UgcContent, UgcFaqItem, UgcNichePage } from "@/lib/ugc/types";

// Dutch version of the UGC search landing pages. Same structure as the German source (src/lib/seo-pages.ts,
// src/lib/ugc/content-de.ts), texts written freely in Dutch. Slugs and `niche` values stay identical to the
// German ones because slugs are URLs. No invented numbers, quotes or testimonials, and no "escrow" wording on
// public pages until the payment model is cleared (see docs/legal-readiness.md).

const NBSP = " ";
// Dutch typography: percent sign attached to the number, currency sign first with a non-breaking space.
const FEE = `${PLATFORM_FEE_RATE * 100}%`;
const PRO_FEE = `${PRO_PLATFORM_FEE_RATE * 100}%`;
const PRO_PRICE = `€${NBSP}${PRO_SUBSCRIPTION_PRICE_CENTS / 100}`;

// Questions every page answers the same way, because the answer is the same.
function sharedFaqs(): UgcFaqItem[] {
  return [
    {
      question: "Hoe werkt de betaling?",
      answer: `Het merk betaalt via het platform en niet rechtstreeks aan de creator. Het geld wordt vastgehouden tot de creator de post heeft geplaatst en de link heeft ingediend en het merk de post vrijgeeft. Het merk heeft daarvoor ${RELEASE_REVIEW_DAYS} dagen en kan in die tijd een probleem melden. Reageert het merk niet, dan wordt de betaling automatisch vrijgegeven. De betalingen lopen via Stripe.`,
    },
    {
      question: "Wat kost comtor?",
      answer: `Aanmelden is gratis en er zijn geen vaste kosten. comtor houdt ${FEE} van elke betaling in. Die kosten gaan af van de uitbetaling aan de creator. Het merk betaalt precies het afgesproken bedrag. Merken en creators kunnen een optioneel Pro-abonnement nemen voor ${PRO_PRICE} per maand. Dan betaal je ${PRO_FEE} bij elke betaling waarbij een van beide kanten Pro heeft.`,
    },
    {
      question: "Moeten betaalde posts als reclame worden gemarkeerd?",
      answer:
        "In Duitsland moeten betaalde posts in de regel als reclame worden gemarkeerd. Spreek de markering vóór het plaatsen af in de chat. Dit is geen juridisch advies.",
    },
    {
      question: "Hoe worden de volgersaantallen gecontroleerd?",
      answer:
        "De aantallen geven de creators zelf op. Elk platform dat een creator invult, is gekoppeld aan het echte account. Zo kunnen merken het aantal zelf nakijken vóór het eerste bericht. Merken stellen in hun verzoek een minimumaantal in. Alleen passende creators zien het verzoek.",
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
      question: `Hoe vind ik als ${opts.brandWho} passende creators?`,
      answer: `Je plaatst een verzoek: niche ${opts.label}, taal van de content, minimumaantal volgers, productcategorie${hint}, budget, platform en wat er geleverd moet worden. Creators die ${opts.label} als niche hebben gekozen en bij taal en bereik passen, zien het in hun feed. Bij interesse nemen ze contact met je op in de chat. comtor controleert verzoeken niet handmatig.`,
    },
    {
      question: `Waar vind ik als creator opdrachten ${opts.creatorFrom}?`,
      answer: `Je maakt je profiel aan, kiest maximaal drie niches, bijvoorbeeld ${opts.label}, en vult je platforms in met het aantal volgers. In je feed zie je onder “Voor jou” verzoeken uit je niches. Onder “Alles” zie je alles wat bij je taal en bereik past, met budget en eisen erbij. Met een tik op “Geïnteresseerd” start je de chat met het merk.`,
    },
  ];
}

const PLATFORM_LIST = `${PLATFORMS.slice(0, -1).join(", ")} en ${PLATFORMS[PLATFORMS.length - 1]}`;

const niches: UgcNichePage[] = [
  {
    slug: "beauty",
    niche: "Beauty",
    label: "Beauty",
    title: "UGC-creators voor beautymerken vinden",
    description:
      "Beautymerken vinden UGC-creators voor routinevideo’s, unboxings en productfoto’s. Creators vinden betaalde opdrachten in hun niche. Gratis starten.",
    heading: "UGC-creators voor beautymerken vinden",
    ogLines: ["UGC-creators voor", "beautymerken vinden."],
    lead: "Huidverzorging, make-up, haarverzorging, geuren: wie een beautyproduct koopt, wil zien hoe het er bij echte mensen uitziet. comtor brengt beautymerken samen met creators die precies zulke video’s en foto’s maken. Creators vinden hier betaalde opdrachten in hun niche.",
    formats: [
      {
        title: "Routinevideo",
        text: "Een ochtend- of avondroutine waarin het product stap voor stap voorkomt. Werkt organisch en als advertentie.",
      },
      {
        title: "Unboxing en eerste indrukken",
        text: "Uitpakken, uitproberen, eerlijk zeggen wat opvalt. Goed voor nieuwe producten en sets.",
      },
      {
        title: "Gebruik in detail",
        text: "Hoe breng je het product aan, hoe voelt het, hoe lang blijft het zitten? Close-ups in plaats van studiolook.",
      },
      {
        title: "Foto’s in het dagelijks leven",
        text: "Productfoto’s in de badkamer, aan de kaptafel of onderweg, voor webshop, social media en advertenties.",
      },
    ],
    faqs: [
      {
        question: "Hoe vind ik als beautymerk passende creators?",
        answer:
          "Je plaatst een verzoek: niche Beauty, taal van de content, minimumaantal volgers, productcategorie, budget, platform en wat er geleverd moet worden. Creators die Beauty als niche hebben gekozen en bij taal en bereik passen, zien het in hun feed. Wie interesse heeft, neemt contact met je op in de chat. comtor controleert verzoeken niet handmatig.",
      },
      {
        question: "Waar vind ik als creator opdrachten van beautymerken?",
        answer:
          "Je maakt je profiel aan, kiest maximaal drie niches, bijvoorbeeld Beauty, en vult je platforms in met het aantal volgers. In je feed zie je onder “Voor jou” verzoeken uit je niches. Onder “Alles” zie je alles wat bij je taal en bereik past, met budget en eisen erbij. Met een tik op “Geïnteresseerd” open je de chat met het merk.",
      },
      {
        question: "Krijg ik het product gratis?",
        answer:
          "Dat bepaalt het merk in het verzoek. Daar staat of het product erbij zit. Al het andere, zoals wat er wordt geleverd en de deadline, regel je vooraf in de chat.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "fitness",
    niche: "Fitness",
    label: "Fitness",
    title: "UGC-creators voor fitnessmerken vinden",
    description:
      "Fitnessmerken vinden UGC-creators voor workoutvideo’s, producttests en app-demo’s. Creators vinden betaalde opdrachten in hun niche. Gratis starten.",
    heading: "UGC-creators voor fitnessmerken vinden",
    ogLines: ["UGC-creators voor", "fitnessmerken vinden."],
    lead: "Sportkleding, apparatuur, supplementen, fitnessapps: in fitness overtuigt wat mensen echt gebruiken. comtor brengt fitnessmerken samen met creators die training en dagelijks leven geloofwaardig laten zien. Creators vinden hier betaalde opdrachten in hun niche.",
    formats: [
      {
        title: "Workout met product",
        text: "Een training waarin kleding, apparatuur of accessoires in gebruik te zien zijn.",
      },
      {
        title: "Producttest na een paar weken",
        text: "Eerlijk terugblikken: pasvorm, duurzaamheid, gebruiksgemak. Helpt kopers bij hun keuze.",
      },
      {
        title: "Dagelijks leven en routine",
        text: "Trainingsschema, mealprep of ochtendroutine waarin het product vanzelf bij de dag hoort.",
      },
      {
        title: "App- en tracker-demo",
        text: "Schermopname met uitleg: hoe verloopt een training met de app, wat laat de tracker zien?",
      },
    ],
    faqs: [
      {
        question: "Hoe vind ik als fitnessmerk passende creators?",
        answer:
          "Je plaatst een verzoek: niche Fitness, taal van de content, minimumaantal volgers, productcategorie (bijvoorbeeld sportkleding, supplementen of app), budget, platform en wat er geleverd moet worden. Creators die Fitness als niche hebben gekozen en bij taal en bereik passen, zien het in hun feed. Bij interesse nemen ze contact met je op in de chat.",
      },
      {
        question: "Waar vind ik als creator opdrachten van fitnessmerken?",
        answer:
          "Je maakt je profiel aan, kiest maximaal drie niches, bijvoorbeeld Fitness, en vult je platforms in met het aantal volgers. In je feed zie je onder “Voor jou” verzoeken uit je niches. Onder “Alles” zie je alles wat bij je taal en bereik past. Met “Geïnteresseerd” start je de chat.",
      },
      {
        question: "Wat geldt er voor supplementen en uitspraken over werking?",
        answer:
          "Voor uitspraken over gezondheid en werking gelden strenge regels. Spreek bij voedingssupplementen vóór het filmen in de chat af wat je wel en niet mag zeggen. Dit is geen juridisch advies.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "food",
    niche: "Food",
    label: "Eten",
    title: "UGC-creators voor foodmerken vinden",
    description:
      "Foodmerken vinden UGC-creators voor receptvideo’s, proeverijen en foodfoto’s. Creators vinden betaalde opdrachten in hun niche. Gratis starten.",
    heading: "UGC-creators voor foodmerken vinden",
    ogLines: ["UGC-creators voor", "foodmerken vinden."],
    lead: "Snacks, dranken, kruiden, maaltijdboxen, bakingrediënten: bij eten en drinken telt of je het meteen zelf wilt proeven. comtor brengt foodmerken samen met creators die koken, proeven en laten zien. Creators vinden hier betaalde opdrachten in hun niche.",
    formats: [
      {
        title: "Receptvideo",
        text: "Een gerecht of drankje stap voor stap, met het product als ingrediënt. Laat zien hoe je het gebruikt.",
      },
      {
        title: "Proeverij en eerste indrukken",
        text: "Proeven en eerlijk beschrijven wat opvalt. Past bij nieuwe producten, smaken en cadeausets.",
      },
      {
        title: "Unboxing van maaltijdboxen",
        text: "Een maaltijdbox, proefpakket of cadeauset uitpakken en laten zien.",
      },
      {
        title: "Dagelijks leven en mealprep",
        text: "Ontbijt, voorkoken voor de week of de snack tussendoor: het product als gewoon onderdeel van de dag.",
      },
      {
        title: "Foodfoto’s",
        text: "Gerechten en producten gefotografeerd, voor webshop, social media en advertenties.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Eten",
        brandWho: "foodmerk",
        creatorFrom: "van foodmerken",
        categories: "bijvoorbeeld eten en drinken",
      }),
      {
        question: "Wie regelt de verzending van de producten?",
        answer:
          "Dat spreek je vooraf af in de chat. In het verzoek staat alleen of het product erbij zit. Hoe en wanneer het aankomt, vooral bij gekoeld of snel bederfelijk eten, regel je samen vooraf.",
      },
      {
        question: "Wat geldt er voor uitspraken over gezondheid en werking?",
        answer:
          "Uitspraken als “gezond” of “versterkt de weerstand” zijn bij voeding streng geregeld. Spreek vooraf in de chat af wat je mag zeggen. Dit is geen juridisch advies.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "mode",
    niche: "Fashion",
    label: "Mode",
    title: "UGC-creators voor modemerken vinden",
    description:
      "Modemerken vinden UGC-creators voor outfitvideo’s, pasvideo’s en stylingfoto’s. Creators vinden betaalde opdrachten in hun niche. Gratis starten.",
    heading: "UGC-creators voor modemerken vinden",
    ogLines: ["UGC-creators voor", "modemerken vinden."],
    lead: "Kleding, schoenen, accessoires, sieraden: mode koop je omdat je jezelf erin kunt zien. comtor brengt modemerken samen met creators die items dragen, combineren en laten zien hoe ze in het echt zitten. Creators vinden hier betaalde opdrachten in hun niche.",
    formats: [
      {
        title: "Outfitvideo",
        text: "Eén item, meerdere looks: hoe combineer je het voor werk, vrije tijd en een avondje uit.",
      },
      {
        title: "Pasvideo met eerlijke feedback",
        text: "Pasvorm, materiaal en maat naast de maattabel, in je eigen woorden.",
      },
      {
        title: "Haul en unboxing",
        text: "De bestelling uitpakken en de items een voor een laten zien.",
      },
      {
        title: "Stylingfoto’s in het dagelijks leven",
        text: "Looks op straat, in een café of thuis, voor webshop, social media en advertenties.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Mode",
        brandWho: "modemerk",
        creatorFrom: "van modemerken",
      }),
      {
        question: "Hoe zit het met maat en pasvorm?",
        answer:
          "De maat bespreek je vooraf in de chat, zodat het item past en de post goed wordt. Of het product erbij zit, staat in het verzoek van het merk.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "tech",
    niche: "Tech",
    label: "Tech",
    title: "UGC-creators voor techmerken vinden",
    description:
      "Techmerken vinden UGC-creators voor unboxings, praktijktests en app-demo’s. Creators vinden betaalde opdrachten in hun niche. Gratis starten.",
    heading: "UGC-creators voor techmerken vinden",
    ogLines: ["UGC-creators voor", "techmerken vinden."],
    lead: "Gadgets, accessoires, smart home, software en apps: bij tech willen kopers zien hoe een product in het dagelijks leven werkt. comtor brengt techmerken samen met creators die uitpakken, installeren en uitleggen. Creators vinden hier betaalde opdrachten in hun niche.",
    formats: [
      {
        title: "Unboxing en installatie",
        text: "Uitpakken, aanzetten, instellen: de eerste minuten met het product, zoals kopers ze beleven.",
      },
      {
        title: "Praktijktest",
        text: "Een week met het product: wat werkt, wat irriteert, voor wie loont het?",
      },
      {
        title: "Feature-demo",
        text: "Schermopname of close-up met uitleg over een functie die je anders mist.",
      },
      {
        title: "Zo werkt het",
        text: "Korte tutorial: hoe los je met het product een veelvoorkomend probleem op?",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Tech",
        brandWho: "techmerk",
        creatorFrom: "van techmerken",
        categories: "bijvoorbeeld elektronica of software/app",
      }),
      {
        question: "Hoe krijg ik als creator toegang tot apparaten of software?",
        answer:
          "Bij apparaten bepaalt het merk in het verzoek of het product erbij zit. Bij software en apps spreken jullie in de chat af hoe je toegang krijgt tot een testaccount of een volledige versie.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "reisen",
    niche: "Travel",
    label: "Reizen",
    title: "UGC-creators voor reisaanbieders vinden",
    description:
      "Hotels, reisaanbieders en reismerken vinden UGC-creators voor reisreels, rondleidingen door accommodaties en foto’s. Gratis starten.",
    heading: "UGC-creators voor reisaanbieders vinden",
    ogLines: ["UGC-creators voor", "reisaanbieders vinden."],
    lead: "Hotels, vakantiehuizen, reisorganisaties, bagage en reisapps: reizen boek je op basis van beelden en ervaringen van anderen. comtor brengt reisaanbieders samen met creators die plekken en accommodaties laten zien zoals je ze ter plekke beleeft. Creators vinden hier betaalde opdrachten in hun niche.",
    formats: [
      {
        title: "Reisreel",
        text: "Een plek in 30 seconden: aankomst, de mooiste momenten en een tip om mee te nemen.",
      },
      {
        title: "Rondleiding door de accommodatie",
        text: "Kamer, uitzicht, ontbijt, details: hoe het er echt uitziet en voelt.",
      },
      {
        title: "Drie tips ter plekke",
        text: "Kort format met favoriete plekken, eten en routes buiten de bekende paden.",
      },
      {
        title: "Paklijst en reisaccessoires",
        text: "Koffer, rugzak, adapter: producten echt in gebruik onderweg.",
      },
      {
        title: "Fotoserie",
        text: "Beelden van plek en accommodatie, voor website, social media en advertenties.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Reizen",
        brandWho: "reisaanbieder",
        creatorFrom: "uit de reiswereld",
      }),
      {
        question: "Wie betaalt de reis en het verblijf?",
        answer:
          "Dat spreek je vooraf af in de chat en leg je vast. In het verzoek staat het budget voor de post. Of reis, verblijf of diensten ter plekke daar nog bij komen, spreek je uitdrukkelijk af.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "gaming",
    niche: "Gaming",
    label: "Gaming",
    title: "UGC-creators voor gamingmerken vinden",
    description:
      "Gamingmerken vinden UGC-creators voor gameplayclips, hardwaretests en eerste indrukken. Creators vinden betaalde opdrachten. Gratis starten.",
    heading: "UGC-creators voor gamingmerken vinden",
    ogLines: ["UGC-creators voor", "gamingmerken vinden."],
    lead: "Games, consoles, pc-hardware, accessoires en game-apps: gamers vertrouwen mensen die zelf spelen. comtor brengt gamingmerken samen met creators die spelen, testen en commentaar geven. Creators vinden hier betaalde opdrachten in hun niche.",
    formats: [
      {
        title: "Gameplayclip",
        text: "Een scène uit de game met commentaar: wat maakt het bijzonder, wat valt op?",
      },
      {
        title: "Eerste indrukken",
        text: "De eerste uren in een nieuwe game, open en zonder script.",
      },
      {
        title: "Hardwaretest",
        text: "Muis, headset, toetsenbord of controller in gebruik: gevoel, kwaliteit, bruikbaarheid.",
      },
      {
        title: "Hoogtepunten uit een stream of sessie",
        text: "De beste momenten uit een stream of speelsessie, kort gemonteerd.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Gaming",
        brandWho: "gamingmerk",
        creatorFrom: "van gamingmerken",
      }),
      {
        question: "Op welke platforms kan ik posten?",
        answer: `Creators vullen hun platforms in met het aantal volgers: ${PLATFORM_LIST}. Het merk bepaalt in het verzoek waar er wordt gepost.`,
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "lifestyle",
    niche: "Lifestyle",
    label: "Lifestyle",
    title: "UGC-creators voor lifestylemerken vinden",
    description:
      "Lifestylemerken vinden UGC-creators voor dagelijkse video’s, woonlooks en productfoto’s. Creators vinden betaalde opdrachten. Gratis starten.",
    heading: "UGC-creators voor lifestylemerken vinden",
    ogLines: ["UGC-creators voor", "lifestylemerken vinden."],
    lead: "Wonen, huishouden, organisatie, wellness, accessoires: lifestyleproducten overtuigen als je ze in het echte dagelijks leven ziet. comtor brengt lifestylemerken samen met creators die hun dagelijks leven laten zien. Creators vinden hier betaalde opdrachten in hun niche.",
    formats: [
      {
        title: "Een dag met het product",
        text: "Van ochtend tot avond: waar het product in het dagelijks leven opduikt en wat het makkelijker maakt.",
      },
      {
        title: "Woonlook",
        text: "Een woning, hoek of kast ingericht met het product. Laat zien hoe het in een echt huis werkt.",
      },
      {
        title: "Unboxing en opbouw",
        text: "Uitpakken, opbouwen, uitproberen, inclusief de valkuilen.",
      },
      {
        title: "Routine en gewoontes",
        text: "Ochtend-, avond- of zondagroutine waarin het product vanzelf voorkomt.",
      },
      {
        title: "Foto’s uit het dagelijks leven",
        text: "Productfoto’s in echte situaties, voor webshop, social media en advertenties.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Lifestyle",
        brandWho: "lifestylemerk",
        creatorFrom: "van lifestylemerken",
      }),
      {
        question: "Wat als mijn content meerdere thema’s mixt?",
        answer:
          "Je kunt maximaal drie niches kiezen, bijvoorbeeld Lifestyle, Mode en Eten. In je feed zie je onder “Voor jou” eerst verzoeken uit die niches. Onder “Alles” zie je alles wat bij je taal en bereik past.",
      },
      ...sharedFaqs(),
    ],
  },
];

// Questions for the overview page /ugc.
const hubFaqs: UgcFaqItem[] = [
  {
    question: "Wat is UGC?",
    answer:
      "UGC staat voor user generated content. In marketing zijn dat video’s en foto’s die echte mensen voor een merk maken: een product uitproberen, filmen, laten zien. Het merk gebruikt ze op zijn kanalen, in de webshop of in advertenties. Het gaat om de content, niet om het bereik van de creator.",
  },
  {
    question: "Wat is het verschil met influencer marketing?",
    answer:
      "Bij influencer marketing draait het om het bereik van één persoon: de post staat op haar of zijn kanaal. Bij UGC draait het om de content. Ook kleinere creators kunnen goede video’s leveren. Op comtor bepaalt het merk in het verzoek welk platform en welk minimumaantal volgers het wil. Beide kunnen ook open blijven.",
  },
  {
    question: "Hoe vind ik UGC-creators voor mijn merk?",
    answer:
      "Je maakt gratis een merkprofiel aan en plaatst een verzoek: niche, taal, productcategorie, budget en wat er geleverd moet worden. Passende creators zien het in hun feed en nemen contact met je op in de chat.",
  },
  ...sharedFaqs(),
];

const creator: UgcContent["creator"] = {
  title: "Geld verdienen als UGC-creator",
  description:
    "Betaalde opdrachten van merken vinden als UGC-creator: verzoeken met budget bekijken, afspraken maken in de chat, betaald worden via het platform. Gratis.",
  heading: "Geld verdienen als UGC-creator",
  ogLines: ["Geld verdienen", "als UGC-creator."],
  lead: "UGC-creators maken video’s en foto’s voor merken, zoals echte klanten een product zouden laten zien. Op comtor zie je betaalde verzoeken met budget en eisen. Met een tik toon je interesse en de rest regel je in de chat. Je wordt betaald via het platform.",
  doing: [
    {
      title: "Productvideo’s",
      text: "Een product uitproberen, filmen en eerlijk laten zien hoe het in het dagelijks leven werkt.",
    },
    {
      title: "Unboxings en eerste indrukken",
      text: "Uitpakken, uitproberen, zeggen wat opvalt. Zonder studio, maar wel geloofwaardig.",
    },
    {
      title: "Gebruik en tutorials",
      text: "Stap voor stap laten zien hoe je een product gebruikt en wat het makkelijker maakt.",
    },
    {
      title: "Foto’s in echte situaties",
      text: "Productfoto’s uit het dagelijks leven, voor webshop, social media en advertenties van het merk.",
    },
  ],
  steps: [
    "Profiel aanmaken: Kies maximaal drie niches, vul je platforms in met het aantal volgers en geef de taal van je content aan.",
    "Verzoeken bekijken: In je feed zie je budget, platform en wat er geleverd moet worden voordat je contact opneemt.",
    "Interesse tonen: Met “Geïnteresseerd” open je de chat met het merk en bespreek je details en deadline.",
    "Posten en link indienen: Na het posten dien je de link naar je post in.",
    `Betaald worden: Het merk geeft de post vrij, uiterlijk na ${RELEASE_REVIEW_DAYS} dagen, en de betaling wordt aan jou uitbetaald.`,
  ],
  tips: [
    {
      title: "Laat het product snel zien",
      text: "In de eerste seconden moet duidelijk zijn waar het over gaat en wat het product kan.",
    },
    {
      title: "Praat natuurlijk",
      text: "Eerlijke indrukken in je eigen woorden overtuigen meestal meer dan een uit het hoofd geleerde tekst.",
    },
    {
      title: "Let op licht en geluid",
      text: "Daglicht en een rustige plek zijn vaak genoeg. Goed beeld en helder geluid vallen op.",
    },
    {
      title: "Regel het gebruik vooraf",
      text: "Spreek in de chat af waar het merk je content mag gebruiken, voordat je gaat filmen.",
    },
  ],
  faqs: [
    {
      question: "Heb ik veel volgers nodig?",
      answer:
        "Dat bepaalt het merk: elk verzoek noemt een minimumaantal volgers. Sommige merken stellen geen ondergrens. Onder “Voor jou” zie je verzoeken uit je niches. Onder “Alles” zie je alles wat bij je taal en bereik past.",
    },
    {
      question: "Op welke platforms kan ik posten?",
      answer: `Je vult je platforms in met het aantal volgers: ${PLATFORM_LIST}. Het merk bepaalt in het verzoek waar er wordt gepost.`,
    },
    {
      question: "Hoe snel krijg ik mijn geld?",
      answer: `Zodra het merk je post vrijgeeft, gaat de betaling naar jou. Het merk heeft daarvoor ${RELEASE_REVIEW_DAYS} dagen. Reageert het merk niet, dan wordt de betaling automatisch vrijgegeven. De uitbetaling loopt via Stripe.`,
    },
    {
      question: "Moet ik als UGC-creator een bedrijf inschrijven?",
      answer:
        "Dat hangt van je situatie af, bijvoorbeeld hoe vaak en hoeveel je verdient. Inkomsten moet je in Duitsland in de regel opgeven bij de belasting. Vraag bij twijfel een belastingadviseur. Dit is geen belasting- of juridisch advies.",
    },
    ...sharedFaqs(),
  ],
};

export const ugcContentNl: UgcContent = {
  htmlLang: "nl",
  ogLocale: "nl_NL",
  ui: {
    hubTitle: "UGC-creators vinden en inhuren",
    hubDescription:
      "Merken vinden UGC-creators voor video’s en foto’s, creators vinden betaalde opdrachten. Verzoek plaatsen, afspraken maken in de chat, betalen via het platform. Gratis.",
    hubIntro:
      "Merken hebben video’s en foto’s van echte mensen nodig, creators willen daarvoor betaald worden. comtor brengt ze samen: het merk plaatst een verzoek, passende creators reageren, betaald wordt via het platform.",
    signupNote: "Gratis aanmelden. comtor werkt in je browser, de taal kies je bij de start.",
    creatorCardTitle: "Ben je creator?",
    creatorCardBody:
      "Zo vind je betaalde UGC-opdrachten en word je betaald via het platform: geld verdienen als UGC-creator.",
    byNicheTitle: "UGC per niche",
    howTitle: "Zo werkt comtor",
    forBrands: "Voor merken",
    forCreators: "Voor creators",
    hubBrandSteps: [
      "Verzoek plaatsen: niche, taal, minimumaantal volgers, productcategorie, budget en wat er geleverd moet worden.",
      "Creators reageren: wie past, ziet het verzoek in de feed en schrijft je in de chat.",
      "Betalen en vrijgeven: je betaalt via het platform en geeft de post vrij als hij klopt.",
    ],
    hubCreatorSteps: [
      "Profiel aanmaken: maximaal drie niches en je platforms met het aantal volgers.",
      "Verzoeken bekijken: in je feed zie je budget en eisen voordat je reageert.",
      "Posten en betaald worden: na het posten dien je de link in. Zodra het merk hem vrijgeeft (uiterlijk na {days} dagen), wordt de betaling uitbetaald.",
    ],
    faqTitle: "Veelgestelde vragen",
    formatsTitle: "Deze formats werken in de niche “{label}”",
    nicheBrandSteps: [
      "Verzoek plaatsen: niche {label}, taal, minimumaantal volgers, budget en wat er geleverd moet worden.",
      "Creators reageren: wie past, ziet het verzoek in de feed en schrijft je in de chat.",
      "Betalen en vrijgeven: je betaalt via het platform en geeft de post vrij als hij klopt.",
    ],
    nicheCreatorSteps: [
      "Profiel aanmaken: maximaal drie niches, bijvoorbeeld {label}, en je platforms met het aantal volgers.",
      "Verzoeken bekijken: in je feed zie je budget en eisen voordat je reageert.",
      "Posten en betaald worden: na het posten dien je de link in. Zodra het merk hem vrijgeeft (uiterlijk na {days} dagen), wordt de betaling uitbetaald.",
    ],
    nicheReadyTitle: "Klaar voor je eerste opdracht in de niche “{label}”?",
    overviewLead: "Wat UGC is en hoe comtor werkt, leggen we uit in het overzicht:",
    overviewLink: "UGC-creators vinden",
    creatorCrumb: "Creator worden",
    creatorFooterLink: "Creator worden",
    creatorDoingTitle: "Wat UGC-creators doen",
    creatorStartTitle: "Zo start je op comtor",
    creatorTipsTitle: "Tips voor goede UGC-content",
    creatorReadyTitle: "Klaar voor je eerste betaalde opdracht?",
    creatorBrandHint: "Zoek je creators voor je merk? Wat UGC is en hoe comtor werkt, leggen we uit in het overzicht:",
    nicheNavLabel: "UGC per niche",
  },
  niches,
  hubFaqs,
  creator,
};
