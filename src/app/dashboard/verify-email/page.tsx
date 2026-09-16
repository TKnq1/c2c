import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VerifyEmailLink } from "@/components/verify-email-link";

export default async function VerifyEmailPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-normal">Verify your email</h1>
      {user.emailVerified ? (
        <p className="text-sm text-ink">Your email is already verified.</p>
      ) : (
        <VerifyEmailLink />
      )}
    </div>
  );
}
