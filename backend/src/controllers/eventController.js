
import { db } from '../services/db.js';
import {} from '../middleware/authMiddleware.js';

export const eventController = {
  getEvents(req, res) {
    const { status } = req.query;
    let events = db.getEvents();

    if (status && typeof status === 'string' && status !== 'All') {
      const lowerReq = status.toLowerCase();
      events = events.filter((e) => {
        const evStatus = (e.status || '').toLowerCase();
        if (lowerReq === 'upcoming') {
          return evStatus === 'upcoming' || evStatus === 'ongoing' || !evStatus;
        }
        if (lowerReq === 'past') {
          return evStatus === 'past' || evStatus === 'completed';
        }
        return evStatus === lowerReq;
      });
    }

    res.json({ events });
  },

  register(req, res) {
    const { id } = req.params;
    const memberId = req.user ? req.user.id : req.body.memberId;

    if (!memberId) {
      res.status(400).json({ error: 'Member identification is required to register for an event.' });
      return;
    }

    const result = db.registerForEvent(id, memberId);
    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json(result);
  }
};