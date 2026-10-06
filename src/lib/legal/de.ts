import { FOUNDING_BRAND_LIMIT, FOUNDING_CREATOR_LIMIT, PLATFORM_FEE_RATE, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import { formatCents } from "@/lib/format";

export type LegalSection = { title: string; body: string[] };

// The VAT identification number goes into the imprint when there is one (§ 5 Abs. 1 Nr. 6 DDG): set IMPRINT_VAT_ID.
export function imprintVatId(): string | null {
  return process.env.IMPRINT_VAT_ID?.trim() || null;
}

export const DE_IMPRINT = {
  lead: "Angaben gemäß § 5 DDG.",
  rows: [
    { label: "Anbieter", lines: ["Teethawat Kanpai", "Einzelunternehmen", "Sonnenscheinpfad 64", "12277 Berlin, Deutschland"] },
    { label: "Kontakt", lines: ["info@comtor.app", "+49 172 4134526"] },
    { label: "Verantwortlich für den Inhalt", lines: ["Teethawat Kanpai, Anschrift wie oben (§ 18 Abs. 2 MStV)"] },
  ],
  disputeTitle: "Verbraucherstreitbeilegung",
  dispute:
    "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
};

export function deTerms(): LegalSection[] {
  const fee = `Wir behalten ${PLATFORM_FEE_RATE * 100} % von jeder Zahlung über comtor ein. Marken und Creator können Pro für ${formatCents(PRO_SUBSCRIPTION_PRICE_CENTS)} im Monat buchen. Solange Pro läuft, sind es ${PRO_PLATFORM_FEE_RATE * 100} %: bei jeder Zahlung, bei der die Marke oder der Creator Pro hat. Pro verlängert sich jeden Monat, bis du es in den Einstellungen kündigst. Die Kündigung stoppt die nächste Verlängerung. Eine Gebühr für das Einstellen gibt es nicht. Die ersten ${FOUNDING_BRAND_LIMIT} Marken (Founding Brands) und die ersten ${FOUNDING_CREATOR_LIMIT} Creator (Founding Creator), die sich bei comtor angemeldet haben, bekommen Pro kostenlos, solange ihr Konto besteht. Dieses Pro hat keinen Monatspreis, ist nicht übertragbar und endet mit dem Konto. Wir können es entziehen, wenn jemand gegen diese Bedingungen verstößt.`;
  const held = `Zahlt eine Marke, halten wir das Geld, bis der Creator den Link zum veröffentlichten Beitrag schickt. Die Marke hat dann ${RELEASE_REVIEW_DAYS} Tage, um freizugeben oder ein Problem zu melden. Tut sie nichts, wird ausgezahlt. Wird ein Problem gemeldet, bleibt das Geld liegen, bis wir prüfen, und wir zahlen danach an den Creator oder erstatten an die Marke.`;
  return [
    {
      title: "Geltung und Betreiber",
      body: [
        "Diese Bedingungen gelten für die Nutzung von comtor (comtor.app). Betreiber ist Teethawat Kanpai, Einzelunternehmer in Berlin (siehe Impressum). Wer ein Konto anlegt, stimmt diesen Bedingungen zu.",
        "Für Nutzer in Deutschland gilt diese deutsche Fassung.",
        "comtor ist nur die technische Plattform. Eine Kooperation ist ein Vertrag zwischen Marke und Creator. Der Betreiber ist daran nicht beteiligt, stellt den Creator nicht an und verkauft das Produkt der Marke nicht.",
      ],
    },
    {
      title: "Wer comtor nutzen darf",
      body: [
        "Du musst mindestens 18 Jahre alt sein oder für ein Unternehmen handeln dürfen, das dich beauftragt hat. Du bist für deinen Zugang und für die Angaben in deinem Profil verantwortlich. Ein Konto pro Person oder Unternehmen.",
      ],
    },
    {
      title: "Der Dienst",
      body: [
        "Marken stellen eine Anfrage: was entstehen soll, auf welcher Plattform, zu welchem Budget und bis wann. Passende Creator können Interesse zeigen, im Chat einen Preis vereinbaren und über comtor bezahlt werden.",
        "Wir versprechen keinen Treffer, keine Reichweite, keinen Verkauf und kein Einkommen. Was du verdienst oder ausgibst, hängt von den Absprachen mit anderen Nutzern ab.",
      ],
    },
    {
      title: "Was du hochlädst",
      body: [
        "Die Rechte an dem, was du hochlädst, bleiben bei dir. Du erlaubst uns, es zu speichern, anderen Nutzern zu zeigen und eine Sicherung zu behalten, solange es auf comtor liegt. Die Erlaubnis endet mit dem Löschen, außer wir müssen eine Kopie gesetzlich aufbewahren.",
        "Die Arbeit, die ein Creator für eine Marke macht, gehört dem, den die beiden vereinbaren. Daran nehmen wir keine Rechte.",
      ],
    },
    {
      title: "Deine Verantwortung",
      body: [
        "Marken verantworten ihre Anfragen, Aussagen zum Produkt und die Rechte an hochgeladenen Bildern. Creator verantworten ihre Beiträge und müssen Werbung kennzeichnen, wo das Gesetz es verlangt (in Deutschland zum Beispiel als „Werbung“ oder „Anzeige“).",
        "Verschickt eine Marke ein Produkt, ist das eine Sache zwischen Marke und Creator. Wir verkaufen es nicht und versenden es nicht. Eine Kaution, wo eine Anfrage sie verlangt, ist Sicherheit zwischen den beiden und keine Gebühr von uns.",
        "Macht ein Dritter uns einen Anspruch wegen eines Inhalts, den du hochgeladen hast, eines Produkts, das du verschickt hast, oder einer Kooperation, die du geschlossen hast, und trifft dich ein Verschulden, trägst du den Anspruch und die angemessenen Kosten der Abwehr. Bist du Verbraucher, gilt das nur, soweit das Gesetz es zulässt.",
      ],
    },
    {
      title: "Gebühren",
      body: [
        fee,
        "Die Plattformgebühr bleibt nur, wenn eine Zahlung an den Creator ausgezahlt wird. Wird eine noch gehaltene Zahlung erstattet, erhält die Marke den Betrag zurück, und wir behalten darauf keine Gebühr.",
      ],
    },
    {
      title: "Gehaltene Zahlungen",
      body: [
        held,
        "Eine Marke kann stornieren und den Betrag zurückbekommen, bevor der Creator den Link schickt. Nach der Auszahlung lässt sich eine Zahlung über comtor nicht mehr zurückholen. Kartenzahlung und Auszahlung laufen über Stripe. Die volle Kartennummer sehen wir nicht.",
      ],
    },
    {
      title: "Verhalten",
      body: [
        "Erfinde keine Followerzahlen, schreibe keine falschen Bewertungen, lade nichts hoch, woran du kein Recht hast, und zieh einen Deal nicht von comtor, um die Gebühr zu umgehen. Wir können Inhalte entfernen und ein Konto sperren oder schließen, das diese Bedingungen oder das Gesetz bricht.",
        "Illegale Inhalte meldest du, und eine Entfernung lässt du prüfen, über info@comtor.app. Wir sehen es uns an und sagen dir das Ergebnis.",
        "Entfernen wir einen Inhalt oder sperren wir ein Konto, nennen wir dir den Grund per E-Mail. Du kannst der Entscheidung über info@comtor.app widersprechen. Wir prüfen sie erneut und antworten dir.",
        "Bewertungen können nur Nutzer abgeben, deren Zusammenarbeit über comtor abgeschlossen und ausgezahlt wurde.",
      ],
    },
    {
      title: "Haftung",
      body: [
        "Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit und nach dem Produkthaftungsgesetz. Bei leichter Fahrlässigkeit haften wir nur, wenn wir eine Pflicht verletzen, die für den Vertrag wesentlich ist, und nur für den Schaden, der für diese Art von Vertrag typisch und vorhersehbar ist.",
        "Bist du ein Unternehmen, ist diese Haftung bei leichter Fahrlässigkeit auf die Gebühren begrenzt, die du uns in den zwölf Monaten vor dem Anspruch gezahlt hast, oder auf 100 €, wenn du weniger gezahlt hast. Die Grenze gilt nicht für die Fälle im vorigen Absatz.",
        "Für Qualität, Rechtmäßigkeit oder Zeitpunkt einer Kooperation, eines Beitrags oder eines Produkts, das Nutzer untereinander vereinbaren, haften wir nicht.",
      ],
    },
    {
      title: "Konto beenden",
      body: [
        "Du kannst dein Konto in den Einstellungen löschen. Wir können ein Konto sperren oder schließen, das diese Bedingungen bricht. Offene Zahlungen werden nach den Regeln oben zu Ende gebracht.",
      ],
    },
    {
      title: "Wenn du Verbraucher bist",
      body: [
        "Bist du Verbraucher in der EU, kann für Pro und für andere kostenpflichtige Leistungen, die du bei uns im Fernabsatz kaufst, ein gesetzliches Widerrufsrecht von 14 Tagen bestehen. Eine Kooperation, die du mit einem anderen Nutzer schließt, ist ein Vertrag mit diesem Nutzer, nicht mit uns. Zwingendes Verbraucherrecht des Landes, in dem du wohnst, bleibt.",
      ],
    },
    {
      title: "Recht und Gerichte",
      body: [
        "Es gilt deutsches Recht. Bist du ein Unternehmen, sind die Gerichte in Berlin zuständig. Bist du Verbraucher, kannst du uns an deinem Wohnsitz verklagen, und wir verklagen dich nur an deinem Wohnsitz.",
        "Aufrechnen kannst du nur mit einem Anspruch, den wir nicht bestreiten oder den ein Gericht festgestellt hat.",
      ],
    },
    {
      title: "Änderungen",
      body: [
        "Wir können diese Bedingungen ändern. Eine wesentliche Änderung schicken wir dir per E-Mail mindestens 15 Tage, bevor sie gilt. Willst du sie nicht, kannst du dein Konto bis dahin löschen.",
      ],
    },
  ];
}

const DE_PRIVACY: LegalSection[] = [
  {
    title: "Wer verantwortlich ist",
    body: [
      "Verantwortlicher nach der DSGVO ist Teethawat Kanpai, Sonnenscheinpfad 64, 12277 Berlin (siehe Impressum). Zu deinen Daten schreib an info@comtor.app.",
      "Für Nutzer in Deutschland gilt diese deutsche Fassung.",
    ],
  },
  {
    title: "Dein Konto",
    body: [
      "Deine E-Mail-Adresse, ein gehashtes Passwort (nie im Klartext), ob du Marke oder Creator bist, ob die E-Mail bestätigt ist und, wenn du die Zwei-Faktor-Anmeldung einschaltest, das Geheimnis zum Prüfen der Codes. Das brauchen wir, um dein Konto zu führen (Art. 6 Abs. 1 lit. b DSGVO). Wir schreiben dir, um die Adresse zu bestätigen, das Passwort zurückzusetzen, wenn du das verlangst, und wenn das Passwort geändert wurde.",
      "Sperren wir ein Konto wegen eines Verstoßes, speichern wir wann und warum, damit die Entscheidung später prüfbar ist (Art. 6 Abs. 1 lit. f DSGVO).",
      "Bei der Registrierung speichern wir außerdem, wann du den Bedingungen und dieser Datenschutzerklärung zugestimmt hast und in welcher Fassung, und dass du bestätigt hast, mindestens 18 Jahre alt zu sein. Das dient als Nachweis (Art. 6 Abs. 1 lit. b und f DSGVO).",
      "Welche Schritte der Einrichtung du gesehen oder abgeschlossen hast, speichern wir mit deinem Konto, um die Einrichtung zu verbessern (Art. 6 Abs. 1 lit. f DSGVO).",
      "Am Ende der Einrichtung fragen wir freiwillig, wie du von uns erfahren hast (zum Beispiel Suchmaschine oder Freund). Nur wenn du antwortest, speichern wir die gewählte Antwort mit deinem Konto, um zu sehen, welche Kanäle Menschen zu uns bringen (Art. 6 Abs. 1 lit. a DSGVO). Du kannst die Frage überspringen. Die Antwort löschen wir mit dem Konto.",
      "E-Mail-Adresse und Passwort brauchen wir, um einen Vertrag mit dir zu schließen und zu erfüllen. Ohne sie gibt es kein Konto. Alle anderen Angaben sind freiwillig, bis auf das, was für Auszahlungen vorgeschrieben ist (Stripe prüft dafür deine Identität).",
    ],
  },
  {
    title: "Profile und Anfragen",
    body: [
      "Was du ins Profil schreibst: bei Marken Firmenname, Logo, Website, Nische, Beschreibung und Social-Links; bei Creatorn Anzeigename, Bild, Nische, Bio, Sprache und Plattformen mit Followerzahlen und Links. Eine Anfrage einer Marke enthält Titel, Beschreibung, Bilder, Budget, Plattform und Inhalt, Datum und Produktdetails.",
      "Profile und Anfragen sehen andere Nutzer (so funktioniert die Zuordnung) und liegen auf unseren Servern (Art. 6 Abs. 1 lit. b DSGVO).",
    ],
  },
  {
    title: "Nachrichten, Angebote und Zahlungen",
    body: [
      "Nachrichten, Angebote und die Links, die Creator zu ihren Beiträgen schicken, werden gespeichert und sind für die andere Seite sichtbar. Zu Zahlungen speichern wir Betrag, Gebühr, Status und Daten. Die Zahlung selbst läuft über Stripe, die volle Kartennummer sehen wir nicht. Bewertungen, Meldungen und Blockierungen speichern wir, damit diese Funktionen arbeiten (Art. 6 Abs. 1 lit. b DSGVO).",
    ],
  },
  {
    title: "E-Mails, die wir schicken",
    body: [
      "Konto-Mails (Bestätigung, Passwort zurücksetzen, geändertes Passwort) gehen raus, weil du ein Konto hast (Art. 6 Abs. 1 lit. b DSGVO). Versand über Resend.",
      "Gelegentliche Produkt-News sind getrennt und freiwillig. Hakst du das beim Konto an oder schaltest es in den Einstellungen ein, schicken wir einen Link. Die Einwilligung ist der Button auf der Seite, nicht das Öffnen der Mail. Den Zeitpunkt der Bestätigung speichern wir (Art. 6 Abs. 1 lit. a DSGVO). In den Einstellungen kannst du es stoppen, dann schreiben wir nicht weiter. Eine unbestätigte Anfrage ist keine Einwilligung.",
      "Werbe-Mails schicken wir nur an Personen, die vorher ausdrücklich eingewilligt haben (Art. 6 Abs. 1 lit. a DSGVO, § 7 Abs. 2 Nr. 3 UWG). Eine Adresse in einer Liste reicht dafür nicht. Wir speichern Name und E-Mail-Adresse, einen Vermerk, wie und wann du eingewilligt hast, und welche Nachricht wir dir geschickt haben (Versandprotokoll, 90 Tage). Ob du eine Mail öffnest oder einen Link anklickst, erfassen wir nicht. Jede dieser Mails sagt dir, warum du sie bekommst, und enthält einen Abmeldelink (auch als Ein-Klick-Abmeldung im Mailprogramm).",
      "Du kannst deine Einwilligung jederzeit widerrufen, über den Link in der Mail oder an info@comtor.app. Dann löschen wir deine Adresse und das Versandprotokoll. Wir merken uns nur eine Prüfsumme (Hash) der Adresse, damit wir dich nicht versehentlich wieder anschreiben (Art. 6 Abs. 1 lit. c und f DSGVO).",
    ],
  },
  {
    title: "Warteliste",
    body: [
      "Lässt du auf der Startseite eine E-Mail-Adresse, um zu hören, wann die Apps für iOS und Android da sind, speichern wir sie zusammen damit, ob du Marke oder Creator gewählt hast, und schicken zuerst eine Mail mit einem Link, der bestätigt, dass die Adresse dir gehört (Double-Opt-in). Erst nach der Bestätigung nutzen wir sie, und nur für diese eine Mail (Art. 6 Abs. 1 lit. a DSGVO). Den Zeitpunkt der Bestätigung behalten wir als Nachweis. Bestätigst du nicht, hörst du nicht von uns, und die Adresse wird nach 30 Tagen gelöscht. Sind die Apps da und haben wir dich informiert, wird die Adresse gelöscht. Die Einwilligung kannst du jederzeit widerrufen, an info@comtor.app, dann löschen wir sie sofort.",
    ],
  },
  {
    title: "Sicherheit und Protokolle",
    body: [
      "Jede Anmeldung speichert Zeitpunkt, ob sie geklappt hat, deine IP-Adresse und deinen Browser, damit du die letzten Anmeldungen in den Einstellungen siehst und wir Missbrauch wie Passwortraten stoppen können. Wenn du comtor nutzt, verarbeitet unser Hoster außerdem technische Daten (IP-Adresse, Zeitpunkt, aufgerufene Seite, Browser), um die Seite auszuliefern und abzusichern. Beides stützt sich auf unser berechtigtes Interesse an einem sicheren Dienst (Art. 6 Abs. 1 lit. f DSGVO). Das Anmeldeprotokoll löschen wir nach 90 Tagen, die IP-Adresse bei Registrierungen nach 7 Tagen und die Zähler gegen Missbrauch nach 24 Stunden.",
    ],
  },
  {
    title: "Cookies, lokaler Speicher und Mitteilungen",
    body: [
      "Wir setzen nur unbedingt nötige Cookies: eins, das dich angemeldet hält (30 Tage ab dem letzten Besuch), zwei kurzlebige der Anmeldung (Schutz vor gefälschten Anfragen und die Rücksprungadresse) und eins für die gewählte Sprache (ein Jahr). Ein neues Passwort meldet die anderen Geräte ab. Darstellung, Ton, ob du den Installationshinweis weggeklickt hast und ob du auf der Startseite Marke oder Creator gewählt hast, liegen im lokalen Speicher deines Browsers und gehen nicht an uns. Analyse- oder Werbe-Cookies gibt es nicht.",
      "Auf den Seiten, auf denen du Auszahlungen einrichtest, lädt Stripe eigene Skripte. Sie können zur Betrugsvorbeugung eigene Cookies oder Gerätekennungen setzen (siehe die Datenschutzerklärung von Stripe).",
      "Push-Mitteilungen gibt es nur, wenn du sie einschaltest (Art. 6 Abs. 1 lit. a DSGVO). Im Browser liefert sie der Push-Dienst des Browsers (Apple, Google oder Mozilla). In der App für iPhone oder Android speichern wir ein Geräte-Token und schicken sie über den Dienst von Apple oder über Googles Firebase Cloud Messaging. Du kannst sie jederzeit in den Einstellungen, im Browser oder im Telefon abschalten.",
    ],
  },
  {
    title: "Dienstleister",
    body: [
      "Diese Stellen verarbeiten Daten in unserem Auftrag und nach unserer Weisung (Art. 28 DSGVO): Vercel Inc., USA, hostet Website und App; Neon Inc., USA, stellt die Datenbank, Standort Frankfurt; Resend Inc., USA, verschickt unsere E-Mails (Konto, geschäftliche Hinweise und Warteliste); Google Ireland Limited liefert Push-Mitteilungen an die Android-App über Firebase Cloud Messaging.",
      "Zahlungen, Auszahlungen und die Identitätsprüfung dafür macht Stripe. Für einen Teil ist Stripe Payments Europe, Ltd. (Irland) selbst verantwortlich. Siehe die Datenschutzerklärung von Stripe.",
      "Push-Mitteilungen an die iPhone-App liefert Apple Inc., USA, über den Apple Push Notification service.",
      "Gelangen Daten in die USA, stützt sich die Übermittlung auf das EU-US Data Privacy Framework oder auf die EU-Standardvertragsklauseln.",
    ],
  },
  {
    title: "Wie lange wir Daten behalten",
    body: [
      "Wir behalten deine Daten, solange du ein Konto hast. Löschst du es in den Einstellungen, gehen Profil, Anfragen, Nachrichten und alles, was daran hängt, mit.",
      "Eine Ausnahme sind Zahlungsbelege (Betrag, Gebühr, Status, Datum und Stripe-Kennungen). Die müssen wir so lange aufbewahren, wie das Steuer- und Handelsrecht es verlangt, je nach Beleg 8 bis 10 Jahre (Art. 6 Abs. 1 lit. c DSGVO, § 147 AO, § 257 HGB). Sie werden anonymisiert, sodass sie nicht mehr auf dich verweisen. Stripe behält eigene Zahlungsunterlagen, wie das Gesetz es verlangt.",
      "Weitere Fristen: Anmeldeprotokoll 90 Tage, IP-Adresse bei Registrierungen 7 Tage, Zähler gegen Missbrauch 24 Stunden, Versandprotokoll von Werbe-Mails 90 Tage, nicht bestätigte Wartelisten-Adressen 30 Tage.",
    ],
  },
  {
    title: "Deine Rechte",
    body: [
      "Du kannst Auskunft verlangen (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18) und Herausgabe in einem übertragbaren Format (Art. 20). Den Export in den Einstellungen kannst du jederzeit ziehen. Du kannst der Verarbeitung auf Grundlage eines berechtigten Interesses widersprechen (Art. 21) und eine Einwilligung für die Zukunft widerrufen (Art. 7 Abs. 3). Schreib an info@comtor.app.",
      "Du kannst dich bei einer Aufsichtsbehörde beschweren. Für uns ist das die Berliner Beauftragte für Datenschutz und Informationsfreiheit.",
    ],
  },
  {
    title: "Keine automatisierten Entscheidungen",
    body: [
      "Welche Anfragen ein Creator sieht, entscheiden einfache Regeln (Nische, Sprache des Inhalts und Followerzahl), keine automatisierte Entscheidung mit rechtlicher oder ähnlich erheblicher Wirkung (Art. 22 DSGVO).",
    ],
  },
  {
    title: "Änderungen",
    body: ["Wir passen diese Erklärung an, wenn sich der Dienst ändert. Das Datum oben zeigt die geltende Fassung."],
  },
];

const DE_SENTRY =
  "Functional Software, Inc. (Sentry), USA, erfasst Fehlermeldungen unserer Website und App (Fehlertext, aufgerufene Seite, Browser), damit wir Fehler finden und beheben können (Art. 6 Abs. 1 lit. f DSGVO).";

// Sentry is named only where it is switched on (NEXT_PUBLIC_SENTRY_DSN), so the text matches what runs.
export function dePrivacy({ sentry }: { sentry: boolean }): LegalSection[] {
  if (!sentry) return DE_PRIVACY;
  return DE_PRIVACY.map((section) =>
    section.title === "Dienstleister" ? { ...section, body: [section.body[0], DE_SENTRY, ...section.body.slice(1)] } : section,
  );
}
