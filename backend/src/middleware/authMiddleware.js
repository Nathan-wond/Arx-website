/**
 * RBAC Middleware — Role-Based Access Control
 *
 * Role hierarchy (highest → lowest):
 *   PRESIDENTIAL_ADMIN  (role: 'president')   — global access
 *   LOWER_ADMIN         (role: 'lower_admin')  — scoped to assigned areas
 *   TEACHER             (role: 'teacher')      — scoped to assigned courses
 *   STUDENT             (role: 'member')       — own data only
 *
 * All middleware functions assume authMiddleware has already populated req.user.
 */
import { verifyToken } from '../utils/jwtUtils.js';
import { db } from '../services/db.js';

/** Cookie helper */
export function getCookie(req, name) {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ---------------------------------------------------------------------------
// ROLE CONSTANTS — single source of truth
// ---------------------------------------------------------------------------
export const ROLES = {
  PRESIDENTIAL_ADMIN : 'president',
  ADMIN              : 'admin',
  LOWER_ADMIN        : 'lower_admin',
  TEACHER            : 'teacher',
  STUDENT            : 'member'
};

// ---------------------------------------------------------------------------
// authMiddleware — base: verify JWT, load user, check suspension
// ---------------------------------------------------------------------------
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers.cookie) {
    token = getCookie(req, 'arx_session') || getCookie(req, 'itclub_auth_token');
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
  }

  const payload = verifyToken(token);
  if (!payload || !payload.id) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session. Please log in again.' });
  }

  const member = db.findMemberById(payload.id);
  if (!member) {
    return res.status(401).json({ success: false, error: 'User account not found.' });
  }

  if (member.status === 'suspended') {
    return res.status(403).json({ success: false, error: 'Your account is currently suspended. Contact administration.' });
  }

  if (member.role === ROLES.STUDENT) {
    if (member.status === 'pending') {
      return res.status(403).json({ success: false, error: 'Your application is under review.', status: 'pending' });
    }
    if (member.status === 'rejected') {
      return res.status(403).json({ success: false, error: member.rejectionReason || 'Application declined.', status: 'rejected' });
    }
  }

  req.user = {
    ...payload,
    id            : member.id,
    memberId      : member.memberId,
    studentName   : member.studentName,
    role          : member.role,
    email         : member.email,
    assignedCourseIds : member.assignedCourseIds || [],   // for teachers/lower_admins
    permissions   : member.permissions || []
  };

  next();
}

// ---------------------------------------------------------------------------
// 2FA Guard — blocks routes until 2FA is verified for admin-tier users
// ---------------------------------------------------------------------------
export function require2fa(req, res, next) {
  const adminRoles = [ROLES.PRESIDENTIAL_ADMIN, ROLES.ADMIN, ROLES.LOWER_ADMIN, ROLES.TEACHER];
  if (!adminRoles.includes(req.user?.role)) return next();  // students skip 2FA

  if (!req.user?.twoFaVerified) {
    return res.status(403).json({
      success: false,
      error: '2FA verification required. Submit your OTP to complete login.',
      code: '2FA_REQUIRED'
    });
  }
  next();
}

// ---------------------------------------------------------------------------
// presidentMiddleware — Presidential Admin only
// ---------------------------------------------------------------------------
export function presidentMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user?.role !== ROLES.PRESIDENTIAL_ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Presidential clearance required. This action is restricted to the Presidential Administrator.'
      });
    }
    next();
  });
}

// ---------------------------------------------------------------------------
// adminMiddleware — Presidential Admin, Admin, OR Lower Admin
// ---------------------------------------------------------------------------
export function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    const allowed = [ROLES.PRESIDENTIAL_ADMIN, ROLES.ADMIN, ROLES.LOWER_ADMIN];
    if (!allowed.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        error: 'Administrative privileges required.'
      });
    }
    next();
  });
}

// ---------------------------------------------------------------------------
// staffMiddleware — President, Admin, Lower Admin, or Teacher
// ---------------------------------------------------------------------------
export function staffMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    const allowed = [ROLES.PRESIDENTIAL_ADMIN, ROLES.ADMIN, ROLES.LOWER_ADMIN, ROLES.TEACHER];
    if (!allowed.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        error: 'Staff privileges required.'
      });
    }
    next();
  });
}

// ---------------------------------------------------------------------------
// teacherMiddleware — Teacher or higher
// ---------------------------------------------------------------------------
export function teacherMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    const allowed = [ROLES.PRESIDENTIAL_ADMIN, ROLES.ADMIN, ROLES.LOWER_ADMIN, ROLES.TEACHER];
    if (!allowed.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        error: 'Teacher privileges required.'
      });
    }
    next();
  });
}

// ---------------------------------------------------------------------------
// scopedCourseMiddleware — Ensures teachers/lower_admins can only act on
// courses assigned to them. Presidents bypass this check.
// Usage: place AFTER teacherMiddleware/adminMiddleware and set req.targetCourseId
// ---------------------------------------------------------------------------
export function scopedCourseMiddleware(req, res, next) {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, error: 'Unauthenticated.' });

  // Presidential Admin has global access — no scoping
  if (user.role === ROLES.PRESIDENTIAL_ADMIN) return next();

  const courseId = req.params.courseId || req.body?.courseId || req.query?.courseId;
  if (!courseId) return next(); // if no specific course targeted, let query-level scoping handle it

  const assigned = user.assignedCourseIds || [];
  if (!assigned.includes(courseId)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. You are not assigned to this course.'
    });
  }
  next();
}

// ---------------------------------------------------------------------------
// optionalAuthMiddleware — populates req.user if a valid token is present
// ---------------------------------------------------------------------------
export function optionalAuthMiddleware(req, _res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers.cookie) {
    token = getCookie(req, 'arx_session') || getCookie(req, 'itclub_auth_token');
  }

  if (token) {
    const payload = verifyToken(token);
    if (payload && payload.id) {
      const member = db.findMemberById(payload.id);
      if (member && member.status !== 'suspended') {
        req.user = {
          ...payload,
          role             : member.role,
          assignedCourseIds: member.assignedCourseIds || [],
          permissions      : member.permissions || []
        };
      }
    }
  }
  next();
}

// Legacy named export kept for compatibility with existing server.js
export { adminMiddleware as settingsAdminMiddleware };
