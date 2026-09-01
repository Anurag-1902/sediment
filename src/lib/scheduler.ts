import { postSyncMessage, getSlackConfigForOrg, postFollowUpMessage } from "@/server/slack";
import { getPrisma } from "@/lib/krutai-server";

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

export async function runStandupSync() {
  const prisma = await getPrisma();
  const now = new Date();

  const activeProjects = await prisma.project.findMany({
    where: { isActive: true },
    include: { members: true },
  });

  const results = [];

  for (const project of activeProjects) {
    const localTime = getLocalTimeInTimezone(now, project.syncTimezone);
    // Allow a 2-minute window to handle cron drift
    const [syncH, syncM] = project.syncTime.split(":").map(Number);
    const [localH, localM] = localTime.split(":").map(Number);
    const syncMinutes = syncH * 60 + syncM;
    const localMinutes = localH * 60 + localM;
    const diff = Math.abs(localMinutes - syncMinutes);
    if (diff > 1 && diff < 1438) continue; // 1438 handles midnight wraparound

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

    const config = await getSlackConfigForOrg(project.organizationId);
    if (!config) {
      results.push({
        projectId: project.id,
        status: "skipped",
        error: "Owner has not connected Slack workspace",
      });
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
        project.name,
        project.organizationId,
        project.standupPrompt
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

  return { ok: true, sent: results.length, results };
}

export async function runFollowups() {
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
            slackUserId: task.assigneeSlackId ?? undefined,
          },
        });

        if (member && session.slackMessageTs) {
          try {
            await postFollowUpMessage(
              session.project.slackChannelId,
              session.slackMessageTs,
              member.slackUserId,
              task.description,
              session.project.organizationId
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

  return { ok: true, processed: results.length, results };
}
