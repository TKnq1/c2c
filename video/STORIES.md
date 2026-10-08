# Instagram-Stories

13 Stories im Hochformat 1080 × 1920 (9:16): zwei kurze Videos mit Ton, elf Bilder. Dieselben Dateien passen für TikTok-Stories und Facebook-Stories.

```
npm run stories -- --browser-executable=<Chromium>        # alle nach out/stories/
node scripts/render-stories.mjs StoryHook StoryMyth ...    # nur diese
node scripts/render-stories.mjs StoryFounding --props='{"left":82}'   # Founding mit Zähler: "Noch 82 Plätze frei"
```

Instagram legt oben (Profil, Fortschrittsbalken) und unten (Antwortfeld, Link-Sticker) eigene Bedienelemente über die Story. Alles Wichtige steht deshalb zwischen 270 px von oben und 270 px von unten (`SAFE_TOP`, `SAFE_BOTTOM` in `src/stories/kit.tsx`). Folien mit erfundenen Marken, Preisen oder Bewertungen tragen den Hinweis „Beispiel: Marken, Preise und Bewertungen sind erfunden.“

## Die Formate

| Format | Wofür | Hier |
|---|---|---|
| Kurzes Video (5 bis 8 s) mit Ton | Aufmerksamkeit, Hook | `hook.mp4`, `number.mp4` |
| Erklär-Karte (Bild mit App) | ein Gedanke pro Karte, mehrere hintereinander als Serie | `pays.png`, `brand-request.png`, `brand-approve.png`, `brand-fees.png` |
| Mythos und Fakt | Vorurteil gegen Tatsache | `myth.png` |
| Zahl | eine Kennzahl groß | `number.mp4`, `brand-fees.png` |
| Beispiel-Deal | zeigt, wie ein Deal aussieht | `deal.png` |
| Umfrage-Sticker | schnelle Stimmung, Marktforschung | `poll.png` |
| Quiz-Sticker | spielerisch, Auflösung in der nächsten Story | `quiz.png`, danach `number.mp4` |
| Fragen-Sticker | Antworten teilen, Nähe | `question.png` |
| Founding-Hinweis | Dringlichkeit, solange Plätze frei sind | `founding.png` |
| Aufruf mit Link-Sticker | Anmeldungen | `cta.png` |

Nicht aus dem Code zu machen, weil es dich selbst braucht: Gesicht in die Kamera (Gründer-Story, „Das habe ich heute gebaut“), Bildschirmaufnahme der App, Antworten auf Fragen aus dem Fragen-Sticker (als Text-Story oder Video).

## Sticker und Texte

Die Sticker setzt du in der Instagram-App auf die freie Fläche in der Mitte.

| Datei | Sticker | Text |
|---|---|---|
| `poll.png` | Umfrage | Antworten: „Über DMs“ und „Gar nicht“ |
| `quiz.png` | Quiz | Antworten: „70 %“, „80 %“, „90 %“ (richtig: 90 %); danach `number.mp4` |
| `question.png` | Fragen | Hinweis im Sticker: „Schreib's mir“ |
| `founding.png` | Erinnerung oder Countdown, wenn es ein Datum gibt | optional |
| `cta.png`, `hook.mp4`, `brand-fees.png` | Link | „Jetzt kostenlos starten“, Adresse `comtor.app` |

Den Link baust du im Admin unter Ads und Kanäle im Link-Bauer (Quelle Instagram, Kampagne zum Beispiel `story-hook`). Dann zeigt „Heute“, welche Story Anmeldungen bringt.

## Vorschlag für die Reihenfolge

Eine Story pro Tag reicht (der Tagesplan hat „1 Story posten“). Zwei Wochen:

| Tag | Story | Ziel |
|---|---|---|
| 1 | `hook.mp4`, danach `cta.png` | Creator |
| 2 | `myth.png` | Creator |
| 3 | `poll.png` | Creator |
| 4 | `quiz.png`, am Abend `number.mp4` | Creator |
| 5 | `deal.png` | Creator |
| 6 | `brand-request.png` | Marken |
| 7 | `question.png` | beide |
| 8 | `pays.png` | Creator |
| 9 | `brand-approve.png` | Marken |
| 10 | `founding.png` | Creator |
| 11 | `brand-fees.png` | Marken |
| 12 bis 14 | die besten Antworten aus dem Fragen-Sticker, danach wiederholen, was am meisten Antworten oder Anmeldungen gebracht hat | beide |

Stories, die gut laufen, kannst du in den Highlights auf dem Profil sammeln: „Creator“, „Marken“, „Fragen“.

## Aufbau des Codes

`src/stories/kit.tsx` hat die gemeinsamen Teile: den dunklen Hintergrund (`StoryNight`), den hellen mit der Farbe eines Produktfotos (`StoryPaper`), Kopfzeile, Label, Schrift in zwei Tönen (`Type`), Adress-Knopf und das iPhone mit einer App-Ansicht (`StoryPhone`). `Stills.tsx` hat die Bilder, `Hook.tsx` und `Number.tsx` die zwei Videos, `index.ts` die Liste. Eine neue Story ist eine Komponente dort plus eine Zeile in `index.ts`; `scripts/render-stories.mjs` rendert sie mit.

## Highlight „Was ist comtor?“

Sieben Karten und ein Cover, die erklären, was comtor ist. Hell, im Look der App im Hell-Modus. Karte 1 ist ein kurzes Video mit Ton, die anderen sind Bilder.

```
node scripts/render-stories.mjs StoryIntroTitle StoryIntroIdea StoryIntroCreator StoryIntroPays StoryIntroBrand StoryIntroPrice StoryIntroGo StoryIntroCover --browser-executable=<Chromium>
```

| Nr. | Karte | Inhalt |
|---|---|---|
| 1 | Titel (`intro-title.mp4`) | „Was ist comtor?“, die drei Deal-Karten fächern sich auf |
| 2 | Idee (`intro-idea.png`) | Marken posten Deals, Creator wischen nach rechts |
| 3 | Für Creator (`intro-creator.png`) | der Feed mit einem Deal |
| 4 | Sicher bezahlt (`intro-pays.png`) | die Marke zahlt zuerst, das Geld wird zurückgehalten |
| 5 | Für Marken (`intro-brand.png`) | Anfrage in einer Minute |
| 6 | Kosten (`intro-price.png`) | Creator 90 %, Marken 10 % pro Zahlung, Pro gratis für die ersten 100 und 50 |
| 7 | Los geht's (`intro-go.png`) | comtor.app, „Tipp auf den Link“ |
| – | Cover (`intro-cover.png`) | das Logo in der Mitte, Instagram schneidet es rund aus |

In Instagram: die Karten 1 bis 7 nacheinander als Story hochladen, auf Karte 7 den Link-Sticker setzen, dann auf „Highlights“ tippen, den Namen „Was ist comtor?“ eintragen und das Cover als Bild wählen.

Die Fotos und Profilbilder (Raw Supplies, Nakar, Vintage Steals) liegen als Ausschnitte der Screenshots in `public/real/`. Eine Karte mit anderen Bildern: die Dateien dort ersetzen oder in `src/stories/Intro.tsx` die Deals (`RAW_DEAL`, `NAKAR_DEAL`, `VINTAGE_DEAL`) ändern. Namen, Logos und Produktfotos echter Marken nur mit deren Erlaubnis posten; die Budgets sind erfunden, der Hinweis unten sagt das.
