"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-charcoal flex items-center justify-center px-4">
      <div className="rounded-2xl border border-border-custom bg-surface p-8 text-center max-w-md">
        <h1 className="text-2xl font-bold text-text mb-2">Something went wrong</h1>
        <p className="text-text-muted mb-6">
          An unexpected error occurred. You can try again, or head back to your dashboard.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="rounded-lg bg-amber text-charcoal px-5 py-2.5 text-sm font-semibold hover:bg-amber-light transition-colors"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border border-border-custom text-text px-5 py-2.5 text-sm font-semibold hover:bg-surface-raised transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
