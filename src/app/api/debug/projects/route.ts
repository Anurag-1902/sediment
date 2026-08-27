import { getPrisma } from "@/lib/krutai-server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const prisma = await getPrisma();
  const url = new URL(req.url);
  const deactivateId = url.searchParams.get("deactivate");

  if (deactivateId) {
    await prisma.project.update({
      where: { id: deactivateId },
      data: { isActive: false },
    });
    return NextResponse.json({ ok: true, deactivated: deactivateId });
  }

  const projects = await prisma.project.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      syncTime: true,
      syncTimezone: true,
      slackChannelId: true,
      isActive: true,
      owner: { select: { name: true } },
    },
  });
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const { projectId } = await req.json();
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }
  const prisma = await getPrisma();
  await prisma.project.update({
    where: { id: projectId },
    data: { isActive: false },
  });
  return NextResponse.json({ ok: true, deactivated: projectId });
}
