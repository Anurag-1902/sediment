import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { razorpay, PLANS } from "../../razorpay";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

export const billingRouter = createTRPCRouter({
  createOrder: protectedProcedure
    .input(z.object({ plan: z.enum(["PRO", "BUSINESS"]) }))
    .mutation(async ({ ctx, input }) => {
      const planDetails = PLANS[input.plan];

      const order = await razorpay.orders.create({
        amount: planDetails.amount,
        currency: planDetails.currency,
        receipt: `receipt_${ctx.session.user.id}_${Date.now()}`,
        notes: {
          userId: ctx.session.user.id,
          plan: input.plan,
        },
      });

      return {
        orderId: order.id,
        amount: planDetails.amount,
        currency: planDetails.currency,
        keyId: process.env.RAZORPAY_KEY_ID!,
        plan: input.plan,
        description: planDetails.description,
      };
    }),

  verifyPayment: protectedProcedure
    .input(
      z.object({
        razorpayOrderId: z.string(),
        razorpayPaymentId: z.string(),
        razorpaySignature: z.string(),
        plan: z.enum(["PRO", "BUSINESS"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const body = input.razorpayOrderId + "|" + input.razorpayPaymentId;
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

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await prisma.user.update({
        where: { id: ctx.session.user.id },
        data: {
          plan: input.plan,
          razorpaySubscriptionId: input.razorpayPaymentId,
          planExpiresAt: expiresAt,
        },
      });

      return { ok: true, plan: input.plan };
    }),

  currentPlan: protectedProcedure.query(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { plan: true, planExpiresAt: true },
    });
    return {
      plan: user?.plan || "FREE",
      expiresAt: user?.planExpiresAt,
      isActive: user?.plan !== "FREE" && user?.planExpiresAt
        ? new Date(user.planExpiresAt) > new Date()
        : false,
    };
  }),
});
