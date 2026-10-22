import crypto from 'node:crypto';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 10000;
  const keyLength = 64;
  const digest = 'sha512';
  const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest);
  return `${salt}:${iterations}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password, storedHash) {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const [salt, iterationsStr, keyHex] = parts;
    const iterations = parseInt(iterationsStr, 10);
    const keyLength = 64;
    const digest = 'sha512';
    const candidateKey = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest);
    const storedBuffer = Buffer.from(keyHex, 'hex');
    return crypto.timingSafeEqual(candidateKey, storedBuffer);
  } catch {
    return false;
  }
}

const COMMON_WEAK_PASSWORDS = new Set([
'password',
'password123',
'12345678',
'123456789',
'1234567890',
'qwerty123',
'admin123',
'welcome123',
'letmein123',
'iloveyou',
'arxitclub',
'arx2026',
'arxclub2026']
);

export function evaluatePasswordRules(password) {
  const p = typeof password === 'string' ? password : '';
  return {
    minLength: p.length >= 8,
    hasUpper: /[A-Z]/.test(p),
    hasLower: /[a-z]/.test(p),
    hasNumber: /[0-9]/.test(p),
    hasSpecial: /[^A-Za-z0-9]/.test(p)
  };
}

export function evaluatePasswordStrength(password, personalInfo = [])

{
  const p = typeof password === 'string' ? password : '';
  const rules = evaluatePasswordRules(p);

  if (!p || p.length < 6) {
    return { strength: 'Too weak', rules, isWeakPattern: true };
  }

  const lower = p.toLowerCase();

  
  if (COMMON_WEAK_PASSWORDS.has(lower)) {
    return { strength: 'Too weak', rules, isWeakPattern: true };
  }

  
  if (new Set(p.split('')).size <= 2 && p.length >= 8) {
    return { strength: 'Too weak', rules, isWeakPattern: true };
  }

  
  for (const info of personalInfo) {
    const cleanInfo = (info || '').trim().toLowerCase();
    if (cleanInfo.length >= 3 && lower.includes(cleanInfo)) {
      return { strength: 'Too weak', rules, isWeakPattern: true };
    }
  }

  
  const satisfiedCount = [
  rules.minLength,
  rules.hasUpper,
  rules.hasLower,
  rules.hasNumber,
  rules.hasSpecial].
  filter(Boolean).length;

  if (satisfiedCount === 5) {
    if (p.length >= 12 && /[^A-Za-z0-9].*[^A-Za-z0-9]/.test(p)) {
      return { strength: 'Very strong', rules, isWeakPattern: false };
    }
    if (p.length >= 10) {
      return { strength: 'Strong', rules, isWeakPattern: false };
    }
    return { strength: 'Strong', rules, isWeakPattern: false };
  }

  if (satisfiedCount === 4) {
    return { strength: 'Fair', rules, isWeakPattern: false };
  }

  if (satisfiedCount === 3) {
    return { strength: 'Weak', rules, isWeakPattern: false };
  }

  return { strength: 'Too weak', rules, isWeakPattern: false };
}

export function validateStrongPassword(
password,
options)

{
  const p = typeof password === 'string' ? password : '';
  const personalInfo = options?.personalInfo || [];
  const { strength, rules, isWeakPattern } = evaluatePasswordStrength(p, personalInfo);
  const errors = [];

  
  if (options && 'confirmPassword' in options) {
    const cp = typeof options.confirmPassword === 'string' ? options.confirmPassword : '';
    if (!cp || cp !== p) {
      errors.push('Passwords do not match.');
    }
  }

  if (!rules.minLength) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (!rules.hasUpper) {
    errors.push('Password must contain at least 1 uppercase letter.');
  }
  if (!rules.hasLower) {
    errors.push('Password must contain at least 1 lowercase letter.');
  }
  if (!rules.hasNumber) {
    errors.push('Password must contain at least 1 number.');
  }
  if (!rules.hasSpecial) {
    errors.push('Password must contain at least 1 special character.');
  }

  if (isWeakPattern) {
    errors.push('Password is too weak or contains easily guessable personal information.');
  }

  const valid = errors.length === 0;

  return {
    valid,
    strength,
    rules,
    errors
  };
}
