import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLiveStreamingService } from "@/lib/live-streaming";
import type { StreamTarget } from "@/lib/live-streaming";

// GET: Get stream status
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
        isStreaming: true,
        streamConfig: true,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const config =
      typeof meeting.streamConfig === "object" && meeting.streamConfig !== null
        ? (meeting.streamConfig as Record<string, unknown>)
        : {};

    const egressId = config.egressId as string | undefined;
    let health = null;
    let streamStatus = "idle";

    if (meeting.isStreaming && egressId) {
      const streamingService = getLiveStreamingService();
      const statusResult = await streamingService.getStreamStatus(egressId);
      streamStatus = statusResult.status;
      health = statusResult.health;
    }

    return NextResponse.json({
      isStreaming: meeting.isStreaming,
      status: streamStatus,
      targets: (config.targets as StreamTarget[]) || [],
      health,
      egressId: egressId || null,
    });
  } catch (error) {
    console.error("Stream GET error:", error);
    return NextResponse.json(
      { error: "Failed to get stream status" },
      { status: 500 }
    );
  }
}

// POST: Start streaming
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
      select: { id: true, hostId: true, roomId: true, status: true },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the host can start streaming" },
        { status: 403 }
      );
    }

    if (meeting.status !== "LIVE") {
      return NextResponse.json(
        { error: "Meeting must be live to stream" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as { targets: StreamTarget[] };

    if (!body.targets || body.targets.length === 0) {
      return NextResponse.json(
        { error: "At least one stream target is required" },
        { status: 400 }
      );
    }

    const roomName = meeting.roomId || meeting.id;
    const streamingService = getLiveStreamingService();
    const result = await streamingService.startStream(roomName, body.targets);

    // Save stream config to meeting
    await prisma.meeting.update({
      where: { id: params.meetingId },
      data: {
        isStreaming: true,
        streamConfig: {
          egressId: result.egressId,
          targets: result.targets,
          startedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Stream POST error:", error);
    return NextResponse.json(
      { error: "Failed to start stream" },
      { status: 500 }
    );
  }
}

// DELETE: Stop streaming
export async function DELETE(
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
      select: { id: true, hostId: true, streamConfig: true },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the host can stop streaming" },
        { status: 403 }
      );
    }

    const config =
      typeof meeting.streamConfig === "object" && meeting.streamConfig !== null
        ? (meeting.streamConfig as Record<string, unknown>)
        : {};
    const egressId = config.egressId as string | undefined;

    if (egressId) {
      const streamingService = getLiveStreamingService();
      await streamingService.stopStream(egressId);
    }

    await prisma.meeting.update({
      where: { id: params.meetingId },
      data: {
        isStreaming: false,
        streamConfig: {},
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Stream DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to stop stream" },
      { status: 500 }
    );
  }
}
