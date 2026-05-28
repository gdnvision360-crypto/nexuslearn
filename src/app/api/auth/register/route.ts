import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existingUser) {
      return Response.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12);

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email.toLowerCase(),
        password: hashedPassword,
        // emailVerified is null — user must verify via email
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "USER_REGISTERED",
        entityType: "USER",
        entityId: user.id,
      },
    });

    // Send verification email
    try {
      const token = await generateVerificationToken(user.email, "EMAIL_VERIFICATION");
      await sendVerificationEmail(user.email, user.name || "there", token);
    } catch (emailError) {
      console.error("[Register] Failed to send verification email:", emailError);
      // Don't fail registration if email fails — user can resend later
    }

    return Response.json(
      {
        ...user,
        requiresVerification: true,
        message: "Account created! Please check your email to verify your account.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === "ZodError") {
      return Response.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[Register Error]", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
