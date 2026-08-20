import { getLastEvents } from "@/lib/debug-events";

export async function GET() {
  return Response.json({ events: getLastEvents() });
}
