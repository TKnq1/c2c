"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiCheck, FiX } from "react-icons/fi";

type Item = { label: string; done: boolean; href: string };

export function OnboardingChecklist({ storageKey, items }: { storageKey: string; items: Item[] }) {
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Deferred a tick so this reads as an external-system sync rather than a
    // synchronous setState-in-effect (also avoids a server/client hydration
    // mismatch, since the server has no localStorage to read at all).
    queueMicrotask(() => {
      setDismissed(localStorage.getItem(storageKey) === "1");
      setReady(true);
    });
  }, [storageKey]);

  const allDone = items.every((i) => i.done);
  if (!ready || dismissed || allDone) return null;

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="rounded-2xl border border-ink/10 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          Finish setting up your account ({doneCount}/{items.length})
        </p>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(storageKey, "1");
            setDismissed(true);
          }}
          aria-label="Dismiss"
          className="text-neutral-400 hover:text-neutral-700 transition dark:text-neutral-500 dark:hover:text-neutral-300"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <Link key={item.label} href={item.href} prefetch={false} className="flex items-center gap-2 text-sm hover:underline">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                item.done ? "bg-ink border-ink text-paper" : "border-neutral-300 dark:border-neutral-700"
              }`}
            >
              {item.done && <FiCheck className="h-3 w-3" />}
            </span>
            <span className={item.done ? "text-neutral-400 line-through" : "text-neutral-700"}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
