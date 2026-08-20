import { getLastEvents } from "@/lib/debug-events";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = await getLastEvents();
  return Response.json({ count: events.length, events });
}
