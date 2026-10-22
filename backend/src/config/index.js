import 'dotenv/config';
import fs from 'fs';
import path from 'path';

function sanitizeTelegramHandle(raw, defaultHandle = 'ARXITCLUB_bot') {
  if (!raw) return defaultHandle;
  return raw.replace(/^https?:\/\/t\.me\//i, '').replace(/^@+/, '').trim() || defaultHandle;
}

const rawBot = process.env.TELEGRAM_BOT_USERNAME || 'ARXITCLUB_bot';
const botUsername = sanitizeTelegramHandle(rawBot, 'ARXITCLUB_bot');

const rawChannel = process.env.TELEGRAM_CHANNEL_USERNAME || 'arxitclub';
const channelUsername = sanitizeTelegramHandle(rawChannel, 'arxitclub');

function resolveSecret(name, fallback = '') {
  const val = (process.env[name] || '').trim();
  if (val) return val;
  if (fallback) return fallback;
  // In production, missing secrets are a critical security issue
  if (process.env.NODE_ENV === 'production') {
    console.error(`[Config CRITICAL] Missing required environment variable: ${name}. This is a security risk. The server may not function securely without it.`);
  } else {
    console.warn(`[Config Warning] Missing environment variable: ${name}. Ensure it is set in production.`);
  }
  return '';
}

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  APP_URL: (process.env.APP_URL || '').trim().replace(/\/$/, ''),
  
  JWT_SECRET: resolveSecret('JWT_SECRET'),
  TOKEN_EXPIRY_SECONDS: 7 * 24 * 60 * 60, 

  // Legacy password fields (used only for first-run bootstrap)
  ADMIN_PASSWORD    : (process.env.INITIAL_ADMIN_PASSWORD     || process.env.ADMIN_PASSWORD     || '').trim(),
  PRESIDENT_PASSWORD: (process.env.INITIAL_PRESIDENT_PASSWORD || process.env.PRESIDENT_PASSWORD || '').trim(),
  PRESIDENT_USERNAME: (process.env.INITIAL_PRESIDENT_USERNAME || process.env.PRESIDENT_USERNAME || 'NEXORA').trim(),

  // Gmail SMTP (2FA OTP delivery) — explicit transport config
  SMTP_HOST    : (process.env.SMTP_HOST   || 'smtp.gmail.com').trim(),
  SMTP_PORT    : parseInt(process.env.SMTP_PORT || '465', 10),
  SMTP_SECURE  : (process.env.SMTP_SECURE || 'true').trim().toLowerCase() !== 'false',
  SMTP_USER    : (process.env.SMTP_USER   || '').trim(),
  SMTP_PASS    : (process.env.SMTP_PASS   || '').trim(),
  EMAIL_FROM   : (process.env.EMAIL_FROM  || '').trim(),
  PRESIDENTIAL_ADMIN_EMAIL: (process.env.PRESIDENTIAL_ADMIN_EMAIL || '').trim(),

  // Club identity
  CLUB_NAME: (process.env.CLUB_NAME || 'ARX IT CLUB').trim(),
  
  TELEGRAM_BOT_USERNAME: botUsername,
  TELEGRAM_BOT_DISPLAY_NAME: 'ARX IT CLUB Official Bot',
  TELEGRAM_BOT_URL: `https://t.me/${botUsername}`,
  
  TELEGRAM_CHANNEL_USERNAME: channelUsername,
  TELEGRAM_CHANNEL_HANDLE: `@${channelUsername}`,
  TELEGRAM_CHANNEL_LINK: `https://t.me/${channelUsername}`,
  
  TELEGRAM_BOT_TOKEN: (process.env.TELEGRAM_BOT_TOKEN || '').trim(),
  
  DATABASE_URL: (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '').trim(),
  TELEGRAM_WEBHOOK_SECRET: resolveSecret('TELEGRAM_WEBHOOK_SECRET'),
  CLUB_TAGLINE: 'Learn. Build. Grow.',
  AUTHORITY_SIGNER: 'ARX IT CLUB Academic Council',
  AUTHORITY_PRESIDENT: 'ARX IT CLUB President'
};

export function persistTelegramBotToken(newToken) {
  const cleanToken = (newToken || '').trim();
  CONFIG.TELEGRAM_BOT_TOKEN = cleanToken;
  process.env.TELEGRAM_BOT_TOKEN = cleanToken;
  console.log(`[Config] TELEGRAM_BOT_TOKEN updated in-memory (${cleanToken ? 'configured' : 'cleared'}). Redeploy to persist permanently.`);
}

export function setBotIdentity(username, displayName) {
  const cleanUsername = sanitizeTelegramHandle(username, CONFIG.TELEGRAM_BOT_USERNAME);
  CONFIG.TELEGRAM_BOT_USERNAME = cleanUsername;
  CONFIG.TELEGRAM_BOT_URL = `https://t.me/${cleanUsername}`;
  if (displayName) {
    CONFIG.TELEGRAM_BOT_DISPLAY_NAME = displayName;
  }
}
