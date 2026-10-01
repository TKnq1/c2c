import type { Role } from "@prisma/client";

const LABELS: Record<Role, string> = { STARTUP: "Brand", CREATOR: "Creator", ADMIN: "Admin" };

// Role as a quiet chip; a suspended account swaps to a dashed outline, the
// same "on hold" treatment PaymentStatusBadge uses for disputes.
export function RoleBadge({ role, suspended = false }: { role: Role; suspended?: boolean }) {
  if (suspended) {
    return (
      <span className="shrink-0 whitespace-nowrap rounded-full border border-dashed border-ink px-2.5 py-1 text-xs font-medium">
        Suspended
      </span>
    );
  }
  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
        role === "ADMIN" ? "bg-ink text-paper" : "bg-ink/10 text-neutral-700 dark:text-neutral-300"
      }`}
    >
      {LABELS[role]}
    </span>
  );
}
