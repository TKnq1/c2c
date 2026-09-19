"use client";

import { useEffect, useState, type ReactNode } from "react";

// iOS Safari doesn't support the interactive-widget viewport meta (Chrome/
// Android does), and position: fixed there isn't reliably pinned above the
// keyboard either — the layout viewport (and any dvh/vh sizing based on it)
// simply never shrinks for the keyboard. window.visualViewport is what
// Safari DOES support: it reports the actual visible height and fires a
// resize event as the keyboard opens/closes, so this tracks that directly
// via JS instead of trusting a CSS viewport unit to do it. Desktop (md+)
// never gets an inline height — the confined-card md: classes on the
// element this wraps stay in full control there.
export function MobileChatFrame({ children, className }: { children: ReactNode; className: string }) {
  const [mobileHeight, setMobileHeight] = useState<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      setMobileHeight(isMobile ? vv.height : null);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div className={className} style={mobileHeight !== null ? { height: `${mobileHeight}px` } : undefined}>
      {children}
    </div>
  );
}
