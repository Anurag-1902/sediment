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

  inviteMember: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["MANAGER", "ADMIN", "DEVELOPER", "HR", "ACCOUNTANT", "FINANCE", "EMPLOYEE"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;
      const crypto = await import("crypto");

      // Check inviter has permission
      const inviter = await prisma.organizationMember.findFirst({
        where: { userId },
        include: {
          organization: true,
          user: true,
        },
      });
      if (!inviter) throw new TRPCError({ code: "NOT_FOUND", message: "No org" });

      const { hasPermission } = await import("../rbac");
      if (!hasPermission(inviter.role as any, "canManageMembers")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to invite members",
        });
      }

      if (input.role === "MANAGER" && inviter.role !== "MANAGER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only managers can promote someone to manager",
        });
      }

      // Find the user by email
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No user with that email exists. Ask them to sign up at Sediment first, then invite them.",
        });
      }

      // Check if already in an org
      const existingMembership = await prisma.organizationMember.findFirst({
        where: { userId: user.id },
      });
      if (existingMembership) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This user is already part of an organization",
        });
      }

      // Check if there's already a pending invite for this user to this org
      const existingInvite = await prisma.organizationInvite.findFirst({
        where: {
          invitedUserId: user.id,
          organizationId: inviter.organizationId,
          status: "PENDING",
        },
      });
      if (existingInvite) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An invite has already been sent to this user. They need to accept or decline it first.",
        });
      }

      // Create the invite with a random token, expires in 7 days
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.organizationInvite.create({
        data: {
          organizationId: inviter.organizationId,
          invitedEmail: input.email,
          invitedUserId: user.id,
          invitedByUserId: userId,
          role: input.role,
          token,
          expiresAt,
        },
      });

      // Send the invite email
      const { sendInviteEmail } = await import("@/lib/email");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://nd-functionality-of.projects.krut.ai";
      const acceptUrl = `${appUrl}/invite/${token}`;

      const emailResult = await sendInviteEmail({
        to: input.email,
        inviterName: inviter.user.name,
        organizationName: inviter.organization.name,
        role: input.role,
        acceptUrl,
      });

      if (!emailResult.ok) {
        console.error("Invite created but email failed to send:", emailResult.error);
      }

      return { ok: true, emailSent: emailResult.ok };
    }),

  listPendingInvites: protectedProcedure.query(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const userId = ctx.session.user.id;

    const membership = await prisma.organizationMember.findFirst({
      where: { userId },
    });
    if (!membership) return [];

    const invites = await prisma.organizationInvite.findMany({
      where: {
        organizationId: membership.organizationId,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });

    return invites;
  }),

  listMyInvites: protectedProcedure.query(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const userId = ctx.session.user.id;

    const invites = await prisma.organizationInvite.findMany({
      where: {
        invitedUserId: userId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: { organization: true },
      orderBy: { createdAt: "desc" },
    });

    return invites;
  }),

  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;

      const invite = await prisma.organizationInvite.findUnique({
        where: { token: input.token },
      });

      if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      if (invite.status !== "PENDING") throw new TRPCError({ code: "BAD_REQUEST", message: "This invite is no longer valid" });
      if (invite.expiresAt < new Date()) {
        await prisma.organizationInvite.update({
          where: { id: invite.id },
          data: { status: "EXPIRED" },
        });
        throw new TRPCError({ code: "BAD_REQUEST", message: "This invite has expired" });
      }
      if (invite.invitedUserId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This invite is not for you" });
      }

      // Check user isn't already in another org
      const existingMembership = await prisma.organizationMember.findFirst({
        where: { userId },
      });
      if (existingMembership) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are already part of an organization. Leave it first before accepting a new invite.",
        });
      }

      // Add to org and mark invite as accepted
      await prisma.$transaction([
        prisma.organizationMember.create({
          data: {
            organizationId: invite.organizationId,
            userId,
            role: invite.role,
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: { organizationId: invite.organizationId },
        }),
        prisma.organizationInvite.update({
          where: { id: invite.id },
          data: { status: "ACCEPTED", acceptedAt: new Date() },
        }),
      ]);

      return { ok: true, organizationId: invite.organizationId };
    }),

  declineInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const invite = await prisma.organizationInvite.findUnique({
        where: { token: input.token },
      });
      if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      if (invite.invitedUserId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This invite is not for you" });
      }
      await prisma.organizationInvite.update({
        where: { id: invite.id },
        data: { status: "DECLINED" },
      });
      return { ok: true };
    }),

  cancelInvite: protectedProcedure
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;

      const membership = await prisma.organizationMember.findFirst({
        where: { userId },
      });
      if (!membership) throw new TRPCError({ code: "NOT_FOUND", message: "No org" });

      const { hasPermission } = await import("../rbac");
      if (!hasPermission(membership.role as any, "canManageMembers")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission" });
      }

      const invite = await prisma.organizationInvite.findUnique({
        where: { id: input.inviteId },
      });
      if (!invite || invite.organizationId !== membership.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      }

      await prisma.organizationInvite.delete({ where: { id: invite.id } });
      return { ok: true };
    }),

  resendInvite: protectedProcedure
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;

      const membership = await prisma.organizationMember.findFirst({
        where: { userId },
        include: { organization: true, user: true },
      });
      if (!membership) throw new TRPCError({ code: "NOT_FOUND", message: "No org" });

      const { hasPermission } = await import("../rbac");
      if (!hasPermission(membership.role as any, "canManageMembers")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission" });
      }

      const invite = await prisma.organizationInvite.findUnique({
        where: { id: input.inviteId },
      });
      if (!invite || invite.organizationId !== membership.organizationId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      }
      if (invite.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Can only resend pending invites" });
      }

      const { sendInviteEmail } = await import("@/lib/email");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://nd-functionality-of.projects.krut.ai";
      const acceptUrl = `${appUrl}/invite/${invite.token}`;

      await sendInviteEmail({
        to: invite.invitedEmail,
        inviterName: membership.user.name,
        organizationName: membership.organization.name,
        role: invite.role,
        acceptUrl,
      });

      return { ok: true };
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
