import { FOUNDING_BRAND_LIMIT, FOUNDING_CREATOR_LIMIT, PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import { formatCents } from "@/lib/format";
import type { LegalContent, LegalSection } from "@/lib/legal/types";

// De Nederlandse rechtsteksten: een vertaling ter informatie. Ze volgen en.ts sectie voor sectie en alinea voor alinea;
// houd ze gelijk met de Engelse en de Duitse teksten (de Duitse versie is bindend).
function nlTerms(): LegalSection[] {
  return [
  {
    title: "Toepassing en exploitant",
    body: [
      "Deze voorwaarden gelden voor je gebruik van comtor (comtor.app). De exploitant is Teethawat Kanpai, eenmanszaak (Einzelunternehmer) in Berlijn, Duitsland (zie Impressum). Door een account aan te maken ga je akkoord met deze voorwaarden. Voor gebruikers in Duitsland geldt de Duitse versie van deze voorwaarden.",
      "comtor is uitsluitend het technische platform. Een samenwerking is een overeenkomst tussen het merk en de creator. De exploitant is daar geen partij bij, neemt de creator niet in dienst en verkoopt het product van het merk niet.",
    ],
  },
  {
    title: "Wie comtor mag gebruiken",
    body: [
      "Je moet minstens 18 jaar zijn of het bedrijf mogen vertegenwoordigen namens wie je handelt. Je bent verantwoordelijk voor je inlog en voor wat er op je profiel staat. Eén account per persoon of bedrijf.",
    ],
  },
  {
    title: "De dienst",
    body: [
      "Merken plaatsen een verzoek: wat er gemaakt moet worden, op welk platform, voor welk budget en vóór wanneer. Creators die passen kunnen interesse tonen, in de chat een prijs afspreken en via comtor worden betaald.",
      "Wij beloven geen match, geen aantal weergaven, geen verkoop en geen inkomen. Wat je verdient of uitgeeft, hangt af van de afspraken die je met andere gebruikers maakt.",
    ],
  },
  {
    title: "Wat je uploadt",
    body: [
      "Je behoudt de rechten op wat je uploadt. Je geeft ons toestemming om het te hosten, aan andere gebruikers te tonen en er een back-up van te bewaren, zolang het op comtor staat, zodat de dienst kan werken. Die toestemming eindigt wanneer de content wordt verwijderd, behalve voor kopieën die wij wettelijk moeten bewaren.",
      "Het werk dat een creator voor een merk maakt, is van degene die de twee onderling afspreken. Wij nemen daar geen rechten op.",
    ],
  },
  {
    title: "Jouw verantwoordelijkheid",
    body: [
      "Merken zijn verantwoordelijk voor hun verzoeken, hun beweringen over het product en de rechten op de foto’s die ze uploaden. Creators zijn verantwoordelijk voor hun berichten en moeten die als reclame aanduiden waar de wet dat vereist (in Duitsland bijvoorbeeld als “Werbung” of “Anzeige”).",
      "Als een merk een product verzendt, is die zending een zaak tussen het merk en de creator. Wij verkopen het niet en wij verzenden het niet. Een borg, waar een verzoek erom vraagt, is zekerheid tussen die twee en geen vergoeding van ons.",
      "Als een derde een vordering tegen ons instelt vanwege content die je hebt geüpload, een product dat je hebt verzonden of een samenwerking die je hebt afgesproken, en jou valt een verwijt te maken, dan neem je de vordering en de redelijke kosten van verweer voor jouw rekening. Als je consument bent, geldt dit alleen voor zover de wet dat toestaat.",
    ],
  },
  {
    title: "Kosten",
    body: [
      `Wij rekenen ${PLATFORM_FEE_RATE * 100}% platformkosten op elke betaling die via comtor loopt. Merken en creators kunnen Pro nemen voor ${formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)}/maand. Zolang Pro actief is, zijn de kosten ${PRO_PLATFORM_FEE_RATE * 100}% op elke betaling waarbij het merk of de creator Pro heeft. Pro wordt elke maand verlengd totdat je het opzegt in de Instellingen. Opzeggen stopt de eerstvolgende verlenging. Er zijn geen kosten voor het plaatsen van een verzoek. De eerste ${FOUNDING_BRAND_LIMIT} merken (founding brands) en de eerste ${FOUNDING_CREATOR_LIMIT} creators (founding creators) die zich bij comtor hebben aangemeld, krijgen Pro gratis zolang hun account bestaat. Die Pro heeft geen maandprijs, is niet overdraagbaar en eindigt met het account. Wij kunnen het intrekken als iemand deze voorwaarden schendt.`,
      "De platformkosten worden alleen ingehouden wanneer een betaling aan de creator wordt vrijgegeven. Als een vastgehouden betaling wordt terugbetaald, krijgt het merk die betaling terug en houden wij daarover geen kosten in.",
    ],
  },
  {
    title: "Betalingen die voor je worden vastgehouden",
    body: [
      `Wanneer een merk betaalt, houden wij het geld vast tot de creator de link naar het live bericht indient. Het merk heeft dan ${RELEASE_REVIEW_DAYS} dagen om het goed te keuren, waarna de betaling min onze kosten aan de creator wordt vrijgegeven, of om een probleem te melden. Als het merk geen van beide doet, wordt de betaling vrijgegeven. Als een probleem wordt gemeld, blijft het geld vastgehouden terwijl wij het beoordelen, en geven wij het daarna ofwel vrij aan de creator ofwel terug aan het merk.`,
      "Een merk kan annuleren en een terugbetaling krijgen voordat de creator de link indient. Nadat een betaling is vrijgegeven, kan die niet meer via comtor worden teruggedraaid. Kaartbetalingen en uitbetalingen worden verwerkt door Stripe. Wij zien nooit het volledige kaartnummer.",
    ],
  },
  {
    title: "Gedrag",
    body: [
      "Verzin geen aantallen volgers, plaats geen valse reviews, upload niets waarop je geen recht hebt en verplaats een deal niet buiten comtor om de kosten te ontlopen. Wij kunnen content verwijderen en een account schorsen of sluiten dat deze voorwaarden of de wet schendt.",
      "Om illegale content te melden, of om ons te vragen opnieuw te kijken naar iets wat wij hebben verwijderd, schrijf je naar info@comtor.app. Wij beoordelen het en laten je de uitkomst weten.",
      "Als wij content verwijderen of een account schorsen, laten wij je de reden per e-mail weten. Je kunt via info@comtor.app bezwaar maken tegen de beslissing. Wij bekijken die opnieuw en antwoorden je.",
      "Alleen gebruikers van wie de samenwerking via comtor is afgerond en uitbetaald, kunnen een review achterlaten.",
    ],
  },
  {
    title: "Aansprakelijkheid",
    body: [
      "Wij zijn onbeperkt aansprakelijk bij opzet en grove nalatigheid, bij letsel aan leven, lichaam of gezondheid en op grond van de Produkthaftungsgesetz (Duitse wet op de productaansprakelijkheid). Bij lichte nalatigheid zijn wij alleen aansprakelijk als wij een verplichting schenden die voor de overeenkomst essentieel is, en alleen voor schade die voor dit soort overeenkomst typisch en voorzienbaar is.",
      "Als je een bedrijf bent, is die aansprakelijkheid bij lichte nalatigheid beperkt tot de kosten die je ons in de twaalf maanden vóór de vordering hebt betaald, of tot € 100 als je minder hebt betaald. Deze beperking geldt niet voor de gevallen in de vorige alinea.",
      "Wij zijn niet aansprakelijk voor de kwaliteit, wettigheid of timing van een samenwerking, een bericht of een product dat gebruikers onderling afspreken.",
    ],
  },
  {
    title: "Je account beëindigen",
    body: [
      "Je kunt je account verwijderen in de Instellingen. Wij kunnen een account schorsen of sluiten dat deze voorwaarden schendt. Openstaande betalingen worden afgehandeld volgens de betalingsregels hierboven.",
    ],
  },
  {
    title: "Als je consument bent",
    body: [
      "Als je consument bent in de EU, kan een wettelijk herroepingsrecht van 14 dagen gelden voor Pro en voor andere betaalde diensten die je bij ons op afstand koopt. Een samenwerking die je met een andere gebruiker afspreekt, is een overeenkomst met die gebruiker, niet met ons. Dwingend consumentenrecht van het land waar je woont blijft van toepassing.",
    ],
  },
  {
    title: "Recht en rechtbanken",
    body: [
      "Het Duitse recht is van toepassing. Als je een bedrijf bent, zijn de rechtbanken van Berlijn bevoegd. Als je consument bent, kun je ons dagvaarden waar je woont, en wij dagvaarden jou alleen waar je woont.",
      "Je kunt alleen verrekenen met een vordering die wij niet betwisten of die door een rechter is vastgesteld.",
    ],
  },
  {
    title: "Wijzigingen",
    body: [
      "Wij kunnen deze voorwaarden aanpassen. Over een belangrijke wijziging sturen wij je minstens 15 dagen voordat die ingaat een e-mail. Als je die niet wilt, kun je tot dan je account verwijderen.",
    ],
  },
  ];
}

const NL_SENTRY = "Functional Software, Inc. (Sentry), VS, registreert foutmeldingen van onze website en app (tekst van de fout, opgevraagde pagina, browser) zodat wij fouten kunnen vinden en herstellen (AVG art. 6 lid 1 sub f).";

function nlPrivacy({ sentry }: { sentry: boolean }): LegalSection[] {
  const sections: LegalSection[] = [
  {
    title: "Wie verantwoordelijk is",
    body: [
      "Verwerkingsverantwoordelijke in de zin van de AVG (DSGVO) is Teethawat Kanpai, Sonnenscheinpfad 64, 12277 Berlijn, Duitsland (zie Impressum). Voor alles over je gegevens schrijf je naar info@comtor.app.",
    ],
  },
  {
    title: "Je account",
    body: [
      "Je e-mailadres, een gehasht wachtwoord (nooit in leesbare tekst opgeslagen), of je merk of creator bent, of je e-mailadres is geverifieerd en, als je tweestapsverificatie aanzet, het geheim waarmee je codes worden gecontroleerd. Dit hebben wij nodig om je account te beheren (AVG art. 6 lid 1 sub b). Wij mailen je om je adres te verifiëren, om je wachtwoord te resetten als je daarom vraagt en om je te laten weten wanneer je wachtwoord is gewijzigd.",
      "Als wij een account schorsen wegens schending van onze voorwaarden, slaan wij op wanneer en waarom, zodat de beslissing later kan worden getoetst (AVG art. 6 lid 1 sub f).",
      "Bij het aanmelden slaan wij ook op wanneer je akkoord ging met de voorwaarden en dit privacybeleid en om welke versie het ging, en dat je hebt bevestigd dat je minstens 18 jaar bent. Dit is ons bewijs daarvan (AVG art. 6 lid 1 sub b en f).",
      "Welke stappen van de installatie je hebt gezien of afgerond, wordt bij je account opgeslagen, zodat wij de installatie kunnen verbeteren (AVG art. 6 lid 1 sub f).",
      "Aan het einde van de installatie vragen wij, op vrijwillige basis, hoe je van ons hebt gehoord (bijvoorbeeld een zoekmachine of een vriend). Alleen als je antwoordt, slaan wij de gekozen optie bij je account op, om te zien welke kanalen mensen naar ons brengen (AVG art. 6 lid 1 sub a). Je kunt de vraag overslaan. Het antwoord wordt met het account verwijderd.",
      "Als je via een link met campagnegegevens bij ons komt (bijvoorbeeld vanuit een advertentie) en je aanmeldt, slaan wij die gegevens (bron, medium, campagne) bij je account op, om te zien welke reclame tot aanmeldingen leidt (AVG art. 6 lid 1 sub f). Wij plaatsen hiervoor geen cookie en gebruiken geen tracker: de gegevens staan alleen in het adres van de link en worden alleen opgeslagen wanneer je je registreert. Wij verwijderen ze met het account.",
      "Wij hebben je e-mailadres en wachtwoord nodig om een overeenkomst met je aan te gaan en uit te voeren. Zonder die gegevens is er geen account. Al het overige dat je invult is vrijwillig, behalve wat vereist is voor uitbetalingen (Stripe verifieert daarvoor je identiteit).",
    ],
  },
  {
    title: "Profielen en verzoeken",
    body: [
      "Wat je op je profiel invult: voor merken bedrijfsnaam, logo, website, niche, beschrijving en sociale links; voor creators weergavenaam, foto, niche, bio, taal, en platforms met aantallen volgers en links. Een verzoek van een merk bevat een titel, beschrijving, foto’s, budget, platform en content, uiterste plaatsingsdatum en productgegevens.",
      "Profielen en verzoeken worden aan andere gebruikers getoond (zo werkt de matching) en op onze servers opgeslagen (AVG art. 6 lid 1 sub b).",
    ],
  },
  {
    title: "Berichten, aanbiedingen en betalingen",
    body: [
      "Berichten, aanbiedingen en de links die creators voor hun berichten indienen, worden opgeslagen en zijn zichtbaar voor de andere kant van het gesprek. Voor betalingen bewaren wij het bedrag, de kosten, de status en de data; de betaling zelf loopt via Stripe en wij zien nooit je volledige kaartgegevens. Reviews, meldingen en blokkades worden opgeslagen zodat die functies werken (AVG art. 6 lid 1 sub b).",
    ],
  },
  {
    title: "E-mails die wij je sturen",
    body: [
      "Account-e-mails (verificatie, wachtwoord resetten, gewijzigd wachtwoord) worden verstuurd omdat je een account hebt (AVG art. 6 lid 1 sub b). Ze worden verzonden via Resend.",
      "Af en toe productnieuws is apart en optioneel. Als je dat vakje aanvinkt bij het aanmaken van een account, of het in de Instellingen aanzet, mailen wij je een link. Toestemming is de knop op die pagina, niet het openen van de mail. Wij slaan het tijdstip van je bevestiging op (AVG art. 6 lid 1 sub a). Je kunt het in de Instellingen stoppen en wij stoppen dan. Een onbevestigd verzoek is geen toestemming.",
      "Wij sturen reclame-e-mails alleen naar mensen die daar vooraf mee hebben ingestemd (AVG art. 6 lid 1 sub a, § 7 lid 2 nr. 3 UWG). Een adres dat op een lijst staat, is niet genoeg. Wij slaan de naam en het e-mailadres op, een notitie over hoe en wanneer je hebt ingestemd en welk bericht wij je hebben gestuurd (verzendlog, 90 dagen). Wij registreren niet of je een e-mail opent of op een link klikt. Elk van deze e-mails vertelt je waarom je hem krijgt en bevat een afmeldlink (ook als one-click-afmelding in je mailprogramma).",
      "Je kunt je toestemming op elk moment intrekken, met de link in de e-mail of door te schrijven naar info@comtor.app. Wij verwijderen dan je adres en het verzendlog. Wij bewaren alleen een hash van het adres, zodat wij je niet per ongeluk opnieuw schrijven (AVG art. 6 lid 1 sub c en f).",
    ],
  },
  {
    title: "Wachtlijst",
    body: [
      "Als je op onze homepage je e-mailadres achterlaat om te horen wanneer de iOS- en Android-apps uit zijn, slaan wij dat op samen met de keuze of je merk of creator bent, en sturen wij je eerst een e-mail met een link om te bevestigen dat het adres van jou is (double opt-in). Pas als je hebt bevestigd, gebruiken wij het, uitsluitend voor die ene e-mail (AVG art. 6 lid 1 sub a); wij bewaren het tijdstip van je bevestiging als bewijs van je toestemming. Als je niet bevestigt, hoor je niets meer van ons en wordt het adres na 30 dagen verwijderd. Zodra de apps uit zijn en wij het je hebben laten weten, wordt het adres verwijderd. Je kunt je toestemming op elk moment intrekken door te schrijven naar info@comtor.app, en wij verwijderen het adres dan direct.",
    ],
  },
  {
    title: "Beveiliging en logs",
    body: [
      "Bij elke login worden het tijdstip, of de login is gelukt, je IP-adres en je browser vastgelegd, zodat je je recente logins in de Instellingen kunt zien en wij misbruik zoals het raden van wachtwoorden kunnen stoppen. Wanneer je comtor gebruikt, verwerkt onze hostingprovider daarnaast technische gegevens (IP-adres, tijdstip, opgevraagde pagina, browser) om de dienst te leveren en te beveiligen. Beide berusten op ons gerechtvaardigd belang bij een veilige dienst (AVG art. 6 lid 1 sub f). Wij verwijderen het loginlog na 90 dagen, het bij het aanmelden vastgelegde IP-adres na 7 dagen en de tellers tegen misbruik na 24 uur.",
    ],
  },
  {
    title: "Cookies, lokale opslag en meldingen",
    body: [
      "Wij gebruiken alleen strikt noodzakelijke cookies: een die je ingelogd houdt (30 dagen vanaf je laatste bezoek), twee kortlevende cookies voor het inloggen (bescherming tegen vervalste verzoeken, en het adres waarnaar je terugkeert) en een voor de taal die je hebt gekozen (een jaar). Een wachtwoordwijziging logt je andere apparaten uit. Je instellingen voor weergave en geluid, of je de installatiehint hebt weggeklikt en of je op onze homepage merk of creator hebt gekozen, worden opgeslagen in de lokale opslag van je browser en nooit naar ons verzonden. Er zijn geen analytische of advertentiecookies.",
      "Wij tellen hoe vaak onze homepage en het begin van het aanmelden worden geopend, zonder cookie en zonder je te herkennen: per dag slechts één getal per pagina en herkomst (de naam van de verwijzende website, of de bron en campagne uit de link). Wij slaan je IP-adres, je browserstring of een kenmerk van jou hiervoor niet op. Dit dient om te zien welke reclame en welke pagina’s bezoekers opleveren (AVG art. 6 lid 1 sub f).",
      "Op de pagina’s waar je uitbetalingen instelt, laadt Stripe eigen scripts. Die kunnen eigen cookies of apparaat-ID’s plaatsen om fraude te voorkomen (zie het privacybeleid van Stripe).",
      "Pushmeldingen worden alleen verzonden als je ze aanzet (AVG art. 6 lid 1 sub a). In een browser worden ze bezorgd door de pushdienst daarvan (van Apple, Google of Mozilla, afhankelijk van je browser). In de comtor-app voor iPhone of Android slaan wij een token van je apparaat op en versturen wij ze via de Apple Push Notification service of Firebase Cloud Messaging van Google. Je kunt ze op elk moment uitzetten in de Instellingen, in je browser of in de instellingen van je telefoon. E-mails over je account, zoals verificatie en wachtwoordresets, worden verzonden via Resend.",
    ],
  },
  {
    title: "Dienstverleners",
    body: [
      "Deze partijen verwerken gegevens namens ons en volgens onze instructies (AVG art. 28): Vercel Inc., VS, die de website en app host; Neon Inc., VS, wier database wij gebruiken, gehost in Frankfurt, Duitsland; Resend Inc., VS, die onze e-mails bezorgt (account, outreach en wachtlijst); en Google Ireland Limited, die pushmeldingen aan de Android-app bezorgt via Firebase Cloud Messaging.",
      "Betalingen, uitbetalingen en de identiteitscontroles die voor uitbetalingen vereist zijn, worden afgehandeld door Stripe. Voor een deel van deze verwerking is Stripe Payments Europe, Ltd. (Ierland) zelf verantwoordelijk. Zie het privacybeleid van Stripe.",
      "Pushmeldingen aan de iPhone-app worden bezorgd door Apple Inc., VS, via de Apple Push Notification service.",
      "Waar gegevens in de VS terechtkomen, berust de doorgifte op het EU-VS Data Privacy Framework of op de standaardcontractbepalingen van de EU.",
    ],
  },
  {
    title: "Hoe lang wij gegevens bewaren",
    body: [
      "Wij bewaren je gegevens zolang je een account hebt. Wanneer je je account in de Instellingen verwijdert, worden je profiel, verzoeken, berichten en alles wat daarmee samenhangt mee verwijderd.",
      "De uitzondering zijn betalingsgegevens (bedrag, kosten, status, datum en Stripe-kenmerken). Die moeten wij bewaren zolang het belasting- en handelsrecht dat vereisen, 8 tot 10 jaar afhankelijk van het stuk (AVG art. 6 lid 1 sub c, § 147 AO en § 257 HGB). Ze worden geanonimiseerd, zodat ze niet meer naar jou verwijzen. Stripe bewaart eigen betalingsgegevens zoals de wet vereist.",
      "Overige termijnen: loginlog 90 dagen, bij het aanmelden vastgelegd IP-adres 7 dagen, tellers tegen misbruik 24 uur, verzendlog van reclame-e-mails 90 dagen, onbevestigde wachtlijstadressen 30 dagen.",
    ],
  },
  {
    title: "Je rechten",
    body: [
      "Je kunt vragen om inzage in je gegevens (AVG art. 15), om rectificatie (art. 16), verwijdering (art. 17) of beperking (art. 18), en om ze in een overdraagbaar formaat te ontvangen (art. 20). De export in de Instellingen geeft je op elk moment een kopie. Je kunt bezwaar maken tegen verwerking die op een gerechtvaardigd belang berust (art. 21) en elke toestemming voor de toekomst intrekken (art. 7 lid 3). Schrijf gewoon naar info@comtor.app.",
      "Je hebt ook het recht om een klacht in te dienen bij een toezichthoudende autoriteit voor gegevensbescherming. Voor ons is dat de Berlijnse commissaris voor gegevensbescherming en vrijheid van informatie (Berliner Beauftragte für Datenschutz und Informationsfreiheit).",
    ],
  },
  {
    title: "Geen geautomatiseerde besluiten",
    body: [
      "Welke verzoeken een creator ziet, wordt bepaald door eenvoudige regels (niche, contenttaal en aantal volgers), niet door geautomatiseerde besluitvorming met rechtsgevolgen of vergelijkbaar aanzienlijke gevolgen (AVG art. 22).",
    ],
  },
  {
    title: "Wijzigingen",
    body: ["Wij passen dit beleid aan wanneer de dienst verandert; de datum bovenaan toont de geldende versie."],
  },
  ];
  // Sentry wordt alleen genoemd waar het is ingeschakeld, zodat de tekst overeenkomt met wat draait.
  return sentry
    ? sections.map((section) =>
        section.title === "Dienstverleners" ? { ...section, body: [section.body[0], NL_SENTRY, ...section.body.slice(1)] } : section,
      )
    : sections;
}

const NL_LICENSES: LegalSection[] = [
  {
    title: "Open-sourcesoftware",
    body: [
      "comtor is gebouwd met open-sourcesoftware. Elk pakket valt onder een eigen licentie, meestal MIT, Apache-2.0, ISC en BSD. De licentieteksten van alles waarmee de uitgerolde app is gebouwd, staan in het bestand dat hieronder is gelinkt.",
    ],
  },
  {
    title: "Lettertypen",
    body: [
      "De tekst is gezet in Lato, Copyright (c) 2010-2014 by tyPoland Lukasz Dziedzic (team@latofonts.com) with Reserved Font Name \"Lato\", onder de SIL Open Font License, Version 1.1.",
    ],
  },
  {
    title: "Iconen en merknamen",
    body: [
      "Interface-iconen komen van Feather en Ionicons (beide MIT-licentie); de kenmerken van de sociale platforms zijn van Simple Icons (CC0). De namen en logo’s van Instagram, TikTok, YouTube, Twitch en X zijn eigendom van hun eigenaren en worden alleen getoond om het platform te benoemen.",
    ],
  },
  {
    title: "Foto’s",
    body: [
      "De productfoto’s op de landingspagina komen van Unsplash en worden gebruikt onder de Unsplash License. De merken, creators en beoordelingen in de voorbeelden zijn verzonnen.",
    ],
  },
];

export const legalNl: LegalContent = {
  htmlLang: "nl",
  notice: "Deze pagina is een vertaling ter informatie. Bij verschillen geldt de Duitse versie.",
  updated: "7 oktober 2026",
  ui: {
    termsTitle: "Algemene voorwaarden",
    termsDescription: "De voorwaarden voor het gebruik van comtor.",
    privacyTitle: "Privacybeleid",
    privacyDescription: "Welke persoonsgegevens comtor verwerkt, waarom, en welke rechten je hebt.",
    imprintTitle: "Impressum",
    imprintDescription: "Gegevens conform § 5 DDG.",
    vatLabel: "Btw-identificatienummer",
    licensesTitle: "Open-sourcelicenties",
    licensesDescription: "Welke software, lettertypen en afbeeldingen comtor gebruikt, en onder welke licenties.",
    licensesTextFile: "Licentieteksten van alle open-sourcepakketten (tekstbestand)",
    licensesOfl: "Lato: SIL Open Font License",
  },
  terms: nlTerms,
  privacy: nlPrivacy,
  imprint: {
    lead: "Gegevens conform § 5 DDG.",
    rows: [
      { label: "Aanbieder", lines: ["Teethawat Kanpai", "Eenmanszaak (Einzelunternehmen)", "Sonnenscheinpfad 64", "12277 Berlijn, Duitsland"] },
      { label: "Contact", lines: ["info@comtor.app", "+49 172 4134526"] },
      { label: "Verantwoordelijk voor de inhoud", lines: ["Teethawat Kanpai, adres als hierboven (§ 18 lid 2 MStV)"] },
    ],
    disputeTitle: "Geschillenbeslechting voor consumenten",
    dispute: "Wij zijn niet bereid en niet verplicht deel te nemen aan geschillenbeslechtingsprocedures voor een consumentengeschillencommissie.",
  },
  licenses: NL_LICENSES,
};
