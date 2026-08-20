import { getPrisma } from "@/lib/krutai-server";
import { resolveSlackUser } from "@/server/slack";

export const dynamic = "force-dynamic";

export async function GET() {
  const prisma = await getPrisma();
  const members = await prisma.projectMember.findMany({
    include: { project: true },
  });
  const results = [];
  for (const m of members) {
    try {
      const resolved = await resolveSlackUser(
        m.slackUserId,
        m.project.ownerId
      );
      if (resolved && resolved.realName) {
        await prisma.projectMember.update({
          where: { id: m.id },
          data: { slackHandle: resolved.realName },
        });
        results.push({ id: m.id, oldHandle: m.slackHandle, newHandle: resolved.realName, ok: true });
      } else {
        results.push({ id: m.id, ok: false, reason: "no real name" });
      }
    } catch (e) {
      results.push({ id: m.id, ok: false, error: String(e) });
    }
  }
  return Response.json({ updated: results.length, results });
}
