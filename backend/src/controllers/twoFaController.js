/**
 * 2FA Authentication Controller
 *
 * Handles:
 *  - POST /api/auth/admin-login        → initiate login, send OTP
 *  - POST /api/auth/verify-otp         → verify OTP, issue final JWT
 *  - POST /api/auth/resend-otp         → resend OTP (rate-limited upstream)
 *  - POST /api/auth/admin/create-staff → presidential creates lower_admin / teacher
 *  - POST /api/auth/admin/assign-course → assign courses to staff
 */
import { db } from '../services/db.js';
import { hashPassword, verifyPassword } from '../utils/passwordUtils.js';
import { createToken } from '../utils/jwtUtils.js';
import { CONFIG } from '../config/index.js';
import { generateOtpCode, storeOtp, verifyOtp, clearOtp, getOtpTtlMs } from '../services/otpService.js';
import { sendOtpEmail } from '../services/emailService.js';
import { ROLES } from '../middleware/authMiddleware.js';

// ---------------------------------------------------------------------------
// Pending-login store: userId → { memberId, email, role, name, initiatedAt }
// Cleared on successful OTP or TTL expiry.
// ---------------------------------------------------------------------------
const pendingLogins = new Map();

const PENDING_TTL_MS = 6 * 60 * 1000; // 6 min — slightly longer than OTP TTL

// Cleanup stale pending logins every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [uid, entry] of pendingLogins.entries()) {
    if (now - entry.initiatedAt > PENDING_TTL_MS) pendingLogins.delete(uid);
  }
}, 10 * 60 * 1000).unref();

// ---------------------------------------------------------------------------
// Helper: get human-readable role label
// ---------------------------------------------------------------------------
function roleLabel(role) {
  switch (role) {
    case ROLES.PRESIDENTIAL_ADMIN: return 'Presidential Administrator';
    case ROLES.LOWER_ADMIN:        return 'Administrator';
    case ROLES.TEACHER:            return 'Teacher';
    default:                       return 'Staff';
  }
}

