import { Layers } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen bg-charcoal">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-amber/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-amber/5 blur-3xl" />
      </div>

      {/* Top bar with logo */}
      <div className="relative z-10 flex items-center justify-center py-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber to-amber-dark">
            <Layers className="h-4 w-4 text-charcoal" />
          </div>
          <span className="text-lg font-semibold text-text">Sediment</span>
        </Link>
      </div>

      {children}
    </div>
  );
}
