import { runFollowups } from "@/lib/scheduler";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestHeaders = await headers();
  const url = new URL(request.url);
  const cronSecret = requestHeaders.get("x-cron-secret") || url.searchParams.get("secret");

  if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return Response.json(await runFollowups());
}
