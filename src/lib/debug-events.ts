import { getPrisma } from "@/lib/krutai-server";

export async function recordEvent(e: any) {
  try {
    const prisma = await getPrisma();
    await prisma.debugEvent.create({ data: { payload: e } });
    // Keep only the last 20
    const all = await prisma.debugEvent.findMany({
      orderBy: { createdAt: "desc" },
      skip: 20,
      select: { id: true },
    });
    if (all.length > 0) {
      await prisma.debugEvent.deleteMany({
        where: { id: { in: all.map((r) => r.id) } },
      });
    }
  } catch (err) {
    console.error("[debug] recordEvent failed:", err);
  }
}

export async function recordCheckpoint(label: string, data: any) {
  try {
    const prisma = await getPrisma();
    await prisma.debugEvent.create({
      data: { payload: { checkpoint: label, ...data } },
    });
  } catch (err) {
    console.error("[debug] recordCheckpoint failed:", err);
  }
}

export async function getLastEvents() {
  const prisma = await getPrisma();
  return prisma.debugEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
