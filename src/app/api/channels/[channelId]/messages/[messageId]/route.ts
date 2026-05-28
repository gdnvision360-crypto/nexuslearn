import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { editMessageSchema } from "@/lib/validations";

type RouteContext = { params: { channelId: string; messageId: string } };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { channelId, messageId } = params;

    const message = await prisma.message.findFirst({
      where: { id: messageId, channelId },
    });

    if (!message) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    if (message.senderId !== user.id) {
      return Response.json({ error: "You can only edit your own messages" }, { status: 403 });
    }

    const body = await request.json();
    const validated = editMessageSchema.parse(body);

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: validated.content,
        isEdited: true,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
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
    const { channelId, messageId } = params;

    const message = await prisma.message.findFirst({
      where: { id: messageId, channelId },
    });

    if (!message) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    if (message.senderId !== user.id && user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.message.delete({ where: { id: messageId } });

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
