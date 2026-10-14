import type { emails } from "@/lib/i18n/messages/emails-en";
import type { DeepString } from "@/lib/i18n/messages/types";

// Nederlands: % staat direct achter het getal, € krijgt een vaste spatie (U+00A0) voor het bedrag.
export const emailsNl: DeepString<typeof emails> = {
  chrome: {
    pasteLink: "Werkt de knop niet? Plak deze link in je browser:",
    stop: "Deze e-mails stoppen",
    tagline: "Merken ontmoeten de juiste creators.",
    imprint: "Impressum",
    privacy: "Privacy",
    numberLocale: "nl-NL",
  },
  welcome: {
    subject: "Welkom bij comtor – bevestig je e-mailadres",
    preview: "Bedankt voor je aanmelding. Eén tik en je e-mailadres is bevestigd.",
    heading: "Welkom bij comtor.",
    bodyCreator: "Bedankt voor je aanmelding. Bevestig je e-mailadres en swipe dan door deals van merken, met het budget direct op de kaart.",
    bodyBrand: "Bedankt voor je aanmelding. Bevestig je e-mailadres en plaats dan je eerste verzoek. Creators komen naar jou.",
    foundingCreator:
      "Je bent founding creator nr. {number}. Pro is gratis voor jou, zolang je account bestaat. comtor houdt {pro}% van elke betaling in in plaats van {standard}%, en jij houdt {keep}%.",
    foundingBrand:
      "Je bent founding brand nr. {number}. Pro is gratis voor jou, zolang je account bestaat. comtor houdt {pro}% van elke betaling in in plaats van {standard}%.",
    action: "E-mailadres bevestigen",
    note: "De link werkt 24 uur. Heb je je niet aangemeld bij comtor? Dan kun je deze e-mail negeren.",
  },
  foundingNotice: {
    subject: "Pro is voor jou voorgoed gratis",
    previewCreator: "Je hoort bij de eerste creators op comtor.",
    previewBrand: "Je hoort bij de eerste merken op comtor.",
    heading: "Je hebt Pro, voorgoed.",
    bodyCreator:
      "Je hoort bij de eerste {limit} creators op comtor (founding creator nr. {number}). Daarom is Pro gratis voor jou, zolang je account bestaat. comtor houdt {pro}% in plaats van {standard}% van elke betaling in, dus jij houdt {keep}%. Je hoeft niets te doen.",
    bodyBrand:
      "Je hoort bij de eerste {limit} merken op comtor (founding brand nr. {number}). Daarom is Pro gratis voor jou, zolang je account bestaat. comtor houdt {pro}% in plaats van {standard}% van elke betaling in. Je hoeft niets te doen.",
    subscription: "Je Pro-abonnement van eerder loopt door en wordt nog steeds in rekening gebracht. Je kunt het opzeggen bij Instellingen en houdt Pro.",
    action: "Bekijk je abonnement",
    note: "Je krijgt deze e-mail omdat je een comtor-account hebt. Hij gaat over je abonnement en is geen reclame.",
  },
  marketingWelcome: {
    note: "Je krijgt deze e-mail omdat je toestemming hebt gegeven om van comtor te horen. Je kunt dit altijd stoppen met de link hieronder.",
    noteWithReason:
      "Je krijgt deze e-mail omdat je toestemming hebt gegeven om van comtor te horen ({reason}). Je kunt dit altijd stoppen met de link hieronder.",
    hint: "Kijk eerst rond. Aanmelden kan op de pagina.",
    creator: {
      preview: "Verdien geld met posten op social media.",
      heading: "Verdien geld met posten op social media.",
      headingNamed: "{name}, verdien geld met posten op social media.",
      body: "Op comtor plaatsen merken een betaalde deal en swipe jij de deals die je wilt. Het budget staat op de kaart. Het merk betaalt voordat jij post, en jij houdt {keep}%.",
      steps: {
        swipe: {
          title: "Swipe een deal.",
          text: "Rechts betekent: ik wil dit. Links betekent: ik sla over. Het merk ziet je profiel en kan je een bericht sturen.",
        },
        budget: {
          title: "Het budget staat op de kaart.",
          text: "Geen DM’s meer over je tarief. Elk verzoek zegt wat het betaalt, wat je moet posten en of het product erbij zit.",
        },
        paid: {
          title: "Betaald voordat je post.",
          text: "Accepteer het bod en het merk betaalt eerst. Het geld wordt vastgehouden tot je post live staat.",
        },
        keep: {
          title: "Jij houdt {keep}%.",
          text: "Het merk heeft {days} dagen om je post goed te keuren. Reageert het niet, dan gaat het geld toch naar jou. Met Pro (€ {price} per maand) houd je {proKeep}%.",
        },
      },
      crowdOne: "merk is er al",
      crowdMany: "merken zijn er al",
      action: "Bekijk betaalde deals",
    },
    brand: {
      preview: "Laat je merk groeien met contentcreators.",
      heading: "Laat je merk groeien met contentcreators.",
      headingNamed: "{name}, laat je merk groeien met contentcreators.",
      body: "Op comtor zet je het product, het budget en de gewenste content neer. Creators die passen swipen naar rechts en komen naar jou. Je betaalt zodra jullie het eens zijn. Het geld wordt vastgehouden tot de post live staat.",
      steps: {
        post: {
          title: "Plaats product en budget.",
          text: "Foto’s, budget, platform en wat er gepost moet worden. Creators krijgen het als kaart in hun feed.",
        },
        come: {
          title: "Creators komen naar jou.",
          text: "Creators in jouw niche swipen naar rechts. Je ziet hun bereik en reviews en kiest wie past.",
        },
        chat: {
          title: "Spreek het af in de chat.",
          text: "Stuur een bod. Accepteert de creator, dan betaal jij, en het geld wordt vastgehouden tot de post live staat.",
        },
        paidOut: {
          title: "Dan volgt de uitbetaling.",
          text: "Je controleert eerst de live post. Geen vaste kosten: comtor houdt {fee}% van elke betaling in, of {proFee}% met Pro (€ {price} per maand).",
        },
      },
      crowdOne: "creator is er al",
      crowdMany: "creators zijn er al",
      action: "Plaats je eerste deal",
    },
  },
  verification: {
    subject: "Bevestig je comtor-e-mailadres",
    preview: "Bevestig dat dit jouw adres is. De link werkt 24 uur.",
    heading: "Bevestig je e-mailadres.",
    body: "Bevestig dat dit adres bij je comtor-account hoort.",
    action: "E-mailadres bevestigen",
    note: "De link werkt 24 uur. Heb je je niet aangemeld bij comtor? Dan kun je deze e-mail negeren.",
  },
  passwordReset: {
    subject: "Stel je comtor-wachtwoord opnieuw in",
    preview: "Kies een nieuw wachtwoord. De link werkt 1 uur.",
    heading: "Stel je wachtwoord opnieuw in.",
    body: "Iemand heeft gevraagd om je comtor-wachtwoord opnieuw in te stellen. Was jij dat, kies dan een nieuw wachtwoord.",
    action: "Nieuw wachtwoord kiezen",
    note: "De link werkt één keer en 1 uur. Met een nieuw wachtwoord word je overal uitgelogd. Heb je dit niet aangevraagd? Negeer deze e-mail, dan blijft je wachtwoord hetzelfde.",
  },
  passwordChanged: {
    subject: "Je comtor-wachtwoord is gewijzigd",
    preview: "Was jij dat, dan is alles in orde.",
    heading: "Je wachtwoord is gewijzigd.",
    body: "Je comtor-wachtwoord is zojuist gewijzigd en we hebben je andere apparaten uitgelogd. Was jij dat, dan is alles in orde.",
    action: "Wachtwoord opnieuw instellen",
    note: "Was jij het niet? Stel je wachtwoord direct opnieuw in. Dat logt iedereen uit die het heeft gewijzigd.",
  },
  accountSuspended: {
    subject: "Je comtor-account is geschorst",
    preview: "Hier lees je waarom, en hoe je bezwaar maakt.",
    heading: "Je account is geschorst.",
    body: "We hebben je comtor-account geschorst. Reden: {reason} Zolang het geschorst is, kun je niet inloggen. We sluiten de openstaande verzoeken van een merkaccount.",
    action: "Bezwaar maken tegen dit besluit",
    objectSubject: "Geschorst account",
    note: "Denk je dat dit een vergissing is? Antwoord op deze e-mail of schrijf naar info@comtor.app. We bekijken het opnieuw en antwoorden je.",
  },
  test: {
    subject: "comtor-testmail",
    preview: "Kun je dit lezen, dan werkt e-mail van comtor.",
    heading: "Het werkt.",
    body: "Dit is een testmail uit het admingedeelte. Staat hij in je inbox, dan komen ook de e-mails voor aanmelden, bevestigen en wachtwoorden aan.",
    action: "comtor openen",
    note: "Verstuurd door een admin via /admin/email. Je hoeft niets te doen.",
  },
  marketingConsent: {
    subject: "Bevestig nieuws van comtor",
    preview: "Eén knop, dan mogen we je af en toe nieuws over comtor sturen.",
    heading: "Bevestig productnieuws.",
    body: "Je hebt om af en toe een e-mail over comtor gevraagd. Druk op de volgende pagina op de knop om te bevestigen. Tot die tijd krijgt dit adres geen productnieuws.",
    action: "Bekijken en bevestigen",
    note: "Heb je dit niet gevraagd? Negeer de e-mail. Er wordt niets aangezet voordat je op de knop drukt.",
  },
  waitlistConfirmation: {
    subject: "Bevestig je plek op de comtor-wachtlijst",
    preview: "Eén tik en je hoort van ons zodra de apps er zijn.",
    heading: "Bevestig je e-mailadres.",
    body: "Je wilde weten wanneer de comtor-apps voor iOS en Android uit zijn. Bevestig dat dit adres van jou is, dan sta je op de lijst.",
    action: "E-mailadres bevestigen",
    note: "We sturen je één e-mail, op de dag dat de apps uit zijn. Heb je je niet aangemeld? Negeer dan deze e-mail, dan hoor je niets van ons.",
  },
};
