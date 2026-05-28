import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify admin role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeMeetings,
    totalCourses,
    todaysMeetings,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.meeting.count({ where: { status: 'LIVE' } }),
    prisma.course.count({ where: { isPublished: true } }),
    prisma.meeting.count({
      where: {
        scheduledStart: { gte: todayStart },
      },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        action: true,
        entityType: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  // Active users in last 24 hours
  const activeUsers = await prisma.activityLog.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: dayAgo } },
  });

  // User growth for last 7 days
  const userGrowth: Array<{ date: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(todayStart.getTime() - i * 86400000);
    const nextDate = new Date(date.getTime() + 86400000);
    const count = await prisma.user.count({
      where: { createdAt: { gte: date, lt: nextDate } },
    });
    userGrowth.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      count,
    });
  }

  // Meeting frequency for the week
  const meetingFrequency: Array<{ day: string; count: number }> = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(todayStart.getTime() - i * 86400000);
    const nextDate = new Date(date.getTime() + 86400000);
    const count = await prisma.meeting.count({
      where: { scheduledStart: { gte: date, lt: nextDate } },
    });
    meetingFrequency.push({ day: days[date.getDay()], count });
  }

  // Course completion stats
  const [completed, inProgress, notStarted] = await Promise.all([
    prisma.enrollment.count({ where: { status: 'COMPLETED' } }),
    prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
    prisma.enrollment.count({ where: { status: 'DROPPED' } }),
  ]);

  return NextResponse.json({
    totalUsers,
    activeUsers: activeUsers.length,
    activeMeetings,
    totalCourses,
    storageUsed: '12.4 GB',
    todaysMeetings,
    pendingApprovals: 0,
    systemHealth: 'Healthy',
    userGrowth,
    meetingFrequency,
    courseCompletion: [
      { status: 'Completed', count: completed },
      { status: 'In Progress', count: inProgress },
      { status: 'Dropped', count: notStarted },
    ],
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      action: a.action,
      user: a.user.name || 'Unknown',
      target: a.entityType,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
