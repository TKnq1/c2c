// Icons only on tablets: the label pops out to the right on hover or
// keyboard focus. Hidden from lg, where the label is written out, and from
// screen readers, which already read the link's own text.
export function SidebarTooltip({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 translate-x-[-4px] whitespace-nowrap rounded bg-ink px-2.5 py-1 text-xs font-medium text-paper opacity-0 shadow-md transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 lg:hidden"
    >
      {label}
    </span>
  );
}
