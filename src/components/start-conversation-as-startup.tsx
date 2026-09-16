import Link from "next/link";
import { startConversationAsStartupAction } from "@/lib/actions/requests";
import { Select } from "@/components/select";

type Props = {
  creatorId: string;
  existingInterestId: string | null;
  openRequests: { id: string; title: string }[];
};

const buttonClassName =
  "rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition";

export function StartConversationAsStartup({ creatorId, existingInterestId, openRequests }: Props) {
  if (existingInterestId) {
    return (
      <Link href={`/dashboard/messages/${existingInterestId}`} className={buttonClassName}>
        Message
      </Link>
    );
  }

  if (openRequests.length === 0) {
    return (
      <p className="text-xs text-neutral-500 max-w-[200px] text-right dark:text-neutral-400">
        Post a request to message this creator.
      </p>
    );
  }

  return (
    <form action={startConversationAsStartupAction.bind(null, creatorId)} className="flex items-center gap-2">
      <Select name="requestId" required aria-label="Which request is this about?" wrapperClassName="w-44">
        <option value="">Message about…</option>
        {openRequests.map((r) => (
          <option key={r.id} value={r.id}>
            {r.title}
          </option>
        ))}
      </Select>
      <button type="submit" className={buttonClassName}>
        Message
      </button>
    </form>
  );
}
