"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ margin: 0, background: "#1a1a1a", color: "#fff", fontFamily: "sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ textAlign: "center", maxWidth: "400px" }}>
            <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>Something went wrong</h1>
            <p style={{ color: "#999", marginBottom: "24px" }}>
              A critical error occurred. Please refresh the page.
            </p>
            <button
              onClick={() => reset()}
              style={{ background: "#D97706", color: "#1a1a1a", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
