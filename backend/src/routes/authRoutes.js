import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

const loginLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many login attempts from this address. Please wait a minute and try again.'
});

const registerLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: 'Too many registration requests. Please wait a few minutes and try again.'
});

const activateLimiter = createRateLimiter({
  windowMs: 2 * 60 * 1000,
  max: 8,
  message: 'Too many activation attempts. Please wait two minutes before trying again.'
});

const forgotPasswordLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests. Please wait a few minutes and try again.'
});

const adminLoginLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: 'Too many administrative login attempts. Please wait 5 minutes before trying again.'
});

router.post('/register', registerLimiter, authController.register);
router.get('/check-telegram-username', authController.checkTelegramUsername);
router.get('/check-email', authController.checkEmail);
router.post('/login', loginLimiter, authController.login);
router.post('/admin-login', adminLoginLimiter, authController.adminLogin);

router.post('/activate', activateLimiter, authController.activateAccount);

router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.me);

router.post('/forgot-password/request', forgotPasswordLimiter, authController.forgotPasswordRequest);
router.post('/forgot-password/verify-code', forgotPasswordLimiter, authController.forgotPasswordVerifyCode);
router.post('/forgot-password/reset', forgotPasswordLimiter, authController.forgotPasswordReset);

export default router;
