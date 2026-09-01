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

  // Close sessions older than 20 hours so they don't accumulate,
  // but keep today's session open all day for late replies
  const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);
  await prisma.syncSession.updateMany({
    where: {
      status: "ACTIVE",
      scheduledAt: { lt: twentyHoursAgo },
    },
    data: { status: "COMPLETED" },
  });

  const activeProjects = await prisma.project.findMany({
    where: { isActive: true },
    include: {
      members: true,
      organization: {
        select: {
          plan: true,
          planExpiresAt: true,
        },
      },
    },
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

    // Skip if the org's plan has expired
    if (project.organization?.planExpiresAt) {
      const expiry = new Date(project.organization.planExpiresAt);
      if (expiry < now) {
        results.push({ project: project.name, status: "skipped", reason: "plan_expired" });
        continue;
      }
    }

    // Skip if no plan is set at all (free users shouldn't get standups)
    if (!project.organization?.plan) {
      results.push({ project: project.name, status: "skipped", reason: "no_plan" });
      continue;
    }

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
    const slackResult = await postSyncMessage(
      project.slackChannelId,
      project.name,
      project.organizationId,
      project.standupPrompt
    );

    // If Slack didn't return a message ts, replies could never attach to the
    // session — so don't create a zombie session. Record the failure instead.
    if (!slackResult.ts) {
      console.error(`No message ts returned for project ${project.id} — standup not recorded`);
      results.push({ projectId: project.id, status: "error", error: "no_message_ts" });
      continue;
    }

    const session = await prisma.syncSession.create({
      data: {
        projectId: project.id,
        scheduledAt: now,
        status: "ACTIVE",
        slackMessageTs: slackResult.ts,
      },
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
      followUpsSentAt: null,
      scheduledAt: {
        gte: thirtyTwoMinAgo,
        lte: twentyEightMinAgo,
      },
    },
    include: {
      project: {
        include: {
          organization: {
            select: {
              plan: true,
              planExpiresAt: true,
            },
          },
        },
      },
    },
  });

  const results = [];

  for (const session of sessions) {
    try {
      // Skip follow-ups if plan expired
      if (session.project.organization?.planExpiresAt) {
        const expiry = new Date(session.project.organization.planExpiresAt);
        if (expiry < new Date()) continue;
      }
      if (!session.project.organization?.plan) continue;

      const config = await getSlackConfigForOrg(session.project.organizationId);
      if (!config) {
        results.push({
          sessionId: session.id,
          status: "skipped",
          error: "Owner has not connected Slack workspace",
        });
        await prisma.syncSession.update({
          where: { id: session.id },
          data: { followUpsSentAt: new Date() },
        });
        continue;
      }

      const tasks = await prisma.task.findMany({
        where: {
          projectId: session.projectId,
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
      });

      // A task needs a follow-up if it's still open AND was not mentioned
      // during this session's window (i.e. lastMentionedAt is before the session started).
      const unmentionedTasks = tasks.filter((t: { lastMentionedAt: Date | null }) => {
        // If the task was mentioned at or after this session's scheduled time,
        // the assignee already gave an update on it — skip.
        if (t.lastMentionedAt && t.lastMentionedAt >= session.scheduledAt) {
          return false;
        }
        return true;
      });

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
        data: { followUpsSentAt: new Date() },
      });

      results.push({ sessionId: session.id, status: "completed", followUps: unmentionedTasks.length });
    } catch (error) {
      console.error(`Failed to process follow-ups for session ${session.id}:`, error);
      results.push({ sessionId: session.id, status: "error", error: String(error) });
    }
  }

  return { ok: true, processed: results.length, results };
}
