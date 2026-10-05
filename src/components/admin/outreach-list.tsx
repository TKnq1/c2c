"use client";

import { useState, useTransition } from "react";
import type { OutreachSide } from "@prisma/client";
import { addOutreachAddressAction, removeOutreachAddressAction, sendOutreachAction } from "@/lib/actions/outreach";

type Address = { id: string; name: string; email: string; sent: number; opened: number; clicked: number };

function trackLine({ sent, opened, clicked }: Pick<Address, "sent" | "opened" | "clicked">) {
  if (sent === 0) return null;
  return [`Sent ${sent}`, opened > 0 ? `Opened ${opened}` : "Not opened", clicked > 0 ? `Clicked ${clicked}` : null]
    .filter(Boolean)
    .join(" · ");
}

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
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const [pending, startTransition] = useTransition();

  const selected = addresses.filter((row) => picked.has(row.id));

  const toggle = (id: string) => {
    setError(null);
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
    setStatus(null);
    if (selected.length === 0) {
      setError("Mark the addresses you want to send to.");
      setOpen(true);
      return;
    }
    if (subject.trim().length < 3) {
      setError("Write a subject of at least 3 characters.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await sendOutreachAction(
        side,
        subject,
        selected.map((row) => row.id),
      );
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
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="self-start text-sm font-medium underline underline-offset-2"
          >
            {open ? "Hide addresses" : `Show ${addresses.length} ${addresses.length === 1 ? "address" : "addresses"}`}
            {selected.length > 0 ? ` · ${selected.length} marked` : ""}
          </button>
          {open && (
            <ul className="rounded bg-fog">
              {addresses.map((row) => {
                const tracking = trackLine(row);
                return (
                  <li key={row.id} className="flex items-center gap-3 px-3 py-2.5 [&+&]:border-t [&+&]:border-ink/10">
                    <input
                      type="checkbox"
                      checked={picked.has(row.id)}
                      onChange={() => toggle(row.id)}
                      aria-label={`Send to ${row.name}`}
                      className="size-4 shrink-0 accent-ink"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{row.name}</span>
                      <span className="block truncate text-footnote text-neutral-500">{row.email}</span>
                      {tracking && <span className="block text-footnote text-neutral-500">{tracking}</span>}
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
                );
              })}
            </ul>
          )}
        </div>
      )}

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Subject
        <input
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            setError(null);
          }}
          placeholder="What the inbox shows"
          maxLength={120}
          className="w-full rounded border border-neutral-300 bg-background px-3 py-2.5 text-lg font-normal outline-none focus:border-ink dark:border-neutral-700"
        />
      </label>

      <button
        type="button"
        onClick={send}
        disabled={pending}
        className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-graphite disabled:opacity-50"
      >
        {pending ? "Sending…" : selected.length === 0 ? "Send" : `Send to ${selected.length}`}
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
