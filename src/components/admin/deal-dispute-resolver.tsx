"use client";

import { useState } from "react";
import { resolveDealDisputeAction } from "@/lib/actions/deal-admin";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { formatCents } from "@/lib/format";

// The admin's decision on a frozen deal: a reason that is kept with the dispute, then one of three outcomes, each behind the
// password. The reason is read when a button is pressed, so it can be written first.
export function DealDisputeResolver({
  disputeId,
  amountCents,
  payoutCents,
  brandName,
  creatorName,
  canResume,
}: {
  disputeId: string;
  amountCents: number;
  payoutCents: number;
  brandName: string;
  creatorName: string;
  canResume: boolean;
}) {
  const [note, setNote] = useState("");
  const tooShort = note.trim().length < 10;
  return (
    <div className="flex flex-col gap-2 pt-1">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Begründung der Entscheidung</span>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder="Was hast du geprüft, und warum fällt die Entscheidung so aus? Beide Seiten sehen das."
          className="rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <ConfirmActionButton
          action={(password) => resolveDealDisputeAction(disputeId, "RELEASE", note, password)}
          requirePassword
          successMessage="An den Creator ausgezahlt."
          title="An den Creator auszahlen?"
          description={`${creatorName} bekommt ${formatCents(payoutCents)} (nach Plattformgebühr), der Deal ist abgeschlossen und die Rechnungen werden erstellt. Das lässt sich nicht rückgängig machen.`}
          confirmLabel="Auszahlen"
          pendingLabel="Zahle aus…"
          className={`rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-graphite ${tooShort ? "pointer-events-none opacity-40" : ""}`}
        >
          An Creator auszahlen
        </ConfirmActionButton>
        <ConfirmActionButton
          action={(password) => resolveDealDisputeAction(disputeId, "REFUND", note, password)}
          requirePassword
          successMessage="An die Marke erstattet."
          title="An die Marke erstatten?"
          description={`${brandName} bekommt die vollen ${formatCents(amountCents)} (inkl. Umsatzsteuer) zurück, ${creatorName} wird nicht bezahlt und der Deal wird abgebrochen. Das lässt sich nicht rückgängig machen.`}
          confirmLabel="Erstatten"
          pendingLabel="Erstatte…"
          className={`rounded-full border border-ink px-4 py-2 text-sm font-medium transition hover:bg-fog ${tooShort ? "pointer-events-none opacity-40" : ""}`}
        >
          An Marke erstatten
        </ConfirmActionButton>
        {canResume && (
          <ConfirmActionButton
            action={(password) => resolveDealDisputeAction(disputeId, "RESUME", note, password)}
            requirePassword
            successMessage="Der Deal läuft weiter."
            title="Deal fortsetzen?"
            description="Der Streitfall war ein Missverständnis: Der Deal geht dort weiter, wo er eingefroren wurde, und das Geld bleibt im Treuhandkonto."
            confirmLabel="Fortsetzen"
            pendingLabel="Setze fort…"
            className={`text-sm text-neutral-600 underline transition hover:text-ink dark:text-neutral-400 ${tooShort ? "pointer-events-none opacity-40" : ""}`}
          >
            Deal fortsetzen
          </ConfirmActionButton>
        )}
      </div>
      {tooShort && <p className="text-xs text-neutral-500 dark:text-neutral-400">Schreibe zuerst eine Begründung (mindestens 10 Zeichen).</p>}
    </div>
  );
}
