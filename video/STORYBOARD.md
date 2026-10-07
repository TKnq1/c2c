# Storyboard: comtor Motion Graphics (2D)

Zwei Videos, beide in Remotion (`video/`), 2D-Flat-Animation im comtor-Look.

## Gemeinsame Grundlagen

| | |
|---|---|
| Format | 1080 × 1920 (9:16, Reels/TikTok/Shorts), 30 fps |
| Stil | Monochrom wie die Web-App: Ink `#070707`, Paper `#ffffff`, Fog `#f2f2f2`, Stone `#a2a2a9`. Farbe kommt nur über die Produktfotos auf den Deal-Karten (`public/landing/*.jpg`) |
| Schrift | Lato Black für Headlines, Lato Regular für Fließtext |
| Formen | 4px-Ecken überall, Avatare rund (wie in der App) |
| UI | Vereinfachte 2D-Nachbauten der echten Web-App-Screens im Browserfenster (wie `mac-window.tsx` auf der Landingpage), keine Screenshots |
| Bewegung | Spring-Animationen, kinetische Typo Wort für Wort, Bewegungsunschärfe bei schnellen Bewegungen und Übergängen, langsamer Kamera-Zoom pro Szene mit Tiefenwirkung (Überschrift bewegt sich weniger als der Inhalt), Match-Cuts wo ein Element in die nächste Szene weiterläuft |
| Daten | Nur Beispieldaten von der Landingpage (Odd Bloom, Kiez Goods, Lumo Audio …). Kleiner Hinweis „Beispieldaten“ unten im Bild, sobald UI zu sehen ist |
| Wording | „zurückgehalten“, nie „Treuhand“ (siehe `docs/legal-readiness.md`) |
| Ton | Eigene, per Code erzeugte Musik (120 BPM, Schnitte auf dem Beat) + UI-Sounds (`scripts/make-audio.py`). Voiceover spricht ihr selbst ein |

---

## Video 1: Creator, „Geld verdienen mit deinen Posts“

Länge: ca. 48 s (Zeiten der Szenen unten vom ersten Entwurf; aktuelle Zeiten in `VOICEOVER.md`)

### Szene 0 – Hook (0:00–0:02)
- **Bild:** Ab dem ersten Frame fällt die Odd-Bloom-Deal-Karte mit Bewegungsunschärfe ins Bild und schlägt nach 8 Frames ein (Impact-Sound, Kamera-Wackler). Ein großer „250 €“-Stempel knallt schräg auf die Karte.
- **Text:** „**250 €** für ein TikTok?“ ist schon beim ersten Frame im Einflug, darunter „So verdienst du mit deinen Posts.“
- **Musik:** Kick und Bass direkt ab dem Hook, danach fällt sie ins ruhige Intro zurück.

### Szene 1 – Hook (0:00–0:04)
- **Bild:** Weißer Screen. Ein Smartphone-Umriss (2D, Ink-Linie) fällt von oben ins Bild, darin scrollt ein Feed aus grauen Post-Platzhaltern.
- **Animation:** Bei 0:02 stoppt der Scroll, ein Herz poppt auf einem Post, daneben springt ein Like-Zähler hoch.
- **Text (kinetisch, Wort für Wort):** „Du postest sowieso.“
- **VO (optional):** „Du postest sowieso jeden Tag.“

### Szene 2 – Die Wendung (0:04–0:08)
- **Bild:** Der Like-Zähler morpht in ein €-Zeichen. Münzen/€-Scheine (flache Kreise mit „€“) fallen aus dem Post-Platzhalter.
- **Text:** „Warum nicht dafür **bezahlt** werden?“ – „bezahlt“ invertiert (weiß auf schwarzem Balken, Balken wischt von links rein).
- **VO:** „Warum lässt du dich nicht dafür bezahlen?“

### Szene 3 – Das Problem (0:08–0:12)
- **Bild:** Drei DM-Blasen stapeln sich: „Was kostet ein Post?“, „Bezahlung nach dem Post?“, „Schick mal deine Mediadaten“. Daneben ein Fragezeichen, das wackelt.
- **Animation:** Blasen werden durchgestrichen und fallen raus.
- **Text:** „Schluss mit Preis-DMs und offenen Rechnungen.“

### Szene 4 – Logo-Reveal (0:12–0:14)
- **Bild:** Schwarzer Wipe über den ganzen Screen, comtor-Logo skaliert per Spring rein.
- **Text unter Logo:** „Bezahlte Marken-Deals für Creator.“

### Szene 5 – Schritt 1: Profil anlegen (0:14–0:19)
- **Bild:** Browserfenster (Web-App) fährt von unten rein. Darin das Onboarding: Nischen-Kacheln (Beauty, Food, Fitness …), zwei werden angetippt. Darunter Plattform-Chips (Instagram, TikTok) mit Follower-Zahl, die hochzählt.
- **Schritt-Label oben links:** „1 · Profil anlegen“
- **Text:** „Nische wählen, Plattformen verbinden. Fertig.“

