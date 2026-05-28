import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const user = await requireAuth();

    const post = await prisma.socialPost.findFirst({
      where: { id: params.postId, userId: user.id },
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
        },
      },
    });

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    return Response.json(post);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const existing = await prisma.socialPost.findFirst({
      where: { id: params.postId, userId: user.id },
    });

    if (!existing) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Only allow editing drafts and scheduled posts
    if (!["DRAFT", "SCHEDULED"].includes(existing.status)) {
      return Response.json(
        { error: "Cannot edit a post that has been published or is being published" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (body.content !== undefined) updateData.content = body.content;
    if (body.mediaUrls !== undefined) updateData.mediaUrls = body.mediaUrls;
    if (body.hashtags !== undefined) updateData.hashtags = body.hashtags;
    if (body.scheduledAt !== undefined) {
      updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
      updateData.status = body.scheduledAt ? "SCHEDULED" : "DRAFT";
    }
    if (body.status === "CANCELLED") updateData.status = "CANCELLED";

    const post = await prisma.socialPost.update({
      where: { id: params.postId },
      data: updateData,
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

    return Response.json(post);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const user = await requireAuth();

    const existing = await prisma.socialPost.findFirst({
      where: { id: params.postId, userId: user.id },
    });

    if (!existing) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.socialPost.delete({
      where: { id: params.postId },
    });

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
