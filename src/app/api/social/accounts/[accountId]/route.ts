import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const user = await requireAuth();

    const account = await prisma.socialAccount.findFirst({
      where: { id: params.accountId, userId: user.id },
      include: {
        _count: {
          select: { posts: true, analytics: true },
        },
        posts: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            status: true,
            publishedAt: true,
            platformUrl: true,
          },
        },
      },
    });

    if (!account) {
      return Response.json({ error: "Account not found" }, { status: 404 });
    }

    return Response.json({
      ...account,
      accessToken: undefined,
      refreshToken: undefined,
      tokenStatus:
        account.tokenExpiry && account.tokenExpiry < new Date()
          ? "expired"
          : "active",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const existing = await prisma.socialAccount.findFirst({
      where: { id: params.accountId, userId: user.id },
    });

    if (!existing) {
      return Response.json({ error: "Account not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;
    if (body.displayName !== undefined) updateData.displayName = body.displayName;

    const account = await prisma.socialAccount.update({
      where: { id: params.accountId },
      data: updateData,
    });

    return Response.json({
      ...account,
      accessToken: undefined,
      refreshToken: undefined,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const user = await requireAuth();

    const existing = await prisma.socialAccount.findFirst({
      where: { id: params.accountId, userId: user.id },
    });

    if (!existing) {
      return Response.json({ error: "Account not found" }, { status: 404 });
    }

    await prisma.socialAccount.delete({
      where: { id: params.accountId },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "SOCIAL_ACCOUNT_DISCONNECTED",
        entityType: "SOCIAL_ACCOUNT",
        entityId: params.accountId,
        metadata: { platform: existing.platform, username: existing.username },
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
