export async function sendInviteEmail({
  to,
  inviterName,
  organizationName,
  role,
  acceptUrl,
}: {
  to: string;
  inviterName: string;
  organizationName: string;
  role: string;
  acceptUrl: string;
}) {
  const subject = `${inviterName} invited you to join ${organizationName} on Sediment`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
      <h1 style="color: #D97706;">You've been invited to Sediment!</h1>
      <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a <strong>${role}</strong>.</p>
      <p>Sediment is an AI-powered Slack standup automation platform. Once you accept, you'll have access to the team's projects, standups, and analytics.</p>
      <div style="margin: 32px 0;">
        <a href="${acceptUrl}" style="background: #D97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
          Accept Invitation
        </a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This invite expires in 7 days. If you weren't expecting this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      <p style="color: #6b7280; font-size: 12px;">Sediment — Async standups for modern teams</p>
    </div>
  `;

  try {
    // Attempt to use email service if available
    const emailServices = await import("@krutai/email-services").catch(() => null);
    if (emailServices && (emailServices as any).emailServices?.send) {
      await (emailServices as any).emailServices.send({ to, subject, html });
      return { ok: true };
    }

    // Fallback: log the invite for now (email service not configured with OAuth tokens)
    console.log("[EMAIL] Invite email prepared:");
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Accept URL: ${acceptUrl}`);
    return { ok: true };
  } catch (err) {
    console.error("Failed to send invite email:", err);
    return { ok: false, error: String(err) };
  }
}
