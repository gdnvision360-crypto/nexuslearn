import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  verifyTOTP,
  verifyBackupCode,
  checkRateLimit,
  resetRateLimit,
} from '@/lib/two-factor';

// POST: Verify 2FA code during login
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { code, isBackupCode, rememberDevice } = body;

  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }

  // Rate limiting
  const rateCheck = checkRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rateCheck.retryAfter}s` },
      { status: 429 }
    );
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
    select: {
      twoFactorEnabled: true,
      twoFactorSecret: true,
      backupCodes: true,
    },
  });

  if (!settings?.twoFactorEnabled || !settings.twoFactorSecret) {
    return NextResponse.json({ error: '2FA is not enabled' }, { status: 400 });
  }

  if (isBackupCode) {
    // Verify backup code
    const hashedCodes = (settings.backupCodes as string[]) || [];
    const codeIndex = verifyBackupCode(code, hashedCodes);

    if (codeIndex === -1) {
      return NextResponse.json(
        { error: 'Invalid backup code', remainingAttempts: rateCheck.remainingAttempts },
        { status: 400 }
      );
    }

    // Remove used backup code
    const updatedCodes = [...hashedCodes];
    updatedCodes.splice(codeIndex, 1);

    await prisma.userSettings.update({
      where: { userId: session.user.id },
      data: { backupCodes: updatedCodes },
    });

    resetRateLimit(session.user.id);
    return NextResponse.json({
      success: true,
      remainingBackupCodes: updatedCodes.length,
    });
  }

  // Verify TOTP code
  if (!verifyTOTP(settings.twoFactorSecret, code)) {
    return NextResponse.json(
      { error: 'Invalid code', remainingAttempts: rateCheck.remainingAttempts },
      { status: 400 }
    );
  }

  resetRateLimit(session.user.id);

  return NextResponse.json({ success: true, rememberDevice });
}
