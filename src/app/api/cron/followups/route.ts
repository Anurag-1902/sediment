import { getPrisma } from "@/lib/krutai-server";
import { postFollowUpMessage, getSlackConfigForOrg } from "@/server/slack";

export const dynamic = "force-dynamic";

export async function GET() {
  const prisma = await getPrisma();
  const now = new Date();
  const thirtyTwoMinAgo = new Date(now.getTime() - 32 * 60 * 1000);
  const twentyEightMinAgo = new Date(now.getTime() - 28 * 60 * 1000);

  const sessions = await prisma.syncSession.findMany({
    where: {
      status: "ACTIVE",
      scheduledAt: {
        gte: thirtyTwoMinAgo,
        lte: twentyEightMinAgo,
      },
    },
    include: { project: true },
  });

  const results = [];

  for (const session of sessions) {
    try {
      const config = await getSlackConfigForOrg(session.project.organizationId);
      if (!config) {
        results.push({
          sessionId: session.id,
          status: "skipped",
          error: "Owner has not connected Slack workspace",
        });
        await prisma.syncSession.update({
          where: { id: session.id },
          data: { status: "COMPLETED" },
        });
        continue;
      }

      const mentionedTaskIds = new Set(
        (
          await prisma.devUpdate.findMany({
            where: { sessionId: session.id },
            select: { tasks: true },
          })
        )
          .flatMap((u: { tasks: unknown }) => (u.tasks as Array<{ description?: string }> | null) ?? [])
          .map((t: { description?: string }) => t.description)
          .filter((d: string | undefined): d is string => Boolean(d))
      );

      const tasks = await prisma.task.findMany({
        where: {
          projectId: session.projectId,
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
      });

      const unmentionedTasks = tasks.filter(
        (t: { description: string }) => !mentionedTaskIds.has(t.description)
      );

      for (const task of unmentionedTasks) {
        const member = await prisma.projectMember.findFirst({
          where: {
            projectId: session.projectId,
            userId: task.assignedToUserId,
          },
        });

        if (member && session.slackMessageTs) {
          try {
            await postFollowUpMessage(
              session.project.slackChannelId,
              session.slackMessageTs,
              member.slackUserId,
              task.description,
              session.project.ownerId
            );

            await prisma.followUp.create({
              data: {
                taskId: task.id,
                sessionId: session.id,
              },
            });
          } catch (e) {
            console.error("Follow-up failed:", e);
          }
        }
      }

      await prisma.syncSession.update({
        where: { id: session.id },
        data: { status: "COMPLETED" },
      });

      results.push({ sessionId: session.id, status: "completed", followUps: unmentionedTasks.length });
    } catch (error) {
      console.error(`Failed to process follow-ups for session ${session.id}:`, error);
      results.push({ sessionId: session.id, status: "error", error: String(error) });
    }
  }

  return Response.json({ ok: true, processed: results.length, results });
}
