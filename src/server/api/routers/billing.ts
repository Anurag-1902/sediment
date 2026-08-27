import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { razorpay, PLAN_CONFIG, getOrCreateRazorpayPlan } from "../../razorpay";
import { TRPCError } from "@trpc/server";

export const billingRouter = createTRPCRouter({
  createSubscription: protectedProcedure
    .input(z.object({ plan: z.enum(["STARTER", "PRO", "BUSINESS"]) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const planId = await getOrCreateRazorpayPlan(input.plan);
        const config = PLAN_CONFIG[input.plan];

        const subscription = await razorpay.subscriptions.create({
          plan_id: planId,
          total_count: input.plan === "STARTER" ? 4 : 12,
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
      } catch (err: any) {
        console.error("Razorpay subscription creation failed:", err?.error || err);
        const message =
          err?.error?.description ||
          err?.message ||
          "Failed to create subscription. Please try again.";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
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

      const membership = await prisma.organizationMember.findFirst({
        where: { userId: ctx.session.user.id },
        include: { organization: true },
      });

      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No organization found",
        });
      }

      await prisma.organization.update({
        where: { id: membership.organization.id },
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
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: ctx.session.user.id },
      include: {
        organization: {
          select: {
            plan: true,
            planStartedAt: true,
            planExpiresAt: true,
            autoRenew: true,
            razorpaySubscriptionId: true,
          },
        },
      },
    });
    const org = membership?.organization;
    return {
      plan: org?.plan || "FREE",
      startedAt: org?.planStartedAt,
      expiresAt: org?.planExpiresAt,
      autoRenew: org?.autoRenew ?? false,
      subscriptionId: org?.razorpaySubscriptionId,
      isActive: org?.plan !== "FREE" && org?.planExpiresAt
        ? new Date(org.planExpiresAt) > new Date()
        : false,
    };
  }),

  toggleAutoRenew: protectedProcedure
    .input(z.object({ autoRenew: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const membership = await prisma.organizationMember.findFirst({
        where: { userId: ctx.session.user.id },
        include: { organization: true },
      });

      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No organization found",
        });
      }

      await prisma.organization.update({
        where: { id: membership.organization.id },
        data: { autoRenew: input.autoRenew },
      });
      return { ok: true, autoRenew: input.autoRenew };
    }),

  cancelAutoRenew: protectedProcedure.mutation(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: ctx.session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No organization found",
      });
    }

    // Cancel the subscription on Razorpay side too
    if (membership.organization.razorpaySubscriptionId) {
      try {
        await razorpay.subscriptions.cancel(membership.organization.razorpaySubscriptionId, false);
      } catch (e) {
        console.error("Failed to cancel Razorpay subscription:", e);
      }
    }

    await prisma.organization.update({
      where: { id: membership.organization.id },
      data: { autoRenew: false },
    });
    return { ok: true, autoRenew: false };
  }),

  downgradeToFree: protectedProcedure.mutation(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: ctx.session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No organization found",
      });
    }

    // Cancel the subscription on Razorpay side
    if (membership.organization.razorpaySubscriptionId) {
      try {
        await razorpay.subscriptions.cancel(membership.organization.razorpaySubscriptionId, false);
      } catch (e) {
        console.error("Failed to cancel Razorpay subscription:", e);
      }
    }

    await prisma.organization.update({
      where: { id: membership.organization.id },
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
