# UX-Backlog: Brand Deals (Stand 9.10.2026, nach dem Durchgang)

Ideen, um den Deal-Ablauf auf dem Handy leichter zu machen, und was davon gebaut ist. Aufwand: S = unter 1 Std., M = ein paar
Stunden, L = ein Tag oder mehr. **✓** = gebaut und im Browser geprüft (390 px und 1280 px, Demo-Seed mit allen 13 Deal-Zuständen),
**teils** = ein Teil fehlt (steht dabei), **offen** = nicht gebaut.

Alles hängt am Schalter `BRAND_DEALS_ENABLED`: ohne ihn bleibt die Oberfläche wie vor den Deals.

## A. Navigation

1. **Tab-Leiste auf 4 Einträge** ✓
   - Handy-Leiste: Anfragen bzw. Feed · Nachrichten · Deals · Konto. Entdecken sitzt als Lupe im Kopf, Zahlungen und Rechnungen sind
     Reiter in „Deals“ (Deals | Zahlungen | Rechnungen, `DealsTabs`). Ohne Deals bleibt die Leiste unverändert (5 Einträge).
   - Die Regeln stehen in `src/lib/nav-links.ts` (rein, getestet); die Desktop-Seitenleiste behält alle Einträge.
2. **Entdecken in den Feed holen** offen: bewusst nur die Lupe im Kopf; ob Entdecken ganz in den Feed wandert, erst nach dem Test mit
   echten Nutzern.
3. **Ein Badge statt drei** ✓: Nachrichten zeigt Ungelesenes, Deals alles, was auf dich wartet (Deals und Zahlungen zusammen) und
   öffnet dann direkt `?filter=mine`; „Zahlungen“ trägt kein eigenes Badge mehr, wo es „Deals“ gibt.
4. **Alte Zahlungsseite für Deals abbauen** offen: sie bleibt für Anfragen ohne Deal; bei Deal-Collabs verweist sie mit einem Satz auf die Deal-Seite.

## B. Deal-Seite

5. **Hauptaktion in der Karte „Nächster Schritt“** ✓: ein Knopf springt zum fälligen Formular (Zahlung, Entwurf, Prüfung, Post, Beleg).
6. **Abschnitte nach Phase sortieren** ✓ (`src/lib/deals/page-plan.ts`): der Abschnitt, in dem der Deal gerade steht, folgt direkt
   auf die Karte; was hinter dem Deal liegt (Zahlung, Entwurf, Post) schrumpft zu einer Zeile („Sicher hinterlegt: 238 €“).
   Bei Streit und Abbruch bleibt alles offen.
7. **Stepper kompakt** ✓: auf dem Handy „Schritt 4 von 9: Entwurf“ mit Balken, ab md alle Stufen.
8. **Verlauf und Randaktionen einklappen** ✓: „Verlauf“ zu, „Problem melden“ und „Deal abbrechen“ im „⋯“-Menü im Kopf.
9. **Vertrag als Kurzfassung** ✓: Preis, Zahlung bzw. Auszahlung, Formate, Kennzeichnung, Posting-Fenster, Nutzungsrechte oben;
   „Alle Bedingungen“ (Steuer, Gebühr, Hashtags, Ablauf, Exklusivität, Hinweise) darunter, offen für wen noch bestätigen muss.
10. **Posts vor Entwürfen, sobald der Entwurf freigegeben ist** ✓ (folgt aus 6).

## C. Briefing-Builder (Marke)

11. **Feste Speichern-Leiste mit Fehlerzahl** ✓: auf dem Handy über der Tab-Leiste fest, ab md am unteren Fensterrand; „2 Fehler“
    springt zum ersten Fehler (auch in einen anderen Schritt). Die Meldungen stehen an den Feldern.
12. **Vorlagen** ✓: wählen, aus dem Formular speichern (auf Wunsch als Standard für neue Anfragen), umbenennen, löschen, Standard
    setzen, auf mehrere Anfragen anwenden (`/dashboard/startup/templates`, mit Ergebnis je Anfrage). *Offen:* mitgelieferte
    Beispielvorlagen („Reel + Story“, „Nur TikTok“, „UGC ohne Posting“): bisher legt die Marke ihre eigenen an.
13. **Drei Schritte statt sechs Abschnitte** ✓: Inhalt → Kennzeichnung und Fristen → Rechte. Exklusivität und Nutzungsrechte sind
    aus, bis man sie einschaltet. Fehlerzahl je Schritt auf dem Reiter.
