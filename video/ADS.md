# Ad-Serie: 10 × 15 s (5 Creator, 5 Marken)

Jede Ad trifft **genau einen Painpoint**, damit sich in den Kampagnen messen lässt, welcher Schmerz am besten
konvertiert. Code: `src/ads/` (Remotion, Folder „Ads“ im Studio). Format 1080 × 1920, 30 fps, 120 BPM.

## Aufbau (gleich für alle 10)

| Beat | Szene | Länge | Ziel | Prinzip |
|---|---|---|---|---|
| 1 | Pain | 0–4,5 s | Daumen stoppen, Schmerz konkret machen | Pattern Interrupt ab Frame 0, Wiedererkennung, konkrete Details statt Abstraktion |
| 2 | Turn | 4,5–5,5 s | Wendung: schwarzer Screen, eine Zeile, Logo | Spannungsauflösung, Marke im emotionalen Peak |
| 3 | Mechanismus | 5,5–10 s | Der Teil von comtor, der genau diesen Schmerz löst | Glaubwürdigkeit durch echte UI statt Behauptung |
| 4 | Payoff | 10–11,5 s | Das Versprechen in einer Zeile | Merkbarkeit, ein Gedanke |
| 5 | Offer + CTA | 11,5–15 s | Founding-Plätze, comtor.app | Echte Knappheit (100 / 50 Plätze), eine einzige Handlung |

Stil: weiß und schwarz wie die App, riesige Lato-Black-Typo (jede Zeile ein Gedanke, die zweite grau), Wörter
kommen aus einer Unschärfe in den Fokus, UI schwebt auf weichen Schatten, langsamer Push-in. Farbe nur über
Produktfotos. Jede Szene mit UI trägt „Beispieldaten“. Wording: „zurückgehalten“, nie „Treuhand“.

## Creator

| Ad | Painpoint | Hook | Mechanismus | Payoff | CTA |
|---|---|---|---|---|---|
| AC1 | Preis-DMs | „Was nimmst du für einen Post?“ + 5 DMs | Deal-Karte, Budget markiert, Swipe rechts | Kein Verhandeln. Nur wischen. | Wisch dich zum ersten Deal. |
| AC2 | Rechnung nie bezahlt | „Post ist online. Das Geld nicht.“ Rechnung, Tage zählen bis 47, „Überfällig“ | Status: angenommen → bezahlt · zurückgehalten → Post online → ausgezahlt | Erst bezahlt. Dann posten. | Nie wieder Rechnungen jagen. |
| AC3 | Produkt statt Geld | „Wir zahlen dich mit dem Produkt.“ Paket fällt, Kontostand 0,00 € | Deal-Karte: 400 € Budget **+** Produkt inklusive | Echte Deals. Echtes Geld. | Lass dich bezahlen. |
| AC4 | Warten auf Anfragen | „Noch keine Marke hat geschrieben?“ Leeres Postfach, Tag 30 | Karten-Stapel, links/rechts wischen, Interesse gesendet | Du wählst. Nicht umgekehrt. | Dein nächster Deal wartet schon. |
| AC5 | Unklar, was übrig bleibt | „250 € Deal. Was bleibt davon?“ Abzüge mit „?“ | Abrechnung 250 € − 10 % = 225 € | Mit Pro: 97 % (242,50 € statt 225,00 €) | Behalte mehr. |

## Marken

| Ad | Painpoint | Hook | Mechanismus | Payoff | CTA |
|---|---|---|---|---|---|
| AB1 | Anzeigen werden ignoriert | „Deine Anzeige? Weggewischt.“ Daumen wischt 5 Ads weg | Creator-Video mit Untertiteln, Push „Lena interessiert sich …“ | UGC statt Werbung. | Sichere dir deinen Platz. |
| AB2 | Creator-Suche per DM | „47 DMs. 2 Antworten.“ Gesendet-Liste, alles „Gesehen“ | Anfrage veröffentlicht, 3 Pushes von Creatorn | Null Kaltakquise. | Sichere dir deinen Platz. |
| AB3 | Bezahlt, nie gepostet | „Bezahlt. Gepostet hat niemand.“ Chat: Gesehen, Tippen bricht ab | Bezahlt · zurückgehalten → Post online → „Freigeben“ → ausgezahlt | Du behältst die Kontrolle. | Zahl erst, wenn's live ist. |
| AB4 | Retainer und Grundgebühren | „Monatliche Retainer? Für ein paar Posts?“ Beispielrechnung 9.490 € | 0 € Grundgebühr · 10 % pro Deal · 3 % mit Pro | Zahl nur pro Deal. | Sichere dir deinen Platz. |
| AB5 | Kein Content-Team | „Kein Content-Team?“ Leerer Content-Plan | Anfrage-Builder füllt sich, „Anfrage veröffentlicht“ | Creator machen den Content. | Content, ohne Team. |

AB4 zeigt eine als „Beispielrechnung“ gekennzeichnete Agentur-Rechnung, keine Marktbehauptung.

## Voiceover (ElevenLabs)

**Eine Datei pro Zeile**, benannt nach der ID, in `voice/source/ads/` legen (`AC1-1.mp3` … `AB5-5.mp3`). Stille
am Anfang und Ende ist egal. Danach:

```
npm run ads:voice   # schneidet, normalisiert, passt jede Szene in ganzen Beats an die Zeile an, Musik neu
npm run ads:video   # rendert out/ads/<ID>-final.mp4
```

Einstellungen wie in `VOICEOVER.md` (Multilingual v2, Stability 40–50 %, Similarity 75 %, Style 10–20 %). Creator
eher jung und energisch, Marken ruhig und sicher. Fehlt eine Zeile, behält die Szene ihr gezeichnetes Timing. Ist
eine Zeile länger als die Szene, wird die Szene länger (die Ad dann etwas über 15 s).

