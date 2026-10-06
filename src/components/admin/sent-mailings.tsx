"use client";

import { useState } from "react";
import type { OutreachSide } from "@prisma/client";
import { LocalDate } from "@/components/local-date";

type Recipient = {
  id: string;
  name: string;
  email: string;
};

export type SentMailing = {
  id: string;
  side: OutreachSide;
  subject: string;
  createdAt: number;
  recipients: Recipient[];
};

function SentMailing({ mailing }: { mailing: SentMailing }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="rounded bg-fog">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="w-full px-3 py-2.5 text-left"
      >
        <span className="block text-sm font-medium">{mailing.subject}</span>
        <span className="mt-0.5 block text-footnote text-neutral-500">
          {mailing.side === "CREATOR" ? "Creators" : "Brands"}
          {" · "}
          <LocalDate ms={mailing.createdAt} withTime />
          {` · Sent ${mailing.recipients.length}`}
          {open ? " · Hide" : " · Show"}
        </span>
      </button>
      {open && (
        <ul>
          {mailing.recipients.map((recipient) => (
            <li
              key={recipient.id}
              className="flex items-center justify-between gap-3 border-t border-ink/10 px-3 py-2.5"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{recipient.name}</span>
                <span className="block truncate text-footnote text-neutral-500">{recipient.email}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

// The mails that went out in the last 90 days (older records are deleted), each with the people who got it.
// An address that is removed or asks to stop takes its records with it. The people stay folded until you
// open that mail.
export function SentMailings({ mailings }: { mailings: SentMailing[] }) {
  return (
    <section className="flex flex-col gap-4 rounded border border-ink/10 p-4">
      <div>
        <h2 className="font-display text-title-3 font-bold">
          Sent <span className="tabular-nums text-neutral-500">{mailings.length}</span>
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Every mail that went out in the last 90 days, and who received it.
        </p>
      </div>

      {mailings.length === 0 ? (
        <p className="text-sm text-neutral-500">Nothing sent yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {mailings.map((mailing) => (
            <SentMailing key={mailing.id} mailing={mailing} />
          ))}
        </div>
      )}
    </section>
  );
}
