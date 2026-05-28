import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const platform = searchParams.get("platform");

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);

    // Get all analytics for user's posts
    const where: any = {
      post: { userId: user.id },
    };
    if (Object.keys(dateFilter).length > 0) {
      where.fetchedAt = dateFilter;
    }
    if (platform) {
      where.account = { platform };
    }

    const analytics = await prisma.socialAnalytics.findMany({
      where,
      include: {
        post: {
          select: {
            id: true,
            content: true,
            status: true,
            publishedAt: true,
            postType: true,
          },
        },
        account: {
          select: {
            id: true,
            platform: true,
            username: true,
          },
        },
      },
      orderBy: { fetchedAt: "desc" },
    });

    // Aggregate totals
    const totals = {
      impressions: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
      totalPosts: 0,
      avgEngagementRate: 0,
    };

    // Get unique latest analytics per post
    const latestByPost = new Map<string, (typeof analytics)[0]>();
    for (const entry of analytics) {
      if (!latestByPost.has(entry.postId)) {
        latestByPost.set(entry.postId, entry);
      }
    }

    for (const entry of latestByPost.values()) {
      totals.impressions += entry.impressions;
      totals.reach += entry.reach;
      totals.likes += entry.likes;
      totals.comments += entry.comments;
      totals.shares += entry.shares;
      totals.clicks += entry.clicks;
      totals.totalPosts++;
    }

    if (totals.totalPosts > 0) {
      const totalEngagement =
        totals.likes + totals.comments + totals.shares + totals.clicks;
      totals.avgEngagementRate =
        totals.impressions > 0
          ? (totalEngagement / totals.impressions) * 100
          : 0;
    }

    // Platform breakdown
    const platformBreakdown: Record<
      string,
      { impressions: number; reach: number; engagement: number; posts: number }
    > = {};

    for (const entry of latestByPost.values()) {
      const p = entry.account.platform;
      if (!platformBreakdown[p]) {
        platformBreakdown[p] = { impressions: 0, reach: 0, engagement: 0, posts: 0 };
      }
      platformBreakdown[p].impressions += entry.impressions;
      platformBreakdown[p].reach += entry.reach;
      platformBreakdown[p].engagement +=
        entry.likes + entry.comments + entry.shares;
      platformBreakdown[p].posts++;
    }

    // Top posts by engagement
    const topPosts = [...latestByPost.values()]
      .sort(
        (a, b) =>
          b.likes + b.comments + b.shares - (a.likes + a.comments + a.shares)
      )
      .slice(0, 10)
      .map((entry) => ({
        postId: entry.postId,
        content: entry.post.content.slice(0, 150),
        platform: entry.account.platform,
        username: entry.account.username,
        publishedAt: entry.post.publishedAt,
        metrics: {
          impressions: entry.impressions,
          reach: entry.reach,
          likes: entry.likes,
          comments: entry.comments,
          shares: entry.shares,
          clicks: entry.clicks,
          engagementRate: entry.engagementRate,
        },
      }));

    // Engagement over time (group by day)
    const timeSeriesMap = new Map<string, { impressions: number; engagement: number }>();
    for (const entry of analytics) {
      const day = entry.fetchedAt.toISOString().split("T")[0];
      const existing = timeSeriesMap.get(day) || { impressions: 0, engagement: 0 };
      existing.impressions += entry.impressions;
      existing.engagement += entry.likes + entry.comments + entry.shares;
      timeSeriesMap.set(day, existing);
    }

    const timeSeries = [...timeSeriesMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    return Response.json({
      totals,
      platformBreakdown,
      topPosts,
      timeSeries,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
