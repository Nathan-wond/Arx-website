/**
 * 2FA Authentication Routes
 *
 * POST /api/auth/admin-login          → Step 1: validate password, send OTP
 * POST /api/auth/verify-otp           → Step 2: verify OTP, receive final JWT
 * POST /api/auth/resend-otp           → Resend OTP (rate-limited)
 * POST /api/auth/admin/create-staff   → Presidential Admin: create lower_admin / teacher
 * PATCH /api/auth/admin/assign-course → Presidential Admin: assign courses to staff
 * GET  /api/auth/admin/staff          → Presidential Admin: list all staff members
 */
import { Router } from 'express';
import { createRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { presidentMiddleware, authMiddleware, require2fa } from '../middleware/authMiddleware.js';
import {
  initiateAdminLogin,
  verifyAdminOtp,
  resendOtp,
  createStaffMember,
  assignCourseToStaff
} from '../controllers/twoFaController.js';
import { db } from '../services/db.js';
import { ROLES } from '../middleware/authMiddleware.js';

const router = Router();

// Rate limiters
const loginLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max     : 5,
  message : 'Too many login attempts. Please wait 5 minutes before trying again.'
});

const otpLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max     : 8,
  message : 'Too many OTP attempts. Please wait and try again.'
});

const resendLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max     : 3,
  message : 'Too many resend requests. Please wait before requesting a new code.'
});

const staffMgmtLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max     : 20,
  message : 'Too many staff management requests.'
});

// ---------------------------------------------------------------------------
// 2FA LOGIN FLOW
// ---------------------------------------------------------------------------

// Step 1: initiate login (password check + send OTP)
router.post('/admin-login', loginLimiter, initiateAdminLogin);

// Step 2: verify OTP → receive final JWT
router.post('/verify-otp', otpLimiter, verifyAdminOtp);

// Resend OTP
router.post('/resend-otp', resendLimiter, resendOtp);

// ---------------------------------------------------------------------------
// PRESIDENTIAL ADMIN — STAFF MANAGEMENT
// (requires full 2FA: authMiddleware + require2fa + presidentMiddleware)
// ---------------------------------------------------------------------------

// Create a new Lower Admin or Teacher
router.post(
  '/admin/create-staff',
  staffMgmtLimiter,
  presidentMiddleware,
  require2fa,
  createStaffMember
);

// Assign / update courses for a staff member
router.patch(
  '/admin/assign-course',
  staffMgmtLimiter,
  presidentMiddleware,
  require2fa,
  assignCourseToStaff
);

// List all staff members (Lower Admins + Teachers)
router.get(
  '/admin/staff',
  staffMgmtLimiter,
  presidentMiddleware,
  require2fa,
  (req, res) => {
    try {
      const staffRoles = [ROLES.LOWER_ADMIN, ROLES.TEACHER];
      const staff = [...db.members.values()]
        .filter(m => staffRoles.includes(m.role))
        .map(m => ({
          id               : m.id,
          memberId         : m.memberId,
          studentName      : m.studentName,
          email            : m.email,
          role             : m.role,
          status           : m.status,
          assignedCourseIds: m.assignedCourseIds || [],
          permissions      : m.permissions || [],
          createdAt        : m.createdAt
        }));

      return res.json({ success: true, total: staff.length, staff });
    } catch (err) {
      console.error('[admin/staff]', err);
      return res.status(500).json({ success: false, error: 'Failed to list staff.' });
    }
  }
);

export default router;
