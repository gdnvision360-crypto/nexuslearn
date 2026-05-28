import nodemailer from "nodemailer";

// ============================================================
// Email Service — Supports SMTP (e.g. Gmail, SendGrid, Resend)
// ============================================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@nexuslearn.app";
const FROM_NAME = process.env.FROM_NAME || "NexusLearn";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// ============================================================
// Email Verification
// ============================================================

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verifyUrl = `${APP_URL}/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: "Verify your NexusLearn account",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;">NexusLearn</h1>
            </div>
            <!-- Body -->
            <div style="padding:32px;">
              <h2 style="color:#18181b;margin:0 0 8px;">Welcome, ${name}!</h2>
              <p style="color:#52525b;line-height:1.6;margin:0 0 24px;">
                Thanks for signing up. Please verify your email address to activate your account and start using NexusLearn.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                  Verify Email Address
                </a>
              </div>
              <p style="color:#71717a;font-size:13px;line-height:1.5;margin:0 0 16px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color:#4f46e5;font-size:13px;word-break:break-all;margin:0 0 24px;">
                ${verifyUrl}
              </p>
              <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;" />
              <p style="color:#a1a1aa;font-size:12px;margin:0;">
                This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to NexusLearn, ${name}!\n\nPlease verify your email by clicking: ${verifyUrl}\n\nThis link expires in 24 hours.`,
  });
}

// ============================================================
// Password Reset
// ============================================================

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: "Reset your NexusLearn password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;">NexusLearn</h1>
            </div>
            <!-- Body -->
            <div style="padding:32px;">
              <h2 style="color:#18181b;margin:0 0 8px;">Password Reset</h2>
              <p style="color:#52525b;line-height:1.6;margin:0 0 24px;">
                Hi ${name}, we received a request to reset your password. Click the button below to choose a new one.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                  Reset Password
                </a>
              </div>
              <p style="color:#71717a;font-size:13px;line-height:1.5;margin:0 0 16px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color:#4f46e5;font-size:13px;word-break:break-all;margin:0 0 24px;">
                ${resetUrl}
              </p>
              <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;" />
              <p style="color:#a1a1aa;font-size:12px;margin:0;">
                This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't change.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hi ${name},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
  });
}

// ============================================================
// Welcome Email (after verification)
// ============================================================

export async function sendWelcomeEmail(email: string, name: string) {
  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: "Welcome to NexusLearn!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;">NexusLearn</h1>
            </div>
            <div style="padding:32px;">
              <h2 style="color:#18181b;margin:0 0 8px;">You're all set, ${name}!</h2>
              <p style="color:#52525b;line-height:1.6;margin:0 0 24px;">
                Your email has been verified and your account is fully activated. Here's what you can do:
              </p>
              <ul style="color:#52525b;line-height:1.8;padding-left:20px;margin:0 0 24px;">
                <li>Join or host video conferences</li>
                <li>Chat with your team in real-time</li>
                <li>Create and collaborate on documents</li>
                <li>Manage tasks and projects</li>
                <li>Access learning courses</li>
                <li>Track analytics and insights</li>
              </ul>
              <div style="text-align:center;margin:32px 0;">
                <a href="${APP_URL}/dashboard" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                  Go to Dashboard
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to NexusLearn, ${name}! Your account is verified. Visit your dashboard: ${APP_URL}/dashboard`,
  });
}
