import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("[RESEND] RESEND_API_KEY not set — emails will fail");
}

export const resend = new Resend(process.env.RESEND_API_KEY || "");

// Use Resend's default sender — no domain config needed
export const EMAIL_FROM = "Sediment <onboarding@resend.dev>";
