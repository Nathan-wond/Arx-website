import { Router } from 'express';
import { achievementController } from '../controllers/achievementController.js';

const router = Router();
router.get('/', achievementController.getAchievements);

export default router;