"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { FiCheck, FiCopy, FiTrash2, FiUpload } from "react-icons/fi";
import { addAdSpendAction, deleteAdSpendAction, importAdSpendAction } from "@/lib/actions/admin-ads";
import { CHANNELS, detectColumns, readAdRows, type ColumnMap } from "@/lib/ad-import";
import { parseCsv } from "@/lib/csv-parse";
import { cleanUtm } from "@/lib/utm";
import { parseEuroInput } from "@/lib/euro-input";
import { toast } from "@/lib/toast";

const field = "rounded border border-ink/15 bg-paper px-3 py-1.5 text-sm outline-none focus:border-ink";
const primary = "rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-paper transition disabled:opacity-40";

const COLUMN_LABELS: { key: keyof ColumnMap; label: string; required: boolean }[] = [
  { key: "day", label: "Tag", required: true },
  { key: "campaign", label: "Kampagne", required: true },
  { key: "spend", label: "Ausgaben", required: true },
  { key: "impressions", label: "Impressionen", required: false },
  { key: "clicks", label: "Klicks", required: false },
];


// The CSV is read in the browser; only the cleaned rows are sent. Columns are guessed from the headings and can be changed.
export function AdImport() {
  const [rows, setRows] = useState<string[][] | null>(null);
  const [map, setMap] = useState<ColumnMap | null>(null);
  const [fileName, setFileName] = useState("");
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]["value"]>("meta");
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => (rows && map ? readAdRows(rows, map) : null), [rows, map]);
  const header = rows?.[0] ?? [];
  const total = parsed ? parsed.rows.reduce((sum, r) => sum + r.spendCents, 0) : 0;

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 5_000_000) return void toast.error("Die Datei ist größer als 5 MB.");
    const text = await file.text();
    const next = parseCsv(text);
    if (next.length < 2) return void toast.error("In der Datei stehen keine Datenzeilen.");
    setRows(next);
    setMap(detectColumns(next[0]));
    setFileName(file.name);
  }

  function reset() {
    setRows(null);
    setMap(null);
    setFileName("");
    if (input.current) input.current.value = "";
  }

  const ready = !!parsed && parsed.rows.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input ref={input} type="file" accept=".csv,text/csv,text/plain" onChange={(e) => void onFile(e.target.files?.[0])} className="sr-only" id="ad-csv" />
        <label htmlFor="ad-csv" className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/15 px-4 py-1.5 text-xs font-bold transition hover:bg-fog">
          <FiUpload className="h-3.5 w-3.5" aria-hidden />
          {fileName ? "Andere Datei wählen" : "CSV aus dem Werbe-Manager wählen"}
        </label>
        {fileName && <span className="text-sm text-neutral-600 dark:text-neutral-400">{fileName}</span>}
      </div>

      {rows && map && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs font-bold">
              Kanal
              <select value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)} className={field}>
                {CHANNELS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            {COLUMN_LABELS.map(({ key, label, required }) => (
              <label key={key} className="flex flex-col gap-1 text-xs font-bold">
                {label}
                {required ? "" : " (optional)"}
                <select value={map[key] ?? ""} onChange={(e) => setMap({ ...map, [key]: e.target.value === "" ? null : Number(e.target.value) })} className={`${field} max-w-44`}>
                  <option value="">– keine –</option>
                  {header.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Spalte ${i + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {parsed && (
            <div className="rounded border border-ink/10 p-3 text-sm">
              {ready ? (
                <p>
                  <b>{parsed.rows.length}</b> Zeilen gelesen, zusammen <b>{(total / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</b>
                  {parsed.skipped > 0 && <span className="text-neutral-500"> · {parsed.skipped} ohne Datum, Kampagne oder Betrag übersprungen</span>}
                </p>
              ) : (
                <p className="font-bold">Mit dieser Zuordnung ist keine Zeile lesbar. Wähle oben die Spalten für Tag, Kampagne und Ausgaben.</p>
              )}
              {ready && (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[28rem] text-xs">
                    <thead>
                      <tr className="text-left text-graphite">
                        <th className="pr-3 font-normal">Tag</th>
                        <th className="pr-3 font-normal">Kampagne</th>
                        <th className="pr-3 text-right font-normal">Ausgaben</th>
                        <th className="pr-3 text-right font-normal">Impressionen</th>
                        <th className="text-right font-normal">Klicks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.slice(0, 4).map((r, i) => (
                        <tr key={i} className="border-t border-ink/10">
                          <td className="py-1 pr-3 tabular-nums">{r.day}</td>
                          <td className="pr-3">
                            {r.campaignName} <span className="text-neutral-500">→ {cleanUtm(r.campaignName) ?? "ungültig"}</span>
                          </td>
                          <td className="pr-3 text-right tabular-nums">{(r.spendCents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</td>
                          <td className="pr-3 text-right tabular-nums">{r.impressions.toLocaleString("de-DE")}</td>
                          <td className="text-right tabular-nums">{r.clicks.toLocaleString("de-DE")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!ready || pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await importAdSpendAction({ channel, rows: parsed!.rows });
                  if (result.error) toast.error(result.error);
                  else {
                    toast.success(`${result.imported ?? 0} Zeilen übernommen${result.skipped ? `, ${result.skipped} übersprungen` : ""}`);
                    reset();
                  }
                })
              }
              className={primary}
            >
              Übernehmen
            </button>
            <button type="button" onClick={reset} className="rounded-full px-4 py-1.5 text-xs font-bold text-graphite transition hover:bg-fog">
              Verwerfen
            </button>
          </div>
        </>
      )}
      <p className="text-xs text-neutral-500">
        Die Datei wird im Browser gelesen. Ein zweiter Import derselben Tage überschreibt, es entstehen keine Doppelten. Beträge gelten als Euro.
      </p>
    </div>
  );
}

export function AdSpendForm() {
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]["value"]>("meta");
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [campaign, setCampaign] = useState("");
  const [spend, setSpend] = useState("");
  const [clicks, setClicks] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await addAdSpendAction({ channel, day, campaignName: campaign, spend: parseEuroInput(spend), impressions: 0, clicks: clicks.trim() === "" ? 0 : Math.round(parseEuroInput(clicks)) });
          if (result.error) toast.error(result.error);
          else {
            toast.success("Ausgabe gespeichert");
            setSpend("");
            setClicks("");
          }
        });
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <select value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)} aria-label="Kanal" className={field}>
        {CHANNELS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <input type="date" value={day} onChange={(e) => setDay(e.target.value)} aria-label="Tag" className={field} />
      <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="Kampagne" aria-label="Kampagne" maxLength={120} className={`${field} w-40`} />
      <input value={spend} onChange={(e) => setSpend(e.target.value)} inputMode="decimal" placeholder="Betrag €" aria-label="Betrag in Euro" className={`${field} w-24`} />
      <input value={clicks} onChange={(e) => setClicks(e.target.value)} inputMode="numeric" placeholder="Klicks" aria-label="Klicks" className={`${field} w-20`} />
      <button type="submit" disabled={pending || campaign.trim() === "" || spend.trim() === ""} className={primary}>
        Hinzufügen
      </button>
    </form>
  );
}

export function DeleteSpendButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`${label} löschen`}
      onClick={() => startTransition(async () => void (await deleteAdSpendAction(id)))}
      className="rounded p-1.5 text-graphite transition hover:bg-fog hover:text-ink disabled:opacity-50"
    >
      <FiTrash2 className="h-4 w-4" aria-hidden />
    </button>
  );
}

const SOURCES = ["instagram", "tiktok", "facebook", "google", "newsletter", "creator", "other"];
const MEDIA = ["paid", "social", "email", "referral"];

// Builds the link to put into an ad or a post. The campaign name is cleaned the way the dashboard cleans it, so what is
// typed here, in the ad manager and in the import end up as the same key.
export function LinkBuilder({ siteUrl }: { siteUrl: string }) {
  const [target, setTarget] = useState<"" | "brands" | "creators">("");
  const [source, setSource] = useState("instagram");
  const [medium, setMedium] = useState("paid");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);

  const key = cleanUtm(campaign);
  const link = useMemo(() => {
    const params = new URLSearchParams({ utm_source: source, utm_medium: medium });
    if (key) params.set("utm_campaign", key);
    const c = cleanUtm(content);
    if (c) params.set("utm_content", c);
    if (target) params.set("for", target);
    return `${siteUrl.replace(/\/$/, "")}/?${params.toString()}`;
  }, [siteUrl, source, medium, key, content, target]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-bold">
          Für
          <select value={target} onChange={(e) => setTarget(e.target.value as typeof target)} className={field}>
            <option value="">Startseite</option>
            <option value="brands">Marken</option>
            <option value="creators">Creator</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold">
          Quelle
          <select value={source} onChange={(e) => setSource(e.target.value)} className={field}>
            {SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold">
          Art
          <select value={medium} onChange={(e) => setMedium(e.target.value)} className={field}>
            {MEDIA.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold">
          Kampagne
          <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="z. B. herbst-creator" maxLength={80} className={`${field} w-44`} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold">
          Anzeige (optional)
          <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="z. B. video-a" maxLength={80} className={`${field} w-36`} />
        </label>
      </div>
      <div className="flex items-center gap-2 rounded border border-ink/10 bg-fog px-3 py-2">
        <code className="min-w-0 flex-1 text-xs break-all">{link}</code>
        <button
          type="button"
          aria-label="Link kopieren"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              toast.error("Kopieren hat nicht geklappt. Markiere den Link und kopiere ihn von Hand.");
            }
          }}
          className="shrink-0 rounded p-2 transition hover:bg-paper"
        >
          {copied ? <FiCheck className="h-4 w-4" aria-hidden /> : <FiCopy className="h-4 w-4" aria-hidden />}
        </button>
      </div>
      <p className="text-xs text-neutral-500">
        {key ? (
          <>
            Der Kampagnenname im Link ist <b>{key}</b>. Nenne die Kampagne im Werbe-Manager genauso (Groß- und Kleinschreibung zählt nicht, Leerzeichen werden zu Bindestrichen, Sonderzeichen fallen weg), dann ordnet das Dashboard Ausgaben und Anmeldungen zu.
          </>
        ) : (
          "Gib der Kampagne einen Namen, damit Anmeldungen und Ausgaben zusammenfinden."
        )}
      </p>
    </div>
  );
}
