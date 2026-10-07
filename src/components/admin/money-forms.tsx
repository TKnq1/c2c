"use client";

import { useState, useTransition } from "react";
import { FiTrash2 } from "react-icons/fi";
import { addFixedCostAction, deleteFixedCostAction, setCashBalanceAction, setFixedCostActiveAction } from "@/lib/actions/admin-money";
import { Switch } from "@/components/switch";
import { parseEuroInput } from "@/lib/euro-input";
import { toast } from "@/lib/toast";

const field = "rounded border border-ink/15 bg-paper px-3 py-1.5 text-sm outline-none focus:border-ink";


export function CashBalanceForm({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await setCashBalanceAction({ balance: parseEuroInput(value) });
          if (result.error) toast.error(result.error);
          else toast.success("Kontostand gespeichert");
        });
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <label className="flex items-center gap-2 text-sm">
        <span className="font-bold">Kontostand heute</span>
        <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" placeholder="z. B. 5.600" aria-label="Kontostand in Euro" className={`${field} w-32`} />
        <span className="text-neutral-500">€</span>
      </label>
      <button type="submit" disabled={pending || value.trim() === ""} className="rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-paper transition disabled:opacity-40">
        Speichern
      </button>
    </form>
  );
}

export function FixedCostForm() {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [interval, setIntervalValue] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await addFixedCostAction({ name, amount: parseEuroInput(amount), interval, note: note || null });
          if (result.error) toast.error(result.error);
          else {
            setName("");
            setAmount("");
            setNote("");
          }
        });
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Posten, z. B. Vercel" aria-label="Name des Postens" maxLength={60} className={`${field} w-44`} />
      <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="Betrag €" aria-label="Betrag in Euro" className={`${field} w-28`} />
      <select value={interval} onChange={(e) => setIntervalValue(e.target.value as typeof interval)} aria-label="Rhythmus" className={field}>
        <option value="MONTHLY">pro Monat</option>
        <option value="YEARLY">pro Jahr</option>
      </select>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notiz (optional)" aria-label="Notiz" maxLength={120} className={`${field} min-w-0 flex-1`} />
      <button type="submit" disabled={pending || name.trim().length < 2 || amount.trim() === ""} className="rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-paper transition disabled:opacity-40">
        Hinzufügen
      </button>
    </form>
  );
}

export function FixedCostControls({ id, name, active }: { id: string; name: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <span className="flex items-center justify-end gap-2">
      <Switch checked={active} disabled={pending} onChange={(next) => startTransition(async () => void (await setFixedCostActiveAction(id, next)))} label={`${name} zählt mit`} />
      <button
        type="button"
        disabled={pending}
        aria-label={`${name} löschen`}
        onClick={() => startTransition(async () => void (await deleteFixedCostAction(id)))}
        className="rounded p-1.5 text-graphite transition hover:bg-fog hover:text-ink disabled:opacity-50"
      >
        <FiTrash2 className="h-4 w-4" aria-hidden />
      </button>
    </span>
  );
}
