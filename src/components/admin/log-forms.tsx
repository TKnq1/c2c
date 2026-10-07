"use client";

import { useState, useTransition } from "react";
import { FiTrash2 } from "react-icons/fi";
import { addDecisionAction, deleteDecisionAction } from "@/lib/actions/admin-log";
import { toast } from "@/lib/toast";

const field = "rounded border border-ink/15 bg-paper px-3 py-1.5 text-sm outline-none focus:border-ink";

export function DecisionForm() {
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [decision, setDecision] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await addDecisionAction({ decidedOn: day, title, decision, reason: reason || null });
          if (result.error) toast.error(result.error);
          else {
            toast.success("Entscheidung eingetragen");
            setTitle("");
            setDecision("");
            setReason("");
          }
        });
      }}
      className="flex flex-col gap-2"
    >
      <div className="flex flex-wrap gap-2">
        <input type="date" value={day} onChange={(e) => setDay(e.target.value)} aria-label="Datum" className={field} />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel, z. B. Provision auf 8 % gesenkt" aria-label="Titel" maxLength={120} className={`${field} min-w-0 flex-1`} />
      </div>
      <textarea value={decision} onChange={(e) => setDecision(e.target.value)} placeholder="Was wurde entschieden?" aria-label="Entscheidung" rows={2} maxLength={1000} className={field} />
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Warum? (optional)" aria-label="Begründung" rows={2} maxLength={1000} className={field} />
      <div>
        <button type="submit" disabled={pending || title.trim().length < 3 || decision.trim().length < 3} className="rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-paper transition disabled:opacity-40">
          Eintragen
        </button>
      </div>
    </form>
  );
}

export function DeleteDecisionButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`${title} löschen`}
      onClick={() => {
        if (!window.confirm(`„${title}“ aus dem Log löschen?`)) return;
        startTransition(async () => void (await deleteDecisionAction(id)));
      }}
      className="rounded p-1.5 text-graphite transition hover:bg-fog hover:text-ink disabled:opacity-50"
    >
      <FiTrash2 className="h-4 w-4" aria-hidden />
    </button>
  );
}
