import { Router } from 'express';
import { certificateController } from '../controllers/certificateController.js';

const router = Router();

router.get('/verify/:certificateId', certificateController.verify);
router.get('/:id/download', certificateController.download);
router.get('/download/:id', certificateController.download);
router.get('/:id', certificateController.getById);

export default router;
