import Link from "next/link";
import { LogoBackdrop } from "@/components/logo-backdrop";

export default function NotFound() {
  return (
    <LogoBackdrop>
      <div className="flex flex-col items-center gap-6 text-center">
        <div>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">404</p>
          <h1 className="font-display text-title-1 font-bold mt-1">Page not found</h1>
          <p className="text-sm text-neutral-600 mt-2 dark:text-neutral-400">
            The page you&apos;re looking for doesn&apos;t exist or may have moved.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-full bg-ink text-paper px-5 py-2.5 text-sm font-medium hover:bg-graphite transition"
        >
          Back to dashboard
        </Link>
      </div>
    </LogoBackdrop>
  );
}
