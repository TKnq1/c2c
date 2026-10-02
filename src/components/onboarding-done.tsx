import Link from "next/link";
import type { IconType } from "react-icons";
import {
  IoCheckmark,
  IoChevronForward,
  IoMailOutline,
  IoPersonOutline,
  IoSearchOutline,
  IoWalletOutline,
} from "react-icons/io5";

type NextStep = { href: string; icon: IconType; title: string; description: string };

// The wizard's last screen: what to do next, with the main thing as the
// button and the rest as a short list.
export function OnboardingDone({
  role,
  name,
  emailVerified,
}: {
  role: "brand" | "creator";
  name: string;
  emailVerified: boolean;
}) {
  const settings = role === "brand" ? "/dashboard/startup/settings" : "/dashboard/creator/settings";
  const steps: NextStep[] = [
    ...(emailVerified
      ? []
      : [{ href: "/dashboard/verify-email", icon: IoMailOutline, title: "Verify your email", description: "So you don't miss offers and messages." }]),
    ...(role === "brand"
      ? [{ href: "/dashboard/startup/discover", icon: IoSearchOutline, title: "Browse creators", description: "Find people in your niche and reach out." }]
      : [{ href: `${settings}#payouts`, icon: IoWalletOutline, title: "Set up payouts", description: "Needed before a brand can pay you." }]),
    {
      href: `${settings}#profile`,
      icon: IoPersonOutline,
      title: "Complete your profile",
      description: role === "brand" ? "A short description, website and links." : "A short bio and your content language.",
    },
  ];
  const primary =
    role === "brand"
      ? { href: "/dashboard/startup/new", label: "Post your first request" }
      : { href: "/dashboard/creator", label: "Go to my feed" };
  const secondary = role === "brand" ? { href: "/dashboard/startup", label: "Go to dashboard" } : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="animate-pop-in flex h-16 w-16 items-center justify-center rounded-full bg-ink text-paper">
          <IoCheckmark className="h-8 w-8" aria-hidden />
        </span>
        <div>
          <h1 className="font-display text-title-1 font-bold text-balance">You&apos;re all set, {name}</h1>
          <p className="mt-1.5 text-neutral-600 dark:text-neutral-400">
            {role === "brand"
              ? "Post a request and matching creators will find it in their feed."
              : "Your feed is ready with requests that match your niches and reach."}
          </p>
        </div>
      </div>

      <ul className="rounded bg-fog">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="animate-stagger-fade-in border-ink/10 [&+&]:border-t"
            style={{ animationDelay: `${150 + i * 70}ms` }}
          >
            <Link href={s.href} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-ink/5">
              <s.icon className="h-5 w-5 shrink-0 text-neutral-600 dark:text-neutral-400" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{s.title}</span>
                <span className="block text-footnote text-neutral-500 dark:text-neutral-400">{s.description}</span>
              </span>
              <IoChevronForward className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-center gap-3">
        <Link
          href={primary.href}
          className="w-full rounded-full bg-ink px-4 py-3 text-center font-medium text-paper transition hover:bg-graphite"
        >
          {primary.label}
        </Link>
        {secondary && (
          <Link href={secondary.href} className="text-sm text-neutral-500 transition hover:text-ink dark:text-neutral-400">
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}
