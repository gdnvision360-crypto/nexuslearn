import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Fetch paginated notifications with filters
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
  const unread = searchParams.get('unread') === 'true';
  const type = searchParams.get('type');
  const priority = searchParams.get('priority');

  const where: Record<string, unknown> = {
    userId: session.user.id,
    ...(unread && { read: false }),
    ...(type && { type }),
    ...(priority && { priority }),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId: session.user.id, read: false },
    }),
  ]);

  return NextResponse.json({
    notifications,
    total,
    unreadCount,
    hasMore: page * limit < total,
    page,
  });
}

// POST: Create notification (internal use)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { userId, type, title, message, link, priority, metadata } = body;

  if (!userId || !type || !title || !message) {
    return NextResponse.json(
      { error: 'Missing required fields: userId, type, title, message' },
      { status: 400 }
    );
  }

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body: message,
      link: link || null,
      priority: priority || 'normal',
      metadata: metadata || null,
    },
  });

  return NextResponse.json({ notification }, { status: 201 });
}

// PATCH: Mark as read (single, bulk, or all)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { ids, markAll } = body;

  if (markAll) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true, readAt: new Date() },
    });
    return NextResponse.json({ success: true, message: 'All marked as read' });
  }

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: 'Provide ids array or markAll: true' },
      { status: 400 }
    );
  }

  await prisma.notification.updateMany({
    where: {
      id: { in: ids },
      userId: session.user.id,
    },
    data: { read: true, readAt: new Date() },
  });

  return NextResponse.json({ success: true });
}

// DELETE: Clear notifications
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    await prisma.notification.deleteMany({
      where: { id, userId: session.user.id },
    });
  } else {
    // Clear all read notifications
    await prisma.notification.deleteMany({
      where: { userId: session.user.id, read: true },
    });
  }

  return NextResponse.json({ success: true });
}
