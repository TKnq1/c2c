// A page's heading from md up, where the sidebar replaces the phone header
// that names the page (see getPageTitle in nav.tsx). On phones it stays in
// the document for screen readers only, so the title isn't shown twice.
export function PageTitle({ children, description }: { children: React.ReactNode; description?: string }) {
  return (
    <div className="max-md:sr-only">
      <h1 className="font-display text-title-1 font-bold">{children}</h1>
      {description && <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>}
    </div>
  );
}
