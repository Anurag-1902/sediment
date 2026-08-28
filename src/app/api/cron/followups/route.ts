import { runFollowups } from "@/lib/scheduler";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestHeaders = await headers();
  const cronSecret = requestHeaders.get("x-cron-secret");

  if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return Response.json(await runFollowups());
}
