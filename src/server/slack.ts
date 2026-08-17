import type { ConversationsRepliesResponse } from "@slack/web-api";
import { WebClient } from "@slack/web-api";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

let slackClient: WebClient | null = null;

export function getSlackClient() {
  if (!slackClient) {
    const token = requireEnv("SLACK_BOT_TOKEN");
    slackClient = new WebClient(token);
  }
  return slackClient;
}

export function verifySlackRequest(
  signingSecret: string,
  timestamp: string,
  rawBody: string,
  signature: string
) {
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", signingSecret);
  const data = `v0:${timestamp}:${rawBody}`;
  hmac.update(data);
  const computed = `v0=${hmac.digest("hex")}`;

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
  projectName: string
) {
  const client = getSlackClient();
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
  taskDescription: string
) {
  const client = getSlackClient();
  const text = `<@${slackUserId}> — any status on *${taskDescription}*?`;
  return client.chat.postMessage({
    channel,
    thread_ts: threadTs,
    text,
    icon_emoji: ":question:",
  });
}

export async function getChannelList() {
  const client = getSlackClient();
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

const userCache = new Map<string, { id: string; name: string; realName?: string }>();

export async function resolveSlackUser(handle: string) {
  const client = getSlackClient();
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

export async function getThreadReplies(channel: string, threadTs: string) {
  const client = getSlackClient();
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
