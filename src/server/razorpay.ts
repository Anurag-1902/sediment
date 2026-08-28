import Razorpay from "razorpay";

// NOTE: For production, move these to environment variables.
// These are temporarily hardcoded because .env is gitignored and doesn't deploy.
export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? "rzp_live_SwmqjsLL8ilBcE";
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "SLH8zKSNqohUOCeoyRj7h2GL";

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn("Razorpay credentials not set — payments will fail");
}

export const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

export const PLAN_CONFIG = {
  STARTER: {
    name: "Sediment Starter Test",
    amount: 100, // ₹1
    currency: "INR",
    period: "weekly" as const,
    interval: 1,
    description: "Sediment Starter — 24-hour access to test all features",
    features: [
      "All features for 24 hours",
      "1 project",
      "Up to 5 team members",
    ],
  },
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

const PLAN_ID_ENV_MAP: Record<string, string> = {
  STARTER: "RAZORPAY_PLAN_ID_STARTER",
  PRO: "RAZORPAY_PLAN_ID_PRO",
  BUSINESS: "RAZORPAY_PLAN_ID_BUSINESS",
};

const planIdCache: Record<string, string> = {};

export async function getOrCreateRazorpayPlan(
  planKey: "STARTER" | "PRO" | "BUSINESS"
): Promise<string> {
  if (planIdCache[planKey]) return planIdCache[planKey];

  // Prefer env-var plan IDs (no API call needed)
  const envId = process.env[PLAN_ID_ENV_MAP[planKey]];
  if (envId) {
    planIdCache[planKey] = envId;
    return envId;
  }

  // Fallback: create the plan (one-time)
  const config = PLAN_CONFIG[planKey];
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
  console.log(`[RAZORPAY] Created plan ${planKey} → ${plan.id}. Set ${PLAN_ID_ENV_MAP[planKey]}=${plan.id} in .env to skip this next time.`);
  return plan.id;
}
