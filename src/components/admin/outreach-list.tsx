"use client";

import { useState, useTransition } from "react";
import type { OutreachSide } from "@prisma/client";
import { addOutreachAddressAction, removeOutreachAddressAction, sendOutreachAction } from "@/lib/actions/outreach";

type Address = { id: string; name: string; email: string };

export function OutreachList({
  side,
  title,
  blurb,
  addresses,
}: {
  side: OutreachSide;
  title: string;
  blurb: string;
  addresses: Address[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    startTransition(async () => {
      const result = await addOutreachAddressAction(side, name, email);
      if (result.error) setError(result.error);
      else {
        setName("");
        setEmail("");
      }
    });
  };

  const remove = (id: string) => {
    setError(null);
    setStatus(null);
    startTransition(async () => {
      const result = await removeOutreachAddressAction(id);
      if (result.error) setError(result.error);
    });
  };

  const send = () => {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setError(null);
    setStatus(null);
    setConfirm(false);
    startTransition(async () => {
      const result = await sendOutreachAction(side, subject);
      if (result.error) {
        setError(result.error);
        return;
      }
      const failed = result.failed ?? [];
      setStatus(
        failed.length === 0
          ? `Sent to ${result.sent}.`
          : `Sent to ${result.sent}. Not sent: ${failed.map((f) => f.email).join(", ")}.`,
      );
    });
  };

  return (
    <section className="flex flex-col gap-4 rounded border border-ink/10 p-4">
      <div>
        <h2 className="font-display text-title-3 font-bold">
          {title} <span className="tabular-nums text-neutral-500">{addresses.length}</span>
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{blurb}</p>
      </div>

      <form onSubmit={add} className="flex flex-col gap-2">
        <label className="sr-only" htmlFor={`name-${side}`}>
          Name
        </label>
        <input
          id={`name-${side}`}
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mia"
          autoComplete="off"
          className="w-full rounded border border-neutral-300 bg-background px-3 py-2.5 text-lg outline-none focus:border-ink dark:border-neutral-700"
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor={`email-${side}`}>
            Email
          </label>
          <input
            id={`email-${side}`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@email.com"
            autoComplete="off"
            className="w-full rounded border border-neutral-300 bg-background px-3 py-2.5 text-lg outline-none focus:border-ink dark:border-neutral-700"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-full border border-ink px-4 py-2.5 text-sm font-medium transition hover:bg-fog disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>

      {addresses.length === 0 ? (
        <p className="text-sm text-neutral-500">No addresses yet.</p>
      ) : (
        <ul className="rounded bg-fog">
          {addresses.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-2.5 [&+&]:border-t [&+&]:border-ink/10">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{row.name}</span>
                <span className="block truncate text-footnote text-neutral-500">{row.email}</span>
              </span>
              <button
                type="button"
                onClick={() => remove(row.id)}
                disabled={pending}
                className="shrink-0 text-sm text-neutral-500 underline underline-offset-2 hover:text-ink disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Subject
        <input
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            setConfirm(false);
          }}
          placeholder="What the inbox shows"
          maxLength={120}
          className="w-full rounded border border-neutral-300 bg-background px-3 py-2.5 text-lg font-normal outline-none focus:border-ink dark:border-neutral-700"
        />
      </label>

      <button
        type="button"
        onClick={send}
        disabled={pending || addresses.length === 0}
        className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
      >
        {pending ? "Sending…" : confirm ? `Send now to ${addresses.length}` : `Send to ${title.toLowerCase()}`}
      </button>

      {error && (
        <p role="alert" className="text-sm text-ink">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="text-sm text-ink">
          {status}
        </p>
      )}
    </section>
  );
}
