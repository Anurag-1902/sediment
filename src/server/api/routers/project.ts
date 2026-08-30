import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, paidProcedure, protectedProcedure } from "../trpc";
import { resolveSlackUser } from "@/server/slack";
import { hasPermission } from "../rbac";

export const projectRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const userId = ctx.session.user.id;
    return prisma.project.findMany({
      where: {
        isActive: true,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        _count: { select: { tasks: true, members: true } },
        tasks: { where: { status: { not: "CLOSED" } }, select: { id: true } },
        syncSessions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  listArchived: protectedProcedure.query(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const userId = ctx.session.user.id;
    return prisma.project.findMany({
      where: {
        isActive: false,
        ownerId: userId,
      },
      include: {
        _count: { select: { tasks: true, members: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;
      const project = await prisma.project.findFirst({
        where: {
          id: input.id,
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
        include: {
          members: true,
          tasks: {
            include: { assignedTo: { select: { id: true, name: true } } },
          },
          syncSessions: {
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
              _count: { select: { updates: true } },
            },
          },
        },
      });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      return project;
    }),

  create: paidProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        contextPlainText: z.string().optional(),
        slackChannelId: z.string().min(1),
        slackChannelName: z.string().min(1),
        syncTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
        syncTimezone: z.string().min(1),
        members: z.array(z.object({
          handle: z.string(),
          role: z.string().min(1).max(50).default("Member"),
        })).default([]),
        standupPrompt: z.string().min(10).max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const { members, ...data } = input;
      const userId = ctx.session.user.id;
      const organizationId = ctx.organizationId;

      // Check permission
      const membership = await prisma.organizationMember.findFirst({
        where: { userId, organizationId },
      });
      if (!membership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }
      if (!hasPermission(membership.role as any, "canManageProjects")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to manage projects",
        });
      }

      const resolvedMembers = [];
      for (const m of members) {
        const user = await resolveSlackUser(m.handle, organizationId);
        if (!user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Could not resolve Slack handle: ${m.handle}`,
          });
        }
        resolvedMembers.push({
          slackUserId: user.id,
          slackHandle: user.realName || user.name,
          role: m.role.trim() || "Member",
        });
      }

      const project = await prisma.project.create({
        data: {
          ...data,
          ownerId: userId,
          organizationId,
          members: {
            create: resolvedMembers,
          },
        },
        include: { members: true },
      });

      return project;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        contextPlainText: z.string().optional(),
        slackChannelId: z.string().min(1).optional(),
        slackChannelName: z.string().min(1).optional(),
        syncTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
        syncTimezone: z.string().min(1).optional(),
        isActive: z.boolean().optional(),
        members: z.array(z.object({
          handle: z.string(),
          role: z.string().min(1).max(50).default("Member"),
        })).optional(),
        standupPrompt: z.string().min(10).max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;
      const { id, members, ...data } = input;

      const existing = await prisma.project.findFirst({
        where: { id, ownerId: userId },
        include: { members: true },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Check permission
      const membership = await prisma.organizationMember.findFirst({
        where: { userId, organizationId: existing.organizationId },
      });
      if (!membership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }
      if (!hasPermission(membership.role as any, "canManageProjects")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to manage projects",
        });
      }

      if (members !== undefined) {
        const resolvedMembers = [];
        for (const m of members) {
          const user = await resolveSlackUser(m.handle, existing.organizationId);
          if (!user) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Could not resolve Slack handle: ${m.handle}`,
            });
          }
          resolvedMembers.push({
            projectId: id,
            slackUserId: user.id,
            slackHandle: user.realName || user.name,
            role: m.role.trim() || "Member",
          });
        }

        await prisma.projectMember.deleteMany({
          where: { projectId: id },
        });
        await prisma.projectMember.createMany({
          data: resolvedMembers,
        });
      }

      const updated = await prisma.project.update({
        where: { id },
        data,
        include: { members: true },
      });

      return updated;
    }),

  updateMemberRole: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      memberId: z.string(),
      role: z.string().min(1).max(50),
    }))
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;

      const project = await prisma.project.findFirst({
        where: { id: input.projectId },
        select: { organizationId: true },
      });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const membership = await prisma.organizationMember.findFirst({
        where: { userId, organizationId: project.organizationId },
      });
      if (!membership || !hasPermission(membership.role as any, "canManageProjects")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to manage project members" });
      }

      const member = await prisma.projectMember.findFirst({
        where: { id: input.memberId, projectId: input.projectId },
      });
      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found in this project" });
      }

      await prisma.projectMember.update({
        where: { id: input.memberId },
        data: { role: input.role.trim() || "Member" },
      });

      return { ok: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;
      const existing = await prisma.project.findFirst({
        where: { id: input.id, ownerId: userId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Check permission
      const membership = await prisma.organizationMember.findFirst({
        where: { userId, organizationId: existing.organizationId },
      });
      if (!membership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }
      if (!hasPermission(membership.role as any, "canDeleteProjects")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete projects",
        });
      }

      await prisma.project.update({
        where: { id: input.id },
        data: { isActive: false },
      });
      return { ok: true };
    }),

  restore: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;
      const existing = await prisma.project.findFirst({
        where: { id: input.id, ownerId: userId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Check permission
      const membership = await prisma.organizationMember.findFirst({
        where: { userId, organizationId: existing.organizationId },
      });
      if (!membership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }
      if (!hasPermission(membership.role as any, "canManageProjects")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to manage projects",
        });
      }

      await prisma.project.update({
        where: { id: input.id },
        data: { isActive: true },
      });
      return { ok: true };
    }),

  permanentDelete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;
      const existing = await prisma.project.findFirst({
        where: { id: input.id, ownerId: userId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Check permission
      const membership = await prisma.organizationMember.findFirst({
        where: { userId, organizationId: existing.organizationId },
      });
      if (!membership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }
      if (!hasPermission(membership.role as any, "canDeleteProjects")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete projects",
        });
      }

      // Explicitly delete child records in dependency order, then the project.
      // This guarantees deletion succeeds even if the live DB is missing cascade constraints.
      await prisma.$transaction(async (tx) => {
        const sessions = await tx.syncSession.findMany({
          where: { projectId: input.id },
          select: { id: true },
        });
        const sessionIds = sessions.map((s) => s.id);

        if (sessionIds.length > 0) {
          await tx.followUp.deleteMany({ where: { sessionId: { in: sessionIds } } });
          await tx.devUpdate.deleteMany({ where: { sessionId: { in: sessionIds } } });
        }
        await tx.followUp.deleteMany({ where: { task: { projectId: input.id } } });
        await tx.task.deleteMany({ where: { projectId: input.id } });
        await tx.syncSession.deleteMany({ where: { projectId: input.id } });
        await tx.aIQuery.deleteMany({ where: { projectId: input.id } });
        await tx.projectContextLog.deleteMany({ where: { projectId: input.id } });
        await tx.projectMember.deleteMany({ where: { projectId: input.id } });
        await tx.project.delete({ where: { id: input.id } });
      });

      return { ok: true };
    }),

  stats: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;
      const project = await prisma.project.findFirst({
        where: {
          id: input.id,
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
        include: {
          _count: {
            select: {
              tasks: true,
              members: true,
              syncSessions: true,
            },
          },
          tasks: true,
          syncSessions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { updates: true },
          },
        },
      });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      return {
        totalTasks: project._count.tasks,
        totalMembers: project._count.members,
        totalSyncs: project._count.syncSessions,
        blockerCount: project.tasks.filter((t: { status: string }) => t.status === "BLOCKED").length,
        inProgressCount: project.tasks.filter((t: { status: string }) => t.status === "IN_PROGRESS").length,
        lastSync: project.syncSessions[0] ?? null,
      };
    }),

  analytics: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;
      const project = await prisma.project.findFirst({
        where: {
          id: input.id,
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
        include: {
          tasks: {
            select: {
              id: true,
              status: true,
              assigneeName: true,
              createdAt: true,
              lastMentionedAt: true,
            },
          },
          members: {
            select: {
              slackUserId: true,
              slackHandle: true,
            },
          },
          syncSessions: {
            orderBy: { createdAt: "desc" },
            include: {
              updates: {
                select: {
                  slackUserId: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const totalUsers = await prisma.user.count();

      // Task status breakdown
      const statusCounts = {
        OPEN: 0,
        IN_PROGRESS: 0,
        BLOCKED: 0,
        CLOSED: 0,
      };
      for (const task of project.tasks) {
        const s = task.status as keyof typeof statusCounts;
        if (s in statusCounts) statusCounts[s]++;
      }

      // Per-member task counts
      const memberTaskMap: Record<string, { name: string; open: number; inProgress: number; blocked: number; closed: number }> = {};
      for (const member of project.members) {
        memberTaskMap[member.slackUserId] = {
          name: member.slackHandle ?? member.slackUserId,
          open: 0,
          inProgress: 0,
          blocked: 0,
          closed: 0,
        };
      }
      for (const task of project.tasks) {
        const key = task.assigneeName;
        if (key) {
          // Find by name match
          const entry = Object.values(memberTaskMap).find((m) => m.name === key);
          if (entry) {
            if (task.status === "OPEN") entry.open++;
            else if (task.status === "IN_PROGRESS") entry.inProgress++;
            else if (task.status === "BLOCKED") entry.blocked++;
            else if (task.status === "CLOSED") entry.closed++;
          }
        }
      }

      // Weekly task creation trend (last 8 weeks)
      const weeklyTrend: Array<{ week: string; created: number; closed: number }> = [];
      const now = new Date();
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
        const created = project.tasks.filter(
          (t) => new Date(t.createdAt) >= weekStart && new Date(t.createdAt) < weekEnd
        ).length;
        const closed = project.tasks.filter(
          (t) =>
            t.status === "CLOSED" &&
            t.lastMentionedAt &&
            new Date(t.lastMentionedAt) >= weekStart &&
            new Date(t.lastMentionedAt) < weekEnd
        ).length;
        weeklyTrend.push({ week: label, created, closed });
      }

      // Response rate per sync
      const totalSyncs = project.syncSessions.length;
      const totalMembers = project.members.length;
      let totalResponses = 0;
      for (const session of project.syncSessions) {
        const uniqueResponders = new Set(session.updates.map((u) => u.slackUserId));
        totalResponses += uniqueResponders.size;
      }
      const avgResponseRate =
        totalSyncs > 0 && totalMembers > 0
          ? Math.round((totalResponses / (totalSyncs * totalMembers)) * 100)
          : 0;

      // Avg time to close (in days) for closed tasks
      const closedTasks = project.tasks.filter((t) => t.status === "CLOSED" && t.lastMentionedAt);
      const avgDaysToClose =
        closedTasks.length > 0
          ? Math.round(
              closedTasks.reduce((sum, t) => {
                const created = new Date(t.createdAt).getTime();
                const closed = new Date(t.lastMentionedAt!).getTime();
                return sum + (closed - created) / (1000 * 60 * 60 * 24);
              }, 0) / closedTasks.length
            )
          : null;

      return {
        statusCounts,
        memberBreakdown: Object.values(memberTaskMap),
        weeklyTrend,
        totalSyncs,
        avgResponseRate,
        avgDaysToClose,
        totalTasks: project.tasks.length,
        blockerCount: statusCounts.BLOCKED,
        totalUsers,
      };
    }),
});
