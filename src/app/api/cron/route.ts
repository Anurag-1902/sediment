import { postSyncMessage } from "@/server/slack";
import { getPrisma } from "@/lib/krutai-server";

export const dynamic = "force-dynamic";

function getLocalTimeInTimezone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hh}:${mm}`;
}

export async function GET() {
  const prisma = await getPrisma();
  const now = new Date();

  const activeProjects = await prisma.project.findMany({
    where: { isActive: true },
    include: { members: true },
  });

  const results = [];

  for (const project of activeProjects) {
    const localTime = getLocalTimeInTimezone(now, project.syncTimezone);
    if (localTime !== project.syncTime) continue;

    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const recentSession = await prisma.syncSession.findFirst({
      where: {
        projectId: project.id,
        scheduledAt: { gte: fiveMinutesAgo },
      },
    });

    if (recentSession) {
      results.push({ projectId: project.id, status: "skipped", reason: "recent_session_exists" });
      continue;
    }

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

  return Response.json({ ok: true, sent: results.length, results });
}
