import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Logo } from "@/components/logo";

export default function ForgotPasswordPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex justify-center">
          <Logo large />
        </div>
        <div className="text-center">
          <h1 className="font-display text-3xl font-normal">Reset your password</h1>
          <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">Enter your account email.</p>
        </div>
        <ForgotPasswordForm />
        <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
          <Link href="/login" className="font-medium text-neutral-900 underline dark:text-neutral-100">
            Back to log in
          </Link>
        </p>
      </div>
    </main>
  );
}
