import { db } from '../services/db.js';
import { hashPassword, verifyPassword, validateStrongPassword } from '../utils/passwordUtils.js';
import { createToken } from '../utils/jwtUtils.js';
import {} from '../middleware/authMiddleware.js';
import { CONFIG } from '../config/index.js';
import { sendTelegramMessage } from './telegramController.js';
import { validatePersonName, validateTelegramUsername, countWords, validateEmail } from '../utils/validationUtils.js';
import { validateAndSaveAwardFile } from '../utils/awardFileUtils.js';
import { sanitizeText } from '../utils/sanitizeUtils.js';
import { analyzeEssay } from '../services/aiDetectionService.js';

const VALID_GRADES = [
'9A', '9B', '9C', '9D', '9E',
'10A', '10B', '10C', '10D', '10E',
'11A', '11B', '11C', '11D', '11E',
'12A', '12B', '12C', '12D', '12E'];

export function normalizeEthiopianPhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { valid: false, normalized: '', error: 'Please enter your phone number.' };
  }
  let cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, '').trim();

  
  while (cleaned.startsWith('+251+251')) cleaned = cleaned.replace(/^\+251\+251/, '+251');
  while (cleaned.startsWith('+251251')) cleaned = cleaned.replace(/^\+251251/, '+251');
  while (cleaned.startsWith('251251')) cleaned = cleaned.replace(/^251251/, '251');

  let digitsAfterCountry = '';
  if (cleaned.startsWith('+251')) {
    digitsAfterCountry = cleaned.slice(4);
  } else if (cleaned.startsWith('251')) {
    digitsAfterCountry = cleaned.slice(3);
  } else if (cleaned.startsWith('0')) {
    digitsAfterCountry = cleaned.slice(1);
  } else {
    digitsAfterCountry = cleaned;
  }

  
  if (digitsAfterCountry.startsWith('0')) {
    digitsAfterCountry = digitsAfterCountry.slice(1);
  }

  if (!/^\d{9}$/.test(digitsAfterCountry)) {
    return {
      valid: false,
      normalized: '',
      error: 'Please enter a valid 9-digit Ethiopian phone number (+251 followed by 9 digits, e.g. +251 911 234 567 or 911234567).'
    };
  }

  return { valid: true, normalized: `+251${digitsAfterCountry}` };
}

const inFlightRegistrations = new Set();

