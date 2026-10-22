import { Router } from 'express';
import { courseController } from '../controllers/courseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourseById);
router.post('/:id/enroll', authMiddleware, courseController.enroll);

export default router;