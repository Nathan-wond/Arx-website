import { Router } from 'express';
import { telegramController } from '../controllers/telegramController.js';
import { adminMiddleware } from '../middleware/authMiddleware.js';
import { createRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

const botRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many Telegram bot requests. Please wait a moment.'
});

const channelVerifyLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many channel verification attempts. Please wait a moment.'
});

router.get('/config', telegramController.getConfig);

router.get('/broadcasts', telegramController.getBroadcasts);
router.post('/broadcasts/:id/react', telegramController.reactToBroadcast);

router.post('/bot', botRateLimiter, telegramController.handleBotCommand);

router.get('/activation-session/:token', botRateLimiter, telegramController.getActivationSession);

router.post('/verify-channel', channelVerifyLimiter, telegramController.verifyChannelMembership);

// Telegram incoming Webhook (authenticated via secret token header)
router.post('/webhook', telegramController.handleWebhook);

// Protected Admin Operations
router.get('/webhook-info', adminMiddleware, telegramController.getWebhookInfo);
router.post('/sync-webhook', adminMiddleware, telegramController.syncWebhook);
router.post('/simulate-update', adminMiddleware, telegramController.simulateUpdate);

export default router;
