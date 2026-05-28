import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "./AnalyticsClient";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalUsers, meetingsToday, courseCompletions, recentLogs, topCourses, meetingsByDay] = await Promise.all([
    prisma.user.count(),
    prisma.meeting.count({ where: { scheduledStart: { gte: today }, status: { in: ["SCHEDULED", "LIVE"] } } }),
    prisma.enrollment.count({ where: { status: "COMPLETED" } }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { user: { select: { name: true } } } }),
    prisma.course.findMany({
      where: { isPublished: true },
      include: { _count: { select: { enrollments: true } } },
      orderBy: { enrollments: { _count: "desc" } },
      take: 5,
    }),
    // Meeting counts per day for last 7 days
    prisma.meeting.groupBy({
      by: ["status"],
      where: { scheduledStart: { gte: sevenDaysAgo } },
      _count: true,
    }),
  ]);

  // Build daily meeting data
  const dailyMeetings: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const count = await prisma.meeting.count({
      where: { scheduledStart: { gte: dayStart, lt: dayEnd } },
    });
    dailyMeetings.push({
      day: dayStart.toLocaleDateString(undefined, { weekday: "short" }),
      count,
    });
  }

  // Task completion stats
  const totalTasks = await prisma.task.count();
  const doneTasks = await prisma.task.count({ where: { status: "DONE" } });
  const taskCompletionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const engagementScore = Math.min(
    100,
    Math.round((meetingsToday * 10 + courseCompletions * 5 + doneTasks * 2) / Math.max(totalUsers, 1))
  );

  return (
    <AnalyticsClient
      stats={{ totalUsers, meetingsToday, courseCompletions, engagementScore, taskCompletionRate }}
      dailyMeetings={dailyMeetings}
      topCourses={JSON.parse(JSON.stringify(topCourses))}
      recentLogs={JSON.parse(JSON.stringify(recentLogs))}
    />
  );
}
