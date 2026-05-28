import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MeetingsClient } from "./MeetingsClient";

export const metadata = { title: "Meetings" };

export default async function MeetingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const userId = session.user.id;
  const now = new Date();

  const [upcoming, past, recordings] = await Promise.all([
    prisma.meeting.findMany({
      where: {
        scheduledStart: { gte: now },
        status: { in: ["SCHEDULED", "LIVE"] },
        OR: [{ hostId: userId }, { participants: { some: { userId } } }],
      },
      include: {
        host: { select: { id: true, name: true, image: true } },
        participants: { include: { user: { select: { id: true, name: true, image: true } } }, take: 5 },
      },
      orderBy: { scheduledStart: "asc" },
      take: 20,
    }),
    prisma.meeting.findMany({
      where: {
        status: "ENDED",
        OR: [{ hostId: userId }, { participants: { some: { userId } } }],
      },
      include: {
        host: { select: { id: true, name: true, image: true } },
        participants: { include: { user: { select: { id: true, name: true, image: true } } }, take: 5 },
      },
      orderBy: { scheduledStart: "desc" },
      take: 20,
    }),
    prisma.meetingRecording.findMany({
      where: { meeting: { OR: [{ hostId: userId }, { participants: { some: { userId } } }] } },
      include: { meeting: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <MeetingsClient
      upcoming={JSON.parse(JSON.stringify(upcoming))}
      past={JSON.parse(JSON.stringify(past))}
      recordings={JSON.parse(JSON.stringify(recordings))}
      userId={userId}
    />
  );
}
