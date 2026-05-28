import { NextRequest, NextResponse } from "next/server";
import { getTelephonyService } from "@/lib/telephony";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const digits = params.get("Digits") || "";
    const from = params.get("From") || "";

    const telephony = getTelephonyService();

    // Look up the meeting by PIN
    const meeting = await prisma.meeting.findFirst({
      where: {
        dialInPin: digits,
        status: "LIVE",
      },
      select: { id: true, roomId: true },
    });

    if (!meeting) {
      // Invalid PIN
      const twiml = telephony.generateInvalidPinTwiML();
      return new NextResponse(twiml, {
        status: 200,
        headers: { "Content-Type": "application/xml" },
      });
    }

    // Valid PIN - connect to the meeting
    const roomName = meeting.roomId || meeting.id;

    // Bridge the call to LiveKit
    await telephony.bridgeToLiveKit(
      params.get("CallSid") || "",
      roomName
    );

    const twiml = telephony.generateConnectedTwiML(meeting.id, roomName);
    return new NextResponse(twiml, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  } catch (error) {
    console.error("Twilio PIN handler error:", error);
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">An error occurred. Please try again later.</Say>
  <Hangup/>
</Response>`;
    return new NextResponse(errorTwiml, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  }
}
