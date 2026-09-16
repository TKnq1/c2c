"use client";

import { useActionState, useRef } from "react";
import { sendMessageAction } from "@/lib/actions/messages";

export function MessageForm({ interestId }: { interestId: string }) {
  const [state, formAction, pending] = useActionState(sendMessageAction.bind(null, interestId), undefined);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData: FormData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-2"
    >
      <div className="flex gap-2 items-center">
        <textarea
          name="body"
          required
          rows={1}
          placeholder="Write a message…"
          aria-label="Message"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm resize-none dark:border-neutral-700"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-graphite transition disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send"}
        </button>
      </div>
      {state?.error && <p className="text-sm text-ink">{state.error}</p>}
    </form>
  );
}
