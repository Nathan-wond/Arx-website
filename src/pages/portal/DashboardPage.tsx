import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRouter } from '../../context/RouterContext.tsx';
import { api } from '../../services/api.js';
import Icon from '../../components/Icon.tsx';

export const DashboardPage: React.FC = () => {
  const { member } = useAuth();
  const { navigate } = useRouter();

  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    certificatesCount: 0,
    awardsCount: 0
  });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      api.getMyEnrollments().catch(() => ({ enrollments: [] })),
      api.getMyCertificates().catch(() => ({ certificates: [] })),
      api.getMyAwards().catch(() => ({ awards: [] })),
      api.getAnnouncements().catch(() => ({ announcements: [] })),
      api.getMyAttendance().catch(() => ({ attendance: null }))
    ]).then(([enrRes, certRes, awardRes, annRes, attRes]: [any, any, any, any, any]) => {
      if (!mounted) return;
      const totalC = enrRes?.enrollments?.length || 0;
      const compC = (enrRes?.enrollments || []).filter((e: any) => e.progress === 100 || e.status === 'Completed').length;
      const certC = certRes?.certificates?.length || 0;
      const awC = awardRes?.awards?.length || 0;

      setStats({
        totalCourses: totalC,
        completedCourses: compC,
        certificatesCount: certC,
        awardsCount: awC
      });

      if (annRes?.announcements) setAnnouncements(annRes.announcements);
      if (attRes?.attendance) setAttendance(attRes.attendance);
    }).finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleCheckIn = () => {
    navigate('/portal/attendance');
  };

  const firstName = member?.studentName ? member.studentName.split(' ')[0] : 'Member';

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#282828]/60 dark:text-white">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-[#FC6454] dark:text-[#6BB89E] font-medium">Dashboard</span>
            <span>/</span>
            <span>Overview</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">
            Student Operations Desk
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-[#EFE6DE]/60 dark:bg-[#15362B] text-[#282828]/70 dark:text-white border border-[#282828]/10 dark:border-[#25473C]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Computer Lab 3 · Spring 2026
          </span>
        </div>
      </div>

      {/* Greeting Card */}
      <div className="p-6 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-gradient-to-r from-[#FC6454]/10 via-transparent to-[#2F8068]/10 dark:from-[#2F8068]/20 dark:to-transparent flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-[#FC6454] dark:text-[#6BB89E] font-medium uppercase tracking-wider">
            SESSION ACTIVE • ID: {member?.memberId || 'TI000000'}
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-[#282828] dark:text-white font-sans">
            Welcome back, {firstName}!
          </h3>
          <p className="text-xs text-[#282828]/70 dark:text-white">
            St. Joseph School IT Club • Class {member?.class || 'Senior'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCheckIn}
            disabled={checkingIn}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all cursor-pointer border-0 shadow-xs active:scale-95 shrink-0"
          >
            {checkingIn ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Checking In...</span>
              </>
            ) : (
              <>
                <Icon name="CheckCircle" className="w-4 h-4" />
                <span>Lab Check-In Today</span>
              </>
            )}
          </button>
        </div>
      </div>

      {checkInMessage && (
        <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 text-xs flex items-center gap-2">
          <Icon name="Bell" className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <span>{checkInMessage}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/portal/courses')}
          className="p-5 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] cursor-pointer hover:border-[#FC6454]/40 transition-colors shadow-xs space-y-1"
        >
          <div className="flex items-center justify-between text-[#282828]/60 dark:text-white">
            <span className="text-xs font-medium">My Courses</span>
            <Icon name="BookOpen" className="w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]" />
          </div>
          <span className="text-2xl font-bold font-mono text-[#282828] dark:text-white block">
            {stats.totalCourses}
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-[#58B889] font-medium">
            {stats.completedCourses} Completed
          </span>
        </div>

        <div
          onClick={() => navigate('/portal/certificates')}
          className="p-5 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] cursor-pointer hover:border-[#FC6454]/40 transition-colors shadow-xs space-y-1"
        >
          <div className="flex items-center justify-between text-[#282828]/60 dark:text-white">
            <span className="text-xs font-medium">Certificates</span>
            <Icon name="Award" className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-bold font-mono text-[#282828] dark:text-white block">
            {stats.certificatesCount}
          </span>
          <span className="text-[11px] text-[#282828]/60 dark:text-white">
            Verified Credentials
          </span>
        </div>

        <div
          onClick={() => navigate('/portal/awards')}
          className="p-5 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] cursor-pointer hover:border-[#FC6454]/40 transition-colors shadow-xs space-y-1"
        >
          <div className="flex items-center justify-between text-[#282828]/60 dark:text-white">
            <span className="text-xs font-medium">Honors &amp; Badges</span>
            <Icon name="Trophy" className="w-4 h-4 text-yellow-500" />
          </div>
          <span className="text-2xl font-bold font-mono text-[#282828] dark:text-white block">
            {stats.awardsCount}
          </span>
          <span className="text-[11px] text-[#282828]/60 dark:text-white">
            Medals Earned
          </span>
        </div>

        <div
          onClick={() => navigate('/portal/attendance')}
          className="p-5 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] cursor-pointer hover:border-[#FC6454]/40 transition-colors shadow-xs space-y-1"
        >
          <div className="flex items-center justify-between text-[#282828]/60 dark:text-white">
            <span className="text-xs font-medium">Lab Attendance</span>
            <Icon name="Clock" className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-[#58B889] block">
            {attendance?.percentage ? `${attendance.percentage}%` : '100%'}
          </span>
          <span className="text-[11px] text-[#282828]/60 dark:text-white">
            View Lab Roster &amp; Status →
          </span>
        </div>
      </div>

      {/* Announcements Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#282828] dark:text-white font-mono">
            Club Announcements
          </h3>
          {announcements.length === 0 ? (
            <div className="p-8 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] text-center text-xs text-[#282828]/60 dark:text-white">
              No active announcements. Check Telegram bot @ARXITCLUB_bot for live notifications.
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#FC6454]/10 dark:bg-[#2F8068]/20 text-[#FC6454] dark:text-[#6BB89E]">
                      {ann.tag || 'Notice'}
                    </span>
                    <span className="text-[11px] font-mono text-[#282828]/50 dark:text-white">
                      {ann.date || ''}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#282828] dark:text-white">
                    {ann.title}
                  </h4>
                  <p className="text-xs text-[#282828]/70 dark:text-white leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Utilities */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#282828] dark:text-white font-mono">
            Fast Utilities
          </h3>
          <div className="p-5 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-3 shadow-xs text-xs">
            <button
              onClick={() => navigate('/portal/courses')}
              className="w-full text-left p-3 rounded-lg border border-[#282828]/10 dark:border-[#25473C] hover:bg-[#EFE6DE]/60 dark:hover:bg-[#15362B] transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Icon name="BookOpen" className="w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]" />
                <span className="font-semibold text-[#282828] dark:text-white">Resume Coursework</span>
              </div>
              <Icon name="ArrowRight" className="w-3.5 h-3.5 text-[#282828]/40 dark:text-white" />
            </button>

            <button
              onClick={() => navigate('/portal/certificates')}
              className="w-full text-left p-3 rounded-lg border border-[#282828]/10 dark:border-[#25473C] hover:bg-[#EFE6DE]/60 dark:hover:bg-[#15362B] transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Icon name="Award" className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-[#282828] dark:text-white">Download Credentials</span>
              </div>
              <Icon name="ArrowRight" className="w-3.5 h-3.5 text-[#282828]/40 dark:text-white" />
            </button>

            <button
              onClick={() => navigate('/portal/projects')}
              className="w-full text-left p-3 rounded-lg border border-[#282828]/10 dark:border-[#25473C] hover:bg-[#EFE6DE]/60 dark:hover:bg-[#15362B] transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Icon name="FolderGit2" className="w-4 h-4 text-emerald-600 dark:text-[#58B889]" />
                <span className="font-semibold text-[#282828] dark:text-white">Submit Project Proposal</span>
              </div>
              <Icon name="ArrowRight" className="w-3.5 h-3.5 text-[#282828]/40 dark:text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
