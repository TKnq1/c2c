"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import { FiAlertTriangle, FiBriefcase, FiCreditCard, FiFileText, FiGrid, FiMail, FiSend, FiTrendingUp, FiUsers } from "react-icons/fi";

type Item = { href: string; label: string; icon: IconType; badge?: number };

// Sidebar from md up, a scrolling tab row on phones. The badge on
// Moderation is the number of things waiting on an admin (open reports +
// disputed payments), so it's visible from every admin page.
export function AdminNav({ attentionCount }: { attentionCount: number }) {
  const pathname = usePathname();
  const items: Item[] = [
    { href: "/admin", label: "Overview", icon: FiGrid },
    { href: "/admin/users", label: "Users", icon: FiUsers },
    { href: "/admin/requests", label: "Requests", icon: FiFileText },
    { href: "/admin/payments", label: "Payments", icon: FiCreditCard },
    { href: "/admin/moderation", label: "Moderation", icon: FiAlertTriangle, badge: attentionCount },
    { href: "/admin/deals", label: "Brand Deals", icon: FiBriefcase },
    { href: "/admin/onboarding", label: "Onboarding", icon: FiTrendingUp },
    { href: "/admin/waitlist", label: "Waitlist", icon: FiMail },
    { href: "/admin/email", label: "Email", icon: FiSend },
    { href: "/admin/mailing", label: "Mailing", icon: FiMail },
  ];
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <nav
      aria-label="Admin"
      className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-ink/10 px-4 py-2 md:flex-col md:overflow-visible md:border-b-0 md:px-0 md:py-0"
    >
      {items.map(({ href, label, icon: Icon, badge }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2.5 rounded-full px-3 py-2 text-sm transition md:rounded ${
              active
                ? "bg-ink font-medium text-paper"
                : "text-neutral-600 hover:bg-fog hover:text-ink dark:text-neutral-400"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span>{label}</span>
            {!!badge && (
              <span
                className={`ml-auto min-w-5 rounded-full px-1.5 text-center text-xs font-medium tabular-nums ${
                  active ? "bg-paper text-ink" : "bg-ink text-paper"
                }`}
              >
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
