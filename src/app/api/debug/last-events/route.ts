import { getLastEvents } from "@/lib/debug-events";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestHeaders = await headers();
  const secret = requestHeaders.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await getLastEvents();
  return Response.json({ count: events.length, events });
}
