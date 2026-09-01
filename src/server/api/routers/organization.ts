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
          role: "MANAGER",
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
          role: "EMPLOYEE",
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

  listMembers: protectedProcedure.query(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const userId = ctx.session.user.id;

    const membership = await prisma.organizationMember.findFirst({
      where: { userId },
    });
    if (!membership) throw new TRPCError({ code: "NOT_FOUND", message: "No org" });

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: membership.organizationId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return members;
  }),

  updateMemberRole: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        role: z.enum(["MANAGER", "ADMIN", "DEVELOPER", "HR", "ACCOUNTANT", "FINANCE", "EMPLOYEE"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;

      const updater = await prisma.organizationMember.findFirst({
        where: { userId },
      });
      if (!updater) throw new TRPCError({ code: "NOT_FOUND", message: "No org" });

      const { hasPermission } = await import("../rbac");
      if (!hasPermission(updater.role as any, "canChangeRoles")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only managers can change roles",
        });
      }

      const target = await prisma.organizationMember.findUnique({
        where: { id: input.memberId },
      });
      if (!target || target.organizationId !== updater.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      }

      // Can't demote yourself
      if (target.userId === userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot change your own role",
        });
      }

      await prisma.organizationMember.update({
        where: { id: input.memberId },
        data: { role: input.role },
      });

      return { ok: true };
    }),

  removeMember: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;

      const remover = await prisma.organizationMember.findFirst({
        where: { userId },
      });
      if (!remover) throw new TRPCError({ code: "NOT_FOUND", message: "No org" });

      const { hasPermission } = await import("../rbac");
      if (!hasPermission(remover.role as any, "canManageMembers")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to remove members",
        });
      }

      const target = await prisma.organizationMember.findUnique({
        where: { id: input.memberId },
      });
      if (!target || target.organizationId !== remover.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      }

      // Can't remove yourself
      if (target.userId === userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot remove yourself. Delete the org instead.",
        });
      }

      // Only managers can remove admins/managers
      if ((target.role === "MANAGER" || target.role === "ADMIN") && remover.role !== "MANAGER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only managers can remove admins or other managers",
        });
      }

      await prisma.organizationMember.delete({ where: { id: input.memberId } });
      await prisma.user.update({
        where: { id: target.userId },
        data: { organizationId: null },
      });

      return { ok: true };
    }),

  currentUserRole: protectedProcedure.query(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const userId = ctx.session.user.id;

    const membership = await prisma.organizationMember.findFirst({
      where: { userId },
      include: { organization: true },
    });

    if (!membership) return null;

    return {
      role: membership.role,
      organizationId: membership.organizationId,
      organizationName: membership.organization.name,
    };
  }),
});
