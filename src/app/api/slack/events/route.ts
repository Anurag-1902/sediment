import { getPrisma } from "@/lib/krutai-server";
import {
  getSlackClientForUser,
  getSlackConfigByWorkspaceId,
  verifySlackRequest,
} from "@/server/slack";
import { extractTasks, summarizeUpdate, updateProjectContext } from "@/server/ai";
import { recordEvent } from "@/lib/debug-events";

export const dynamic = "force-dynamic";

const botUserIdCache = new Map<string, string | null>();

async function getBotUserId(userId: string) {
  if (botUserIdCache.has(userId)) return botUserIdCache.get(userId);

  const client = await getSlackClientForUser(userId);
  const result = await client.auth.test();
  const botUserId = result.user_id ?? null;
  botUserIdCache.set(userId, botUserId);
  return botUserId;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const body = JSON.parse(rawBody);

  if (body.type === "event_callback" && body.event?.type === "message") {
    console.log("[events] RAW message event", JSON.stringify({
      user: body.event.user,
      thread_ts: body.event.thread_ts,
      ts: body.event.ts,
      channel: body.event.channel,
      subtype: body.event.subtype,
      bot_id: body.event.bot_id,
      text: body.event.text?.slice(0, 40),
    }));
  }

  // Handle URL verification FIRST — no team_id or signature needed
  if (body.type === "url_verification") {
    return Response.json({ challenge: body.challenge });
  }

  // For all other requests, verify signature
  const signature = request.headers.get("x-slack-signature") ?? "";
  const timestamp = request.headers.get("x-slack-request-timestamp") ?? "";

  let signingSecret: string | undefined;
  let workspaceUserId: string | undefined;

  const teamId = body.team_id ?? body?.event?.team;
  if (teamId) {
    const prisma = await getPrisma();
    const workspace = await prisma.slackWorkspace.findFirst({
      where: { workspaceId: teamId },
    });
    if (workspace) {
      const { decrypt } = await import("@/lib/crypto");
      signingSecret = decrypt(workspace.signingSecretEnc);
      workspaceUserId = workspace.userId;
    }
  }

  if (!signingSecret) {
    return Response.json({ error: "Unknown workspace" }, { status: 401 });
  }

  if (!verifySlackRequest(signingSecret, timestamp, rawBody, signature)) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (body.type === "event_callback") {
    const event = body.event;

    if (event.type === "message") {
      recordEvent({
        user: event.user,
        thread_ts: event.thread_ts,
        ts: event.ts,
        channel: event.channel,
        subtype: event.subtype,
        bot_id: event.bot_id,
        text: event.text?.slice(0, 40),
      });

      if (event.bot_id || event.subtype) {
        return Response.json({ ok: true });
      }
      if (workspaceUserId) {
        const botUserId = await getBotUserId(workspaceUserId);
        if (event.user === botUserId) {
          return Response.json({ ok: true });
        }
      }

      if (event.thread_ts && event.user && event.text) {
        // Fire and forget — don't await, so Slack gets fast 200
        handleThreadReply(event).catch((err) =>
          console.error("[events] async handleThreadReply failed:", err)
        );
      }
      return Response.json({ ok: true });
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

  console.log("[events] handleThreadReply called", {
    channel: event.channel,
    thread_ts: event.thread_ts,
    user: event.user,
    textPreview: event.text.slice(0, 50)
  });

  const session = await prisma.syncSession.findFirst({
    where: { slackMessageTs: event.thread_ts, status: "ACTIVE" },
    include: { project: true },
  });

  if (!session) {
    console.log("[events] No matching ACTIVE session for thread_ts", event.thread_ts);
    return;
  }
  console.log("[events] Session found", { sessionId: session.id, projectId: session.projectId });

  const member = await prisma.projectMember.findFirst({
    where: { projectId: session.projectId, slackUserId: event.user },
  });
  if (!member) {
    console.log("[events] User is not a project member", {
      slackUserId: event.user,
      projectId: session.projectId
    });
    return;
  }
  console.log("[events] Member validated", { memberId: member.id });

  try {
    let aiSummary: string | null = null;
    let extractedTasks: Array<{ description: string; status: string }> = [];

    try {
      aiSummary = await summarizeUpdate(event.text);
    } catch (err) {
      console.error("[events] summarizeUpdate failed:", err);
      aiSummary = null;
    }

    try {
      extractedTasks = await extractTasks(event.text);
    } catch (err) {
      console.error("[events] extractTasks failed:", err);
      extractedTasks = [];
    }

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
    console.log("[events] DevUpdate created", { updateId: update.id });

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
        allUpdates
          .map((u: { aiSummary: string | null }) => u.aiSummary ?? "")
          .filter((s: string): s is string => Boolean(s))
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
  } catch (err) {
    console.error("[events] handleThreadReply processing failed:", err);
  }
}
