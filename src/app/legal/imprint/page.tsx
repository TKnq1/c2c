import type { Metadata } from "next";

export const metadata: Metadata = { title: "Imprint" };

const ROWS: { label: string; lines: string[] }[] = [
  { label: "Service provider", lines: ["Teethawat Kanpai", "Sonnenscheinpfad 64", "12277 Berlin, Germany"] },
  { label: "Contact", lines: ["info@comtor.app", "+49 172 4134526"] },
  { label: "Responsible for content", lines: ["Teethawat Kanpai, address as above (§ 18 (2) MStV)"] },
];

export default function ImprintPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* The header already shows the title. */}
      <h1 className="sr-only">Imprint</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">Information according to § 5 DDG.</p>

      <dl className="flex flex-col divide-y divide-ink/10 rounded bg-fog px-4">
        {ROWS.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5 py-3 text-sm">
            <dt className="text-neutral-500 dark:text-neutral-400">{row.label}</dt>
            {row.lines.map((line) => (
              <dd key={line}>{line}</dd>
            ))}
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-1.5">
        <h2 className="font-semibold">Consumer dispute resolution</h2>
        <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer
          arbitration board.
        </p>
      </section>
    </div>
  );
}
