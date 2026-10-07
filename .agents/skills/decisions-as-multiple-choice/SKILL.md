---
name: decisions-as-multiple-choice
description: >-
  Use whenever the user has to decide something: design or layout direction,
  scope, order of work, naming, tools, trade-offs, which features to include.
  Ask it as a multiple-choice question (AskUserQuestion) instead of a prose
  question, in German, with a recommended option first. Applies to every
  decision that is the user's to make, not to things that have a sensible
  default or can be read from the code.
metadata:
  short-description: Ask decisions as multiple choice
---

# Entscheidungen immer als Multiple Choice

Der Nutzer will Entscheidungen per Auswahl treffen, nicht per Freitext. Sobald eine Entscheidung bei ihm liegt, stelle sie als Multiple-Choice-Frage mit dem Werkzeug `AskUserQuestion`.

## Wann
- Look, Layout, Farben, Aufbau, Reihenfolge der Pakete, Umfang (was rein soll und was nicht), Wahl zwischen Werkzeugen oder Anbietern, Abwägungen mit Kosten oder Aufwand.
- Wenn mehrere Dinge gleichzeitig offen sind, bündle sie in einem Aufruf.

## Wann nicht
- Wenn es einen vernünftigen Standard gibt oder sich die Antwort aus dem Code oder aus früheren Entscheidungen ergibt: Standard nehmen und kurz nennen, was du angenommen hast.
- Freigaben für Push, Merge, Löschen oder Geld bleiben ausdrückliche Worte des Nutzers („pushen und mergen“). Dafür keine Multiple-Choice-Frage als Ersatz.

## So fragst du
- **Bis zu 4 Fragen pro Aufruf**, je 2 bis 4 Optionen. Mehr Entscheidungen: die 4 wichtigsten fragen, für den Rest einen Standard setzen und ihn nennen.
- **Kurze Labels** (1 bis 5 Wörter). In der `description` steht, was die Wahl bedeutet (Aufwand, Kosten, Folge).
- **Empfehlung zuerst**, Label endet auf „(Empfohlen)“. Keine eigene „Sonstiges“-Option, die kommt automatisch.
- **`multiSelect: true`**, wenn sich Optionen nicht ausschließen (zum Beispiel „Was soll rein?“).
- **Bei visuellen Entscheidungen zuerst zeigen**: Screenshots oder Entwürfe per `SendUserFile`, danach fragen.
- Fragen und Optionen auf Deutsch, ohne Fachjargon.
- Keine Ja/Nein-Frage, wenn eine Auswahl mit echten Alternativen möglich ist.

## Danach
- Fasse die Antworten in einer kurzen Tabelle zusammen („Entscheidung → Wahl“) und mache weiter. Nicht noch einmal nachfragen.
- Wenn `AskUserQuestion` nicht verfügbar ist: nummerierte Auswahl mit Buchstaben (A, B, C) im Chat, die Empfehlung zuerst.
