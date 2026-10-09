# Ad-Serie: 6 × 15 s (3 Creator, 3 Marken)

Aus den ersten zehn sind sechs übrig (AC1, AC2, AC4, AB1, AB2, AB3). Jede Ad trifft **genau einen Painpoint**, damit sich in den Kampagnen messen lässt, welcher Schmerz am besten
konvertiert. Code: `src/ads/` (Remotion, Folder „Ads“ im Studio). Format 1080 × 1920, 30 fps, 120 BPM.

## Aufbau (gleich für alle 10)

| Beat | Szene | Länge | Ziel | Prinzip |
|---|---|---|---|---|
| 1 | Pain | 0–4,5 s | Daumen stoppen, Schmerz konkret machen | Pattern Interrupt ab Frame 0, Wiedererkennung, konkrete Details statt Abstraktion |
| 2 | Turn | 4,5–5,5 s | Wendung: schwarzer Screen mit stillem, feinem Grain (wie die E-Mails), eine Zeile, das Logo groß und blass im Hintergrund | Spannungsauflösung, Marke im emotionalen Peak |
| 3 | Mechanismus | 5,5–10 s | Der Teil von comtor, der genau diesen Schmerz löst | Glaubwürdigkeit durch echte UI statt Behauptung |
| 4 | Payoff | 10–11,5 s | Das Versprechen in einer Zeile | Merkbarkeit, ein Gedanke |
| 5 | Offer + CTA | 11,5–15 s | „100 Plätze“ zählen hoch, das Raster füllt sich, „10 € im Monat“ wird zu „0 €“, der Cursor klickt comtor.app und sichert Platz 1 (alles in der Reels-Safe-Zone) | Echte Knappheit (100 / 50 Plätze), Preisanker, eine einzige Handlung |

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

**Stand:** aufgenommen und eingebaut sind AC2, AC4, AB1, AB2, AB3 (Rohdateien in `voice/source/ads/`: AC2 und AC4 mit
„Christian – Polite and Calm“, AB1, AB2 und AB3 mit „Chris Beck – Young Ads“, Speed 1,00). **AC1 hat noch keine Aufnahme**
und läuft ohne Voiceover. Weil die Stimmen langsamer sprechen als das Zeitbudget unten (ca. 3 Silben pro Sekunde),
kürzt `make-ad-voiceover.py` Pausen innerhalb einer Zeile auf höchstens 0,22 s und spielt die Stimme mit 1,08 facher
Geschwindigkeit (Tonhöhe bleibt, `GAP_CAP` und `TEMPO` im Skript). Die Ads werden dadurch 16,5–18 s lang. Wer kürzere Ads
will, nimmt in ElevenLabs mit Speed 1,15 bis 1,2 auf und setzt `TEMPO = 1.0`. Die Anzahl der Sprechabschnitte je Zeile
(`PLAN` im Skript) gilt für diese Aufnahmen; bei einer Neuaufnahme anpassen oder Einzeldateien liefern.

Stimme wie bei den langen Videos: „Damien – Iconic Commercial Power“, Speed 1,10, Stability 44, Similarity 100.
Creator-Ads jung und energisch, Marken-Ads ruhig und sicher (eine Stimme für alle ist ok). Zahlen sind ausgeschrieben.
Aussprache prüfen: „comtor“ (notfalls „Kom-tor“), „Ju-Dschi-Si“ (UGC, steht schon in Lautschrift; bei schiefer Betonung „Juh Dschih Ssih“ probieren), „D-M-s“ (steht schon buchstabiert), „Kaltakquise“.

**Wie liefern:** entweder **eine Datei pro Ad** (`AC1.mp3` … `AB3.mp3`, die fünf Zeilen nacheinander mit etwa einer
Sekunde Pause dazwischen) oder **eine Datei pro Zeile** (`AC1-1.mp3` … `AB3-5.mp3`). Beides in `voice/source/ads/`,
auch gemischt (die Einzeldatei gewinnt). Stille am Anfang und Ende ist egal. Jeder Satz ist ein eigener Sprechabschnitt:
ElevenLabs setzt nach Punkt und Fragezeichen eine Pause, daran werden die Zeilen geschnitten. Stimmt die Anzahl nicht,
bricht das Skript mit einer Liste der gefundenen Abschnitte ab, dann die Ad als Einzeldateien schicken.

