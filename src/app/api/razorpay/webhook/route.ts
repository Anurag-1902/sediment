import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/krutai-server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature || !process.env.RAZORPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);
  const prisma = await getPrisma();

  switch (event.event) {
    case "subscription.charged": {
      // Recurring payment succeeded — extend the user's plan
      const subscriptionId = event.payload?.subscription?.entity?.id;
      if (!subscriptionId) break;

      const user = await prisma.user.findFirst({
        where: { razorpaySubscriptionId: subscriptionId },
      });

      if (user) {
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            planStartedAt: now,
            planExpiresAt: expiresAt,
          },
        });
      }
      break;
    }

    case "subscription.cancelled": {
      const subscriptionId = event.payload?.subscription?.entity?.id;
      if (!subscriptionId) break;

      const user = await prisma.user.findFirst({
        where: { razorpaySubscriptionId: subscriptionId },
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { autoRenew: false },
        });
      }
      break;
    }

    case "subscription.halted":
    case "subscription.expired": {
      // Subscription expired or payment failed repeatedly — downgrade to FREE
      const subscriptionId = event.payload?.subscription?.entity?.id;
      if (!subscriptionId) break;

      const user = await prisma.user.findFirst({
        where: { razorpaySubscriptionId: subscriptionId },
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: "FREE",
            autoRenew: false,
            planStartedAt: null,
            planExpiresAt: null,
            razorpaySubscriptionId: null,
          },
        });
      }
      break;
    }

    case "payment.failed": {
      console.warn("Payment failed:", event.payload?.payment?.entity?.id);
      break;
    }

    default:
      console.log("Unhandled Razorpay event:", event.event);
  }

  return NextResponse.json({ ok: true });
}
