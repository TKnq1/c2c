import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-ink/10">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-xs rounded bg-fog text-neutral-700 px-2 py-1 dark:text-neutral-300">Admin</span>
          </div>
          <LogoutButton />
        </div>
      </header>
      <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
