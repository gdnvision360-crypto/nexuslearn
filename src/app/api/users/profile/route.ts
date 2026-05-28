import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId') || session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      bio: true,
      timezone: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Fetch stats
  const [meetingsAttended, coursesCompleted, tasksDone, badgesEarned] = await Promise.all([
    prisma.meetingParticipant.count({ where: { userId: targetUserId } }),
    prisma.enrollment.count({ where: { userId: targetUserId, status: 'COMPLETED' } }),
    prisma.task.count({ where: { assigneeId: targetUserId, status: 'DONE' } }),
    prisma.userBadge.count({ where: { userId: targetUserId } }),
  ]);

  // Fetch recent activity
  const recentActivity = await prisma.activityLog.findMany({
    where: { userId: targetUserId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    ...user,
    stats: {
      meetingsAttended,
      coursesCompleted,
      tasksDone,
      badgesEarned,
    },
    socialLinks: {},
    recentActivity,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, bio, timezone, socialLinks } = body;

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(bio !== undefined && { bio }),
      ...(timezone !== undefined && { timezone }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      bio: true,
      timezone: true,
    },
  });

  return NextResponse.json(updated);
}
