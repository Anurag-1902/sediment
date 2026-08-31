"use client";

import { Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PricingComparison } from "./components/pricing-comparison";

const plans = [
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
  const createOneTimeOrder = trpc.billing.createOneTimeOrder.useMutation({
    onSuccess: (data) => {
      openRazorpayOneTime(data);
    },
    onError: (err) => toast.error(err.message),
  });
  const verifyOneTimePayment = trpc.billing.verifyOneTimePayment.useMutation({
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
      modal: {
        ondismiss: () => {
          console.log("[RAZORPAY] User closed the payment modal");
        },
        escape: true,
        backdropclose: false,
      },
      prefill: {
        email: session?.user?.email || "",
        name: session?.user?.name || "",
      },
      theme: {
        color: "#D97706",
      },
    };

    try {
      console.log("[RAZORPAY] Opening checkout with:", {
        keyIdPrefix: data.keyId?.substring(0, 12),
        keyIdIsTest: data.keyId?.startsWith("rzp_test_"),
        keyIdIsLive: data.keyId?.startsWith("rzp_live_"),
        subscriptionId: data.subscriptionId,
        amount: data.amount,
        plan: data.plan,
      });
      const rzp = new (window as any).Razorpay(options);
      
      rzp.on("payment.failed", (response: any) => {
        console.error("[RAZORPAY] Payment failed — full response:", JSON.stringify(response, null, 2));
        console.error("[RAZORPAY] Error details:", {
          code: response.error?.code,
          description: response.error?.description,
          source: response.error?.source,
          step: response.error?.step,
          reason: response.error?.reason,
          metadata: response.error?.metadata,
        });
        toast.error(`Payment failed: ${response.error?.description || "Unknown error"} (code: ${response.error?.code || "N/A"})`);
      });
      
      rzp.open();
    } catch (err) {
      console.error("[RAZORPAY] Failed to open checkout:", err);
      toast.error("Payment system unavailable. This may be due to network restrictions. Try using mobile data or a different network.");
    }
  }

  function handleChoosePlan(plan: "STARTER" | "PRO" | "BUSINESS") {
    if (!session) {
      router.push("/sign-in");
      return;
    }
    createSubscription.mutate({ plan });
  }

  function handleChoosePlanUpi(plan: "STARTER" | "PRO" | "BUSINESS") {
    if (!session) {
      router.push("/sign-in");
      return;
    }
    createOneTimeOrder.mutate({ plan });
  }

  function openRazorpayOneTime(data: {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    plan: "STARTER" | "PRO" | "BUSINESS";
    description: string;
  }) {
    const options = {
      key: data.keyId,
      order_id: data.orderId,
      amount: data.amount,
      currency: data.currency,
      name: "Sediment",
      description: data.description + " (one-time)",
      handler: (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        verifyOneTimePayment.mutate({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          plan: data.plan,
        });
      },
      method: {
        upi: true,
        card: false,
        netbanking: false,
        wallet: false,
        emi: false,
        paylater: false,
      },
      config: {
        display: {
          preferences: {
            show_default_blocks: false,
          },
          blocks: {
            upi_block: {
              name: "Pay via UPI",
              instruments: [
                {
                  method: "upi",
                  flows: ["collect", "intent", "qr"],
                },
              ],
            },
          },
          sequence: ["block.upi_block"],
        },
      },
      modal: {
        ondismiss: () => {
          console.log("[RAZORPAY] User closed the one-time payment modal");
        },
        escape: true,
        backdropclose: false,
      },
      prefill: {
        email: session?.user?.email || "",
        name: session?.user?.name || "",
        vpa: "",
      },
      theme: {
        color: "#D97706",
      },
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        console.error("[RAZORPAY] One-time payment failed — full response:", JSON.stringify(response, null, 2));
        toast.error(`Payment failed: ${response.error?.description || "Unknown error"} (code: ${response.error?.code || "N/A"})`);
      });
      rzp.open();
    } catch (err) {
      console.error("[RAZORPAY] Failed to open UPI checkout:", err);
      toast.error("Payment system unavailable. Try a different network.");
    }
  }

  const planRank: Record<string, number> = {
    FREE: 0,
    PRO: 1,
    BUSINESS: 2,
  };

  const currentRank =
    currentPlan?.isActive && currentPlan.plan
      ? planRank[currentPlan.plan] ?? 0
      : 0;

  // Only show plans strictly higher than the user's current active tier
  const visiblePlans = plans;

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
                    Your {currentPlan.plan === "BUSINESS" ? "Business" : "Pro"} Subscription
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

        <div className="mx-auto max-w-3xl grid gap-6 md:grid-cols-2">
            {visiblePlans.map((plan) => {
              const isCurrentPlan = currentPlan?.isActive && currentPlan.plan === plan.key;
              return (
                <div
                  key={plan.key}
                  className={`rounded-2xl border p-8 relative ${
                    isCurrentPlan
                      ? "border-emerald-500 bg-surface shadow-lg shadow-emerald-500/5"
                      : plan.highlighted
                        ? "border-amber bg-surface shadow-lg shadow-amber/5"
                        : "border-border-custom bg-surface"
                  }`}
                >
                  {isCurrentPlan && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 text-white text-xs font-semibold px-4 py-1">
                      Current Plan
                    </span>
                  )}
                  {!isCurrentPlan && plan.highlighted && (
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

                  {isCurrentPlan ? (
                    <div className="mt-6 w-full rounded-lg py-3 text-sm font-semibold text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      ✓ Active
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleChoosePlan(plan.key)}
                        disabled={createSubscription.isPending}
                        className={`mt-6 w-full rounded-lg py-3 text-sm font-semibold transition-colors ${
                          plan.highlighted
                            ? "bg-amber text-charcoal hover:bg-amber-light"
                            : "bg-surface-raised text-text hover:bg-surface-raised/80 border border-border-custom"
                        }`}
                      >
                        {createSubscription.isPending ? "Processing..." : planRank[plan.key] > currentRank ? `Upgrade to ${plan.name}` : `Get ${plan.name}`}
                      </button>
                      <button
                        onClick={() => handleChoosePlanUpi(plan.key)}
                        disabled={createOneTimeOrder.isPending}
                        className="mt-2 w-full rounded-lg py-3 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                      >
                        {createOneTimeOrder.isPending ? "Processing..." : `Pay ${plan.price} via UPI (one-time)`}
                      </button>
                    </>
                  )}

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-text-muted">
                        <Check className="h-4 w-4 text-amber shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

        <div className="mt-16 pt-12 border-t border-border-custom/50">
          <h2 className="text-3xl font-bold text-text text-center mb-12">
            Feature Comparison
          </h2>
          <PricingComparison onSelectPlan={handleChoosePlan} currentPlan={currentPlan?.plan} />
        </div>

        <div className="mt-16 pt-12 border-t border-border-custom/50">
          <h2 className="text-3xl font-bold text-text text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto max-w-2xl space-y-4">
            {[
              {
                q: "Can I change plans anytime?",
                a: "Yes! Upgrade, downgrade, or cancel at any time. Your access is pro-rated to your billing cycle.",
              },
              {
                q: "Do you offer team discounts?",
                a: "For large teams or annual commitments, contact us at support@sediment.app for custom pricing.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept credit/debit cards, UPI, and netbanking via Razorpay. International payments are supported.",
              },
              {
                q: "Can I use Sediment without Slack?",
                a: "Not yet — Sediment is built for Slack-first teams. Email us if you need a standalone version.",
              },
            ].map((item, idx) => (
              <details
                key={idx}
                className="rounded-lg border border-border-custom bg-charcoal p-4 cursor-pointer group"
              >
                <summary className="font-medium text-text flex justify-between items-center">
                  {item.q}
                  <span className="text-text-muted group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-text-muted text-sm">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
