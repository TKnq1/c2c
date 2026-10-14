import type { emails } from "@/lib/i18n/messages/emails-en";
import type { DeepString } from "@/lib/i18n/messages/types";

export const emailsDe: DeepString<typeof emails> = {
  chrome: {
    pasteLink: "Button funktioniert nicht? Füge diesen Link in deinen Browser ein:",
    stop: "Diese E-Mails abbestellen",
    tagline: "Marken treffen die richtigen Creator.",
    imprint: "Impressum",
    privacy: "Datenschutz",
    numberLocale: "de-DE",
  },
  welcome: {
    subject: "Willkommen bei comtor – bestätige deine E-Mail-Adresse",
    preview: "Danke für deine Anmeldung. Ein Klick, und deine E-Mail-Adresse ist bestätigt.",
    heading: "Willkommen bei comtor.",
    bodyCreator: "Danke für deine Anmeldung. Bestätige deine E-Mail-Adresse und wisch dann durch Marken-Deals, mit dem Budget direkt auf der Karte.",
    bodyBrand: "Danke für deine Anmeldung. Bestätige deine E-Mail-Adresse und poste dann deine erste Anfrage. Creator melden sich bei dir.",
    foundingCreator:
      "Du bist Founding Creator Nr. {number}. Pro ist für dich kostenlos, solange dein Konto besteht. Auf jede Zahlung behält comtor {pro} % statt {standard} %, du bekommst {keep} %.",
    foundingBrand:
      "Du bist Founding Brand Nr. {number}. Pro ist für dich kostenlos, solange dein Konto besteht. Auf jede Zahlung behält comtor {pro} % statt {standard} %.",
    action: "E-Mail bestätigen",
    note: "Der Link gilt 24 Stunden. Du hast dich nicht bei comtor angemeldet? Dann kannst du diese E-Mail ignorieren.",
  },
  foundingNotice: {
    subject: "Pro ist für dich dauerhaft kostenlos",
    previewCreator: "Du gehörst zu den ersten Creatorn auf comtor.",
    previewBrand: "Du gehörst zu den ersten Marken auf comtor.",
    heading: "Du hast Pro, dauerhaft kostenlos.",
    bodyCreator:
      "Du gehörst zu den ersten {limit} Creatorn auf comtor (Founding Creator Nr. {number}). Darum ist Pro für dich kostenlos, solange dein Konto besteht. Auf jede Zahlung behält comtor {pro} % statt {standard} %, du bekommst {keep} %. Du musst nichts tun.",
    bodyBrand:
      "Du gehörst zu den ersten {limit} Marken auf comtor (Founding Brand Nr. {number}). Darum ist Pro für dich kostenlos, solange dein Konto besteht. Auf jede Zahlung behält comtor {pro} % statt {standard} %. Du musst nichts tun.",
    subscription: "Dein bisheriges Pro-Abo läuft weiter und wird weiter abgerechnet. Du kannst es in den Einstellungen kündigen und behältst trotzdem Pro.",
    action: "Zu deinem Tarif",
    note: "Du bekommst diese E-Mail, weil du ein comtor-Konto hast. Sie betrifft deinen Tarif und ist keine Werbung.",
  },
  marketingWelcome: {
    note: "Du bekommst diese E-Mail, weil du zugestimmt hast, E-Mails von comtor zu erhalten. Du kannst das jederzeit mit dem Link unten beenden.",
    noteWithReason:
      "Du bekommst diese E-Mail, weil du zugestimmt hast, E-Mails von comtor zu erhalten ({reason}). Du kannst das jederzeit mit dem Link unten beenden.",
    hint: "Schau dich erst einmal um. Die Anmeldung findest du auf der Seite.",
    creator: {
      preview: "Verdiene Geld mit Posts in sozialen Medien.",
      heading: "Verdiene Geld mit Posts in sozialen Medien.",
      headingNamed: "{name}, verdiene Geld mit Posts in sozialen Medien.",
      body: "Auf comtor posten Marken bezahlte Deals, und du wischst die, die du willst. Das Budget steht auf der Karte. Die Marke zahlt, bevor du postest, und du behältst {keep} %.",
      steps: {
        swipe: {
          title: "Wisch einen Deal.",
          text: "Rechts heißt: Du willst ihn, links: Du überspringst ihn. Die Marke sieht dein Profil und kann dir schreiben.",
        },
        budget: {
          title: "Das Budget steht auf der Karte.",
          text: "Schluss mit DMs über deinen Preis. Jede Anfrage nennt die Bezahlung, was gepostet werden soll und ob das Produkt dabei ist.",
        },
        paid: {
          title: "Bezahlt, bevor du postest.",
          text: "Nimmst du das Angebot an, zahlt die Marke zuerst. Das Geld wird zurückgehalten, bis dein Post online ist.",
        },
        keep: {
          title: "Du behältst {keep} %.",
          text: "Die Marke hat {days} Tage Zeit, deinen Post freizugeben. Antwortet sie nicht, geht die Zahlung trotzdem an dich. Mit Pro ({price} € im Monat) behältst du {proKeep} %.",
        },
      },
      crowdOne: "Marke ist schon dabei",
      crowdMany: "Marken sind schon dabei",
      action: "Bezahlte Deals ansehen",
    },
    brand: {
      preview: "Bring deine Marke mit Creatorn voran.",
      heading: "Bring deine Marke mit Creatorn voran.",
      headingNamed: "{name}, bring deine Marke mit Creatorn voran.",
      body: "Auf comtor stellst du Produkt, Budget und gewünschten Inhalt ein. Passende Creator wischen nach rechts und melden sich bei dir. Du zahlst, wenn ihr euch einig seid. Das Geld wird zurückgehalten, bis der Post online ist.",
      steps: {
        post: {
          title: "Poste Produkt und Budget.",
          text: "Fotos, Budget, Plattform und Inhalt. Creator bekommen die Anfrage als Karte in ihrem Feed.",
        },
        come: {
          title: "Creator melden sich bei dir.",
          text: "Creator aus deiner Nische wischen nach rechts. Du siehst Reichweite und Bewertungen und wählst, wer passt.",
        },
        chat: {
          title: "Sprich dich im Chat ab.",
          text: "Schick ein Angebot. Nimmt der Creator es an, zahlst du, und das Geld wird zurückgehalten, bis der Post online ist.",
        },
        paidOut: {
          title: "Dann wird ausgezahlt.",
          text: "Du prüfst zuerst den Live-Post. Keine Grundgebühr: comtor behält {fee} % jeder Zahlung, mit Pro ({price} € im Monat) nur {proFee} %.",
        },
      },
      crowdOne: "Creator ist schon dabei",
      crowdMany: "Creator sind schon dabei",
      action: "Ersten Deal posten",
    },
  },
  verification: {
    subject: "Bestätige deine comtor-E-Mail-Adresse",
    preview: "Bestätige, dass die Adresse dir gehört. Der Link gilt 24 Stunden.",
    heading: "E-Mail bestätigen.",
    body: "Bestätige, dass diese Adresse zu deinem comtor-Konto gehört.",
    action: "E-Mail bestätigen",
    note: "Der Link gilt 24 Stunden. Du hast dich nicht bei comtor angemeldet? Dann kannst du diese E-Mail ignorieren.",
  },
  passwordReset: {
    subject: "Setze dein comtor-Passwort zurück",
    preview: "Wähle ein neues Passwort. Der Link gilt 1 Stunde.",
    heading: "Passwort zurücksetzen.",
    body: "Jemand hat darum gebeten, dein comtor-Passwort zurückzusetzen. Warst du das, wähle ein neues.",
    action: "Neues Passwort wählen",
    note: "Der Link lässt sich nur einmal verwenden und gilt 1 Stunde. Mit einem neuen Passwort wirst du überall abgemeldet. Du hast das nicht angefordert? Dann ignoriere diese E-Mail, dein Passwort bleibt, wie es ist.",
  },
  passwordChanged: {
    subject: "Dein comtor-Passwort wurde geändert",
    preview: "Warst du das, ist alles in Ordnung.",
    heading: "Dein Passwort wurde geändert.",
    body: "Dein comtor-Passwort wurde gerade geändert, und wir haben deine anderen Geräte abgemeldet. Warst du das, ist alles in Ordnung.",
    action: "Passwort zurücksetzen",
    note: "Warst du das nicht? Setze dein Passwort sofort zurück. Das meldet jeden ab, der es geändert hat.",
  },
  accountSuspended: {
    subject: "Dein comtor-Konto wurde gesperrt",
    preview: "Hier steht der Grund und wie du widersprechen kannst.",
    heading: "Dein Konto wurde gesperrt.",
    body: "Wir haben dein comtor-Konto gesperrt. Grund: {reason} Solange es gesperrt ist, kannst du dich nicht anmelden. Wir schließen offene Anfragen eines Marken-Kontos.",
    action: "Der Entscheidung widersprechen",
    objectSubject: "Gesperrtes Konto",
    note: "Wenn du glaubst, dass das ein Irrtum ist, antworte auf diese E-Mail oder schreib an info@comtor.app. Wir sehen uns den Fall noch einmal an und antworten dir.",
  },
  test: {
    subject: "comtor-Test-E-Mail",
    preview: "Wenn du das lesen kannst, funktionieren E-Mails von comtor.",
    heading: "Es funktioniert.",
    body: "Das ist eine Test-E-Mail aus dem Admin-Bereich. Wenn sie in deinem Posteingang ist, erreichen auch Anmelde-, Bestätigungs- und Passwort-E-Mails die Leute.",
    action: "comtor öffnen",
    note: "Von einem Admin über /admin/email gesendet. Du musst nichts tun.",
  },
  marketingConsent: {
    subject: "Bestätige Produkt-News von comtor",
    preview: "Ein Klick, dann dürfen wir dir gelegentlich Neuigkeiten zu comtor schicken.",
    heading: "Produkt-News bestätigen.",
    body: "Du hast um gelegentliche E-Mails zu comtor gebeten. Klicke auf der nächsten Seite auf „Ja, schickt mir News“, um zuzustimmen. Bis dahin bekommt diese Adresse keine Produkt-News.",
    action: "Prüfen und bestätigen",
    note: "Du hast das nicht angefordert? Ignoriere die E-Mail. Es wird nichts aktiviert, bevor du auf der Seite zugestimmt hast.",
  },
  waitlistConfirmation: {
    subject: "Bestätige deinen Platz auf der comtor-Warteliste",
    preview: "Ein Klick, und du hörst von uns, sobald die Apps da sind.",
    heading: "E-Mail bestätigen.",
    body: "Du wolltest erfahren, wann die comtor-Apps für iOS und Android erscheinen. Bestätige, dass diese Adresse dir gehört, dann stehst du auf der Liste.",
    action: "E-Mail bestätigen",
    note: "Wir schicken dir eine einzige E-Mail, wenn die Apps erscheinen. Du hast dich nicht angemeldet? Dann ignoriere diese E-Mail, und du hörst nicht von uns.",
  },
};
