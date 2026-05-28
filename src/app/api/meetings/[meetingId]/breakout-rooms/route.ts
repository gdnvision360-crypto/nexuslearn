import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";

type RouteContext = { params: { meetingId: string } };

// GET: List breakout rooms for a meeting
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAuth();
    const { meetingId } = params;

    const rooms = await prisma.breakoutRoom.findMany({
      where: { meetingId },
      orderBy: { createdAt: "asc" },
    });

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { settings: true },
    });

    const settings = (meeting?.settings as Record<string, any>) || {};

    return Response.json({
      rooms: rooms.map((r) => ({
        id: r.id,
        name: r.name,
        participants: r.participants as string[],
        isOpen: settings.breakoutRoomsOpen || false,
        timerEnd: settings.breakoutTimerEnd || null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST: Create breakout rooms
export async function POST(request: NextRequest, { params }: RouteContext) {
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
    const { rooms, autoAssign } = body as {
      rooms: { name: string; participantIds: string[] }[];
      autoAssign?: boolean;
    };

    if (!rooms || !Array.isArray(rooms)) {
      return Response.json({ error: "Invalid rooms data" }, { status: 400 });
    }

    // Delete existing rooms first
    await prisma.breakoutRoom.deleteMany({ where: { meetingId } });

    // Create new rooms
    const created = await Promise.all(
      rooms.map((r) =>
        prisma.breakoutRoom.create({
          data: {
            meetingId,
            name: r.name,
            participants: r.participantIds,
          },
        })
      )
    );

    return Response.json({ rooms: created }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT: Update room assignments / open/close / broadcast
export async function PUT(request: NextRequest, { params }: RouteContext) {
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
    const { action } = body;

    switch (action) {
      case "open": {
        const { timerMinutes } = body;
        const settings = {
          ...((meeting.settings as Record<string, any>) || {}),
          breakoutRoomsOpen: true,
          breakoutTimerEnd: timerMinutes
            ? Date.now() + timerMinutes * 60 * 1000
            : null,
        };
        await prisma.meeting.update({
          where: { id: meetingId },
          data: { settings },
        });
        return Response.json({ success: true });
      }

      case "move": {
        const { participantId, targetRoomId } = body;
        // Remove from all rooms first
        const allRooms = await prisma.breakoutRoom.findMany({
          where: { meetingId },
        });
        for (const room of allRooms) {
          const parts = room.participants as string[];
          if (parts.includes(participantId)) {
            await prisma.breakoutRoom.update({
              where: { id: room.id },
              data: {
                participants: parts.filter((p) => p !== participantId),
              },
            });
          }
        }
        // Add to target room
        const targetRoom = await prisma.breakoutRoom.findUnique({
          where: { id: targetRoomId },
        });
        if (targetRoom) {
          const targetParts = targetRoom.participants as string[];
          await prisma.breakoutRoom.update({
            where: { id: targetRoomId },
            data: {
              participants: [...targetParts, participantId],
            },
          });
        }
        return Response.json({ success: true });
      }

      case "remove": {
        const { participantId: removeId, roomId: removeRoomId } = body;
        const room = await prisma.breakoutRoom.findUnique({
          where: { id: removeRoomId },
        });
        if (room) {
          const parts = room.participants as string[];
          await prisma.breakoutRoom.update({
            where: { id: removeRoomId },
            data: { participants: parts.filter((p) => p !== removeId) },
          });
        }
        return Response.json({ success: true });
      }

      case "deleteRoom": {
        const { roomId } = body;
        await prisma.breakoutRoom.delete({ where: { id: roomId } });
        return Response.json({ success: true });
      }

      case "rename": {
        const { roomId: renameId, name } = body;
        await prisma.breakoutRoom.update({
          where: { id: renameId },
          data: { name },
        });
        return Response.json({ success: true });
      }

      case "broadcast": {
        // In production, this would send via LiveKit data channel
        // For now, store in settings as last broadcast
        const settings = {
          ...((meeting.settings as Record<string, any>) || {}),
          lastBroadcast: {
            message: body.message,
            timestamp: Date.now(),
            senderId: user.id,
          },
        };
        await prisma.meeting.update({
          where: { id: meetingId },
          data: { settings },
        });
        return Response.json({ success: true });
      }

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE: Close all breakout rooms
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

    const settings = {
      ...((meeting.settings as Record<string, any>) || {}),
      breakoutRoomsOpen: false,
      breakoutTimerEnd: null,
    };

    await prisma.meeting.update({
      where: { id: meetingId },
      data: { settings },
    });

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
