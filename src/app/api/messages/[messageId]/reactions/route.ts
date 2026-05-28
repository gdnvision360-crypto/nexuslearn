import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { toggleReactionSchema } from "@/lib/validations";

type RouteContext = { params: { messageId: string } };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { messageId } = params;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = toggleReactionSchema.parse(body);

    const existing = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: user.id,
          emoji: validated.emoji,
        },
      },
    });

    if (existing) {
      await prisma.messageReaction.delete({ where: { id: existing.id } });
      return Response.json({ action: "removed", emoji: validated.emoji });
    } else {
      const reaction = await prisma.messageReaction.create({
        data: { messageId, userId: user.id, emoji: validated.emoji },
        include: { user: { select: { id: true, name: true } } },
      });
      return Response.json({ action: "added", reaction }, { status: 201 });
    }
  } catch (error: any) {
    if (error.name === "ZodError") {
      return Response.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return handleApiError(error);
  }
}
