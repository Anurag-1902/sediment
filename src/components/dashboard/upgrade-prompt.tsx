"use client";

import { trpc } from "@/lib/trpc";
import { AnimatedIcon } from "@/components/animated-icon";
import { Sparkles, X } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export function UpgradePrompt() {
  const { data: planData, isLoading } = trpc.billing.currentPlan.useQuery(undefined, {
    retry: false,
  });
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isLoading && planData && !planData.isActive && !dismissed) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, planData, dismissed]);

  if (isLoading || !planData || planData.isActive || dismissed || !visible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="rounded-2xl border border-amber/30 bg-surface shadow-2xl shadow-amber/10 p-5">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-text-muted hover:text-text transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/15">
            <AnimatedIcon icon={Sparkles} className="h-4 w-4 text-amber" />
          </div>
          <h3 className="text-sm font-semibold text-text">Upgrade to Pro</h3>
        </div>
        <p className="text-xs text-text-muted mb-4 leading-relaxed">
          Unlock unlimited projects, custom standup prompts, analytics, and priority support.
        </p>
        <Link href="/pricing">
          <button className="w-full rounded-lg bg-amber py-2 text-sm font-semibold text-charcoal hover:bg-amber-light transition-colors">
            View Plans
          </button>
        </Link>
      </div>
    </div>
  );
}
