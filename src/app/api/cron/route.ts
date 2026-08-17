import { getSlackClient, postSyncMessage } from "@/server/slack";
import { getPrisma } from "@/lib/krutai-server";
import { summarizeUpdate, extractTasks, updateProjectContext } from "@/server/ai";

export const dynamic = "force-dynamic";

export async function GET() {
  const prisma = await getPrisma();
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, "0");
  const currentMinute = now.getMinutes().toString().padStart(2, "0");
  const currentTime = `${currentHour}:${currentMinute}`;

  const dueProjects = await prisma.project.findMany({
    where: {
      isActive: true,
      syncTime: currentTime,
    },
    include: { members: true },
  });

  const results = [];

  for (const project of dueProjects) {
    try {
      const session = await prisma.syncSession.create({
        data: {
          projectId: project.id,
          scheduledAt: now,
          status: "ACTIVE",
        },
      });

      const slackResult = await postSyncMessage(
        project.slackChannelId,
        project.name
      );

      await prisma.syncSession.update({
        where: { id: session.id },
        data: { slackMessageTs: slackResult.ts ?? undefined },
      });

      results.push({ projectId: project.id, status: "sent", ts: slackResult.ts });
    } catch (error) {
      console.error(`Failed to send sync for project ${project.id}:`, error);
      results.push({ projectId: project.id, status: "error", error: String(error) });
    }
  }

  return Response.json({ ok: true, time: currentTime, sent: results.length, results });
}
