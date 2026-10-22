export function escapeHtml(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Strips all HTML tags from a string, leaving only text content.
 * Useful for fields that should never contain markup (names, bio, etc.).
 *
 * @param {unknown} value
 * @returns {string|unknown}
 */
export function stripTags(value) {
  if (typeof value !== 'string') return value;
  // Remove everything that looks like an HTML tag
  return value.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitizes a plain-text field: strips tags then trims whitespace.
 * Use this for names, bio text, descriptions, and any field that will be
 * stored and returned as plain text.
 *
 * @param {unknown} value
 * @returns {string|unknown}
 */
export function sanitizeText(value) {
  if (typeof value !== 'string') return value;
  return stripTags(value).replace(/\s+/g, ' ').trim();
}

/**
 * Sanitizes a URL string.
 * - Strips surrounding whitespace.
 * - Rejects javascript: and data: URI schemes which can execute code.
 * - Returns an empty string if the value is unsafe.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function sanitizeUrl(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  // Block dangerous URI schemes
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return '';
  }
  return trimmed;
}

/**
 * Sanitizes an object's string fields recursively (one level deep).
 * Applies sanitizeText to every string property.
 * Useful for sanitizing entire request body objects at controller entry points.
 *
 * @param {Record<string, unknown>} obj
 * @returns {Record<string, unknown>}
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      result[key] = sanitizeText(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}
