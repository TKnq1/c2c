"use client";

import { useRef, useState } from "react";

// Throwaway dev tool — a persistent phone-shaped frame around the real app
// (same-origin iframe, so it's the actual app, not a mockup screenshot) so
// it can be reviewed without constantly resizing the browser window back
// and forth. Not linked from anywhere.
const QUICK_LINKS = [
  { label: "Login", path: "/login" },
  { label: "Feed", path: "/dashboard/creator" },
  { label: "Matches", path: "/dashboard/creator/matches" },
  { label: "Discover", path: "/dashboard/creator/discover" },
  { label: "Messages", path: "/dashboard/messages" },
  { label: "Payments", path: "/dashboard/creator/payments" },
  { label: "Settings", path: "/dashboard/creator/settings" },
  { label: "Notifications", path: "/dashboard/notifications" },
];

export default function DevPhoneFramePage() {
  const [path, setPath] = useState("/login");
  const [inputValue, setInputValue] = useState("/login");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function go(target: string) {
    setPath(target);
    setInputValue(target);
  }

  function reload() {
    // Re-pointing src (even to the same value) doesn't reload an iframe —
    // clearing it first forces a real navigation instead of a no-op.
    setPath("");
    requestAnimationFrame(() => setPath(inputValue));
  }

  return (
    <div className="min-h-dvh flex flex-col items-center gap-6 bg-neutral-100 py-10 px-6 dark:bg-neutral-950">
      <div className="flex w-full max-w-xl flex-col gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go(inputValue);
          }}
          className="flex gap-2"
        >
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="/dashboard/creator"
            className="flex-1 rounded border border-ink/10 bg-paper px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-graphite transition">
            Go
          </button>
          <button
            type="button"
            onClick={reload}
            className="rounded border border-ink/10 px-4 py-2 text-sm font-medium hover:border-ink transition"
          >
            Reload
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.map((l) => (
            <button
              key={l.path}
              type="button"
              onClick={() => go(l.path)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                path === l.path ? "border-ink bg-ink text-paper" : "border-ink/10 hover:border-ink"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Same bezel treatment as the marketing PhoneMockup component, just
          fixed-size and wrapping a live iframe instead of fake content. */}
      <div className="shrink-0 rounded-[2.75rem] border-[6px] border-neutral-900 bg-neutral-900 p-1.5 shadow-2xl dark:border-neutral-700 dark:bg-neutral-700">
        <span className="absolute left-1/2 top-3.5 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-700" />
        <div className="relative w-[375px] h-[812px] overflow-hidden rounded-[2.25rem] bg-paper">
          {path && (
            <iframe
              ref={iframeRef}
              src={path}
              className="h-full w-full border-0"
              title="App preview"
            />
          )}
        </div>
      </div>
    </div>
  );
}
