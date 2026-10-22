import {} from '../middleware/authMiddleware.js';
import { db } from '../services/db.js';
import { verifyPassword } from '../utils/passwordUtils.js';
import { CONFIG } from '../config/index.js';

export const memberController = {
  getProfile(req, res) {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const member = db.findMemberById(req.user.id);
    if (!member) {
      res.status(404).json({ error: 'Member profile not found.' });
      return;
    }

    res.json({
      member: {
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
        createdAt: member.createdAt
      }
    });
  },

  updateProfile(req, res) {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { studentName, class: studentClass, phoneNumber, telegramUsername, award } = req.body;

    const updated = db.updateMemberProfile(req.user.id, {
      studentName,
      class: studentClass,
      phoneNumber,
      telegramUsername,
      award
    });

    if (!updated) {
      res.status(404).json({ error: 'Failed to update profile. Member not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      member: {
        id: updated.id,
        memberId: updated.memberId,
        studentName: updated.studentName,
        class: updated.class,
        phoneNumber: updated.phoneNumber,
        telegramUsername: updated.telegramUsername,
        telegramUserId: updated.telegramUserId,
        telegramActivated: Boolean(updated.telegramActivated),
        telegramLinkedAt: updated.telegramLinkedAt,
        award: updated.award,
        role: updated.role,
        status: updated.status,
        createdAt: updated.createdAt
      }
    });
  },

  changePassword(req, res) {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Both current password and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      res.status(400).json({ error: 'New passwords do not match.' });
      return;
    }

    const member = db.findMemberById(req.user.id);
    if (!member) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    if (!verifyPassword(currentPassword, member.passwordHash)) {
      res.status(400).json({ error: 'Incorrect current password.' });
      return;
    }

    db.updateMemberPassword(req.user.id, newPassword);

    res.json({ success: true, message: 'Password changed successfully.' });
  },

  getCourses(req, res) {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const enrollments = db.getMemberEnrollments(req.user.id);
    const allCourses = db.getCourses(false);

    const memberCourses = enrollments.map((e) => {
      const course = allCourses.find((c) => c.id === e.courseId || c.slug === e.courseId);
      return {
        ...e,
        course: course || null
      };
    });

    res.json({ courses: memberCourses });
  },

  getCertificates(req, res) {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const certs = db.getMemberCertificates(req.user.id);
    res.json({ certificates: certs });
  },

  getAwards(req, res) {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const awards = db.getMemberAwards(req.user.id);
    res.json({ awards });
  },

  getProjects(req, res) {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const projects = db.getMemberProjects(req.user.studentName, req.user.memberId);
    res.json({ projects });
  },

  getDashboardSummary(req, res) {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const member = db.findMemberById(req.user.id);
    const enrollments = db.getMemberEnrollments(req.user.id);
    const completedCourses = enrollments.filter((e) => e.progress === 100 || e.status === 'Completed').length;
    const activeCourses = enrollments.filter(
      (e) => e.status === 'Active' || e.status === 'In Progress' || e.progress > 0 && e.progress < 100
    ).length;
    const certificates = db.getMemberCertificates(req.user.id);
    const awards = db.getMemberAwards(req.user.id);
    const activities = db.getMemberActivities(req.user.id);

    
    const attendanceRecords = db.getMemberAttendance(req.user.id);
    const totalSessions = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((r) => r.status === 'Present').length;
    const lateCount = attendanceRecords.filter((r) => r.status === 'Late').length;
    const absentCount = attendanceRecords.filter((r) => r.status === 'Absent').length;
    const attendancePercentage = totalSessions > 0 ? Math.round(presentCount / totalSessions * 100) : 100;
    const isCertificateEligible = attendancePercentage >= 80;

    
    const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
    const allAssignments = db.getAssignments(undefined, true);
    const memberAssignments = allAssignments.filter(
      (a) => a.courseId === 'general' || enrolledCourseIds.has(a.courseId)
    );
    const memberSubmissions = member?.memberId ? db.getMemberSubmissions(member.memberId) : [];
    const submittedAsgIds = new Set(memberSubmissions.map((s) => s.assignmentId));
    const pendingAssignmentsCount = memberAssignments.filter((a) => !submittedAsgIds.has(a.id)).length;

    
    const activeAttendanceWindow = db.getActiveAttendanceSession();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = attendanceRecords.find((r) => r.date === todayStr) || null;

    res.json({
      stats: {
        totalCourses: enrollments.length,
        activeCourses,
        completedCourses,
        certificatesCount: certificates.length,
        awardsCount: awards.length,
        totalSessions,
        presentCount,
        lateCount,
        absentCount,
        attendancePercentage,
        isCertificateEligible,
        assignmentsCount: memberAssignments.length,
        pendingAssignmentsCount
      },
      attendance: {
        records: attendanceRecords,
        totalSessions,
        presentCount,
        lateCount,
        absentCount,
        attendancePercentage,
        isCertificateEligible,
        activeWindow: activeAttendanceWindow,
        todayRecord
      },
      assignments: {
        total: memberAssignments.length,
        pending: pendingAssignmentsCount,
        submitted: memberSubmissions.length
      },
      recentActivities: activities
    });
  },

  
  getActivationStatus(req, res) {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const member = db.findMemberById(req.user.id);
    if (!member) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    const settings = db.getSettings();

    if (member.telegramActivated && member.telegramUserId) {
      res.json({
        activated: true,
        memberId: member.memberId,
        telegramUserId: member.telegramUserId,
        telegramUsername: member.telegramUsername,
        telegramLinkedAt: member.telegramLinkedAt,
        botUsername: settings.telegramBotUsername || 'ARXITCLUB_bot',
        botUrl: settings.telegramBotUrl || 'https://t.me/ARXITCLUB_bot',
        channelName: settings.telegramChannelName || CONFIG.TELEGRAM_CHANNEL_HANDLE || '@arxitclub',
        channelUrl: settings.telegramChannelUrl || CONFIG.TELEGRAM_CHANNEL_LINK || 'https://t.me/arxitclub'
      });
      return;
    }

    
    let session = db.getPendingSessionForMember(member.memberId);
    if (!session) {
      session = db.createActivationSession(
        member.id,
        member.memberId,
        member.studentName,
        member.telegramUsername
      );
    }

    const botUrl = settings.telegramBotUrl || 'https://t.me/ARXITCLUB_bot';
    const activationUrl = `${botUrl}?start=${session.token}`;

    res.json({
      activated: false,
      memberId: member.memberId,
      session: {
        token: session.token,
        activationCode: session.activationCode,
        shortCode: session.shortCode,
        activationUrl,
        expiresAt: session.expiresAt,
        channelVerified: session.channelVerified
      },
      activationUrl,
      botUsername: settings.telegramBotUsername || 'ARXITCLUB_bot',
      botUrl,
      channelName: settings.telegramChannelName || CONFIG.TELEGRAM_CHANNEL_HANDLE || '@arxitclub',
      channelUrl: settings.telegramChannelUrl || CONFIG.TELEGRAM_CHANNEL_LINK || 'https://t.me/arxitclub'
    });
  },

  generateActivationLink(req, res) {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const member = db.findMemberById(req.user.id);
    if (!member) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }

    const session = db.createActivationSession(
      member.id,
      member.memberId,
      member.studentName,
      member.telegramUsername
    );

    const settings = db.getSettings();
    const botUrl = settings.telegramBotUrl || 'https://t.me/ARXITCLUB_bot';
    const activationUrl = `${botUrl}?start=${session.token}`;

    res.json({
      success: true,
      message: 'New Telegram activation session created.',
      session,
      activationUrl,
      botUsername: settings.telegramBotUsername || 'ARXITCLUB_bot',
      botUrl,
      channelName: settings.telegramChannelName || CONFIG.TELEGRAM_CHANNEL_HANDLE || '@arxitclub',
      channelUrl: settings.telegramChannelUrl || CONFIG.TELEGRAM_CHANNEL_LINK || 'https://t.me/arxitclub'
    });
  }
};
