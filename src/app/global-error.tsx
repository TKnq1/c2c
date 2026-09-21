"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Only fires when the root layout itself throws — a much rarer, more
// severe case than error.tsx (which can't catch errors in its own parent).
// Renders its own <html>/<body> and stays free of Tailwind/globals.css and
// app components (Logo, tokens): the root layout is exactly what may have
// just failed, so nothing from it can be trusted to still work. Same
// hardcoded-token approach as public/offline.html, for the same reason.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
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
          background: "#ffffff",
          color: "#070707",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Something went wrong</h1>
        <p style={{ color: "#797979", margin: 0, maxWidth: 320, lineHeight: 1.5 }}>
          C2C hit an unexpected error. Reloading usually fixes it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8,
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
