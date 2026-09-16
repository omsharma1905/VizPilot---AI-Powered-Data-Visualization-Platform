import crypto from 'crypto';
import { getEmailVerificationsCollection } from '@/src/lib/db/collections';
import type { EmailVerificationDocument } from '@/src/types/auth';

export const VERIFICATION_EXPIRATION_MINUTES = 10;
export const VERIFICATION_COOLDOWN_SECONDS = 60;
export const VERIFICATION_MAX_ATTEMPTS = 5;

/**
 * Generates a cryptographically secure 6-digit numeric verification code.
 */
export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Computes an HMAC-SHA256 hash of the verification code using the server session secret.
 * Raw codes are never stored in MongoDB.
 */
export function hashVerificationCode(code: string): string {
  const secret = process.env.SESSION_SECRET || 'vizpilot-entropy-secret';
  return crypto.createHmac('sha256', secret).update(code.trim()).digest('hex');
}

/**
 * Issues a new 6-digit verification code with rate-limit and cooldown protection.
 * Invalidates any older unverified codes for the specified user and purpose.
 */
export async function issueVerificationCode(params: {
  userId: string;
  email: string;
  purpose: 'signup_verification' | 'email_change';
  targetEmail?: string;
}): Promise<{ code: string; expiresAt: Date; resendAvailableAt: Date }> {
  const { userId, email, purpose, targetEmail } = params;
  const col = await getEmailVerificationsCollection();

  // Check cooldown against active code
  const existing = await col.findOne({ userId, purpose });
  const now = new Date();

  if (existing && now < new Date(existing.resendAvailableAt)) {
    const remainingSeconds = Math.ceil(
      (new Date(existing.resendAvailableAt).getTime() - now.getTime()) / 1000
    );
    throw new Error(
      `Please wait ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'} before requesting another verification code.`
    );
  }

  // Invalidate any older verification records for this user and purpose
  await col.deleteMany({ userId, purpose });

  const code = generateVerificationCode();
  const codeHash = hashVerificationCode(code);
  const expiresAt = new Date(now.getTime() + VERIFICATION_EXPIRATION_MINUTES * 60 * 1000);
  const resendAvailableAt = new Date(now.getTime() + VERIFICATION_COOLDOWN_SECONDS * 1000);

  const doc: EmailVerificationDocument = {
    id: `ev_${crypto.randomUUID()}`,
    userId,
    email: email.trim(),
    emailNormalized: email.trim().toLowerCase(),
    codeHash,
    purpose,
    targetEmail: targetEmail ? targetEmail.trim() : undefined,
    targetEmailNormalized: targetEmail ? targetEmail.trim().toLowerCase() : undefined,
    expiresAt,
    createdAt: now,
    attempts: 0,
    resendAvailableAt,
  };

  await col.insertOne(doc);

  return { code, expiresAt, resendAvailableAt };
}

/**
 * Verifies a supplied 6-digit code against the hashed record in MongoDB.
 * Enforces expiration, attempt limits, and single-use invalidation.
 */
export async function verifyCode(params: {
  userId: string;
  code: string;
  purpose: 'signup_verification' | 'email_change';
}): Promise<{
  success: boolean;
  error?: string;
  verification?: EmailVerificationDocument;
}> {
  const { userId, code, purpose } = params;

  if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code.trim())) {
    return {
      success: false,
      error: 'Please enter a valid 6-digit verification code.',
    };
  }

  const col = await getEmailVerificationsCollection();
  const verification = await col.findOne({ userId, purpose });

  if (!verification) {
    return {
      success: false,
      error: 'No active verification code found. Please request a new code.',
    };
  }

  const now = new Date();

  // Check expiration
  if (now > new Date(verification.expiresAt)) {
    await col.deleteOne({ id: verification.id });
    return {
      success: false,
      error: 'This verification code has expired. Please request a new one.',
    };
  }

  // Check attempts
  if (verification.attempts >= VERIFICATION_MAX_ATTEMPTS) {
    await col.deleteOne({ id: verification.id });
    return {
      success: false,
      error: 'Too many incorrect attempts. This code has been invalidated. Please request a new one.',
    };
  }

  const suppliedHash = hashVerificationCode(code);

  if (suppliedHash !== verification.codeHash) {
    const newAttempts = verification.attempts + 1;
    if (newAttempts >= VERIFICATION_MAX_ATTEMPTS) {
      await col.deleteOne({ id: verification.id });
      return {
        success: false,
        error: 'Too many incorrect attempts. This code has been invalidated. Please request a new one.',
      };
    } else {
      await col.updateOne({ id: verification.id }, { $set: { attempts: newAttempts } });
      const attemptsLeft = VERIFICATION_MAX_ATTEMPTS - newAttempts;
      return {
        success: false,
        error: `Incorrect verification code. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.`,
      };
    }
  }

  // Successfully verified! Invalidate immediately to prevent reuse
  await col.deleteOne({ id: verification.id });

  return {
    success: true,
    verification,
  };
}
