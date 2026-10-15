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
4. **Alte Zahlungsseite für Deals abbauen** ✓ (15.10.): Wo die Deals-Seiten offen sind, stehen offene Angebote und (bei der Marke)
   Interessenten in der Deals-Liste (`OfferCards`, `InterestedCards`, Abschnitte `#offers` und `#interested`; Angebote zählen in den
   Filtern mit, Interessenten nur unter „Alle“). „Zahlungen“ ist dann die Geld-Übersicht: Summen, Pro-Leiste, Auszahlungskonto,
   Verlauf mit CSV/Drucken, Kautionen, dazu Freigabe und Bezahlen nur noch für Collabs ohne Deal; eine Zeile führt zu den
   Angeboten unter Deals. Ohne Deals bleibt die Seite wie vorher. Badges: Reiter „Deals“ zählt Deals und Angebote, „Zahlungen“
   den Rest; Deal-Collabs zählen nicht mehr doppelt (vorher kamen bezahlte oder offene Deal-Zahlungen zusätzlich in den
   Zahlungs-Zähler). Hinweise zu neuen Angeboten führen zu `/dashboard/deals#offers`.

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
13. **Drei Schritte statt sechs Abschnitte** ✓: Inhalt → Regeln → Rechte. Exklusivität und Nutzungsrechte sind
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
    „sicher hinterlegt“ bzw. „held safely“, der Abschnitt „Zahlung“. Steuerzeilen liegen unter „Alle Bedingungen“. Die alte
    Zahlungsseite, ihre Hinweise und der CSV-Export sagen seit 15.10. auch „sicher hinterlegt“ (in den anderen Sprachen das Wort
    der Startseite: retenido, retenu, trattenuto, vastgehouden, wstrzymane, retido). *Offen:* Admin-Bereiche; der Vertragstext
    (`contract.ts`) bleibt wegen der rechtlichen Prüfung unverändert.

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
- *Nicht angefasst:* Smoke-Tests in der CI. (Installations-Hinweis, Kontrast, Touch-Flächen und die Doppelung auf der
  Marken-Startseite: siehe Durchgang vom 15.10.)
- **Untere Leiste (Handy):** eine lange, runde Pille, die über dem unteren Rand schwebt (`--pill-bottom`, `--tabbar-space` in
  `globals.css`), mit Schatten und Glas; der aktuelle Eintrag liegt auf einer eigenen Pille. Fünf Einträge: Start, **Entdecken
  (Lupe)**, Nachrichten, Deals, Konto (ohne Deals: Zahlungen und Einstellungen). Die Lupe oben in der Kopfzeile entfällt dafür.
  Seitenränder, Speichern-Leiste im Briefing und Toasts richten sich nach `--tabbar-space`.
- **Haptik:** bei jedem Tipp auf einen Link, der auf eine andere Seite der App führt, ein kurzer Tick (`haptic()`, Android:
  `vibrate`, iOS 18: Schalter-Trick). Nur auf einem echten iPhone prüfbar.
- **Onboarding, E-Mail-Haken:** der Haken ist die Einwilligung (`marketingConsentFromCheckbox`), es geht keine Mail zum Bestätigen
  mehr raus. In den Einstellungen bleibt der Weg über den Link. Datenschutztext angepasst, `LEGAL_VERSION` 2026-10-09.1.
- **Briefing (9.10., abends):** Formate als Plattform-Buttons mit Icon, darunter klappen Reel, Post, Story usw. auf (`FormatPicker`);
  Vorschau „So sieht der Creator dein Briefing“;
  „Beispiel einfügen“ bei Kernbotschaft und „Bitte vermeiden“; Frist-Schnellwahl (2 Wochen, 30 Tage, Monatsende); Hashtags und
  Erwähnungen als Chips; Nutzungsrechte als Ja/Nein-Frage; der Balken nennt den ersten Fehler beim Namen. Akzentfarbe: Elektro-Indigo
  `#5B5BF0` (`--accent` in `globals.css`), am 14.10. wieder auf Schwarz/Weiß gestellt (`--accent: var(--ink)`); eine Farbe dort bringt den Akzent überall zurück.

