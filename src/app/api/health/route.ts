import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {};

  checks.env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    KRUTAI_API_KEY: !!process.env.KRUTAI_API_KEY,
    KRUTAI_SERVER_URL: !!process.env.KRUTAI_SERVER_URL,
    ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY,
    RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
  };

  try {
    const { getPrisma } = await import("@/lib/krutai-server");
    const prisma = await getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (err: any) {
    checks.database = {
      failed: true,
      name: err?.name,
      message: err?.message,
      code: err?.code,
    };
  }

  try {
    const { getAuthClient } = await import("@/lib/krutai-server");
    await getAuthClient();
    checks.auth = "ok";
  } catch (err: any) {
    checks.auth = { failed: true, name: err?.name, message: err?.message };
  }

  return NextResponse.json(checks, { status: 200 });
}
