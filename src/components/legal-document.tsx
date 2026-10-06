import { getT } from "@/lib/i18n/server";

// The body of a legal page: the title, when it last changed, then numbered sections in grey boxes (the same
// style as the FAQ), numbered because they get referred to ("see section 5").
export async function LegalDocument({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro?: string;
  sections: { title: string; body: string[] }[];
}) {
  const t = await getT();
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-[40px] leading-[1.02] font-black tracking-[-0.03em] text-balance md:text-[56px]">
          {title}
        </h1>
        {intro && <p className="max-w-[60ch] text-lg text-neutral-700 dark:text-neutral-300">{intro}</p>}
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t("landing.legal.updated")} {updated}
        </p>
      </header>
      <div className="flex flex-col gap-3">
        {sections.map((s, i) => (
          <section key={s.title} className="rounded bg-fog p-5">
            <h2 className="font-semibold">
              {i + 1}. {s.title}
            </h2>
            <div className="mt-2 flex flex-col gap-2">
              {s.body.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
