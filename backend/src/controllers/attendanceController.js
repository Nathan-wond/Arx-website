import { db } from '../services/db.js';
import { getAddisAbabaNow, internationalToEthiopianTime } from '../utils/ethiopianTimeUtils.js';

export const attendanceController = {
  /**
   * Member Attendance Submission (Self-Service with Password Verification)
   * Enforces course enrollment, server-authoritative Ethiopian schedule boundaries (7:00-7:40),
   * PBKDF2 password authentication, duplicate prevention, and provisional review classification.
   */
  checkIn(req, res) {
    const memberId = req.body.memberId || req.user?.memberId;
    const password = req.body.password;
    const sessionId = req.body.sessionId;

    if (!memberId || !password) {
      res.status(400).json({ error: 'Member ID and account password are required for attendance verification.' });
      return;
    }

    const result = db.submitAttendanceSession({
      sessionId,
      memberId: String(memberId).trim(),
      password: String(password),
      userContext: req.user
    });

    if (!result.success) {
      let statusCode = 400;
      if (result.message.includes('Invalid password') || result.message.includes('not found')) {
        statusCode = 401;
      } else if (result.message.includes('not enrolled') || result.message.includes('behalf of another')) {
        statusCode = 403;
      } else if (result.isDuplicate) {
        statusCode = 409;
      }

      res.status(statusCode).json({
        error: result.message,
        isDuplicate: !!result.isDuplicate,
        isBoundaryRejection: !!result.isBoundaryRejection,
        record: result.record
      });
      return;
    }

    res.json({
      success: true,
      message: result.message,
      record: result.record,
      classification: result.classification,
      reviewStatus: result.reviewStatus
    });
  },

  /**
   * Live Server Clock & Active Attendance Status
   * Authoritative server time in Africa/Addis_Ababa and Ethiopian clock display.
   */
  getStatus(req, res) {
    const addis = getAddisAbabaNow();
    const ethInfo = internationalToEthiopianTime(addis.timeStr);
    const sessions = db.getAvailableAttendanceSessions(req.user);
    const activeSession = sessions.find(s => s.window.isOpen) || null;

    let checkedInToday = false;
    let todayRecord = null;

    if (req.user) {
      const history = db.getMemberAttendanceHistory(req.user);
      const found = history.records.find(r => r.date === addis.dateStr);
      if (found) {
        checkedInToday = true;
        todayRecord = found;
      }
    }

    res.json({
      serverTime: {
        addisAbabaDate: addis.dateStr,
        addisAbabaTime: addis.timeStr,
        ethiopianTime: ethInfo.ethiopianTime,
        ethiopianPeriod: ethInfo.period,
        formattedDual: ethInfo.formatted
      },
      isOpen: !!activeSession,
      activeSession,
      checkedInToday,
      todayRecord,
      availableSessionsCount: sessions.length
    });
  },

  /**
   * List available course-linked sessions for the member
   */
  getAvailableSessions(req, res) {
    const sessions = db.getAvailableAttendanceSessions(req.user);
    const addis = getAddisAbabaNow();
    const ethInfo = internationalToEthiopianTime(addis.timeStr);

    res.json({
      serverTime: {
        date: addis.dateStr,
        time: addis.timeStr,
        ethiopianTime: ethInfo.ethiopianTime,
        formatted: ethInfo.formatted
      },
      sessions
    });
  },

  /**
   * Authenticated Member's Complete Attendance History & Qualification Status
   */
  getMyHistory(req, res) {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const history = db.getMemberAttendanceHistory(req.user);
    res.json(history);
  },

  // ─── ADMINISTRATIVE SUITE ───────────────────────────────────────────────
  /**
   * List all attendance sessions with live metrics (submissions, unsubmitted counts)
   */
  getAdminSessions(req, res) {
    const sessions = db.getAllAttendanceSessions();
    const records = db.getAllAttendanceRecords();

    const sessionsWithStats = sessions.map(sess => {
      const sessRecords = records.filter(r => r.sessionId === sess.id);
      const presentCount = sessRecords.filter(r => (r.finalClassification || r.status) === 'Present').length;
      const lateCount = sessRecords.filter(r => (r.finalClassification || r.status) === 'Late').length;
      const absentCount = sessRecords.filter(r => (r.finalClassification || r.status) === 'Absent').length;
      const pendingReviewCount = sessRecords.filter(r => r.reviewStatus === 'Pending').length;

      const enrolled = db.getEnrolledMembersForCourse(sess.courseId);

      return {
        ...sess,
        stats: {
          totalSubmissions: sessRecords.length,
          presentCount,
          lateCount,
          absentCount,
          pendingReviewCount,
          enrolledCount: enrolled.length,
          unsubmittedCount: Math.max(0, enrolled.length - sessRecords.length)
        }
      };
    });

    res.json({ sessions: sessionsWithStats });
  },

  createAdminSession(req, res) {
    const creator = req.user?.studentName || 'Club Admin';
    const session = db.createAttendanceSession(req.body, creator);
    res.json({ success: true, session });
  },

  updateAdminSession(req, res) {
    const { id } = req.params;
    const session = db.updateAttendanceSession(id, req.body);
    if (!session) {
      res.status(404).json({ error: 'Attendance session not found.' });
      return;
    }
    res.json({ success: true, session });
  },

  deleteAdminSession(req, res) {
    const { id } = req.params;
    const success = db.deleteAttendanceSession(id);
    if (!success) {
      res.status(404).json({ error: 'Attendance session not found.' });
      return;
    }
    res.json({ success: true, message: 'Attendance session deleted.' });
  },

  /**
   * List enrolled students who have not yet submitted attendance for a session
   */
  getUnsubmittedMembers(req, res) {
    const { id } = req.params;
    const unsubmitted = db.getUnsubmittedEnrolledMembers(id);
    res.json({ unsubmitted, count: unsubmitted.length });
  },

  /**
   * Finalize Absences for a session (Must be at or after 7:40 Ethiopian time on session date)
   */
  finalizeAbsences(req, res) {
    const { id } = req.params;
    const adminName = req.user?.studentName || req.user?.memberId || 'Club Admin';
    const result = db.finalizeSessionAbsences(id, adminName);

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json(result);
  },

  /**
   * Master Attendance Records Table with multi-criteria filtering
   */
  getAll(req, res) {
    const filter = {
      sessionId: req.query.sessionId,
      courseId: req.query.courseId,
      reviewStatus: req.query.reviewStatus,
      classification: req.query.classification || req.query.status,
      date: req.query.date,
      q: req.query.q
    };

    const records = db.getAllAttendanceRecords(filter);
    res.json({ records, total: records.length });
  },

  /**
   * Administrative Review: Approve or Reject submission with reason
   */
  reviewRecord(req, res) {
    const { id } = req.params;
    const { reviewStatus, rejectionReason } = req.body;
    const reviewer = req.user?.studentName || 'Club Admin';

    if (!reviewStatus || !['Approved', 'Rejected', 'Pending'].includes(reviewStatus)) {
      res.status(400).json({ error: 'Valid reviewStatus (Approved, Rejected, or Pending) is required.' });
      return;
    }

    const result = db.reviewAttendanceRecord(id, {
      reviewStatus,
      rejectionReason,
      reviewedBy: reviewer
    });

    if (!result.success) {
      res.status(404).json({ error: result.message });
      return;
    }

    res.json(result);
  },

  /**
   * Classification Override / Manual Correction
   */
  correctRecord(req, res) {
    const { id } = req.params;
    const { finalClassification, correctionNotes } = req.body;
    const corrector = req.user?.studentName || 'Club Admin';

    if (!finalClassification) {
      res.status(400).json({ error: 'finalClassification (Present, Late, or Absent) is required.' });
      return;
    }

    const result = db.correctAttendanceRecord(id, {
      finalClassification,
      correctionNotes,
      correctedBy: corrector
    });

    if (!result.success) {
      res.status(404).json({ error: result.message });
      return;
    }

    res.json(result);
  },

  createManual(req, res) {
    const record = db.createManualAttendanceRecord({
      ...req.body,
      reviewedBy: req.user?.studentName || 'Club Admin'
    });
    res.json({ success: true, record });
  },

  deleteRecord(req, res) {
    const { id } = req.params;
    const success = db.deleteAttendanceRecord(id);
    res.json({ success });
  },

  getConfigs(_req, res) {
    const configs = db.getAttendanceSessionConfigs();
    res.json({ configs });
  },

  updateConfigs(req, res) {
    const { configs } = req.body;
    if (!Array.isArray(configs)) {
      res.status(400).json({ error: 'Session configurations array is required.' });
      return;
    }
    db.updateAttendanceSessionConfigs(configs);
    res.json({ success: true, configs: db.getAttendanceSessionConfigs() });
  }
};
