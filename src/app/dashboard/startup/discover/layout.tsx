// The list (children) and, over it, a profile opened from it (the @panel
// slot, which intercepts client navigations to ./[id] — a direct visit or a
// reload still gets the full page).
export default function DiscoverLayout({ children, panel }: LayoutProps<"/dashboard/startup/discover">) {
  return (
    <>
      {children}
      {panel}
    </>
  );
}
