import { prisma } from "@/lib/prisma";
import { ConfirmEmailVerificationForm } from "@/components/confirm-email-verification-form";
import { Logo } from "@/components/logo";
import { ImprintLink } from "@/components/imprint-link";

export default async function VerifyEmailTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const verifyToken = await prisma.emailVerificationToken.findUnique({ where: { token } });
  const isValid = !!verifyToken && !verifyToken.usedAt && verifyToken.expiresAt > new Date();

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-4 text-center">
        <div className="flex justify-center">
          <Logo large />
        </div>
        <h1 className="font-display text-3xl font-normal">Verify your email</h1>
        {isValid ? (
          <ConfirmEmailVerificationForm token={token} />
        ) : (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            This verification link is invalid or has expired.
          </p>
        )}
      </div>
      <ImprintLink />
    </main>
  );
}
