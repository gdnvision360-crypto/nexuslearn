import { NextRequest } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-utils";

type RouteContext = { params: { meetingId: string } };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth();
    const { meetingId } = params;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        _count: { select: { participants: true } },
      },
    });

    if (!meeting) {
      return Response.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.status === "ENDED" || meeting.status === "CANCELLED") {
      return Response.json({ error: "Meeting is no longer active" }, { status: 400 });
    }

    if (meeting._count.participants >= meeting.maxParticipants) {
      return Response.json({ error: "Meeting is full" }, { status: 400 });
    }

    // Upsert participant record
    const participant = await prisma.meetingParticipant.upsert({
      where: {
        meetingId_userId: { meetingId, userId: user.id },
      },
      create: {
        meetingId,
        userId: user.id,
        role: meeting.hostId === user.id ? "HOST" : "ATTENDEE",
      },
      update: {
        leftAt: null,
        joinedAt: new Date(),
      },
    });

    // Generate LiveKit room token
    const roomName = meeting.roomId || meetingId;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    let token: string | null = null;

    if (apiKey && apiSecret) {
      const at = new AccessToken(apiKey, apiSecret, {
        identity: user.id,
        name: user.name || user.email,
      });

      at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      token = await at.toJwt();
    }

    return Response.json({
      participant,
      roomName,
      token,
      livekitUrl: process.env.LIVEKIT_URL || null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
