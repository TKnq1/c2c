import type { Metadata } from "next";
import { confirmOutreachOptOut } from "@/lib/actions/outreach-opt-out";
import { isOutreachSide, outreachOptOutMatches } from "@/lib/outreach-opt-out";
import { NO_INDEX, metadataFor } from "@/lib/seo";

export const generateMetadata = (): Promise<Metadata> =>
  metadataFor({ title: "Stop these emails", robots: NO_INDEX }, { title: "Diese E-Mails abbestellen", robots: NO_INDEX });

export default async function OutreachOptOutPage(props: PageProps<"/outreach/opt-out">) {
  const params = await props.searchParams;
  if (params.done === "1") {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col gap-3 px-6 py-16">
        <h1 className="font-display text-title-2 font-bold">These emails will stop</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">The address is off the list. We will not send another note like this.</p>
      </main>
    );
  }

  const email = typeof params.email === "string" ? params.email : "";
  const side = typeof params.side === "string" ? params.side : "";
  const token = typeof params.token === "string" ? params.token : "";
  const valid = isOutreachSide(side) && outreachOptOutMatches(email, side, token);

  if (!valid) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col gap-3 px-6 py-16">
        <h1 className="font-display text-title-2 font-bold">This link doesn’t work</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Write to info@comtor.app and we will take the address off.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-4 px-6 py-16">
      <h1 className="font-display text-title-2 font-bold">Stop these emails</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {email.trim().toLowerCase()} will be removed from the list. Account emails, if you have an account, are not affected.
      </p>
      <form action={confirmOutreachOptOut}>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="side" value={side} />
        <input type="hidden" name="token" value={token} />
        <button type="submit" className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper">
          Remove this address
        </button>
      </form>
    </main>
  );
}
