import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.js';
import Icon from '../../components/Icon.tsx';

interface SessionItem {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  date: string;
  ethiopianOpenTime: string;
  ethiopianPresentCutoff: string;
  ethiopianLateCutoff: string;
  internationalOpenTime: string;
  internationalPresentCutoff: string;
  internationalLateCutoff: string;
  instructions?: string;
  status: string;
  isEligible: boolean;
  window: {
    isOpen: boolean;
    isUpcoming: boolean;
    isClosed: boolean;
    canSubmit: boolean;
    state: string;
    provisionalClassification?: string;
    message: string;
  };
  alreadySubmitted: boolean;
  memberRecord?: any;
}

export const MyAttendancePage: React.FC = () => {
  const { member } = useAuth();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [history, setHistory] = useState<any>({
    records: [],
    totalSessions: 0,
    presentSessions: 0,
    lateSessions: 0,
    absentSessions: 0,
    attendanceRate: 100,
    isCertificateEligible: true
  });
  const [serverTime, setServerTime] = useState<{
    date?: string;
    time?: string;
    ethiopianTime?: string;
    formatted?: string;
  }>({});
  const [loading, setLoading] = useState(true);

  // Check-in modal state
  const [activeCheckInSession, setActiveCheckInSession] = useState<SessionItem | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<any | null>(null);

  // Live client-side Ethiopian Clock calculation
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [availRes, histRes] = await Promise.all([
        api.getAvailableAttendanceSessions().catch(() => ({ sessions: [], serverTime: {} })),
        api.getMyAttendanceHistory().catch(() => ({
          records: [],
          totalSessions: 0,
          presentSessions: 0,
          lateSessions: 0,
          absentSessions: 0,
          attendanceRate: 100,
          isCertificateEligible: true
        }))
      ]);

      if (availRes?.sessions) setSessions(availRes.sessions);
      if (availRes?.serverTime) setServerTime(availRes.serverTime);
      if (histRes) setHistory(histRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds for live session state updates
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Compute live Ethiopian and EAT time display
  const clockDisplay = useMemo(() => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Addis_Ababa',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      const parts24 = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Addis_Ababa',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      }).formatToParts(currentTime);

      const h24 = parseInt(parts24.find(p => p.type === 'hour')?.value || '12', 10);
      const m = parts24.find(p => p.type === 'minute')?.value || '00';

      let ethHour = h24 >= 6 ? (h24 - 6) : (h24 + 6);
      if (ethHour === 0) ethHour = 12;
      let period = 'Daytime';
      if (h24 >= 6 && h24 < 12) period = 'Morning';
      else if (h24 === 12) period = 'Midday';
      else if (h24 > 12 && h24 < 18) period = 'Afternoon';
      else if (h24 === 18) period = 'Dusk';
      else period = 'Night';

      const eatFormatted = formatter.format(currentTime);
      const ethFormatted = `${ethHour}:${m} ${period}`;

      return {
        ethFormatted,
        eatFormatted,
        ethHour,
        period
      };
    } catch {
      return {
        ethFormatted: '7:00 Afternoon',
        eatFormatted: '1:00 PM EAT',
        ethHour: 7,
        period: 'Afternoon'
      };
    }
  }, [currentTime]);

  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCheckInSession || !member?.memberId || !password) {
      setSubmitError('Please enter your account password.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await api.checkInAttendance({
        sessionId: activeCheckInSession.id,
        memberId: member.memberId,
        password
      });

      setSubmitSuccess(res);
      setPassword('');
      await loadData();
    } catch (err: any) {
      setSubmitError(err.message || 'Check-in failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeCheckInModal = () => {
    setActiveCheckInSession(null);
    setPassword('');
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#282828]/60 dark:text-white">
            <span>Workspace</span>
            <span>/</span>
            <span>Portal</span>
            <span>/</span>
            <span className="text-[#FC6454] dark:text-[#6BB89E] font-medium">Lab Attendance</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">
            Computer Lab 3 Attendance Management
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#282828]/15 dark:border-[#25473C] bg-white dark:bg-[#102B22] text-xs font-semibold text-[#282828] dark:text-white hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] transition-colors cursor-pointer"
          >
            <Icon name="RefreshCw" className="w-3.5 h-3.5" />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Authoritative Ethiopian Clock & Schedule Matrix Banner */}
      <div className="p-5 sm:p-6 rounded-2xl border border-[#FC6454]/20 dark:border-[#2F8068]/30 bg-gradient-to-br from-[#FC6454]/10 via-white/70 to-[#2F8068]/10 dark:from-[#0A211A] dark:via-[#102B22] dark:to-[#071A14] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#FC6454] dark:text-[#6BB89E] font-bold">
                Live Server Clock · Africa/Addis_Ababa (EAT)
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-[#282828] dark:text-white">
                {clockDisplay.ethFormatted}
              </span>
              <span className="text-xs sm:text-sm font-mono text-[#282828]/60 dark:text-white">
                ({clockDisplay.eatFormatted})
              </span>
            </div>
            <p className="text-xs text-[#282828]/70 dark:text-white">
              All attendance check-ins are evaluated with server-authoritative timestamps in the Ethiopian clock system.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-[#071A14]/80 border border-[#282828]/10 dark:border-[#25473C] text-xs space-y-2 shrink-0 md:max-w-xs">
            <div className="font-mono text-[10px] uppercase font-bold text-[#FC6454] dark:text-[#6BB89E]">
              Strict Lab Schedule Windows
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-semibold">
                <span>7:00 – 7:30 Ethiopian</span>
                <span>Present</span>
              </div>
              <div className="flex justify-between items-center text-amber-700 dark:text-amber-400 font-semibold">
                <span>7:30 – 7:40 Ethiopian</span>
                <span>Late Window</span>
              </div>
              <div className="flex justify-between items-center text-rose-700 dark:text-rose-400 font-semibold">
                <span>7:40+ Ethiopian</span>
                <span>Closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Metrics & Certificate Qualification Threshold */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] shadow-xs space-y-1">
          <span className="text-[10px] font-mono uppercase text-[#282828]/50 dark:text-white block">Total Sessions</span>
          <span className="text-2xl font-bold font-mono text-[#282828] dark:text-white">{history.totalSessions}</span>
          <span className="text-[10px] text-[#282828]/60 dark:text-white block">Recorded roster</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#102B22] border border-emerald-500/20 shadow-xs space-y-1">
          <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 block">On-Time (Present)</span>
          <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{history.presentSessions}</span>
          <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 block">Verified on-time</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#102B22] border border-amber-500/20 shadow-xs space-y-1">
          <span className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400 block">Late Check-Ins</span>
          <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{history.lateSessions}</span>
          <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80 block">During late window</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#102B22] border border-rose-500/20 shadow-xs space-y-1">
          <span className="text-[10px] font-mono uppercase text-rose-600 dark:text-rose-400 block">Missed (Absent)</span>
          <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">{history.absentSessions}</span>
          <span className="text-[10px] text-rose-700/80 dark:text-rose-300/80 block">Finalized absence</span>
        </div>
      </div>

      {/* Qualification Progress Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#282828] dark:text-white flex items-center gap-2">
              <Icon name="Award" className="w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]" />
              <span>Official Certificate Qualification Threshold</span>
            </span>
            <span className="font-mono text-xs font-extrabold text-[#282828] dark:text-white">
              {history.attendanceRate}% Standing
            </span>
          </div>

          <div className="w-full bg-[#EFE6DE] dark:bg-[#071A14] h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                history.attendanceRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, history.attendanceRate)}%` }}
            />
          </div>

          <p className="text-[11px] text-[#282828]/60 dark:text-white">
            Minimum <strong>80%</strong> lab attendance is required to qualify for verifiable course completion certificates.
          </p>
        </div>

        <div className="shrink-0">
          {history.isCertificateEligible ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <Icon name="CheckCircle" className="w-3.5 h-3.5 text-emerald-600" />
              <span>Certificate Qualified (≥ 80%)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              <Icon name="AlertTriangle" className="w-3.5 h-3.5 text-amber-600" />
              <span>Below Threshold (&lt; 80%)</span>
            </span>
          )}
        </div>
      </div>

      {/* Available Sessions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#282828] dark:text-white flex items-center gap-2 font-sans">
            <Icon name="Calendar" className="w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]" />
            <span>Course Attendance Sessions</span>
          </h3>
          <span className="text-xs font-mono text-[#282828]/60 dark:text-white">
            {sessions.length} Session{sessions.length === 1 ? '' : 's'} Configured
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#102B22] border border-dashed border-[#282828]/20 dark:border-[#25473C] rounded-xl text-xs text-[#282828]/60 dark:text-white">
            No attendance sessions currently published for your enrolled courses.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((sess) => {
              const isOpen = sess.window?.isOpen;
              const isUpcoming = sess.window?.isUpcoming;
              const isClosed = sess.window?.isClosed;
              const alreadySubmitted = sess.alreadySubmitted;
              const isLateWindow = sess.window?.state === 'open_late';

              return (
                <div
                  key={sess.id}
                  className="p-5 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FC6454]/10 dark:bg-[#2F8068]/30 text-[#FC6454] dark:text-[#6BB89E] border border-[#FC6454]/20 dark:border-[#2F8068]/40">
                        {sess.courseTitle}
                      </span>

                      {/* State Badge */}
                      {alreadySubmitted ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200">
                          SUBMITTED
                        </span>
                      ) : isOpen ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold animate-pulse ${
                          isLateWindow
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                        }`}>
                          {isLateWindow ? 'OPEN: LATE WINDOW' : 'OPEN: ON-TIME'}
                        </span>
                      ) : isUpcoming ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200">
                          UPCOMING
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200">
                          CLOSED
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#282828] dark:text-white font-sans">
                        {sess.title}
                      </h4>
                      <p className="text-xs text-[#282828]/70 dark:text-white mt-0.5">
                        {sess.instructions || 'Sign in with your Member ID and password.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#282828]/5 dark:border-[#25473C] grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-[#282828]/40 dark:text-white block text-[9px] uppercase">Session Date</span>
                        <span className="font-semibold text-[#282828] dark:text-white">{sess.date}</span>
                      </div>
                      <div>
                        <span className="text-[#282828]/40 dark:text-white block text-[9px] uppercase">Schedule Window</span>
                        <span className="font-semibold text-[#282828] dark:text-white">
                          {sess.ethiopianOpenTime} – {sess.ethiopianLateCutoff} Eth ({sess.internationalOpenTime} – {sess.internationalLateCutoff})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submission Status or Action Button */}
                  <div className="pt-3 border-t border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between">
                    {alreadySubmitted ? (
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                          <Icon name="CheckCircle" className="w-3.5 h-3.5" />
                          <span>Submitted: {sess.memberRecord?.initialClassification || 'Present'}</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#282828]/50 dark:text-white">
                          Review: <strong className={sess.memberRecord?.reviewStatus === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}>{sess.memberRecord?.reviewStatus || 'Pending'}</strong>
                        </div>
                      </div>
                    ) : isOpen ? (
                      <button
                        onClick={() => {
                          setActiveCheckInSession(sess);
                          setSubmitError(null);
                          setSubmitSuccess(null);
                        }}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs active:scale-95 transition-all inline-flex items-center justify-center gap-2"
                      >
                        <Icon name="CheckSquare" className="w-4 h-4" />
                        <span>Check In Now ({sess.window?.provisionalClassification || 'Present'})</span>
                      </button>
                    ) : (
                      <span className="text-xs text-[#282828]/60 dark:text-white italic">
                        {sess.window?.message || 'Form is closed.'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attendance History Roster Table */}
      <div className="rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] overflow-hidden shadow-xs space-y-3">
        <div className="p-4 border-b border-[#282828]/10 dark:border-[#25473C] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#282828] dark:text-white font-sans flex items-center gap-2">
              <Icon name="Clock" className="w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]" />
              <span>Your Official Lab Attendance Records</span>
            </h3>
            <p className="text-[11px] text-[#282828]/60 dark:text-white">
              Permanent log stamped with dual Ethiopian and international server time.
            </p>
          </div>
          <span className="text-xs font-mono text-[#282828]/50 dark:text-white">
            {history.records?.length || 0} Total Records
          </span>
        </div>

        {history.records?.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#282828]/50 dark:text-white">
            No attendance records logged yet. Check in when an attendance session opens.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#282828]/5 dark:bg-[#0A211A] border-b border-[#282828]/10 dark:border-[#25473C] font-mono text-[11px] text-[#282828]/70 dark:text-white">
                <tr>
                  <th className="p-3.5">Session / Course</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Server Timestamp</th>
                  <th className="p-3.5">Classification</th>
                  <th className="p-3.5">Officer Review</th>
                  <th className="p-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282828]/5 dark:divide-[#25473C]">
                {history.records.map((rec: any) => {
                  const isPresent = (rec.finalClassification || rec.status) === 'Present';
                  const isLate = (rec.finalClassification || rec.status) === 'Late';
                  const isAbsent = (rec.finalClassification || rec.status) === 'Absent';

                  const isApproved = rec.reviewStatus === 'Approved';
                  const isPending = rec.reviewStatus === 'Pending' || !rec.reviewStatus;
                  const isRejected = rec.reviewStatus === 'Rejected';

                  return (
                    <tr key={rec.id} className="hover:bg-[#282828]/[0.02] dark:hover:bg-[#15362B]/50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-[#282828] dark:text-white">{rec.sessionTitle || 'Lab Session'}</div>
                        <div className="font-mono text-[10px] text-[#282828]/50 dark:text-white">{rec.courseTitle || 'Curriculum Track'}</div>
                      </td>
                      <td className="p-3.5 font-mono text-xs text-[#282828] dark:text-white whitespace-nowrap">
                        {rec.date}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-[#282828]/70 dark:text-white">
                        <div>{rec.submissionTimeEthiopian || rec.time || '—'}</div>
                        {rec.submissionTimeInternational && (
                          <div className="text-[10px] text-[#282828]/40 dark:text-white">{rec.submissionTimeInternational}</div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isPresent
                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                            : isLate
                              ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                              : 'bg-rose-500/15 text-rose-800 dark:text-rose-300'
                        }`}>
                          {rec.finalClassification || rec.status || 'Present'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isApproved
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : isPending
                              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                        }`}>
                          {isApproved ? 'Approved' : isPending ? 'Pending Review' : 'Rejected'}
                        </span>
                        {rec.reviewedBy && (
                          <div className="text-[9px] font-mono text-[#282828]/40 dark:text-white mt-0.5">
                            by {rec.reviewedBy}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-[#282828]/70 dark:text-white max-w-xs truncate">
                        {rec.rejectionReason ? (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">Reason: {rec.rejectionReason}</span>
                        ) : rec.correctionNotes ? (
                          <span>{rec.correctionNotes}</span>
                        ) : (
                          <span className="text-[#282828]/40 dark:text-white">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Check-In Modal */}
      {activeCheckInSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#102B22] rounded-2xl border border-[#282828]/15 dark:border-[#25473C] p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#282828]/10 dark:border-[#25473C] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Icon name="CheckSquare" className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-sans text-[#282828] dark:text-white">
                    Lab Attendance Verification
                  </h3>
                  <p className="text-[10px] font-mono text-[#282828]/50 dark:text-white">
                    Computer Lab 3 · St. Joseph School
                  </p>
                </div>
              </div>
              <button
                onClick={closeCheckInModal}
                className="text-xs p-1.5 rounded hover:bg-[#282828]/5 dark:hover:bg-[#15362B] text-[#282828]/60 dark:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            {submitSuccess ? (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 mx-auto flex items-center justify-center">
                  <Icon name="CheckCircle" className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#282828] dark:text-white">
                    Attendance Verified!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    {submitSuccess.message}
                  </p>
                  <p className="text-[11px] text-[#282828]/60 dark:text-white pt-1">
                    Your check-in has been submitted for administrative officer approval. Your standing will update automatically.
                  </p>
                </div>
                <button
                  onClick={closeCheckInModal}
                  className="w-full py-2.5 rounded-lg text-xs font-bold bg-[#FC6454] dark:bg-[#2F8068] text-white cursor-pointer"
                >
                  Close &amp; Return to Dashboard
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitCheckIn} className="space-y-4 text-xs">
                {/* Session Summary Card */}
                <div className="p-3 rounded-lg bg-[#FAF4EE] dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] space-y-1">
                  <div className="text-[10px] font-mono uppercase text-[#FC6454] dark:text-[#6BB89E] font-bold">
                    {activeCheckInSession.courseTitle}
                  </div>
                  <div className="font-bold text-[#282828] dark:text-white">
                    {activeCheckInSession.title}
                  </div>
                  <div className="text-[11px] font-mono text-[#282828]/60 dark:text-white">
                    Server Clock: {clockDisplay.ethFormatted} ({clockDisplay.eatFormatted})
                  </div>
                </div>

                {submitError && (
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-medium text-xs">
                    {submitError}
                  </div>
                )}

                {/* Pre-filled Member ID */}
                <div>
                  <label className="block font-bold text-[#282828] dark:text-white mb-1 font-mono text-[11px]">
                    Verified Student Member ID
                  </label>
                  <input
                    type="text"
                    disabled
                    value={member?.memberId || 'TI------'}
                    className="w-full px-3 py-2 rounded-lg border border-[#282828]/15 dark:border-[#25473C] bg-[#282828]/5 dark:bg-[#071A14] text-[#282828] dark:text-white font-mono font-bold cursor-not-allowed"
                  />
                  <p className="text-[10px] text-[#282828]/50 dark:text-white mt-0.5">
                    Attributed to {member?.studentName} (Class {member?.class || 'N/A'})
                  </p>
                </div>

                {/* Account Password Input */}
                <div>
                  <label className="block font-bold text-[#282828] dark:text-white mb-1 font-mono text-[11px]">
                    Account Security Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your member password..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#25473C] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-[#282828]/40 dark:text-white hover:text-[#282828] cursor-pointer"
                    >
                      <Icon name={showPassword ? 'EyeOff' : 'Eye'} className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-[#282828]/50 dark:text-white mt-0.5">
                    Mandatory cryptographic verification to prevent buddy check-ins.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#282828]/10 dark:border-[#25473C]">
                  <button
                    type="button"
                    onClick={closeCheckInModal}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer border border-[#282828]/20 dark:border-[#25473C] bg-transparent text-[#282828] dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !password}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white cursor-pointer shadow-xs active:scale-95 transition-all inline-flex items-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Icon name="CheckCircle" className="w-4 h-4" />
                        <span>Confirm Attendance</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAttendancePage;
