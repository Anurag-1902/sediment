import { getPrisma } from "@/lib/krutai-server";
import { getSlackClient, verifySlackRequest } from "@/server/slack";
import { extractTasks, summarizeUpdate, updateProjectContext } from "@/server/ai";

export const dynamic = "force-dynamic";

let cachedBotUserId: string | null = null;

async function getBotUserId() {
  if (cachedBotUserId) return cachedBotUserId;
  const client = getSlackClient();
  const result = await client.auth.test();
  cachedBotUserId = result.user_id ?? null;
  return cachedBotUserId;
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

export async function POST(request: Request) {
  const signingSecret = requireEnv("SLACK_SIGNING_SECRET");
  const signature = request.headers.get("x-slack-signature") ?? "";
  const timestamp = request.headers.get("x-slack-request-timestamp") ?? "";

  const rawBody = await request.text();

  if (!verifySlackRequest(signingSecret, timestamp, rawBody, signature)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = JSON.parse(rawBody);

  if (body.type === "url_verification") {
    return Response.json({ challenge: body.challenge });
  }

  if (body.type === "event_callback") {
    const event = body.event;

    if (event.type === "message") {
      if (event.bot_id || event.subtype) {
        return Response.json({ ok: true });
      }
      const botUserId = await getBotUserId();
      if (event.user === botUserId) {
        return Response.json({ ok: true });
      }

      if (event.thread_ts && event.user && event.text) {
        await handleThreadReply(event);
      }
    }

    if (event.type === "app_mention") {
      return Response.json({ ok: true });
    }

    return Response.json({ ok: true });
  }

  return Response.json({ ok: true });
}

async function handleThreadReply(event: {
  channel: string;
  thread_ts: string;
  ts: string;
  user: string;
  text: string;
}) {
  const prisma = await getPrisma();

  const session = await prisma.syncSession.findFirst({
    where: { slackMessageTs: event.thread_ts, status: "ACTIVE" },
    include: { project: true },
  });

  if (!session) return;

  const member = await prisma.projectMember.findFirst({
    where: { projectId: session.projectId, slackUserId: event.user },
  });
  if (!member) return;

  const aiSummary = await summarizeUpdate(event.text);
  const extractedTasks = await extractTasks(event.text);

  const update = await prisma.devUpdate.create({
    data: {
      sessionId: session.id,
      slackUserId: event.user,
      slackMessageTs: event.ts,
      rawText: event.text,
      aiSummary,
      tasks: extractedTasks as any,
    },
  });

  for (const taskData of extractedTasks) {
    const normalizedStatus =
      taskData.status === "OPEN"
        ? "OPEN"
        : taskData.status === "IN_PROGRESS"
          ? "IN_PROGRESS"
          : taskData.status === "BLOCKED"
            ? "BLOCKED"
            : taskData.status === "CLOSED"
              ? "CLOSED"
              : "OPEN";

    const existingTask = await prisma.task.findFirst({
      where: {
        projectId: session.projectId,
        description: taskData.description,
        status: { not: "CLOSED" },
      },
    });

    if (existingTask) {
      await prisma.task.update({
        where: { id: existingTask.id },
        data: {
          status: normalizedStatus,
          lastMentionedAt: new Date(),
        },
      });
    } else {
      await prisma.task.create({
        data: {
          projectId: session.projectId,
          description: taskData.description,
          status: normalizedStatus,
          assignedToUserId: member.userId ?? null,
          lastMentionedAt: new Date(),
          createdFromUpdateId: update.id,
        },
      });
    }
  }

  const allUpdates = await prisma.devUpdate.findMany({
    where: { sessionId: session.id },
    select: { aiSummary: true },
  });

  if (allUpdates.length > 0 && session.project.contextPlainText) {
    const newContext = await updateProjectContext(
      session.project.contextPlainText,
      allUpdates.map((u: { aiSummary: string | null }) => u.aiSummary ?? "").filter((s: string): s is string => Boolean(s))
    );

    await prisma.project.update({
      where: { id: session.projectId },
      data: { contextPlainText: newContext },
    });

    await prisma.projectContextLog.create({
      data: {
        projectId: session.projectId,
        updateType: "AUTO_SYNC",
        oldContext: session.project.contextPlainText,
        newContext,
        updatedBy: session.project.ownerId,
      },
    });
  }
}
