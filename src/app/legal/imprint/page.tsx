import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";
import { DE_IMPRINT, imprintVatId } from "@/lib/legal/de";

export async function generateMetadata(): Promise<Metadata> {
  const german = (await getLocale()) === "de";
  return {
    title: german ? "Impressum" : "Imprint",
    description: german ? "Anbieterkennzeichnung nach § 5 DDG." : "Information according to § 5 DDG.",
    alternates: canonical("/legal/imprint"),
  };
}

const ROWS: { label: string; lines: string[] }[] = [
  { label: "Service provider", lines: ["Teethawat Kanpai", "Sole trader (Einzelunternehmen)", "Sonnenscheinpfad 64", "12277 Berlin, Germany"] },
  { label: "Contact", lines: ["info@comtor.app", "+49 172 4134526"] },
  { label: "Responsible for content", lines: ["Teethawat Kanpai, address as above (§ 18 (2) MStV)"] },
];

export default async function ImprintPage() {
  const german = (await getLocale()) === "de";
  const vatId = imprintVatId();
  const rows = [
    ...(german ? DE_IMPRINT.rows : ROWS),
    ...(vatId ? [{ label: german ? "Umsatzsteuer-Identifikationsnummer" : "VAT identification number", lines: [vatId] }] : []),
  ];
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-[40px] leading-[1.02] font-black tracking-[-0.03em] text-balance md:text-[56px]">
          {german ? "Impressum" : "Imprint"}
        </h1>
        <p className="max-w-[60ch] text-lg text-neutral-700 dark:text-neutral-300">
          {german ? DE_IMPRINT.lead : "Information according to § 5 DDG."}
        </p>
      </header>

      <dl className="flex flex-col divide-y divide-ink/10 rounded bg-fog px-4">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5 py-3 text-sm">
            <dt className="text-neutral-500 dark:text-neutral-400">{row.label}</dt>
            {row.lines.map((line) => (
              <dd key={line}>{line}</dd>
            ))}
          </div>
        ))}
      </dl>

      <section className="rounded bg-fog p-5">
        <h2 className="font-semibold">{german ? DE_IMPRINT.disputeTitle : "Consumer dispute resolution"}</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {german
            ? DE_IMPRINT.dispute
            : "We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board."}
        </p>
      </section>
    </div>
  );
}
