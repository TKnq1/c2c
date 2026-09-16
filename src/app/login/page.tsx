import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { DeletedAccountToast } from "@/components/deleted-account-toast";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <DeletedAccountToast />
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex justify-center">
          <Logo large />
        </div>
        <div className="text-center">
          <h1 className="font-display text-3xl font-normal">Welcome back</h1>
          <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">Log in to your account.</p>
        </div>
        <LoginForm />
        <p className="text-sm text-center text-neutral-600 flex flex-col gap-1 dark:text-neutral-400">
          <Link href="/forgot-password" className="font-medium text-neutral-900 underline dark:text-neutral-100">
            Forgot password?
          </Link>
          <span>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-neutral-900 underline dark:text-neutral-100">
              Sign up
            </Link>
          </span>
        </p>
      </div>
    </main>
  );
}
