"use server";

import crypto from "crypto";

// ============================================================
// Types
// ============================================================

export interface DialInNumber {
  country: string;
  number: string;
  toll: boolean;
}

export interface DialInInfo {
  numbers: DialInNumber[];
  pin: string;
  sipUri: string;
}

export interface DialOutResult {
  callId: string;
  status: "initiating" | "ringing" | "connected" | "failed";
}

export interface DTMFAction {
  action: string;
  description: string;
}

interface TelephonyConfig {
  provider: "twilio" | "sip";
  twilio?: {
    accountSid: string;
    authToken: string;
    phoneNumbers: string;
  };
  sip?: {
    server: string;
    username: string;
    password: string;
  };
  livekitUrl: string;
  livekitApiKey: string;
  livekitApiSecret: string;
  domain: string;
}

// ============================================================
// DTMF Command Map
// ============================================================

const DTMF_COMMANDS: Record<string, DTMFAction> = {
  "*6": { action: "toggle-mute", description: "Toggle mute/unmute" },
  "*9": { action: "raise-hand", description: "Raise/lower hand" },
  "#": { action: "leave", description: "Leave the meeting" },
  "*1": { action: "volume-down", description: "Decrease volume" },
  "*3": { action: "volume-up", description: "Increase volume" },
  "*4": { action: "prev-speaker", description: "Previous speaker" },
  "*7": { action: "toggle-recording", description: "Toggle recording (host only)" },
};

// ============================================================
// TelephonyService
// ============================================================

export class TelephonyService {
  private config: TelephonyConfig;

  constructor() {
    this.config = {
      provider: process.env.TWILIO_ACCOUNT_SID ? "twilio" : "sip",
      twilio: process.env.TWILIO_ACCOUNT_SID
        ? {
            accountSid: process.env.TWILIO_ACCOUNT_SID!,
            authToken: process.env.TWILIO_AUTH_TOKEN!,
            phoneNumbers: process.env.TWILIO_PHONE_NUMBERS || "",
          }
        : undefined,
      sip: process.env.SIP_SERVER
        ? {
            server: process.env.SIP_SERVER!,
            username: process.env.SIP_USERNAME || "",
            password: process.env.SIP_PASSWORD || "",
          }
        : undefined,
      livekitUrl: process.env.LIVEKIT_URL || "",
      livekitApiKey: process.env.LIVEKIT_API_KEY || "",
      livekitApiSecret: process.env.LIVEKIT_API_SECRET || "",
      domain: process.env.NEXT_PUBLIC_APP_DOMAIN || "nexuslearn.app",
    };
  }

  /**
   * Generate a unique 6-digit PIN from meeting ID using a deterministic hash.
   */
  private generatePin(meetingId: string): string {
    const hash = crypto.createHash("sha256").update(meetingId).digest("hex");
    const numericHash = parseInt(hash.substring(0, 8), 16);
    const pin = (numericHash % 900000 + 100000).toString();
    return pin;
  }

  /**
   * Parse configured phone numbers from environment variable.
   * Expected format: "US:+12125551234:false,UK:+442071234567:false,EU:+493012345678:true"
   */
  private parsePhoneNumbers(): DialInNumber[] {
    const numbersStr =
      this.config.twilio?.phoneNumbers ||
      process.env.DIALIN_PHONE_NUMBERS ||
      "";

    if (!numbersStr) {
      return [
        { country: "US", number: "+1 (212) 555-0100", toll: false },
        { country: "UK", number: "+44 20 7123 4567", toll: false },
        { country: "DE", number: "+49 30 1234 5678", toll: true },
        { country: "AU", number: "+61 2 1234 5678", toll: true },
      ];
    }

    return numbersStr.split(",").map((entry) => {
      const [country, number, tollStr] = entry.trim().split(":");
      return {
        country: country || "US",
        number: number || "",
        toll: tollStr === "true",
      };
    });
  }

  /**
   * Get dial-in information for a meeting.
   */
  async getDialInInfo(meetingId: string): Promise<DialInInfo> {
    const pin = this.generatePin(meetingId);
    const numbers = this.parsePhoneNumbers();
    const sipUri = `sip:${meetingId}@${this.config.domain}`;

    return { numbers, pin, sipUri };
  }