```
npm run ads:voice   # schneidet, normalisiert, passt jede Szene in ganzen Beats an die Zeile an, Musik neu
npm run ads:video   # rendert out/ads/<ID>-final.mp4
```

**Zeitbudget:** Die Szene wächst automatisch, wenn die Zeile nicht reinpasst (jede Überschreitung kostet etwa 0,5 s).
Bleibst du darunter, bleibt die Ad bei 15 s; realistisch sind 15,5–16 s. Fehlt eine Zeile, behält die Szene ihr
gezeichnetes Timing.

| Szene | Zeile höchstens | ca. Silben |
|---|---|---|
| 1 Pain | 4,0 s | 16 |
| 2 Turn | 1,0 s | 4 |
| 3 Mechanismus | 3,4 s | 14 |
| 4 Payoff | 1,1 s (6–7 Silben strecken um 0,5 s) | 5 |
| 5 CTA | 2,8 s | 12 |

| ID | Text | Abschnitte | Im Bild |
|---|---|---|---|
| AC1-1 | Was nimmst du für einen Post? Immer dieselbe Frage. | 2 | fünf DMs |
| AC1-2 | Schluss damit. | 1 | |
| AC1-3 | Auf comtor steht das Budget auf der Karte. Ein Klick. | 2 | Klick bei 2,9 s |
| AC1-4 | Kein Verhandeln. Nur wischen. | 2 | |
| AC1-5 | Hundert Plätze. Pro kostenlos. comtor punkt app. | 3 | Klick bei 3,0 s |
| AC2-1 | Post ist online. Das Geld nicht. Seit siebenundvierzig Tagen. | 3 | Zähler erreicht 47 bei 3,7 s |
| AC2-2 | Jetzt andersrum. | 1 | |
| AC2-3 | Die Marke zahlt zuerst. Das Geld wird zurückgehalten. | 2 | |
| AC2-4 | Erst bezahlt. Dann posten. | 2 | |
| AC2-5 | Hundert Plätze. Pro kostenlos. comtor punkt app. | 3 | Klick bei 3,0 s |
| AC4-1 | Noch keine Marke hat dir geschrieben? Seit dreißig Tagen? | 2 | Postfach, Tag 30 |
| AC4-2 | Nicht warten. | 1 | |
| AC4-3 | Auf comtor wählst du bezahlte Deals aus. Mit einem Klick. | 2 | Klicks bei 1,6 s und 3,3 s |
| AC4-4 | Du wählst. Nicht umgekehrt. | 2 | |
| AC4-5 | Hundert Plätze. Pro kostenlos. comtor punkt app. | 3 | Klick bei 3,0 s |
| AB1-1 | Deine Anzeige? Weggewischt. Die nächste? Auch. | 4 | fünf Wischer |
| AB1-2 | Creatorn hört man zu. | 1 | |
| AB1-3 | Auf comtor melden sich Creator bei dir. | 1 | Push ab 2,7 s |
| AB1-4 | Ju-Dschi-Si statt Werbung. | 1 | |
| AB1-5 | Fünfzig Plätze. Pro kostenlos. comtor punkt app. | 3 | Klick bei 3,0 s |
| AB2-1 | Siebenundvierzig D-M-s. Zwei Antworten. Das kann besser. | 3 | Gesendet-Liste |
| AB2-2 | Dreh es um. | 1 | |
| AB2-3 | Du postest eine Anfrage. Creator melden sich bei dir. | 2 | Klick bei 1,7 s, Pushes ab 2,3 s |
| AB2-4 | Null Kaltakquise. | 1 | |
| AB2-5 | Fünfzig Plätze. Pro kostenlos. comtor punkt app. | 3 | Klick bei 3,0 s |
| AB3-1 | Bezahlt. Und gepostet hat niemand. Gesehen. Keine Antwort. | 4 | Chat mit „Gesehen“ |
| AB3-2 | Nicht auf comtor. | 1 | |
| AB3-3 | Dein Geld wird zurückgehalten, bis der Post online ist. | 1 | Freigeben-Klick bei 3,3 s |
| AB3-4 | Du behältst die Kontrolle. | 1 | |
| AB3-5 | Fünfzig Plätze. Pro kostenlos. comtor punkt app. | 3 | Klick bei 3,0 s |

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
