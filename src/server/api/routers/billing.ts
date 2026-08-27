import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { razorpay, PLAN_CONFIG, getOrCreateRazorpayPlan } from "../../razorpay";
import { TRPCError } from "@trpc/server";

export const billingRouter = createTRPCRouter({
  createSubscription: protectedProcedure
    .input(z.object({ plan: z.enum(["STARTER", "PRO", "BUSINESS"]) }))
    .mutation(async ({ ctx, input }) => {
      const planId = await getOrCreateRazorpayPlan(input.plan);
      const config = PLAN_CONFIG[input.plan];

      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        total_count: 12, // max 12 billing cycles (1 year)
        customer_notify: 1,
        notes: {
          userId: ctx.session.user.id,
          plan: input.plan,
        },
      } as any);

      return {
        subscriptionId: subscription.id,
        planId,
        amount: config.amount,
        currency: config.currency,
        keyId: process.env.RAZORPAY_KEY_ID!,
        plan: input.plan,
        description: config.description,
      };
    }),

  verifySubscription: protectedProcedure
    .input(
      z.object({
        razorpaySubscriptionId: z.string(),
        razorpayPaymentId: z.string(),
        razorpaySignature: z.string(),
        plan: z.enum(["STARTER", "PRO", "BUSINESS"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const crypto = await import("crypto");
      const body = input.razorpayPaymentId + "|" + input.razorpaySubscriptionId;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(body)
        .digest("hex");

      if (expectedSignature !== input.razorpaySignature) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment verification failed",
        });
      }

      const now = new Date();
      const expiresAt = new Date(now);
      if (input.plan === "STARTER") {
        expiresAt.setDate(expiresAt.getDate() + 1); // 24 hours
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      await prisma.user.update({
        where: { id: ctx.session.user.id },
        data: {
          plan: input.plan,
          razorpaySubscriptionId: input.razorpaySubscriptionId,
          planStartedAt: now,
          planExpiresAt: expiresAt,
          autoRenew: true,
        },
      });

      return { ok: true, plan: input.plan };
    }),

  currentPlan: protectedProcedure.query(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        plan: true,
        planStartedAt: true,
        planExpiresAt: true,
        autoRenew: true,
        razorpaySubscriptionId: true,
      },
    });
    return {
      plan: user?.plan || "FREE",
      startedAt: user?.planStartedAt,
      expiresAt: user?.planExpiresAt,
      autoRenew: user?.autoRenew ?? false,
      subscriptionId: user?.razorpaySubscriptionId,
      isActive: user?.plan !== "FREE" && user?.planExpiresAt
        ? new Date(user.planExpiresAt) > new Date()
        : false,
    };
  }),

  toggleAutoRenew: protectedProcedure
    .input(z.object({ autoRenew: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      await prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { autoRenew: input.autoRenew },
      });
      return { ok: true, autoRenew: input.autoRenew };
    }),

  cancelAutoRenew: protectedProcedure.mutation(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { razorpaySubscriptionId: true },
    });

    // Cancel the subscription on Razorpay side too
    if (user?.razorpaySubscriptionId) {
      try {
        await razorpay.subscriptions.cancel(user.razorpaySubscriptionId, false);
      } catch (e) {
        console.error("Failed to cancel Razorpay subscription:", e);
      }
    }

    await prisma.user.update({
      where: { id: ctx.session.user.id },
      data: { autoRenew: false },
    });
    return { ok: true, autoRenew: false };
  }),

  downgradeToFree: protectedProcedure.mutation(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { razorpaySubscriptionId: true },
    });

    // Cancel the subscription on Razorpay side
    if (user?.razorpaySubscriptionId) {
      try {
        await razorpay.subscriptions.cancel(user.razorpaySubscriptionId, false);
      } catch (e) {
        console.error("Failed to cancel Razorpay subscription:", e);
      }
    }

    await prisma.user.update({
      where: { id: ctx.session.user.id },
      data: {
        plan: "FREE",
        planStartedAt: null,
        planExpiresAt: null,
        autoRenew: false,
        razorpaySubscriptionId: null,
      },
    });
    return { ok: true, plan: "FREE" };
  }),
});
