"use client";

import { useState } from "react";
import { correctInvoiceAction } from "@/lib/actions/deal-admin";
import { ConfirmActionButton } from "@/components/confirm-action-button";

type Details = { name: string; addressLines: string[]; vatId: string | null; taxNumber: string | null };

const fieldClass = "rounded border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700";

// The correction of an issued document: the other side's details as they stand, a reason, then the password. Nothing is
// edited in place: the document is cancelled and a new one replaces it, both with the next numbers.
export function InvoiceCorrector({ invoiceId, number, partyLabel, details }: { invoiceId: string; number: string; partyLabel: string; details: Details }) {
  const [name, setName] = useState(details.name);
  const [address, setAddress] = useState(details.addressLines.join("\n"));
  const [vatId, setVatId] = useState(details.vatId ?? "");
  const [taxNumber, setTaxNumber] = useState(details.taxNumber ?? "");
  const [reason, setReason] = useState("");
  const tooShort = reason.trim().length < 10;

  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-neutral-600 underline dark:text-neutral-400">Korrigieren</summary>
      <div className="mt-3 flex flex-col gap-3 rounded border border-dashed border-ink p-3">
        <p className="text-footnote text-neutral-500 dark:text-neutral-400">
          Betrifft die Angaben von {partyLabel}. {number} wird storniert und durch einen neuen Beleg ersetzt; beide bekommen die nächsten Nummern. Beträge und
          Steuerart bleiben.
        </p>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Anschrift (eine Zeile pro Zeile, höchstens 4)</span>
          <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className={fieldClass} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-medium">USt-IdNr.</span>
            <input value={vatId} onChange={(e) => setVatId(e.target.value)} maxLength={20} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Steuernummer</span>
            <input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} maxLength={40} className={fieldClass} />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Grund der Korrektur</span>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder="Was war falsch, und woher kommt die richtige Angabe? Das bleibt im Protokoll."
            className={fieldClass}
          />
        </label>
        <div>
          <ConfirmActionButton
            action={(password) => correctInvoiceAction(invoiceId, { reason, name, address, vatId, taxNumber }, password)}
            requirePassword
            successMessage="Beleg korrigiert."
            title="Beleg korrigieren?"
            description={`${number} wird storniert und durch einen neuen Beleg mit den geänderten Angaben ersetzt. Der Empfänger bekommt einen Hinweis. Das lässt sich nicht rückgängig machen.`}
            confirmLabel="Korrigieren"
            pendingLabel="Korrigiere…"
            className={`rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-graphite ${tooShort ? "pointer-events-none opacity-40" : ""}`}
          >
            Stornieren und neu ausstellen
          </ConfirmActionButton>
          {tooShort && <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">Schreibe zuerst den Grund (mindestens 10 Zeichen).</p>}
        </div>
      </div>
    </details>
  );
}
