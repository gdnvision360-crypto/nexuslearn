import { NextRequest } from "next/server";
import { validateToken } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

/**
 * POST /api/auth/verify-email
 * Verifies a user's email address using a token.
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return Response.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    const email = await validateToken(token, "EMAIL_VERIFICATION");

    if (!email) {
      return Response.json(
        { error: "Invalid or expired verification link. Please request a new one." },
        { status: 400 }
      );
    }

    // Mark the user's email as verified
    const user = await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
      select: { id: true, name: true, email: true },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "EMAIL_VERIFIED",
        entityType: "USER",
        entityId: user.id,
      },
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name || "there");
    } catch {
      // Don't fail verification if welcome email fails
      console.warn("[Welcome Email] Failed to send, continuing anyway");
    }

    return Response.json({
      success: true,
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.error("[Verify Email Error]", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
