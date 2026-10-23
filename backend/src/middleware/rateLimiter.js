/**
 * Rate Limiting Middleware
 * Protects authentication and sensitive endpoints from abuse
 */
import rateLimit from 'express-rate-limit';

// Strict rate limiter for login attempts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: 'Too many login attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Rate limiter for registration
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    success: false,
    error: 'Too many registration attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for 2FA verification
export const twoFaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: 'Too many 2FA verification attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: 'Too many requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limiter for sensitive admin operations
export const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 requests per 5 minutes
  message: {
    success: false,
    error: 'Too many requests. Please wait a moment.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
