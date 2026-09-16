import Link from "next/link";
import type { IconType } from "react-icons";

type Action = { label: string } & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

type Props = {
  icon: IconType;
  title: string;
  description?: string;
  action?: Action;
};

const actionClassName =
  "mt-2 rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition";

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 text-center py-12 px-4">
      <Icon className="h-8 w-8 text-neutral-300 dark:text-neutral-700" />
      <p className="font-medium text-neutral-700 dark:text-neutral-300">{title}</p>
      {description && (
        <p className="text-sm text-neutral-500 max-w-sm dark:text-neutral-400">{description}</p>
      )}
      {action &&
        (action.href ? (
          <Link href={action.href} className={actionClassName}>
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className={actionClassName}>
            {action.label}
          </button>
        ))}
    </div>
  );
}