### Szene 6 – Schritt 2: Deals wischen (0:19–0:26)
- **Bild:** Im Browserfenster der Feed: Deal-Karte „Odd Bloom – Serum launch“ mit Produktfoto (Orange), Budget **250 €**, TikTok, 1 Video, Produkt inklusive. Hintergrund nimmt geblurrt die Farbe des Fotos an (wie auf der Landingpage).
- **Animation:** Ein Cursor/Finger zieht die erste Karte nach links (überspringen, swipe-left-Sound), nächste Karte erscheint, wird nach rechts gezogen (swipe-right-Sound). Toast: „Interesse an Odd Bloom gesendet.“
- **Schritt-Label:** „2 · Deals wischen“
- **Text:** „Das Budget steht auf der Karte. Rechts heißt: interessiert.“

### Szene 7 – Schritt 3: Angebot im Chat (0:26–0:31)
- **Übergang (Match-Cut):** Am Ende von Szene 6 fliegt die Odd-Bloom-Karte klein in die Kopfzeile des Chats und wird dort zum Avatar. Das Browserfenster bleibt stehen, nur die Überschrift wechselt.
- **Bild:** Chat-Ansicht. Nachrichten tippen sich rein: Marke „Ein TikTok für 250 €?“ → Creator „Deal!“. Darunter Angebots-Karte, Stempel-Animation „Angebot angenommen“.
- **Schritt-Label:** „3 · Angebot annehmen“
- **Text:** „Absprache direkt im Chat.“

### Szene 8 – Schritt 4: Marke zahlt zuerst (0:31–0:35)
- **Bild:** Zahlungsstatus-Leiste mit drei Punkten: „Warte auf Zahlung“ → „Bezahlt · zurückgehalten“. Ein Schloss-Icon schließt sich über dem Betrag 250 €.
- **Schritt-Label:** „4 · Bezahlt, bevor du postest“
- **Text:** „Die Marke zahlt zuerst. Das Geld wird zurückgehalten, bis dein Post online ist.“

### Szene 9 – Schritt 5: Posten & freigeben (0:35–0:39)
- **Bild:** Ein Post-Platzhalter wird „hochgeladen“ (Ladebalken), Link-Feld füllt sich, Button „Post eingereicht“. Ein Haken-Kreis zeichnet sich, Status springt auf „Freigegeben“.
- **Schritt-Label:** „5 · Posten, Link einreichen“
- **Text:** „Die Marke hat 3 Tage zum Freigeben. Sonst geht die Zahlung trotzdem an dich.“

### Szene 10 – Auszahlung (0:39–0:42)
- **Bild:** Abrechnungs-Karte baut sich zeilenweise auf: „Odd Bloom hat gezahlt 250,00 €“, „comtor-Gebühr (10 %) −25,00 €“, Trennlinie, „Du bekommst **225,00 €**“ – Zahl zählt hoch, success-Sound, kurzer Konfetti-Burst in Grautönen.
- **Text:** „Du behältst 90 %.“

### Szene 11 – Angebot: 100 Founding Creator
- **Bild:** Schwarzer Screen wie bei den Founding Brands: „100 Plätze“ zählt hoch, ein Raster aus 100 freien Plätzen (10 × 10) baut sich auf, eine Lichtwelle läuft darüber.
- **Text:** „**100 Plätze** für Founding Creator.“ → „Pro kostenlos. Solange dein Konto besteht.“ → „Du behältst 97 % statt 90 % jeder Zahlung“, „~~10 € im Monat~~ 0 €“, „Kein Abo, nichts zu kündigen“.

### Szene 12 – CTA
- Wie zuvor, zusätzlich „Die ersten 100 Creator bekommen Pro kostenlos.“ über „Jetzt im Web · Bald für iOS & Android“.

### (alt) Szene 11 – CTA (0:42–0:45)
- **Bild:** Schwarzer Screen, Logo oben, große Headline, darunter URL-Pill.
- **Text:** „Wisch bezahlte Marken-Deals nach rechts.“ / „Jetzt im Web: comtor.app“ / klein: „Bald für iOS & Android“
- **VO:** „comtor. Jetzt kostenlos im Web starten.“

---

## Video 2: Marken, „Wachse schneller mit UGC“

Länge: ca. 33,5 s (Zeiten der Szenen unten vom ersten Entwurf; aktuelle Zeiten in `VOICEOVER.md`)

