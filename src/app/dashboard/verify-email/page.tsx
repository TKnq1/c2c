import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VerifyEmailLink } from "@/components/verify-email-link";
import { getT } from "@/lib/i18n/server";

export default async function VerifyEmailPage() {
  const t = await getT();
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-title-1 font-bold">{t("screens.auth.verifyEmail")}</h1>
      {user.emailVerified ? (
        <p className="text-sm text-ink">{t("screens.ui.verifyAlready")}</p>
      ) : (
        <VerifyEmailLink />
      )}
    </div>
  );
}
