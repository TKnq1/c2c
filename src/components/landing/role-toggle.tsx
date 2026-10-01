"use client";

import { chooseLandingRole, useLandingRole } from "@/components/landing/landing-role";

// Creators | Brands. Which half is lit comes from CSS on
// html[data-landing-role] (see landing.css), so it's right from the first
// paint, before React has caught up with a choice made on an earlier visit.
export function RoleToggle({ className = "" }: { className?: string }) {
  const role = useLandingRole() ?? "creator";
  return (
    <div
      role="group"
      aria-label="Show comtor for"
      className={`lp-toggle relative grid grid-cols-2 rounded-full bg-ink/[0.06] p-1 text-sm font-semibold ${className}`}
    >
      <span aria-hidden="true" className="lp-toggle-thumb absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-ink shadow-sm" />
      {(["creator", "brand"] as const).map((value) => (
        <button
          key={value}
          type="button"
          data-value={value}
          aria-pressed={role === value}
          onClick={() => chooseLandingRole(value)}
          className="relative z-10 rounded-full px-4 py-1.5 whitespace-nowrap"
        >
          {value === "creator" ? "Creators" : "Brands"}
        </button>
      ))}
    </div>
  );
}
