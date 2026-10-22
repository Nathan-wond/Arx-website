import fs from 'fs';
import path from 'path';
import {} from '../middleware/authMiddleware.js';
import { db } from '../services/db.js';
import { CONFIG } from '../config/index.js';
import { verifyPassword } from '../utils/passwordUtils.js';
import { sanitizeText, sanitizeUrl } from '../utils/sanitizeUtils.js';
import { countWords } from '../utils/validationUtils.js';
import {
  sendTelegramMessage,
  configureTelegramBotToken,
  testFullTelegramConnection,
  syncTelegramBotCommands } from './telegramController.js';

function validateUrl(urlStr, fieldName, options = { requireHttps: true, allowRelative: false }) {
  if (!urlStr || typeof urlStr !== 'string') return '';
  const trimmed = urlStr.trim();
  if (!trimmed) return '';

  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    throw new Error(`${fieldName} contains an unsafe protocol scheme.`);
  }

  if (options.allowRelative && trimmed.startsWith('/')) {
    if (/[\s<>"'`\\]/.test(trimmed)) {
      throw new Error(`${fieldName} relative path contains invalid characters.`);
    }
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`${fieldName} must use HTTP or HTTPS protocol.`);
    }
    const isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);
    if (options.requireHttps && !isLocal && parsed.protocol !== 'https:') {
      throw new Error(`${fieldName} must use HTTPS in production.`);
    }
    return parsed.href.replace(/\/+$/, '');
  } catch (err) {
    if (err.message.includes('protocol') || err.message.includes('HTTPS')) throw err;
    throw new Error(`${fieldName} is not a valid URL (e.g. https://example.com).`);
  }
}

function validateEmail(emailStr) {
  if (!emailStr || typeof emailStr !== 'string') return '';
  const trimmed = emailStr.trim();
  if (!trimmed) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error('Contact email address format is invalid.');
  }
  return trimmed.toLowerCase();
}

