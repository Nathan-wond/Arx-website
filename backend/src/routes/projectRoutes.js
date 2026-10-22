import { Router } from 'express';
import { projectController } from '../controllers/projectController.js';

const router = Router();
router.get('/', projectController.getProjects);

export default router;