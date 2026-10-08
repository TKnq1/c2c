"use client";

import { useState, useTransition } from "react";
import { FiSend } from "react-icons/fi";
import { addDecisionAction } from "@/lib/actions/admin-log";
import { toast } from "@/lib/toast";

// One line to write a decision into the log without leaving "Heute". The text is the title (and the decision), the date is today.
export function DecisionQuickAdd() {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const note = text.trim();
  const ready = note.length >= 3;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        startTransition(async () => {
          const title = note.length > 120 ? `${note.slice(0, 117)}…` : note;
          const result = await addDecisionAction({ decidedOn: new Date().toISOString().slice(0, 10), title, decision: note, reason: null });
          if (result.error) toast.error(result.error);
          else {
            toast.success("Entscheidung eingetragen");
            setText("");
          }
        });
      }}
      className="adm-field flex h-[54px] items-center gap-2 pr-1.5 pl-5"
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Heute entschieden: …"
        aria-label="Entscheidung notieren"
        maxLength={1000}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-graphite"
      />
      <button type="submit" disabled={pending || !ready} aria-label="Eintragen" className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--adm-r-row)] bg-accent text-on-accent transition disabled:opacity-40">
        <FiSend className="h-[18px] w-[18px]" aria-hidden />
      </button>
    </form>
  );
}
