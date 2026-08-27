"use client";

import { Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

const plans = [
  {
    key: "STARTER" as const,
    name: "Starter",
    price: "₹1",
    period: "/day",
    description: "24-hour access to test all features",
    features: [
      "All features for 24 hours",
      "1 project",
      "Up to 5 team members",
    ],
    highlighted: false,
  },
  {
    key: "PRO" as const,
    name: "Pro",
    price: "₹499",
    period: "/month",
    description: "For small teams getting started with async standups",
    features: [
      "Unlimited projects",
      "Unlimited team members",
      "Custom standup prompts",
      "Analytics dashboard",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    key: "BUSINESS" as const,
    name: "Business",
    price: "₹1,499",
    period: "/month",
    description: "For growing teams that need advanced features",
    features: [
      "Everything in Pro",
      "Custom branding",
      "API access",
      "Advanced analytics",
      "Dedicated support",
    ],
    highlighted: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { session } = useAuth();
  const utils = trpc.useUtils();
  const { data: currentPlan } = trpc.billing.currentPlan.useQuery(undefined, { retry: false });
  const toggleAutoRenew = trpc.billing.toggleAutoRenew.useMutation({
    onSuccess: async () => {
      await utils.billing.currentPlan.invalidate();
      toast.success("Auto-renew updated");
    },
    onError: (err) => toast.error(err.message),
  });
  const cancelAutoRenew = trpc.billing.cancelAutoRenew.useMutation({
    onSuccess: async () => {
      await utils.billing.currentPlan.invalidate();
      toast.success("Auto-renew cancelled — you'll keep access until the expiry date");
    },
    onError: (err) => toast.error(err.message),
  });
  const downgradeToFree = trpc.billing.downgradeToFree.useMutation({
    onSuccess: async () => {
      await utils.billing.currentPlan.invalidate();
      toast.success("Subscription cancelled — you're now on the Free plan");
      router.push("/pricing");
    },
    onError: (err) => toast.error(err.message),
  });
  const createSubscription = trpc.billing.createSubscription.useMutation({
    onSuccess: (data) => {
      openRazorpay(data);
    },
    onError: (err) => toast.error(err.message),
  });
  const verifySubscription = trpc.billing.verifySubscription.useMutation({
    onSuccess: async (data) => {
      await utils.billing.currentPlan.invalidate();
      toast.success(`Upgraded to ${data.plan}!`);
      router.push("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  function openRazorpay(data: {
    subscriptionId: string;
    amount: number;
    currency: string;
    keyId: string;
    plan: "STARTER" | "PRO" | "BUSINESS";
    description: string;
  }) {
    const options = {
      key: data.keyId,
      subscription_id: data.subscriptionId,
      name: "Sediment",
      description: data.description,
      handler: (response: {
        razorpay_subscription_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        verifySubscription.mutate({
          razorpaySubscriptionId: response.razorpay_subscription_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          plan: data.plan,
        });
      },
      prefill: {
        email: session?.user?.email || "",
        name: session?.user?.name || "",
      },
      theme: {
        color: "#D97706",
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  }

  function handleChoosePlan(plan: "STARTER" | "PRO" | "BUSINESS") {
    if (!session) {
      router.push("/sign-in");
      return;
    }
    createSubscription.mutate({ plan });
  }

  const planRank: Record<string, number> = {
    FREE: 0,
    STARTER: 1,
    PRO: 2,
    BUSINESS: 3,
  };

  const currentRank =
    currentPlan?.isActive && currentPlan.plan
      ? planRank[currentPlan.plan] ?? 0
      : 0;

  // Only show plans strictly higher than the user's current active tier
  const visiblePlans = plans.filter((plan) => planRank[plan.key] > currentRank);

  return (
    <>
      <main className="min-h-screen bg-charcoal pt-24 pb-16 px-4">
        <div className="mx-auto max-w-4xl text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-text-muted text-lg">
            Choose the plan that fits your team. No hidden fees, cancel anytime.
          </p>
        </div>

        {currentPlan?.isActive && (
          <div className="mx-auto max-w-4xl mb-8">
            <div className="rounded-2xl border border-amber/30 bg-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-text flex items-center gap-2">
                    Your {currentPlan.plan === "BUSINESS" ? "Business" : currentPlan.plan === "PRO" ? "Pro" : "Starter"} Subscription
                  </h3>
                  <p className="text-sm text-text-muted mt-1">Currently active</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1">
                  Active
                </span>
              </div>
              <div className="mb-4 rounded-xl border border-border-custom bg-charcoal p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-text-muted mb-0.5">Billing period</p>
                    <p className="text-sm font-semibold text-text">
                      {currentPlan.startedAt
                        ? new Date(currentPlan.startedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                      <span className="text-text-muted font-normal mx-2">→</span>
                      {currentPlan.expiresAt
                        ? new Date(currentPlan.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted mb-0.5">
                      {currentPlan.autoRenew ? "Renews in" : "Expires in"}
                    </p>
                    <p className="text-sm font-semibold text-amber">
                      {currentPlan.expiresAt
                        ? (() => {
                            const days = Math.max(
                              0,
                              Math.ceil(
                                (new Date(currentPlan.expiresAt).getTime() - Date.now()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            );
                            return `${days} day${days === 1 ? "" : "s"}`;
                          })()
                        : "—"}
                    </p>
                  </div>
                </div>
                {currentPlan.startedAt && currentPlan.expiresAt && (
                  <div className="w-full h-1.5 rounded-full bg-surface-raised overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber to-amber-dark transition-all"
                      style={{
                        width: `${(() => {
                          const start = new Date(currentPlan.startedAt).getTime();
                          const end = new Date(currentPlan.expiresAt).getTime();
                          const now = Date.now();
                          const pct = ((now - start) / (end - start)) * 100;
                          return Math.min(100, Math.max(0, pct));
                        })()}%`,
                      }}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-text-muted">Start</span>
                  <span className="text-[10px] text-text-muted">End</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border-custom bg-charcoal px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text">Auto-renew subscription</p>
                  <p className="text-xs text-text-muted">
                    {currentPlan.autoRenew
                      ? "Your plan will renew automatically on the expiry date"
                      : "Your plan will end on the expiry date"}
                  </p>
                </div>
                <button
                  onClick={() => toggleAutoRenew.mutate({ autoRenew: !currentPlan.autoRenew })}
                  disabled={toggleAutoRenew.isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    currentPlan.autoRenew ? "bg-amber" : "bg-surface-raised"
                  }`}
                  aria-label="Toggle auto-renew"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      currentPlan.autoRenew ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="mt-4 border-t border-border-custom pt-4 flex flex-col sm:flex-row gap-3">
                {currentPlan.autoRenew && (
                  <button
                    onClick={() => cancelAutoRenew.mutate()}
                    disabled={cancelAutoRenew.isPending}
                    className="flex-1 rounded-lg border border-border-custom py-2 text-sm font-medium text-text hover:bg-surface-raised/60 transition-colors"
                  >
                    {cancelAutoRenew.isPending ? "Cancelling..." : "Cancel auto-renew"}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (window.confirm("Cancel your subscription now and downgrade to the Free plan immediately?")) {
                      downgradeToFree.mutate();
                    }
                  }}
                  disabled={downgradeToFree.isPending}
                  className="flex-1 rounded-lg border border-red-500/40 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  {downgradeToFree.isPending ? "Cancelling..." : "Cancel subscription now"}
                </button>
              </div>
            </div>
          </div>
        )}

        {visiblePlans.length > 0 ? (
          <div className={`mx-auto max-w-5xl grid gap-6 ${visiblePlans.length === 1 ? "md:grid-cols-1 max-w-md" : visiblePlans.length === 2 ? "md:grid-cols-2 max-w-3xl" : "md:grid-cols-3"}`}>
            {visiblePlans.map((plan) => (
              <div
                key={plan.key}
                className={`rounded-2xl border p-8 ${
                  plan.highlighted
                    ? "border-amber bg-surface shadow-lg shadow-amber/5"
                    : "border-border-custom bg-surface"
                }`}
              >
                {plan.highlighted && (
                  <span className="text-xs font-semibold text-amber uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <h2 className="text-xl font-bold text-text mt-2">{plan.name}</h2>
                <p className="text-sm text-text-muted mt-1">{plan.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-text">{plan.price}</span>
                  <span className="text-text-muted">{plan.period}</span>
                </div>

                <button
                  onClick={() => handleChoosePlan(plan.key)}
                  disabled={createSubscription.isPending}
                  className={`mt-6 w-full rounded-lg py-3 text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? "bg-amber text-charcoal hover:bg-amber-light"
                      : "bg-surface-raised text-text hover:bg-surface-raised/80 border border-border-custom"
                  }`}
                >
                  {createSubscription.isPending ? "Processing..." : `Get ${plan.name}`}
                </button>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-text-muted">
                      <Check className="h-4 w-4 text-amber shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-lg text-center rounded-2xl border border-amber/30 bg-surface p-8">
            <h3 className="text-lg font-semibold text-text mb-2">
              You&apos;re on our top plan 🎉
            </h3>
            <p className="text-sm text-text-muted">
              You have the Business plan — the highest tier with every feature unlocked. There&apos;s nothing more to upgrade to.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