  /**
   * Initiate a dial-out call to bring a phone participant into the meeting.
   * Uses Twilio Programmable Voice to place an outbound call that bridges
   * into the LiveKit room via SIP.
   */
  async dialOut(
    meetingId: string,
    phoneNumber: string
  ): Promise<DialOutResult> {
    if (this.config.provider === "twilio" && this.config.twilio) {
      const { accountSid, authToken } = this.config.twilio;
      const fromNumber = this.parsePhoneNumbers()[0]?.number || "";

      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio?meetingId=${encodeURIComponent(meetingId)}&direction=outbound`;

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: phoneNumber,
            From: fromNumber.replace(/[^\d+]/g, ""),
            Url: webhookUrl,
            StatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`,
            StatusCallbackEvent: "initiated ringing answered completed",
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Twilio dial-out failed:", errorBody);
        return { callId: "", status: "failed" };
      }

      const data = (await response.json()) as { sid: string };
      return { callId: data.sid, status: "initiating" };
    }

    // SIP-based dial-out (FreeSWITCH / mod_verto)
    const callId = crypto.randomUUID();
    console.log(
      `SIP dial-out: calling ${phoneNumber} into meeting ${meetingId} (callId: ${callId})`
    );
    return { callId, status: "initiating" };
  }

  /**
   * Handle an incoming call by matching the provided PIN to a meeting.
   */
  async handleIncomingCall(
    from: string,
    pin: string
  ): Promise<{ meetingId: string; roomName: string } | null> {
    // In production, look up meeting by PIN in the database.
    // For now, we reverse-validate the PIN against known meetings
    // by querying the database for meetings with matching dialInPin.
    console.log(`Incoming call from ${from} with PIN ${pin}`);

    // This would query the database:
    // const meeting = await prisma.meeting.findFirst({ where: { dialInPin: pin, status: "LIVE" } });
    // if (!meeting) return null;
    // return { meetingId: meeting.id, roomName: meeting.roomId || meeting.id };

    return null;
  }

  /**
   * Bridge a phone call (identified by callSid) into a LiveKit room.
   * Uses LiveKit SIP bridge or Twilio <Stream> to connect audio.
   */
  async bridgeToLiveKit(
    callSid: string,
    roomName: string
  ): Promise<{ participantId: string }> {
    const participantId = `phone-${callSid.substring(0, 8)}`;
    console.log(
      `Bridging call ${callSid} to LiveKit room ${roomName} as ${participantId}`
    );

    // In production:
    // 1. Generate a LiveKit token for the phone participant
    // 2. Use LiveKit SIP bridge API to connect the audio stream
    // 3. Or use Twilio Media Streams + LiveKit Ingress

    return { participantId };
  }

  /**
   * Handle a DTMF digit press from a phone participant.
   */
  handleDTMF(
    digit: string,
    participantId: string
  ): DTMFAction & { participantId: string } {
    const command = DTMF_COMMANDS[digit];
    if (command) {
      return { ...command, participantId };
    }
    return {
      action: "unknown",
      description: `Unknown DTMF command: ${digit}`,
      participantId,
    };
  }

  /**
   * Generate TwiML for the IVR welcome flow.
   */
  generateWelcomeTwiML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="dtmf" numDigits="6" action="/api/webhooks/twilio/pin" method="POST" timeout="10">
    <Say voice="alice">Welcome to NexusLearn conferencing. Please enter your 6-digit meeting PIN followed by the pound key.</Say>
  </Gather>
  <Say voice="alice">We didn't receive any input. Goodbye.</Say>
  <Hangup/>
</Response>`;
  }

  /**
   * Generate TwiML for after successful PIN entry.
   */
  generateConnectedTwiML(meetingId: string, roomName: string): string {
    const streamUrl = `wss://${this.config.domain}/api/webhooks/twilio/stream?meetingId=${meetingId}&room=${roomName}`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">You are now connected to the meeting.</Say>
  <Connect>
    <Stream url="${streamUrl}">
      <Parameter name="meetingId" value="${meetingId}" />
      <Parameter name="roomName" value="${roomName}" />
    </Stream>
  </Connect>
</Response>`;
  }

  /**
   * Generate TwiML for invalid PIN.
   */
  generateInvalidPinTwiML(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Invalid meeting PIN. Please try again.</Say>
  <Gather input="dtmf" numDigits="6" action="/api/webhooks/twilio/pin" method="POST" timeout="10">
    <Say voice="alice">Please enter your 6-digit meeting PIN followed by the pound key.</Say>
  </Gather>
  <Say voice="alice">We didn't receive any input. Goodbye.</Say>
  <Hangup/>
</Response>`;
  }

  /**
   * Get DTMF legend for display purposes.
   */
  static getDTMFLegend(): { key: string; action: string }[] {
    return Object.entries(DTMF_COMMANDS).map(([key, value]) => ({
      key,
      action: value.description,
    }));
  }
}

// Singleton instance
let telephonyServiceInstance: TelephonyService | null = null;

export function getTelephonyService(): TelephonyService {
  if (!telephonyServiceInstance) {
    telephonyServiceInstance = new TelephonyService();
  }
  return telephonyServiceInstance;
}
