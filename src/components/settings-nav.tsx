import type { Role } from "@prisma/client";

const BASE_SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "password", label: "Password" },
  { id: "two-factor", label: "2FA" },
  { id: "logins", label: "Logins" },
  { id: "push", label: "Notifications" },
  { id: "data", label: "Data" },
  { id: "danger", label: "Danger zone" },
];

// Plan/billing only applies to brands — creators don't pay a platform fee,
// so there's nothing for them to subscribe out of.
const PLAN_SECTION = { id: "plan", label: "Plan" };

export function SettingsNav({ role }: { role: Role }) {
  const sections =
    role === "STARTUP" ? [BASE_SECTIONS[0], PLAN_SECTION, ...BASE_SECTIONS.slice(1)] : BASE_SECTIONS;

  return (
    <nav
      aria-label="Settings sections"
      className="sticky top-0 z-10 bg-background px-2 py-2 border-b border-ink/10 flex items-center gap-4 overflow-x-auto scrollbar-hide text-sm text-neutral-500 dark:text-neutral-400"
    >
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="shrink-0 whitespace-nowrap hover:text-neutral-900 transition dark:hover:text-neutral-100"
        >
          {s.label}
        </a>
      ))}
      <div
        aria-hidden="true"
        className="pointer-events-none sticky right-0 -ml-8 w-8 shrink-0 self-stretch bg-gradient-to-l from-background to-transparent md:hidden"
      />
    </nav>
  );
}
