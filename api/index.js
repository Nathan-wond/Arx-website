import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from '../backend/src/routes/index.js';
import { verifyToken } from '../backend/src/utils/jwtUtils.js';
import { db } from '../backend/src/services/db.js';
import { syncTelegramBotCommands } from '../backend/src/controllers/telegramController.js';

// Run bot description + command sync in background after cold start
// This ensures the Telegram bot always has the correct website URL in its description
setTimeout(() => {
  syncTelegramBotCommands().then(r => {
    console.log('[Startup] Telegram bot sync:', r.message || r);
  }).catch(err => {
    console.debug('[Startup] Telegram bot sync skipped:', err?.message);
  });
}, 3000);


process.on('unhandledRejection', (reason) => {
  console.error('[API Serverless Unhandled Promise Rejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[API Serverless Uncaught Exception]', err);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ALLOWED_ORIGINS_API = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean) : []),
  ...(process.env.APP_URL ? [process.env.APP_URL.trim().replace(/\/$/, '')] : [])
];

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      ALLOWED_ORIGINS_API.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(async (_req, _res, next) => {
  try {
    if (typeof db.ensureInitialized === 'function') {
      await db.ensureInitialized();
    }
  } catch (err) {
    console.error('[DB Global Middleware Error]', err);
  }
  next();
});

// Hardened Security Headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://api.telegram.org",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  );
  next();
});

const uploadsDir = path.resolve(__dirname, '../uploads');
// Security: deny direct static access to confidential documents, assignments, and certificates
app.get(['/uploads/awards/*', '/uploads/student-projects/*', '/uploads/submissions/*', '/uploads/certificates/*'], (_req, res) => {
  res.status(403).json({
    error: 'Access denied. Confidential documents, assignments, and certificates are accessible only via authorized endpoints.'
  });
});
app.use('/uploads', express.static(uploadsDir));

function adminViewGuard(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)(?:arx_session|itclub_auth_token)=([^;]*)/);
    if (match) token = decodeURIComponent(match[1]);
  }

  if (!token) {
    if (req.accepts('html')) {
      return res.redirect('/71354caa6bea2251/login');
    }
    return res.status(401).json({ success: false, error: 'Authentication required. Administrator privileges required.' });
  }

  const payload = verifyToken(token);
  if (!payload || !payload.id) {
    if (req.accepts('html')) {
      return res.redirect('/71354caa6bea2251/login');
    }
    return res.status(401).json({ success: false, error: 'Invalid or expired session. Please log in again.' });
  }

  const member = db.findMemberById(payload.id);
  if (!member || (member.role !== 'admin' && member.role !== 'president') || member.status === 'suspended') {
    if (req.accepts('html')) {
      return res.status(403).send('Forbidden: Administrator privileges required.');
    }
    return res.status(403).json({ success: false, error: 'Access denied. Administrator privileges required.' });
  }

  req.user = { ...payload, role: member.role };
  next();
}

function presidentViewGuard(req, res, next) {
  adminViewGuard(req, res, () => {
    if (req.user?.role !== 'president') {
      if (req.accepts('html')) {
        return res.status(403).send('Forbidden: President Executive Clearance Required.');
      }
      return res.status(403).json({ success: false, error: 'Access denied. President clearance required.' });
    }
    next();
  });
}

app.get(['/admin-applications.html', '/71354caa6bea2251/applications'], adminViewGuard, (_req, res) => {
  res.sendFile(path.resolve(__dirname, '../private_views', 'admin-applications.html'));
});

app.use('/api', apiRouter);
app.use('/', apiRouter);

app.use((err, _req, res, _next) => {
  console.error('[API Serverless Error]', err);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    success: false,
    error: isProduction ? 'An unexpected serverless error occurred. Please try again later.' : (err.message || 'Internal Server Error')
  });
});

export default app;
