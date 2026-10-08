# Ad-Serie: 6 × 15 s (3 Creator, 3 Marken)

Aus den ersten zehn sind sechs übrig (AC1, AC2, AC4, AB1, AB2, AB3). Jede Ad trifft **genau einen Painpoint**, damit sich in den Kampagnen messen lässt, welcher Schmerz am besten
konvertiert. Code: `src/ads/` (Remotion, Folder „Ads“ im Studio). Format 1080 × 1920, 30 fps, 120 BPM.

## Aufbau (gleich für alle 10)

| Beat | Szene | Länge | Ziel | Prinzip |
|---|---|---|---|---|
| 1 | Pain | 0–4,5 s | Daumen stoppen, Schmerz konkret machen | Pattern Interrupt ab Frame 0, Wiedererkennung, konkrete Details statt Abstraktion |
| 2 | Turn | 4,5–5,5 s | Wendung: schwarzer, körniger Screen, eine Zeile, das Logo groß und blass im Hintergrund | Spannungsauflösung, Marke im emotionalen Peak |
| 3 | Mechanismus | 5,5–10 s | Der Teil von comtor, der genau diesen Schmerz löst | Glaubwürdigkeit durch echte UI statt Behauptung |
| 4 | Payoff | 10–11,5 s | Das Versprechen in einer Zeile | Merkbarkeit, ein Gedanke |
| 5 | Offer + CTA | 11,5–15 s | Founding-Plätze, comtor.app (schwarz mit Grain, Logo im Hintergrund) | Echte Knappheit (100 / 50 Plätze), eine einzige Handlung |

Stil: weiß und schwarz wie die App, riesige Lato-Black-Typo (jede Zeile ein Gedanke, die zweite grau), Wörter
kommen aus einer Unschärfe in den Fokus, UI schwebt auf weichen Schatten, langsamer Push-in. Farbe nur über
Produktfotos. Jede Szene mit UI trägt „Beispieldaten“. Wording: „zurückgehalten“, nie „Treuhand“.

## Creator

| Ad | Painpoint | Hook | Mechanismus | Payoff | CTA |
|---|---|---|---|---|---|
| AC1 | Preis-DMs | „Was nimmst du für einen Post?“ + 5 DMs | Deal-Karte, Budget markiert, Cursor klickt ♥, Karte fliegt weg | Kein Verhandeln. Nur wischen. | Wisch dich zum ersten Deal. |
| AC2 | Rechnung nie bezahlt | „Post ist online. Das Geld nicht.“ Rechnung, Tage zählen bis 47, „Überfällig“ | Status: angenommen → bezahlt · zurückgehalten → Post online → ausgezahlt | Erst bezahlt. Dann posten. | Nie wieder Rechnungen jagen. |
| AC4 | Warten auf Anfragen | „Noch keine Marke hat geschrieben?“ Leeres Postfach, Tag 30 | Karten-Stapel, Cursor klickt zweimal ♥, Interesse gesendet | Du wählst. Nicht umgekehrt. | Dein nächster Deal wartet schon. |

## Marken

| Ad | Painpoint | Hook | Mechanismus | Payoff | CTA |
|---|---|---|---|---|---|
| AB1 | Anzeigen werden ignoriert | „Deine Anzeige? Weggewischt.“ Daumen wischt 5 Ads weg | Creator-Video mit Untertiteln, Push „Lena interessiert sich …“ | UGC statt Werbung. | Sichere dir deinen Platz. |
| AB2 | Creator-Suche per DM | „47 DMs. 2 Antworten.“ Gesendet-Liste, alles „Gesehen“ | Cursor klickt „Veröffentlichen“, 3 Pushes von Creatorn | Null Kaltakquise. | Sichere dir deinen Platz. |
| AB3 | Bezahlt, nie gepostet | „Bezahlt. Gepostet hat niemand.“ Chat: Gesehen, Tippen bricht ab | Bezahlt · zurückgehalten → Post online → Cursor klickt „Freigeben“ → ausgezahlt | Du behältst die Kontrolle. | Zahl erst, wenn's live ist. |

## Marken in den Ads

| Marke | Bilder | Wo |
|---|---|---|
| Raw Supplies (rawsupplies.de) | Hoodie vorne/hinten, Hose, Profilbild | AC1 (Hoodie-Deal, dahinter die Hose), AC4, AB1 (Hoodie als Creator-Video) |
| vintagesteals.de | Katalog-Seiten (Plaid-Jacke, Evisu), Profilbild | AC2 (Status 400 €), AC4, AB2 (Anfrage „Catalogue Drop 2026“) |
| Nokar | Hoodie-Produktfoto, Profilbild | AC4 (dritte Karte), AB3 (Freigabe 300 €) |

Dateien: `public/photos/brands/`, `public/brands/`, Deals in `src/ads/brands.ts`. Budgets und Deals sind
Beispiele (daher „Beispieldaten“ im Bild). Die Marken müssen der Verwendung von Name und Bildern in Ads zugestimmt haben.
Nokar-Bild und -Profilbild sind noch Platzhalter (`nokar-hoodie.jpg`, `nokar-avatar.png`): einfach die Dateien ersetzen.

## Voiceover (ElevenLabs)

**Eine Datei pro Zeile**, benannt nach der ID, in `voice/source/ads/` legen (`AC1-1.mp3` … `AB3-5.mp3`). Stille
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
| AC4-1 | Noch keine Marke hat dir geschrieben? |
| AC4-2 | Warte nicht länger. |
| AC4-3 | Auf comtor wischst du durch bezahlte Deals. |
| AC4-4 | Du wählst. Nicht umgekehrt. |
| AC4-5 | Jetzt auf comtor punkt app. |
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

## Captions (Primärtext für die Anzeigen)

| Ad | Caption |
|---|---|
| AC1 | Schluss mit „Was nimmst du für einen Post?“. Auf comtor steht das Budget schon auf der Karte. Die ersten 100 Creator bekommen Pro kostenlos. |
| AC2 | Erst bezahlt, dann posten: Die Marke zahlt zuerst, das Geld wird zurückgehalten, bis dein Post online ist. |
| AC4 | Warte nicht auf DMs von Marken. Wisch durch bezahlte Deals und entscheide selbst. |
| AB1 | Menschen scrollen an Werbung vorbei, nicht an Creatorn. Finde UGC-Creator auf comtor. |
| AB2 | Keine Kalt-DMs mehr: Anfrage posten, passende Creator melden sich bei dir. |
| AB3 | Ausgezahlt wird erst, wenn der Post online ist und du ihn freigibst. |

## Befehle

```
npm run studio      # Folder „Ads“
npm run ads         # Contact-Sheet pro Ad: out/ads/<ID>.png (--probe=2:84,86 für einzelne Frames, z. B. Klicks)
npm run ads:video   # Videos: out/ads/<ID>-final.mp4 (auf -14 LUFS gemastert)
npm run ads:audio   # Musik neu (public/music/ads/<ID>.mp3), nach geändertem Timing
npm run ads:voice   # Voiceover einlesen, dann Musik neu
```
