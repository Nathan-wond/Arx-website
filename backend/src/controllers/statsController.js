
import { db } from '../services/db.js';

export const statsController = {
  getStats(_req, res) {
    const stats = db.getClubStats();
    res.json({ stats });
  }
};