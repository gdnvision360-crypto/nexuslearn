import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { publishToPlatform, generateShareUrl } from "@/lib/social-platforms";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const {
      sourceType,    // "recording" | "certificate" | "course" | "webinar"
      sourceId,
      platforms,     // SocialPlatform[]
      customMessage,
      useWebIntent,  // If true, return web intent URLs instead of API posting
    } = body;

    if (!sourceType || !platforms || platforms.length === 0) {
      return Response.json(
        { error: "sourceType and platforms[] are required" },
        { status: 400 }
      );
    }

    // Build share content based on source
    let shareContent = customMessage || "";
    let shareUrl = "";
    const mediaUrls: string[] = [];

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    switch (sourceType) {
      case "recording": {
        if (sourceId) {
          const meeting = await prisma.meeting.findUnique({
            where: { id: sourceId },
            select: { title: true, id: true },
          });
          if (meeting) {
            shareUrl = `${appUrl}/meetings/${meeting.id}/recording`;
            if (!customMessage) {
              shareContent = `📹 Check out the recording of "${meeting.title}" on NexusLearn!\n\n${shareUrl}`;
            }
          }
        }
        break;
      }
      case "certificate": {
        if (sourceId) {
          const certificate = await prisma.certificate.findUnique({
            where: { id: sourceId },
            include: { course: { select: { title: true } } },
          });
          if (certificate) {
            shareUrl = `${appUrl}/certificates/${certificate.id}`;
            if (!customMessage) {
              shareContent = `🎓 I just earned my certificate for "${certificate.course.title}" on NexusLearn! #achievement #learning\n\n${shareUrl}`;
            }
          }
        }
        break;
      }
      case "course": {
        if (sourceId) {
          const course = await prisma.course.findUnique({
            where: { id: sourceId },
            select: { title: true, description: true, thumbnail: true, id: true },
          });
          if (course) {
            shareUrl = `${appUrl}/learning/courses/${course.id}`;
            if (course.thumbnail) mediaUrls.push(course.thumbnail);
            if (!customMessage) {
              shareContent = `🚀 Check out "${course.title}" on NexusLearn!\n\n${course.description?.slice(0, 200) || ""}\n\nLearn more: ${shareUrl}`;
            }
          }
        }
        break;
      }
      case "webinar": {
        if (sourceId) {
          const meeting = await prisma.meeting.findUnique({
            where: { id: sourceId },
            select: { title: true, scheduledAt: true, id: true },
          });
          if (meeting) {
            shareUrl = `${appUrl}/meetings/${meeting.id}`;
            if (!customMessage) {
              const dateStr = meeting.scheduledAt
                ? meeting.scheduledAt.toLocaleDateString()
                : "soon";
              shareContent = `📅 Join us for "${meeting.title}" on ${dateStr}!\n\nRegister: ${shareUrl}`;
            }
          }
        }
        break;
      }
    }

    if (!shareContent) {
      shareContent = customMessage || "Check this out on NexusLearn!";
    }

    // If web intent mode, return URLs for client-side window.open
    if (useWebIntent) {
      const intentUrls: Record<string, string> = {};
      for (const platform of platforms) {
        const url = generateShareUrl(platform, shareContent, shareUrl);
        if (url) intentUrls[platform] = url;
      }
      return Response.json({ intentUrls, content: shareContent });
    }

    // API-based posting
    const accounts = await prisma.socialAccount.findMany({
      where: {
        userId: user.id,
        platform: { in: platforms },
        isActive: true,
      },
    });

    if (accounts.length === 0) {
      // Fall back to web intents
      const intentUrls: Record<string, string> = {};
      for (const platform of platforms) {
        const url = generateShareUrl(platform, shareContent, shareUrl);
        if (url) intentUrls[platform] = url;
      }
      return Response.json({
        intentUrls,
        content: shareContent,
        message: "No connected accounts found. Use web intent URLs to share.",
      });
    }

    const results: any[] = [];

    for (const account of accounts) {
      // Create post record
      const post = await prisma.socialPost.create({
        data: {
          userId: user.id,
          accountId: account.id,
          content: shareContent,
          mediaUrls,
          hashtags: [],
          status: "PUBLISHING",
          postType: "SHARE",
          sourceType,
          sourceId,
        },
      });

      // Publish
      const result = await publishToPlatform(
        {
          platform: account.platform,
          accessToken: account.accessToken,
          platformId: account.platformId,
        },
        shareContent,
        mediaUrls
      );

      if (result.success) {
        await prisma.socialPost.update({
          where: { id: post.id },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
            platformPostId: result.platformPostId,
            platformUrl: result.platformUrl,
          },
        });

        results.push({
          platform: account.platform,
          success: true,
          postId: post.id,
          platformUrl: result.platformUrl,
        });
      } else {
        await prisma.socialPost.update({
          where: { id: post.id },
          data: { status: "FAILED", errorMessage: result.error },
        });

        results.push({
          platform: account.platform,
          success: false,
          error: result.error,
        });
      }
    }

    return Response.json({ results, content: shareContent });
  } catch (error) {
    return handleApiError(error);
  }
}
