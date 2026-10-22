import { Router } from 'express';
import { memberController } from '../controllers/memberController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/profile', authMiddleware, memberController.getProfile);
router.put('/profile', authMiddleware, memberController.updateProfile);
router.post('/change-password', authMiddleware, memberController.changePassword);

router.get('/courses', authMiddleware, memberController.getCourses);
router.get('/certificates', authMiddleware, memberController.getCertificates);
router.get('/awards', authMiddleware, memberController.getAwards);
router.get('/projects', authMiddleware, memberController.getProjects);
router.get('/dashboard-summary', authMiddleware, memberController.getDashboardSummary);

router.get('/activation', authMiddleware, memberController.getActivationStatus);
router.post('/activation/generate', authMiddleware, memberController.generateActivationLink);

export default router;
