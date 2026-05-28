import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { publishToPlatform } from "@/lib/social-platforms";

export async function POST(
  _request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const user = await requireAuth();

    const post = await prisma.socialPost.findFirst({
      where: { id: params.postId, userId: user.id },
      include: {
        account: true,
      },
    });

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.status === "PUBLISHED") {
      return Response.json(
        { error: "Post has already been published" },
        { status: 400 }
      );
    }

    if (post.status === "PUBLISHING") {
      return Response.json(
        { error: "Post is currently being published" },
        { status: 400 }
      );
    }

    // Mark as publishing
    await prisma.socialPost.update({
      where: { id: post.id },
      data: { status: "PUBLISHING" },
    });

    // Attempt to publish
    const result = await publishToPlatform(
      {
        platform: post.account.platform,
        accessToken: post.account.accessToken,
        platformId: post.account.platformId,
      },
      post.content,
      post.mediaUrls
    );

    if (result.success) {
      const updatedPost = await prisma.socialPost.update({
        where: { id: post.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          platformPostId: result.platformPostId,
          platformUrl: result.platformUrl,
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

      // Create initial analytics entry
      await prisma.socialAnalytics.create({
        data: {
          postId: post.id,
          accountId: post.accountId,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "SOCIAL_POST_PUBLISHED",
          entityType: "SOCIAL_POST",
          entityId: post.id,
          metadata: {
            platform: post.account.platform,
            platformPostId: result.platformPostId,
          },
        },
      });

      return Response.json(updatedPost);
    } else {
      await prisma.socialPost.update({
        where: { id: post.id },
        data: {
          status: "FAILED",
          errorMessage: result.error,
        },
      });

      return Response.json(
        { error: result.error || "Failed to publish post" },
        { status: 500 }
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}
