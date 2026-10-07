"use client";

import { useEffect, useState, useTransition } from "react";
import { FiCheck, FiMinus } from "react-icons/fi";
import { completeSetupAction, savePrefsAction } from "@/lib/actions/admin-dashboard";
import { TILE_LABELS, TILE_KEYS, type AdminPrefs, orderedTiles } from "@/lib/admin-prefs";
import { getPreferredTheme, setTheme } from "@/lib/theme";
import { OPEN_ADMIN_SETUP } from "@/components/admin/admin-palette";
import { AccentPicker, Row, SongManager, WindowPicker, fieldClass } from "@/components/admin/settings-parts";
import { Switch } from "@/components/switch";
import { toast } from "@/lib/toast";

export type Connection = { label: string; ok: boolean; name: string; hint: string };

const STEPS = ["Name & Look", "Morgen-Song", "Kacheln & Ziele", "Verbindungen", "Fertig"] as const;
const DISMISSED_KEY = "admin-setup-dismissed";

// The first-visit assistant: five short steps through the things worth setting once. Closing it with "Später" keeps it
// out of the way for the rest of the visit; it comes back until it has been finished, and the palette can open it again.
export function SetupWizard({ initial, needed, connections }: { initial: AdminPrefs; needed: boolean; connections: Connection[] }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState(initial);
  const [dark, setDark] = useState(false);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof AdminPrefs>(key: K, value: AdminPrefs[K]) => setPrefs((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    queueMicrotask(() => setDark(getPreferredTheme() === "dark"));
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      // Storage blocked: the assistant shows on every load until it is finished.
    }
    if (needed && !dismissed) queueMicrotask(() => setOpen(true));
    const reopen = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(OPEN_ADMIN_SETUP, reopen);
    return () => window.removeEventListener(OPEN_ADMIN_SETUP, reopen);
  }, [needed]);

  const later = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // See above.
    }
  };

  const finish = () =>
    startTransition(async () => {
      const saved = await savePrefsAction({
        displayName: prefs.displayName?.trim() || null,
        accent: prefs.accent,
        compact: prefs.compact,
        hiddenTiles: prefs.hiddenTiles,
        tileOrder: orderedTiles(prefs.tileOrder, []),
        goalBrands: prefs.goalBrands,
        goalCreators: prefs.goalCreators,
        goalMonthlyFeeCents: prefs.goalMonthlyFeeCents,
        morningEnabled: prefs.morningEnabled,
        morningFromHour: prefs.morningFromHour,
        morningToHour: prefs.morningToHour,
        morningEveryTime: prefs.morningEveryTime,
        songVolume: prefs.songVolume,
      });
      if (saved.error) {
        toast.error(saved.error);
        return;
      }
      await completeSetupAction();
      setOpen(false);
      toast.success("Fertig eingerichtet");
    });

  if (!open) return null;

  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[55] grid place-items-center overflow-y-auto bg-ink/30 p-4 backdrop-blur-sm" role="presentation">
      <div role="dialog" aria-modal="true" aria-label="Einrichtung" className="grid w-full max-w-4xl overflow-hidden rounded border border-ink/10 bg-paper shadow-2xl md:grid-cols-[230px_1fr]">
        <ol className="hidden flex-col gap-1 bg-fog p-6 md:flex">
          <li className="mb-3 font-display text-lg font-black">Einrichtung</li>
          {STEPS.map((label, i) => (
            <li key={label} className={`flex items-center gap-2.5 py-2 text-sm ${i === step ? "font-bold text-ink" : "text-neutral-600 dark:text-neutral-400"}`}>
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-[1.5px] text-xs font-bold ${
                  i < step ? "border-accent bg-accent text-on-accent" : i === step ? "border-accent text-accent" : "border-stone"
                }`}
              >
                {i < step ? <FiCheck className="h-3 w-3" strokeWidth={3} aria-hidden /> : i + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>

        <div className="flex min-h-[26rem] flex-col gap-4 p-6 sm:p-8">
          <p className="text-xs text-graphite">
            Schritt {step + 1} von {STEPS.length}
          </p>
          <h2 className="font-display text-2xl font-black tracking-tight">{STEPS[step]}</h2>

          {step === 0 && (
            <div>
              <p className="mb-4 max-w-prose text-[0.9375rem] text-neutral-600 dark:text-neutral-400">Wie soll das Dashboard dich nennen, und wie soll es aussehen?</p>
              <Row label="Name in der Begrüßung">
                <input value={prefs.displayName ?? ""} onChange={(e) => set("displayName", e.target.value)} maxLength={40} aria-label="Name" className={`${fieldClass} w-44`} />
              </Row>
              <Row label="Akzentfarbe">
                <AccentPicker value={prefs.accent} onChange={(v) => set("accent", v)} />
              </Row>
              <Row label="Dunkler Modus">
                <Switch
                  checked={dark}
                  onChange={(next) => {
                    setTheme(next ? "dark" : "light");
                    setDark(next);
                  }}
                  label="Dunkler Modus"
                />
              </Row>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="mb-4 max-w-prose text-[0.9375rem] text-neutral-600 dark:text-neutral-400">
                Morgens erscheint beim ersten Öffnen ein „Guten Morgen“ mit Start-Knopf. Ein Klick darauf startet deinen Song.
              </p>
              <SongManager volume={prefs.songVolume} />
              <div className="mt-4">
                <Row label="Zeitfenster">
                  <WindowPicker from={prefs.morningFromHour} to={prefs.morningToHour} onChange={(from, to) => setPrefs((p) => ({ ...p, morningFromHour: from, morningToHour: to }))} />
                </Row>
                <Row label="Lautstärke">
                  <input type="range" min={0} max={100} value={prefs.songVolume} onChange={(e) => set("songVolume", Number(e.target.value))} aria-label="Lautstärke" className="w-36 accent-[var(--accent)]" />
                </Row>
                <Row label="Morgen-Start anzeigen">
                  <Switch checked={prefs.morningEnabled} onChange={(v) => set("morningEnabled", v)} label="Morgen-Start" />
                </Row>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="mb-4 max-w-prose text-[0.9375rem] text-neutral-600 dark:text-neutral-400">Was soll auf „Heute“ stehen, und wohin willst du?</p>
              {TILE_KEYS.map((key) => (
                <Row key={key} label={TILE_LABELS[key]}>
                  <Switch
                    checked={!prefs.hiddenTiles.includes(key)}
                    onChange={(v) => set("hiddenTiles", v ? prefs.hiddenTiles.filter((k) => k !== key) : [...prefs.hiddenTiles, key])}
                    label={`${TILE_LABELS[key]} anzeigen`}
                  />
                </Row>
              ))}
              <div className="mt-3 grid grid-cols-3 gap-3">
                {(
                  [
                    ["goalBrands", "Founding-Marken", 1],
                    ["goalCreators", "Founding-Creator", 1],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex flex-col gap-1 text-xs font-bold">
                    {label}
                    <input type="number" min={1} value={prefs[key]} onChange={(e) => set(key, Number(e.target.value))} className={fieldClass} />
                  </label>
                ))}
                <label className="flex flex-col gap-1 text-xs font-bold">
                  Provision/Monat (€)
                  <input
                    type="number"
                    min={1}
                    value={Math.round(prefs.goalMonthlyFeeCents / 100)}
                    onChange={(e) => set("goalMonthlyFeeCents", Math.round(Number(e.target.value) * 100))}
                    className={fieldClass}
                  />
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="mb-4 max-w-prose text-[0.9375rem] text-neutral-600 dark:text-neutral-400">
                So sieht das Dashboard, was schon angeschlossen ist. Keys trägst du selbst in Vercel ein (Settings → Environment Variables), nie hier.
              </p>
              <ul>
                {connections.map((c) => (
                  <li key={c.name} className="flex items-start gap-3 border-t border-ink/10 py-2.5 first:border-t-0 first:pt-0">
                    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${c.ok ? "bg-accent text-on-accent" : "border border-ink/20 text-graphite"}`}>
                      {c.ok ? <FiCheck className="h-3 w-3" strokeWidth={3} aria-hidden /> : <FiMinus className="h-3 w-3" aria-hidden />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold">
                        {c.label} <span className="font-normal text-neutral-500">· {c.ok ? "verbunden" : "fehlt"}</span>
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">{c.hint}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === 4 && (
            <div className="max-w-prose text-[0.9375rem] text-neutral-600 dark:text-neutral-400">
              <p>Alles gespeichert, sobald du auf „Los geht’s“ drückst. Ändern kannst du jedes Detail jederzeit unter „Anpassen“.</p>
              <p className="mt-3">
                Die Offen-Liste füllt sich von selbst. Ab sofort siehst du dort, was auf dich wartet. Mit ⌘K findest du jede Seite und jeden Nutzer.
              </p>
            </div>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-ink/10 pt-4">
            <button type="button" onClick={later} className="text-sm text-graphite underline">
              Später
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button type="button" onClick={() => setStep(step - 1)} className="rounded-full border border-ink/15 px-5 py-2 text-sm font-bold transition hover:bg-fog">
                  Zurück
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => (last ? finish() : setStep(step + 1))}
                className="rounded-full bg-ink px-6 py-2 text-sm font-bold text-paper transition disabled:opacity-50"
              >
                {last ? (pending ? "Speichert …" : "Los geht’s") : "Weiter"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