14. **Briefing aus früherer Anfrage kopieren und Standardwerte merken** ✓: Auswahl „Von einer früheren Anfrage übernehmen“ füllt das
    Formular (ohne Termine), gespeichert wird erst mit dem Briefing. Ein unfertiger Entwurf wird nach zwei Sekunden automatisch
    gesichert und beim nächsten Öffnen mit „Entwurf verwerfen“ angeboten.
15. **Bessere Vorbelegung** ✓: Markt und Kennzeichnungen aus dem Land der Geschäftsdaten (nur Länder mit eigenen Regeln, sonst
    Deutschland); „Werbung“ und „Anzeige“ sowie der Partnerschafts-Schalter standen schon an.
    - Neu dazu: Hinweis mit Knopf „Angebote neu bestätigen“, wenn eigene offene Angebote unter einem älteren Briefing gemacht wurden.

## D. Geschäftsdaten und Vertrag

16. **Adresse aus der USt-IdNr. vorbefüllen** ✓: Knopf „Name und Adresse aus der USt-IdNr. übernehmen“ fragt VIES und füllt Name,
    Adresse und Land (nichts wird gespeichert). Deutschland gibt bei VIES oft keine Adresse heraus: dann sagt das Formular es.
    *Nicht geprüft:* gegen den echten VIES-Dienst (hier nicht erreichbar), nur die Auswertung der Antwort ist getestet.
17. **Geschäftsdaten schon im Onboarding erfragen** teils: der rechtliche Name startet mit dem Namen des Kontos; ein Schritt im
    Onboarding selbst ist nicht gebaut.

## E. Creator: Entwurf und Post

18. **Link einfügen, Format wird erkannt** teils ✓: ein eingefügter Link wählt das Format (unter den gebuchten) und sagt „Erkannt:“;
    passt er zu keinem, steht ein Hinweis. *Offen:* Caption bei TikTok und YouTube automatisch aus oEmbed und API holen (braucht
    die Schlüssel `YOUTUBE_API_KEY` / `META_OEMBED_TOKEN` und einen Test mit echten Links).
19. **Checkliste statt Freitext-Hinweisen** ✓: Haken für Kennzeichnung vorn, Pflicht-Hashtags, Pflicht-Erwähnungen, Kennzeichnung im
    Inhalt und Partnerschafts-Label, mit Kopieren-Knopf für Hashtags und Erwähnungen und „Caption-Vorlage einfügen“; im Entwurf und
    im Post-Formular.
20. **Beleg-Upload** ✓: großer Knopf „Screenshot wählen“, Vorschau, Entfernen.
21. **Entwurf als Datei** offen (L): braucht eine Entscheidung für den Speicher (Anbieter, Kosten, Löschfristen).

## F. Benachrichtigungen

22. **Erinnerungen mit Direktlink zum Formular** ✓ (Backend, 9.10.): Hinweise führen zu `#contract`, `#escrow`, `#drafts`, `#posts`,
    `#usage`, `#dispute`. Abschnitte, die zugeklappt sind, öffnen sich beim Anspringen (`ScrollToHash`).
23. **Stündlicher Cron** offen (S, braucht Vercel Pro): Haltefrist und Erinnerungen werden sonst bis zu einen Tag später ausgewertet.

## G. Listen und Sprache

24. **Deals-Liste mit Filtern** ✓: Chips „Alle · Wartet auf mich · Aktiv · Abgeschlossen“ mit Zahlen (`?filter=`); ab 6 Deals sind
    die Deals einer Marke nach Kampagne gruppiert (Überschrift nur, wo eine Kampagne mehrere Deals hat).
25. **Karte auf der Startseite** ✓: „3 Deals warten auf dich“ mit Direktlink, bei Marke und Creator.
26. **Weniger Fachwörter im Hauptfluss** ✓ (auf den Deal-Seiten und in den Hinweisen): „Treuhandkonto“ / „Escrow“ heißt
    „sicher hinterlegt“ bzw. „held safely“, der Abschnitt „Zahlung“. Steuerzeilen liegen unter „Alle Bedingungen“. *Offen:* die
    alte Zahlungsseite und die Admin-Bereiche sagen noch „Treuhand“; der Vertragstext (`contract.ts`) bleibt wegen der
    rechtlichen Prüfung unverändert.

## Offen aus der Prüfung

