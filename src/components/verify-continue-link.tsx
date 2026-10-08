import Link from "next/link";

// The one obvious next step once an email is confirmed.
export function VerifyContinueLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="w-full rounded-full bg-ink px-4 py-3.5 text-center font-medium text-paper transition hover:bg-graphite"
    >
      {label}
    </Link>
  );
}
