"use client";

import { useEffect, useState, useTransition } from "react";
import { FiArrowDown, FiArrowUp, FiMusic } from "react-icons/fi";
import { savePrefsAction } from "@/lib/actions/admin-dashboard";
import { KPI_SET_HINTS, KPI_SET_LABELS, KPI_SETS, TILE_KEYS, TILE_LABELS, type AdminPrefs, orderedTiles } from "@/lib/admin-prefs";
import { getPreferredTheme, setTheme } from "@/lib/theme";
import { AccentPicker, Row, Segmented, SongManager, WindowPicker, fieldClass } from "@/components/admin/settings-parts";
import { Switch } from "@/components/switch";
import { toast } from "@/lib/toast";

export function SettingsForm({ initial }: { initial: AdminPrefs }) {
  const [prefs, setPrefs] = useState(initial);
  const [dark, setDark] = useState(false);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof AdminPrefs>(key: K, value: AdminPrefs[K]) => setPrefs((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    queueMicrotask(() => setDark(getPreferredTheme() === "dark"));
  }, []);

  const order = orderedTiles(prefs.tileOrder, []);
  const move = (key: (typeof TILE_KEYS)[number], by: -1 | 1) => {
    const next = [...order];
    const i = next.indexOf(key);
    const j = i + by;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    set("tileOrder", next);
  };
  const toggleTile = (key: (typeof TILE_KEYS)[number], visible: boolean) =>
    set("hiddenTiles", visible ? prefs.hiddenTiles.filter((k) => k !== key) : [...prefs.hiddenTiles, key]);

  const save = () =>
    startTransition(async () => {
      const result = await savePrefsAction({
        displayName: prefs.displayName?.trim() || null,
        accent: prefs.accent,
        compact: prefs.compact,
        hiddenTiles: prefs.hiddenTiles,
        tileOrder: order,
        goalBrands: prefs.goalBrands,
        goalCreators: prefs.goalCreators,
        goalMonthlyFeeCents: prefs.goalMonthlyFeeCents,
        morningEnabled: prefs.morningEnabled,
        morningFromHour: prefs.morningFromHour,
        morningToHour: prefs.morningToHour,
        morningEveryTime: prefs.morningEveryTime,
        songVolume: prefs.songVolume,
        kpiSet: prefs.kpiSet,
        mailDaily: prefs.mailDaily,
        mailUrgent: prefs.mailUrgent,
        mailWeekly: prefs.mailWeekly,
      });
      if (result.error) toast.error(result.error);
      else toast.success("Gespeichert");
    });

  const card = "rounded border border-ink/10 bg-paper p-[var(--pad,1.25rem)]";
  const heading = "mb-3.5 text-footnote font-bold text-neutral-600 dark:text-neutral-400";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <section className={card}>
          <h2 className={heading}>Aussehen</h2>
          <Row label="Name in der Begrüßung" hint="„Guten Morgen, …“">
            <input value={prefs.displayName ?? ""} onChange={(e) => set("displayName", e.target.value)} maxLength={40} aria-label="Name" className={`${fieldClass} w-44`} />
          </Row>
          <Row label="Akzentfarbe" hint="Diagramme, Fortschritt, aktive Seite">
            <AccentPicker value={prefs.accent} onChange={(v) => set("accent", v)} />
          </Row>
          <Row label="Dunkler Modus" hint="Gilt für die ganze App auf diesem Gerät">
            <Switch
              checked={dark}
              onChange={(next) => {
                setTheme(next ? "dark" : "light");
                setDark(next);
              }}
              label="Dunkler Modus"
            />
          </Row>
          <Row label="Dichte">
            <Segmented label="Dichte" value={prefs.compact ? "compact" : "airy"} options={[{ value: "airy", label: "Luftig" }, { value: "compact", label: "Kompakt" }]} onChange={(v) => set("compact", v === "compact")} />
          </Row>
        </section>

        <section className={card}>
          <h2 className={`${heading} flex items-center gap-2`}>
            <FiMusic className="h-4 w-4" aria-hidden />
            Morgen-Start und Song
          </h2>
          <Row label="Morgen-Start anzeigen" hint="Vollbild mit „Guten Morgen“ und Start-Knopf, nur hier im Admin">
            <Switch checked={prefs.morningEnabled} onChange={(v) => set("morningEnabled", v)} label="Morgen-Start" />
          </Row>
          <Row label="Zeitfenster" hint="In dieser Zeit erscheint der Morgen-Start">
            <WindowPicker from={prefs.morningFromHour} to={prefs.morningToHour} onChange={(from, to) => setPrefs((p) => ({ ...p, morningFromHour: from, morningToHour: to }))} />
          </Row>
          <Row label="Häufigkeit">
            <Segmented label="Häufigkeit" value={prefs.morningEveryTime ? "every" : "once"} options={[{ value: "once", label: "1× pro Tag" }, { value: "every", label: "Jedes Mal" }]} onChange={(v) => set("morningEveryTime", v === "every")} />
          </Row>
          <Row label="Lautstärke">
            <input type="range" min={0} max={100} value={prefs.songVolume} onChange={(e) => set("songVolume", Number(e.target.value))} aria-label="Lautstärke" className="w-36 accent-[var(--accent)]" />
          </Row>
          <div className="border-t border-ink/10 pt-3">
            <p className="text-sm font-bold">Songs</p>
            <SongManager volume={prefs.songVolume} />
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={card}>
          <h2 className={heading}>Mitteilungen per Mail</h2>
          <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">Alles steht auch im Postfach des Dashboards (Glocke). Die Mail ist eine Kopie davon, an deine Admin-Adresse.</p>
          <Row label="Tagesbericht" hint="Jeden Morgen: was ansteht, die vier Zahlen, was aufgefallen ist">
            <Switch checked={prefs.mailDaily} onChange={(v) => set("mailDaily", v)} label="Tagesbericht per Mail" />
          </Row>
          <Row label="Dringendes sofort" hint="Neue Meldung, Streitfall, viele fehlgeschlagene Mails">
            <Switch checked={prefs.mailUrgent} onChange={(v) => set("mailUrgent", v)} label="Dringendes per Mail" />
          </Row>
          <Row label="Wochenbericht" hint="Montags: die Woche in Zahlen und die Prognose zum Ziel">
            <Switch checked={prefs.mailWeekly} onChange={(v) => set("mailWeekly", v)} label="Wochenbericht per Mail" />
          </Row>
        </section>

        <section className={card}>
          <h2 className={heading}>Die vier Zahlen oben auf „Heute“</h2>
          <Row label="Zahlen" hint={KPI_SET_HINTS[prefs.kpiSet]}>
            <Segmented label="Zahlen" value={prefs.kpiSet} options={KPI_SETS.map((key) => ({ value: key, label: KPI_SET_LABELS[key] }))} onChange={(v) => set("kpiSet", v)} />
          </Row>
          <h2 className={`${heading} mt-6`}>Blöcke unter „Mehr Details“ auf „Heute“</h2>
          {order.map((key, i) => {
            const visible = !prefs.hiddenTiles.includes(key);
            return (
              <Row key={key} label={TILE_LABELS[key]}>
                <span className="flex items-center gap-1">
                  <button type="button" onClick={() => move(key, -1)} disabled={i === 0} aria-label={`${TILE_LABELS[key]} nach oben`} className="rounded p-1.5 text-graphite transition hover:bg-fog disabled:opacity-30">
                    <FiArrowUp className="h-4 w-4" aria-hidden />
                  </button>
                  <button type="button" onClick={() => move(key, 1)} disabled={i === order.length - 1} aria-label={`${TILE_LABELS[key]} nach unten`} className="rounded p-1.5 text-graphite transition hover:bg-fog disabled:opacity-30">
                    <FiArrowDown className="h-4 w-4" aria-hidden />
                  </button>
                  <Switch checked={visible} onChange={(v) => toggleTile(key, v)} label={`${TILE_LABELS[key]} anzeigen`} />
                </span>
              </Row>
            );
          })}
        </section>

        <section className={card}>
          <h2 className={heading}>Ziele</h2>
          <Row label="Founding-Marken">
            <input type="number" min={1} value={prefs.goalBrands} onChange={(e) => set("goalBrands", Number(e.target.value))} aria-label="Ziel Founding-Marken" className={`${fieldClass} w-28`} />
          </Row>
          <Row label="Founding-Creator">
            <input type="number" min={1} value={prefs.goalCreators} onChange={(e) => set("goalCreators", Number(e.target.value))} aria-label="Ziel Founding-Creator" className={`${fieldClass} w-28`} />
          </Row>
          <Row label="Provision pro Monat" hint="in Euro">
            <input
              type="number"
              min={1}
              value={Math.round(prefs.goalMonthlyFeeCents / 100)}
              onChange={(e) => set("goalMonthlyFeeCents", Math.round(Number(e.target.value) * 100))}
              aria-label="Ziel Provision pro Monat in Euro"
              className={`${fieldClass} w-28`}
            />
          </Row>
        </section>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={save} disabled={pending} className="rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-paper transition disabled:opacity-50">
          {pending ? "Speichert …" : "Speichern"}
        </button>
      </div>
    </div>
  );
}
