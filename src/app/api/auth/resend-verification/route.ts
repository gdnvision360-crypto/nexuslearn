import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

/**
 * POST /api/auth/resend-verification
 * Resend email verification to a user who hasn't verified yet.
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
      select: { id: true, name: true, email: true, emailVerified: true },
    });

    // Don't reveal if user exists or not (security)
    if (!user || user.emailVerified) {
      return Response.json({
        success: true,
        message: "If an unverified account exists with this email, a verification link has been sent.",
      });
    }

    const token = await generateVerificationToken(user.email, "EMAIL_VERIFICATION");
    await sendVerificationEmail(user.email, user.name || "there", token);

    return Response.json({
      success: true,
      message: "If an unverified account exists with this email, a verification link has been sent.",
    });
  } catch (error) {
    console.error("[Resend Verification Error]", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
