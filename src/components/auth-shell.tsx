import { PhoneMockup } from "@/components/phone-mockup";

// The frame around login, signup and the password pages. Phones and
// tablets: the form centered on its own, as before. From lg: split screen,
// the form on the left and comtor itself on the right, in the same style as
// the home page (claim, soft glow, the app in a phone).
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 lg:grid lg:grid-cols-2">
      <div className="flex min-h-full items-center justify-center px-6 py-16">{children}</div>

      <aside
        aria-hidden="true"
        className="relative hidden flex-col items-center justify-center gap-12 overflow-hidden bg-fog px-12 py-16 lg:flex"
      >
        <div className="max-w-md text-center">
          <p className="font-display text-3xl font-normal text-balance">Brands and creators, one place for every collab.</p>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            Match by niche and reach, agree on a price in the chat, and get paid through escrow once the post is live.
          </p>
        </div>
        <div className="relative">
          <div className="absolute inset-0 m-auto h-[360px] w-[360px] rounded-full bg-stone/30 blur-[70px]" />
          <div className="relative h-[440px] w-[280px] overflow-hidden">
            <PhoneMockup role="CREATOR" className="absolute left-0 top-0 w-full" />
            {/* The phone runs past the frame; fade it out instead of a hard cut. */}
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-fog to-transparent" />
          </div>
        </div>
      </aside>
    </main>
  );
}
