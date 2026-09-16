import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { RequestForm } from "@/components/request-form";

export default async function NewRequestPage() {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-normal">New request</h1>
      <RequestForm />
    </div>
  );
}
