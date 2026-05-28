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

// GET: Retrieve all platform settings
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const settings = await prisma.platformSettings.findMany();

  // Convert to key-value object
  const config: Record<string, unknown> = {};
  for (const s of settings) {
    config[s.key] = s.value;
  }

  return NextResponse.json(config);
}

// PUT: Update platform settings
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();

  // Store each key as a separate PlatformSettings row
  const categoryMap: Record<string, string> = {
    platformName: 'general',
    logoUrl: 'general',
    faviconUrl: 'general',
    maxParticipants: 'meetings',
    recordingPolicy: 'meetings',
    waitingRoom: 'meetings',
    storageQuotaStudent: 'storage',
    storageQuotaInstructor: 'storage',
    storageQuotaAdmin: 'storage',
    smtpHost: 'email',
    smtpPort: 'email',
    smtpUser: 'email',
    smtpFrom: 'email',
    maintenanceMode: 'maintenance',
    features: 'features',
  };

  const promises = Object.entries(body).map(([key, value]) =>
    prisma.platformSettings.upsert({
      where: { key },
      update: {
        value: value as any,
        category: categoryMap[key] || 'general',
      },
      create: {
        key,
        value: value as any,
        category: categoryMap[key] || 'general',
      },
    })
  );

  await Promise.all(promises);

  // Log admin action
  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: 'update_platform_settings',
      details: { keys: Object.keys(body) },
    },
  });

  return NextResponse.json({ success: true });
}
