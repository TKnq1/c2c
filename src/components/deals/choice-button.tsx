"use client";

// A choice as a button, the way the onboarding's language buttons look: a 4px box, filled when it is on, with a check mark at the
// end. It stays a real checkbox underneath (keyboard, screen readers, focus ring). In a group the buttons sit two to a row; a
// setting with a hint stands alone and takes the full width.
export function Check({ checked, onChange, label, hint }: { checked: boolean; onChange: (checked: boolean) => void; label: string; hint?: string }) {
  return (
    <label
      className={`relative flex w-full cursor-pointer select-none items-center gap-2.5 rounded border px-3 py-3.5 text-left text-sm font-medium transition focus-within:ring-2 focus-within:ring-ink/30 ${
        checked ? "border-ink bg-ink text-paper" : "border-neutral-300 hover:border-ink dark:border-neutral-700"
      }`}
    >
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="min-w-0 flex-1">
        {label}
        {hint && <span className={`mt-0.5 block text-xs font-normal ${checked ? "text-paper/70" : "text-neutral-500 dark:text-neutral-400"}`}>{hint}</span>}
      </span>
      {checked && (
        <span aria-hidden className="text-paper">
          ✓
        </span>
      )}
    </label>
  );
}
