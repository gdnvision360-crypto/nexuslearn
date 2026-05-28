import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const view = searchParams.get("view") || "month"; // month, week, day

    const now = new Date();
    let dateFilter: { gte: Date; lte: Date };

    if (startDate && endDate) {
      dateFilter = { gte: new Date(startDate), lte: new Date(endDate) };
    } else {
      // Default to current month
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      dateFilter = { gte: start, lte: end };
    }

    const posts = await prisma.socialPost.findMany({
      where: {
        userId: user.id,
        OR: [
          { scheduledAt: dateFilter },
          { publishedAt: dateFilter },
          {
            status: { in: ["DRAFT", "SCHEDULED"] },
            createdAt: dateFilter,
          },
        ],
      },
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
      },
      orderBy: [
        { scheduledAt: "asc" },
        { createdAt: "asc" },
      ],
    });

    // Group by date for calendar view
    const calendarData: Record<string, typeof posts> = {};
    for (const post of posts) {
      const date = (
        post.scheduledAt || post.publishedAt || post.createdAt
      )
        .toISOString()
        .split("T")[0];
      if (!calendarData[date]) calendarData[date] = [];
      calendarData[date].push(post);
    }

    return Response.json({ posts, calendarData, view });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { posts: postsData } = body;

    if (!Array.isArray(postsData) || postsData.length === 0) {
      return Response.json(
        { error: "posts array is required" },
        { status: 400 }
      );
    }

    // Validate all accounts belong to user
    const accountIds = [...new Set(postsData.map((p: any) => p.accountId))];
    const accounts = await prisma.socialAccount.findMany({
      where: { id: { in: accountIds }, userId: user.id, isActive: true },
    });

    if (accounts.length !== accountIds.length) {
      return Response.json(
        { error: "One or more social accounts not found or inactive" },
        { status: 400 }
      );
    }

    const createdPosts = await prisma.$transaction(
      postsData.map((postData: any) =>
        prisma.socialPost.create({
          data: {
            userId: user.id,
            accountId: postData.accountId,
            content: postData.content,
            mediaUrls: postData.mediaUrls || [],
            hashtags: postData.hashtags || [],
            status: "SCHEDULED",
            scheduledAt: new Date(postData.scheduledAt),
            postType: postData.postType || "MANUAL",
            sourceType: postData.sourceType,
            sourceId: postData.sourceId,
          },
          include: {
            account: {
              select: {
                id: true,
                platform: true,
                username: true,
              },
            },
          },
        })
      )
    );

    return Response.json(
      { posts: createdPosts, count: createdPosts.length },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
