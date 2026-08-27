"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

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
  const createOrder = trpc.billing.createOrder.useMutation({
    onSuccess: (data) => {
      openRazorpay(data);
    },
    onError: (err) => toast.error(err.message),
  });
  const verifyPayment = trpc.billing.verifyPayment.useMutation({
    onSuccess: (data) => {
      toast.success(`Upgraded to ${data.plan}!`);
      router.push("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  function openRazorpay(orderData: {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    plan: "PRO" | "BUSINESS";
    description: string;
  }) {
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Sediment",
      description: orderData.description,
      order_id: orderData.orderId,
      handler: (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        verifyPayment.mutate({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          plan: orderData.plan,
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

  function handleChoosePlan(plan: "PRO" | "BUSINESS") {
    if (!session) {
      router.push("/sign-in");
      return;
    }
    createOrder.mutate({ plan });
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-charcoal pt-24 pb-16 px-4">
        <div className="mx-auto max-w-4xl text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-text-muted text-lg">
            Choose the plan that fits your team. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="mx-auto max-w-4xl grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
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
                disabled={createOrder.isPending}
                className={`mt-6 w-full rounded-lg py-3 text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-amber text-charcoal hover:bg-amber-light"
                    : "bg-surface-raised text-text hover:bg-surface-raised/80 border border-border-custom"
                }`}
              >
                {createOrder.isPending ? "Processing..." : `Get ${plan.name}`}
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
      </main>
      <Footer />
    </>
  );
}
