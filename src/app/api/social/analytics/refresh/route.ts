import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { fetchAnalytics } from "@/lib/social-platforms";

export async function POST() {
  try {
    const user = await requireAuth();

    // Get all published posts with their accounts
    const publishedPosts = await prisma.socialPost.findMany({
      where: {
        userId: user.id,
        status: "PUBLISHED",
        platformPostId: { not: null },
      },
      include: {
        account: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 50, // Limit to recent 50 posts to avoid rate limiting
    });

    const results: {
      postId: string;
      platform: string;
      success: boolean;
      error?: string;
    }[] = [];

    for (const post of publishedPosts) {
      try {
        const analyticsData = await fetchAnalytics(
          {
            platform: post.account.platform,
            accessToken: post.account.accessToken,
            platformId: post.account.platformId,
          },
          post.platformPostId!
        );

        await prisma.socialAnalytics.create({
          data: {
            postId: post.id,
            accountId: post.accountId,
            impressions: analyticsData.impressions,
            reach: analyticsData.reach,
            likes: analyticsData.likes,
            comments: analyticsData.comments,
            shares: analyticsData.shares,
            clicks: analyticsData.clicks,
            engagementRate: analyticsData.engagementRate,
          },
        });

        results.push({
          postId: post.id,
          platform: post.account.platform,
          success: true,
        });
      } catch (error: any) {
        results.push({
          postId: post.id,
          platform: post.account.platform,
          success: false,
          error: error.message,
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return Response.json({
      message: `Analytics refreshed: ${successful} successful, ${failed} failed`,
      results,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
