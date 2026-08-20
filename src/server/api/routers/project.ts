import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { resolveSlackUser } from "@/server/slack";

export const projectRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const prisma = await ctx.getPrisma();
    const userId = ctx.session.user.id;
    return prisma.project.findMany({
      where: {
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

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        contextPlainText: z.string().optional(),
        slackChannelId: z.string().min(1),
        slackChannelName: z.string().min(1),
        syncTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
        syncTimezone: z.string().min(1),
        memberHandles: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const { memberHandles, ...data } = input;
      const userId = ctx.session.user.id;

      const resolvedMembers = [];
      for (const handle of memberHandles) {
          const user = await resolveSlackUser(handle, userId);
        if (!user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Could not resolve Slack handle: ${handle}`,
          });
        }
        resolvedMembers.push({
          slackUserId: user.id,
          slackHandle: user.realName || user.name,
          role: "MEMBER",
        });
      }

      const project = await prisma.project.create({
        data: {
          ...data,
          ownerId: userId,
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
        memberHandles: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;
      const { id, memberHandles, ...data } = input;

      const existing = await prisma.project.findFirst({
        where: { id, ownerId: userId },
        include: { members: true },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      if (memberHandles !== undefined) {
        const resolvedMembers = [];
        for (const handle of memberHandles) {
        const user = await resolveSlackUser(handle, userId);
          if (!user) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Could not resolve Slack handle: ${handle}`,
            });
          }
          resolvedMembers.push({
            projectId: id,
            slackUserId: user.id,
            slackHandle: user.realName || user.name,
            role: "MEMBER",
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
      await prisma.project.delete({ where: { id: input.id } });
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
});
