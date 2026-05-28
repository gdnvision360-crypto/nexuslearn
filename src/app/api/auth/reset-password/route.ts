import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validateToken } from "@/lib/tokens";

/**
 * POST /api/auth/reset-password
 * Resets the user's password using a valid reset token.
 */
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return Response.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const email = await validateToken(token, "PASSWORD_RESET");

    if (!email) {
      return Response.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
      select: { id: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET",
        entityType: "USER",
        entityId: user.id,
      },
    });

    return Response.json({
      success: true,
      message: "Password reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("[Reset Password Error]", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
