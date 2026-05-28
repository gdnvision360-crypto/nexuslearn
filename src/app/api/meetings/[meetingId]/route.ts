import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";
import { updateMeetingSchema } from "@/lib/validations";

type RouteContext = { params: { meetingId: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAuth();
    const { meetingId } = params;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        host: {
          select: { id: true, name: true, email: true, image: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        _count: {
          select: { transcripts: true, recordings: true },
        },
      },
    });

    if (!meeting) {
      return Response.json({ error: "Meeting not found" }, { status: 404 });
    }

    return Response.json(meeting);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { meetingId } = params;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      return Response.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.hostId !== user.id && user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateMeetingSchema.parse(body);

    const updated = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        ...validated,
        scheduledStart: validated.scheduledStart ? new Date(validated.scheduledStart) : undefined,
        scheduledEnd: validated.scheduledEnd ? new Date(validated.scheduledEnd) : undefined,
      },
      include: {
        host: {
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
    const { meetingId } = params;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      return Response.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.hostId !== user.id && user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.meeting.delete({ where: { id: meetingId } });

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
