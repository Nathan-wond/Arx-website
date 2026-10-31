import { Router } from 'express';
import authRoutes from './authRoutes.js';
import twoFaRoutes from './twoFaRoutes.js';
import scopedRoutes from './scopedRoutes.js';
import memberRoutes from './memberRoutes.js';
import courseRoutes from './courseRoutes.js';
import certificateRoutes from './certificateRoutes.js';
import projectRoutes from './projectRoutes.js';
import eventRoutes from './eventRoutes.js';
import achievementRoutes from './achievementRoutes.js';
import statsRoutes from './statsRoutes.js';
import adminRoutes from './adminRoutes.js';
import telegramRoutes from './telegramRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import assignmentRoutes from './assignmentRoutes.js';
import { db } from '../services/db.js';

const apiRouter = Router();

apiRouter.use(async (_req, _res, next) => {
  try {
    if (typeof db.ensureInitialized === 'function') {
      await db.ensureInitialized();
    }
  } catch (err) {
    console.error('[DB] ensureInitialized middleware error:', err);
    res.status(503).json({
      success: false,
      error: 'The application database is unavailable. Please try again later.'
    });
    return;
  }
  next();
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/auth', twoFaRoutes);       // 2FA + staff management routes (merged under /auth)
apiRouter.use('/scoped', scopedRoutes);    // RBAC-scoped student data routes
apiRouter.use('/members', memberRoutes);
apiRouter.use('/courses', courseRoutes);
apiRouter.use('/certificates', certificateRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/events', eventRoutes);
apiRouter.use('/achievements', achievementRoutes);
apiRouter.use('/stats', statsRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/telegram', telegramRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/assignments', assignmentRoutes);

apiRouter.get('/settings', (_req, res) => {
  const settings = db.getSettings();
  // Never expose the admin URL to unauthenticated public clients
  const { adminUrl, ...publicSettings } = settings;
  res.json({ settings: publicSettings });
});

apiRouter.get('/social-links', (_req, res) => {
  const socialLinks = db.getPublicSocialLinks();
  res.json({ socialLinks });
});

apiRouter.get(['/governance', '/team'], (req, res) => {
  const category = req.query.category;
  const governance = db.getGovernanceRoles(true, category);
  res.json({ governance, team: governance });
});

apiRouter.get('/resources', (_req, res) => {
  const resources = db.getClubResources();
  res.json({ resources });
});

apiRouter.get('/announcements', (_req, res) => {
  const announcements = db.getAnnouncements(true);
  res.json({ announcements });
});

apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'IT Club API Server',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

apiRouter.use((err, _req, res, _next) => {
  console.error('[API Router Error]', err);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    success: false,
    error: isProduction ? 'An internal API error occurred. Please try again later.' : (err.message || 'Internal API Error')
  });
});

export default apiRouter;
