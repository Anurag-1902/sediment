"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GLOBAL ERROR]", error?.message, error?.stack, error?.digest);
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, background: "#1a1a1a", color: "#fff", fontFamily: "sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ textAlign: "center", maxWidth: "400px" }}>
            <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>Something went wrong</h1>
            <p style={{ color: "#999", marginBottom: "24px" }}>
              A critical error occurred. Please refresh the page.
            </p>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px", color: "#f87171", textAlign: "left", marginBottom: "24px" }}>{error?.message}</pre>
            <p style={{ color: "#999", fontSize: "12px" }}>digest: {error?.digest}</p>
            <button
              onClick={() => reset()}
              style={{ background: "#D97706", color: "#1a1a1a", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", marginTop: "16px" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
