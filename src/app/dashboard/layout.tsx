"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/sign-in");
    }
  }, [isLoading, session, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-charcoal">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-charcoal">
      {/* Ambient amber glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-amber/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-amber/5 blur-3xl" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
