---
name: prepare-before-build
description: >-
  Use before starting any implementation that depends on something the user
  has to provide or set up: API keys, accounts, environment variables in
  Vercel, developer or store accounts, DNS, files, content, budget limits,
  third-party approvals. Before writing code, tell the user in German what to
  prepare, where to get it, where it goes and what still works without it.
metadata:
  short-description: Tell the user what to prepare before building
---

# Vor dem Bauen: Was der Nutzer vorbereiten muss

Bevor du mit dem Bauen beginnst, sagst du dem Nutzer, was er noch besorgen oder einrichten muss. Er soll nie mitten im Bau auf etwas warten, das er hätte vorbereiten können.

## Wann
Immer vor dem ersten Code, wenn die Arbeit von etwas abhängt, das nur der Nutzer liefern kann: API-Keys, Konten bei Anbietern, Umgebungsvariablen in Vercel, Entwickler- oder Store-Zugänge, Domains und DNS, Dateien, Texte, Zahlen (zum Beispiel Fixkosten), Budgetgrenzen, Freigaben Dritter (zum Beispiel App-Prüfung bei Meta).

## Wie
Eine kurze Checkliste auf Deutsch. Pro Punkt:
1. **Was** genau (Name des Dienstes, Name der Variable, zum Beispiel `ANTHROPIC_API_KEY`).
2. **Wo bekommt er es** (Seite und Schritte in einem Satz).
3. **Wo kommt es hin** (Vercel-Projekt, Environment-Variable, in der App unter Einstellungen).
4. **Wann gebraucht** („vor dem Start“, „vor Paket 3“, „kann später“).
5. **Was geht ohne**: welche Funktion bleibt aus, was läuft trotzdem.

Trenne **blockierend** (ohne geht der Teil nicht) von **kann später**. Nenne Vorlaufzeiten (Prüfungen, Freigaben, Verifizierungen dauern oft Tage) und laufende Kosten, damit er früh anfangen kann.

## Regeln
- Prüfe zuerst im Repo (`.env.example`, Doku, vorhandene Konfiguration), was schon existiert, und frage nicht nach Bekanntem.
- **Geheimnisse nie im Chat.** Der Nutzer trägt Keys selbst in Vercel oder in die lokale Umgebung ein. Sage das dazu. Neue Variablen kommen in `.env.example` (ohne Wert).
- Beginne mit allem, das nichts davon braucht, und sage das ausdrücklich („Das kann ich sofort bauen“).
- Wenn nichts vorzubereiten ist, schreibe in einer Zeile „Nichts vorzubereiten“ und lege los.
- Die Liste kommt vor dem Bauen. Wenn während der Arbeit etwas Neues auftaucht, melde es sofort und bündle es in einer Liste.