| ID | Text |
|---|---|
| AC1-1 | Was nimmst du für einen Post? Jede Woche die gleiche Frage. |
| AC1-2 | Schluss damit. |
| AC1-3 | Auf comtor steht das Budget schon auf der Karte. |
| AC1-4 | Kein Verhandeln. Nur wischen. |
| AC1-5 | Die ersten hundert Creator bekommen Pro kostenlos. Auf comtor punkt app. |
| AC2-1 | Post ist online. Das Geld nicht. |
| AC2-2 | Ab jetzt andersrum. |
| AC2-3 | Auf comtor zahlt die Marke zuerst. Das Geld wird zurückgehalten, bis dein Post online ist. |
| AC2-4 | Erst bezahlt. Dann posten. |
| AC2-5 | Jetzt auf comtor punkt app. |
| AC3-1 | Wir schicken dir das Produkt als Bezahlung? |
| AC3-2 | Ein Produkt zahlt keine Miete. |
| AC3-3 | Auf comtor bekommst du Geld – und das Produkt oft dazu. |
| AC3-4 | Echte Deals. Echtes Geld. |
| AC3-5 | Die ersten hundert Creator bekommen Pro kostenlos. Auf comtor punkt app. |
| AC4-1 | Noch keine Marke hat dir geschrieben? |
| AC4-2 | Warte nicht länger. |
| AC4-3 | Auf comtor wischst du durch bezahlte Deals. |
| AC4-4 | Du wählst. Nicht umgekehrt. |
| AC4-5 | Jetzt auf comtor punkt app. |
| AC5-1 | Zweihundertfünfzig Euro Deal. Was bleibt davon? |
| AC5-2 | Klare Zahlen. |
| AC5-3 | Auf comtor behältst du neunzig Prozent. |
| AC5-4 | Mit Pro sogar siebenundneunzig. |
| AC5-5 | Die ersten hundert Creator bekommen Pro kostenlos. Auf comtor punkt app. |
| AB1-1 | Deine Anzeige? Weggewischt. |
| AB1-2 | Aber echten Creatorn hören die Leute zu. |
| AB1-3 | Auf comtor melden sie sich bei dir. |
| AB1-4 | U-G-C statt Werbung. |
| AB1-5 | Die ersten fünfzig Marken bekommen Pro kostenlos. comtor punkt app. |
| AB2-1 | Siebenundvierzig DMs. Zwei Antworten. |
| AB2-2 | Dreh es um. |
| AB2-3 | Auf comtor postest du eine Anfrage – und passende Creator melden sich bei dir. |
| AB2-4 | Ohne eine einzige Kalt-DM. |
| AB2-5 | Sichere dir deinen Platz auf comtor punkt app. |
| AB3-1 | Bezahlt – und gepostet hat niemand? |
| AB3-2 | Nicht auf comtor. |
| AB3-3 | Dein Geld wird zurückgehalten, bis der Post online ist und du ihn freigibst. |
| AB3-4 | Du behältst die Kontrolle. |
| AB3-5 | Jetzt auf comtor punkt app. |
| AB4-1 | Monatliche Retainer – für ein paar Posts? |
| AB4-2 | Geht auch ohne. |
| AB4-3 | Auf comtor gibt's keine Grundgebühr. Du zahlst nur pro Deal. |
| AB4-4 | Mit Pro nur drei Prozent. |
| AB4-5 | Die ersten fünfzig Marken bekommen Pro kostenlos. comtor punkt app. |
| AB5-1 | Kein Content-Team? |
| AB5-2 | Brauchst du nicht. |
| AB5-3 | Anfrage in einer Minute. |
| AB5-4 | Creator machen den Content für dich. |
| AB5-5 | Sichere dir deinen Platz auf comtor punkt app. |

## Captions (Primärtext für die Anzeigen)

| Ad | Caption |
|---|---|
| AC1 | Schluss mit „Was nimmst du für einen Post?“. Auf comtor steht das Budget schon auf der Karte. Die ersten 100 Creator bekommen Pro kostenlos. |
| AC2 | Erst bezahlt, dann posten: Die Marke zahlt zuerst, das Geld wird zurückgehalten, bis dein Post online ist. |
| AC3 | Ein Produkt zahlt keine Miete. Auf comtor bekommst du Geld – und das Produkt oft dazu. |
| AC4 | Warte nicht auf DMs von Marken. Wisch durch bezahlte Deals und entscheide selbst. |
| AC5 | 250 € Deal? Du behältst 225 €. Mit Pro 242,50 €. Die ersten 100 Creator bekommen Pro kostenlos. |
| AB1 | Menschen scrollen an Werbung vorbei, nicht an Creatorn. Finde UGC-Creator auf comtor. |
| AB2 | Keine Kalt-DMs mehr: Anfrage posten, passende Creator melden sich bei dir. |
| AB3 | Ausgezahlt wird erst, wenn der Post online ist und du ihn freigibst. |
| AB4 | Keine Grundgebühr, keine Laufzeit. Du zahlst nur pro Deal: 10 %, mit Pro 3 %. |
| AB5 | Kein Content-Team? Anfrage in einer Minute, Creator machen den Content. Die ersten 50 Marken bekommen Pro kostenlos. |

## Befehle

```
npm run studio      # Folder „Ads“
npm run ads         # Contact-Sheet pro Ad: out/ads/<ID>.png
npm run ads:video   # Videos: out/ads/<ID>-final.mp4 (auf -14 LUFS gemastert)
npm run ads:audio   # Musik neu (public/music/ads/<ID>.mp3), nach geändertem Timing
npm run ads:voice   # Voiceover einlesen, dann Musik neu
```
