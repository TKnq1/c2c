import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/signup-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a brand or creator account on C2C.",
};

export default function SignupPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex justify-center">
          <Logo large />
        </div>
        <div className="text-center">
          <h1 className="font-display text-3xl font-normal">Create your account</h1>
          <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">Get started as a brand or a creator.</p>
        </div>
        <SignupForm />
        <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-neutral-900 underline dark:text-neutral-100">
            Log in
          </Link>
        </p>
        <p className="text-xs text-center text-neutral-400 dark:text-neutral-500">
          By signing up you agree to our{" "}
          <Link href="/legal/terms" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
