import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTelephonyService } from "@/lib/telephony";
import { prisma } from "@/lib/prisma";

// GET: Retrieve dial-in numbers and PIN for a meeting
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
        title: true,
        hostId: true,
        dialInPin: true,
        status: true,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const telephony = getTelephonyService();
    const dialInInfo = await telephony.getDialInInfo(params.meetingId);

    // Store the PIN in the meeting if not already set
    if (!meeting.dialInPin) {
      await prisma.meeting.update({
        where: { id: params.meetingId },
        data: { dialInPin: dialInInfo.pin },
      });
    }

    return NextResponse.json({
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      ...dialInInfo,
      dtmfLegend: [
        { key: "*6", action: "Toggle mute/unmute" },
        { key: "*9", action: "Raise/lower hand" },
        { key: "#", action: "Leave the meeting" },
        { key: "*1", action: "Decrease volume" },
        { key: "*3", action: "Increase volume" },
      ],
    });
  } catch (error) {
    console.error("Dial-in info error:", error);
    return NextResponse.json(
      { error: "Failed to get dial-in info" },
      { status: 500 }
    );
  }
}

// POST: Initiate dial-out to a phone number (host only)
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
        { error: "Only the host can dial out" },
        { status: 403 }
      );
    }

    if (meeting.status !== "LIVE") {
      return NextResponse.json(
        { error: "Meeting must be live to dial out" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as { phoneNumber?: string };
    const { phoneNumber } = body;

    if (!phoneNumber || typeof phoneNumber !== "string") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Basic phone number validation
    const cleanNumber = phoneNumber.replace(/[\s\-()]/g, "");
    if (!/^\+?\d{7,15}$/.test(cleanNumber)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    const telephony = getTelephonyService();
    const result = await telephony.dialOut(params.meetingId, cleanNumber);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Dial-out error:", error);
    return NextResponse.json(
      { error: "Failed to initiate dial-out" },
      { status: 500 }
    );
  }
}
