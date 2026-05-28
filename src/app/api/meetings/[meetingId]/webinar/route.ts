import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Get webinar settings and attendee count
export async function GET(
  request: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: params.meetingId },
      select: {
        id: true,
        webinarMode: true,
        webinarConfig: true,
        hostId: true,
        participants: {
          select: {
            id: true,
            userId: true,
            role: true,
            isMuted: true,
            isCameraOff: true,
            joinedAt: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const config =
      typeof meeting.webinarConfig === "object" && meeting.webinarConfig !== null
        ? meeting.webinarConfig
        : {};

    const webinarParticipants = meeting.participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      name: p.user.name || "Unknown",
      role:
        p.userId === meeting.hostId
          ? "host"
          : p.role === "PRESENTER" || p.role === "CO_HOST"
            ? "panelist"
            : "attendee",
      isMuted: p.isMuted,
      hasVideo: !p.isCameraOff,
      joinedAt: p.joinedAt.toISOString(),
    }));

    const attendeeCount = webinarParticipants.filter(
      (p) => p.role === "attendee"
    ).length;
    const panelistCount = webinarParticipants.filter(
      (p) => p.role === "panelist" || p.role === "host"
    ).length;

    return NextResponse.json({
      isWebinarMode: meeting.webinarMode,
      config,
      attendeeCount,
      panelistCount,
      participants: webinarParticipants,
    });
  } catch (error) {
    console.error("Webinar GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch webinar settings" },
      { status: 500 }
    );
  }
}

// PUT: Toggle webinar mode and update config
export async function PUT(
  request: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: params.meetingId },
      select: { id: true, hostId: true },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the host can configure webinar mode" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      isWebinarMode?: boolean;
      config?: Record<string, unknown>;
    };

    const updateData: Record<string, unknown> = {};
    if (typeof body.isWebinarMode === "boolean") {
      updateData.webinarMode = body.isWebinarMode;
    }
    if (body.config) {
      updateData.webinarConfig = body.config;
    }

    const updated = await prisma.meeting.update({
      where: { id: params.meetingId },
      data: updateData,
      select: { webinarMode: true, webinarConfig: true },
    });

    return NextResponse.json({
      isWebinarMode: updated.webinarMode,
      config: updated.webinarConfig,
    });
  } catch (error) {
    console.error("Webinar PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update webinar settings" },
      { status: 500 }
    );
  }
}

// POST: Promote/Demote participants
export async function POST(
  request: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: params.meetingId },
      select: { id: true, hostId: true },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the host can change roles" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      userId: string;
      role: "host" | "panelist" | "attendee";
    };

    if (!body.userId || !body.role) {
      return NextResponse.json(
        { error: "userId and role are required" },
        { status: 400 }
      );
    }

    // Map webinar role to ParticipantRole enum
    const roleMap: Record<string, string> = {
      host: "HOST",
      panelist: "PRESENTER",
      attendee: "ATTENDEE",
    };

    const participantRole = roleMap[body.role] || "ATTENDEE";

    const participant = await prisma.meetingParticipant.findFirst({
      where: {
        meetingId: params.meetingId,
        userId: body.userId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    await prisma.meetingParticipant.update({
      where: { id: participant.id },
      data: { role: participantRole as "HOST" | "CO_HOST" | "PRESENTER" | "ATTENDEE" },
    });

    return NextResponse.json({ success: true, userId: body.userId, role: body.role });
  } catch (error) {
    console.error("Webinar role change error:", error);
    return NextResponse.json(
      { error: "Failed to change participant role" },
      { status: 500 }
    );
  }
}
