// The body of a legal page: when it last changed, then numbered sections —
// numbered because they get referred to ("see section 5").
export function LegalDocument({
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
  return (
    <article className="flex flex-col gap-7">
      {/* The header already shows the title. */}
      <h1 className="sr-only">{title}</h1>
      <div className="flex flex-col gap-2">
        {intro && <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{intro}</p>}
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Last updated {updated}</p>
      </div>
      {sections.map((s, i) => (
        <section key={s.title} className="flex flex-col gap-1.5">
          <h2 className="font-semibold">
            {i + 1}. {s.title}
          </h2>
          {s.body.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