- **Briefing (14.10.):** Vorlagen-Feld ist eine Zeile und geht nur beim Start eines neuen Briefings auf, wenn die Marke schon
  Vorlagen hat; „Für jede neue Anfrage verwenden“ im Abschluss-Bildschirm und im Vorlagen-Dialog als Button (`Check`); ab 1280 px
  steht die Creator-Vorschau als feste Spalte rechts neben dem Formular (Seite `xl:max-w-5xl`); der Fortschrittsring lässt einen
  gerade erledigten Schritt einrasten (`animate-snap`, bei reduzierter Bewegung aus). **Fortschrittszeile auf der Anfrage der
  Marke** (`request-journey.ts`, `RequestJourney`): „Briefing steht, Creator-Antwort offen“ → Angebot → ab dem Deal der „Nächste
  Schritt“ des Deals mit Link („Zum Deal“); Punkt in der Akzentfarbe, wenn die Marke dran ist.
- **Beleg wartet auf die Marke (14.10.):** Ein Post, den der Creator mit einem Screenshot belegt hat, zählt jetzt in der Deals-Liste,
  im Badge am Deals-Tab, im Filter „Wartet auf mich“ und in der Fortschrittszeile als Zug der Marke (`waitingFor` mit
  `proofPending`, `listDealsForUser` und `getDealActionCount` lesen den offenen Beleg). Vorher stand dort „Warten auf das System“.
  Der Header `Permissions-Policy` ohne `bluetooth=()` (Chromium kennt es nicht und warnte bei jeder Seite).

## Durchgang vom 15.10.

- **Zahlungen und Deals:** siehe A4. Die Kachel „Offene Zahlungen“ auf der Marken-Startseite zählt keine Deal-Zahlungen mehr
  (die stehen in der Deals-Karte darüber), „Interessierte Creator“ und „Offene Zahlungen“ führen mit Deals in die Deals-Liste.
- **Ein Stil:** die Zahlungsseiten nehmen die Knöpfe aus `components/deals/ui.tsx`; `PaymentStatusBadge` und `DepositStatusBadge`
  haben dieselbe Form wie `Badge` (Höhe, Abstand), „Angeboten“ in `neutral-500` statt `graphite` (Kontrast).
- **Installations-Hinweis:** nur noch auf den Startseiten (`/dashboard`, `/dashboard/startup`, `/dashboard/creator`) und erst ab
  dem zweiten Besuch (gezählt je Browser-Sitzung); das ✕ hat 44 px Fläche.
- **Kontrast:** `neutral-500` ist ein Token (`--neutral-500` in `globals.css`): hell `#6b6b6b` (4,8:1 auf `--fog`, vorher 4,2:1),
  dunkel `#949494` (4,5:1 auf `--fog`, 5,5:1 auf `--paper`).
- **Touch-Flächen:** Merken und Rückgängig im Feed, Chat-Knopf in den Zahlungs- und Angebotszeilen, Schließen im Seitenpanel,
  Zurück im Chat, die „⋯“-Menüs (Anfrage, Deal-Seite) von 40 auf 44 px.

## Durchgang vom 15.10. (Nachmittag)

- **Sheets:** Alle Sheets und Panels (Dialog, Seitenpanel, ⌘K, Mitteilungen) scrollen nur noch hoch und runter
  (`touch-pan-y`, `overflow-x-hidden`). Solange eins offen ist, steht die Seite dahinter still (`html:has(dialog[open])` in
  `globals.css`).
- **Ein Filter-Look** (`src/components/filters.tsx`): Status-Filter als Pillen (Deals, Anfragen, Matches), auf Seiten mit Suche
  (Entdecken beider Seiten, Chats) Suche + Filter-Knopf, der das Filter-Sheet öffnet; im Sheet dieselben Pillen, unten
  „Zurücksetzen“ und „X zeigen“. Sortieren als eine Zeile mit Pfeil (`SortMenu`). Die alten Ausklapp-Menüs und grauen Reiter sind
  weg.
- **Entdecken:** keine Schnellfilter-Reihe mehr, nur der Filter-Knopf. Der Gemerkt-Stern sitzt auf dem Handy oben in der Navbar,
  ab md neben dem Seitentitel (Marke und Creator).
