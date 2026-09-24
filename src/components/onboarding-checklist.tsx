import Link from "next/link";
import { FiCheck } from "react-icons/fi";

type Item = { label: string; done: boolean; href: string };

// Lives in Settings, not dismissible — it should keep showing on every
// visit until the account is actually finished, not just once until
// someone clicks it away.
export function OnboardingChecklist({ items }: { items: Item[] }) {
  const allDone = items.every((i) => i.done);
  if (allDone) return null;

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="rounded-2xl border border-ink/10 p-4 flex flex-col gap-3">
      <p className="text-sm font-medium">
        Finish setting up your account ({doneCount}/{items.length})
      </p>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <Link key={item.label} href={item.href} prefetch={false} className="flex items-center gap-2 text-sm hover:underline">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                item.done ? "bg-ink border-ink text-paper" : "border-neutral-300 dark:border-neutral-700"
              }`}
            >
              {item.done && <FiCheck className="h-3 w-3" />}
            </span>
            <span className={item.done ? "text-neutral-400 line-through" : "text-neutral-700"}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
