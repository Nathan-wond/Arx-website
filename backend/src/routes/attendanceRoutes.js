import { Router } from 'express';
import { attendanceController } from '../controllers/attendanceController.js';
import { authMiddleware, optionalAuthMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import { createRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

const checkInLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many attendance submissions. Please wait a minute and try again.'
});

// Member Self-Service Routes
router.post('/check-in', checkInLimiter, optionalAuthMiddleware, attendanceController.checkIn);
router.get('/status', optionalAuthMiddleware, attendanceController.getStatus);
router.get('/available-sessions', optionalAuthMiddleware, attendanceController.getAvailableSessions);
router.get('/my-history', authMiddleware, attendanceController.getMyHistory);

// Administrative Attendance Sessions & Finalization
router.get('/admin/sessions', authMiddleware, adminMiddleware, attendanceController.getAdminSessions);
router.post('/admin/sessions', authMiddleware, adminMiddleware, attendanceController.createAdminSession);
router.put('/admin/sessions/:id', authMiddleware, adminMiddleware, attendanceController.updateAdminSession);
router.delete('/admin/sessions/:id', authMiddleware, adminMiddleware, attendanceController.deleteAdminSession);
router.get('/admin/sessions/:id/unsubmitted', authMiddleware, adminMiddleware, attendanceController.getUnsubmittedMembers);
router.post('/admin/sessions/:id/finalize-absences', authMiddleware, adminMiddleware, attendanceController.finalizeAbsences);

// Administrative Attendance Records Review & Overrides
router.get('/admin/records', authMiddleware, adminMiddleware, attendanceController.getAll);
router.patch('/admin/records/:id/review', authMiddleware, adminMiddleware, attendanceController.reviewRecord);
router.patch('/admin/records/:id/correct', authMiddleware, adminMiddleware, attendanceController.correctRecord);
router.post('/admin/manual', authMiddleware, adminMiddleware, attendanceController.createManual);
router.delete('/admin/records/:id', authMiddleware, adminMiddleware, attendanceController.deleteRecord);

// Legacy configuration compatibility
router.get('/admin/configs', authMiddleware, adminMiddleware, attendanceController.getConfigs);
router.put('/admin/configs', authMiddleware, adminMiddleware, attendanceController.updateConfigs);

export default router;
