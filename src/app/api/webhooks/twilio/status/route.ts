import { NextRequest, NextResponse } from "next/server";

// POST: Handle Twilio call status updates
export async function POST(request: NextRequest) {
  try {
    const text = await request.text();
    const params = new URLSearchParams(text);

    const callSid = params.get("CallSid") || "";
    const callStatus = params.get("CallStatus") || "";
    const callDuration = params.get("CallDuration") || "0";

    console.log(
      `Call status update: ${callSid} -> ${callStatus} (duration: ${callDuration}s)`
    );

    // Handle different call statuses
    switch (callStatus) {
      case "completed":
        // Call ended - remove phone participant from LiveKit room if needed
        console.log(`Call ${callSid} completed after ${callDuration}s`);
        break;
      case "busy":
      case "no-answer":
      case "failed":
      case "canceled":
        console.log(`Call ${callSid} failed with status: ${callStatus}`);
        break;
      case "in-progress":
        console.log(`Call ${callSid} is now in progress`);
        break;
      default:
        console.log(`Call ${callSid} status: ${callStatus}`);
    }

    // Twilio expects a 200 response
    return new NextResponse("", { status: 200 });
  } catch (error) {
    console.error("Twilio status webhook error:", error);
    return new NextResponse("", { status: 200 });
  }
}
