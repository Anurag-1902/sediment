import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { resend, EMAIL_FROM } from "../../resend";

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

  sendInvite: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      role: z.enum(["MANAGER", "ADMIN", "DEVELOPER", "HR", "ACCOUNTANT", "FINANCE", "EMPLOYEE"]).default("EMPLOYEE"),
    }))
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;

      const membership = await prisma.organizationMember.findFirst({
        where: { userId },
        include: { organization: true },
      });

      if (!membership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No organization found" });
      }

      const { hasPermission } = await import("../rbac");
      if (!hasPermission(membership.role as any, "canManageBilling")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only managers can send invites" });
      }

      // Check if user is already a member
      const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
      if (existingUser) {
        const existingMember = await prisma.organizationMember.findFirst({
          where: { userId: existingUser.id, organizationId: membership.organization.id },
        });
        if (existingMember) {
          throw new TRPCError({ code: "CONFLICT", message: "This person is already a member" });
        }
      }

      // Generate a unique invite token
      const crypto = await import("crypto");
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

      // Store the invite in DB
      const invite = await prisma.organizationInvite.create({
        data: {
          organizationId: membership.organization.id,
          email: input.email,
          role: input.role,
          token,
          expiresAt,
          invitedById: userId,
        },
      });

      // Build invite URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://nd-functionality-of.projects.krut.ai";
      const inviteUrl = `${baseUrl}/invite/${token}`;

      // Send email via Resend
      const senderUser = ctx.session.user;
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: input.email,
          subject: `${senderUser.name || "Someone"} invited you to join ${membership.organization.name} on Sediment`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
              <h2 style="color: #1a1a1a; margin-bottom: 8px;">You're invited to Sediment</h2>
              <p style="color: #666; font-size: 15px; line-height: 1.5;">
                <strong>${senderUser.name || "A team member"}</strong> has invited you to join
                <strong>${membership.organization.name}</strong> on Sediment — async standups for Slack teams.
              </p>
              <a href="${inviteUrl}"
                 style="display: inline-block; background: #D97706; color: #fff; text-decoration: none;
                        padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 24px 0;">
                Accept Invite
              </a>
              <p style="color: #999; font-size: 13px; margin-top: 24px;">
                This invite expires in 7 days. If you didn't expect this, you can ignore this email.
              </p>
            </div>
          `,
        });

        return { ok: true, message: `Invite sent to ${input.email}` };
      } catch (err: any) {
        console.error("[RESEND] Failed to send invite email:", err);
        // Still return OK — invite is saved in DB, user can share link manually
        return { ok: true, inviteUrl, message: `Invite created but email failed. Share this link manually: ${inviteUrl}` };
      }
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
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
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
        include: { organization: true },
      });

      if (!invite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found or already used" });
      }

      if (invite.expiresAt < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This invite has expired" });
      }

      if (invite.acceptedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This invite has already been used" });
      }

      // Check if already a member
      const existingMember = await prisma.organizationMember.findFirst({
        where: { userId, organizationId: invite.organizationId },
      });

      if (existingMember) {
        throw new TRPCError({ code: "CONFLICT", message: "You are already a member of this organization" });
      }

      // Add user to org
      await prisma.organizationMember.create({
        data: {
          organizationId: invite.organizationId,
          userId,
          role: invite.role as any,
        },
      });

      // Update user's org
      await prisma.user.update({
        where: { id: userId },
        data: { organizationId: invite.organizationId },
      });

      // Mark invite as accepted
      await prisma.organizationInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      return { ok: true, organizationName: invite.organization.name };
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
      if (invite.acceptedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Can only resend pending invites" });
      }

      const { sendInviteEmail } = await import("@/lib/email");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://nd-functionality-of.projects.krut.ai";
      const acceptUrl = `${appUrl}/invite/${invite.token}`;

      await sendInviteEmail({
        to: invite.email,
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
