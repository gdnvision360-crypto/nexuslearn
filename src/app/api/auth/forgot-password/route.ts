import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

/**
 * POST /api/auth/forgot-password
 * Sends a password reset link to the user's email.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true, password: true },
    });

    // Always return success (don't reveal if email exists)
    if (!user || !user.password) {
      // user.password check: OAuth-only users can't reset password
      return Response.json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      });
    }

    const token = await generateVerificationToken(user.email, "PASSWORD_RESET");
    await sendPasswordResetEmail(user.email, user.name || "there", token);

    return Response.json({
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("[Forgot Password Error]", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
