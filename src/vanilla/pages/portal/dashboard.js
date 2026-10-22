import { authState, themeState, router } from '../../state.js';
import { api } from '../../../services/api.js';
import { icon } from '../../icons.js';

let dashData = {
  stats: {
    totalCourses: 0,
    completedCourses: 0,
    certificatesCount: 0,
    awardsCount: 0
  },
  activities: [],
  resources: [],
  announcements: [],
  projects: [],
  upcomingEvents: [],
  attendance: null,
  assignments: null,
  loading: true,
  copiedId: false,
  activationUrl: 'https://t.me/ARXITCLUB_bot',
  resourceNotice: null,
  checkingIn: false,
  checkInMessage: null
};

export function renderDashboardPage() {
  const member = authState.member;
  const isDark = themeState.theme === 'dark';
  const firstName = member?.studentName ? member.studentName.split(' ')[0] : 'Member';
  const { stats, activities, resources, announcements, projects, upcomingEvents, attendance, assignments, loading, copiedId, activationUrl, resourceNotice, checkingIn, checkInMessage } = dashData;

  return `
    <div id="portal-dashboard-root" class="space-y-8">
      <!-- Breadcrumb & Top Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
        <div>
          <div class="flex items-center gap-2 text-xs font-mono text-[#282828]/60 dark:text-white">
            <span>Workspace</span>
            <span>/</span>
            <span class="text-[#FC6454] dark:text-[#6BB89E] font-medium">Dashboard</span>
            <span>/</span>
            <span>Overview</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">
            Student Operations Desk
          </h2>
        </div>

        <div class="flex items-center gap-2.5">
          <span class="hidden md:inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-[#EFE6DE]/60 dark:bg-[#15362B] text-[#282828]/70 dark:text-white border border-[#282828]/10 dark:border-[#25473C]">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Lab 3 · Spring 2026
          </span>

          <button
            id="dash-theme-toggle"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#282828]/15 dark:border-[#25473C] bg-white dark:bg-[#102B22] hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] text-xs font-medium text-[#282828] dark:text-white transition-colors cursor-pointer"
            title="${isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}">
            ${isDark ? `
              ${icon('Sun', 'w-3.5 h-3.5 text-[#6BB89E]')}
              <span>Light</span>
            ` : `
              ${icon('Moon', 'w-3.5 h-3.5 text-[#282828]')}
              <span>Dark</span>
            `}
          </button>
        </div>
      </div>

      <!-- Welcome Banner Card -->
      <div class="rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs transition-colors duration-200">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="text-2xl sm:text-3xl font-bold text-[#282828] dark:text-white tracking-tight">
              Welcome back, ${firstName}
            </h1>
            <span class="text-xs font-mono px-2 py-0.5 rounded-sm bg-emerald-50 dark:bg-[#15362B] text-emerald-700 dark:text-[#58B889] border border-emerald-200 dark:border-[#25473C] font-medium">
              STATUS · ACTIVE
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs font-mono text-[#282828]/70 dark:text-white">
            <div class="flex items-center gap-1.5 bg-[#EFE6DE]/60 dark:bg-[#0A211A] px-2.5 py-1 rounded-md border border-[#282828]/10 dark:border-[#25473C]">
              <span class="text-[#282828]/50 dark:text-white">ID:</span>
              <strong class="text-[#FC6454] dark:text-[#6BB89E] font-bold">${member?.memberId || 'TI-2026-001'}</strong>
              <button
                id="dash-copy-id-btn"
                class="ml-1 text-[#282828]/50 dark:text-white hover:text-[#FC6454] dark:hover:text-[#6BB89E] transition-colors cursor-pointer border-0 bg-transparent p-0"
                title="Copy Member ID">
                ${copiedId ? icon('Check', 'w-3.5 h-3.5 text-emerald-500') : icon('Copy', 'w-3.5 h-3.5')}
              </button>
            </div>

            <span class="text-[#282828]/30 dark:text-[#25473C] hidden sm:inline">·</span>
            <div>
              <span class="text-[#282828]/50 dark:text-white">CLASS:</span>
              <strong class="text-[#282828] dark:text-white ml-1">${member?.class || '—'}</strong>
            </div>

            <span class="text-[#282828]/30 dark:text-[#25473C] hidden sm:inline">·</span>
            <div class="flex items-center gap-1.5">
              ${icon('Send', 'w-3.5 h-3.5 text-[#FC6454] dark:text-[#6BB89E]')}
              ${member?.telegramActivated && member?.telegramUserId ? `
                <span class="text-emerald-700 dark:text-[#58B889] font-medium">
                  Telegram Linked
                </span>
              ` : `
                <a
                  href="${activationUrl}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-[#FC6454] dark:text-[#6BB89E] hover:underline flex items-center gap-1 font-medium">
                  <span>Link Telegram Bot</span>
                </a>
              `}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2.5 self-start md:self-auto">
          <button
            data-nav="/portal/courses"
            class="inline-flex items-center justify-center font-sans tracking-tight select-none transition-colors duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#6BB89E]/40 cursor-pointer whitespace-nowrap shrink-0 text-xs sm:text-sm px-3.5 py-2 gap-2 font-medium bg-[#FC6454] text-white hover:bg-[#E04D3E] border border-[#FC6454] dark:bg-[#2F8068] dark:text-white dark:hover:bg-[#3A9277] dark:border-[#2F8068] dark:font-semibold shadow-xs">
            <span>My Courses</span>
            ${icon('ArrowRight', 'w-3.5 h-3.5 ml-1.5')}
          </button>
          <button
            data-nav="/portal/certificates"
            class="inline-flex items-center justify-center font-sans tracking-tight select-none transition-colors duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#6BB89E]/40 cursor-pointer whitespace-nowrap shrink-0 text-xs sm:text-sm px-3.5 py-2 gap-2 font-medium bg-transparent text-[#282828] hover:bg-[#FC6454]/10 border border-[#282828]/25 dark:text-white dark:hover:bg-[#2F8068]/20 dark:hover:text-white dark:border-[#25473C]">
            Certificates
          </button>
        </div>
      </div>

      <!-- Resource Notice Banner -->
      ${resourceNotice ? `
        <div class="p-3.5 bg-[#FC6454]/10 dark:bg-[#2F8068]/20 border border-[#FC6454]/30 dark:border-[#2F8068] rounded-md text-xs text-[#FC6454] dark:text-[#6BB89E] flex items-center gap-2">
          ${icon('CheckCircle2', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E] shrink-0')}
          <span>${resourceNotice}</span>
        </div>
      ` : ''}

      <!-- Telegram Activation Warning -->
      ${!member?.telegramActivated ? `
        <div class="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-start gap-3">
            ${icon('Send', 'w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5')}
            <div>
              <h4 class="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Action Required · Complete Telegram Activation
              </h4>
              <p class="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                Link your account to <strong class="font-mono">@ARXITCLUB_bot</strong> to receive instant credentials, lab notifications, and join our broadcast channel.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <a
              href="${activationUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-md transition-colors">
              ${icon('Send', 'w-3.5 h-3.5')}
              <span>Link Account</span>
            </a>
          </div>
        </div>
      ` : ''}

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-5 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#15362B] space-y-1 shadow-xs transition-colors">
          <span class="text-xs font-mono uppercase tracking-wider text-[#282828]/60 dark:text-white">
            Enrolled Courses
          </span>
          <p class="text-2xl sm:text-3xl font-bold text-[#282828] dark:text-white font-mono tabular-nums">
            ${stats.totalCourses}
          </p>
          <p class="text-[11px] text-[#282828]/50 dark:text-white">Active learning tracks</p>
        </div>

        <div class="p-5 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#15362B] space-y-1 shadow-xs transition-colors">
          <span class="text-xs font-mono uppercase tracking-wider text-[#282828]/60 dark:text-white">
            Completed Tracks
          </span>
          <p class="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-[#58B889] font-mono tabular-nums">
            ${stats.completedCourses}
          </p>
          <p class="text-[11px] text-[#282828]/50 dark:text-white">Finished curriculums</p>
        </div>

        <div class="p-5 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#15362B] space-y-1 shadow-xs transition-colors">
          <span class="text-xs font-mono uppercase tracking-wider text-[#282828]/60 dark:text-white">
            Verified Certificates
          </span>
          <p class="text-2xl sm:text-3xl font-bold text-[#FC6454] dark:text-[#6BB89E] font-mono tabular-nums">
            ${stats.certificatesCount}
          </p>
          <p class="text-[11px] text-[#282828]/50 dark:text-white">Issued credentials</p>
        </div>

        <div class="p-5 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#15362B] space-y-1 shadow-xs transition-colors">
          <span class="text-xs font-mono uppercase tracking-wider text-[#282828]/60 dark:text-white">
            Honors &amp; Awards
          </span>
          <p class="text-2xl sm:text-3xl font-bold text-[#282828] dark:text-white font-mono tabular-nums">
            ${stats.awardsCount}
          </p>
          <p class="text-[11px] text-[#282828]/50 dark:text-white">Competition records</p>
        </div>
      </div>

      <!-- Attendance & Eligibility Section -->
      <section id="attendance" class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#282828]/10 dark:border-[#25473C] pb-3">
          <div class="flex items-center gap-2">
            ${icon('Clock', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]')}
            <h2 class="text-sm font-semibold text-[#282828] dark:text-white uppercase tracking-wider font-mono">
              Computer Lab 3 Attendance &amp; Eligibility
            </h2>
          </div>
          <div class="flex items-center gap-2">
            ${attendance ? `
              <span class="inline-flex items-center rounded-sm select-none text-[11px] px-1.5 py-0.5 tracking-tight font-medium ${
                attendance.isCertificateEligible
                  ? 'bg-emerald-50 dark:bg-[#102B22] text-emerald-700 dark:text-[#58B889] border border-emerald-200 dark:border-[#25473C]'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-[#D6A84F] border border-amber-200 dark:border-amber-800/60'
              }">
                ${attendance.isCertificateEligible ? 'Eligible for Certificate (>=80%)' : 'Requires >=80% Attendance'}
              </span>
            ` : ''}
          </div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="p-4 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-1">
            <span class="text-[11px] font-mono uppercase text-[#282828]/60 dark:text-white block">
              Attendance Rate
            </span>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold font-mono text-[#FC6454] dark:text-[#6BB89E]">
                ${attendance?.attendancePercentage ?? 100}%
              </span>
              <span class="text-[11px] text-[#282828]/50 dark:text-white font-mono">
                (${attendance?.totalSessions || 0} sessions)
              </span>
            </div>
          </div>

          <div class="p-4 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-1">
            <span class="text-[11px] font-mono uppercase text-[#282828]/60 dark:text-white block">
              Present
            </span>
            <p class="text-2xl font-bold font-mono text-emerald-600 dark:text-[#58B889]">
              ${attendance?.presentCount || 0}
            </p>
          </div>

          <div class="p-4 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-1">
            <span class="text-[11px] font-mono uppercase text-[#282828]/60 dark:text-white block">
              Late Check-ins
            </span>
            <p class="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              ${attendance?.lateCount || 0}
            </p>
          </div>

          <div class="p-4 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-1">
            <span class="text-[11px] font-mono uppercase text-[#282828]/60 dark:text-white block">
              Absences
            </span>
            <p class="text-2xl font-bold font-mono text-[#282828]/60 dark:text-white">
              ${attendance?.absentCount || 0}
            </p>
          </div>
        </div>

        <!-- Attendance Action Card -->
        <div class="p-5 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full ${attendance?.activeWindow ? 'bg-emerald-500 animate-pulse' : 'bg-[#282828]/30 dark:bg-[#25473C]'}"></span>
              <h3 class="text-xs font-mono font-bold uppercase tracking-wider text-[#282828] dark:text-white">
                ${attendance?.activeWindow ? `Lab Session Active: ${attendance.activeWindow.name}` : 'Next Scheduled Session: Computer Lab 3'}
              </h3>
            </div>
            <p class="text-xs text-[#282828]/70 dark:text-white">
              ${attendance?.activeWindow
                ? `Window: ${attendance.activeWindow.startTime} – ${attendance.activeWindow.endTime}. Present status within ${attendance.activeWindow.presentUntilMinutes}m.`
                : 'Afternoon Session: 1:00 PM – 2:00 PM | Evening Session: 6:00 PM – 7:00 PM.'
              }
            </p>
            ${attendance?.todayRecord ? `
              <p class="text-xs font-mono text-emerald-700 dark:text-[#58B889] pt-1">
                ✓ Recorded today: <strong>${attendance.todayRecord.status}</strong> at ${attendance.todayRecord.time} (${attendance.todayRecord.sessionName})
              </p>
            ` : ''}
            ${checkInMessage ? `
              <p class="text-xs font-mono pt-1 ${checkInMessage.type === 'success' ? 'text-emerald-600 dark:text-[#58B889]' : 'text-rose-600 dark:text-rose-400'}">
                ${checkInMessage.text}
              </p>
            ` : ''}
          </div>

          <div class="flex items-center gap-2 shrink-0">
            ${attendance?.todayRecord ? `
              <span class="inline-flex items-center rounded-sm text-xs px-2 py-0.5 tracking-tight font-medium bg-emerald-50 dark:bg-[#102B22] text-emerald-700 dark:text-[#58B889] border border-emerald-200 dark:border-[#25473C]">
                ${icon('Check', 'w-3.5 h-3.5 mr-1')}
                Checked In Today
              </span>
            ` : attendance?.activeWindow ? `
              <button
                id="dash-check-in-btn"
                ${checkingIn ? 'disabled' : ''}
                class="inline-flex items-center justify-center font-sans tracking-tight select-none transition-colors duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#6BB89E]/40 cursor-pointer whitespace-nowrap shrink-0 text-xs px-3.5 py-2 gap-2 font-mono bg-[#FC6454] text-white hover:bg-[#E04D3E] border border-[#FC6454] dark:bg-[#2F8068] dark:text-white dark:hover:bg-[#3A9277] dark:border-[#2F8068] shadow-xs">
                ${icon('UserCheck', 'w-4 h-4 mr-1.5')}
                ${checkingIn ? 'Checking in...' : "Check In for Today's Lab"}
              </button>
            ` : `
              <button
                disabled
                class="inline-flex items-center justify-center font-sans tracking-tight select-none rounded-md text-xs px-3.5 py-2 font-mono bg-transparent text-[#282828] border border-[#282828]/25 dark:text-white dark:border-[#25473C] opacity-60 cursor-not-allowed">
                Window Closed
              </button>
            `}
          </div>
        </div>

        <!-- Recent Attendance Table -->
        <div class="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] overflow-hidden">
          <div class="px-5 py-3 border-b border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between">
            <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-[#282828] dark:text-white">
              Recent Attendance History
            </h4>
            <span class="text-[11px] font-mono text-[#282828]/50 dark:text-white">
              Authority: Computer Lab 3
            </span>
          </div>

          ${!attendance?.records || attendance.records.length === 0 ? `
            <div class="p-8 text-center text-xs text-[#282828]/50 dark:text-white font-mono">
              No attendance records recorded yet. Attend scheduled lab workshops to build your record.
            </div>
          ` : `
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-[#282828]/10 dark:border-[#25473C] bg-[#FAF4EE]/60 dark:bg-[#0A211A] text-[11px] font-mono text-[#282828]/60 dark:text-white">
                    <th class="px-5 py-2.5">Date</th>
                    <th class="px-5 py-2.5">Session</th>
                    <th class="px-5 py-2.5">Check-In Time</th>
                    <th class="px-5 py-2.5">Status</th>
                    <th class="px-5 py-2.5 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#282828]/10 dark:divide-[#25473C]">
                  ${attendance.records.slice(0, 5).map((rec) => `
                    <tr class="hover:bg-[#FAF4EE]/40 dark:hover:bg-[#15362B]/50 transition-colors">
                      <td class="px-5 py-3 font-mono text-[#282828] dark:text-white">${rec.date}</td>
                      <td class="px-5 py-3 text-[#282828] dark:text-white">${rec.sessionName}</td>
                      <td class="px-5 py-3 font-mono text-[#282828]/70 dark:text-white">${rec.time}</td>
                      <td class="px-5 py-3">
                        <span class="inline-flex items-center rounded-sm text-[11px] px-1.5 py-0.5 tracking-tight font-medium ${
                          rec.status === 'Present'
                            ? 'bg-emerald-50 dark:bg-[#102B22] text-emerald-700 dark:text-[#58B889] border border-emerald-200 dark:border-[#25473C]'
                            : rec.status === 'Late'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-[#D6A84F] border border-amber-200 dark:border-amber-800/60'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-[#D96B6B] border border-rose-200 dark:border-[#25473C]'
                        }">
                          ${rec.status}
                        </span>
                      </td>
                      <td class="px-5 py-3 text-right font-mono text-[11px] text-[#282828]/50 dark:text-white">
                        ${rec.verifiedBy === 'self-service' ? 'Student Self-Service' : 'Faculty Admin'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </section>

      <!-- Assignments Section -->
      ${assignments ? `
        <section id="assignments" class="p-5 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              ${icon('CheckSquare', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]')}
              <h3 class="text-xs font-mono font-bold uppercase tracking-wider text-[#282828] dark:text-white">
                Curriculum Assignments
              </h3>
            </div>
            <p class="text-xs text-[#282828]/70 dark:text-white">
              Track your hands-on coding assignments, practical lab deliverables, and milestone grades.
            </p>
          </div>
          <div class="flex items-center gap-4 shrink-0">
            <div class="flex items-center gap-3 text-xs font-mono">
              <span class="px-2.5 py-1 rounded bg-[#EFE6DE] dark:bg-[#15362B] text-[#282828] dark:text-white">
                Total: <strong>${assignments.total}</strong>
              </span>
              <span class="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                Pending: <strong>${assignments.pending}</strong>
              </span>
              <span class="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#58B889] border border-emerald-200 dark:border-emerald-800/60">
                Submitted: <strong>${assignments.submitted}</strong>
              </span>
            </div>
            <button
              data-nav="/portal/courses"
              class="inline-flex items-center justify-center font-mono text-xs px-2.5 py-1.5 rounded-md border border-[#282828]/25 dark:border-[#25473C] hover:bg-[#FC6454]/10 dark:hover:bg-[#2F8068]/20 transition-colors cursor-pointer bg-transparent text-[#282828] dark:text-white">
              Browse Tasks &rarr;
            </button>
          </div>
        </section>
      ` : ''}

      <!-- Announcements Feed -->
      ${announcements.length > 0 ? `
        <section class="space-y-3">
          <div class="flex items-center gap-2 border-b border-[#282828]/10 dark:border-[#25473C] pb-2">
            ${icon('Bell', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]')}
            <h2 class="text-sm font-semibold text-[#282828] dark:text-white uppercase tracking-wider font-mono">
              Club Announcements
            </h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${announcements.map((ann) => `
              <div class="p-5 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-2 transition-colors">
                <div class="flex items-center justify-between text-xs">
                  <span class="inline-flex items-center rounded-sm text-[11px] px-1.5 py-0.5 tracking-tight font-medium ${
                    ann.priority === 'urgent'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-[#D96B6B] border border-rose-200 dark:border-[#25473C]'
                      : ann.priority === 'important'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-[#D6A84F] border border-amber-200 dark:border-amber-800/60'
                      : 'bg-[#FC6454]/10 dark:bg-[#2F8068]/25 text-[#FC6454] dark:text-[#6BB89E] border border-[#FC6454]/25 dark:border-[#25473C]'
                  }">
                    ${ann.priority}
                  </span>
                  <span class="text-[#282828]/50 dark:text-white font-mono text-[11px]">${ann.publishedDate}</span>
                </div>
                <h3 class="text-sm font-semibold text-[#282828] dark:text-white">${ann.title}</h3>
                <p class="text-xs text-[#282828]/70 dark:text-white leading-relaxed whitespace-pre-line">
                  ${ann.content}
                </p>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      <!-- Technical Resources & Lab Kits -->
      <section id="resources" class="space-y-4">
        <div class="flex items-center justify-between border-b border-[#282828]/10 dark:border-[#25473C] pb-2">
          <div>
            <h2 class="text-sm font-semibold text-[#282828] dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
              ${icon('Code', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]')}
              Technical Resources &amp; Lab Kits
            </h2>
          </div>
          <span class="text-xs text-[#282828]/50 dark:text-white font-mono">Lab 3 Shared Repos</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${resources.map((res) => `
            <div class="p-5 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] flex flex-col justify-between space-y-4 hover:border-[#FC6454]/40 dark:hover:border-[#366656] transition-colors">
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-xs font-medium text-[#FC6454] dark:text-[#6BB89E]">${res.category}</span>
                  <span class="font-mono text-[#282828]/50 dark:text-white text-[11px]">${res.format} · ${res.fileSize}</span>
                </div>
                <h3 class="text-sm font-semibold text-[#282828] dark:text-white">${res.title}</h3>
                <p class="text-xs text-[#282828]/70 dark:text-white leading-relaxed">${res.description}</p>
                <div class="flex flex-wrap gap-1.5 pt-1">
                  ${(res.tags || []).map((t) => `
                    <span class="text-[11px] font-mono px-2 py-0.5 rounded-sm bg-[#EFE6DE] dark:bg-[#15362B] text-[#282828] dark:text-white border border-[#282828]/10 dark:border-[#25473C]">
                      ${t}
                    </span>
                  `).join('')}
                </div>
              </div>

              <div class="pt-3 border-t border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between text-xs font-mono">
                <span class="text-[#282828]/50 dark:text-white">${res.version}</span>
                <button
                  data-resource-id="${res.id}"
                  data-resource-title="${res.title}"
                  class="dash-resource-btn inline-flex items-center gap-1.5 text-[#FC6454] dark:text-[#6BB89E] hover:underline font-medium cursor-pointer border-0 bg-transparent p-0">
                  ${icon('Download', 'w-3.5 h-3.5')}
                  <span>Access Resource</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Projects & Upcoming Sessions Preview -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Projects Preview -->
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-[#282828]/10 dark:border-[#25473C] pb-2">
            <h3 class="text-xs font-semibold text-[#282828] dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
              ${icon('FolderGit2', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]')}
              Club Repositories
            </h3>
            <button
              data-nav="/portal/projects"
              class="text-xs font-medium text-[#282828]/60 hover:text-[#282828] dark:text-white dark:hover:text-[#6BB89E] transition-colors border-0 bg-transparent cursor-pointer p-0">
              Browse All &rarr;
            </button>
          </div>

          ${projects.length === 0 ? `
            <div class="p-6 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-[#FAF4EE] dark:bg-[#102B22] text-center text-xs text-[#282828]/50 dark:text-white">
              No projects published yet. Team up with fellow members to create one.
            </div>
          ` : `
            <div class="space-y-2.5">
              ${projects.map((p) => `
                <div class="p-3.5 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] flex items-center justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <h4 class="text-xs font-semibold text-[#282828] dark:text-white truncate">${p.title}</h4>
                    <p class="text-[11px] text-[#282828]/50 dark:text-white truncate mt-0.5 font-mono">
                      ${p.category} · ${Array.isArray(p.projectMembers) ? p.projectMembers.join(', ') : (p.projectMembers || 'IT Club Team')}
                    </p>
                  </div>
                  <span class="text-[11px] font-mono px-2 py-0.5 rounded-sm bg-[#EFE6DE] dark:bg-[#15362B] text-[#282828] dark:text-white border border-[#282828]/10 dark:border-[#25473C]">
                    ${p.status}
                  </span>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Upcoming Sessions Preview -->
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-[#282828]/10 dark:border-[#25473C] pb-2">
            <h3 class="text-xs font-semibold text-[#282828] dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
              ${icon('Calendar', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]')}
              Upcoming Sessions
            </h3>
            <button
              data-nav="/events"
              class="text-xs font-medium text-[#282828]/60 hover:text-[#282828] dark:text-white dark:hover:text-[#6BB89E] transition-colors border-0 bg-transparent cursor-pointer p-0">
              All Events &rarr;
            </button>
          </div>

          ${upcomingEvents.length === 0 ? `
            <div class="p-6 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-[#FAF4EE] dark:bg-[#102B22] text-center text-xs text-[#282828]/50 dark:text-white">
              No upcoming events scheduled right now. Check back soon.
            </div>
          ` : `
            <div class="space-y-2.5">
              ${upcomingEvents.map((ev) => `
                <div class="p-3.5 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-md bg-[#FAF4EE] dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] flex flex-col items-center justify-center shrink-0">
                      <span class="text-[9px] font-mono uppercase text-[#FC6454] dark:text-[#6BB89E] font-bold">
                        ${ev.formattedDate?.month || (ev.date ? new Date(ev.date + 'T00:00:00').toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'EVT')}
                      </span>
                      <span class="text-xs leading-none font-mono font-bold text-[#282828] dark:text-white">
                        ${ev.formattedDate?.day || (ev.date ? new Date(ev.date + 'T00:00:00').getDate() : '15')}
                      </span>
                    </div>
                    <div class="min-w-0">
                      <h4 class="text-xs font-semibold text-[#282828] dark:text-white truncate">${ev.title}</h4>
                      <p class="text-[11px] text-[#282828]/50 dark:text-white truncate font-mono">${ev.location}</p>
                    </div>
                  </div>
                  <button
                    data-nav="/events"
                    class="inline-flex items-center justify-center font-sans tracking-tight select-none rounded-md text-xs px-2.5 py-1.5 font-medium bg-transparent text-[#282828] hover:bg-[#FC6454]/10 border border-[#282828]/25 dark:text-white dark:hover:bg-[#2F8068]/20 dark:border-[#25473C] cursor-pointer">
                    Details
                  </button>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>

      <!-- Recent Logged Activities -->
      <div class="space-y-3">
        <div class="flex items-center justify-between border-b border-[#282828]/10 dark:border-[#25473C] pb-2">
          <h2 class="text-xs font-semibold text-[#282828] dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
            ${icon('Clock', 'w-3.5 h-3.5 text-[#282828]/50 dark:text-white')}
            Recent Personal Activity
          </h2>
          <span class="text-xs font-mono text-[#282828]/50 dark:text-white">Activity Log</span>
        </div>

        <div class="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-5 divide-y divide-[#282828]/10 dark:divide-[#25473C]">
          ${loading ? `
            <div class="py-6 text-center text-xs text-[#282828]/50 dark:text-white">Loading activities...</div>
          ` : activities.length === 0 ? `
            <div class="py-6 text-center text-xs text-[#282828]/50 dark:text-white">
              No recorded activity yet. Complete workshop registrations or courses to start your log.
            </div>
          ` : activities.map((act) => `
            <div class="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-md bg-[#FAF4EE] dark:bg-[#15362B] text-[#FC6454] dark:text-[#6BB89E] flex items-center justify-center text-xs border border-[#282828]/10 dark:border-[#25473C]">
                  ${act.type === 'certificate' ? icon('Award', 'w-3.5 h-3.5') : icon('CheckCircle2', 'w-3.5 h-3.5')}
                </div>
                <p class="text-xs font-medium text-[#282828] dark:text-white">${act.title}</p>
              </div>
              <span class="text-[11px] font-mono text-[#282828]/50 dark:text-white shrink-0">${act.timeAgo}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function updateDashboardDOM() {
  const root = document.getElementById('portal-dashboard-root');
  if (root) {
    const parent = root.parentElement;
    if (parent) {
      parent.innerHTML = renderDashboardPage();
      attachDashboardListeners();
    }
  }
}

export async function initDashboardPageEvents() {
  attachDashboardListeners();

  try {
    dashData.loading = true;
    const [dashRes, resRes, annRes, projRes, evtRes] = await Promise.all([
      api.getDashboardSummary().catch(() => ({ stats: null, recentActivities: [], attendance: null, assignments: null })),
      api.getClubResources().catch(() => ({ resources: [] })),
      api.getAnnouncements().catch(() => ({ announcements: [] })),
      api.getProjects().catch(() => ({ projects: [] })),
      api.getEvents('Upcoming').catch(() => ({ events: [] }))
    ]);

    if (dashRes.stats) dashData.stats = dashRes.stats;
    if (dashRes.recentActivities) dashData.activities = dashRes.recentActivities;
    if (dashRes.attendance) dashData.attendance = dashRes.attendance;
    if (dashRes.assignments) dashData.assignments = dashRes.assignments;
    if (resRes.resources) dashData.resources = resRes.resources;
    if (annRes.announcements) dashData.announcements = annRes.announcements;
    if (projRes.projects) dashData.projects = projRes.projects.slice(0, 3);
    if (evtRes.events) dashData.upcomingEvents = evtRes.events.slice(0, 2);

    if (authState.member && !authState.member.telegramActivated) {
      api.getMyActivation().then((act) => {
        if (act?.activationUrl) dashData.activationUrl = act.activationUrl;
        updateDashboardDOM();
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Failed to load member dashboard', err);
  } finally {
    dashData.loading = false;
    updateDashboardDOM();
  }
}

function attachDashboardListeners() {
  // Theme toggle
  const themeToggle = document.getElementById('dash-theme-toggle');
  if (themeToggle) {
    themeToggle.onclick = () => themeState.toggleTheme();
  }

  // Copy Member ID
  const copyIdBtn = document.getElementById('dash-copy-id-btn');
  if (copyIdBtn) {
    copyIdBtn.onclick = () => {
      const mid = authState.member?.memberId;
      if (mid) {
        navigator.clipboard.writeText(mid);
        dashData.copiedId = true;
        updateDashboardDOM();
        setTimeout(() => {
          dashData.copiedId = false;
          updateDashboardDOM();
        }, 2000);
      }
    };
  }

  // Attendance Check-in
  const checkInBtn = document.getElementById('dash-check-in-btn');
  if (checkInBtn) {
    checkInBtn.onclick = async () => {
      const mid = authState.member?.memberId;
      if (!mid) return;
      dashData.checkingIn = true;
      dashData.checkInMessage = null;
      updateDashboardDOM();

      try {
        const res = await api.checkInAttendance(mid);
        if (res.success) {
          dashData.checkInMessage = { type: 'success', text: res.message || 'Check-in recorded successfully!' };
          const updated = await api.getDashboardSummary();
          if (updated.attendance) dashData.attendance = updated.attendance;
          if (updated.stats) dashData.stats = updated.stats;
        } else {
          dashData.checkInMessage = { type: 'error', text: res.message || 'Check-in failed.' };
        }
      } catch (err) {
        dashData.checkInMessage = { type: 'error', text: err?.message || 'Failed to submit attendance.' };
      } finally {
        dashData.checkingIn = false;
        updateDashboardDOM();
      }
    };
  }

  // Access Resource
  document.querySelectorAll('.dash-resource-btn').forEach(btn => {
    btn.onclick = () => {
      const title = btn.getAttribute('data-resource-title');
      dashData.resourceNotice = `Accessing "${title}". Document kit available in Computer Lab 3 repository.`;
      updateDashboardDOM();
      setTimeout(() => {
        dashData.resourceNotice = null;
        updateDashboardDOM();
      }, 4000);
    };
  });
}
