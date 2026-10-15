# Plan: Statistik-Paket für Marken (89,99 € im Monat)

Stand 15.10.2026. Noch nichts gebaut; dieser Plan ist die Grundlage für die Entscheidung.

## Ziel

Marken sehen für jedes Video, das sie über comtor gebucht haben, wie es läuft: Aufrufe, Interaktionen, Reichweite und was es pro
Aufruf gekostet hat. Dazu eine Übersicht je Kampagne (Anfrage) und einen Bericht zum Herunterladen.

## Was technisch geht

Kurz: **Ja, aber nicht ohne den Creator.** Instagram und TikTok geben Statistiken nur heraus, wenn der Creator sein Konto mit
comtor verbindet (Anmeldung über die Plattform, „Zugriff erlauben“). Ohne das gibt es nur bei YouTube öffentliche Zahlen.
Abschreiben von Webseiten (Scraping) verbieten alle drei Plattformen.

| Plattform | Ohne Verbindung | Mit Verbindung des Creators | Was wir dafür brauchen |
|---|---|---|---|
| YouTube | Aufrufe, Likes, Kommentare (öffentlich, API-Schlüssel, ist schon eingebaut) | dazu Wiedergabezeit, Zuschauerbindung, Herkunft, Alter/Land der Zuschauer | Google Cloud OAuth-Freigabe für `yt-analytics.readonly` (Prüfung durch Google, Wochen) |
| Instagram | nichts (oEmbed zeigt keine Zahlen) | Aufrufe, Reichweite, Likes, Kommentare, Speicherungen, Shares, bei Reels Wiedergabezeit | Meta-App mit App Review und Unternehmensverifizierung; nur Profi-Konten (Creator/Business) |
| TikTok | nichts Verlässliches | Aufrufe, Likes, Kommentare, Shares (Display API); Wiedergabezeit und Abschlussrate über die Business-API | TikTok-Entwickler-App mit Prüfung (Audit); Business-API nur für Creator-/Business-Konten |

Einschränkungen, die man kennen muss:

- **Stories** (Instagram): Zahlen gibt es nur 24 Stunden lang. Wir müssen sie innerhalb dieser Zeit holen (Webhook von Meta oder
  stündlicher Job, der braucht Vercel Pro).
- Zahlen kommen **mit Verzögerung** (Instagram bis 48 Stunden). „Live“ ist es nie.
- **Zielgruppe** (Alter, Land, Geschlecht) gibt Instagram nur für das ganze Konto, nicht pro Post; YouTube auch pro Video.
- Laut Metas Changelog vom April 2026 gibt es neue Felder für Speicherungen und Shares und Zugriff für **Kollaborateure** eines
  Collab-Posts. Wenn die Marke als Collab-Partner im Post steht, könnte sie Zahlen über ihr eigenes Konto bekommen. Das muss vor dem
  Bau an der aktuellen Doku geprüft werden; ich konnte die Seite hier nicht abrufen.
- Ein Creator kann die Verbindung jederzeit lösen. Dann fallen wir auf die Zahlen zurück, die er selbst einträgt.

## Was das Paket enthält (Vorschlag)

- Alles aus Pro (3 % Gebühr statt 10 %).
- Pro Post: Aufrufe, Likes, Kommentare, Shares, Speicherungen, Reichweite, Wiedergabezeit, soweit die Plattform sie liefert.
  Verlauf an Tag 1, 3, 7, 14 und 30 nach Veröffentlichung.
- Kennzahlen: Kosten pro 1.000 Aufrufe, Kosten pro Interaktion, Interaktionsrate.
- Kampagnen-Übersicht: alle Deals einer Anfrage zusammen, Creator im Vergleich (wer hat pro Euro am meisten gebracht).
- Bericht als PDF und CSV.
- Jede Zahl mit ihrer Quelle („von Instagram“, „vom Creator eingetragen, mit Screenshot“).

## In drei Stufen

**Stufe 1: ohne Freigaben der Plattformen, sofort baubar**

- Tarif in Stripe und in der App (`plan` statt nur `isPro`, siehe Datenmodell).
- YouTube: öffentliche Zahlen holen wir schon (`src/lib/social/oembed.ts`, `DealPostMetric`); dazu der Abrufplan Tag 1–30.
- Instagram und TikTok: Der Creator trägt die Zahlen aus seinen Insights an Tag 7 und Tag 30 ein und lädt einen Screenshot hoch
  (als `DealProof`, Art „Statistik“). Das wird ein Schritt im Deal mit Erinnerung, vertraglich über das Briefing („Statistiken nach
  7 und 30 Tagen teilen“, nur bei Marken mit dem Paket). Die Marke kann eine Zahl anzweifeln.
