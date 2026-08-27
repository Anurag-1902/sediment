import Razorpay from "razorpay";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("Razorpay credentials not set — payments will fail");
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export const PLANS = {
  PRO: {
    name: "Pro",
    amount: 49900, // ₹499 in paise
    currency: "INR",
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
    name: "Business",
    amount: 149900, // ₹1499 in paise
    currency: "INR",
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
