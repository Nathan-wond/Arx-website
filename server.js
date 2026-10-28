import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './backend/src/routes/index.js';
import { CONFIG } from './backend/src/config/index.js';
import { startTelegramLongPolling } from './backend/src/controllers/telegramController.js';
import { verifyToken } from './backend/src/utils/jwtUtils.js';
import { db } from './backend/src/services/db.js';
import { startNgrokTunnel } from './backend/src/utils/ngrokHelper.js';

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Promise Rejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Process Exception]', err);
});

let cors = null;
try {
  cors = (await import('cors')).default;
} catch {
  console.warn('[Server] cors package not found. Install with: npm install cors');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const portArgIndex = process.argv.indexOf('--port');
  const portFromArg = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? parseInt(process.argv[portArgIndex + 1], 10) : null;
  const PORT = portFromArg || (process.env.PORT && process.env.PORT !== '8080' ? parseInt(process.env.PORT, 10) : 3000);
  const isProduction = process.env.NODE_ENV === 'production';

  
  app.set('trust proxy', 1);

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

  
  
  
  if (cors) {
    let allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];
    if (process.env.ALLOWED_ORIGINS) {
      allowedOrigins = allowedOrigins.concat(
        process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
      );
    }
    if (CONFIG.APP_URL) {
      allowedOrigins.push(CONFIG.APP_URL);
    }

    app.use(cors({
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          // Allow all ngrok tunnel domains
          origin.endsWith('.ngrok.io') ||
          origin.endsWith('.ngrok-free.app') ||
          origin.endsWith('.ngrok-free.dev') ||
          origin.endsWith('.ngrok.app') ||
          origin.endsWith('.ngrok.com')
        ) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'X-Requested-With', 'Accept']
    }));
  }

  // Request size limits (protect against oversized payloads)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging for debugging Vercel → ngrok → backend flow
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
    next();
  });

  
  const uploadsDir = path.resolve(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  
  
  // Security: deny direct static access to sensitive documents (awards, student projects, submissions, internal certificates)
  app.get(['/uploads/awards/*', '/uploads/student-projects/*', '/uploads/submissions/*', '/uploads/certificates/*'], (_req, res) => {
    res.status(403).json({
      error: 'Access denied. Confidential documents, assignments, and certificates are accessible only via authorized endpoints.'
    });
  });

  app.use('/uploads', express.static(uploadsDir));
  app.use(express.static(path.resolve(__dirname, 'public')));

  
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

  // Server-side guarded admin application views
  app.get(['/admin-applications.html', '/71354caa6bea2251/applications'], adminViewGuard, (_req, res) => {
    res.redirect('/71354caa6bea2251/dashboard');
  });

  app.get('/dashboard.html', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'dashboard.html'));
  });
  app.get('/application-status.html', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'application-status.html'));
  });

  app.use('/api', apiRouter);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const tailwindcss = (await import('@tailwindcss/vite')).default;
    const vite = await createViteServer({
      configFile: false,
      plugins: [tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.')
        }
      },
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.use((err, _req, res, _next) => {
    console.error('[Server Error]', err);
    res.status(err.status || 500).json({
      success: false,
      error: isProduction ? 'An unexpected server error occurred. Please try again later.' : (err.message || 'Internal Server Error')
    });
  });

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`\n🚀 IT Club server running at http://0.0.0.0:${PORT}`);
    console.log(`🤖 Telegram Bot Target: @${CONFIG.TELEGRAM_BOT_USERNAME} (${CONFIG.TELEGRAM_BOT_URL})`);
    console.log(`📢 Preserved Official Channel: ${CONFIG.TELEGRAM_CHANNEL_HANDLE}`);
    console.log(`🔒 Telegram Bot API Token: ${CONFIG.TELEGRAM_BOT_TOKEN ? '[CONFIGURED]' : '[NOT CONFIGURED in environment]'}`);
    console.log(`🌐 Deployed Base URL: ${CONFIG.APP_URL || 'Not specified'}`);

    // Database persistence mode
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL || '';
    if (mongoUri && (mongoUri.startsWith('mongodb://') || mongoUri.startsWith('mongodb+srv://'))) {
      const isLocal = mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1');
      if (isLocal) {
        console.log(`🍃 Database: MongoDB (LOCAL - not suitable for production)`);
      } else {
        console.log(`🍃 Database: MongoDB Atlas (CLOUD - production ready)`);
      }
    } else if (isProduction) {
      console.error(`❌ CRITICAL: Production requires MongoDB Atlas but MONGODB_URI not configured!`);
      console.error(`   Set MONGODB_URI environment variable with MongoDB Atlas connection string.`);
    } else {
      console.log(`🍃 Database: Local JSON file (development fallback - data will not persist in production)`);
    }

    // Auto-start ngrok tunnel in development
    if (!isProduction) {
      const ngrokUrl = await startNgrokTunnel(PORT).catch(() => null);
      if (ngrokUrl) {
        // Optionally update the in-memory CONFIG.APP_URL for Telegram webhook usage
        process.env.NGROK_PUBLIC_URL = ngrokUrl;
      }
    }

    
    
    
    if (CONFIG.TELEGRAM_BOT_TOKEN) {
      const isCustomProductionWebhook =
        process.env.TELEGRAM_DELIVERY_MODE === 'webhook' &&
        CONFIG.APP_URL &&
        CONFIG.APP_URL.startsWith('https://') &&
        !CONFIG.APP_URL.includes('.run.app') &&
        !CONFIG.APP_URL.includes('localhost') &&
        !CONFIG.APP_URL.includes('127.0.0.1');

      if (isCustomProductionWebhook) {
        const webhookUrl = `${CONFIG.APP_URL}/api/telegram/webhook`;
        fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/getWebhookInfo`).
          then((r) => r.json()).
          then((info) => {
            if (info.ok) {
              console.log(`[Telegram Webhook Check] Current Telegram Webhook URL: "${info.result?.url}"`);
              if (info.result?.url !== webhookUrl) {
                console.log(`[Telegram Webhook Sync] Updating webhook registration to ${webhookUrl}...`);
                fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/setWebhook`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    url: webhookUrl,
                    secret_token: CONFIG.TELEGRAM_WEBHOOK_SECRET,
                    allowed_updates: ['message', 'callback_query'],
                    drop_pending_updates: false
                  })
                }).
                  then((r) => r.json()).
                  then((res) => {
                    console.log(`[Telegram Webhook Sync] Registration result: ${res.ok ? 'SUCCESS' : res.description}`);
                  }).
                  catch((e) => console.warn(`[Telegram Webhook Sync] Could not register webhook:`, e.message));
              } else {
                console.log(`[Telegram Webhook Check] Webhook is already synchronized.`);
              }
            }
          }).
          catch((e) => console.warn(`[Telegram Webhook Check] Could not verify webhook on boot:`, e.message));
      } else {
        console.log(`[Telegram Bot Engine] Starting Authoritative Long Polling Engine for @${CONFIG.TELEGRAM_BOT_USERNAME}...`);
        startTelegramLongPolling().catch((e) => {
          console.warn(`[Telegram Polling Engine] Failed to start long polling:`, e.message);
        });
      }
    } else {
      console.log(`[Telegram Bot Engine] TELEGRAM_BOT_TOKEN not configured. Set TELEGRAM_BOT_TOKEN in server environment to connect live Telegram.`);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
