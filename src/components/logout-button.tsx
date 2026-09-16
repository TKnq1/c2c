import { logoutAction } from "@/lib/actions/auth";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-ink hover:bg-fog transition dark:border-neutral-700 dark:text-neutral-300"
      >
        Log out
      </button>
    </form>
  );
}
