import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { updateChannelSchema } from "@/lib/validations";

type RouteContext = { params: { channelId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAuth();
    const { channelId } = params;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        _count: { select: { messages: true } },
      },
    });

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    return Response.json(channel);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

    const membership = channel.members[0];
    if (
      channel.createdById !== user.id &&
      user.role !== "ADMIN" &&
      (!membership || !["OWNER", "ADMIN"].includes(membership.role))
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateChannelSchema.parse(body);

    const updated = await prisma.channel.update({
      where: { id: channelId },
      data: validated,
    });

    return Response.json(updated);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return Response.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { channelId } = params;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.createdById !== user.id && user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.channel.delete({ where: { id: channelId } });

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
