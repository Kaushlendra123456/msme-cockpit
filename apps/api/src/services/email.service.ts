import { Resend } from "resend";

let resendClient: Resend | null = null;

// Creates the Resend client only when it's actually needed (lazily),
// by which point dotenv.config() has already run in index.ts and
// process.env.RESEND_API_KEY is available. Creating it at module
// load time (top-level) was too early — env vars weren't loaded yet.
const getResendClient = (): Resend => {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

/**
 * Sends the password reset email via Resend.
 *
 * Note: on Resend's free tier without a verified custom domain, emails can
 * only be delivered to the address the Resend account itself was created
 * with — this is a Resend platform limitation, not a bug in this code.
 * Verifying a domain in production removes this restriction.
 */
export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  const resend = getResendClient();
  await resend.emails.send({
    from: "MSME Cockpit <onboarding@resend.dev>",
    to,
    subject: "Reset your MSME Cockpit password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1d4ed8;">Reset your password</h2>
        <p>We received a request to reset your MSME Cockpit password. Click the button below to set a new one — this link expires in 15 minutes.</p>
        <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};