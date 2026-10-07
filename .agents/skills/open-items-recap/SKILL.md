---
name: open-items-recap
description: >-
  Use when a session is about to end or may be cut off: the user mentions the
  limit, a context compaction happened, a larger block of work is finished, or
  the user asks what is still open. Prints a short German recap of everything
  that is still open (git, pull requests, tasks, things only the user can do,
  deliberately postponed work) so nothing is lost when the session stops.
metadata:
  short-description: Recap of everything still open before a session ends
---

# Was noch offen ist

Gib dem Nutzer eine knappe, vollständige Übersicht, was noch offen ist, damit nach einem Limit oder Neustart nichts verloren geht. Das Ergebnis steht im Chat, denn nur das überlebt eine abgebrochene Sitzung.

## Wann
- Der Nutzer erwähnt das Limit, „bald Schluss“, „gleich weg“ oder bittet um einen Stand.
- Nach einer Kontext-Zusammenfassung (Compaction) oder wenn der Kontext knapp wird.
- Am Ende eines größeren Arbeitsblocks (gebaut, getestet, gepusht oder gemergt).
- Auf Zuruf: „was ist offen?“

Ich kann das Nutzungslimit des Plans nicht sehen, nur den Kontext. Deshalb nicht auf ein Signal warten: lieber nach jedem größeren Block kurz ausgeben als zu spät.

## Wie sammeln (zuerst nachsehen, nicht aus dem Gedächtnis)
1. **Git:** `git status -sb`, ungepushte Commits (`git log @{u}..`), Stand gegenüber `origin/main`.
2. **Pull Requests:** offene PRs des Repos (GitHub-MCP), Status von CI und Vercel, Merge-Konflikte.
3. **Aufgabenliste:** offene und laufende Aufgaben (TaskList).
4. **Hängt am Nutzer:** Umgebungsvariablen in Vercel, Konten, Dateien, Prüfungen von Texten (zum Beispiel Datenschutz), Neuanlegen der Dock-App, Zahlen, die nur er liefern kann.
5. **Bewusst zurückgestellt:** was gewollt nicht gebaut wurde und warum (zum Beispiel alles mit der Claude-API).
6. **Nach dem Deploy zu prüfen:** Production-Deploy, Migrationen, Cron-Läufe.

## Format (Deutsch, kurz)
```
Stand: <Branch> = <main / n Commits voraus>, PRs: <keine / Liste>, CI: <grün / rot>

Du musst:
- ...

Ich muss noch:
- ...

Bewusst zurückgestellt:
- ... (Grund)

Nächster Schritt: <ein Satz>
```
- Leere Abschnitte weglassen oder „nichts“ schreiben. Wenn alles erledigt ist, in einem Satz sagen: „Nichts offen.“
- Pro Punkt eine Zeile, mit Ort oder Befehl, wo es weitergeht.
- Nur Verifiziertes als erledigt melden. Was ich nicht prüfen konnte (zum Beispiel Vercel-Deploy), steht als „nicht geprüft“.

## Regeln
- Nichts pushen, mergen oder anlegen, nur weil es hier als offen steht. Dafür gilt weiter: nur auf ausdrückliche Anweisung des Nutzers.
- Keine Geheimnisse in den Text.
- Kein Anspruch auf Vollständigkeit über das Repo hinaus: was das Dashboard nicht kennt, steht nur hier, wenn es im Gespräch vorkam.
