"use client";

import { useTransition } from "react";
import { toast } from "@/lib/toast";
import { errorMessage } from "@/lib/error-message";

type Props = {
  action: () => Promise<void>;
  successMessage: string;
  children: React.ReactNode;
  className?: string;
  pendingChildren?: React.ReactNode;
  confirmMessage?: string;
  onSuccess?: () => void;
};

// Drop-in replacement for `<form action={serverAction.bind(...)}><button>`
// for actions with no useActionState of their own: calling the action
// directly (rather than via native <form action>) lets us catch a thrown
// error as a toast instead of it blowing up the whole page via error.tsx,
// and confirm success with a toast too.
export function ActionButton({
  action,
  successMessage,
  children,
  className,
  pendingChildren,
  confirmMessage,
  onSuccess,
}: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={() => {
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        startTransition(async () => {
          try {
            await action();
            toast.success(successMessage);
            onSuccess?.();
          } catch (err) {
            toast.error(errorMessage(err));
          }
        });
      }}
    >
      {pending && pendingChildren ? pendingChildren : children}
    </button>
  );
}