- Admin-Bereich mobil, Dunkelmodus, Tablet und echtes Gerät wurden nicht geprüft (nur Playwright-Emulation, 390 px, Chromium).
- Die feste Speichern-Leiste und das ⋯-Menü sind nur in Chromium getestet, nicht in Safari/iOS (Tastatur, Safe-Area).
- Auf dem Handy gab es keinen horizontalen Überlauf (gemessen auf Deals-Liste, Deal-Seite in allen 13 Zuständen, Briefing,
  Geschäftsdaten, Entwurf- und Post-Formular).
- Die neuen Texte (Checkliste, Vorlagen, Filter, Hinweise) gibt es auf Deutsch und Englisch; `nav.account` in allen acht Sprachen.

## Durchgang vom 9.10. (alle gebaut, Handy 390 px und 375 px, Desktop 1280 px)

- **Feed:** Die Karte „N Deals warten auf dich“ ist aus dem Creator-Feed raus (das Badge am Deals-Tab zeigt die Zahl; auf der
  Marken-Startseite bleibt sie). Auf dem Handy läuft die Swipe-Karte von knapp unter der Kopfzeile bis knapp über die Tab-Leiste
  (die Höhe, die in `<main>` übrig ist: `.feed-fill` in `globals.css`, mindestens 22 rem). Die Aktionsreihe (✕ ☆ ♥ ↺) liegt als
  Glas-Knöpfe auf der Karte, wie bei Dating-Apps; der Text der Karte lässt dafür `--card-actions` frei (`RequestCardFace`),
  „N Anfragen übrig“ steht als kleine Pille oben rechts. Ab md bleibt alles wie vorher.
- **Kopfzeile Feed:** Gitter statt absolut zentriertem Umschalter; auf schmalen Handys schiebt er sich nach links, statt unter das
  Herz zu laufen.
- **Vertrag:** Posting-Fenster als „20. Okt. 2026 – 20. Nov. 2026“ bzw. „bis 7. Nov. 2026“ (`formatDealDay`), auch im PDF.
- **Deals-Liste:** Status unter den Namen, Titel bis zu zwei Zeilen.
- **Matches:** Bei Deal-Collabs steht der Deal-Status statt „Im Treuhandkonto“ und „Deal öffnen“ ist der Hauptknopf.
- **404:** in der Sprache des Kontos (acht Sprachen).
- **Marken-Startseite:** ruhige Kacheln ohne Hinweiszeile auf dem Handy, Interessenten-Zahl in eigener Zeile.
- **Termine:** Datum und Uhrzeit getrennt, mit Schnellwahl („Morgen“, „In 3 Tagen“, „Jetzt“, „Gestern“).
- **Admin mobil:** Reiterleisten zentrieren die aktuelle Seite und blenden den Rand aus, hinter dem noch mehr liegt; die vier
  Zahlen stehen zu zweit nebeneinander.
- *Nicht angefasst:* Installations-Hinweis (steht weiter auf jeder Seite oben), Kontrast der grauen Hilfstexte, Touch-Flächen im
  Feed (40 px), Smoke-Tests in der CI, Doppelung von Deals-Karte und Kachel „Offene Zahlungen“ auf der Marken-Startseite.
- **Untere Leiste (Handy):** eine lange, runde Pille, die über dem unteren Rand schwebt (`--pill-bottom`, `--tabbar-space` in
  `globals.css`), mit Schatten und Glas; der aktuelle Eintrag liegt auf einer eigenen Pille. Fünf Einträge: Start, **Entdecken
  (Lupe)**, Nachrichten, Deals, Konto (ohne Deals: Zahlungen und Einstellungen). Die Lupe oben in der Kopfzeile entfällt dafür.
  Seitenränder, Speichern-Leiste im Briefing und Toasts richten sich nach `--tabbar-space`.
- **Haptik:** bei jedem Tipp auf einen Link, der auf eine andere Seite der App führt, ein kurzer Tick (`haptic()`, Android:
  `vibrate`, iOS 18: Schalter-Trick). Nur auf einem echten iPhone prüfbar.
- **Onboarding, E-Mail-Haken:** der Haken ist die Einwilligung (`marketingConsentFromCheckbox`), es geht keine Mail zum Bestätigen
  mehr raus. In den Einstellungen bleibt der Weg über den Link. Datenschutztext angepasst, `LEGAL_VERSION` 2026-10-09.1.
