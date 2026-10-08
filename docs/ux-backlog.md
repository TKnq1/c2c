# UX-Backlog: Brand Deals (Stand 8.10.2026)

Ideen, um den Deal-Ablauf auf dem Handy leichter zu machen. Noch nichts davon gebaut, außer dem eingeklappten Vertrag
und dem umbrechenden Titel auf der Deal-Seite. Aufwand: S = unter 1 Std., M = ein paar Stunden, L = ein Tag oder mehr.
Reihenfolge innerhalb einer Gruppe = meine Empfehlung.

## A. Navigation (Handy-Tab-Leiste hat heute 6 Einträge)

1. **Tab-Leiste auf 4 Einträge** (M)
   - Creator: Feed · Nachrichten · Deals · Konto
   - Marke: Anfragen · Nachrichten · Deals · Konto
   - Zahlungen wandern als Reiter in „Deals“ (Aktiv | Zahlungen | Rechnungen), Einstellungen unter „Konto“.
   - Die Glocke bleibt oben im Kopf, dort ist sie schon.
2. **Entdecken in den Feed holen** (M, vorher prüfen, was Entdecken heute kann): Lupe im Kopf des Feeds statt eigener Tab.
3. **Ein Badge statt drei** (S): Deals zeigt nur „du bist dran“, Nachrichten nur Ungelesenes. Kein Badge auf Zahlungen mehr.
4. **Alte Zahlungsseite für Deals abbauen** (L): Für Deal-Collabs ist „Deals“ der einzige Ort für den Geldstatus.

## B. Deal-Seite

5. **Hauptaktion als Button in der Karte „Nächster Schritt“** (S–M): „Entwurf einreichen“, „Entwurf freigeben“, „Post melden“
   springt zum Formular oder öffnet es als Sheet. Heute muss man das Formular suchen.
6. **Abschnitte nach Phase sortieren** (M): Der fällige Abschnitt steht direkt unter der Karte, erledigte klappen zu einer
   Zeile zusammen („Escrow: 238 € hinterlegt ✓“, „Entwurf freigegeben ✓“).
7. **Stepper kompakt** (S): Auf dem Handy „Schritt 4 von 9: Entwurf“ mit Fortschrittsbalken statt scrollender Chips.
8. **Verlauf und Randaktionen einklappen** (S): „Verlauf“ zugeklappt, „Problem melden“ und „Deal abbrechen“ in ein „⋯“-Menü.
9. **Vertrag als Kurzfassung** (M): 5 Kernpunkte oben (Preis, Post bis, Formate, Kennzeichnung, Nutzungsrechte), „Alle
   Bedingungen“ darunter.
10. **Posts vor Entwürfen, sobald der Entwurf freigegeben ist** (S).

## C. Briefing-Builder (Marke)

11. **Feste Speichern-Leiste unten mit Fehlerzahl** (M): „2 Fehler“ springt zum ersten Fehler. Heute stehen Fehlerliste und
    Button am Ende einer dreibildschirmlangen Seite.
12. **Vorlagen** (M): „Reel + Story“, „Nur TikTok“, „UGC ohne Posting“ füllen das Briefing vor.
    *Backend steht (Stand 9.10.):* Vorlagen speichern, umbenennen, löschen, als Standard setzen, auf mehrere Anfragen anwenden,
    unvollständige Entwürfe. Es fehlt nur die Oberfläche.
13. **Drei Schritte statt sechs Abschnitte** (M): Inhalt → Kennzeichnung und Fristen → Rechte. Exklusivität und Nutzungsrechte
    standardmäßig zu („Brauche ich nicht“).
14. **Briefing aus früherer Anfrage kopieren und Standardwerte merken** (M).
    *Backend steht:* Kopie aus einer Anfrage, Standardvorlage für neue Anfragen, Anfrage duplizieren kopiert das Briefing.
15. **Bessere Vorbelegung** (S): Markt aus dem Land der Marke, Kennzeichnung „Werbung“ und Paid-Partnership-Schalter schon an.

## D. Geschäftsdaten und Vertrag

16. **Adresse aus der USt-IdNr. vorbefüllen** (M): VIES liefert Name und Adresse.
17. **Geschäftsdaten schon im Onboarding erfragen** (M) oder aus dem Profil vorbefüllen (Name, Land), damit der erste Deal
    nicht an einem langen Formular hängt.

## E. Creator: Entwurf und Post

18. **Link einfügen, Format wird erkannt** (M): TikTok, Reel, Story, YouTube aus der URL; Caption bei TikTok und YouTube
    automatisch aus oEmbed und API holen statt einfügen lassen.
19. **Checkliste statt Freitext-Hinweisen** (S–M): Haken für „Werbung“ am Anfang, Pflicht-Hashtags, Erwähnungen, mit
    Kopieren-Knopf für Hashtags und Caption-Vorlage.
20. **Beleg-Upload** (S): Großer Knopf „Screenshot wählen“ mit Vorschau statt des nativen „Choose File“.
21. **Entwurf als Datei** (L): Heute nur Link (Drive, Frame.io); Direkt-Upload wäre einfacher.

## F. Benachrichtigungen

22. **Erinnerungen mit Direktlink zum Formular** (S–M): Push oder Mail „Entwurf fällig in 24 Std.“ öffnet den Abschnitt
    (`#drafts`, `#post`). *Backend steht:* Hinweise führen zu `#contract`, `#escrow`, `#drafts`, `#posts`, `#usage`, `#dispute`;
    Fristen und Abbrüche gehen zusätzlich per E-Mail raus.
23. **Stündlicher Cron** (S, braucht Vercel Pro): Haltefrist und Erinnerungen werden sonst bis zu einen Tag später ausgewertet.

## G. Listen und Sprache

24. **Deals-Liste mit Filtern** (S): „Wartet auf mich · Aktiv · Abgeschlossen“, bei vielen Deals nach Kampagne gruppiert.
    *Backend steht:* `/dashboard/deals?filter=mine|active|done` filtert; Filterleiste und Gruppierung fehlen noch.
25. **Karte auf der Startseite** (S): „3 Deals warten auf dich“ mit Direktlink.
26. **Weniger Fachwörter im Hauptfluss** (S): „Escrow“ → „sicher hinterlegt“, Steuerzeilen unter „Details“.

## Offen aus der Prüfung

- Admin-Bereich mobil, Dunkelmodus, Tablet und echtes Gerät wurden nicht geprüft (nur Playwright-Emulation, 390 px).
- Auf dem Handy gab es keinen horizontalen Überlauf (gemessen auf Deals-Liste, Deal-Seite, Briefing, Geschäftsdaten,
  Entwurf- und Post-Formular).

## Vorschlag für morgen

Erst **1 + 3** (Navigation), dann **5 + 6 + 7 + 8** (Deal-Seite), dann **11 + 15** (Briefing). Das sind etwa ein Tag Arbeit
und trifft die meisten Handy-Probleme.
