import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const updateRouter = createTRPCRouter({
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;
      const project = await prisma.project.findFirst({
        where: {
          id: input.projectId,
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
      });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      return prisma.devUpdate.findMany({
        where: { session: { projectId: input.projectId } },
        include: { session: { select: { scheduledAt: true } }, user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });
    }),

  listBySession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const session = await prisma.syncSession.findFirst({
        where: { id: input.sessionId },
        include: { project: true },
      });
      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }
      const userId = ctx.session.user.id;
      if (
        session.project.ownerId !== userId &&
        !(await prisma.projectMember.findFirst({
          where: { projectId: session.projectId, userId },
        }))
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No access" });
      }
      return prisma.devUpdate.findMany({
        where: { sessionId: input.sessionId },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });
    }),
});
