import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/signup-form";
import { Logo } from "@/components/logo";
import { ImprintLink } from "@/components/imprint-link";
import { canonical } from "@/lib/seo";
import { parseSignupRole } from "@/lib/signup-role";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a brand or creator account on comtor.",
  alternates: canonical("/signup"),
};

// ?role=creator or ?role=brand comes from the landing page, which knows which
// side the visitor was looking at (see SignupLink).
export default async function SignupPage(props: PageProps<"/signup">) {
  const initialRole = parseSignupRole((await props.searchParams).role);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex justify-center">
          <Logo large />
        </div>
        <div className="text-center">
          <h1 className="font-display text-title-1 font-bold">Create your account</h1>
          <p className="text-sm text-neutral-600 mt-1 dark:text-neutral-400">Get started as a brand or a creator.</p>
        </div>
        <SignupForm initialRole={initialRole} />
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
      <ImprintLink />
    </main>
  );
}
