import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { generateToken } from "@/lib/livekit";
import { MeetingRoom } from "@/components/meeting/MeetingRoom";

interface MeetingPageProps {
  params: { meetingId: string };
}

export default async function MeetingPage({ params }: MeetingPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin");
  }

  const meeting = await prisma.meeting.findUnique({
    where: { id: params.meetingId },
    include: {
      host: {
        select: { id: true, name: true, email: true, image: true },
      },
      participants: {
        select: {
          userId: true,
          role: true,
        },
      },
    },
  });

  if (!meeting) {
    notFound();
  }

  // Check if meeting has ended
  if (meeting.status === "ENDED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Meeting Ended</h1>
          <p className="mt-2 text-gray-400">
            This meeting has already ended.
          </p>
          {meeting.recordingUrl && (
            <a
              href={meeting.recordingUrl}
              className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
            >
              View Recording
            </a>
          )}
          <a
            href="/meetings"
            className="mt-4 block text-sm text-blue-400 hover:text-blue-300"
          >
            ← Back to meetings
          </a>
        </div>
      </div>
    );
  }

  // Check if meeting was cancelled
  if (meeting.status === "CANCELLED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Meeting Cancelled</h1>
          <p className="mt-2 text-gray-400">
            This meeting has been cancelled.
          </p>
          <a
            href="/meetings"
            className="mt-4 block text-sm text-blue-400 hover:text-blue-300"
          >
            ← Back to meetings
          </a>
        </div>
      </div>
    );
  }

  const isHost = meeting.hostId === user.id;
  const existingParticipant = meeting.participants.find(
    (p) => p.userId === user.id
  );

  // Generate LiveKit room name from meeting ID
  const roomName = `meeting-${meeting.id}`;

  // Generate token with participant metadata
  const metadata = JSON.stringify({
    meetingId: meeting.id,
    role: isHost
      ? "HOST"
      : existingParticipant?.role ?? "ATTENDEE",
    userId: user.id,
  });

  const token = generateToken(
    roomName,
    user.name ?? user.email,
    user.id,
    metadata
  );

  // Upsert participant record
  await prisma.meetingParticipant.upsert({
    where: {
      meetingId_userId: {
        meetingId: meeting.id,
        userId: user.id,
      },
    },
    create: {
      meetingId: meeting.id,
      userId: user.id,
      role: isHost ? "HOST" : "ATTENDEE",
    },
    update: {
      joinedAt: new Date(),
      leftAt: null,
    },
  });

  // Update meeting status to LIVE if host is joining and meeting is SCHEDULED
  if (isHost && meeting.status === "SCHEDULED") {
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        status: "LIVE",
        actualStart: new Date(),
        roomId: roomName,
      },
    });
  }

  return (
    <MeetingRoom
      meetingId={meeting.id}
      meetingTitle={meeting.title}
      token={token}
      isHost={isHost}
      userName={user.name ?? user.email}
      userId={user.id}
    />
  );
}