// ---------------------------------------------------------------------------
// Helper: find an admin/teacher member by submitted identifier
// ---------------------------------------------------------------------------
function resolveStaffMember(rawId) {
  const cleanId = (rawId || '').trim();
  const lower   = cleanId.toLowerCase();

  // Presidential Admin shortcuts
  if (['adminp', 'nexora', 'president', 'president_root', 'arx-president'].includes(lower)) {
    return (
      db.findMemberById('admin_presidential') ||
      db.findMemberById('president_root') ||
      Array.from(db.members.values()).find(m => m.role === ROLES.PRESIDENTIAL_ADMIN)
    );
  }

  // Lower Admin shortcuts (legacy)
  if (['admino', 'arx-officer-001', 'admin', 'officer', 'admin_root'].includes(lower)) {
    return (
      db.findMemberById('admin_officer') ||
      db.findMemberById('admin_root') ||
      Array.from(db.members.values()).find(
        m => m.role === ROLES.LOWER_ADMIN && m.id !== 'admin_presidential'
      )
    );
  }

  // Generic lookup by member ID or internal ID
  let found = db.findMemberByMemberId(cleanId.toUpperCase()) || db.findMemberByMemberId(cleanId);
  if (found) return found;

  // Full scan for email or id match
  for (const m of db.members.values()) {
    if (
      (m.id && m.id.toLowerCase() === lower) ||
      (m.memberId && m.memberId.toLowerCase() === lower) ||
      (m.email && m.email.toLowerCase() === lower)
    ) {
      return m;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// STEP 1: Initiate admin/teacher login → validate credentials → send OTP
// ---------------------------------------------------------------------------
export async function initiateAdminLogin(req, res) {
  try {
    const { memberId, password } = req.body || {};

    if (!memberId || typeof memberId !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username/ID and password are required.' });
    }

    const member = resolveStaffMember(memberId);

    // Only admin-tier and teacher roles get 2FA login
    const validRoles = [ROLES.PRESIDENTIAL_ADMIN, ROLES.LOWER_ADMIN, ROLES.TEACHER];
    if (!member || !validRoles.includes(member.role)) {
      return res.status(403).json({ error: 'Access denied. Privileged credentials required.' });
    }

    if (member.status === 'suspended') {
      return res.status(403).json({ error: 'This account is suspended. Contact the Presidential Administrator.' });
    }

    // --- Password verification ---
    const cleanPass = password.trim();
    let passwordValid = Boolean(
      member.passwordHash &&
      (verifyPassword(password, member.passwordHash) || verifyPassword(cleanPass, member.passwordHash))
    );

    // Env-password bootstrap (first run only, migrates to hashed)
    if (!passwordValid && member.role === ROLES.PRESIDENTIAL_ADMIN) {
      const envPass = (process.env.INITIAL_PRESIDENT_PASSWORD || process.env.PRESIDENT_PASSWORD || '').trim();
      if (envPass && (cleanPass === envPass || password === envPass)) {
        db.updateMemberPassword(member.id, envPass);
        passwordValid = true;
      }
    }
    if (!passwordValid && member.role === ROLES.LOWER_ADMIN) {
      const envPass = (process.env.INITIAL_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '').trim();
      if (envPass && (cleanPass === envPass || password === envPass)) {
        db.updateMemberPassword(member.id, envPass);
        passwordValid = true;
      }
    }

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials. Access denied.' });
    }

    // --- Generate & send OTP ---
    const recipientEmail =
      member.role === ROLES.PRESIDENTIAL_ADMIN
        ? (process.env.PRESIDENTIAL_ADMIN_EMAIL || member.email || '').trim()
        : (member.email || '').trim();

    if (!recipientEmail) {
      return res.status(500).json({
        error: 'No email address configured for this account. 2FA cannot be delivered. Contact the system administrator.'
      });
    }

    const otpCode = generateOtpCode();
    await storeOtp(member.id, otpCode);

    // Store pending login (password already verified)
    pendingLogins.set(member.id, {
      memberId    : member.memberId,
      email       : recipientEmail,
      role        : member.role,
      name        : member.studentName || member.name || 'Administrator',
      initiatedAt : Date.now()
    });

    // Send email (non-blocking error handling: log but still return 200 with info)
    try {
      await sendOtpEmail({
        to            : recipientEmail,
        recipientName : member.studentName || member.name || 'Administrator',
        otpCode,
        role          : roleLabel(member.role)
      });
    } catch (emailErr) {
      console.error('[2FA] Failed to send OTP email:', emailErr.message);
      clearOtp(member.id);
      pendingLogins.delete(member.id);
      return res.status(502).json({
        error: 'Failed to send verification email. Check Gmail SMTP configuration (GMAIL_USER, GMAIL_APP_PASSWORD).'
      });
    }

    // Mask email for privacy
    const maskedEmail = recipientEmail.replace(/(.{2}).+(@.+)/, '$1***$2');

    return res.status(200).json({
      success      : true,
      message      : `A 6-digit verification code has been sent to ${maskedEmail}. It expires in 5 minutes.`,
      pendingUserId: member.id,       // front-end uses this to call /verify-otp
      maskedEmail,
      expiresInMs  : 5 * 60 * 1000
    });

  } catch (err) {
    console.error('[2FA] initiateAdminLogin error:', err);
    return res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
}

// ---------------------------------------------------------------------------
// STEP 2: Verify OTP → issue final JWT with twoFaVerified flag
// ---------------------------------------------------------------------------
export async function verifyAdminOtp(req, res) {
  try {
    const { pendingUserId, otpCode } = req.body || {};

    if (!pendingUserId || !otpCode) {
      return res.status(400).json({ error: 'pendingUserId and otpCode are required.' });
    }

    const pending = pendingLogins.get(pendingUserId);
    if (!pending) {
      return res.status(400).json({
        error: 'No pending login found. Please start the login process again.'
      });
    }

    // Check pending TTL
    if (Date.now() - pending.initiatedAt > PENDING_TTL_MS) {
      pendingLogins.delete(pendingUserId);
      clearOtp(pendingUserId);
      return res.status(400).json({ error: 'Login session expired. Please log in again.' });
    }

    const result = await verifyOtp(pendingUserId, String(otpCode).trim());

    if (!result.valid) {
      const reason = result.reason;
      if (reason === 'EXPIRED') {
        return res.status(400).json({ error: 'Your verification code has expired. Please log in again.' });
      }
      if (reason === 'TOO_MANY_ATTEMPTS') {
        pendingLogins.delete(pendingUserId);
        return res.status(429).json({ error: 'Too many incorrect attempts. Please log in again.' });
      }
      const ttlMs = getOtpTtlMs(pendingUserId);
      const secsLeft = Math.ceil(ttlMs / 1000);
      return res.status(401).json({
        error    : 'Invalid verification code. Please try again.',
        expiresIn: secsLeft > 0 ? secsLeft : undefined
      });
    }

    // OTP verified — retrieve fresh member data
    const member = db.findMemberById(pendingUserId);
    if (!member) {
      pendingLogins.delete(pendingUserId);
      return res.status(404).json({ error: 'Account not found.' });
    }

    pendingLogins.delete(pendingUserId);

    // Issue final JWT with 2FA flag
    const token = createToken({
      id            : member.id,
      memberId      : member.memberId,
      studentName   : member.studentName,
      role          : member.role,
      twoFaVerified : true            // flag read by require2fa middleware
    });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('arx_session', token, {
      httpOnly: true,
      secure  : isProduction,
      sameSite: 'strict',
      maxAge  : 7 * 24 * 60 * 60 * 1000,
      path    : '/'
    });

    // Audit log
    try {
      db.logAuditEvent({
        actor  : member.studentName,
        action : '2FA_LOGIN_SUCCESS',
        details: `${roleLabel(member.role)} completed 2FA login (${member.memberId})`
      });
    } catch (_) {}

    return res.json({
      success     : true,
      message     : `${roleLabel(member.role)} authentication successful.`,
      token,
      member      : {
        id                : member.id,
        memberId          : member.memberId,
        studentName       : member.studentName,
        role              : member.role,
        email             : member.email,
        assignedCourseIds : member.assignedCourseIds || [],
        permissions       : member.permissions || (member.role === ROLES.PRESIDENTIAL_ADMIN ? ['all'] : []),
        mustChangePassword: Boolean(member.mustChangePassword)
      },
      redirectUrl : member.role === ROLES.PRESIDENTIAL_ADMIN ? '/president' : '/dashboard'
    });

  } catch (err) {
    console.error('[2FA] verifyAdminOtp error:', err);
    return res.status(500).json({ error: 'OTP verification failed. Please try again.' });
  }
}

// ---------------------------------------------------------------------------
// RESEND OTP — rate-limited upstream
// ---------------------------------------------------------------------------
export async function resendOtp(req, res) {
  try {
    const { pendingUserId } = req.body || {};
    if (!pendingUserId) {
      return res.status(400).json({ error: 'pendingUserId is required.' });
    }

    const pending = pendingLogins.get(pendingUserId);
    if (!pending) {
      return res.status(400).json({ error: 'No pending login session. Please log in again.' });
    }

    const member = db.findMemberById(pendingUserId);
    if (!member) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const otpCode = generateOtpCode();
    await storeOtp(member.id, otpCode);
    pending.initiatedAt = Date.now(); // reset TTL

    await sendOtpEmail({
      to            : pending.email,
      recipientName : pending.name,
      otpCode,
      role          : roleLabel(pending.role)
    });

    const maskedEmail = pending.email.replace(/(.{2}).+(@.+)/, '$1***$2');
    return res.json({
      success    : true,
      message    : `A new verification code has been sent to ${maskedEmail}.`,
      expiresInMs: 5 * 60 * 1000
    });

  } catch (err) {
    console.error('[2FA] resendOtp error:', err);
    return res.status(500).json({ error: 'Failed to resend verification code.' });
  }
}

// ---------------------------------------------------------------------------
// CREATE STAFF — Presidential Admin creates Lower Admin or Teacher
// ---------------------------------------------------------------------------
export async function createStaffMember(req, res) {
  try {
    // req.user is already verified as Presidential Admin by presidentMiddleware
    const {
      name, email, username, password,
      role, assignedCourseIds, permissions
    } = req.body || {};

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, and role are required.' });
    }

    const validRoles = [ROLES.LOWER_ADMIN, ROLES.TEACHER];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: `Role must be one of: ${validRoles.join(', ')}`
      });
    }

    // Check for duplicate email
    for (const m of db.members.values()) {
      if (m.email && m.email.toLowerCase() === email.toLowerCase()) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
    }

    const cleanCourseIds = Array.isArray(assignedCourseIds) ? assignedCourseIds : [];

    // Validate courses exist
    for (const cid of cleanCourseIds) {
      if (!db.getCourseById(cid)) {
        return res.status(400).json({ error: `Course not found: ${cid}` });
      }
    }

    // Build unique staff member ID
    const prefix   = role === ROLES.TEACHER ? 'TCH' : 'ADM';
    const memberId = `${prefix}-${Date.now().toString(36).toUpperCase()}`;
    const internalId = `staff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const passwordHash = hashPassword(password);

    // Use db.createMember if available, otherwise inject directly into map
    let newMember;
    try {
      newMember = db.createMember({
        firstName     : name.split(' ')[0] || name,
        lastName      : name.split(' ').slice(1).join(' ') || '',
        email,
        telegramUsername: username ? `@${username.replace(/^@/, '')}` : '',
        password,
        role,
        status        : 'active',
        assignedCourseIds : cleanCourseIds,
        permissions   : permissions || (role === ROLES.LOWER_ADMIN
          ? ['applications_review', 'members_view', 'attendance', 'assignments_grade']
          : ['view_students', 'assignments_grade', 'attendance']),
        mustChangePassword: true,
        createdBy     : req.user.id
      });
    } catch (_) {
      // Fallback: direct map injection if createMember doesn't accept all fields
      newMember = {
        id            : internalId,
        memberId,
        studentName   : name,
        firstName     : name.split(' ')[0] || name,
        lastName      : name.split(' ').slice(1).join(' ') || '',
        email,
        telegramUsername: username ? `@${username.replace(/^@/, '')}` : '',
        passwordHash,
        role,
        status        : 'active',
        assignedCourseIds: cleanCourseIds,
        permissions   : permissions || [],
        mustChangePassword: true,
        createdBy     : req.user.id,
        createdAt     : new Date().toISOString(),
        updatedAt     : new Date().toISOString()
      };
      db.members.set(internalId, newMember);
      if (typeof db._saveToFile === 'function') {
        db._saveToFile().catch(e => console.warn('[createStaff] save warn:', e.message));
      }
    }

    // Audit log
    try {
      db.logAuditEvent({
        actor  : req.user.studentName,
        action : 'CREATE_STAFF',
        details: `Presidential Admin created ${roleLabel(role)}: ${name} (${email}) assigned to courses: [${cleanCourseIds.join(', ')}]`
      });
    } catch (_) {}

    return res.status(201).json({
      success: true,
      message: `${roleLabel(role)} account created successfully. They must change their password on first login.`,
      member : {
        id               : newMember.id,
        memberId         : newMember.memberId,
        studentName      : newMember.studentName,
        email            : newMember.email,
        role             : newMember.role,
        assignedCourseIds: newMember.assignedCourseIds || cleanCourseIds,
        permissions      : newMember.permissions,
        mustChangePassword: true
      }
    });

  } catch (err) {
    console.error('[createStaffMember] error:', err);
    return res.status(500).json({ error: 'Failed to create staff member.' });
  }
}

// ---------------------------------------------------------------------------
// ASSIGN COURSE — Presidential Admin assigns courses to staff
// ---------------------------------------------------------------------------
export async function assignCourseToStaff(req, res) {
  try {
    const { staffMemberId, courseIds } = req.body || {};

    if (!staffMemberId || !Array.isArray(courseIds)) {
      return res.status(400).json({ error: 'staffMemberId and courseIds[] are required.' });
    }

    const member = db.findMemberById(staffMemberId) || db.findMemberByMemberId(staffMemberId);
    if (!member) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    if (![ROLES.LOWER_ADMIN, ROLES.TEACHER].includes(member.role)) {
      return res.status(400).json({ error: 'Course assignment is only valid for Lower Admins and Teachers.' });
    }

    // Validate courses
    for (const cid of courseIds) {
      if (!db.getCourseById(cid)) {
        return res.status(400).json({ error: `Course not found: ${cid}` });
      }
    }

    member.assignedCourseIds = courseIds;
    member.updatedAt = new Date().toISOString();
    db.members.set(member.id, member);

    if (typeof db._saveToFile === 'function') {
      db._saveToFile().catch(e => console.warn('[assignCourse] save warn:', e.message));
    }

    try {
      db.logAuditEvent({
        actor  : req.user.studentName,
        action : 'ASSIGN_COURSES',
        details: `Assigned courses [${courseIds.join(', ')}] to ${roleLabel(member.role)} ${member.studentName} (${member.memberId})`
      });
    } catch (_) {}

    return res.json({
      success          : true,
      message          : `Courses assigned to ${member.studentName} successfully.`,
      assignedCourseIds: courseIds
    });

  } catch (err) {
    console.error('[assignCourseToStaff] error:', err);
    return res.status(500).json({ error: 'Failed to assign courses.' });
  }
}
