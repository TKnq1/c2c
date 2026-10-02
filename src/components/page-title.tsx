// A page's heading from md up, where the sidebar replaces the phone header
// that names the page (see getPageTitle in nav.tsx). On phones it stays in
// the document for screen readers only, so the title isn't shown twice.
// Hidden that way it takes no room in a flex column, gap included; extra
// hiding rules go in className rather than on a wrapper, which would still
// count as an item and add a gap.
export function PageTitle({
  children,
  description,
  className = "",
}: {
  children: React.ReactNode;
  description?: string;
  className?: string;
}) {
  return (
    <div className={`max-md:sr-only ${className}`}>
      <h1 className="font-display text-title-1 font-bold">{children}</h1>
      {description && <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>}
    </div>
  );
}
