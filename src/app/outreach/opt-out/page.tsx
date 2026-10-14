import type { Metadata } from "next";
import { confirmOutreachOptOut } from "@/lib/actions/outreach-opt-out";
import { isOutreachSide, outreachOptOutMatches } from "@/lib/outreach-opt-out";
import { NO_INDEX } from "@/lib/seo";
import { getT } from "@/lib/i18n/server";

export const generateMetadata = async (): Promise<Metadata> => ({
  title: (await getT())("extras.meta.optOut"),
  robots: NO_INDEX,
});

export default async function OutreachOptOutPage(props: PageProps<"/outreach/opt-out">) {
  const t = await getT();
  const params = await props.searchParams;
  if (params.done === "1") {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col gap-3 px-6 py-16">
        <h1 className="font-display text-title-2 font-bold">{t("extras.optOut.doneTitle")}</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("extras.optOut.doneBody")}</p>
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
        <h1 className="font-display text-title-2 font-bold">{t("extras.optOut.invalidTitle")}</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("extras.optOut.invalidBody")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-4 px-6 py-16">
      <h1 className="font-display text-title-2 font-bold">{t("extras.optOut.title")}</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{t("extras.optOut.body", { email: email.trim().toLowerCase() })}</p>
      <form action={confirmOutreachOptOut}>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="side" value={side} />
        <input type="hidden" name="token" value={token} />
        <button type="submit" className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper">
          {t("extras.optOut.button")}
        </button>
      </form>
    </main>
  );
}
