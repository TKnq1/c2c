"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Keeps a scrollable container pinned to its latest content — on mount, and
// again whenever `watch` changes (e.g. the message count after a send).
export function ScrollToBottom({
  children,
  className,
  watch,
  dismissKeyboardOnScroll,
}: {
  children: ReactNode;
  className?: string;
  watch: string | number;
  // Blurs whatever's focused (e.g. the message textarea) the moment this
  // list is scrolled — same as iMessage/WhatsApp: scrolling through history
  // closes the keyboard and hands the screen back to the chat, rather than
  // scrolling underneath a keyboard that's still up.
  dismissKeyboardOnScroll?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [watch]);

  return (
    <div
      ref={ref}
      className={className}
      onScroll={dismissKeyboardOnScroll ? () => (document.activeElement as HTMLElement | null)?.blur() : undefined}
    >
      {children}
    </div>
  );
}
