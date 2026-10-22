
import { db } from '../services/db.js';

export const projectController = {
  getProjects(req, res) {
    const { status, category } = req.query;
    let projects = db.getProjects();

    if (status && typeof status === 'string' && status !== 'All') {
      projects = projects.filter((p) => (p.status || '').toLowerCase() === status.toLowerCase());
    }

    if (category && typeof category === 'string' && category !== 'All') {
      projects = projects.filter((p) => (p.category || '').toLowerCase() === category.toLowerCase());
    }

    res.json({ projects });
  }
};