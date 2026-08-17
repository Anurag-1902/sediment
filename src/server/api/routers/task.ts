import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const taskRouter = createTRPCRouter({
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
      return prisma.task.findMany({
        where: { projectId: input.projectId },
        include: { assignedTo: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["OPEN", "IN_PROGRESS", "BLOCKED", "CLOSED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prisma = await ctx.getPrisma();
      const userId = ctx.session.user.id;
      const task = await prisma.task.findFirst({
        where: { id: input.id },
        include: { project: true },
      });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }
      if (
        task.project.ownerId !== userId &&
        !(await prisma.projectMember.findFirst({
          where: { projectId: task.projectId, userId },
        }))
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No access" });
      }
      return prisma.task.update({
        where: { id: input.id },
        data: { status: input.status },
        include: { assignedTo: { select: { id: true, name: true } } },
      });
    }),
});
