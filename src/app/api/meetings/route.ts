import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { createMeetingSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const filter = searchParams.get("filter"); // "upcoming" | "past"

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (filter === "upcoming") {
      where.scheduledStart = { gte: new Date() };
      where.status = { in: ["SCHEDULED", "LIVE"] };
    } else if (filter === "past") {
      where.scheduledEnd = { lt: new Date() };
    }

    // Non-admins only see meetings they host or participate in
    if (user.role !== "ADMIN") {
      where.OR = [
        { hostId: user.id },
        { participants: { some: { userId: user.id } } },
      ];
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        host: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { scheduledStart: "asc" },
    });

    return Response.json(meetings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = createMeetingSchema.parse(body);

    const meeting = await prisma.meeting.create({
      data: {
        title: validated.title,
        description: validated.description,
        hostId: user.id,
        scheduledStart: new Date(validated.scheduledStart),
        scheduledEnd: new Date(validated.scheduledEnd),
        maxParticipants: validated.maxParticipants,
        isRecurring: validated.isRecurring,
        recurringPattern: validated.recurringPattern,
        settings: validated.settings,
        roomId: `room_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      },
      include: {
        host: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    // Add host as participant
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meeting.id,
        userId: user.id,
        role: "HOST",
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "MEETING_CREATED",
        entityType: "MEETING",
        entityId: meeting.id,
        metadata: { title: meeting.title },
      },
    });

    return Response.json(meeting, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return Response.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return handleApiError(error);
  }
}
