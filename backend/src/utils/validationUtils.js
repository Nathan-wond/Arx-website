const RESERVED_TELEGRAM_USERNAMES = new Set([
'arxitclub',
'arxitclub_bot',
'admin',
'administrator',
'root',
'support',
'help',
'telegram',
'arx',
'arx_bot',
'arxit',
'arx_admin',
'arx_it_club',
'bot',
'channel',
'moderator',
'staff',
'official',
'security']
);

const MEANINGLESS_PATTERNS = [
/^qwerty/i,
/^asdfgh/i,
/^zxcvbn/i,
/^12345/i,
/^test$/i,
/^demo$/i,
/^fake$/i,
/^sample$/i,
/^unknown$/i,
/^nobody$/i,
/^asdf/i,
/^qwer/i,
/^zxcv/i,
/^hjkl/i,
/^xxxx/i,
/^aaaa/i,
/^bbbb/i,
/^cccc/i,
/^dddd/i,
/^zzzz/i,
/^null$/i,
/^undefined$/i,
/^true$/i,
/^false$/i,
/^string$/i,
/^object$/i];

export function validatePersonName(
rawName,
fieldName = 'Name')
{
  if (!rawName || typeof rawName !== 'string') {
    return { valid: false, normalized: '', error: `Please enter your ${fieldName}.` };
  }

  const trimmed = rawName.trim().replace(/\s+/g, ' ');

  if (trimmed.length < 2) {
    return { valid: false, normalized: '', error: `${fieldName} must be at least 2 characters long.` };
  }

  if (trimmed.length > 40) {
    return { valid: false, normalized: '', error: `${fieldName} cannot exceed 40 characters.` };
  }

  
  if (/[@#$%^&*+=[\]{}|\\/<>?:;~`]/.test(trimmed)) {
    return { valid: false, normalized: '', error: `${fieldName} contains invalid special characters.` };
  }

  if (/\d/.test(trimmed)) {
    return { valid: false, normalized: '', error: `${fieldName} cannot contain numbers.` };
  }

  if (/https?:\/\/|www\./i.test(trimmed)) {
    return { valid: false, normalized: '', error: `${fieldName} cannot contain web links.` };
  }

  // 3 or more identical characters in a row (e.g. "xxx", "aaaa")
  if (/(.)\1{2,}/i.test(trimmed)) {
    return { valid: false, normalized: '', error: `Please enter a valid ${fieldName.toLowerCase()} without repeated characters.` };
  }

  // Check against known meaningless spam patterns
  const lower = trimmed.toLowerCase();
  for (const pattern of MEANINGLESS_PATTERNS) {
    if (pattern.test(lower)) {
      return { valid: false, normalized: '', error: `Please enter a legitimate, valid ${fieldName.toLowerCase()}.` };
    }
  }

  // Validate allowed characters:
  // - Latin letters: a-z, A-Z
  // - Ethiopic/Amharic script: \u1200-\u137F
  // - Punctuation: space, hyphen (-), apostrophe (' or ’)
  const allowedCharRegex = /^[a-zA-Z\u1200-\u137F\s\-''’]+$/;
  if (!allowedCharRegex.test(trimmed)) {
    return {
      valid: false,
      normalized: '',
      error: `${fieldName} contains unsupported characters. Please use Latin or Amharic letters.`
    };
  }

  // If name is predominantly Latin (contains at least one Latin char), ensure it contains at least one vowel
  // to avoid consonant mashing like "bcdfgh", "wrtsdf"
  const hasLatin = /[a-zA-Z]/.test(trimmed);
  const hasAmharic = /[\u1200-\u137F]/.test(trimmed);

  if (hasLatin && !hasAmharic && trimmed.length >= 3) {
    const hasVowel = /[aeiouyAEIOUY]/.test(trimmed);
    if (!hasVowel) {
      return {
        valid: false,
        normalized: '',
        error: `Please enter a valid ${fieldName.toLowerCase()} (vowels missing).`
      };
    }
  }

  // Normalize casing for Latin words (First letter uppercase, rest lowercase)
  const normalized = trimmed.
  split(' ').
  map((word) => {
    if (word.length === 0) return '';
    if (/^[a-zA-Z]/.test(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word; // Preserves Amharic or hyphenated characters
  }).
  join(' ');

  return { valid: true, normalized };
}

/**
 * Validates Telegram username according to Requirement 3:
 * STEP 1: Format validation (5-32 chars, starts with letter, a-z0-9_, no double underscore, no trailing underscore)
 * STEP 2: ARX account check (cannot match an existing registered member)
 * STEP 3: Reserved username check (cannot use system or administrative handles)
 * STEP 4: Real Telegram verification (normalized handle stored for bot verification)
 */
export function validateTelegramUsername(
rawUsername,
existingUsernames)
{
  if (!rawUsername || typeof rawUsername !== 'string') {
    return {
      valid: false,
      normalized: '',
      error: 'Please provide your Telegram username (e.g. @username) for official bot linking.'
    };
  }

  // Strip leading @, whitespace, URL prefixes if pasted
  let clean = rawUsername.
  trim().
  replace(/^https?:\/\/t\.me\//i, '').
  replace(/^@+/, '').
  trim();

  // STEP 1 — FORMAT VALIDATION
  if (clean.length < 5) {
    return {
      valid: false,
      normalized: '',
      error: 'Telegram username must be at least 5 characters long.'
    };
  }

  if (clean.length > 32) {
    return {
      valid: false,
      normalized: '',
      error: 'Telegram username cannot exceed 32 characters.'
    };
  }

  // Telegram usernames must start with a letter (a-z)
  if (!/^[a-zA-Z]/.test(clean)) {
    return {
      valid: false,
      normalized: '',
      error: 'Telegram username must start with a letter (a-z).'
    };
  }

  // Allowed characters: letters, numbers, and underscores
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return {
      valid: false,
      normalized: '',
      error: 'Telegram username can only contain letters (a-z), numbers (0-9), and underscores (_).'
    };
  }

  // Cannot end with underscore
  if (clean.endsWith('_')) {
    return {
      valid: false,
      normalized: '',
      error: 'Telegram username cannot end with an underscore (_).'
    };
  }

  // Cannot have consecutive underscores
  if (/__/.test(clean)) {
    return {
      valid: false,
      normalized: '',
      error: 'Telegram username cannot contain consecutive underscores (__).'
    };
  }

  const cleanLower = clean.toLowerCase();

  // STEP 3 — RESERVED USERNAME CHECK
  if (RESERVED_TELEGRAM_USERNAMES.has(cleanLower)) {
    return {
      valid: false,
      normalized: '',
      error: `The Telegram username "@${clean}" is reserved by club administration and cannot be registered.`
    };
  }

  // STEP 2 — ARX ACCOUNT CHECK
  if (existingUsernames && existingUsernames.has(cleanLower)) {
    return {
      valid: false,
      normalized: '',
      error: 'This Telegram username is already registered with ARX IT Club.'
    };
  }

  return { valid: true, normalized: `@${clean}`, username: cleanLower };
}

/**
 * Strict, normalized word counter following Section 1 rules:
 * - Trim leading and trailing whitespace
 * - Normalize spaces, tabs, and newlines
 * - Count non-empty words, not spaces
 * - Multiple spaces do not inflate the count
 * - Empty text counts as zero words
 */
export function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Email format validation and normalization
 * Supports optional empty values without false conflict
 */
export function validateEmail(rawEmail, existingEmails) {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return { valid: true, empty: true, normalized: '' };
  }
  const clean = rawEmail.trim().toLowerCase();
  if (clean.length === 0) {
    return { valid: true, empty: true, normalized: '' };
  }

  // RFC 5322 compatible regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean) || clean.length > 254) {
    return {
      valid: false,
      empty: false,
      normalized: clean,
      error: 'Please enter a valid email address (e.g. name@example.com).'
    };
  }

  if (existingEmails && existingEmails.has(clean)) {
    return {
      valid: false,
      empty: false,
      normalized: clean,
      error: 'This email address is already registered with ARX IT Club.'
    };
  }

  return { valid: true, empty: false, normalized: clean };
}

