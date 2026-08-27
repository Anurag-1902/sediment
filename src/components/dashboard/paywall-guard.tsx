"use client";

import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function PaywallGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: plan, isLoading } = trpc.billing.currentPlan.useQuery();

  useEffect(() => {
    if (!isLoading && plan && !plan.isActive) {
      router.replace("/pricing");
    }
  }, [plan, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-charcoal">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </div>
    );
  }

  if (!plan?.isActive) {
    return null;
  }

  return <>{children}</>;
}