### Szene 1 – Hook (0:00–0:03)
- **Bild:** Ab dem ersten Frame wischt ein Daumen im Feed schnell durch drei Anzeigen („SALE −20 %“, „NEU Kollektion“, „GRATIS Versand“), mit Bewegungsunschärfe. Der Feed bleibt erst bei einem Creator-Video stehen.
- **Text:** „Jeder scrollt **an Werbung vorbei.**“
- **Übergang (Match-Cut):** Das Handy mit dem Creator-Video bleibt stehen und wird zu Szene 2, nur die Überschrift wechselt.

### Szene 2 – UGC als Antwort (0:04–0:09)
- **Bild:** An ihrer Stelle erscheint ein Creator-Video (runder Avatar, Produktfoto, Untertitel-Balken). Herzen, Kommentare und Shares fliegen raus.
- **Text:** „Echte Creator. Echte Videos. **Echtes Vertrauen.**“
- **VO (optional):** „Menschen kaufen von Menschen. Genau das ist UGC.“

### Szene 3 – Conversion (0:06–0:10)
- **Bild:** 3×3-Raster aus Creator-Videos, darunter eine Karte „Conversion“ mit zwei Balken: „Klassische Anzeige“ kurz und grau, „UGC“ lang und schwarz. Keine Zahlen, nur der Vergleich.
- **Text:** „UGC konvertiert besser **als klassische Werbung.**“ (Für „höchste Conversion-Rate“ braucht es einen Beleg, siehe `VOICEOVER.md`.)

### Szene 4 – Logo-Reveal (0:13–0:15)
- **Bild:** Grid zoomt raus, schwarzer Wipe, comtor-Logo.
- **Text:** „UGC-Creator finden. In Minuten.“

### Szene 5 – Anfrage posten (0:15–0:20)
- **Bild:** Browserfenster mit dem Anfrage-Builder (wie `brand-builder.tsx`): Felder füllen sich nacheinander – Titel „Unser neues Parfüm, erste Eindrücke“, Foto wird gewählt, Budget 300 €, Plattform Instagram, Inhalt 1 Reel. Rechts die Vorschau-Karte „Das sehen Creator“, die live mitwächst. Toast: „Anfrage veröffentlicht.“
- **Text:** „Anfrage in einer Minute.“

### Szene 6 – Creator melden sich (0:20–0:24)
- **Bild:** Push-Benachrichtigungen stapeln sich von oben: „Lena interessiert sich für ‚Unser neues Parfüm‘“, „Mia …“, „Jonas …“. Daneben die Liste „Interessierte Creator“ mit Avataren, Reichweite und Sternen.
- **Text:** „Passende Creator kommen zu dir.“

### Szene 7 – Sicher abwickeln (0:24–0:27)
- **Bild:** Schnelle Sequenz: Angebot senden → „Jetzt zahlen“ → Schloss „zurückgehalten“ → Post online → Button „Freigeben“ wird geklickt.
- **Text:** „Ausgezahlt wird erst, wenn der Post online ist.“

### Szene 8 – Angebot: 50 Founding Brands (0:27–0:32)
- **Bild:** Schwarzer Screen. Ein Raster aus 50 kleinen Quadraten (5 × 10), alle frei (Umrisse). Eine Lichtwelle läuft einmal diagonal darüber. Groß darüber ein Zähler.
- **Text:** „**50 Plätze** für Founding Brands“ → „Pro kostenlos. Solange dein Konto besteht.“ → Perk-Zeilen: „3 % statt 10 % Gebühr“, „Kein Abo, nichts zu kündigen“ (durchgestrichen „10 €/Monat“).
- **VO:** „Die ersten 50 Marken bekommen Pro kostenlos, für immer.“

### Szene 9 – CTA (0:32–0:35)
- **Bild:** Logo, Headline, URL-Pill, das 50er-Raster klein darunter.
- **Text:** „Sichere dir deinen Platz.“ / „comtor.app“
- **VO:** „Sichere dir jetzt deinen Platz.“

---

## Offene Punkte für dich

1. **„Lebenslang“ vs. „solange dein Konto besteht“:** Die App sagt überall „solange dein Konto besteht“ (bewusst so formuliert). Ich habe das im Text übernommen. Im Voiceover steht „lebenslang, solange dein Konto besteht“ (`VOICEOVER.md`, B08), im Bild bleibt „Solange dein Konto besteht“.
2. **Voiceover:** Entschieden: ElevenLabs, Skript in `VOICEOVER.md`.
3. **Freie Plätze im 50er-Raster:** Entschieden: alle 50 frei.
4. **Format:** Nur 9:16 oder zusätzlich 16:9 (Website/YouTube) bzw. 1:1?
5. **Sprache:** Nur Deutsch oder auch Englisch? Die Texte sind so gebaut, dass sie sich leicht austauschen lassen.
6. **URL im CTA:** `comtor.app` korrekt?
