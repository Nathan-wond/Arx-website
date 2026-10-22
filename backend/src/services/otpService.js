/**
 * OTP Service — in-memory store with bcrypt hashing + 5-minute TTL
 * Supports: PRESIDENTIAL_ADMIN, LOWER_ADMIN, TEACHER
 */
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

/**
 * Map<userId, { hash: string, expiresAt: number, attempts: number }>
 * Keyed by the user's unique id so each user has one live OTP at a time.
 */
const otpStore = new Map();

const OTP_TTL_MS        = 5 * 60 * 1000;  // 5 minutes
const OTP_SALT_ROUNDS   = 8;              // bcrypt rounds (fast enough for OTP validation)
const MAX_OTP_ATTEMPTS  = 5;             // after which the OTP is invalidated

/**
 * Generate a cryptographically secure 6-digit numeric OTP.
 * @returns {string} e.g. "384920"
 */
export function generateOtpCode() {
  // Use rejection sampling to avoid modulo bias
  let n;
  do {
    const buf = crypto.randomBytes(4);
    n = buf.readUInt32BE(0);
  } while (n >= 4000000000);           // keep within safe range
  return String(n % 1000000).padStart(6, '0');
}

/**
 * Store a hashed OTP for a user.
 * Any previous OTP for that user is overwritten.
 * @param {string} userId - unique user identifier
 * @param {string} plainCode - the 6-digit OTP
 * @returns {Promise<void>}
 */
export async function storeOtp(userId, plainCode) {
  const hash = await bcrypt.hash(plainCode, OTP_SALT_ROUNDS);
  otpStore.set(userId, {
    hash,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0
  });
}

/**
 * Verify an OTP submitted by a user.
 * - Checks expiry first (timing-safe short-circuit)
 * - Increments attempt counter; invalidates after MAX_OTP_ATTEMPTS
 * @param {string} userId
 * @param {string} candidateCode
 * @returns {Promise<{ valid: boolean, reason?: string }>}
 */
export async function verifyOtp(userId, candidateCode) {
  const record = otpStore.get(userId);

  if (!record) {
    return { valid: false, reason: 'NO_OTP' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(userId);
    return { valid: false, reason: 'EXPIRED' };
  }

  record.attempts += 1;

  if (record.attempts > MAX_OTP_ATTEMPTS) {
    otpStore.delete(userId);
    return { valid: false, reason: 'TOO_MANY_ATTEMPTS' };
  }

  const match = await bcrypt.compare(String(candidateCode).trim(), record.hash);

  if (match) {
    otpStore.delete(userId);          // single-use: delete on success
    return { valid: true };
  }

  // If this was the final allowed attempt, invalidate
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    otpStore.delete(userId);
  } else {
    otpStore.set(userId, record);     // persist updated attempt count
  }

  return { valid: false, reason: 'INVALID_CODE' };
}

/**
 * Remove any pending OTP for a user (e.g., on logout or account lock).
 * @param {string} userId
 */
export function clearOtp(userId) {
  otpStore.delete(userId);
}

/**
 * Returns remaining TTL in milliseconds for a user's OTP, or 0 if none/expired.
 * @param {string} userId
 * @returns {number}
 */
export function getOtpTtlMs(userId) {
  const record = otpStore.get(userId);
  if (!record) return 0;
  const remaining = record.expiresAt - Date.now();
  return remaining > 0 ? remaining : 0;
}

// Cleanup expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [uid, rec] of otpStore.entries()) {
    if (rec.expiresAt <= now) otpStore.delete(uid);
  }
}, 10 * 60 * 1000).unref();
