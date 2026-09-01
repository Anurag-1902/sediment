import { getLastEvents } from "@/lib/debug-events";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestHeaders = await headers();
  const secret = requestHeaders.get("x-debug-secret");
  if (!process.env.DEBUG_SECRET || secret !== process.env.DEBUG_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await getLastEvents();
  return Response.json({ count: events.length, events });
}
