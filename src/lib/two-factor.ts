// src/lib/two-factor.ts
// TOTP-based Two-Factor Authentication

import crypto from 'crypto';

const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const TOTP_ALGORITHM = 'sha1';
const BACKUP_CODE_COUNT = 10;
const MAX_VERIFY_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 900000; // 15 minutes

// Rate limiting store (in-memory, use Redis in production)
const rateLimitStore = new Map<string, { attempts: number; windowStart: number }>();

/**
 * Generate a random base32 secret for TOTP
 */
export function generateTOTPSecret(): string {
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

/**
 * Generate TOTP code for a given secret and time
 */
export function generateTOTP(secret: string, time?: number): string {
  const now = time || Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(now / TOTP_PERIOD);

  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeUInt32BE(0, 0);
  timeBuffer.writeUInt32BE(timeStep, 4);

  const secretBuffer = base32Decode(secret);
  const hmac = crypto.createHmac(TOTP_ALGORITHM, secretBuffer);
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0xf;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, TOTP_DIGITS);
  return otp.toString().padStart(TOTP_DIGITS, '0');
}

/**
 * Verify a TOTP code with a window of ±1 period
 */
export function verifyTOTP(secret: string, code: string): boolean {
  const now = Math.floor(Date.now() / 1000);

  // Check current and adjacent time steps (±1 window)
  for (let i = -1; i <= 1; i++) {
    const time = now + i * TOTP_PERIOD;
    if (generateTOTP(secret, time) === code) {
      return true;
    }
  }
  return false;
}

/**
 * Generate OTPAuth URI for QR code scanning
 */
export function generateOTPAuthURI(
  secret: string,
  email: string,
  issuer: string = 'NexusLearn'
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

/**
 * Generate QR code data URL from OTPAuth URI
 * Returns a simple text-based representation; use a QR library on client
 */
export function getQRCodeData(uri: string): string {
  // In production, use a QR code library like 'qrcode'
  // For now, return the URI for client-side QR generation
  return uri;
}

/**
 * Generate backup/recovery codes
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    // Format: XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

/**
 * Hash backup codes for storage
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map((code) =>
    crypto.createHash('sha256').update(code.replace('-', '')).digest('hex')
  );
}

/**
 * Verify a backup code against stored hashes
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): number {
  const inputHash = crypto
    .createHash('sha256')
    .update(code.replace('-', '').toUpperCase())
    .digest('hex');

  const index = hashedCodes.findIndex((h) => h === inputHash);
  return index;
}

/**
 * Check rate limiting for verification attempts
 */
export function checkRateLimit(userId: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(userId);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(userId, { attempts: 1, windowStart: now });
    return { allowed: true, remainingAttempts: MAX_VERIFY_ATTEMPTS - 1 };
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    const retryAfter = Math.ceil(
      (record.windowStart + RATE_LIMIT_WINDOW - now) / 1000
    );
    return { allowed: false, remainingAttempts: 0, retryAfter };
  }

  record.attempts++;
  return {
    allowed: true,
    remainingAttempts: MAX_VERIFY_ATTEMPTS - record.attempts,
  };
}

/**
 * Reset rate limit after successful verification
 */
export function resetRateLimit(userId: string): void {
  rateLimitStore.delete(userId);
}

// ─── Base32 Encoding/Decoding ────────────────────────────────

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of cleaned) {
    const index = BASE32_CHARS.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}
