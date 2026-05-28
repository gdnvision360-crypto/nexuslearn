import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await requireAuth();

    const accounts = await prisma.socialAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        platform: true,
        platformId: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        isActive: true,
        tokenExpiry: true,
        scopes: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = accounts.map((account) => ({
      ...account,
      postCount: account._count.posts,
      tokenStatus:
        account.tokenExpiry && account.tokenExpiry < new Date()
          ? "expired"
          : "active",
      _count: undefined,
    }));

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const {
      platform,
      platformId,
      username,
      displayName,
      avatarUrl,
      accessToken,
      refreshToken,
      tokenExpiry,
      scopes,
    } = body;

    if (!platform || !platformId || !username || !accessToken) {
      return Response.json(
        { error: "Missing required fields: platform, platformId, username, accessToken" },
        { status: 400 }
      );
    }

    // Upsert to handle reconnection
    const account = await prisma.socialAccount.upsert({
      where: {
        userId_platform_platformId: {
          userId: user.id,
          platform,
          platformId,
        },
      },
      update: {
        username,
        displayName,
        avatarUrl,
        accessToken,
        refreshToken,
        tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : null,
        scopes: scopes || [],
        isActive: true,
      },
      create: {
        userId: user.id,
        platform,
        platformId,
        username,
        displayName,
        avatarUrl,
        accessToken,
        refreshToken,
        tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : null,
        scopes: scopes || [],
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "SOCIAL_ACCOUNT_CONNECTED",
        entityType: "SOCIAL_ACCOUNT",
        entityId: account.id,
        metadata: { platform, username },
      },
    });

    return Response.json(account, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
