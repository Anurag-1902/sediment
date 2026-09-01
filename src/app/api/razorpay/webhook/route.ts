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

  const expectedBuf = Buffer.from(expectedSignature, "hex");
  const receivedBuf = Buffer.from(signature, "hex");
  if (
    expectedBuf.length !== receivedBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, receivedBuf)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);
  const prisma = await getPrisma();

  // Idempotency: Razorpay retries webhooks — process each event only once.
  const eventId: string | undefined =
    event.id ??
    (event.payload?.payment?.entity?.id
      ? `${event.event}:${event.payload.payment.entity.id}:${event.created_at ?? ""}`
      : event.payload?.subscription?.entity?.id
        ? `${event.event}:${event.payload.subscription.entity.id}:${event.created_at ?? ""}`
        : undefined);

  if (eventId) {
    try {
      await prisma.processedWebhookEvent.create({
        data: { eventId, eventType: event.event },
      });
    } catch (err: any) {
      // Unique constraint violation = we've already handled this event. Ack and stop.
      if (err?.code === "P2002") {
        return NextResponse.json({ ok: true, deduped: true });
      }
      throw err;
    }
  }

  switch (event.event) {
    case "subscription.charged": {
      // Recurring payment succeeded — extend the org's plan
      const subscriptionId = event.payload?.subscription?.entity?.id;
      if (!subscriptionId) break;

      const org = await prisma.organization.findFirst({
        where: { razorpaySubscriptionId: subscriptionId },
        select: { id: true, plan: true, planExpiresAt: true },
      });

      if (org) {
        const now = new Date();
        // Extend from the current expiry if it's still in the future (Razorpay
        // bills ahead), otherwise from now. This preserves already-paid days.
        const base =
          org.planExpiresAt && new Date(org.planExpiresAt) > now
            ? new Date(org.planExpiresAt)
            : now;
        const expiresAt = new Date(base);
        if (org.plan === "STARTER") {
          expiresAt.setDate(expiresAt.getDate() + 1);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }

        await prisma.organization.update({
          where: { id: org.id },
          data: {
            planExpiresAt: expiresAt,
          },
        });
      }
      break;
    }

    case "subscription.cancelled": {
      const subscriptionId = event.payload?.subscription?.entity?.id;
      if (!subscriptionId) break;

      const org = await prisma.organization.findFirst({
        where: { razorpaySubscriptionId: subscriptionId },
        select: { id: true, plan: true },
      });

      if (org) {
        await prisma.organization.update({
          where: { id: org.id },
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

      const org = await prisma.organization.findFirst({
        where: { razorpaySubscriptionId: subscriptionId },
        select: { id: true, plan: true },
      });

      if (org) {
        await prisma.organization.update({
          where: { id: org.id },
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
