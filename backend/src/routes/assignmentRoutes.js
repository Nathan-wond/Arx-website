import { Router } from 'express';
import { assignmentController } from '../controllers/assignmentController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authMiddleware, assignmentController.getMemberAssignments);
router.get('/submissions/my', authMiddleware, assignmentController.getMySubmissions);
router.get('/:id', authMiddleware, assignmentController.getAssignmentById);
router.post('/:id/submit', authMiddleware, assignmentController.submitAssignment);
router.get('/submissions/:subId/download', authMiddleware, assignmentController.downloadSubmission);

router.get('/admin/all', adminMiddleware, assignmentController.getAllAdmin);
router.post('/admin', adminMiddleware, assignmentController.createAssignment);
router.post('/', adminMiddleware, assignmentController.createAssignment);
router.put('/admin/:id', adminMiddleware, assignmentController.updateAssignment);
router.delete('/admin/:id', authMiddleware, adminMiddleware, assignmentController.deleteAssignment);
router.get('/admin/:id/submissions', authMiddleware, adminMiddleware, assignmentController.getAssignmentSubmissions);
router.put('/admin/submissions/:subId', authMiddleware, adminMiddleware, assignmentController.gradeSubmission);

export default router;
