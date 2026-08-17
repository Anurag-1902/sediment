import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { answerProjectQuestion } from "@/server/ai";

export const aiRouter = createTRPCRouter({
  ask: protectedProcedure
    .input(z.object({ projectId: z.string(), question: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
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

      const recentUpdates = await prisma.devUpdate.findMany({
        where: { session: { projectId: input.projectId } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { rawText: true, aiSummary: true },
      });

      const tasks = await prisma.task.findMany({
        where: { projectId: input.projectId },
        select: { description: true, status: true },
      });

      const answer = await answerProjectQuestion(input.question, {
        projectName: project.name,
        projectContext: project.contextPlainText ?? "No context provided.",
        recentUpdates: recentUpdates.map((u: { aiSummary: string | null; rawText: string }) => u.aiSummary ?? u.rawText),
        tasks,
      });

      await prisma.aIQuery.create({
        data: {
          projectId: input.projectId,
          userId,
          question: input.question,
          answer,
          contextUsed: { updateCount: recentUpdates.length, taskCount: tasks.length },
        },
      });

      return { answer };
    }),

  history: protectedProcedure
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
      return prisma.aIQuery.findMany({
        where: { projectId: input.projectId },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }),
});
