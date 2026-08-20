import type { ConversationsRepliesResponse } from "@slack/web-api";
import { WebClient } from "@slack/web-api";
import { getPrisma } from "@/lib/krutai-server";
import { decrypt } from "@/lib/crypto";

export interface SlackConfig {
  clientId: string;
  clientSecret: string;
  signingSecret: string;
  botToken: string;
}

export async function getSlackConfigForUser(
  userId: string
): Promise<SlackConfig | null> {
  const prisma = await getPrisma();
  const workspace = await prisma.slackWorkspace.findUnique({
    where: { userId },
  });

  if (!workspace) {
    return null;
  }

  return {
    clientId: decrypt(workspace.clientIdEnc),
    clientSecret: decrypt(workspace.clientSecretEnc),
    signingSecret: decrypt(workspace.signingSecretEnc),
    botToken: decrypt(workspace.botTokenEnc),
  };
}

export async function getSlackConfigByWorkspaceId(
  workspaceId: string
): Promise<SlackConfig | null> {
  const prisma = await getPrisma();
  const workspace = await prisma.slackWorkspace.findFirst({
    where: { workspaceId },
  });

  if (!workspace) {
    return null;
  }

  return {
    clientId: decrypt(workspace.clientIdEnc),
    clientSecret: decrypt(workspace.clientSecretEnc),
    signingSecret: decrypt(workspace.signingSecretEnc),
    botToken: decrypt(workspace.botTokenEnc),
  };
}

const clientCache = new Map<string, WebClient>();

export async function getSlackClientForUser(userId: string) {
  const config = await getSlackConfigForUser(userId);
  if (!config) {
    throw new Error("Slack credentials not configured for user");
  }

  let client = clientCache.get(userId);
  if (client) return client;

  client = new WebClient(config.botToken);
  clientCache.set(userId, client);
  return client;
}

export function verifySlackRequest(
  signingSecret: string,
  timestamp: string,
  rawBody: string,
  signature: string
) {
  const ts = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(ts) || Math.abs(now - ts) > 300) {
    return false;
  }

  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", signingSecret);
  const data = `v0:${timestamp}:${rawBody}`;
  hmac.update(data);
  const computed = `v0=${hmac.digest("hex")}`;

  console.log("[sig] computed vs received", {
    computedPreview: computed.slice(0, 20),
    receivedPreview: signature.slice(0, 20),
    match: computed === signature,
  });

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch {
    return false;
  }
}

export async function postSyncMessage(
  channel: string,
  projectName: string,
  userId: string
) {
  const client = await getSlackClientForUser(userId);
  const text = `Daily Sync for *${projectName}* — Please reply in thread with your update.\n\nWhat did you do yesterday? What's on today? Any blockers?`;
  const result = await client.chat.postMessage({
    channel,
    text,
    icon_emoji: ":sunrise:",
  });
  return result;
}

export async function postFollowUpMessage(
  channel: string,
  threadTs: string,
  slackUserId: string,
  taskDescription: string,
  userId: string
) {
  const client = await getSlackClientForUser(userId);
  const text = `<@${slackUserId}> — any status on *${taskDescription}*?`;
  return client.chat.postMessage({
    channel,
    thread_ts: threadTs,
    text,
    icon_emoji: ":question:",
  });
}

export async function getChannelList(userId: string) {
  const client = await getSlackClientForUser(userId);
  const result = await client.conversations.list({
    types: "public_channel,private_channel",
    limit: 200,
  });
  return (result.channels ?? []) as Array<{
    id: string;
    name: string;
    is_channel: boolean;
    is_archived: boolean;
  }>;
}

const userCache = new Map<
  string,
  { id: string; name: string; realName?: string }
>();

export async function resolveSlackUser(handle: string, userId: string) {
  const idPattern = /^@?(U[A-Z0-9]{8,10})$/;
  const idMatch = handle.match(idPattern);
    if (idMatch) {
    const client = await getSlackClientForUser(userId);
    try {
      const info = await client.users.info({ user: idMatch[1] });
      if (info.user && !info.user.deleted && !info.user.is_bot) {
        const realName = info.user.profile?.real_name || (info.user as any).real_name;
        const displayName = info.user.profile?.display_name;
        return {
          id: info.user.id!,
          name: realName || displayName || info.user.name || idMatch[1],
          realName: realName,
        };
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  const client = await getSlackClientForUser(userId);
  const cleanHandle = handle.replace(/^@/, "").toLowerCase();

  const cached = userCache.get(cleanHandle);
  if (cached) return cached;

  const result = await client.users.list({ limit: 1000 });
  const members = (result.members ?? []) as Array<{
    id: string;
    name: string;
    profile?: { real_name?: string };
    deleted?: boolean;
    is_bot?: boolean;
  }>;

  for (const m of members) {
    if (!m.deleted && !m.is_bot) {
      const record = {
        id: m.id,
        name: m.name,
        realName: m.profile?.real_name,
      };
      userCache.set(m.name.toLowerCase(), record);
      if (m.profile?.real_name) {
        userCache.set(m.profile.real_name.toLowerCase(), record);
      }
    }
  }

  return userCache.get(cleanHandle);
}

export async function getThreadReplies(
  channel: string,
  threadTs: string,
  userId: string
) {
  const client = await getSlackClientForUser(userId);
  const result = (await client.conversations.replies({
    channel,
    ts: threadTs,
  })) as ConversationsRepliesResponse;
  return (result.messages ?? []) as Array<{
    ts?: string;
    user?: string;
    text?: string;
    thread_ts?: string;
    parent_user_id?: string;
  }>;
}
