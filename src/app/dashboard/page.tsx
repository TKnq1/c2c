import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { welcome } = await searchParams;
  const base = session.user.role === "STARTUP" ? "/dashboard/startup" : "/dashboard/creator";
  redirect(welcome ? `${base}?welcome=1` : base);
}