export const authController = {
  async register(req, res) {
    const lockKeys = [];
    try {
      
      const currentSettings = db.getSettings();
      if (currentSettings.registrationStatus === 'CLOSED') {
        res.status(403).json({
          error:
          currentSettings.registrationClosedMessage ||
          'Registration for ARX IT CLUB OF SJS is currently closed. Please check back during the next term or join @arxitclub for updates.'
        });
        return;
      }

      const {
        firstName,
        secondName,
        lastName,
        studentName,
        class: studentClass,
        password,
        confirmPassword,
        phoneNumber,
        email,
        telegramUsername,
        courseId,
        selectedCourseId,
        courseIds,
        award,
        awardFiles,
        motivationEssay,
        essay,
        paragraph
      } = req.body || {};

      
      const validatedAwardFilesToSave = [];
      if (awardFiles !== undefined && awardFiles !== null) {
        if (!Array.isArray(awardFiles)) {
          res.status(400).json({ error: 'Uploaded award files must be an array of files.' });
          return;
        }

        if (awardFiles.length > 5) {
          res.status(400).json({ error: 'You may upload a maximum of 5 supporting award files.' });
          return;
        }

        for (const fileInput of awardFiles) {
          const valRes = validateAndSaveAwardFile(fileInput);
          if (!valRes.success || !valRes.file) {
            res.status(400).json({ error: valRes.error || 'Invalid award file upload.' });
            return;
          }
          validatedAwardFilesToSave.push(valRes.file);
        }
      }

      
      let cleanFirst = (typeof firstName === 'string' ? firstName : '').trim();
      let cleanSecond = (typeof secondName === 'string' ? secondName : '').trim();
      let cleanLast = (typeof lastName === 'string' ? lastName : '').trim();

      
      if (!cleanFirst && !cleanLast && typeof studentName === 'string' && studentName.trim().length > 0) {
        const parts = studentName.trim().split(/\s+/);
        cleanFirst = parts[0] || '';
        if (parts.length > 2) {
          cleanSecond = parts.slice(1, -1).join(' ');
          cleanLast = parts[parts.length - 1] || '';
        } else if (parts.length === 2) {
          cleanLast = parts[1] || '';
        }
      }

      
      const firstCheck = validatePersonName(cleanFirst, 'First Name');
      if (!firstCheck.valid) {
        res.status(400).json({ error: firstCheck.error });
        return;
      }
      cleanFirst = firstCheck.normalized;

      if (cleanSecond) {
        const secondCheck = validatePersonName(cleanSecond, 'Second Name');
        if (!secondCheck.valid) {
          res.status(400).json({ error: secondCheck.error });
          return;
        }
        cleanSecond = secondCheck.normalized;
      }

      const lastCheck = validatePersonName(cleanLast, 'Last Name');
      if (!lastCheck.valid) {
        res.status(400).json({ error: lastCheck.error });
        return;
      }
      cleanLast = lastCheck.normalized;

      
      const cleanGrade = (typeof studentClass === 'string' ? studentClass : '').trim().toUpperCase();
      if (!cleanGrade || !VALID_GRADES.includes(cleanGrade)) {
        res.status(400).json({
          error: 'Please select a valid Grade section (e.g. 9A-9E, 10A-10E, 11A-11E, or 12A-12E).'
        });
        return;
      }

      
      if (confirmPassword === undefined || confirmPassword === null || typeof confirmPassword !== 'string') {
        res.status(400).json({ error: 'Please confirm your password.' });
        return;
      }

      if (confirmPassword !== password) {
        res.status(400).json({ error: 'Passwords do not match.' });
        return;
      }

      
      const phoneValidation = normalizeEthiopianPhone(phoneNumber);
      if (!phoneValidation.valid) {
        res.status(400).json({ error: phoneValidation.error });
        return;
      }
      const normalizedPhone = phoneValidation.normalized;

      
      const existingWithPhone = db.findMemberByPhone(normalizedPhone);
      if (existingWithPhone) {
        res.status(409).json({
          error: 'This phone number is already registered to another member account. Please log in with your Member ID.'
        });
        return;
      }

      
      let cleanEmail = undefined;
      if (email && typeof email === 'string' && email.trim().length > 0) {
        const emailValidation = validateEmail(email, db.getExistingEmails());
        if (!emailValidation.valid) {
          const isConflict = emailValidation.error?.includes('already registered');
          res.status(isConflict ? 409 : 400).json({ error: emailValidation.error });
          return;
        }
        cleanEmail = emailValidation.normalized;
      }

      const tgValidation = validateTelegramUsername(
        telegramUsername,
        db.getExistingTelegramUsernames()
      );
      if (!tgValidation.valid) {
        const isConflict = tgValidation.error?.includes('already registered') || tgValidation.error?.includes('already connected');
        res.status(isConflict ? 409 : 400).json({ error: tgValidation.error });
        return;
      }
      const normalizedTelegram = tgValidation.normalized;

      // Simultaneous request concurrency lock
      lockKeys.push(
        `phone:${normalizedPhone}`,
        `tg:${normalizedTelegram.toLowerCase()}`
      );
      if (cleanEmail) lockKeys.push(`email:${cleanEmail.toLowerCase()}`);

      for (const k of lockKeys) {
        if (inFlightRegistrations.has(k)) {
          res.status(409).json({
            error: 'A registration request with these credentials is currently in progress. Please wait a moment.'
          });
          return;
        }
      }
      lockKeys.forEach(k => inFlightRegistrations.add(k));

      const personalInfoCandidates = [
      cleanFirst,
      cleanSecond,
      cleanLast,
      normalizedPhone.replace(/\D/g, ''),
      cleanEmail ? cleanEmail.split('@')[0] : '',
      normalizedTelegram.replace(/^@/, '')].
      filter(Boolean);

      const passwordValidation = validateStrongPassword(password, {
        confirmPassword,
        personalInfo: personalInfoCandidates
      });

      if (!passwordValidation.valid) {
        res.status(400).json({
          error: passwordValidation.errors[0] || 'Password does not meet security requirements.',
          errors: passwordValidation.errors
        });
        return;
      }

      // Resolve course IDs: support courseIds array (2 courses) or legacy single courseId
      const rawCourseIds = Array.isArray(courseIds) && courseIds.length > 0
        ? courseIds
        : [(typeof courseId === 'string' ? courseId : typeof selectedCourseId === 'string' ? selectedCourseId : '').trim()].filter(Boolean);

      if (rawCourseIds.length === 0) {
        res.status(400).json({ error: 'Please choose 2 course tracks to complete your registration.' });
        return;
      }
      if (rawCourseIds.length < 2) {
        res.status(400).json({ error: 'Please select exactly 2 course tracks to complete your registration.' });
        return;
      }
      if (rawCourseIds.length > 2) {
        res.status(400).json({ error: 'You may select a maximum of 2 course tracks.' });
        return;
      }

      const selectedCourses = [];
      for (const cid of rawCourseIds) {
        const course = db.getCourseById(cid);
        if (!course) {
          res.status(400).json({ error: `Course track not found: "${cid}". Please select available courses.` });
          return;
        }
        if (
          course.isPublished === false ||
          course.status !== 'Available' ||
          course.isAvailableForRegistration === false
        ) {
          res.status(400).json({
            error: `The course "${course.title}" is currently not accepting new student admissions. Please select another available course.`
          });
          return;
        }
        selectedCourses.push(course);
      }

      
      const existingDuplicate = db.findDuplicateRegistration({
        firstName: cleanFirst,
        secondName: cleanSecond,
        lastName: cleanLast,
        class: cleanGrade,
        phoneNumber: normalizedPhone,
        telegramUsername: normalizedTelegram
      });

      if (existingDuplicate) {
        res.status(409).json({
          error:
          'An account with these details (Name, Grade, Phone Number, and Telegram) is already registered. Please log in with your Member ID.'
        });
        return;
      }

      const rawEssay = motivationEssay || essay || paragraph;
      const wordCount = countWords(rawEssay);
      if (!rawEssay || typeof rawEssay !== 'string' || wordCount < 100) {
        const remaining = Math.max(0, 100 - wordCount);
        res.status(400).json({
          error: `Motivation essay must contain at least 100 words. Current count: ${wordCount} / 100 words (${remaining > 0 ? `${remaining} more words required` : ''}). Please explain why you want to join ARX IT Club.`
        });
        return;
      }
      const cleanEssay = sanitizeText(rawEssay.trim());

      
      
      
      let aiAnalysis = { aiProbability: 0, isAI: false, flags: [], method: 'skipped', analyzedAt: new Date().toISOString() };
      if (cleanEssay) {
        try {
          aiAnalysis = await analyzeEssay(cleanEssay);
        } catch (aiErr) {
          console.warn('[register] AI analysis failed silently:', aiErr.message);
        }
      }
      

      const newMember = db.createMember({
        firstName: cleanFirst,
        secondName: cleanSecond || undefined,
        lastName: cleanLast,
        class: cleanGrade,
        password,
        phoneNumber: normalizedPhone,
        email: cleanEmail,
        telegramUsername: normalizedTelegram,
        award: award ? sanitizeText(String(award).trim()) : undefined,
        motivationEssay: cleanEssay,
        essay: cleanEssay,
        courseIds: rawCourseIds,
        courseId: rawCourseIds[0],
        aiEssayScore: aiAnalysis.aiProbability,
        aiEssaySuspected: aiAnalysis.isAI,
        aiEssayFlags: aiAnalysis.flags,
        aiEssayMethod: aiAnalysis.method,
        aiEssayAnalyzedAt: aiAnalysis.analyzedAt
      });

      
      const savedAwardFiles = [];
      for (const f of validatedAwardFilesToSave) {
        const saved = db.addMemberAwardFile({
          memberId: newMember.id,
          originalFilename: f.originalFilename,
          filename: f.filename,
          storagePath: f.storagePath,
          url: f.url,
          fileSize: f.fileSize,
          formattedSize: f.formattedSize,
          mimeType: f.mimeType,
          base64: f.base64
        });
        savedAwardFiles.push(saved);
      }

      // Enroll in both selected courses
      const enrollments = [];
      for (const course of selectedCourses) {
        const enrollment = db.enrollMemberInCourse(newMember.id, course.id);
        enrollments.push(enrollment);
      }
      const initialEnrollment = enrollments[0];

      
      // Create activation session BEFORE saving so the token is persisted in one write
      const activationSession = db.createActivationSession(
        newMember.id,
        newMember.memberId,
        newMember.studentName,
        newMember.telegramUsername
      );

      const safeMember = {
        id: newMember.id,
        memberId: newMember.memberId,
        studentName: newMember.studentName,
        firstName: newMember.firstName,
        secondName: newMember.secondName,
        lastName: newMember.lastName,
        class: newMember.class,
        phoneNumber: newMember.phoneNumber,
        email: newMember.email,
        telegramUsername: newMember.telegramUsername,
        telegramUserId: newMember.telegramUserId,
        telegramActivated: false, 
        telegramLinkedAt: newMember.telegramLinkedAt,
        award: newMember.award,
        awardFiles: savedAwardFiles,
        role: newMember.role,
        status: newMember.status,
        isApproved: Boolean(newMember.isApproved),
        createdAt: newMember.createdAt
      };

      const settings = db.getSettings();
      const botUrl = settings.telegramBotUrl || 'https://t.me/ARXITCLUB_bot';
      const activationUrl = `${botUrl}?start=${activationSession.token}`;

      // BUG FIX: Await the save so member + session token are durably persisted before response
      try {
        if (typeof db._saveToFile === 'function') {
          await db._saveToFile();
        }
      } catch (saveErr) {
        console.warn('[Register] Background sync warning:', saveErr?.message);
      }

      res.status(201).json({
        success: true,
        message: 'Application submitted successfully! Your application is currently under review by an administrator.',
        memberId: newMember.memberId,
        member: safeMember,
        courses: selectedCourses.map(c => ({ id: c.id, title: c.title, category: c.category, duration: c.duration })),
        course: selectedCourses[0] ? { id: selectedCourses[0].id, title: selectedCourses[0].title, category: selectedCourses[0].category, duration: selectedCourses[0].duration } : null,
        enrollment: initialEnrollment,
        enrollments,
        activation: {
          token: activationSession.token,
          activationUrl,
          botUsername: settings.telegramBotUsername || 'ARXITCLUB_bot',
          botUrl: settings.telegramBotUrl || 'https://t.me/ARXITCLUB_bot',
          channelName: settings.telegramChannelName || CONFIG.TELEGRAM_CHANNEL_HANDLE || '@arxitclub',
          channelUrl: settings.telegramChannelUrl || CONFIG.TELEGRAM_CHANNEL_LINK || 'https://t.me/arxitclub',
          expiresAt: activationSession.expiresAt
        },
        activationUrl,
        activationToken: activationSession.token,
        telegramBotUsername: settings.telegramBotUsername || 'ARXITCLUB_bot',
        telegramBotUrl: settings.telegramBotUrl || 'https://t.me/ARXITCLUB_bot',
        telegramChannelUrl: settings.telegramChannelUrl || CONFIG.TELEGRAM_CHANNEL_LINK || 'https://t.me/arxitclub',
        telegramChannelName: settings.telegramChannelName || CONFIG.TELEGRAM_CHANNEL_HANDLE || '@arxitclub'
      });
    } catch (err) {
      console.error('[authController] Register error:', err);
      res.status(500).json({ error: err?.message || 'Something went wrong while creating your account. Please try again.' });
    } finally {
      lockKeys.forEach(k => inFlightRegistrations.delete(k));
    }
  },

  login(req, res) {
    try {
      const { memberId, password } = req.body || {};

      if (!memberId || typeof memberId !== 'string' || !password || typeof password !== 'string') {
        res.status(400).json({ error: 'Member ID and password are required.' });
        return;
      }

      const cleanMemberId = memberId.trim().toUpperCase();
      let member = db.findMemberByMemberId(cleanMemberId);
      if (!member) {
        const rootPresident = db.findMemberById('president_root');
        if (rootPresident && (
          cleanMemberId === 'NEXORA' ||
          cleanMemberId === 'PRESIDENT' ||
          cleanMemberId === 'PRESIDENT_ROOT' ||
          cleanMemberId === (rootPresident.memberId || '').toUpperCase()
        )) {
          member = rootPresident;
        }
      }
      if (!member) {
        const rootAdmin = db.findMemberById('admin_root');
        if (rootAdmin && (
          cleanMemberId === 'ADMIN' ||
          cleanMemberId === 'ADMINISTRATOR' ||
          cleanMemberId === 'ADMIN_ROOT' ||
          cleanMemberId === 'ARX-ADMIN' ||
          cleanMemberId === 'ITCLUB_ADMIN' ||
          cleanMemberId === (rootAdmin.memberId || '').toUpperCase()
        )) {
          member = rootAdmin;
        }
      }

      if (!member) {
        res.status(401).json({ error: 'Invalid Member ID or password. Please verify your credentials.' });
        return;
      }

      const cleanCandidatePass = typeof password === 'string' ? password.trim() : '';
      let isPasswordValid = verifyPassword(password, member.passwordHash) || verifyPassword(cleanCandidatePass, member.passwordHash);
      if (!isPasswordValid && member.role === 'admin') {
        const configuredAdminPassword = (process.env.ADMIN_PASSWORD || CONFIG.ADMIN_PASSWORD || '').trim();
        if (configuredAdminPassword && (cleanCandidatePass === configuredAdminPassword || password === configuredAdminPassword)) {
          member.passwordHash = hashPassword(configuredAdminPassword);
          member.updatedAt = new Date().toISOString();
          db.updateMemberPassword(member.id, configuredAdminPassword);
          isPasswordValid = true;
        }
      }
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid Member ID or password. Please verify your credentials.' });
        return;
      }

      if (member.role === 'member') {
        if (member.status === 'pending') {
          res.status(403).json({
            error: 'Your application is currently under review by an administrator.',
            status: 'pending'
          });
          return;
        }

        if (member.status === 'rejected') {
          res.status(403).json({
            error: member.rejectionReason
              ? `Your application was not approved: ${member.rejectionReason}`
              : 'Your application has been declined by an administrator.',
            status: 'rejected'
          });
          return;
        }

        if (member.status === 'suspended') {
          res.status(403).json({
            error: 'Your account is currently suspended. Please contact club administration.',
            status: 'suspended'
          });
          return;
        }

        if (member.status !== 'approved' && member.status !== 'active') {
          res.status(403).json({
            error: 'Your application is currently under review by an administrator.',
            status: member.status
          });
          return;
        }
      } else if (member.status === 'suspended') {
        res.status(403).json({ error: 'Your account is currently suspended. Please contact club administration.' });
        return;
      }

      const token = createToken({
        id: member.id,
        memberId: member.memberId,
        studentName: member.studentName,
        role: member.role
      });

      const safeMember = {
        id: member.id,
        memberId: member.memberId,
        studentName: member.studentName,
        class: member.class,
        phoneNumber: member.phoneNumber,
        telegramUsername: member.telegramUsername,
        telegramUserId: member.telegramUserId,
        telegramActivated: Boolean(member.telegramActivated),
        telegramLinkedAt: member.telegramLinkedAt,
        award: member.award,
        role: member.role,
        status: member.status,
        isApproved: Boolean(member.isApproved),
        createdAt: member.createdAt
      };

      
      
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('arx_session', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, 
        path: '/'
      });

      res.json({
        success: true,
        message: 'Welcome back!',
        member: safeMember,
        token
      });
    } catch (err) {
      console.error('[authController] Login error:', err);
      res.status(500).json({ error: err?.message || 'An unexpected error occurred during login. Please try again later.' });
    }
  },

  adminLogin(req, res) {
    try {
      const { memberId, password } = req.body || {};

      if (!memberId || typeof memberId !== 'string' || !password || typeof password !== 'string') {
        res.status(400).json({ error: 'Administrative username / ID and password are required.' });
        return;
      }

      const rawId = (memberId || '').trim();
      const cleanId = rawId.toLowerCase();
      let member = null;

      // 1. Presidential Admin lookup (adminp, nexora, president)
      if (cleanId === 'adminp' || cleanId === 'nexora' || cleanId === 'president' || cleanId === 'president_root' || cleanId === 'arx-president') {
        member = db.findMemberById('admin_presidential') || db.findMemberById('president_root');
        if (!member) {
          member = Array.from(db.members.values()).find(m => (m.memberId && m.memberId.toLowerCase() === 'adminp') || m.role === 'president');
        }
      }
      // 2. Officer Admin lookup (admino, arx-officer-001, admin, officer)
      else if (cleanId === 'admino' || cleanId === 'arx-officer-001' || cleanId === 'admin' || cleanId === 'officer' || cleanId === 'admin_root') {
        member = db.findMemberById('admin_officer') || db.findMemberById('admin_root');
        if (!member) {
          member = Array.from(db.members.values()).find(m => (m.memberId && m.memberId.toLowerCase() === 'admino') || (m.role === 'admin' && m.id !== 'admin_presidential'));
        }
      }

      // 3. Fallback generic lookup by Member ID or username
      if (!member) {
        member = db.findMemberByMemberId(rawId.toUpperCase()) || db.findMemberByMemberId(rawId) || db.findMemberByMemberId(cleanId);
      }
      if (!member) {
        for (const m of db.members.values()) {
          if ((m.role === 'admin' || m.role === 'president') && (
            (m.memberId && m.memberId.toLowerCase() === cleanId) ||
            (m.id && m.id.toLowerCase() === cleanId) ||
            (m.telegramUsername && m.telegramUsername.replace(/^@/, '').toLowerCase() === cleanId)
          )) {
            member = m;
            break;
          }
        }
      }

      if (!member || (member.role !== 'admin' && member.role !== 'president')) {
        res.status(403).json({ error: 'Access denied. Administrative credentials required (e.g. adminp for President or admino for Officer).' });
        return;
      }

      if (member.status === 'suspended') {
        res.status(403).json({ error: 'This administrative account is suspended. Contact the President.' });
        return;
      }

      const cleanCandidatePass = typeof password === 'string' ? password.trim() : '';
      let isPasswordValid = Boolean(member.passwordHash && (verifyPassword(password, member.passwordHash) || verifyPassword(cleanCandidatePass, member.passwordHash)));

      // Fallback check against environment-configured passwords ONLY (no hardcoded defaults)
      if (!isPasswordValid) {
        if (member.role === 'president') {
          const configuredPresPass = (process.env.PRESIDENT_PASSWORD || CONFIG.PRESIDENT_PASSWORD || '').trim();
          if (configuredPresPass && (cleanCandidatePass === configuredPresPass || password === configuredPresPass)) {
            member.passwordHash = hashPassword(configuredPresPass);
            member.updatedAt = new Date().toISOString();
            db.updateMemberPassword(member.id, configuredPresPass);
            isPasswordValid = true;
          }
        } else {
          const configuredAdminPassword = (process.env.ADMIN_PASSWORD || CONFIG.ADMIN_PASSWORD || '').trim();
          if (configuredAdminPassword && (cleanCandidatePass === configuredAdminPassword || password === configuredAdminPassword)) {
            member.passwordHash = hashPassword(configuredAdminPassword);
            member.updatedAt = new Date().toISOString();
            db.updateMemberPassword(member.id, configuredAdminPassword);
            isPasswordValid = true;
          }
        }
      }

      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid administrative credentials. Access denied.' });
        return;
      }

      const token = createToken({
        id: member.id,
        memberId: member.memberId,
        studentName: member.studentName,
        role: member.role
      });

      const isProductionAdmin = process.env.NODE_ENV === 'production';
      res.cookie('arx_session', token, {
        httpOnly: true,
        secure: isProductionAdmin,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      // Audit logging
      try {
        db.logAuditEvent({
          actor: member.studentName,
          action: 'ADMIN_LOGIN',
          details: `Administrator logged into ${member.role === 'president' ? 'Executive Suite' : 'Operations Desk'} (${member.memberId})`
        });
      } catch (_) {}

      res.json({
        success: true,
        message: `${member.role === 'president' ? 'President Executive' : 'Administrator'} authentication successful.`,
        mustChangePassword: Boolean(member.mustChangePassword),
        member: {
          id: member.id,
          memberId: member.memberId,
          studentName: member.studentName,
          role: member.role,
          class: member.class,
          mustChangePassword: Boolean(member.mustChangePassword),
          permissions: member.permissions || (member.role === 'president' ? ['all'] : ['applications_review', 'members_view', 'attendance', 'assignments_grade'])
        },
        redirectUrl: member.role === 'president' ? '/president' : '/71354caa6bea2251',
        token
      });
    } catch (err) {
      console.error('[authController] AdminLogin error:', err);
      res.status(500).json({ error: err?.message || 'Administrator authentication failed. Please try again.' });
    }
  },

  logout(_req, res) {
    
    res.clearCookie('arx_session', { path: '/', httpOnly: true, sameSite: 'strict' });
    res.json({ success: true, message: 'Logged out successfully.' });
  },

  activateAccount(req, res) {
    try {
      const { code, memberId } = req.body;
      if (!code || typeof code !== 'string' || !code.trim()) {
        res.status(400).json({ error: 'Activation code is required. Please check the code and try again.' });
        return;
      }

      const cleanCode = code.trim();
      const cleanMemberId = typeof memberId === 'string' && memberId.trim() ? memberId.trim() : undefined;
      const result = db.activateAccountByCode(cleanCode, cleanMemberId);

      if (!result.success) {
        if (result.alreadyActive) {
          res.status(200).json({
            success: false,
            alreadyActive: true,
            code: 'ALREADY_ACTIVATED',
            message: result.message || 'This account is already activated.',
            member: result.member ? {
              memberId: result.member.memberId,
              studentName: result.member.studentName,
              class: result.member.class,
              telegramActivated: true
            } : undefined
          });
          return;
        }

        if (result.code === 'EXPIRED_CODE') {
          res.status(400).json({ error: result.message || 'This activation code has expired.' });
          return;
        }

        if (result.code === 'REVOKED_CODE') {
          res.status(400).json({ error: result.message || 'This activation code has been revoked.' });
          return;
        }

        if (result.code === 'MEMBER_MISMATCH') {
          res.status(400).json({ error: result.message || 'This activation code belongs to another member registration.' });
          return;
        }

        if (result.code === 'CHANNEL_NOT_VERIFIED') {
          res.status(400).json({ error: result.message || 'Channel membership has not been verified.' });
          return;
        }

        if (result.code === 'TELEGRAM_ALREADY_LINKED') {
          res.status(400).json({ error: result.message || 'Telegram account is already linked to another member.' });
          return;
        }

        res.status(400).json({ error: result.message || 'Invalid activation code. Please check the code and try again.' });
        return;
      }

      const settings = db.getSettings();
      res.status(200).json({
        success: true,
        message: 'Account activated successfully.',
        member: result.member ? {
          id: result.member.id,
          memberId: result.member.memberId,
          studentName: result.member.studentName,
          class: result.member.class,
          role: result.member.role,
          telegramUsername: result.member.telegramUsername,
          telegramActivated: true
        } : undefined,
        telegramBotUrl: settings.telegramBotUrl || 'https://t.me/ARXITCLUB_bot',
        telegramChannelUrl: settings.telegramChannelUrl || CONFIG.TELEGRAM_CHANNEL_LINK || 'https://t.me/arxitclub'
      });
    } catch {
      res.status(500).json({ error: 'Something went wrong while activating your account. Please try again later.' });
    }
  },

  me(req, res) {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const member = db.findMemberById(req.user.id);
    if (!member) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    const safeMember = {
      id: member.id,
      memberId: member.memberId,
      studentName: member.studentName,
      class: member.class,
      phoneNumber: member.phoneNumber,
      telegramUsername: member.telegramUsername,
      telegramUserId: member.telegramUserId,
      telegramActivated: Boolean(member.telegramActivated),
      telegramLinkedAt: member.telegramLinkedAt,
      award: member.award,
      role: member.role,
      status: member.status,
      isApproved: Boolean(member.isApproved),
      createdAt: member.createdAt
    };

    res.json({ member: safeMember });
  },

  
  async forgotPasswordRequest(req, res) {
    const { identifier } = req.body;
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      res.status(400).json({ error: 'Please enter your Member ID, email, or phone number.' });
      return;
    }

    const result = db.createPasswordResetSession(identifier.trim());
    if (!result.success || !result.session || !result.member) {
      res.status(400).json({ error: result.message });
      return;
    }

    const session = result.session;
    const member = result.member;

    
    if (member.telegramUserId) {
      const resetMsg =
      `🔐 *ARX IT CLUB OF SJS — Password Reset Request*\n\n` +
      `A password reset request was initiated for student *${member.studentName}* (\`${member.memberId}\`).\n\n` +
      `Your 6-digit reset code is:\n\`${session.code}\`\n\n` +
      `⏰ This code expires in 15 minutes and can only be used once.\n` +
      `If you did not make this request, please disregard this message or alert an administrator.`;

      await sendTelegramMessage(member.telegramUserId, resetMsg).catch(() => {});
    }

    res.json({
      success: true,
      message: 'A 6-digit password reset code has been sent through the official ARX Telegram bot to your linked Telegram account.',
      memberId: member.memberId,
      telegramLinked: Boolean(member.telegramUserId || member.telegramUsername)
    });
  },

  async forgotPasswordVerifyCode(req, res) {
    const { identifier, code } = req.body;
    if (!identifier || !code) {
      res.status(400).json({ error: 'Member identifier and 6-digit reset code are required.' });
      return;
    }

    const result = db.verifyPasswordResetCode(String(identifier).trim(), String(code).trim());
    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json({
      success: true,
      resetToken: result.resetToken,
      message: 'Reset code verified successfully. Please set your new password.'
    });
  },

  async forgotPasswordReset(req, res) {
    const { resetToken, newPassword, confirmPassword } = req.body;
    if (!resetToken || !newPassword) {
      res.status(400).json({ error: 'Reset token and new password are required.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const strengthCheck = validateStrongPassword(newPassword);
    if (!strengthCheck.valid) {
      res.status(400).json({ error: strengthCheck.errors.join(' ') || 'Password does not meet complexity requirements.' });
      return;
    }

    const result = db.completePasswordReset(String(resetToken).trim(), newPassword);
    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json({
      success: true,
      message: 'Password updated successfully! You can now log into the Member Portal.'
    });
  },

  async checkTelegramUsername(req, res) {
    try {
      const raw = req.query.username;
      if (!raw || typeof raw !== 'string' || !raw.trim()) {
        res.status(400).json({
          available: false,
          valid: false,
          error: 'Please enter a valid Telegram username.'
        });
        return;
      }

      const existing = db.getExistingTelegramUsernames();
      const validation = validateTelegramUsername(raw, existing);

      if (!validation.valid) {
        const isTaken = validation.error?.includes('already registered') || validation.error?.includes('already connected');
        res.json({
          available: false,
          valid: false,
          taken: Boolean(isTaken),
          error: isTaken
            ? 'This username is already registered with ARX IT Club.'
            : (validation.error || 'Please enter a valid Telegram username.')
        });
        return;
      }

      res.json({
        available: true,
        valid: true,
        normalized: validation.normalized,
        message: 'Username format is valid, but account ownership has not yet been verified.'
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to check Telegram username availability.' });
    }
  },

  async checkEmail(req, res) {
    try {
      const raw = req.query.email;
      if (!raw || typeof raw !== 'string' || !raw.trim()) {
        res.json({
          valid: true,
          available: true,
          empty: true
        });
        return;
      }

      const existing = db.getExistingEmails();
      const validation = validateEmail(raw, existing);

      if (!validation.valid) {
        const isTaken = validation.error?.includes('already registered');
        res.json({
          available: false,
          valid: false,
          taken: Boolean(isTaken),
          error: validation.error || 'Please enter a valid email address.'
        });
        return;
      }

      res.json({
        available: true,
        valid: true,
        normalized: validation.normalized
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to check email availability.' });
    }
  }
};
