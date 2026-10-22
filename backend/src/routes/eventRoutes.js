import { Router } from 'express';
import { eventController } from '../controllers/eventController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', eventController.getEvents);

router.post('/:id/register', (req, res, next) => {
  if (req.headers.authorization) {
    return authMiddleware(req, res, next);
  }
  next();
}, eventController.register);

export default router;
