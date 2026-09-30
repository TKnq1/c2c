// One group on the Settings pages: a heading, an optional line under it,
// and the controls in a card — the same card-per-group look as Payments.
// `bare` skips the card for content that's already one (the plan card).
export function SettingsSection({
  id,
  title,
  description,
  bare = false,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  bare?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-16 flex-col gap-3">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>}
      </div>
      {bare ? children : <div className="rounded-[20px] border border-ink/10 p-4">{children}</div>}
    </section>
  );
}

// A row inside a settings card — label (and a line under it) on the left,
// its control on the right. Stacked rows get a hairline between them.
export function SettingsRow({
  label,
  hint,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-ink/10 py-3 first:pt-0 last:pb-0 [&+&]:border-t">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-sm text-neutral-500 dark:text-neutral-400">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
