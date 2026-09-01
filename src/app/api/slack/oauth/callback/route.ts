import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/krutai-server";
import { decrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({ error: `Slack OAuth error: ${error}` }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  if (!state) {
    return NextResponse.json(
      { error: "Missing state. Connect your workspace via Dashboard > Slack Integration." },
      { status: 400 }
    );
  }

  const prisma = await getPrisma();
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: state },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "No organization found for this user. Please save your credentials in the dashboard first." },
      { status: 400 }
    );
  }

  const workspace = await prisma.slackWorkspace.findUnique({
    where: { organizationId: membership.organizationId },
  });

  if (!workspace) {
    return NextResponse.json(
      { error: "No Slack workspace found for this organization. Please save your credentials in the dashboard first." },
      { status: 400 }
    );
  }

  const clientId = decrypt(workspace.clientIdEnc);
  const clientSecret = decrypt(workspace.clientSecretEnc);
  const redirectUri = `${process.env.APP_URL}/api/slack/oauth/callback`;

  try {
    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json({ error: data.error || "OAuth failed" }, { status: 400 });
    }

    if (data.team?.id) {
      await prisma.slackWorkspace.update({
        where: { organizationId: membership.organizationId },
        data: { workspaceId: data.team.id },
      });
    }

    return NextResponse.json({
      ok: true,
      workspace: data.team?.name,
      workspaceId: data.team?.id,
      botUserId: data.bot_user_id,
    });
  } catch (e) {
    return NextResponse.json({ error: "OAuth request failed" }, { status: 500 });
  }
}
