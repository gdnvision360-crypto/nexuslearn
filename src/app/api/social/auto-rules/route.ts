import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await requireAuth();

    const rules = await prisma.socialAutoRule.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(rules);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { name, trigger, platforms, templateText, includeMedia } = body;

    if (!name || !trigger || !platforms || !templateText) {
      return Response.json(
        { error: "name, trigger, platforms, and templateText are required" },
        { status: 400 }
      );
    }

    // Validate that user has connected accounts for the selected platforms
    const connectedAccounts = await prisma.socialAccount.findMany({
      where: {
        userId: user.id,
        platform: { in: platforms },
        isActive: true,
      },
      select: { platform: true },
    });

    const connectedPlatforms = connectedAccounts.map((a) => a.platform);
    const missingPlatforms = platforms.filter(
      (p: string) => !connectedPlatforms.includes(p as any)
    );

    if (missingPlatforms.length > 0) {
      return Response.json(
        {
          error: `No connected accounts for: ${missingPlatforms.join(", ")}`,
          missingPlatforms,
        },
        { status: 400 }
      );
    }

    const rule = await prisma.socialAutoRule.create({
      data: {
        userId: user.id,
        name,
        trigger,
        platforms,
        templateText,
        includeMedia: includeMedia !== false,
      },
    });

    return Response.json(rule, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
