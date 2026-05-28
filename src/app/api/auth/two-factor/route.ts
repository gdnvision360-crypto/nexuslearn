import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  generateTOTPSecret,
  generateOTPAuthURI,
  verifyTOTP,
  generateBackupCodes,
  hashBackupCodes,
  checkRateLimit,
  resetRateLimit,
} from '@/lib/two-factor';

// POST: Generate TOTP secret + QR URI
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const secret = generateTOTPSecret();
  const otpauthUri = generateOTPAuthURI(secret, user.email);

  return NextResponse.json({
    secret,
    otpauthUri,
  });
}

// PUT: Verify code and enable 2FA
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { code, secret } = body;

  if (!code || !secret) {
    return NextResponse.json(
      { error: 'Code and secret are required' },
      { status: 400 }
    );
  }

  // Rate limiting
  const rateCheck = checkRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rateCheck.retryAfter}s` },
      { status: 429 }
    );
  }

  // Verify the code
  if (!verifyTOTP(secret, code)) {
    return NextResponse.json(
      { error: 'Invalid code. Please try again.', remainingAttempts: rateCheck.remainingAttempts },
      { status: 400 }
    );
  }

  // Generate backup codes
  const backupCodes = generateBackupCodes();
  const hashedCodes = hashBackupCodes(backupCodes);

  // Enable 2FA in settings
  await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    update: {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      backupCodes: hashedCodes,
    },
    create: {
      userId: session.user.id,
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      backupCodes: hashedCodes,
    },
  });

  resetRateLimit(session.user.id);

  return NextResponse.json({
    success: true,
    backupCodes,
    message: '2FA enabled successfully',
  });
}

// DELETE: Disable 2FA
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.userSettings.update({
    where: { userId: session.user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: null,
    },
  });

  return NextResponse.json({ success: true, message: '2FA disabled' });
}
