import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const organizationRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;

      // Check if user already has an org
      const existing = await prisma.organizationMember.findFirst({
        where: { userId },
      });
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is already part of an organization",
        });
      }

      const slug = input.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();

      const org = await prisma.organization.create({
        data: {
          name: input.name,
          slug,
          ownerId: userId,
        },
      });

      await prisma.organizationMember.create({
        data: {
          organizationId: org.id,
          userId,
          role: "OWNER",
        },
      });

      // Update user to point to this org
      await prisma.user.update({
        where: { id: userId },
        data: { organizationId: org.id },
      });

      return org;
    }),

  join: protectedProcedure
    .input(z.object({ inviteCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;

      // For now, treat invite code as org id (could be enhanced later)
      const org = await prisma.organization.findUnique({
        where: { id: input.inviteCode },
      });

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      const existing = await prisma.organizationMember.findFirst({
        where: { organizationId: org.id, userId },
      });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already a member of this organization",
        });
      }

      await prisma.organizationMember.create({
        data: {
          organizationId: org.id,
          userId,
          role: "MEMBER",
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { organizationId: org.id },
      });

      return org;
    }),

  myOrg: protectedProcedure.query(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const userId = ctx.session.user.id;

    const membership = await prisma.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
    });

    return membership?.organization ?? null;
  }),
});
