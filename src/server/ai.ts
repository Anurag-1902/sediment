import { krutAI } from "@krutai/ai-provider";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

let aiPromise: ReturnType<typeof initAI> | null = null;

async function initAI() {
  const apiKey = requireEnv("KRUTAI_API_KEY");
  const serverUrl = requireEnv("KRUTAI_SERVER_URL");
  const ai = krutAI({
    apiKey,
    serverUrl,
    model: "gemini-3.1-pro-preview",
    validateOnInit: false,
  });
  await ai.initialize();
  return ai;
}

export async function getAI() {
  if (!aiPromise) {
    aiPromise = initAI().catch((e) => {
      aiPromise = null;
      throw e;
    });
  }
  return aiPromise;
}

export async function summarizeUpdate(rawText: string) {
  const ai = await getAI();
  const system = `You are a concise standup update summarizer. Summarize the developer's update in 1-2 sentences, highlighting key tasks, progress, and blockers.`;
  const result = await ai.chat<string>(rawText, { system });
  return result;
}

export async function extractTasks(rawText: string) {
  const ai = await getAI();
  const system = `You are a task extraction assistant. Given a developer standup update, extract discrete tasks mentioned. Return ONLY valid JSON in the format: {"tasks": [{"description": string, "status": "OPEN" | "IN_PROGRESS" | "BLOCKED" | "CLOSED"}]}. Infer status from the text: "finished" = CLOSED, "blocked" = BLOCKED, "working on" = IN_PROGRESS, "plan to" = OPEN.`;
  const result = await ai.chat<string>(rawText, { system });
  try {
    const parsed = JSON.parse(result);
    return parsed.tasks as Array<{ description: string; status: string }>;
  } catch {
    return [] as Array<{ description: string; status: string }>;
  }
}

export async function updateProjectContext(
  currentContext: string,
  updateSummaries: string[]
) {
  const ai = await getAI();
  const system = `You are a project context curator. Given the current project context and recent standup summaries, produce a concise updated project context paragraph (3-5 sentences max) that captures the evolving state. Do not repeat verbatim; synthesize.`;
  const prompt = `Current context:\n${currentContext}\n\nRecent updates:\n${updateSummaries.join("\n")}`;
  return await ai.chat<string>(prompt, { system });
}

export async function answerProjectQuestion(
  question: string,
  context: {
    projectName: string;
    projectContext: string;
    recentUpdates: string[];
    tasks: Array<{ description: string; status: string }>;
  }
) {
  const ai = await getAI();
  const system = `You are Sediment, an AI assistant embedded in a standup automation platform. Answer business user questions using only the provided project context, recent updates, and task list. Be concise and factual. If you don't know, say so.`;
  const prompt = `Project: ${context.projectName}\n\nProject Context:\n${context.projectContext}\n\nRecent Updates:\n${context.recentUpdates.join("\n")}\n\nTasks:\n${context.tasks.map((t) => `[${t.status}] ${t.description}`).join("\n")}\n\nQuestion: ${question}`;
  return await ai.chat<string>(prompt, { system });
}
