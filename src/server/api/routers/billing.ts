import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { razorpay, PLAN_CONFIG, getOrCreateRazorpayPlan } from "../../razorpay";
import { TRPCError } from "@trpc/server";
import { hasPermission } from "../rbac";

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 2000
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const statusCode = err?.statusCode || err?.response?.status;
      // Retry on 502, 503, 504 (gateway errors) and network timeouts
      const isRetryable = statusCode === 502 || statusCode === 503 || statusCode === 504 || statusCode === undefined;
      if (!isRetryable || attempt >= retries) {
        throw err;
      }
      console.warn(`[BILLING] Razorpay request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`, err?.error?.description || err?.message);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  throw lastError;
}

export const billingRouter = createTRPCRouter({
  createSubscription: protectedProcedure
    .input(z.object({ plan: z.enum(["STARTER", "PRO", "BUSINESS"]) }))
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;
      let membership = await prisma.organizationMember.findFirst({
        where: { userId },
      });

      // Auto-create organization if none exists
      if (!membership) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        const slug = user.name?.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now() || "org-" + Date.now();
        const org = await prisma.organization.create({
          data: {
            name: user.name ? `${user.name}'s Organization` : "My Organization",
            slug,
            ownerId: userId,
          },
        });
        membership = await prisma.organizationMember.create({
          data: {
            organizationId: org.id,
            userId,
            role: "MANAGER",
          },
        });
        await prisma.user.update({
          where: { id: userId },
          data: { organizationId: org.id },
        });
      }

      if (!hasPermission(membership.role as any, "canManageBilling")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only managers can manage billing",
        });
      }

      try {
        const planId = await retryWithBackoff(() => getOrCreateRazorpayPlan(input.plan));
        const config = PLAN_CONFIG[input.plan];

        const subscription = await retryWithBackoff(async () => {
          return razorpay.subscriptions.create({
            plan_id: planId,
            total_count: input.plan === "STARTER" ? 4 : 12,
            customer_notify: 1,
            notes: {
              userId: ctx.session.user.id,
              plan: input.plan,
            },
          } as any);
        });

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
        console.error("Razorpay subscription creation failed after retries:", err?.error || err);
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

      if (!hasPermission(membership.role as any, "canManageBilling")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only managers can manage billing",
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

    if (!membership) {
      return {
        plan: "FREE",
        startedAt: null,
        expiresAt: null,
        autoRenew: false,
        subscriptionId: null,
        isActive: false,
      };
    }

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

      if (!hasPermission(membership.role as any, "canManageBilling")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only managers can manage billing",
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

    if (!hasPermission(membership.role as any, "canManageBilling")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only managers can manage billing",
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

    if (!hasPermission(membership.role as any, "canManageBilling")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only managers can manage billing",
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
