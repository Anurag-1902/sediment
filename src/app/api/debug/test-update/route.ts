import { getPrisma } from "@/lib/krutai-server";
import { summarizeUpdate, extractTasks } from "@/server/ai";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestHeaders = await headers();
  const secret = requestHeaders.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const steps: any[] = [];
  try {
    const prisma = await getPrisma();
    steps.push({ step: "prisma", ok: true });

    // Find the most recent ACTIVE session
    const session = await prisma.syncSession.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: { project: true },
    });
    steps.push({
      step: "session",
      ok: !!session,
      sessionId: session?.id,
      slackMessageTs: session?.slackMessageTs,
      projectId: session?.projectId,
    });
    if (!session) return Response.json({ steps, error: "no active session" });

    // Check members
    const members = await prisma.projectMember.findMany({
      where: { projectId: session.projectId },
    });
    steps.push({
      step: "members",
      count: members.length,
      slackUserIds: members.map((m) => m.slackUserId),
    });

    // Test AI summarize
    let aiSummary: string | null = null;
    try {
      aiSummary = await summarizeUpdate("Test update: finished the auth flow, working on the dashboard, blocked on API review.");
      steps.push({ step: "summarizeUpdate", ok: true, result: aiSummary });
    } catch (e) {
      steps.push({ step: "summarizeUpdate", ok: false, error: String(e) });
    }

    // Test AI extract tasks
    try {
      const tasks = await extractTasks("Test update: finished the auth flow, working on the dashboard, blocked on API review.");
      steps.push({ step: "extractTasks", ok: true, result: tasks });
    } catch (e) {
      steps.push({ step: "extractTasks", ok: false, error: String(e) });
    }

    // Try creating a real DevUpdate with the first member
    if (members.length > 0) {
      try {
        const update = await prisma.devUpdate.create({
          data: {
            sessionId: session.id,
            slackUserId: members[0].slackUserId,
            slackMessageTs: `debug-${Date.now()}`,
            rawText: "DEBUG TEST UPDATE - you can delete this",
            aiSummary: aiSummary,
            tasks: [],
          },
        });
        steps.push({ step: "devUpdate.create", ok: true, updateId: update.id });
      } catch (e) {
        steps.push({ step: "devUpdate.create", ok: false, error: String(e) });
      }
    }

    return Response.json({ ok: true, steps });
  } catch (e) {
    return Response.json({ ok: false, steps, error: String(e) }, { status: 500 });
  }
}
