// A page's heading from md up, where the sidebar replaces the phone header
// that names the page (see getPageTitle in nav.tsx). On phones it stays in
// the document for screen readers only, so the title isn't shown twice. The same from lg up on the pages whose name the
// sidebar already carries beside the logo (it sets data-sidebar-title on the body, see Sidebar in nav.tsx).
// Hidden that way it takes no room in a flex column, gap included; extra
// hiding rules go in className rather than on a wrapper, which would still
// count as an item and add a gap.
// as="p" for the app screens drawn on the landing page: the page's own h1 is its headline there.
export function PageTitle({
  children,
  description,
  className = "",
  as: Heading = "h1",
}: {
  children: React.ReactNode;
  description?: string;
  className?: string;
  as?: "h1" | "p";
}) {
  return (
    <div className={`max-md:sr-only [body[data-sidebar-title]_&]:lg:sr-only ${className}`}>
      <Heading className="font-display text-title-1 font-bold">{children}</Heading>
      {description && <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>}
    </div>
  );
}
