"use client";

import { usePathname } from "next/navigation";

// Keying on the pathname forces a remount on every real navigation (query
// string changes alone don't count, so this doesn't fight the welcome
// overlay's own ?welcome=1 -> replace() step), which retriggers the CSS
// fade-in below.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-transition-fade flex-1 min-h-0 flex flex-col">
      {children}
    </div>
  );
}
