import Link from "next/link";
import { FiCheck } from "react-icons/fi";
import { getT } from "@/lib/i18n/server";

type Item = { label: string; done: boolean; href: string };

// Lives in Settings, not dismissible — it should keep showing on every
// visit until the account is actually finished, not just once until
// someone clicks it away.
export async function OnboardingChecklist({ items }: { items: Item[] }) {
  const t = await getT();
  const allDone = items.every((i) => i.done);
  if (allDone) return null;

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="flex flex-col gap-3 rounded bg-fog p-4">
      <p className="text-sm font-medium">
        {t("screens.settings.checklist", { done: doneCount, total: items.length })}
      </p>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <Link key={item.label} href={item.href} prefetch={false} className="flex items-center gap-2 text-sm hover:underline">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                item.done ? "bg-ink border-ink text-paper" : "border-neutral-300 dark:border-neutral-700"
              }`}
            >
              {item.done && <FiCheck className="h-3 w-3" />}
            </span>
            <span className={item.done ? "text-neutral-400 line-through" : "text-neutral-700 dark:text-neutral-300"}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
