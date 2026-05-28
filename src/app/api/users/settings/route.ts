import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!settings) {
    // Create default settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, timezone: true },
    });

    settings = await prisma.userSettings.create({
      data: {
        userId: session.user.id,
        timezone: user?.timezone || 'UTC',
      },
    });

    return NextResponse.json({
      ...settings,
      displayName: user?.name || '',
      email: user?.email || '',
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  return NextResponse.json({
    ...settings,
    displayName: user?.name || '',
    email: user?.email || '',
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    displayName, theme, accentColor, fontSize, compactMode,
    reducedMotion, highContrast, language, timezone, dateFormat,
    profileVisibility, showActivityStatus, showReadReceipts,
    emailNotifications, pushNotifications, inAppNotifications,
    defaultCamera, defaultMic, defaultSpeaker,
    autoVirtualBg, autoEyeContact,
  } = body;

  // Update user name if changed
  if (displayName !== undefined) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: displayName },
    });
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    update: {
      ...(theme !== undefined && { theme }),
      ...(accentColor !== undefined && { accentColor }),
      ...(fontSize !== undefined && { fontSize }),
      ...(compactMode !== undefined && { compactMode }),
      ...(reducedMotion !== undefined && { reducedMotion }),
      ...(highContrast !== undefined && { highContrast }),
      ...(language !== undefined && { language }),
      ...(timezone !== undefined && { timezone }),
      ...(dateFormat !== undefined && { dateFormat }),
      ...(profileVisibility !== undefined && { profileVisibility }),
      ...(showActivityStatus !== undefined && { showActivityStatus }),
      ...(showReadReceipts !== undefined && { showReadReceipts }),
      ...(emailNotifications !== undefined && { emailNotifications }),
      ...(pushNotifications !== undefined && { pushNotifications }),
      ...(inAppNotifications !== undefined && { inAppNotifications }),
      ...(defaultCamera !== undefined && { defaultCamera }),
      ...(defaultMic !== undefined && { defaultMic }),
      ...(defaultSpeaker !== undefined && { defaultSpeaker }),
      ...(autoVirtualBg !== undefined && { autoVirtualBg }),
      ...(autoEyeContact !== undefined && { autoEyeContact }),
    },
    create: {
      userId: session.user.id,
      theme: theme || 'system',
      accentColor: accentColor || '#6366f1',
      fontSize: fontSize || 'medium',
      timezone: timezone || 'UTC',
    },
  });

  return NextResponse.json(settings);
}
