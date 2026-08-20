import { getPrisma } from "@/lib/krutai-server";
import {
  getSlackClientForUser,
  getSlackConfigByWorkspaceId,
  verifySlackRequest,
} from "@/server/slack";
import { extractTasks, summarizeUpdate, updateProjectContext } from "@/server/ai";
import { recordEvent, recordCheckpoint } from "@/lib/debug-events";

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

  recordEvent({
    type: body.type,
    eventType: body.event?.type,
    user: body.event?.user,
    thread_ts: body.event?.thread_ts,
    ts: body.event?.ts,
    subtype: body.event?.subtype,
    bot_id: body.event?.bot_id,
    channel: body.event?.channel,
    textPreview: body.event?.text?.slice(0, 40),
    team_id: body.team_id,
    eventTeam: body.event?.team,
  }).catch(() => {});

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

  const prisma = await getPrisma();
  let workspace = null;

  // Try to match by workspaceId first
  if (teamId) {
    workspace = await prisma.slackWorkspace.findFirst({
      where: { workspaceId: teamId },
    });
  }

  // FALLBACK: if no match by teamId, and there's exactly one workspace
  // in the system, use it (covers the case where workspaceId wasn't stored)
  if (!workspace) {
    const allWorkspaces = await prisma.slackWorkspace.findMany({ take: 2 });
    if (allWorkspaces.length === 1) {
      workspace = allWorkspaces[0];
      // Backfill the workspaceId for next time
      if (teamId && !workspace.workspaceId) {
        await prisma.slackWorkspace.update({
          where: { id: workspace.id },
          data: { workspaceId: teamId },
        });
      }
    }
  }

  if (workspace) {
    const { decrypt } = await import("@/lib/crypto");
    signingSecret = decrypt(workspace.signingSecretEnc);
    workspaceUserId = workspace.userId;
  }

  // Record what we resolved for debugging
  await recordCheckpoint("workspace_lookup", {
    teamId,
    found: !!workspace,
    workspaceUserId,
  }).catch(() => {});

  if (!signingSecret) {
    await recordCheckpoint("no_signing_secret", { teamId }).catch(() => {});
    return Response.json({ error: "Unknown workspace" }, { status: 401 });
  }

  const sigValid = verifySlackRequest(signingSecret, timestamp, rawBody, signature);
  await recordCheckpoint("signature_check", {
    valid: sigValid,
    hasSignature: !!signature,
    hasTimestamp: !!timestamp,
    signaturePreview: signature.slice(0, 15),
    timestampValue: timestamp,
    rawBodyLength: rawBody.length,
    signingSecretLength: signingSecret.length,
  }).catch(() => {});

  if (!sigValid) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (body.type === "event_callback") {
    const event = body.event;

    if (event.type === "message") {
      if (event.bot_id || event.subtype) {
        return Response.json({ ok: true });
      }
      if (workspaceUserId) {
        try {
          const botUserId = await getBotUserId(workspaceUserId);
          if (event.user === botUserId) {
            return Response.json({ ok: true });
          }
        } catch (err) {
          await recordCheckpoint("botcheck_failed", { error: String(err) }).catch(() => {});
          // Continue anyway — we filter bot messages by bot_id/subtype above already
        }
      }

      if (event.thread_ts && event.user && event.text) {
        handleThreadReply(event).catch(async (err) => {
          await recordCheckpoint("handleThreadReply_threw", { error: String(err) }).catch(() => {});
        });
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
  await recordCheckpoint("handleThreadReply_entered", {
    thread_ts: event.thread_ts,
    user: event.user,
  }).catch(() => {});
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
    await recordCheckpoint("no_session", { thread_ts: event.thread_ts });
    return;
  }
  console.log("[events] Session found", { sessionId: session.id, projectId: session.projectId });
  await recordCheckpoint("session_found", { sessionId: session.id, projectId: session.projectId });

  const member = await prisma.projectMember.findFirst({
    where: { projectId: session.projectId, slackUserId: event.user },
  });
  if (!member) {
    console.log("[events] User is not a project member", {
      slackUserId: event.user,
      projectId: session.projectId
    });
    await recordCheckpoint("not_member", { user: event.user, projectId: session.projectId });
    return;
  }
  console.log("[events] Member validated", { memberId: member.id });
  await recordCheckpoint("member_ok", { memberId: member.id });

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
    await recordCheckpoint("update_created", { updateId: update.id });

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
    await recordCheckpoint("processing_error", { error: String(err) });
    console.error("[events] handleThreadReply processing failed:", err);
  }
}
