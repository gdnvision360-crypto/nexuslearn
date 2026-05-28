import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const platform = searchParams.get("platform");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const postType = searchParams.get("postType");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = { userId: user.id };

    if (status) where.status = status;
    if (postType) where.postType = postType;
    if (platform) {
      where.account = { platform };
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [posts, total] = await Promise.all([
      prisma.socialPost.findMany({
        where,
        include: {
          account: {
            select: {
              id: true,
              platform: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          analytics: {
            orderBy: { fetchedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.socialPost.count({ where }),
    ]);

    return Response.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const {
      accountId,
      content,
      mediaUrls,
      hashtags,
      scheduledAt,
      postType,
      sourceType,
      sourceId,
    } = body;

    if (!accountId || !content) {
      return Response.json(
        { error: "accountId and content are required" },
        { status: 400 }
      );
    }

    // Verify account belongs to user
    const account = await prisma.socialAccount.findFirst({
      where: { id: accountId, userId: user.id, isActive: true },
    });

    if (!account) {
      return Response.json(
        { error: "Social account not found or inactive" },
        { status: 404 }
      );
    }

    const status = scheduledAt ? "SCHEDULED" : "DRAFT";

    const post = await prisma.socialPost.create({
      data: {
        userId: user.id,
        accountId,
        content,
        mediaUrls: mediaUrls || [],
        hashtags: hashtags || [],
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        postType: postType || "MANUAL",
        sourceType,
        sourceId,
      },
      include: {
        account: {
          select: {
            id: true,
            platform: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "SOCIAL_POST_CREATED",
        entityType: "SOCIAL_POST",
        entityId: post.id,
        metadata: {
          platform: account.platform,
          status,
          postType: postType || "MANUAL",
        },
      },
    });

    return Response.json(post, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
