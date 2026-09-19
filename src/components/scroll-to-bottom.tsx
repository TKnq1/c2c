"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Keeps a scrollable container pinned to its latest content — on mount, and
// again whenever `watch` changes (e.g. the message count after a send).
export function ScrollToBottom({
  children,
  className,
  watch,
}: {
  children: ReactNode;
  className?: string;
  watch: string | number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [watch]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
