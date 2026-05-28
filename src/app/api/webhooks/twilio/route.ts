import { NextRequest, NextResponse } from "next/server";
import { getTelephonyService } from "@/lib/telephony";
import { prisma } from "@/lib/prisma";

// Twilio sends form-encoded data
async function parseFormData(
  request: NextRequest
): Promise<Record<string, string>> {
  const text = await request.text();
  const params = new URLSearchParams(text);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

// POST: Handle incoming Twilio voice webhook (initial call)
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const meetingId = searchParams.get("meetingId");
    const direction = searchParams.get("direction");
    const formData = await parseFormData(request);

    const telephony = getTelephonyService();

    // Outbound call - connect directly to the meeting
    if (direction === "outbound" && meetingId) {
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        select: { id: true, roomId: true },
      });

      if (meeting) {
        const roomName = meeting.roomId || meeting.id;
        const twiml = telephony.generateConnectedTwiML(meetingId, roomName);
        return new NextResponse(twiml, {
          status: 200,
          headers: { "Content-Type": "application/xml" },
        });
      }
    }

    // Inbound call - play IVR, gather PIN
    const twiml = telephony.generateWelcomeTwiML();
    return new NextResponse(twiml, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  } catch (error) {
    console.error("Twilio webhook error:", error);
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
