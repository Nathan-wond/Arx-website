
import { db } from '../services/db.js';
import {} from '../middleware/authMiddleware.js';

export const courseController = {
  getCourses(req, res) {
    const { category, search, forRegistration } = req.query;
    let courses = forRegistration === 'true' ? db.getRegistrationCourses() : db.getCourses();

    if (category && typeof category === 'string' && category !== 'All') {
      courses = courses.filter((c) => c.category.toLowerCase() === category.toLowerCase());
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      courses = courses.filter(
        (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q)
      );
    }

    res.json({ courses });
  },

  getCourseById(req, res) {
    const { id } = req.params;
    const course = db.getCourseById(id);

    if (!course) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }

    res.json({ course });
  },

  enroll(req, res) {
    if (!req.user) {
      res.status(401).json({ error: 'Please log in to enroll in courses.' });
      return;
    }

    const { id } = req.params;
    const course = db.getCourseById(id);

    if (!course) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }

    if (course.status === 'Coming Soon') {
      res.status(400).json({ error: 'This course is coming soon and enrollment is not open yet.' });
      return;
    }

    const enrollment = db.enrollMemberInCourse(req.user.id, course.id);
    res.json({
      success: true,
      message: `Enrolled in ${course.title} successfully!`,
      enrollment
    });
  }
};