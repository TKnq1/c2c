"use client";

import { useEffect } from "react";
import { markNotificationsReadAction } from "@/lib/actions/notifications";

// Fires once the notifications page has mounted, so opening it clears the
// unread badge for the next navigation without blocking this page's render.
export function MarkNotificationsRead() {
  useEffect(() => {
    markNotificationsReadAction();
  }, []);

  return null;
}