- Statistik-Seite für die Marke und Bericht.

**Stufe 2: Instagram automatisch**

- Creator verbindet sein Instagram-Profi-Konto (Einstellungen → „Konten verbinden“), Token verschlüsselt gespeichert.
- Täglicher Abruf der Post-Zahlen; Stories über Webhook oder stündlich.

**Stufe 3: TikTok und YouTube im Detail**

- TikTok über Display API (Zahlen) bzw. Business-API (Wiedergabezeit), YouTube Analytics (Bindung, Zuschauer).

## Datenmodell

- `StartupProfile.plan`: `FREE | PRO | INSIGHTS` (Name offen); `isPro` bleibt als „hat die niedrige Gebühr“ und gilt für PRO und
  INSIGHTS. Stripe-Preis je Tarif (`STRIPE_PRO_BRAND_PRICE_ID`, neu `STRIPE_INSIGHTS_PRICE_ID`); der Webhook setzt den Tarif aus dem
  Preis des Abos.
- `SocialConnection`: Creator, Plattform, Konto-ID, Token verschlüsselt (wie die TOTP-Geheimnisse), Berechtigungen, Ablauf,
  gelöst am.
- `DealPostMetric` erweitern: `reach`, `saves`, `watchTimeSeconds`, `avgWatchSeconds`, `completionRate`, Quelle
  (`API | CREATOR | SCREENSHOT`), bestätigt von der Marke ja/nein.
- Abrufplan pro Post: welche Tage schon geholt sind (wie `remindersSent` beim Deal).

## Recht

- Der Creator muss zustimmen, dass seine Zahlen an die Marke gehen: im Vertrag (Briefing) und bei der Verbindung des Kontos.
- Datenschutzerklärung: neue Quellen (Meta, TikTok, Google), welche Daten, wie lange gespeichert (Vorschlag: Ende des Deals plus
  Aufbewahrungsfrist wie bei den Belegen).
- AGB: neuer Tarif und neuer Pro-Preis; `LEGAL_VERSION` hochsetzen.
- Bestehende Pro-Abos: Ein höherer Preis gilt nicht automatisch. Entweder behalten sie ihren Preis, oder sie bekommen eine
  Ankündigung mit Kündigungsmöglichkeit vor der Umstellung.

## Was du vorbereiten musst

Blockierend:

1. **Neue Pro-Preise in Stripe** (seit 15.10. gebaut): Stripe Dashboard → Produkte → Pro → „Preis hinzufügen“, zweimal:
   29,99 € und 8,99 € monatlich, wiederkehrend, „inklusive Steuern“. Die IDs (`price_…`) kommen in Vercel als
   `STRIPE_PRO_BRAND_PRICE_ID` und `STRIPE_PRO_CREATOR_PRICE_ID` (Production und Preview), dann neu deployen. Ohne sie lässt sich
   Pro nicht buchen (der Checkout prüft, dass der Stripe-Preis zum angezeigten passt); laufende Abos laufen weiter.
2. **Preis für das Statistik-Paket** (vor Stufe 1): gleiches Produkt oder neues Produkt „comtor Insights“, 89,99 € monatlich,
   ID in Vercel als `STRIPE_INSIGHTS_PRICE_ID`.

Kann später (lange Vorlaufzeit, also früh anfangen):

3. **Meta** (vor Stufe 2): Entwickler-App auf developers.facebook.com, Produkt „Instagram“ (Instagram Login), Unternehmen
   verifizieren, App Review für `instagram_business_basic` und `instagram_business_manage_insights` mit Screencast und
   Datenschutz-URL. Erfahrungsgemäß 1–4 Wochen. Schlüssel kommen als `META_APP_ID` und `META_APP_SECRET` in Vercel.
4. **TikTok** (vor Stufe 3): App auf developers.tiktok.com, Login Kit mit `video.list`, App-Audit. Tage bis Wochen.
   `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` in Vercel.
5. **Google** (vor Stufe 3): OAuth-Zustimmungsbildschirm im Google-Cloud-Projekt mit `yt-analytics.readonly`, Verifizierung
   durch Google. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` in Vercel.
6. **Vercel Pro** (optional, ca. 20 $ im Monat) für stündliche Jobs (Instagram-Stories), sonst nur per Webhook.

Die Plattform-APIs selbst kosten nichts, sie haben nur Abruflimits. Schlüssel nie in den Chat, nur in Vercel eintragen.
