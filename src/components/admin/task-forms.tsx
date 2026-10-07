"use client";

import { useState, useTransition } from "react";
import { addTaskAction, reopenTaskAction } from "@/lib/actions/admin-dashboard";
import { toast } from "@/lib/toast";

// A task of your own: a title and how urgent it is.
export function NewTaskForm() {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await addTaskAction({ title, priority });
      if (result.error) toast.error(result.error);
      else setTitle("");
    });
  };

  return (
    <form id="neu" onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={140}
        placeholder="Neue Aufgabe, zum Beispiel „Steuerberater anrufen“"
        aria-label="Titel der neuen Aufgabe"
        className="min-w-0 flex-1 rounded border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as typeof priority)}
        aria-label="Wie dringend"
        className="rounded border border-ink/15 bg-paper px-3 py-2 text-sm"
      >
        <option value="HIGH">Hoch</option>
        <option value="MEDIUM">Mittel</option>
        <option value="LOW">Niedrig</option>
      </select>
      <button
        type="submit"
        disabled={pending || title.trim().length < 3}
        className="rounded-full bg-ink px-5 py-2 text-sm font-bold text-paper transition disabled:opacity-40"
      >
        Hinzufügen
      </button>
    </form>
  );
}

export function ReopenButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => void (await reopenTaskAction(id)))}
      className="shrink-0 text-xs underline disabled:opacity-50"
    >
      Wieder öffnen
    </button>
  );
}
