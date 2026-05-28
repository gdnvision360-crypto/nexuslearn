import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!user || user.role !== 'ADMIN') return null;
  return user;
}

// GET: List users with filters
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const search = searchParams.get('search');
  const role = searchParams.get('role');
  const status = searchParams.get('status');

  const where: Record<string, unknown> = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(role && { role }),
    ...(status && { status }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    total,
    totalPages: Math.ceil(total / limit),
    page,
  });
}

// POST: Invite/create user
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { email, role } = body;

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      role: role || 'STUDENT',
    },
  });

  // Log admin action
  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: 'invite_user',
      target: user.id,
      details: { email, role },
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}

// PATCH: Bulk actions
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { ids, action, role } = body;

  if (!ids || !Array.isArray(ids) || !action) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  switch (action) {
    case 'activate':
      await prisma.user.updateMany({
        where: { id: { in: ids } },
        data: { status: 'ACTIVE' },
      });
      break;
    case 'deactivate':
      await prisma.user.updateMany({
        where: { id: { in: ids } },
        data: { status: 'DEACTIVATED' },
      });
      break;
    case 'suspend':
      await prisma.user.updateMany({
        where: { id: { in: ids } },
        data: { status: 'SUSPENDED' },
      });
      break;
    case 'change_role':
      if (role) {
        await prisma.user.updateMany({
          where: { id: { in: ids } },
          data: { role },
        });
      }
      break;
  }

  // Log admin action
  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: `bulk_${action}`,
      details: { userIds: ids, role },
    },
  });

  return NextResponse.json({ success: true });
}
