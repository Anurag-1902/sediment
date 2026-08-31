import { runStandupSync } from "@/lib/scheduler";
import { getPrisma } from "@/lib/krutai-server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  console.log("[CRON] /api/cron hit at", new Date().toISOString());

  const requestHeaders = await headers();
  const url = new URL(request.url);
  const cronSecret = requestHeaders.get("x-cron-secret") || url.searchParams.get("secret");

  if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const prisma = await getPrisma();
  await prisma.project.updateMany({
    where: { syncTimezone: "America/New_York" },
    data: { syncTimezone: "Asia/Kolkata" },
  });

  const result = await runStandupSync();
  console.log("[CRON] runStandupSync result:", JSON.stringify(result));
  return Response.json(result);
}
