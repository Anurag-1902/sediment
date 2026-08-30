import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-charcoal flex items-center justify-center px-4">
      <div className="rounded-2xl border border-border-custom bg-surface p-8 text-center max-w-md">
        <p className="text-amber text-5xl font-bold mb-2">404</p>
        <h1 className="text-xl font-bold text-text mb-2">Page not found</h1>
        <p className="text-text-muted mb-6">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-lg bg-amber text-charcoal px-5 py-2.5 text-sm font-semibold hover:bg-amber-light transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
