import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { sendMessageSchema } from "@/lib/validations";

type RouteContext = { params: { channelId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { channelId } = params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: { channelId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { id: true, name: true, email: true, image: true },
        },
        reactions: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: { id: true, name: true },
            },
          },
        },
        _count: { select: { replies: true } },
      },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    // Update lastRead for the user
    await prisma.channelMember.updateMany({
      where: { channelId, userId: user.id },
      data: { lastRead: new Date() },
    });

    return Response.json({
      messages: items,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { channelId } = params;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: { where: { userId: user.id } },
      },
    });

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    // For non-public channels, check membership
    if (channel.type !== "PUBLIC" && channel.members.length === 0 && user.role !== "ADMIN") {
      return Response.json({ error: "You are not a member of this channel" }, { status: 403 });
    }

    const body = await request.json();
    const validated = sendMessageSchema.parse(body);

    const message = await prisma.message.create({
      data: {
        channelId,
        senderId: user.id,
        content: validated.content,
        type: validated.type,
        replyToId: validated.replyToId,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, image: true },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: { id: true, name: true },
            },
          },
        },
        reactions: true,
      },
    });

    // Touch channel updatedAt
    await prisma.channel.update({
      where: { id: channelId },
      data: { updatedAt: new Date() },
    });

    return Response.json(message, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return Response.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return handleApiError(error);
  }
}
