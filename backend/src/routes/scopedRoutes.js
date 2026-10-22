/**
 * Scoped Student Data Routes
 *
 * GET  /api/scoped/students              → list students scoped to requester's courses
 * GET  /api/scoped/students/:studentId   → single student (scoped)
 * GET  /api/scoped/courses               → list courses visible to requester
 * GET  /api/scoped/courses/:courseId/students → students in one specific course (scoped)
 */
import { Router } from 'express';
import { authMiddleware, require2fa, presidentMiddleware, staffMiddleware, scopedCourseMiddleware, ROLES } from '../middleware/authMiddleware.js';
import { db } from '../services/db.js';
import { createRateLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

const scopedRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max     : 60,
  message : 'Too many requests. Please slow down.'
});

// All scoped routes require valid session + 2FA for admin-tier users
router.use(authMiddleware, require2fa, scopedRateLimiter);

// ---------------------------------------------------------------------------
// Helper: extract safe student fields (never expose passwordHash etc.)
// ---------------------------------------------------------------------------
function safeStudent(member) {
  return {
    id               : member.id,
    memberId         : member.memberId,
    studentName      : member.studentName,
    firstName        : member.firstName,
    lastName         : member.lastName,
    class            : member.class,
    email            : member.email,
    telegramUsername : member.telegramUsername,
    phoneNumber      : member.phoneNumber,
    role             : member.role,
    status           : member.status,
    isApproved       : member.isApproved,
    courseIds        : member.courseIds || [],
    assignedCourseIds: member.assignedCourseIds || [],
    createdAt        : member.createdAt,
    telegramActivated: member.telegramActivated
  };
}

// ---------------------------------------------------------------------------
// Helper: get the set of course IDs the requesting user can see
// ---------------------------------------------------------------------------
function getVisibleCourseIds(user) {
  if (user.role === ROLES.PRESIDENTIAL_ADMIN) return null; // null = ALL
  return user.assignedCourseIds || [];
}

// ---------------------------------------------------------------------------
// GET /api/scoped/courses — visible courses for the requester
// ---------------------------------------------------------------------------
router.get('/courses', (req, res) => {
  try {
    const user = req.user;
    const allCourses = db.getAllCourses ? db.getAllCourses() : [];

    if (user.role === ROLES.PRESIDENTIAL_ADMIN) {
      return res.json({ success: true, courses: allCourses });
    }

    const assignedIds = new Set(user.assignedCourseIds || []);
    const visible = allCourses.filter(c => assignedIds.has(c.id));

    return res.json({ success: true, courses: visible });
  } catch (err) {
    console.error('[scoped/courses]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch courses.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/scoped/students — all students scoped to the requester's courses
// ---------------------------------------------------------------------------
router.get('/students', (req, res) => {
  try {
    const user = req.user;
    const visibleCourseIds = getVisibleCourseIds(user);

    // Collect all members with role 'member' (students)
    const allMembers = [...db.members.values()].filter(m => m.role === ROLES.STUDENT || m.role === 'member');

    let students;
    if (visibleCourseIds === null) {
      // President sees everyone
      students = allMembers;
    } else {
      const visibleSet = new Set(visibleCourseIds);
      students = allMembers.filter(m => {
        const mCourseIds = m.courseIds || [];
        return mCourseIds.some(cid => visibleSet.has(cid));
      });
    }

    // Pagination
    const page  = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const start = (page - 1) * limit;
    const total = students.length;
    const paged = students.slice(start, start + limit);

    return res.json({
      success : true,
      total,
      page,
      limit,
      students: paged.map(safeStudent)
    });
  } catch (err) {
    console.error('[scoped/students]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch students.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/scoped/students/:studentId — single student (scoped)
// ---------------------------------------------------------------------------
router.get('/students/:studentId', (req, res) => {
  try {
    const user      = req.user;
    const studentId = req.params.studentId;

    const member = db.findMemberById(studentId) || db.findMemberByMemberId(studentId);
    if (!member || (member.role !== ROLES.STUDENT && member.role !== 'member')) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    // Scope check
    if (user.role !== ROLES.PRESIDENTIAL_ADMIN) {
      const visibleSet  = new Set(user.assignedCourseIds || []);
      const studentCIds = member.courseIds || [];
      if (!studentCIds.some(cid => visibleSet.has(cid))) {
        return res.status(403).json({
          success: false,
          error  : 'Access denied. This student is not enrolled in any of your assigned courses.'
        });
      }
    }

    return res.json({ success: true, student: safeStudent(member) });
  } catch (err) {
    console.error('[scoped/students/:id]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch student.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/scoped/courses/:courseId/students — students in a specific course
// ---------------------------------------------------------------------------
router.get('/courses/:courseId/students', scopedCourseMiddleware, (req, res) => {
  try {
    const user     = req.user;
    const courseId = req.params.courseId;

    const course = db.getCourseById ? db.getCourseById(courseId) : null;
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found.' });
    }

    // Scope check — scopedCourseMiddleware already ran for non-presidents
    const allMembers = [...db.members.values()].filter(m => m.role === ROLES.STUDENT || m.role === 'member');
    const enrolled   = allMembers.filter(m => (m.courseIds || []).includes(courseId));

    return res.json({
      success  : true,
      courseId,
      course   : { id: course.id, title: course.title },
      total    : enrolled.length,
      students : enrolled.map(safeStudent)
    });
  } catch (err) {
    console.error('[scoped/courses/:courseId/students]', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch course students.' });
  }
});

export default router;
