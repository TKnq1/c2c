import type { IconType } from "react-icons";
import { FiAlertTriangle, FiCheckSquare, FiCreditCard, FiFileText, FiFlag, FiLogIn, FiMessageCircle, FiMessageSquare, FiUserPlus } from "react-icons/fi";
import type { TimelineEvent, TimelineKind } from "@/lib/admin-timeline";
import { LocalDate } from "@/components/local-date";

const ICON: Record<TimelineKind, IconType> = {
  account: FiUserPlus,
  onboarding: FiCheckSquare,
  request: FiFileText,
  collab: FiMessageSquare,
  message: FiMessageCircle,
  payment: FiCreditCard,
  report: FiFlag,
  login: FiLogIn,
  moderation: FiAlertTriangle,
};

const SHOWN = 12;

function Item({ event }: { event: TimelineEvent }) {
  const Icon = ICON[event.kind];
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      <span className="absolute top-7 bottom-0 left-[13px] w-px bg-ink/10 last:hidden" aria-hidden />
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper text-graphite">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm">{event.text}</p>
        <p className="text-xs text-neutral-500">
          <LocalDate ms={event.at.getTime()} locale="de-DE" withTime />
        </p>
      </div>
    </li>
  );
}

// What happened to the account, newest first: sign-up, onboarding, requests, collabs, payments, reports, sign-ins. The
// first dozen are shown; the rest sit behind one click.
export function UserTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) return <p className="rounded bg-fog px-4 py-3 text-sm text-neutral-500">Noch nichts aufgezeichnet.</p>;
  const first = events.slice(0, SHOWN);
  const rest = events.slice(SHOWN);
  return (
    <div className="rounded bg-fog px-4 py-4">
      <ol>
        {first.map((e, i) => (
          <Item key={i} event={e} />
        ))}
      </ol>
      {rest.length > 0 && (
        <details className="mt-3 border-t border-ink/10 pt-3">
          <summary className="cursor-pointer text-sm font-bold">Weitere {rest.length} anzeigen</summary>
          <ol className="mt-3">
            {rest.map((e, i) => (
              <Item key={i} event={e} />
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
