import type { OutreachSide } from "@prisma/client";
import { LocalDate } from "@/components/local-date";

type Recipient = {
  id: string;
  name: string;
  email: string;
  openCount: number;
  clickCount: number;
};

export type SentMailing = {
  id: string;
  side: OutreachSide;
  subject: string;
  createdAt: number;
  recipients: Recipient[];
};

function status(recipient: Recipient) {
  if (recipient.clickCount > 0) return "Clicked";
  if (recipient.openCount > 0) return "Opened";
  return "Not opened";
}

// The archive of mails that already went out. Each send is its own list of
// people, kept even after an address is removed from the creator or brand list.
export function SentMailings({ mailings }: { mailings: SentMailing[] }) {
  return (
    <section className="flex flex-col gap-4 rounded border border-ink/10 p-4">
      <div>
        <h2 className="font-display text-title-3 font-bold">
          Sent <span className="tabular-nums text-neutral-500">{mailings.length}</span>
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Every mail that went out, and who received it.
        </p>
      </div>

      {mailings.length === 0 ? (
        <p className="text-sm text-neutral-500">Nothing sent yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {mailings.map((mailing) => {
            const opened = mailing.recipients.filter((recipient) => recipient.openCount > 0).length;
            const clicked = mailing.recipients.filter((recipient) => recipient.clickCount > 0).length;
            return (
              <article key={mailing.id} className="rounded bg-fog">
                <header className="px-3 py-2.5">
                  <h3 className="text-sm font-medium">{mailing.subject}</h3>
                  <p className="mt-0.5 text-footnote text-neutral-500">
                    {mailing.side === "CREATOR" ? "Creators" : "Brands"}
                    {" · "}
                    <LocalDate ms={mailing.createdAt} withTime />
                    {` · Sent ${mailing.recipients.length} · Opened ${opened} · Clicked ${clicked}`}
                  </p>
                </header>
                <ul>
                  {mailing.recipients.map((recipient) => (
                    <li
                      key={recipient.id}
                      className="flex items-center justify-between gap-3 border-t border-ink/10 px-3 py-2.5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{recipient.name}</span>
                        <span className="block truncate text-footnote text-neutral-500">{recipient.email}</span>
                      </span>
                      <span className="shrink-0 text-footnote text-neutral-500">{status(recipient)}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
