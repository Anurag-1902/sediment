import Razorpay from "razorpay";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("Razorpay credentials not set — payments will fail");
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export const PLAN_CONFIG = {
  PRO: {
    name: "Sediment Pro",
    amount: 49900, // ₹499 in paise
    currency: "INR",
    period: "monthly" as const,
    interval: 1,
    description: "Sediment Pro — Unlimited projects, analytics, and custom prompts",
    features: [
      "Unlimited projects",
      "Unlimited team members",
      "Custom standup prompts",
      "Analytics dashboard",
      "Priority support",
    ],
  },
  BUSINESS: {
    name: "Sediment Business",
    amount: 149900, // ₹1499 in paise
    currency: "INR",
    period: "monthly" as const,
    interval: 1,
    description: "Sediment Business — Everything in Pro plus advanced features",
    features: [
      "Everything in Pro",
      "Custom branding",
      "API access",
      "Advanced analytics",
      "Dedicated support",
    ],
  },
} as const;

// Cache for Razorpay Plan IDs — created on first use
const planIdCache: Record<string, string> = {};

export async function getOrCreateRazorpayPlan(
  planKey: "PRO" | "BUSINESS"
): Promise<string> {
  if (planIdCache[planKey]) {
    return planIdCache[planKey];
  }

  const config = PLAN_CONFIG[planKey];

  // Check if plan already exists by listing plans
  const existingPlans = await razorpay.plans.all({ count: 100 });
  const existing = (existingPlans as any).items?.find(
    (p: any) =>
      p.item?.name === config.name &&
      p.item?.amount === config.amount &&
      p.period === config.period
  );

  if (existing) {
    planIdCache[planKey] = existing.id;
    return existing.id;
  }

  // Create new plan
  const plan = await razorpay.plans.create({
    period: config.period,
    interval: config.interval,
    item: {
      name: config.name,
      amount: config.amount,
      currency: config.currency,
      description: config.description,
    },
  });

  planIdCache[planKey] = plan.id;
  return plan.id;
}
