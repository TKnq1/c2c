import { logoutAction } from "@/lib/actions/auth";

export function LogoutButton({
  className = "rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-ink dark:border-neutral-700 dark:text-neutral-300",
}: {
  className?: string;
}) {
  return (
    <form action={logoutAction}>
      <button type="submit" className={className}>
        Log out
      </button>
    </form>
  );
}
