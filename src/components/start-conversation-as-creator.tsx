import Link from "next/link";
import { startConversationAsCreatorAction } from "@/lib/actions/requests";
import { Select } from "@/components/select";

type Props = {
  existingInterestId: string | null;
  matchingRequests: { id: string; title: string }[];
};

const buttonClassName =
  "rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition";

export function StartConversationAsCreator({ existingInterestId, matchingRequests }: Props) {
  if (existingInterestId) {
    return (
      <Link href={`/dashboard/messages/${existingInterestId}`} className={buttonClassName}>
        Message
      </Link>
    );
  }

  if (matchingRequests.length === 0) {
    return (
      <p className="text-xs text-neutral-500 max-w-[200px] text-right dark:text-neutral-400">
        You don&apos;t currently match any of their open requests.
      </p>
    );
  }

  return (
    <form action={startConversationAsCreatorAction} className="flex items-center gap-2">
      <Select name="requestId" required aria-label="Which request is this about?" wrapperClassName="w-44">
        <option value="">Message about…</option>
        {matchingRequests.map((r) => (
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