export const adminController = {
  
  getOverview(_req, res) {
    const stats = db.getAdminOverviewStats();
    res.json({ stats });
  },

  
  async getApplications(req, res) {
    try {
      await db.ensureInitialized();
      const { status } = req.query;
      
      const filterStatus = status || 'all';
      const applications = db.getApplications(filterStatus);

      const safeList = applications.map((m) => {
        const rawFiles = db.getMemberAwardFiles(m.id);
        const awardFiles = rawFiles.map(f => ({
          ...f,
          dataUrl: f.base64 ? `data:${f.mimeType || 'image/jpeg'};base64,${f.base64}` : (f.dataUrl || undefined)
        }));
        const enrollments = db.getMemberEnrollments(m.id);
        let enrolledCourses = enrollments.map(e => {
          const c = db.getCourseById(e.courseId);
          return {
            id: e.courseId,
            title: c?.title || e.courseTitle || 'Course Track',
            category: c?.category || 'Curriculum',
            duration: c?.duration || 'Term Track',
            status: e.status || 'Enrolled',
            progress: e.progress || 0
          };
        });

        // Fallback: If no enrollments exist in enrollments table, check member.courseIds or member.courseId
        if (enrolledCourses.length === 0) {
          const rawCids = Array.isArray(m.courseIds) && m.courseIds.length > 0
            ? m.courseIds
            : (m.courseId ? [m.courseId] : []);
          enrolledCourses = rawCids.map(cid => {
            const c = db.getCourseById(cid);
            return {
              id: cid,
              title: c?.title || cid,
              category: c?.category || 'Curriculum',
              duration: c?.duration || '12 Weeks',
              status: 'Applied Track',
              progress: 0
            };
          });
        }

        const enrolledCourse = enrolledCourses[0] || null;
        const courseTitles = enrolledCourses.map(c => c.title).join(' • ');

        const motivationText = m.motivationEssay || m.essay || '';
        const wordCount = m.wordCount || countWords(motivationText);
        const isActivated = Boolean(m.isActivated || m.telegramActivated);
        const isTelegramVerified = Boolean(m.telegramUserId || m.telegramActivated);

        return {
          id: m.id,
          memberId: m.memberId,
          studentName: m.studentName,
          fullName: m.studentName || [m.firstName, m.secondName, m.lastName].filter(Boolean).join(' ') || 'Applicant',
          firstName: m.firstName,
          secondName: m.secondName,
          lastName: m.lastName,
          class: m.class,
          grade: m.class,
          phoneNumber: m.phoneNumber,
          email: m.email || null,
          telegramUsername: m.telegramUsername || null,
          telegramUserId: m.telegramUserId || null,
          telegramActivated: Boolean(m.telegramActivated),
          isActivated,
          activationStatus: m.telegramActivated ? 'activated' : (isActivated ? 'activated' : 'pending_telegram'),
          isTelegramVerified,
          award: m.award,
          statement: motivationText,
          motivationEssay: motivationText || undefined,
          essay: motivationText || undefined,
          wordCount,
          aiEssayScore: m.aiEssayScore ?? 0,
          aiEssaySuspected: Boolean(m.aiEssaySuspected),
          aiEssayFlags: m.aiEssayFlags || [],
          aiEssayMethod: m.aiEssayMethod || 'skipped',
          aiEssayAnalyzedAt: m.aiEssayAnalyzedAt || undefined,
          awardFiles,
          awardFilesCount: awardFiles.length,
          hasAwardFiles: awardFiles.length > 0,
          course: enrolledCourse ? {
            id: enrolledCourse.id,
            title: enrolledCourse.title,
            category: enrolledCourse.category
          } : null,
          courses: enrolledCourses,
          courseIds: Array.isArray(m.courseIds) ? m.courseIds : enrolledCourses.map(c => c.id),
          courseId: m.courseId || enrolledCourses[0]?.id || null,
          courseTitle: courseTitles || 'General Track',
          courseTitles: courseTitles || 'General Track',
          role: m.role,
          status: m.status,
          isApproved: Boolean(m.isApproved),
          rejectionReason: m.rejectionReason,
          approvedAt: m.approvedAt,
          approvedBy: m.approvedBy,
          rejectedAt: m.rejectedAt,
          rejectedBy: m.rejectedBy,
          reviewedAt: m.reviewedAt || m.approvedAt || m.rejectedAt,
          reviewedBy: m.reviewedBy || m.approvedBy || m.rejectedBy,
          auditTrail: Array.isArray(m.auditTrail) ? m.auditTrail : [],
          createdAt: m.createdAt,
          updatedAt: m.updatedAt
        };
      });

      res.json({
        success: true,
        applications: safeList,
        count: safeList.length
      });
    } catch {
      res.status(500).json({ error: 'Failed to fetch student applications.' });
    }
  },

  async approveApplication(req, res) {
    try {
      await db.ensureInitialized();
      const { id } = req.params;
      const approved = db.approveApplication(id, req.user);
      if (!approved) {
        res.status(404).json({ error: 'Application not found.' });
        return;
      }

      // BUG FIX: Await the save to ensure approved status is durably persisted
      try {
        await db._saveToFile();
      } catch (saveErr) {
        console.warn('[Admin] approveApplication save warning:', saveErr?.message);
      }

      // Proactively notify student on Telegram if linked
      if (approved.telegramUserId) {
        try {
          const appUrl = (db.getSettings()?.websiteUrl || CONFIG.APP_URL || 'https://arx-website-sjs.vercel.app').replace(/\/+$/, '');
          sendTelegramMessage(
            approved.telegramUserId,
            `🎉 *Congratulations, ${approved.studentName}!*\n\n` +
            `Your student application for *ARX IT CLUB OF SJS* has been **APPROVED**!\n\n` +
            `• *Member ID:* \`${approved.memberId}\`\n` +
            `• *Class:* ${approved.class}\n\n` +
            `You can now access your course tracks and the member portal.\n\n` +
            `🌐 [Log in to Student Portal](${appUrl}/#login)`
          ).catch(() => {});
        } catch { /* ignore notification failure */ }
      }

      res.json({
        success: true,
        message: `Application for ${approved.studentName} (${approved.memberId}) has been approved. Student access is activated.`,
        application: {
          id: approved.id,
          memberId: approved.memberId,
          studentName: approved.studentName,
          status: approved.status,
          isApproved: approved.isApproved,
          approvedAt: approved.approvedAt,
          approvedBy: approved.approvedBy,
          reviewedAt: approved.reviewedAt,
          reviewedBy: approved.reviewedBy,
          auditTrail: approved.auditTrail
        }
      });
    } catch {
      res.status(500).json({ error: 'Failed to approve student application.' });
    }
  },

  async rejectApplication(req, res) {
    try {
      await db.ensureInitialized();
      const { id } = req.params;
      const { rejectionReason, reason } = req.body || {};
      const rejected = db.rejectApplication(id, rejectionReason || reason, req.user);
      if (!rejected) {
        res.status(404).json({ error: 'Application not found.' });
        return;
      }

      // BUG FIX: Await the save to ensure rejected status is durably persisted
      try {
        await db._saveToFile();
      } catch (saveErr) {
        console.warn('[Admin] rejectApplication save warning:', saveErr?.message);
      }

      // Notify student on Telegram if linked
      if (rejected.telegramUserId) {
        try {
          sendTelegramMessage(
            rejected.telegramUserId,
            `ℹ️ *Application Status Update*\n\n` +
            `Dear ${rejected.studentName}, your membership application for ARX IT CLUB OF SJS was evaluated.\n\n` +
            `Status: *Application Declined*\n` +
            (rejected.rejectionReason ? `Reason: _${rejected.rejectionReason}_\n\n` : '\n') +
            `If you have questions, please reach out to club coordinators.`
          ).catch(() => {});
        } catch { /* ignore notification failure */ }
      }

      res.json({
        success: true,
        message: `Application for ${rejected.studentName} (${rejected.memberId}) has been rejected.`,
        application: {
          id: rejected.id,
          memberId: rejected.memberId,
          studentName: rejected.studentName,
          status: rejected.status,
          isApproved: rejected.isApproved,
          rejectionReason: rejected.rejectionReason,
          rejectedAt: rejected.rejectedAt,
          rejectedBy: rejected.rejectedBy,
          reviewedAt: rejected.reviewedAt,
          reviewedBy: rejected.reviewedBy,
          auditTrail: rejected.auditTrail
        }
      });
    } catch {
      res.status(500).json({ error: 'Failed to reject student application.' });
    }
  },

  async deleteApplication(req, res) {
    try {
      await db.ensureInitialized();
      const { id } = req.params;
      const targetMember = db.findMemberById(id) || db.findMemberByMemberId(id);
      if (!targetMember) {
        res.status(404).json({ success: false, error: 'Application record not found.' });
        return;
      }
      if (targetMember.role === 'admin' || targetMember.role === 'president' || targetMember.id === 'admin_root' || targetMember.id === 'president_root') {
        res.status(403).json({ success: false, error: 'Administrator accounts cannot be deleted.' });
        return;
      }
      const deleted = db.deleteMember(targetMember.id);
      if (!deleted) {
        res.status(400).json({ success: false, error: 'Could not delete application record.' });
        return;
      }
      res.json({
        success: true,
        message: `Application for ${targetMember.studentName} (${targetMember.memberId}) has been permanently deleted.`
      });
    } catch (err) {
      console.error('[Admin] Delete application error:', err);
      res.status(500).json({ success: false, error: 'Failed to delete application.' });
    }
  },

  getMembers(req, res) {
    const { q, status } = req.query;
    let members = db.getAdminMembers();

    // Club members roster should not display rejected or pending applicants unless explicitly asked
    if (!status || status === 'all') {
      members = members.filter((m) => m.status !== 'rejected' && m.status !== 'pending');
    }

    let safeList = members.map((m) => {
      const awardFiles = db.getMemberAwardFiles(m.id);
      return {
        id: m.id,
        memberId: m.memberId,
        studentName: m.studentName,
        firstName: m.firstName,
        secondName: m.secondName,
        lastName: m.lastName,
        class: m.class,
        phoneNumber: m.phoneNumber,
        email: m.email,
        telegramUsername: m.telegramUsername,
        telegramUserId: m.telegramUserId,
        telegramActivated: Boolean(m.telegramActivated),
        telegramLinkedAt: m.telegramLinkedAt,
        award: m.award,
        motivationEssay: m.motivationEssay || m.essay || undefined,
        essay: m.essay || m.motivationEssay || undefined,
        aiEssayScore: m.aiEssayScore ?? 0,
        aiEssaySuspected: Boolean(m.aiEssaySuspected),
        aiEssayFlags: m.aiEssayFlags || [],
        aiEssayMethod: m.aiEssayMethod || 'skipped',
        aiEssayAnalyzedAt: m.aiEssayAnalyzedAt || undefined,
        awardFiles,
        awardFilesCount: awardFiles.length,
        hasAwardFiles: awardFiles.length > 0,
        role: m.role,
        status: m.status,
        isApproved: Boolean(m.isApproved),
        rejectionReason: m.rejectionReason,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt
      };
    });

    if (q && typeof q === 'string') {
      const search = q.toLowerCase();
      safeList = safeList.filter(
        (m) =>
        m.studentName.toLowerCase().includes(search) ||
        m.memberId.toLowerCase().includes(search) ||
        m.class.toLowerCase().includes(search)
      );
    }

    if (status && typeof status === 'string' && status !== 'all') {
      safeList = safeList.filter((m) => m.status === status);
    }

    res.json({ members: safeList });
  },

  getMemberDetail(req, res) {
    const { id } = req.params;
    const member = db.findMemberById(id) || db.findMemberByMemberId(id);
    if (!member) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    const enrollments = db.getMemberEnrollments(member.id);
    const certificates = db.getMemberCertificates(member.id);
    const awards = db.getMemberAwards(member.id);
    const projects = db.getMemberProjects(member.studentName);
    const awardFiles = db.getMemberAwardFiles(member.id);

    res.json({
      member: {
        id: member.id,
        memberId: member.memberId,
        studentName: member.studentName,
        firstName: member.firstName,
        secondName: member.secondName,
        lastName: member.lastName,
        class: member.class,
        phoneNumber: member.phoneNumber,
        email: member.email,
        telegramUsername: member.telegramUsername,
        telegramUserId: member.telegramUserId,
        telegramActivated: Boolean(member.telegramActivated),
        telegramLinkedAt: member.telegramLinkedAt,
        award: member.award,
        motivationEssay: member.motivationEssay || member.essay || undefined,
        essay: member.essay || member.motivationEssay || undefined,
        aiEssayScore: member.aiEssayScore ?? 0,
        aiEssaySuspected: Boolean(member.aiEssaySuspected),
        aiEssayFlags: member.aiEssayFlags || [],
        aiEssayMethod: member.aiEssayMethod || 'skipped',
        aiEssayAnalyzedAt: member.aiEssayAnalyzedAt || undefined,
        awardFiles,
        role: member.role,
        status: member.status,
        isApproved: Boolean(member.isApproved),
        rejectionReason: member.rejectionReason,
        createdAt: member.createdAt
      },
      enrollments,
      certificates,
      awards,
      projects,
      awardFiles
    });
  },

  getMemberAwardFiles(req, res) {
    const { id } = req.params;
    const member = db.findMemberById(id) || db.findMemberByMemberId(id);
    if (!member) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }
    const files = db.getMemberAwardFiles(member.id);
    res.json({ awardFiles: files });
  },

  downloadAwardFile(req, res) {
    const { id } = req.params;
    const item = db.getMemberAwardFileById(id);
    if (!item) {
      res.status(404).json({ error: 'Award file record not found.' });
      return;
    }

    res.setHeader('Content-Type', item.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(item.originalFilename || 'award_document')}"`);

    
    if (item.base64) {
      const buffer = Buffer.from(item.base64, 'base64');
      return res.send(buffer);
    }
    if (item.dataUrl && item.dataUrl.includes('base64,')) {
      const b64 = item.dataUrl.split('base64,')[1];
      const buffer = Buffer.from(b64, 'base64');
      return res.send(buffer);
    }

    
    if (item.storagePath && fs.existsSync(item.storagePath)) {
      const uploadsDir = path.resolve(process.cwd(), 'uploads');
      const resolved = path.resolve(item.storagePath);
      if (!resolved.startsWith(uploadsDir)) {
        res.status(403).json({ error: 'Access denied: invalid file path.' });
        return;
      }
      return res.sendFile(resolved);
    }

    res.status(404).json({ error: 'Award file content not found.' });
  },

  updateMember(req, res) {
    const { id } = req.params;
    const targetMember = db.findMemberById(id) || db.findMemberByMemberId(id);
    if (!targetMember) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    if (targetMember.role === 'president' && req.user?.role !== 'president') {
      res.status(403).json({ error: 'Clearance Denied: Only the Club President can modify Presidential accounts.' });
      return;
    }

    const { studentName, class: studentClass, phoneNumber, email, telegramUsername, award, status } = req.body;

    const updated = db.updateMemberProfile(id, {
      studentName,
      class: studentClass || req.body.studentClass,
      phoneNumber,
      email,
      telegramUsername,
      award,
      status
    });

    if (!updated) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    res.json({ success: true, message: 'Member profile updated successfully.', member: updated });
  },

  toggleMemberStatus(req, res) {
    const { id } = req.params;
    const targetMember = db.findMemberById(id) || db.findMemberByMemberId(id);
    if (!targetMember) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    if (targetMember.role === 'president') {
      res.status(403).json({ error: 'Clearance Denied: Presidential account status cannot be toggled.' });
      return;
    }
    if (targetMember.role === 'admin' && req.user?.role !== 'president') {
      res.status(403).json({ error: 'Clearance Denied: Only the Club President can modify administrative access.' });
      return;
    }

    const member = db.toggleMemberStatus(id);
    if (!member) {
      res.status(404).json({ error: 'Member not found or protected.' });
      return;
    }
    res.json({ success: true, message: `Account status updated to ${member.status}.`, member });
  },

  deleteMember(req, res) {
    try {
      if (req.user?.role !== 'president' && req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Administrative Clearance Required: Only administrators or the Club President can delete members.'
        });
        return;
      }
      const { id } = req.params;
      const targetMember = db.findMemberById(id) || db.findMemberByMemberId(id);
      if (!targetMember) {
        res.status(404).json({ success: false, error: 'Member account not found.' });
        return;
      }
      if (
        targetMember.role === 'admin' ||
        targetMember.role === 'president' ||
        targetMember.id === 'admin_root' ||
        targetMember.id === 'president_root' ||
        targetMember.id === 'admin_presidential' ||
        targetMember.id === 'admin_officer'
      ) {
        res.status(403).json({ success: false, error: 'Administrator and Presidential accounts cannot be deleted through member directory.' });
        return;
      }
      const deleted = db.deleteMember(targetMember.id);
      if (!deleted) {
        res.status(400).json({ success: false, error: 'Could not delete member account.' });
        return;
      }
      res.json({
        success: true,
        message: `Member account for ${targetMember.studentName} (${targetMember.memberId}) and all associated records have been permanently deleted.`
      });
    } catch (err) {
      console.error('[Admin] Delete member error:', err);
      res.status(500).json({ success: false, error: 'Failed to delete member account.' });
    }
  },

  resetMemberPassword(req, res) {
    const { id } = req.params;
    const targetMember = db.findMemberById(id) || db.findMemberByMemberId(id);
    if (!targetMember) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    if (targetMember.role === 'president' && req.user?.role !== 'president') {
      res.status(403).json({ error: 'Clearance Denied: Only the Club President can reset Presidential credentials.' });
      return;
    }

    const { newPassword } = req.body;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }
    const success = db.updateMemberPassword(targetMember.id, newPassword);
    if (!success) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }
    res.json({ success: true, message: 'Member password has been reset successfully.' });
  },

  
  getCourses(_req, res) {
    const courses = db.getCourses(false); 
    res.json({ courses });
  },

  createCourse(req, res) {
    const {
      title,
      description,
      longDescription,
      difficulty,
      duration,
      instructor,
      status,
      category,
      topics,
      learningObjectives,
      requirements,
      certificateInfo,
      isPublished,
      thumbnailUrl,
      bannerUrl,
      thumbnailMediaId,
      bannerMediaId,
      isAvailableForRegistration
    } = req.body;

    if (!title || !description) {
      res.status(400).json({ error: 'Course title and description are required.' });
      return;
    }

    const course = db.createCourse({
      title: title.trim(),
      slug: '',
      description: description.trim(),
      longDescription: longDescription ? longDescription.trim() : description.trim(),
      difficulty: difficulty || 'Beginner',
      duration: duration || '4 weeks',
      instructor: instructor || 'IT Club Instructor',
      status: status || 'Available',
      category: category || 'Web Development',
      topics: Array.isArray(topics) ? topics : topics ? String(topics).split('\n').filter(Boolean) : ['Foundations'],
      learningObjectives: Array.isArray(learningObjectives) ? learningObjectives : learningObjectives ? String(learningObjectives).split('\n').filter(Boolean) : ['Practical coding skills'],
      requirements: Array.isArray(requirements) ? requirements : requirements ? String(requirements).split('\n').filter(Boolean) : ['Basic computer literacy'],
      certificateInfo: certificateInfo || 'Certificate issued upon successful project review.',
      thumbnailUrl: thumbnailUrl || '',
      bannerUrl: bannerUrl || '',
      thumbnailMediaId: thumbnailMediaId || '',
      bannerMediaId: bannerMediaId || '',
      isPublished: isPublished !== undefined ? isPublished : true,
      isAvailableForRegistration: isAvailableForRegistration !== undefined ? Boolean(isAvailableForRegistration) : true
    });

    res.status(201).json({ success: true, message: 'Course created successfully.', course });
  },

  updateCourse(req, res) {
    const { id } = req.params;
    const updated = db.updateCourse(id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }
    res.json({ success: true, message: 'Course updated successfully.', course: updated });
  },

  deleteCourse(req, res) {
    const { id } = req.params;
    const deleted = db.deleteCourse(id);
    if (!deleted) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }
    res.json({ success: true, message: 'Course deleted successfully.' });
  },

  
  getEnrollments(_req, res) {
    const enrollments = db.getAllEnrollments();
    res.json({ enrollments });
  },

  updateEnrollment(req, res) {
    const { id } = req.params;
    const { progress, status, certificateId } = req.body;
    const updated = db.updateEnrollment(id, { progress, status, certificateId });
    if (!updated) {
      res.status(404).json({ error: 'Enrollment record not found.' });
      return;
    }
    res.json({ success: true, message: 'Enrollment updated successfully.', enrollment: updated });
  },

  deleteEnrollment(req, res) {
    const { id } = req.params;
    const deleted = db.deleteEnrollment(id);
    if (!deleted) {
      res.status(404).json({ error: 'Enrollment record not found.' });
      return;
    }
    res.json({ success: true, message: 'Enrollment record deleted successfully.' });
  },

  
  getCertificates(_req, res) {
    const certificates = db.getAllCertificates();
    res.json({ certificates });
  },

  issueCertificate(req, res) {
    const { memberId, studentName, courseId, courseName, issueDate, authorizedSignatures } = req.body;

    if ((!memberId && !studentName) || !courseName) {
      res.status(400).json({ error: 'Student name (or Member ID) and course name are required to issue a certificate.' });
      return;
    }

    const cert = db.issueCertificate({
      memberId,
      studentName,
      courseId,
      courseName,
      issueDate,
      authorizedSignatures
    });

    if (!cert) {
      res.status(404).json({ error: 'Could not generate certificate. Please specify a student name or valid member.' });
      return;
    }

    res.status(201).json({ success: true, message: 'Certificate issued successfully.', certificate: cert });
  },

  toggleCertificate(req, res) {
    const { id } = req.params;
    const cert = db.toggleCertificateStatus(id);
    if (!cert) {
      res.status(404).json({ error: 'Certificate not found.' });
      return;
    }
    res.json({ success: true, message: `Certificate status changed to ${cert.status}.`, certificate: cert });
  },

  deleteCertificate(req, res) {
    const { id } = req.params;
    const deleted = db.deleteCertificate(id);
    if (!deleted) {
      res.status(404).json({ error: 'Certificate not found.' });
      return;
    }
    res.json({ success: true, message: 'Certificate record deleted.' });
  },

  
  getAwards(_req, res) {
    const awards = db.getAllAwards();
    res.json({ awards });
  },

  createAward(req, res) {
    const { memberId, title, description, date, category, badge } = req.body;

    if (!memberId || !title || !description) {
      res.status(400).json({ error: 'Member, award title, and description are required.' });
      return;
    }

    const award = db.createAward({
      memberId,
      title,
      description,
      date,
      category,
      badge
    });

    if (!award) {
      res.status(404).json({ error: 'Target member not found.' });
      return;
    }

    res.status(201).json({ success: true, message: 'Award assigned successfully.', award });
  },

  deleteAward(req, res) {
    const { id } = req.params;
    const deleted = db.deleteAward(id);
    if (!deleted) {
      res.status(404).json({ error: 'Award not found.' });
      return;
    }
    res.json({ success: true, message: 'Award deleted.' });
  },

  
  getProjects(_req, res) {
    const projects = db.getProjects(false);
    res.json({ projects });
  },

  createProject(req, res) {
    const { title, description, technologies, projectMembers, status, date, category, imageUrl, mediaId, galleryImages, githubUrl, liveDemoUrl, isPublished } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ error: 'Project title is required.' });
      return;
    }

    const cleanTitle = title.trim();
    const cleanDesc = description && typeof description === 'string' && description.trim()
      ? description.trim()
      : `${cleanTitle} - Collaborative technology and software initiative developed by ARX IT Club members.`;

    const project = db.createProject({
      title: cleanTitle,
      description: cleanDesc,
      technologies: Array.isArray(technologies) ? technologies : technologies ? String(technologies).split(',').map((t) => t.trim()).filter(Boolean) : ['Tech'],
      projectMembers: Array.isArray(projectMembers) ? projectMembers : projectMembers ? String(projectMembers).split(',').map((m) => m.trim()).filter(Boolean) : ['IT Club Team'],
      status: status || 'In Progress',
      date: date || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      category: category || 'Web App',
      imageUrl: imageUrl || '',
      mediaId: mediaId || '',
      galleryImages: Array.isArray(galleryImages) ? galleryImages : imageUrl ? [imageUrl] : [],
      githubUrl: githubUrl || '',
      liveDemoUrl: liveDemoUrl || '',
      isPublished: isPublished !== false
    });

    res.status(201).json({ success: true, message: 'Project created successfully.', project });
  },

  updateProject(req, res) {
    const { id } = req.params;
    const updated = db.updateProject(id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    res.json({ success: true, message: 'Project updated successfully.', project: updated });
  },

  deleteProject(req, res) {
    const { id } = req.params;
    const deleted = db.deleteProject(id);
    if (!deleted) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    res.json({ success: true, message: 'Project deleted.' });
  },

  
  getEvents(_req, res) {
    const events = db.getEvents(false);
    res.json({ events });
  },

  createEvent(req, res) {
    const { title, date, time, location, locationType, description, organizer, seatsAvailable, status, imageUrl, coverImageUrl, mediaId, galleryImages, isPublished } = req.body;

    if (!title || typeof title !== 'string' || !title.trim() || !date || !time) {
      res.status(400).json({ error: 'Event title, date, and time are required.' });
      return;
    }

    const cleanTitle = sanitizeText(title.trim());
    const cleanDesc = description && typeof description === 'string' && description.trim()
      ? sanitizeText(description.trim())
      : `${cleanTitle} - Hands-on workshop and technical session at ARX IT Club.`;

    const dateObj = new Date(date + 'T00:00:00');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const formattedDate = {
      day: String(dateObj.getDate() || '15'),
      month: months[dateObj.getMonth()] || 'OCT',
      year: String(dateObj.getFullYear() || '2026')
    };

    const finalCover = coverImageUrl || imageUrl || '';

    const event = db.createEvent({
      title: cleanTitle,
      date,
      formattedDate,
      time: sanitizeText(time.trim()),
      location: location ? sanitizeText(location) : 'Computer Lab 3',
      locationType: locationType || 'Onsite',
      description: cleanDesc,
      organizer: organizer ? sanitizeText(organizer) : 'IT Club Committee',
      seatsAvailable: seatsAvailable !== undefined ? parseInt(seatsAvailable, 10) : 30,
      status: status || 'Upcoming',
      imageUrl: finalCover,
      coverImageUrl: finalCover,
      mediaId: mediaId || '',
      galleryImages: Array.isArray(galleryImages) ? galleryImages : finalCover ? [finalCover] : [],
      isPublished: isPublished !== false
    });

    res.status(201).json({ success: true, message: 'Event created successfully.', event });
  },

  updateEvent(req, res) {
    const { id } = req.params;
    const updated = db.updateEvent(id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }
    res.json({ success: true, message: 'Event updated successfully.', event: updated });
  },

  deleteEvent(req, res) {
    const { id } = req.params;
    const deleted = db.deleteEvent(id);
    if (!deleted) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }
    res.json({ success: true, message: 'Event deleted.' });
  },

  
  getAchievements(_req, res) {
    const achievements = db.getAchievements(false);
    res.json({ achievements });
  },

  createAchievement(req, res) {
    const { title, category, recipient, description, date, rank, imageUrl, mediaId, isPublished } = req.body;

    if (!title || !description) {
      res.status(400).json({ error: 'Achievement title and description are required.' });
      return;
    }

    const achievement = db.createAchievement({
      title: sanitizeText(title.trim()),
      category: category || 'club',
      recipient: recipient ? sanitizeText(recipient.trim()) : undefined,
      description: sanitizeText(description.trim()),
      date: date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      rank: rank || 'Honor',
      imageUrl: imageUrl || '',
      mediaId: mediaId || '',
      isPublished: isPublished !== undefined ? isPublished : true
    });

    res.status(201).json({ success: true, message: 'Achievement published successfully.', achievement });
  },

  updateAchievement(req, res) {
    const { id } = req.params;
    const updated = db.updateAchievement(id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Achievement not found.' });
      return;
    }
    res.json({ success: true, message: 'Achievement updated.', achievement: updated });
  },

  deleteAchievement(req, res) {
    const { id } = req.params;
    const deleted = db.deleteAchievement(id);
    if (!deleted) {
      res.status(404).json({ error: 'Achievement not found.' });
      return;
    }
    res.json({ success: true, message: 'Achievement deleted.' });
  },

  
  getAnnouncements(_req, res) {
    const announcements = db.getAnnouncements(false);
    res.json({ announcements });
  },

  async createAnnouncement(req, res) {
    const { title, content, priority, category, isPublished, broadcastTelegram } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'Announcement title and content are required.' });
      return;
    }

    const authorName = req.user?.studentName || (req.user?.role === 'president' ? 'ARX Club President' : 'Club Administration');

    const announcement = db.createAnnouncement({
      title: sanitizeText(title.trim()),
      content: sanitizeText(content.trim()),
      publishedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      priority: priority || 'normal',
      category: category || 'General',
      author: authorName,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true
    });

    // Telegram Bot Broadcast (Sent directly to bot members & stored for bot commands, not the public channel)
    let telegramResult = null;
    if (broadcastTelegram) {
      try {
        const broadcastText = `📣 *${title.trim()}*\n\n${content.trim()}\n\n— _${authorName}_`;
        db.createTelegramBroadcast(broadcastText, ['#announcements']);

        // Deliver directly to registered members linked with the bot
        const allMembers = db.getAdminMembers();
        const connectedTgUsers = allMembers.filter(m => m.telegramUserId && m.status === 'active');
        let sentCount = 0;
        for (const m of connectedTgUsers) {
          try {
            await sendTelegramMessage(m.telegramUserId, broadcastText);
            sentCount++;
          } catch (_) {}
        }
        telegramResult = { success: true, deliveredTo: sentCount };
      } catch (tgErr) {
        console.warn('[Announcement] Telegram bot broadcast error:', tgErr?.message);
      }
    }

    // Audit Log
    try {
      db.logAuditEvent({
        actor: authorName,
        action: 'CREATE_ANNOUNCEMENT',
        details: `Created announcement "${title.trim()}" (Priority: ${priority || 'normal'})`
      });
    } catch (_) {}

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully.',
      announcement,
      telegramBroadcast: telegramResult?.success || false
    });
  },

  toggleAnnouncement(req, res) {
    const { id } = req.params;
    const announcement = db.toggleAnnouncement(id);
    if (!announcement) {
      res.status(404).json({ error: 'Announcement not found.' });
      return;
    }
    res.json({ success: true, message: `Announcement ${announcement.isPublished ? 'published' : 'unpublished'}.`, announcement });
  },

  deleteAnnouncement(req, res) {
    const { id } = req.params;
    const deleted = db.deleteAnnouncement(id);
    if (!deleted) {
      res.status(404).json({ error: 'Announcement not found.' });
      return;
    }
    res.json({ success: true, message: 'Announcement deleted.' });
  },

  
  getSettings(_req, res) {
    const settings = db.getSettings();
    res.json({ settings });
  },

  async updateSettings(req, res) {
    try {
      const payload = { ...req.body };

      // Validate Website URL if provided
      if (payload.websiteUrl !== undefined && payload.websiteUrl !== '') {
        payload.websiteUrl = validateUrl(payload.websiteUrl, 'Public Website URL', { requireHttps: true, allowRelative: false });
      }

      // Validate Admin URL if provided (supports relative /admin or absolute URL)
      if (payload.adminUrl !== undefined && payload.adminUrl !== '') {
        payload.adminUrl = validateUrl(payload.adminUrl, 'Admin Panel URL', { requireHttps: false, allowRelative: true });
      }

      // Validate Telegram Bot URL
      if (payload.telegramBotUrl !== undefined && payload.telegramBotUrl !== '') {
        payload.telegramBotUrl = validateUrl(payload.telegramBotUrl, 'Telegram Bot URL', { requireHttps: true, allowRelative: false });
      }

      // Validate Telegram Channel URL
      if (payload.telegramChannelUrl !== undefined && payload.telegramChannelUrl !== '') {
        payload.telegramChannelUrl = validateUrl(payload.telegramChannelUrl, 'Telegram Channel URL', { requireHttps: true, allowRelative: false });
      }

      // Validate Contact Email
      if (payload.contactEmail !== undefined && payload.contactEmail !== '') {
        payload.contactEmail = validateEmail(payload.contactEmail);
      }

      // Validate Social Media URLs
      if (payload.githubUrl !== undefined && payload.githubUrl !== '') {
        payload.githubUrl = validateUrl(payload.githubUrl, 'GitHub URL', { requireHttps: true, allowRelative: false });
      }
      if (payload.youtubeUrl !== undefined && payload.youtubeUrl !== '') {
        payload.youtubeUrl = validateUrl(payload.youtubeUrl, 'YouTube URL', { requireHttps: true, allowRelative: false });
      }
      if (payload.linkedinUrl !== undefined && payload.linkedinUrl !== '') {
        payload.linkedinUrl = validateUrl(payload.linkedinUrl, 'LinkedIn URL', { requireHttps: true, allowRelative: false });
      }

      if (payload.telegramBotUsername) {
        const cleanBot = payload.telegramBotUsername.replace(/^https?:\/\/t\.me\//i, '').replace(/^@/, '').trim();
        payload.telegramBotUsername = cleanBot;
        if (!payload.telegramBotUrl || payload.telegramBotUrl.includes('itclub_official') || payload.telegramBotUrl.includes('arx_')) {
          payload.telegramBotUrl = `https://t.me/${cleanBot}`;
        }
      }

      if (payload.telegramChannelName) {
        const cleanChan = payload.telegramChannelName.replace(/^https?:\/\/t\.me\//i, '').replace(/^@/, '').trim();
        if (cleanChan) {
          payload.telegramChannelName = `@${cleanChan}`;
          if (!payload.telegramChannelUrl) {
            payload.telegramChannelUrl = `https://t.me/${cleanChan}`;
          }
        }
      }

      const updated = db.updateSettings(payload, req.user);
      try {
        await db._saveToFile();
      } catch (saveErr) {
        console.warn('[Settings] Background sync warning:', saveErr?.message);
      }
      res.json({ success: true, message: 'Website settings saved successfully.', settings: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message || 'Failed to update website settings.' });
    }
  },

  changeAdminPassword(req, res) {
    try {
      const adminId = req.user?.id;
      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, error: 'Current password and new password are required.' });
        return;
      }
      if (newPassword.length < 6) {
        res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
        return;
      }
      const admin = db.findMemberById(adminId);
      if (!admin || (admin.role !== 'admin' && admin.role !== 'president')) {
        res.status(404).json({ success: false, error: 'Administrator account not found.' });
        return;
      }

      if (admin.passwordHash && !verifyPassword(currentPassword, admin.passwordHash)) {
        res.status(401).json({ success: false, error: 'Current security passphrase is incorrect.' });
        return;
      }

      admin.passwordHash = hashPassword(newPassword);
      admin.mustChangePassword = false;
      admin.updatedAt = new Date().toISOString();
      db.logAuditEvent({
        actor: admin.studentName || 'Administrator',
        action: 'CHANGE_OWN_PASSWORD',
        details: `Administrator ${admin.studentName} (${admin.memberId}) updated their security password.`
      });
      db._saveToFile();
      res.json({ success: true, message: 'Password changed successfully. Your account is secured.' });
    } catch (err) {
      console.error('[Admin] changeAdminPassword error:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to change password.' });
    }
  },

  
  getSocialLinks(_req, res) {
    const links = db.getSocialLinks();
    res.json({ socialLinks: links });
  },

  createSocialLink(req, res) {
    const { platform, name, url, icon, isEnabled, order } = req.body;
    if (!platform || !url) {
      res.status(400).json({ error: 'Platform and URL are required.' });
      return;
    }
    const link = db.createSocialLink({
      platform: platform.trim(),
      name: (name || platform).trim(),
      url: url.trim(),
      icon: icon ? icon.trim() : undefined,
      isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
      order: typeof order === 'number' ? order : 10
    });
    res.status(201).json({ success: true, message: 'Social media link added.', socialLink: link });
  },

  updateSocialLink(req, res) {
    const { id } = req.params;
    const updated = db.updateSocialLink(id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Social media link not found.' });
      return;
    }
    res.json({ success: true, message: 'Social media link updated.', socialLink: updated });
  },

  deleteSocialLink(req, res) {
    const { id } = req.params;
    const deleted = db.deleteSocialLink(id);
    if (!deleted) {
      res.status(404).json({ error: 'Social media link not found.' });
      return;
    }
    res.json({ success: true, message: 'Social media link deleted.' });
  },

  
  getGovernance(_req, res) {
    const list = db.getGovernanceRoles(false);
    res.json({ governance: list });
  },

  createGovernance(req, res) {
    const { name, role, category, specialty, department, term, description, photoUrl, positionOffset, socialLinks, order, isUniqueRole, isPublished } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Team member full name is required.' });
      return;
    }
    if (!role || !role.trim()) {
      res.status(400).json({ error: 'Role title is required.' });
      return;
    }

    try {
      const created = db.createGovernanceRole({
        name: name.trim(),
        role: role.trim(),
        category: category ? category.trim() : undefined,
        specialty: specialty ? specialty.trim() : (department ? department.trim() : undefined),
        department: department ? department.trim() : undefined,
        term: term ? term.trim() : undefined,
        description: (description || '').trim(),
        photoUrl: photoUrl ? photoUrl.trim() : undefined,
        positionOffset: positionOffset ? positionOffset.trim() : undefined,
        socialLinks: socialLinks && typeof socialLinks === 'object' ? socialLinks : {},
        order: typeof order === 'number' ? order : undefined,
        isUniqueRole: isUniqueRole !== undefined ? Boolean(isUniqueRole) : undefined,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true
      }, req.user);

      res.status(201).json({ success: true, message: `Team member ${created.name} added successfully.`, governanceRole: created });
    } catch (err) {
      res.status(400).json({ error: err.message || 'Failed to add team member.' });
    }
  },

  updateGovernance(req, res) {
    const { id } = req.params;
    try {
      const updated = db.updateGovernanceRole(id, req.body, req.user);
      if (!updated) {
        res.status(404).json({ error: 'Team member record not found.' });
        return;
      }
      res.json({ success: true, message: `Team member ${updated.name} updated successfully.`, governanceRole: updated });
    } catch (err) {
      res.status(400).json({ error: err.message || 'Failed to update team member.' });
    }
  },

  transferGovernanceRole(req, res) {
    const { sourceMemberId, targetMemberId, roleTitle, newSourceRole } = req.body;
    if (!sourceMemberId || !targetMemberId) {
      res.status(400).json({ error: 'Both source and target member IDs are required to transfer a role.' });
      return;
    }

    try {
      const result = db.transferGovernanceRole({
        sourceMemberId,
        targetMemberId,
        roleTitle,
        newSourceRole
      }, req.user);

      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message || 'Failed to transfer leadership role.' });
    }
  },

  deleteGovernance(req, res) {
    const { id } = req.params;
    const deleted = db.deleteGovernanceRole(id, req.user);
    if (!deleted) {
      res.status(404).json({ error: 'Team member record not found.' });
      return;
    }
    res.json({ success: true, message: 'Team member removed successfully.' });
  },

  reorderGovernance(req, res) {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      res.status(400).json({ error: 'Array of role IDs is required.' });
      return;
    }
    const reordered = db.reorderGovernanceRoles(ids, req.user);
    res.json({ success: true, message: 'Team display order updated successfully.', governance: reordered });
  },

  
  changeAdminPassword(req, res) {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { newPassword, currentPassword, password } = req.body || {};
    const passToSet = newPassword || password;
    if (!passToSet || typeof passToSet !== 'string' || passToSet.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    const member = db.findMemberById(req.user.id);
    if (!member) {
      res.status(404).json({ error: 'Administrator account not found.' });
      return;
    }

    if (currentPassword && member.passwordHash) {
      const isValid = verifyPassword(currentPassword, member.passwordHash);
      if (!isValid && !member.mustChangePassword) {
        res.status(400).json({ error: 'Current security passphrase does not match.' });
        return;
      }
    }

    db.updateMemberPassword(req.user.id, passToSet);
    res.json({ success: true, message: 'Administrator security passphrase updated successfully.' });
  },

  
  toggleRegistrationStatus(req, res) {
    const { status, closedMessage } = req.body || {};
    const current = db.getSettings();
    const newStatus = status ?
    status === 'CLOSED' ? 'CLOSED' : 'OPEN' :
    current.registrationStatus === 'CLOSED' ? 'OPEN' : 'CLOSED';
    const updated = db.setRegistrationStatus(newStatus, closedMessage);
    res.json({
      success: true,
      message: `Club registration lifecycle is now ${newStatus}.`,
      registrationStatus: newStatus,
      settings: updated
    });
  },

  
  getTelegramBotStatus(_req, res) {
    const status = db.getTelegramBotStatus();
    res.json({ status });
  },

  async updateTelegramBotToken(req, res) {
    const { token } = req.body || {};
    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, error: 'Telegram bot token string is required.' });
      return;
    }
    const result = await configureTelegramBotToken(token);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  },

  async testTelegramBotConnection(_req, res) {
    const result = await testFullTelegramConnection();
    res.json(result);
  },

  getBotCommands(_req, res) {
    const commands = db.getBotCommands();
    res.json({ commands });
  },

  updateBotCommand(req, res) {
    const { command, updates } = req.body || {};
    if (!command || typeof command !== 'string') {
      res.status(400).json({ error: 'Command string is required.' });
      return;
    }
    const updated = db.updateBotCommand(command, updates || {});
    if (!updated) {
      res.status(404).json({ error: 'Bot command not found.' });
      return;
    }
    res.json({ success: true, message: `Command ${command} updated successfully.`, command: updated });
  },

  async syncBotCommands(_req, res) {
    const result = await syncTelegramBotCommands();
    res.json(result);
  },

  getBotContent(_req, res) {
    const content = db.getBotContent();
    res.json({ content });
  },

  updateBotContent(req, res) {
    const content = db.updateBotContent(req.body || {});
    res.json({ success: true, message: 'Bot content templates updated successfully.', content });
  },

  getAdmins(_req, res) {
    try {
      const admins = db.getAllAdmins();
      res.json({ success: true, admins });
    } catch (err) {
      console.error('[Admin] getAdmins error:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve administrative accounts.' });
    }
  },

  createAdmin(req, res) {
    try {
      const { memberId, studentName, password, role, permissions, officerTitle } = req.body || {};
      const newAdmin = db.createAdminAccount({
        memberId,
        studentName,
        password,
        role: role === 'president' ? 'president' : 'admin',
        permissions,
        officerTitle
      });
      res.status(201).json({
        success: true,
        message: `Administrative account "${newAdmin.studentName}" (${newAdmin.memberId}) created successfully.`,
        admin: newAdmin
      });
    } catch (err) {
      console.error('[Admin] createAdmin error:', err);
      res.status(400).json({ success: false, error: err.message || 'Failed to create administrative account.' });
    }
  },

  updateAdminPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body || {};
      db.updateAdminPassword(id, newPassword);
      res.json({ success: true, message: 'Administrator security credentials updated successfully.' });
    } catch (err) {
      console.error('[Admin] updateAdminPassword error:', err);
      res.status(400).json({ success: false, error: err.message || 'Failed to update credentials.' });
    }
  },

  deleteAdmin(req, res) {
    try {
      const { id } = req.params;
      db.deleteAdminAccount(id);
      res.json({ success: true, message: 'Administrator account deleted successfully.' });
    } catch (err) {
      console.error('[Admin] deleteAdmin error:', err);
      res.status(400).json({ success: false, error: err.message || 'Failed to delete administrator.' });
    }
  },

  exportDatabase(_req, res) {
    try {
      const exportData = db.getDatabaseExport();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=arx_club_database_backup_${Date.now()}.json`);
      res.json(exportData);
    } catch (err) {
      console.error('[Admin] exportDatabase error:', err);
      res.status(500).json({ success: false, error: 'Database export failed.' });
    }
  },

  getAuditLogs(_req, res) {
    try {
      const logs = db.getAuditLogs();
      res.json({ success: true, logs });
    } catch (err) {
      console.error('[Admin] getAuditLogs error:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve system audit logs.' });
    }
  },

  // Student Project Submissions Review Methods
  getProjectSubmissions(req, res) {
    try {
      const { status, memberId } = req.query;
      const submissions = db.getStudentProjectSubmissions({ status, memberId });
      res.json({ success: true, submissions });
    } catch (err) {
      console.error('[Admin] getProjectSubmissions error:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve student project submissions.' });
    }
  },

  async reviewProjectSubmission(req, res) {
    try {
      const { id } = req.params;
      const { status, reviewNotes } = req.body || {};
      if (!status || !['pending', 'approved', 'needs_revision', 'rejected'].includes(status)) {
        res.status(400).json({ success: false, error: 'Valid review status is required (pending, approved, needs_revision, rejected).' });
        return;
      }

      const reviewerName = req.user?.studentName || (req.user?.role === 'president' ? 'Club President' : 'Club Administrator');
      const updated = db.reviewStudentProjectSubmission(id, {
        status,
        reviewNotes: reviewNotes ? sanitizeText(reviewNotes.trim()) : '',
        reviewerName
      });

      if (!updated) {
        res.status(404).json({ success: false, error: 'Project submission record not found.' });
        return;
      }

      // Notify student via Telegram bot if telegramUserId is available
      if (updated.telegramUserId) {
        try {
          const statusLabels = {
            approved: '🎉 APPROVED',
            needs_revision: '✏️ NEEDS REVISION',
            rejected: '❌ NOT ACCEPTED',
            pending: '⏳ UNDER REVIEW'
          };
          const statusText = statusLabels[status] || status.toUpperCase();
          const notifyMsg = `📋 *Student Project Review Update*\n\n` +
            `• *Project:* *${updated.title}*\n` +
            `• *Decision:* ${statusText}\n` +
            `• *Reviewed By:* ${reviewerName}\n` +
            (reviewNotes ? `• *Reviewer Notes:* ${sanitizeText(reviewNotes.trim())}\n\n` : '\n') +
            `You can check status or submit revised work directly through the Telegram bot.`;
          await sendTelegramMessage(updated.telegramUserId, notifyMsg);
        } catch (tgErr) {
          console.warn('[Admin] Failed to notify student on Telegram:', tgErr?.message);
        }
      }

      res.json({ success: true, message: `Project submission marked as "${status}".`, submission: updated });
    } catch (err) {
      console.error('[Admin] reviewProjectSubmission error:', err);
      res.status(500).json({ success: false, error: 'Failed to review project submission.' });
    }
  },

  downloadProjectSubmissionFile(req, res) {
    try {
      const { id } = req.params;
      const submission = db.findStudentProjectSubmissionById(id);
      if (!submission) {
        res.status(404).json({ success: false, error: 'Project submission record not found.' });
        return;
      }

      if (!submission.storagePath || !fs.existsSync(submission.storagePath)) {
        res.status(404).json({ success: false, error: 'Project file was not found on server.' });
        return;
      }

      // Security check: verify storage path is strictly within the uploads folder
      const uploadsDir = path.resolve(process.cwd(), 'uploads');
      const resolved = path.resolve(submission.storagePath);
      if (!resolved.startsWith(uploadsDir)) {
        res.status(403).json({ success: false, error: 'Access denied: invalid file path.' });
        return;
      }

      const safeName = path.basename(submission.fileName || 'project_file').replace(/[^\w\.\-\_]/g, '_');
      res.setHeader('Content-Type', submission.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
      return res.sendFile(resolved);
    } catch (err) {
      console.error('[Admin] downloadProjectSubmissionFile error:', err);
      res.status(500).json({ success: false, error: 'Failed to download file.' });
    }
  },

  deleteProjectSubmission(req, res) {
    try {
      const { id } = req.params;
      const deleted = db.deleteStudentProjectSubmission(id);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Project submission not found.' });
        return;
      }
      res.json({ success: true, message: 'Project submission permanently deleted.' });
    } catch (err) {
      console.error('[Admin] deleteProjectSubmission error:', err);
      res.status(500).json({ success: false, error: 'Failed to delete project submission.' });
    }
  }
};
