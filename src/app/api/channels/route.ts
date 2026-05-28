import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { createChannelSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const channels = await prisma.channel.findMany({
      where: {
        OR: [
          { type: "PUBLIC" },
          { members: { some: { userId: user.id } } },
          { createdById: user.id },
        ],
      },
      include: {
        _count: {
          select: { members: true, messages: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: {
              select: { id: true, name: true },
            },
          },
        },
        members: {
          where: { userId: user.id },
          select: { lastRead: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const result = channels.map((channel) => ({
      ...channel,
      lastMessage: channel.messages[0] || null,
      myMembership: channel.members[0] || null,
      messages: undefined,
      members: undefined,
    }));

    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = createChannelSchema.parse(body);

    const channel = await prisma.channel.create({
      data: {
        name: validated.name,
        type: validated.type,
        description: validated.description,
        createdById: user.id,
        members: {
          create: [
            { userId: user.id, role: "OWNER" },
            ...validated.memberIds
              .filter((id) => id !== user.id)
              .map((userId) => ({ userId, role: "MEMBER" as const })),
          ],
        },
      },
      include: {
        _count: { select: { members: true } },
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return Response.json(channel, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return Response.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return handleApiError(error);
  }
}
