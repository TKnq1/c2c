"use client";

import { useActionState, useRef } from "react";
import { sendMessageAction } from "@/lib/actions/messages";

export function MessageForm({ interestId }: { interestId: string }) {
  const [state, formAction, pending] = useActionState(sendMessageAction.bind(null, interestId), undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Enter sends (matches every chat app); Shift+Enter still inserts a
  // newline, same as the textarea's own default for that combination.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // nativeEvent.isComposing: Enter during an IME composition (e.g.
    // confirming a Japanese/Chinese candidate) shouldn't send — it's
    // finishing a character, not finishing the message.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

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
          onKeyDown={handleKeyDown}
          // text-base (16px): below that, iOS Safari zooms the whole page
          // in on focus. Back to text-sm on desktop, where it's just a
          // font size, not a zoom trigger.
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-base md:text-sm resize-none dark:border-neutral-700"
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
