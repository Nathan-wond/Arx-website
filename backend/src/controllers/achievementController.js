
import { db } from '../services/db.js';

export const achievementController = {
  getAchievements(req, res) {
    const { category } = req.query;
    let achievements = db.getAchievements();

    if (category && typeof category === 'string' && category !== 'All') {
      achievements = achievements.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }

    res.json({ achievements });
  }
};