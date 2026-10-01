import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { Logo } from "@/components/logo";
import { ImprintLink } from "@/components/imprint-link";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  const isValid = !!resetToken && !resetToken.usedAt && resetToken.expiresAt > new Date();

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex justify-center">
          <Logo large />
        </div>
        <div className="text-center">
          <h1 className="font-display text-title-1 font-bold">Set a new password</h1>
        </div>
        {isValid ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
            This reset link is invalid or has expired.{" "}
            <Link href="/forgot-password" className="font-medium text-neutral-900 underline dark:text-neutral-100">
              Request a new one
            </Link>
          </p>
        )}
      </div>
      <ImprintLink />
    </main>
  );
}
