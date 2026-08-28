import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #1f2937;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #D97706; margin: 0; font-size: 24px;">You've been invited to Sediment!</h1>
      </div>
      
      <p style="font-size: 16px; margin-bottom: 16px;">
        <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a <strong>${role}</strong>.
      </p>
      
      <p style="font-size: 16px; color: #6b7280; margin-bottom: 24px;">
        Sediment is an AI-powered Slack standup automation platform. Once you accept, you'll have access to the team's projects, standups, and analytics.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${acceptUrl}" style="background: #D97706; color: #1f2937; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
          Accept Invitation
        </a>
      </div>
      
      <p style="font-size: 14px; color: #9ca3af; margin-top: 32px; text-align: center;">
        This invite expires in 7 days. If you weren't expecting this, you can safely ignore this email.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        Sediment — Async standups for modern teams
      </p>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: "Sediment <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return { ok: false, error: result.error.message };
    }

    return { ok: true };
  } catch (err) {
    console.error("Failed to send invite email:", err);
    return { ok: false, error: String(err) };
  };
}
