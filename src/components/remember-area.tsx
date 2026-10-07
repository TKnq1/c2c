"use client";

import { useEffect } from "react";
import { HOME_COOKIE, type HomeArea } from "@/lib/home-redirect";

// Notes which area an admin used last, so the installed dashboard opens there (see home-redirect.ts). Written by the page
// itself, when it is shown: a link the browser only prefetches and a request the service worker passes on look the same to
// the server as a real visit, so the server cannot tell where the person really is.
export function RememberArea({ area }: { area: HomeArea }) {
  useEffect(() => {
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${HOME_COOKIE}=${area}; path=/; max-age=31536000; samesite=lax${secure}`;
  }, [area]);
  return null;
}
