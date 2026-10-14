import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import { imprintVatId } from "@/lib/legal/de";
import { getLegal } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  const { ui } = await getLegal();
  return { title: ui.imprintTitle, description: ui.imprintDescription, alternates: canonical("/legal/imprint") };
}

export default async function ImprintPage() {
  const legal = await getLegal();
  const vatId = imprintVatId();
  const rows = [
    ...legal.imprint.rows,
    ...(vatId ? [{ label: legal.ui.vatLabel, lines: [vatId] }] : []),
  ];
  return (
    <div lang={legal.htmlLang} className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-[40px] leading-[1.02] font-black tracking-[-0.03em] text-balance md:text-[56px]">
          {legal.ui.imprintTitle}
        </h1>
        <p className="max-w-[60ch] text-lg text-neutral-700 dark:text-neutral-300">{legal.imprint.lead}</p>
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
        <h2 className="font-semibold">{legal.imprint.disputeTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{legal.imprint.dispute}</p>
      </section>
    </div>
  );
}
