import {
  RoomServiceClient,
  AccessToken,
  VideoGrant,
  DataPacket_Kind,
} from "livekit-server-sdk";

const LIVEKIT_API_URL = process.env.LIVEKIT_API_URL!;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;

function getRoomServiceClient(): RoomServiceClient {
  return new RoomServiceClient(
    LIVEKIT_API_URL,
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET
  );
}

export async function createRoom(
  roomName: string,
  metadata?: string
): Promise<void> {
  const client = getRoomServiceClient();
  await client.createRoom({
    name: roomName,
    emptyTimeout: 60 * 10, // 10 minutes
    maxParticipants: 100,
    metadata: metadata ?? "",
  });
}

export async function deleteRoom(roomName: string): Promise<void> {
  const client = getRoomServiceClient();
  await client.deleteRoom(roomName);
}

export function generateToken(
  roomName: string,
  participantName: string,
  participantId: string,
  metadata?: string
): string {
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  };

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantId,
    name: participantName,
    metadata: metadata ?? "",
    ttl: 6 * 60 * 60, // 6 hours
  });

  token.addGrant(grant);
  return token.toJwt();
}

export async function listParticipants(roomName: string) {
  const client = getRoomServiceClient();
  return client.listParticipants(roomName);
}

export async function removeParticipant(
  roomName: string,
  participantId: string
): Promise<void> {
  const client = getRoomServiceClient();
  await client.removeParticipant(roomName, participantId);
}

export async function muteParticipant(
  roomName: string,
  participantId: string,
  trackSid: string
): Promise<void> {
  const client = getRoomServiceClient();
  await client.mutePublishedTrack(roomName, participantId, trackSid, true);
}

export async function sendData(
  roomName: string,
  data: Record<string, unknown>,
  participantIds?: string[]
): Promise<void> {
  const client = getRoomServiceClient();
  const payload = new TextEncoder().encode(JSON.stringify(data));
  await client.sendData(
    roomName,
    payload,
    DataPacket_Kind.RELIABLE,
    participantIds ? { destinationIdentities: participantIds } : undefined
  );
}
