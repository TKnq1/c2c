# Voiceover-Skript (ElevenLabs)

Eine Zeile pro Szene. Die Szenen-IDs entsprechen den Videos (`src/creator/CreatorVideo.tsx`, `src/brand/BrandVideo.tsx`).
Die Zeiten sind die aktuelle Länge der Szene. Wenn eine Aufnahme länger oder kürzer ist, passe ich die Szene an
(immer in ganzen Beats, damit die Schnitte auf der Musik bleiben) und erzeuge die Musik für das neue Timing neu.

Stand: Pro kostet 10 € im Monat und gibt es für Marken und Creator. Hat eine der beiden Seiten Pro, behält comtor 3 %
statt 10 %. Die ersten 50 Marken und die ersten 100 Creator bekommen Pro kostenlos, solange ihr Konto besteht.

## So brauche ich die Dateien

- **Eine Datei pro Zeile**, benannt nach der Szenen-ID: `C00.mp3`, `C01.mp3` … `B09.mp3`. Das ist am einfachsten.
- Alternativ **eine Datei pro Video** mit etwa 1 Sekunde Pause zwischen den Zeilen, in der Reihenfolge unten.
  Ich schneide sie dann an den Pausen selbst.
- MP3 (44,1 kHz) oder WAV. Stille am Anfang und Ende ist egal, die schneide ich weg.

## Einstellungen in ElevenLabs

- **Modell:** Eleven Multilingual v2 (klingt im Deutschen am stabilsten). Eleven v3 klingt lebendiger, schwankt aber
  stärker von Generierung zu Generierung.
- **Stimme:** Für Creator eher jung und energisch, für Marken ruhiger und selbstbewusst. Oder eine Stimme für beide,
  dann klingen die Videos wie aus einem Guss.
- **Stability** 40–50 %, **Similarity** 75 %, **Style** 10–20 %, **Speaker Boost** an, **Speed** 1,0–1,1.
- Zahlen sind ausgeschrieben, damit sie richtig gesprochen werden.
- **Aussprache prüfen:** „comtor“ und „UGC“. Falls „comtor“ falsch klingt, „Kom-tor“ schreiben. „UGC“ steht schon als
  „U-G-C“ im Text.
- Pro Zeile ruhig mehrere Varianten generieren und die beste nehmen. Ein Bindestrich oder Komma setzt eine kurze
  Pause.

## Creator-Video (ca. 48 s)

| ID | Szene | Zeit | Text |
|---|---|---|---|
| C00 | Hook: Karte mit 250 € knallt rein | 2,5 s | Zweihundertfünfzig Euro für ein TikTok? |
| C01 | Handy, Like | 3,5 s | Du postest doch sowieso jeden Tag. |
| C02 | Münzen fliegen | 3,5 s | Warum lässt du dich nicht dafür bezahlen? |
| C03 | DMs werden durchgestrichen | 4 s | Schluss mit Preis-Verhandlungen in den DMs – und Rechnungen, die nie bezahlt werden. |
| C04 | Logo | 2,5 s | Das ist comtor. |
| C05 | Schritt 1: Profil | 5 s | Leg dein Profil an: Nische wählen, Plattformen verbinden, fertig. |
| C06 | Schritt 2: Deals wischen | 7 s | Dann wischst du durch Deals von Marken. Das Budget steht direkt auf der Karte. Nach rechts heißt: Ich bin dabei. |
| C07 | Schritt 3: Chat | 5 s | Die Marke schreibt dir, und ihr macht den Deal direkt im Chat klar. |
| C08 | Schritt 4: Marke zahlt zuerst | 4 s | Das Wichtigste: Die Marke zahlt zuerst. Das Geld wird zurückgehalten, bis dein Post online ist. |
| C09 | Schritt 5: Posten, Link | 4,5 s | Du postest, schickst den Link, und die Marke gibt frei. Antwortet sie nicht, bekommst du dein Geld nach drei Tagen trotzdem. |
| C10 | Auszahlung 225 € | 3,5 s | Und du behältst neunzig Prozent. |
| C11 | 100 Founding Creator | 5,5 s | Und jetzt das Beste: Die ersten hundert Creator bekommen Pro kostenlos – lebenslang, solange dein Konto besteht. Dann behältst du siebenundneunzig Prozent. |
| C12 | CTA | 3,5 s | Wisch dich zu deinem ersten bezahlten Deal – jetzt auf comtor punkt app. |

## Marken-Video (ca. 33,5 s)

| ID | Szene | Zeit | Text |
|---|---|---|---|
| B01 | Hook: Daumen scrollt an drei Anzeigen vorbei | 3 s | Jeder scrollt an Werbung vorbei. |
| B02 | Feed stoppt beim Creator-Video | 4,5 s | Aber bei echten Creatorn bleiben die Leute hängen. Menschen vertrauen Menschen – das ist U-G-C. |
| B03 | Raster, Vergleich Anzeige vs. UGC | 4 s | Und U-G-C konvertiert besser als klassische Werbung. |
| B04 | Logo | 2,5 s | Mit comtor findest du U-G-C-Creator in Minuten. |
| B05 | Anfrage erstellen | 5,5 s | Du erstellst eine Anfrage: Produkt, Budget, Plattform. Das dauert eine Minute. |
| B06 | Creator melden sich | 4,5 s | Passende Creator melden sich bei dir. Du siehst Reichweite und Bewertungen und entscheidest, wer passt. |
| B07 | Abwicklung | 4 s | Du zahlst über comtor – ausgezahlt wird erst, wenn der Post online ist. |
| B08 | 50 Founding Brands | 5,5 s | Und jetzt das Beste: Die ersten fünfzig Marken bekommen Pro kostenlos – lebenslang, solange dein Konto besteht. Drei statt zehn Prozent Gebühr, ohne Abo. |
| B09 | CTA | 4 s | Sichere dir jetzt deinen Platz – auf comtor punkt app. |

## Hinweise zum Text

- **Wortwahl:** Überall „zurückgehalten“ statt „Treuhand“, wie in der App (`docs/legal-readiness.md`).
- **„Lebenslang“ (C11, B08):** Gesprochen steht es zusammen mit „solange dein Konto besteht“, also mit derselben
  Einschränkung wie in der App und den AGB. Im Bild steht „Solange dein Konto besteht“.
- **B03, „konvertiert besser“:** Das ist eine vergleichende Werbeaussage. Die stärkere Fassung „UGC hat die höchste
  Conversion-Rate“ ist eine Alleinstellungsbehauptung und muss nach dem Wettbewerbsrecht (UWG) belegbar sein. Wenn ihr
  eine Studie habt, auf die ihr euch stützen könnt, kann die Zeile so lauten:
  „U-G-C hat die höchste Conversion-Rate.“ Im Bild ändere ich den Text dann mit.
- **Länge:** Einige Zeilen (C06, C09, C11, B02, B06, B08) sind länger als ihre Szene jetzt. Diese Szenen verlängere
  ich passend, wenn die Aufnahmen da sind. Die Videos werden dadurch ein paar Sekunden länger.
