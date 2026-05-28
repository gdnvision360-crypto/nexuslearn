import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const userId = session.user.id;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    activeMeetings,
    unreadMessages,
    pendingTasks,
    enrollments,
    upcomingMeetings,
    recentActivity,
  ] = await Promise.all([
    prisma.meeting.count({
      where: {
        OR: [
          { status: "LIVE" },
          { status: "SCHEDULED", scheduledStart: { gte: today } },
        ],
        participants: { some: { userId } },
      },
    }),
    prisma.message.count({
      where: {
        channel: { members: { some: { userId } } },
        createdAt: { gte: today },
        senderId: { not: userId },
      },
    }),
    prisma.task.count({
      where: {
        assigneeId: userId,
        status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW"] },
      },
    }),
    prisma.enrollment.findMany({
      where: { userId, status: "ACTIVE" },
      include: { course: { select: { id: true, title: true, thumbnail: true, category: true } } },
      take: 4,
    }),
    prisma.meeting.findMany({
      where: {
        scheduledStart: { gte: now },
        status: "SCHEDULED",
        OR: [
          { hostId: userId },
          { participants: { some: { userId } } },
        ],
      },
      include: {
        host: { select: { id: true, name: true, image: true } },
        participants: { include: { user: { select: { id: true, name: true, image: true } } } },
      },
      orderBy: { scheduledStart: "asc" },
      take: 5,
    }),
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const avgProgress =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length
        )
      : 0;

  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <DashboardClient
      userName={session.user.name ?? "there"}
      greeting={greeting}
      stats={{
        activeMeetings,
        unreadMessages,
        pendingTasks,
        courseProgress: avgProgress,
      }}
      upcomingMeetings={JSON.parse(JSON.stringify(upcomingMeetings))}
      enrollments={JSON.parse(JSON.stringify(enrollments))}
      recentActivity={JSON.parse(JSON.stringify(recentActivity))}
    />
  );
}
