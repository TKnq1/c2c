"use client";

import { useEffect } from "react";
import { captureClientError } from "@/lib/sentry-client";

// Only fires when the root layout itself throws — a much rarer, more
// severe case than error.tsx (which can't catch errors in its own parent).
// Renders its own <html>/<body> and stays free of Tailwind/globals.css and
// app components (Logo, tokens): the root layout is exactly what may have
// just failed, so nothing from it can be trusted to still work. Same
// hardcoded-token approach as public/offline.html, for the same reason.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
    captureClientError(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          background: "#ffffff",
          color: "#070707",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Public file, not an app component: the root layout may be what
            just failed. Same watermark as the other error screens. */}
        <img
          src="/logo.png"
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            height: "min(168vmin, 78rem)",
            width: "auto",
            transform: "translate(-50%, -50%)",
            opacity: 0.11,
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0, position: "relative" }}>Something went wrong</h1>
        <p style={{ color: "#797979", margin: 0, maxWidth: 320, lineHeight: 1.5, position: "relative" }}>
          comtor hit an unexpected error. Reloading usually fixes it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8,
            position: "relative",
            borderRadius: 4,
            border: "none",
            background: "#070707",
            color: "#ffffff",
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
