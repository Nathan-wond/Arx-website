import { api } from '../../../services/api.js';
import { authState, router } from '../../state.js';
import { icon } from '../../icons.js';

let sessions = [];
let history = {
  records: [],
  totalSessions: 0,
  presentSessions: 0,
  lateSessions: 0,
  absentSessions: 0,
  attendanceRate: 100,
  isCertificateEligible: true
};
let serverTime = {};
let loading = true;

// Check-in modal state
let activeCheckInSession = null;
let password = '';
let showPassword = false;
let submitting = false;
let submitError = null;
let submitSuccess = null;

let clockInterval = null;
let refreshInterval = null;

function getClockDisplay() {
  try {
    const now = new Date();
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
    }).formatToParts(now);

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

    const eatFormatted = formatter.format(now);
    const ethFormatted = `${ethHour}:${m} ${period}`;

    return { ethFormatted, eatFormatted, ethHour, period };
  } catch {
    return { ethFormatted: '7:00 Afternoon', eatFormatted: '1:00 PM EAT', ethHour: 7, period: 'Afternoon' };
  }
}

export function renderMyAttendancePage() {
  const member = authState.member;
  const clockDisplay = getClockDisplay();

  return `
    <div id="portal-attendance-root" class="space-y-6">
      <!-- Breadcrumb Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
        <div>
          <div class="flex items-center gap-2 text-xs font-mono text-[#282828]/60 dark:text-white">
            <span>Workspace</span>
            <span>/</span>
            <span>Portal</span>
            <span>/</span>
            <span class="text-[#FC6454] dark:text-[#6BB89E] font-medium">Lab Attendance</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">
            Computer Lab 3 Attendance Management
          </h2>
        </div>

        <div class="flex items-center gap-2">
          <button
            id="attendance-refresh-btn"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#282828]/15 dark:border-[#25473C] bg-white dark:bg-[#102B22] text-xs font-semibold text-[#282828] dark:text-white hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] transition-colors cursor-pointer"
          >
            ${icon('RefreshCw', 'w-3.5 h-3.5')}
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      <!-- Authoritative Ethiopian Clock & Schedule Matrix Banner -->
      <div class="p-5 sm:p-6 rounded-2xl border border-[#FC6454]/20 dark:border-[#2F8068]/30 bg-gradient-to-br from-[#FC6454]/10 via-white/70 to-[#2F8068]/10 dark:from-[#0A211A] dark:via-[#102B22] dark:to-[#071A14] shadow-xs space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="text-[11px] font-mono uppercase tracking-wider text-[#FC6454] dark:text-[#6BB89E] font-bold">
                Live Server Clock · Africa/Addis_Ababa (EAT)
              </span>
            </div>
            <div class="flex flex-wrap items-baseline gap-3">
              <span id="live-eth-clock" class="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-[#282828] dark:text-white">
                ${clockDisplay.ethFormatted}
              </span>
              <span id="live-eat-clock" class="text-xs sm:text-sm font-mono text-[#282828]/60 dark:text-white">
                (${clockDisplay.eatFormatted})
              </span>
            </div>
            <p class="text-xs text-[#282828]/70 dark:text-white">
              All attendance check-ins are evaluated with server-authoritative timestamps in the Ethiopian clock system.
            </p>
          </div>

          <div class="p-3.5 rounded-xl bg-white/80 dark:bg-[#071A14]/80 border border-[#282828]/10 dark:border-[#25473C] text-xs space-y-2 shrink-0 md:max-w-xs">
            <div class="font-mono text-[10px] uppercase font-bold text-[#FC6454] dark:text-[#6BB89E]">
              Strict Lab Schedule Windows
            </div>
            <div class="space-y-1 font-mono text-[11px]">
              <div class="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-semibold">
                <span>7:00 – 7:30 Ethiopian</span>
                <span>Present</span>
              </div>
              <div class="flex justify-between items-center text-amber-700 dark:text-amber-400 font-semibold">
                <span>7:30 – 7:40 Ethiopian</span>
                <span>Late Window</span>
              </div>
              <div class="flex justify-between items-center text-rose-700 dark:text-rose-400 font-semibold">
                <span>7:40+ Ethiopian</span>
                <span>Closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Attendance Metrics & Certificate Qualification Threshold -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div class="p-4 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] shadow-xs space-y-1">
          <span class="text-[10px] font-mono uppercase text-[#282828]/50 dark:text-white block">Total Sessions</span>
          <span class="text-2xl font-bold font-mono text-[#282828] dark:text-white">${history.totalSessions || 0}</span>
          <span class="text-[10px] text-[#282828]/60 dark:text-white block">Recorded roster</span>
        </div>

        <div class="p-4 rounded-xl bg-white dark:bg-[#102B22] border border-emerald-500/20 shadow-xs space-y-1">
          <span class="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 block">On-Time (Present)</span>
          <span class="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">${history.presentSessions || 0}</span>
          <span class="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 block">Verified on-time</span>
        </div>

        <div class="p-4 rounded-xl bg-white dark:bg-[#102B22] border border-amber-500/20 shadow-xs space-y-1">
          <span class="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400 block">Late Check-Ins</span>
          <span class="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">${history.lateSessions || 0}</span>
          <span class="text-[10px] text-amber-700/80 dark:text-amber-300/80 block">During late window</span>
        </div>

        <div class="p-4 rounded-xl bg-white dark:bg-[#102B22] border border-rose-500/20 shadow-xs space-y-1">
          <span class="text-[10px] font-mono uppercase text-rose-600 dark:text-rose-400 block">Missed (Absent)</span>
          <span class="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">${history.absentSessions || 0}</span>
          <span class="text-[10px] text-rose-700/80 dark:text-rose-300/80 block">Finalized absence</span>
        </div>
      </div>

      <!-- Qualification Progress Card -->
      <div class="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1.5 flex-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-[#282828] dark:text-white flex items-center gap-2">
              ${icon('Award', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]')}
              <span>Official Certificate Qualification Threshold</span>
            </span>
            <span class="font-mono text-xs font-extrabold text-[#282828] dark:text-white">
              ${history.attendanceRate || 100}% Standing
            </span>
          </div>

          <div class="w-full bg-[#EFE6DE] dark:bg-[#071A14] h-2.5 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500 ${
                (history.attendanceRate ?? 100) >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
              }"
              style="width: ${Math.min(100, history.attendanceRate ?? 100)}%"
            ></div>
          </div>

          <p class="text-[11px] text-[#282828]/60 dark:text-white">
            Minimum <strong>80%</strong> lab attendance is required to qualify for verifiable course completion certificates.
          </p>
        </div>

        <div class="shrink-0">
          ${history.isCertificateEligible ? `
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              ${icon('CheckCircle', 'w-3.5 h-3.5 text-emerald-600')}
              <span>Certificate Qualified (≥ 80%)</span>
            </span>
          ` : `
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              ${icon('AlertTriangle', 'w-3.5 h-3.5 text-amber-600')}
              <span>Below Threshold (&lt; 80%)</span>
            </span>
          `}
        </div>
      </div>

      <!-- Available Sessions Section -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-[#282828] dark:text-white flex items-center gap-2 font-sans">
            ${icon('Calendar', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]')}
            <span>Course Attendance Sessions</span>
          </h3>
          <span class="text-xs font-mono text-[#282828]/60 dark:text-white">
            ${sessions.length} Session${sessions.length === 1 ? '' : 's'} Configured
          </span>
        </div>

        ${loading ? `
          <div class="py-12 text-center text-xs font-mono text-[#282828]/50 dark:text-white">
            <div class="w-6 h-6 border-2 border-[#FC6454] dark:border-[#6BB89E] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading attendance schedule...
          </div>
        ` : sessions.length === 0 ? `
          <div class="p-8 text-center bg-white dark:bg-[#102B22] border border-dashed border-[#282828]/20 dark:border-[#25473C] rounded-xl text-xs text-[#282828]/60 dark:text-white">
            No attendance sessions currently published for your enrolled courses.
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${sessions.map((sess) => {
              const isOpen = sess.window?.isOpen;
              const isUpcoming = sess.window?.isUpcoming;
              const alreadySubmitted = sess.alreadySubmitted;
              const isLateWindow = sess.window?.state === 'open_late';

              return `
                <div
                  key="${sess.id}"
                  class="p-5 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div class="space-y-2">
                    <div class="flex items-center justify-between gap-2">
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FC6454]/10 dark:bg-[#2F8068]/30 text-[#FC6454] dark:text-[#6BB89E] border border-[#FC6454]/20 dark:border-[#2F8068]/40">
                        ${sess.courseTitle}
                      </span>

                      <!-- State Badge -->
                      ${alreadySubmitted ? `
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200">
                          SUBMITTED
                        </span>
                      ` : isOpen ? `
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold animate-pulse ${
                          isLateWindow
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                        }">
                          ${isLateWindow ? 'OPEN: LATE WINDOW' : 'OPEN: ON-TIME'}
                        </span>
                      ` : isUpcoming ? `
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-100 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border border-cyan-200">
                          UPCOMING
                        </span>
                      ` : `
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200">
                          CLOSED
                        </span>
                      `}
                    </div>

                    <div>
                      <h4 class="text-sm font-bold text-[#282828] dark:text-white font-sans">
                        ${sess.title}
                      </h4>
                      <p class="text-xs text-[#282828]/70 dark:text-white mt-0.5">
                        ${sess.instructions || 'Sign in with your Member ID and password.'}
                      </p>
                    </div>

                    <div class="pt-2 border-t border-[#282828]/5 dark:border-[#25473C] grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <span class="text-[#282828]/40 dark:text-white block text-[9px] uppercase">Session Date</span>
                        <span class="font-semibold text-[#282828] dark:text-white">${sess.date}</span>
                      </div>
                      <div>
                        <span class="text-[#282828]/40 dark:text-white block text-[9px] uppercase">Schedule Window</span>
                        <span class="font-semibold text-[#282828] dark:text-white">
                          ${sess.ethiopianOpenTime} – ${sess.ethiopianLateCutoff} Eth (${sess.internationalOpenTime} – ${sess.internationalLateCutoff})
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Submission Status or Action Button -->
                  <div class="pt-3 border-t border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between">
                    ${alreadySubmitted ? `
                      <div class="text-xs space-y-0.5">
                        <div class="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                          ${icon('CheckCircle', 'w-3.5 h-3.5')}
                          <span>Submitted: ${sess.memberRecord?.initialClassification || 'Present'}</span>
                        </div>
                        <div class="text-[10px] font-mono text-[#282828]/50 dark:text-white">
                          Review: <strong class="${sess.memberRecord?.reviewStatus === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}">${sess.memberRecord?.reviewStatus || 'Pending'}</strong>
                        </div>
                      </div>
                    ` : isOpen ? `
                      <button
                        data-checkin-session-id="${sess.id}"
                        class="checkin-open-btn w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs active:scale-95 transition-all inline-flex items-center justify-center gap-2"
                      >
                        ${icon('CheckSquare', 'w-4 h-4')}
                        <span>Check In Now (${sess.window?.provisionalClassification || 'Present'})</span>
                      </button>
                    ` : `
                      <span class="text-xs text-[#282828]/60 dark:text-white italic">
                        ${sess.window?.message || 'Form is closed.'}
                      </span>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- Attendance History Roster Table -->
      <div class="rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] overflow-hidden shadow-xs space-y-3">
        <div class="p-4 border-b border-[#282828]/10 dark:border-[#25473C] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 class="text-sm font-bold text-[#282828] dark:text-white font-sans flex items-center gap-2">
              ${icon('Clock', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]')}
              <span>Your Official Lab Attendance Records</span>
            </h3>
            <p class="text-[11px] text-[#282828]/60 dark:text-white">
              Permanent log stamped with dual Ethiopian and international server time.
            </p>
          </div>
          <span class="text-xs font-mono text-[#282828]/50 dark:text-white">
            ${history.records?.length || 0} Total Records
          </span>
        </div>

        ${!history.records || history.records.length === 0 ? `
          <div class="p-8 text-center text-xs text-[#282828]/50 dark:text-white">
            No attendance records logged yet. Check in when an attendance session opens.
          </div>
        ` : `
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-[#282828]/5 dark:bg-[#0A211A] border-b border-[#282828]/10 dark:border-[#25473C] font-mono text-[11px] text-[#282828]/70 dark:text-white">
                <tr>
                  <th class="p-3.5">Session / Course</th>
                  <th class="p-3.5">Date</th>
                  <th class="p-3.5">Server Timestamp</th>
                  <th class="p-3.5">Classification</th>
                  <th class="p-3.5">Officer Review</th>
                  <th class="p-3.5">Notes</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#282828]/5 dark:divide-[#25473C]">
                ${history.records.map((rec) => {
                  const isPresent = (rec.finalClassification || rec.status) === 'Present';
                  const isLate = (rec.finalClassification || rec.status) === 'Late';

                  const isApproved = rec.reviewStatus === 'Approved';
                  const isPending = rec.reviewStatus === 'Pending' || !rec.reviewStatus;

                  return `
                    <tr class="hover:bg-[#282828]/[0.02] dark:hover:bg-[#15362B]/50 transition-colors">
                      <td class="p-3.5">
                        <div class="font-bold text-[#282828] dark:text-white">${rec.sessionTitle || 'Lab Session'}</div>
                        <div class="font-mono text-[10px] text-[#282828]/50 dark:text-white">${rec.courseTitle || 'Curriculum Track'}</div>
                      </td>
                      <td class="p-3.5 font-mono text-xs text-[#282828] dark:text-white whitespace-nowrap">
                        ${rec.date}
                      </td>
                      <td class="p-3.5 font-mono text-[11px] text-[#282828]/70 dark:text-white">
                        <div>${rec.submissionTimeEthiopian || rec.time || '—'}</div>
                        ${rec.submissionTimeInternational ? `
                          <div class="text-[10px] text-[#282828]/40 dark:text-white">${rec.submissionTimeInternational}</div>
                        ` : ''}
                      </td>
                      <td class="p-3.5">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isPresent
                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                            : isLate
                              ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                              : 'bg-rose-500/15 text-rose-800 dark:text-rose-300'
                        }">
                          ${rec.finalClassification || rec.status || 'Present'}
                        </span>
                      </td>
                      <td class="p-3.5">
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isApproved
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : isPending
                              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                        }">
                          ${isApproved ? 'Approved' : isPending ? 'Pending Review' : 'Rejected'}
                        </span>
                        ${rec.reviewedBy ? `
                          <div class="text-[9px] font-mono text-[#282828]/40 dark:text-white mt-0.5">
                            by ${rec.reviewedBy}
                          </div>
                        ` : ''}
                      </td>
                      <td class="p-3.5 text-xs text-[#282828]/70 dark:text-white max-w-xs truncate">
                        ${rec.rejectionReason ? `
                          <span class="text-rose-600 dark:text-rose-400 font-semibold">Reason: ${rec.rejectionReason}</span>
                        ` : rec.correctionNotes ? `
                          <span>${rec.correctionNotes}</span>
                        ` : `
                          <span class="text-[#282828]/40 dark:text-white">—</span>
                        `}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Interactive Check-In Modal Container -->
      <div id="attendance-modal-container">
        ${renderModalHtml(member, clockDisplay)}
      </div>
    </div>
  `;
}

function renderModalHtml(member, clockDisplay) {
  if (!activeCheckInSession) return '';

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div class="w-full max-w-md bg-white dark:bg-[#102B22] rounded-2xl border border-[#282828]/15 dark:border-[#25473C] p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-[#282828]/10 dark:border-[#25473C] pb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              ${icon('CheckSquare', 'w-4 h-4')}
            </div>
            <div>
              <h3 class="text-sm font-bold font-sans text-[#282828] dark:text-white">
                Lab Attendance Verification
              </h3>
              <p class="text-[10px] font-mono text-[#282828]/50 dark:text-white">
                Computer Lab 3 · St. Joseph School
              </p>
            </div>
          </div>
          <button
            id="modal-close-btn"
            class="text-xs p-1.5 rounded hover:bg-[#282828]/5 dark:hover:bg-[#15362B] text-[#282828]/60 dark:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        ${submitSuccess ? `
          <div class="space-y-4 text-center py-2">
            <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 mx-auto flex items-center justify-center">
              ${icon('CheckCircle', 'w-6 h-6')}
            </div>
            <div class="space-y-1">
              <h4 class="text-sm font-bold text-[#282828] dark:text-white">
                Attendance Verified!
              </h4>
              <p class="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                ${submitSuccess.message || 'Check-in recorded successfully.'}
              </p>
              <p class="text-[11px] text-[#282828]/60 dark:text-white pt-1">
                Your check-in has been submitted for administrative officer approval. Your standing will update automatically.
              </p>
            </div>
            <button
              id="modal-success-close-btn"
              class="w-full py-2.5 rounded-lg text-xs font-bold bg-[#FC6454] dark:bg-[#2F8068] text-white cursor-pointer"
            >
              Close &amp; Return to Attendance
            </button>
          </div>
        ` : `
          <form id="attendance-checkin-form" class="space-y-4 text-xs">
            <!-- Session Summary Card -->
            <div class="p-3 rounded-lg bg-[#FAF4EE] dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] space-y-1">
              <div class="text-[10px] font-mono uppercase text-[#FC6454] dark:text-[#6BB89E] font-bold">
                ${activeCheckInSession.courseTitle}
              </div>
              <div class="font-bold text-[#282828] dark:text-white">
                ${activeCheckInSession.title}
              </div>
              <div class="text-[11px] font-mono text-[#282828]/60 dark:text-white">
                Server Clock: ${clockDisplay.ethFormatted} (${clockDisplay.eatFormatted})
              </div>
            </div>

            ${submitError ? `
              <div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-medium text-xs">
                ${submitError}
              </div>
            ` : ''}

            <!-- Pre-filled Member ID -->
            <div>
              <label class="block font-bold text-[#282828] dark:text-white mb-1 font-mono text-[11px]">
                Verified Student Member ID
              </label>
              <input
                type="text"
                disabled
                value="${member?.memberId || 'TI------'}"
                class="w-full px-3 py-2 rounded-lg border border-[#282828]/15 dark:border-[#25473C] bg-[#282828]/5 dark:bg-[#071A14] text-[#282828] dark:text-white font-mono font-bold cursor-not-allowed"
              />
              <p class="text-[10px] text-[#282828]/50 dark:text-white mt-0.5">
                Attributed to ${member?.studentName || 'Member'} (Class ${member?.class || 'N/A'})
              </p>
            </div>

            <!-- Account Password Input -->
            <div>
              <label class="block font-bold text-[#282828] dark:text-white mb-1 font-mono text-[11px]">
                Account Security Password *
              </label>
              <div class="relative">
                <input
                  id="checkin-password-input"
                  type="${showPassword ? 'text' : 'password'}"
                  required
                  placeholder="Enter your member password..."
                  value="${password}"
                  class="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#25473C] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30"
                />
                <button
                  type="button"
                  id="toggle-checkin-password"
                  class="absolute right-2.5 top-2.5 text-[#282828]/40 dark:text-white hover:text-[#282828] cursor-pointer"
                >
                  ${icon(showPassword ? 'EyeOff' : 'Eye', 'w-4 h-4')}
                </button>
              </div>
              <p class="text-[10px] text-[#282828]/50 dark:text-white mt-0.5">
                Mandatory cryptographic verification to prevent buddy check-ins.
              </p>
            </div>

            <div class="pt-2 flex items-center justify-end gap-2 border-t border-[#282828]/10 dark:border-[#25473C]">
              <button
                type="button"
                id="modal-cancel-btn"
                class="px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer border border-[#282828]/20 dark:border-[#25473C] bg-transparent text-[#282828] dark:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-checkin-btn"
                ${submitting || !password ? 'disabled' : ''}
                class="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white cursor-pointer shadow-xs active:scale-95 transition-all inline-flex items-center gap-1.5"
              >
                ${submitting ? `
                  <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                ` : `
                  ${icon('CheckCircle', 'w-4 h-4')}
                  <span>Confirm Attendance</span>
                `}
              </button>
            </div>
          </form>
        `}
      </div>
    </div>
  `;
}

function updateDOM() {
  const root = document.getElementById('portal-attendance-root');
  if (root && root.parentElement) {
    root.parentElement.innerHTML = renderMyAttendancePage();
    attachListeners();
  }
}

async function loadData() {
  try {
    loading = true;
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

    if (availRes?.sessions) sessions = availRes.sessions;
    if (availRes?.serverTime) serverTime = availRes.serverTime;
    if (histRes) history = histRes;
  } finally {
    loading = false;
    updateDOM();
  }
}

export function initMyAttendancePageEvents() {
  attachListeners();
  loadData();

  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(() => {
    const clock = getClockDisplay();
    const ethEl = document.getElementById('live-eth-clock');
    const eatEl = document.getElementById('live-eat-clock');
    if (ethEl) ethEl.textContent = clock.ethFormatted;
    if (eatEl) eatEl.textContent = `(${clock.eatFormatted})`;
  }, 1000);

  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(loadData, 30000);
}

function attachListeners() {
  // Refresh Button
  const refBtn = document.getElementById('attendance-refresh-btn');
  if (refBtn) {
    refBtn.onclick = () => loadData();
  }

  // Check In Now buttons
  document.querySelectorAll('.checkin-open-btn').forEach(btn => {
    btn.onclick = () => {
      const sessId = btn.getAttribute('data-checkin-session-id');
      const found = sessions.find(s => s.id === sessId);
      if (found) {
        activeCheckInSession = found;
        password = '';
        submitError = null;
        submitSuccess = null;
        updateDOM();
      }
    };
  });

  // Modal close buttons
  const closeBtn = document.getElementById('modal-close-btn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      activeCheckInSession = null;
      password = '';
      submitError = null;
      submitSuccess = null;
      updateDOM();
    };
  }

  const cancelBtn = document.getElementById('modal-cancel-btn');
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      activeCheckInSession = null;
      password = '';
      submitError = null;
      submitSuccess = null;
      updateDOM();
    };
  }

  const successCloseBtn = document.getElementById('modal-success-close-btn');
  if (successCloseBtn) {
    successCloseBtn.onclick = () => {
      activeCheckInSession = null;
      password = '';
      submitError = null;
      submitSuccess = null;
      loadData();
    };
  }

  // Password input & toggle
  const pwdInput = document.getElementById('checkin-password-input');
  if (pwdInput) {
    pwdInput.oninput = (e) => {
      password = e.target.value;
      const submitBtn = document.getElementById('submit-checkin-btn');
      if (submitBtn) {
        submitBtn.disabled = !password || submitting;
      }
    };
  }

  const togglePwd = document.getElementById('toggle-checkin-password');
  if (togglePwd) {
    togglePwd.onclick = () => {
      showPassword = !showPassword;
      updateDOM();
    };
  }

  // Form submission
  const form = document.getElementById('attendance-checkin-form');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const member = authState.member;
      if (!activeCheckInSession || !member?.memberId || !password) {
        submitError = 'Please enter your account password.';
        updateDOM();
        return;
      }

      submitting = true;
      submitError = null;
      submitSuccess = null;
      updateDOM();

      try {
        const res = await api.checkInAttendance({
          sessionId: activeCheckInSession.id,
          memberId: member.memberId,
          password
        });
        submitSuccess = res;
        password = '';
      } catch (err) {
        submitError = err.message || 'Check-in failed. Please verify your credentials.';
      } finally {
        submitting = false;
        updateDOM();
      }
    };
  }
}
