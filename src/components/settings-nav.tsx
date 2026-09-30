import type { Role } from "@prisma/client";

const BASE_SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "appearance", label: "Appearance" },
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
// Payouts only applies to creators — brands pay out, they don't receive.
const PAYOUTS_SECTION = { id: "payouts", label: "Payouts" };

export function SettingsNav({ role }: { role: Role }) {
  const sections =
    role === "STARTUP"
      ? [BASE_SECTIONS[0], PLAN_SECTION, ...BASE_SECTIONS.slice(1)]
      : [BASE_SECTIONS[0], PAYOUTS_SECTION, ...BASE_SECTIONS.slice(1)];

  return (
    <nav
      aria-label="Settings sections"
      className="sticky top-0 z-10 -mx-6 flex items-center gap-2 overflow-x-auto bg-background px-6 py-2 text-sm scrollbar-hide md:mx-0 md:px-0"
    >
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="shrink-0 whitespace-nowrap rounded-full bg-fog px-3.5 py-1.5 font-medium text-neutral-700 transition hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700"
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
