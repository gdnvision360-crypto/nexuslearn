import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// ============================================================
// Token Generation & Verification
// ============================================================

/**
 * Generate a cryptographically secure token and store it in DB.
 * Used for email verification and password reset.
 */
export async function generateVerificationToken(
  email: string,
  type: "EMAIL_VERIFICATION" | "PASSWORD_RESET"
) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt =
    type === "EMAIL_VERIFICATION"
      ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      : new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Delete any existing tokens of the same type for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email, type },
  });

  // Create the new token
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      type,
      expires: expiresAt,
    },
  });

  return token;
}

/**
 * Validate a token — returns the email if valid, null if expired/invalid.
 * Automatically deletes the token after successful validation.
 */
export async function validateToken(
  token: string,
  type: "EMAIL_VERIFICATION" | "PASSWORD_RESET"
) {
  const record = await prisma.verificationToken.findFirst({
    where: { token, type },
  });

  if (!record) return null;

  // Check if expired
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { id: record.id },
    });
    return null;
  }

  // Delete the token (one-time use)
  await prisma.verificationToken.delete({
    where: { id: record.id },
  });

  return record.identifier; // email
}

/**
 * Cleanup expired tokens (call periodically via cron)
 */
export async function cleanupExpiredTokens() {
  await prisma.verificationToken.deleteMany({
    where: { expires: { lt: new Date() } },
  });
}
