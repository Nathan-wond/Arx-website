import { api } from '../../../services/api.js';
import { authState, themeState, router, events } from '../../state.js';
import { icon } from '../../icons.js';
import { renderPresidentSidebar, initPresidentSidebarEvents } from '../../components/presidentSidebar.js';
import { PRESIDENT_LOGIN_PATH, ADMIN_DASHBOARD_PATH } from '../../../config/adminRoute.js';

// Module State
let activeTab = 'overview';
let feedback = null;
let feedbackTimer = null;

let overview = {
  totalMembers: 0,
  totalAdmins: 0,
  totalCourses: 0,
  pendingApplications: 0,
  certificatesIssued: 0,
  projects: 0,
  systemHealth: '100% Operational'
};

let adminsList = [];
let membersList = [];
let applicationsList = [];
let certificatesList = [];
let coursesList = [];
let auditLogsList = [];
let projectSubmissionsList = [];
let attendanceSessionsList = [];
let attendanceRecordsList = [];
let settings = {};

let memberSearch = '';
let memberFilter = 'all';
let applicationFilter = 'pending';

// Modals
let activeModal = null; // 'create_admin' | 'reset_admin_pwd' | 'delete_admin' | 'delete_member' | 'export_db' | 'president_pwd' | 'review_submission' | 'reject_app' | 'approve_app'
let modalData = null;
let modalInput = '';
let modalLoading = false;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showFeedback(type, message) {
  if (feedbackTimer) clearTimeout(feedbackTimer);
  feedback = { type, message };
  updateDOM();
  feedbackTimer = setTimeout(() => {
    feedback = null;
    updateDOM();
  }, 4500);
}

// Data loaders
async function loadPresidentData() {
  try {
    const [overviewRes, adminsRes, appsRes, membersRes, certsRes, coursesRes, logsRes, settingsRes, projSubsRes, attSessRes, attRecRes] = await Promise.allSettled([
      api.getAdminOverview(),
      api.getAdmins(),
      api.getAdminApplications('all'),
      api.getAdminMembers(),
      api.getAdminCertificates(),
      api.getAdminCourses(),
      api.getAuditLogs(),
      api.getAdminSettings(),
      api.getAdminProjectSubmissions?.() || Promise.resolve({ submissions: [] }),
      api.getAdminAttendanceSessions?.() || Promise.resolve({ sessions: [] }),
      api.getAdminAttendanceRecords?.() || Promise.resolve({ records: [] })
    ]);

    if (overviewRes.status === 'fulfilled' && overviewRes.value) {
      overview.totalMembers = overviewRes.value.totalMembers || 0;
      overview.totalCourses = overviewRes.value.totalCourses || 0;
      overview.certificatesIssued = overviewRes.value.certificatesIssued || 0;
      overview.projects = overviewRes.value.projects || 0;
    }

    if (adminsRes.status === 'fulfilled' && adminsRes.value?.admins) {
      adminsList = adminsRes.value.admins;
      overview.totalAdmins = adminsList.length;
    }

    if (appsRes.status === 'fulfilled') {
      const rawApps = appsRes.value?.applications || (Array.isArray(appsRes.value) ? appsRes.value : []);
      applicationsList = Array.isArray(rawApps) ? rawApps : [];
      overview.pendingApplications = applicationsList.filter(a => a.status === 'pending').length;
    }

    if (membersRes.status === 'fulfilled' && Array.isArray(membersRes.value)) {
      membersList = membersRes.value;
    }

    if (certsRes.status === 'fulfilled' && Array.isArray(certsRes.value)) {
      certificatesList = certsRes.value;
    }

    if (coursesRes.status === 'fulfilled' && Array.isArray(coursesRes.value)) {
      coursesList = coursesRes.value;
    }

    if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value?.logs)) {
      auditLogsList = logsRes.value.logs;
    }

    if (settingsRes.status === 'fulfilled' && settingsRes.value) {
      settings = settingsRes.value.settings || settingsRes.value;
    }

    if (projSubsRes.status === 'fulfilled' && projSubsRes.value?.submissions) {
      projectSubmissionsList = projSubsRes.value.submissions;
    }

    if (attSessRes.status === 'fulfilled' && attSessRes.value?.sessions) {
      attendanceSessionsList = attSessRes.value.sessions;
    }

    if (attRecRes.status === 'fulfilled' && attRecRes.value?.records) {
      attendanceRecordsList = attRecRes.value.records;
    }

    updateDOM();
  } catch (err) {
    console.error('[President] Failed to load executive data:', err);
  }
}

export function renderPresidentDashboardPage() {
  const pendingCount = applicationsList.filter(a => a.status === 'pending').length;
  const pendingSubmissionsCount = projectSubmissionsList.filter(s => s.status === 'pending').length;

  return `
    <div id="president-dashboard-root" class="flex flex-col lg:flex-row min-h-screen bg-[#FDFBF7] dark:bg-[#071913] text-[#282828] dark:text-white selection:bg-amber-500/20 selection:text-amber-900">
      <!-- President Executive Sidebar -->
      ${renderPresidentSidebar(activeTab, pendingCount, pendingSubmissionsCount)}

      <!-- Main Stage -->
      <main class="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <!-- Top Executive Navbar -->
        <header class="h-16 px-6 border-b border-amber-500/20 dark:border-amber-500/15 flex items-center justify-between bg-white/70 dark:bg-[#0A211A]/70 backdrop-blur-md sticky top-0 z-20">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              PRESIDENTIAL DESK
            </span>
            <span class="text-xs text-[#282828]/50 dark:text-white hidden sm:inline">
              Absolute Executive Administration & System Master Control
            </span>
          </div>

          <div class="flex items-center gap-2">
            <!-- Fast Database Export -->
            <button
              id="btn-quick-export-db"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 transition-all cursor-pointer">
              ${icon('Download', 'w-3.5 h-3.5')}
              <span class="hidden md:inline">Export Full Database</span>
            </button>

            <!-- Officer Console Switcher -->
            <button
              id="btn-jump-officer-console"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 border border-teal-500/20 transition-all cursor-pointer">
              ${icon('Shield', 'w-3.5 h-3.5')}
              <span class="hidden md:inline">Staff Desk</span>
            </button>
          </div>
        </header>

        <!-- Feedback Alert -->
        ${feedback ? `
          <div class="mx-6 mt-4 p-3.5 rounded-xl text-xs flex items-center justify-between transition-all animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }">
            <div class="flex items-center gap-2 font-medium">
              ${icon(feedback.type === 'success' ? 'CheckCircle' : 'AlertCircle', 'w-4 h-4 shrink-0')}
              <span>${escapeHtml(feedback.message)}</span>
            </div>
            <button class="text-xs opacity-60 hover:opacity-100 cursor-pointer border-0 bg-transparent" onclick="this.parentElement.remove()">&times;</button>
          </div>
        ` : ''}

        <!-- Active Tab Content -->
        <div class="p-6 space-y-6">
          ${renderTabContent()}
        </div>
      </main>

      <!-- Modals Container -->
      ${renderActiveModal()}
    </div>
  `;
}

function renderTabContent() {
  switch (activeTab) {
    case 'overview':
      return renderOverviewTab();
    case 'admins':
      return renderAdminsTab();
    case 'members':
      return renderMembersTab();
    case 'applications':
      return renderApplicationsTab();
    case 'project-reviews':
      return renderProjectReviewsTab();
    case 'certificates':
      return renderCertificatesTab();
    case 'courses':
      return renderCoursesTab();
    case 'attendance':
      return renderAttendanceTab();
    case 'assignments':
      return renderAssignmentsTab();
    case 'telegram':
      return renderTelegramTab();
    case 'settings':
      return renderSettingsTab();
    case 'system':
      return renderSystemTab();
    case 'security':
      return renderSecurityTab();
    default:
      return renderOverviewTab();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: OVERVIEW (EXECUTIVE COMMAND CENTER)
// ─────────────────────────────────────────────────────────────────────────────
function renderOverviewTab() {
  return `
    <div class="space-y-6">
      <!-- Executive Welcome Banner -->
      <div class="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 relative overflow-hidden">
        <div class="max-w-2xl space-y-2">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
            SUPREME CLUB GOVERNANCE
          </div>
          <h2 class="text-2xl font-bold tracking-tight text-[#282828] dark:text-white font-sans">
            Welcome, Mr. President
          </h2>
          <p class="text-xs text-[#282828]/70 dark:text-white leading-relaxed">
            You are operating with absolute executive authority. From this console, you can appoint staff officers, purge member records, authorize certificates, download complete system snapshots, and override platform policies.
          </p>
        </div>
        <div class="absolute right-6 -bottom-6 opacity-10 dark:opacity-5 text-amber-500 pointer-events-none hidden md:block">
          ${icon('Crown', 'w-48 h-48')}
        </div>
      </div>

      <!-- High-Level Metric Tiles -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div class="p-4 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] shadow-xs space-y-1">
          <div class="text-[10px] font-mono font-bold uppercase text-[#282828]/50 dark:text-white">Total Members</div>
          <div class="text-2xl font-black text-[#282828] dark:text-white">${overview.totalMembers}</div>
          <div class="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Registered Students</div>
        </div>

        <div class="p-4 rounded-xl bg-white dark:bg-[#102B22] border border-amber-500/30 dark:border-amber-500/20 shadow-xs space-y-1">
          <div class="text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400">Staff Admins</div>
          <div class="text-2xl font-black text-amber-600 dark:text-amber-400">${overview.totalAdmins}</div>
          <div class="text-[10px] text-amber-700 dark:text-amber-300 font-medium">Active Officers</div>
        </div>

        <div class="p-4 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] shadow-xs space-y-1">
          <div class="text-[10px] font-mono font-bold uppercase text-[#282828]/50 dark:text-white">Pending Queue</div>
          <div class="text-2xl font-black text-[#FC6454] dark:text-[#FC6454]">${overview.pendingApplications}</div>
          <div class="text-[10px] text-[#FC6454] font-medium">Awaiting Clearance</div>
        </div>

        <div class="p-4 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] shadow-xs space-y-1">
          <div class="text-[10px] font-mono font-bold uppercase text-[#282828]/50 dark:text-white">Curriculum Tracks</div>
          <div class="text-2xl font-black text-[#282828] dark:text-white">${coursesList.length || 4}</div>
          <div class="text-[10px] text-teal-600 dark:text-teal-400 font-medium">Active Syllabi</div>
        </div>

        <div class="p-4 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] shadow-xs space-y-1">
          <div class="text-[10px] font-mono font-bold uppercase text-[#282828]/50 dark:text-white">Certificates</div>
          <div class="text-2xl font-black text-[#282828] dark:text-white">${certificatesList.length}</div>
          <div class="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Verified Issued</div>
        </div>

        <div class="p-4 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] shadow-xs space-y-1">
          <div class="text-[10px] font-mono font-bold uppercase text-[#282828]/50 dark:text-white">System Health</div>
          <div class="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Optimal</span>
          </div>
          <div class="text-[10px] text-[#282828]/50 dark:text-white">All Services Green</div>
        </div>
      </div>

      <!-- Quick Actions Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Appoint Officer Action -->
        <div class="p-5 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] flex flex-col justify-between space-y-3">
          <div class="space-y-1.5">
            <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              ${icon('ShieldPlus', 'w-4 h-4')}
            </div>
            <h4 class="text-sm font-bold font-sans">Appoint Lower Admin</h4>
            <p class="text-xs text-[#282828]/60 dark:text-white">
              Create an operational officer account with scoped rights for application reviews and attendance grading.
            </p>
          </div>
          <button
            id="btn-open-create-admin"
            class="w-full py-2 px-3 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer border-0 transition-all shadow-xs">
            + Appoint Staff Officer
          </button>
        </div>

        <!-- System Snapshot Action -->
        <div class="p-5 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] flex flex-col justify-between space-y-3">
          <div class="space-y-1.5">
            <div class="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              ${icon('Database', 'w-4 h-4')}
            </div>
            <h4 class="text-sm font-bold font-sans">Download Full DB Snapshot</h4>
            <p class="text-xs text-[#282828]/60 dark:text-white">
              Export the complete raw database (JSON) including all members, enrollments, certificates, and audit logs.
            </p>
          </div>
          <button
            id="btn-action-download-db"
            class="w-full py-2 px-3 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white cursor-pointer border-0 transition-all shadow-xs">
            Export Complete Database
          </button>
        </div>

        <!-- Registration Lifecycle Action -->
        <div class="p-5 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] flex flex-col justify-between space-y-3">
          <div class="space-y-1.5">
            <div class="w-8 h-8 rounded-lg bg-[#FC6454]/10 text-[#FC6454] flex items-center justify-center">
              ${icon('Lock', 'w-4 h-4')}
            </div>
            <h4 class="text-sm font-bold font-sans">Club Registration Status</h4>
            <p class="text-xs text-[#282828]/60 dark:text-white">
              Currently: <strong class="font-mono text-emerald-600 dark:text-emerald-400">${settings.registrationStatus || 'OPEN'}</strong>. Toggle enrollment gates instantly.
            </p>
          </div>
          <button
            id="btn-toggle-reg-status"
            class="w-full py-2 px-3 rounded-lg text-xs font-bold ${
              settings.registrationStatus === 'CLOSED'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            } cursor-pointer border-0 transition-all shadow-xs">
            ${settings.registrationStatus === 'CLOSED' ? 'Open Club Registration' : 'Close Club Registration'}
          </button>
        </div>
      </div>

      <!-- Recent Audit Activity -->
      <div class="p-5 rounded-2xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-[#282828] dark:text-white font-sans">Executive Security Trail</h3>
            <p class="text-xs text-[#282828]/60 dark:text-white">Live administrative actions and authentication records</p>
          </div>
          <button
            data-president-tab="system"
            class="text-xs font-mono text-amber-600 dark:text-amber-400 hover:underline cursor-pointer border-0 bg-transparent">
            View All Logs →
          </button>
        </div>

        <div class="divide-y divide-[#282828]/5 dark:divide-[#25473C]">
          ${auditLogsList.slice(0, 5).map(log => `
            <div class="py-2.5 flex items-center justify-between text-xs">
              <div class="flex items-center gap-2.5">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span class="font-mono font-bold text-[#282828] dark:text-white">${escapeHtml(log.action)}</span>
                <span class="text-[#282828]/70 dark:text-white">${escapeHtml(log.details)}</span>
              </div>
              <div class="text-[11px] font-mono text-[#282828]/40 dark:text-white shrink-0">
                ${new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          `).join('') || '<div class="py-4 text-xs text-center text-[#282828]/40 dark:text-white">No security events logged yet.</div>'}
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: STAFF ADMINS & ROLES (PRESIDENT ONLY)
// ─────────────────────────────────────────────────────────────────────────────
function renderAdminsTab() {
  return `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-bold font-sans">Staff & Admin Hierarchy</h2>
          <p class="text-xs text-[#282828]/60 dark:text-white">
            Manage lower administrators, grant operational permissions, and reset staff credentials.
          </p>
        </div>
        <button
          id="btn-create-admin-modal"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer border-0 shadow-xs transition-all self-start sm:self-auto">
          ${icon('ShieldPlus', 'w-4 h-4')}
          <span>+ Appoint New Admin</span>
        </button>
      </div>

      <!-- Admins Table -->
      <div class="rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] overflow-hidden shadow-xs">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#282828]/5 dark:bg-[#0A211A] border-b border-[#282828]/10 dark:border-[#25473C] font-mono text-[11px] text-[#282828]/70 dark:text-white">
              <tr>
                <th class="p-3.5">Officer / Role</th>
                <th class="p-3.5">Identifier</th>
                <th class="p-3.5">Authority Level</th>
                <th class="p-3.5">Scoped Permissions</th>
                <th class="p-3.5">Status</th>
                <th class="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#282828]/5 dark:divide-[#25473C]">
              ${adminsList.map(admin => {
                const isPres = admin.role === 'president';
                return `
                  <tr class="hover:bg-[#282828]/[0.02] dark:hover:bg-[#15362B]/50 transition-colors">
                    <td class="p-3.5">
                      <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-lg ${isPres ? 'bg-amber-500/10 text-amber-600' : 'bg-teal-500/10 text-teal-600'} flex items-center justify-center font-bold">
                          ${isPres ? icon('Crown', 'w-4 h-4') : icon('Shield', 'w-4 h-4')}
                        </div>
                        <div>
                          <div class="font-bold text-[#282828] dark:text-white">${escapeHtml(admin.studentName)}</div>
                          <div class="text-[10px] text-[#282828]/50 dark:text-white">${escapeHtml(admin.class || 'Club Staff')}</div>
                        </div>
                      </div>
                    </td>
                    <td class="p-3.5 font-mono text-xs font-semibold text-[#282828] dark:text-white">
                      ${escapeHtml(admin.memberId)}
                    </td>
                    <td class="p-3.5">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isPres
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                          : 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30'
                      }">
                        ${isPres ? 'PRESIDENT (ABSOLUTE)' : 'STAFF ADMIN (SCOPED)'}
                      </span>
                    </td>
                    <td class="p-3.5">
                      <div class="flex flex-wrap gap-1 max-w-xs">
                        ${(admin.permissions || []).map(p => `
                          <span class="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#282828]/5 dark:bg-[#15362B] text-[#282828]/70 dark:text-white">
                            ${escapeHtml(p)}
                          </span>
                        `).join('')}
                      </div>
                    </td>
                    <td class="p-3.5">
                      <span class="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                      </span>
                    </td>
                    <td class="p-3.5 text-right space-x-1">
                      <button
                        data-action="reset-admin-pwd"
                        data-admin-id="${admin.id}"
                        data-admin-name="${escapeHtml(admin.studentName)}"
                        class="px-2.5 py-1 rounded-md text-[11px] font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 cursor-pointer border border-amber-500/20 bg-transparent">
                        Change Key
                      </button>
                      ${!isPres ? `
                        <button
                          data-action="delete-admin"
                          data-admin-id="${admin.id}"
                          data-admin-name="${escapeHtml(admin.studentName)}"
                          class="px-2.5 py-1 rounded-md text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer border border-rose-300 dark:border-rose-800 bg-transparent">
                          Revoke
                        </button>
                      ` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: MASTER MEMBERS (PRESIDENT DELETION & EDIT)
// ─────────────────────────────────────────────────────────────────────────────
function renderMembersTab() {
  const filtered = membersList.filter(m => {
    if (memberFilter !== 'all' && m.status !== memberFilter) return false;
    if (memberSearch) {
      const q = memberSearch.toLowerCase();
      const matchName = (m.studentName || '').toLowerCase().includes(q);
      const matchId = (m.memberId || '').toLowerCase().includes(q);
      const matchGrade = (m.class || '').toLowerCase().includes(q);
      return matchName || matchId || matchGrade;
    }
    return true;
  });

  return `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-bold font-sans">Master Member Directory</h2>
          <p class="text-xs text-[#282828]/60 dark:text-white">
            Absolute presidential controls: edit credentials, grant certificates, or permanently purge members.
          </p>
        </div>
        <div class="text-xs font-mono text-[#282828]/60 dark:text-white">
          Total: <strong class="text-[#282828] dark:text-white">${membersList.length}</strong> members
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1 relative">
          <input
            id="member-search-input"
            type="text"
            placeholder="Search by student name, Member ID, or Grade..."
            value="${escapeHtml(memberSearch)}"
            class="w-full px-3.5 py-2 pl-9 rounded-lg border border-[#282828]/20 dark:border-[#294B40] text-xs font-mono bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
          <div class="absolute left-3 top-2.5 text-[#282828]/40 dark:text-white">
            ${icon('Search', 'w-3.5 h-3.5')}
          </div>
        </div>
        <select
          id="member-filter-select"
          class="px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#294B40] text-xs font-sans bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30">
          <option value="all" ${memberFilter === 'all' ? 'selected' : ''}>All Statuses</option>
          <option value="approved" ${memberFilter === 'approved' ? 'selected' : ''}>Approved Members</option>
          <option value="pending" ${memberFilter === 'pending' ? 'selected' : ''}>Pending Review</option>
          <option value="suspended" ${memberFilter === 'suspended' ? 'selected' : ''}>Suspended</option>
        </select>
      </div>

      <!-- Members Table -->
      <div class="rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] overflow-hidden shadow-xs">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#282828]/5 dark:bg-[#0A211A] border-b border-[#282828]/10 dark:border-[#25473C] font-mono text-[11px] text-[#282828]/70 dark:text-white">
              <tr>
                <th class="p-3.5">Student Member</th>
                <th class="p-3.5">Member ID</th>
                <th class="p-3.5">Class / Track</th>
                <th class="p-3.5">Telegram</th>
                <th class="p-3.5">Status</th>
                <th class="p-3.5 text-right">Master Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#282828]/5 dark:divide-[#25473C]">
              ${filtered.map(member => `
                <tr class="hover:bg-[#282828]/[0.02] dark:hover:bg-[#15362B]/50 transition-colors">
                  <td class="p-3.5 font-bold text-[#282828] dark:text-white">
                    ${escapeHtml(member.studentName)}
                  </td>
                  <td class="p-3.5 font-mono text-xs text-[#282828] dark:text-white">
                    ${escapeHtml(member.memberId)}
                  </td>
                  <td class="p-3.5 text-[#282828]/70 dark:text-white">
                    ${escapeHtml(member.class || 'N/A')}
                  </td>
                  <td class="p-3.5 font-mono text-[11px] text-[#282828]/70 dark:text-white">
                    ${escapeHtml(member.telegramUsername || 'Not Linked')}
                  </td>
                  <td class="p-3.5">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      member.status === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                        : member.status === 'pending'
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                          : 'bg-rose-500/15 text-rose-800 dark:text-rose-300'
                    }">
                      ${member.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </td>
                  <td class="p-3.5 text-right space-x-1.5">
                    <button
                      data-action="perm-delete-member"
                      data-member-id="${member.id}"
                      data-member-name="${escapeHtml(member.studentName)}"
                      class="px-2.5 py-1 rounded-md text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer border border-rose-300 dark:border-rose-900 bg-transparent">
                      Delete Account (Permanent)
                    </button>
                  </td>
                </tr>
              `).join('')}
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="6" class="p-8 text-center text-xs text-[#282828]/40 dark:text-white">
                    No members matched your search criteria.
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: APPLICATIONS CLEARANCE
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// TAB: APPLICATIONS CLEARANCE
// ─────────────────────────────────────────────────────────────────────────────
function renderApplicationsTab() {
  const pendingCount = applicationsList.filter(a => a.status === 'pending').length;
  const approvedCount = applicationsList.filter(a => a.status === 'approved').length;
  const rejectedCount = applicationsList.filter(a => a.status === 'rejected').length;

  const filtered = applicationsList.filter(a => {
    if (applicationFilter === 'pending') return a.status === 'pending';
    if (applicationFilter === 'approved') return a.status === 'approved';
    if (applicationFilter === 'rejected') return a.status === 'rejected';
    return true; // 'all'
  });

  return `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold font-sans text-[#282828] dark:text-white">Presidential Application Review</h2>
          <p class="text-xs text-[#282828]/60 dark:text-white mt-0.5">
            Review student registrations with presidential authority. Inspect both selected course tracks and grant immediate portal access.
          </p>
        </div>
        <div class="flex items-center gap-1.5 p-1 bg-[#282828]/5 dark:bg-[#0A211A] rounded-lg border border-[#282828]/10 dark:border-[#25473C] text-xs font-mono">
          <button
            data-app-filter="pending"
            class="px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${applicationFilter === 'pending' ? 'bg-[#FC6454] text-white shadow-2xs' : 'text-[#282828]/70 dark:text-white hover:text-[#FC6454]'}">
            Pending (${pendingCount})
          </button>
          <button
            data-app-filter="approved"
            class="px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${applicationFilter === 'approved' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-[#282828]/70 dark:text-white hover:text-emerald-500'}">
            Approved (${approvedCount})
          </button>
          <button
            data-app-filter="rejected"
            class="px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${applicationFilter === 'rejected' ? 'bg-rose-600 text-white shadow-2xs' : 'text-[#282828]/70 dark:text-white hover:text-rose-500'}">
            Declined (${rejectedCount})
          </button>
          <button
            data-app-filter="all"
            class="px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${applicationFilter === 'all' ? 'bg-[#282828] dark:bg-white text-white dark:text-[#071A14] shadow-2xs' : 'text-[#282828]/70 dark:text-white'}">
            All (${applicationsList.length})
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${filtered.map(app => {
          let courses = Array.isArray(app.courses) && app.courses.length > 0
            ? app.courses
            : app.course
            ? [app.course]
            : [];
          if (courses.length === 0 && Array.isArray(app.courseIds) && app.courseIds.length > 0) {
            courses = app.courseIds.map(cid => {
              const matched = coursesList.find(cl => cl.id === cid || cl.slug === cid);
              return {
                id: cid,
                title: matched?.title || cid,
                category: matched?.category || 'Curriculum'
              };
            });
          }

          const statusBadge = app.status === 'pending'
            ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> PENDING REVIEW</span>`
            : app.status === 'approved'
            ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">✓ APPROVED & ENROLLED</span>`
            : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">✕ DECLINED</span>`;

          const essayText = app.statement || app.motivationEssay || app.essay || '';

          return `
            <div class="p-5 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs space-y-4 flex flex-col justify-between">
              <div class="space-y-3">
                <!-- Top row: Name, Member ID, Status -->
                <div class="flex items-start justify-between gap-2 border-b border-[#282828]/10 dark:border-[#25473C] pb-3">
                  <div>
                    <h4 class="text-base font-bold text-[#282828] dark:text-white font-sans">${escapeHtml(app.studentName)}</h4>
                    <div class="text-xs text-[#282828]/60 dark:text-white font-mono mt-0.5 flex flex-wrap items-center gap-2">
                      <span class="px-2 py-0.5 rounded bg-[#282828]/5 dark:bg-white/5 font-bold text-[#282828] dark:text-white">${escapeHtml(app.class || 'No Class')}</span>
                      <span>ID: <strong class="text-[#FC6454] dark:text-[#6BB89E]">${escapeHtml(app.memberId || 'Pending')}</strong></span>
                      <span>&bull; ${app.createdAt ? new Date(app.createdAt).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                  <div>${statusBadge}</div>
                </div>

                <!-- 2 Selected Courses Display -->
                <div class="p-3 rounded-lg bg-[#FAF4EE] dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-[#FC6454] dark:text-[#6BB89E] flex items-center gap-1.5">
                      ${icon('BookOpen', 'w-3.5 h-3.5')}
                      Selected Course Tracks (${courses.length} Track${courses.length === 1 ? '' : 's'})
                    </span>
                    <span class="text-[10px] font-mono text-[#282828]/50 dark:text-white">Mandatory 2 Tracks</span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    ${courses.length > 0 ? courses.map((c, i) => `
                      <div class="p-2.5 rounded-md bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] text-xs space-y-0.5">
                        <div class="flex items-center justify-between">
                          <span class="text-[10px] font-mono font-bold text-[#FC6454] dark:text-[#6BB89E]">TRACK #${i + 1}</span>
                          <span class="text-[10px] font-mono text-[#282828]/50 dark:text-white truncate max-w-[90px]">${escapeHtml(c.category || 'Curriculum')}</span>
                        </div>
                        <p class="font-bold text-[#282828] dark:text-white leading-snug">${escapeHtml(c.title || c.id)}</p>
                      </div>
                    `).join('') : `
                      <div class="col-span-2 text-xs text-[#282828]/60 dark:text-white italic">
                        ${escapeHtml(app.courseTitle || 'No courses enrolled')}
                      </div>
                    `}
                  </div>
                </div>

                <!-- Motivation Essay -->
                <div class="p-3 rounded-lg bg-[#282828]/5 dark:bg-[#071A14]/70 border border-[#282828]/10 dark:border-[#25473C] text-xs space-y-1">
                  <div class="font-mono text-[10px] uppercase font-bold text-[#282828]/60 dark:text-white flex items-center gap-1">
                    ${icon('FileText', 'w-3 h-3')} Motivation Statement:
                  </div>
                  <p class="text-xs text-[#282828]/85 dark:text-[#D1DDD7] leading-relaxed line-clamp-3 italic">
                    "${escapeHtml(essayText || 'No motivation statement provided.')}"
                  </p>
                </div>

                <!-- Contact & Telegram info -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono text-[#282828]/70 dark:text-white">
                  <div>
                    <span class="text-[#282828]/40 dark:text-white block text-[9px] uppercase">Phone</span>
                    ${app.phoneNumber ? `<a href="tel:${escapeHtml(app.phoneNumber)}" class="text-blue-600 dark:text-cyan-400 hover:underline truncate block">${escapeHtml(app.phoneNumber)}</a>` : '—'}
                  </div>
                  <div>
                    <span class="text-[#282828]/40 dark:text-white block text-[9px] uppercase">Telegram</span>
                    ${app.telegramUsername ? `<a href="https://t.me/${escapeHtml(app.telegramUsername.replace(/^@/, ''))}" target="_blank" rel="noopener noreferrer" class="text-sky-600 dark:text-sky-400 font-bold hover:underline truncate block">${escapeHtml(app.telegramUsername)}</a>` : '—'}
                  </div>
                  <div>
                    <span class="text-[#282828]/40 dark:text-white block text-[9px] uppercase">Email</span>
                    ${app.email ? `<a href="mailto:${escapeHtml(app.email)}" class="text-blue-600 dark:text-cyan-400 hover:underline truncate block">${escapeHtml(app.email)}</a>` : '—'}
                  </div>
                </div>

                <!-- Rejection note if any -->
                ${app.rejectionReason ? `
                  <div class="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 font-mono">
                    <strong>Decline Reason:</strong> ${escapeHtml(app.rejectionReason)}
                  </div>
                ` : ''}

                <!-- Award files if uploaded -->
                ${app.awardFiles && app.awardFiles.length > 0 ? `
                  <div class="pt-1 flex flex-wrap gap-2 items-center text-xs">
                    <span class="font-mono text-[10px] text-[#282828]/60 dark:text-white">Proof Files:</span>
                    ${app.awardFiles.map((f, idx) => `
                      <a href="${f.dataUrl || f.url || '#'}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:underline">
                        ${icon('Paperclip', 'w-3 h-3')} File #${idx + 1}
                      </a>
                    `).join('')}
                  </div>
                ` : ''}
              </div>

              <!-- Action buttons -->
              <div class="flex items-center justify-end gap-2 pt-3 border-t border-[#282828]/10 dark:border-[#25473C]">
                ${app.status === 'pending' ? `
                  <button
                    data-action="reject-app"
                    data-app-id="${app.id}"
                    class="px-3.5 py-1.5 rounded-md text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer border border-rose-300 dark:border-rose-900 bg-transparent transition-colors">
                    Decline
                  </button>
                  <button
                    data-action="approve-app"
                    data-app-id="${app.id}"
                    class="px-4 py-1.5 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer border-0 shadow-xs transition-colors">
                    Clear & Enroll
                  </button>
                ` : app.status === 'rejected' ? `
                  <button
                    data-action="delete-app"
                    data-app-id="${app.id}"
                    class="px-3 py-1.5 rounded-md text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer border border-rose-300 dark:border-rose-900 bg-transparent">
                    Delete
                  </button>
                  <button
                    data-action="approve-app"
                    data-app-id="${app.id}"
                    class="px-3.5 py-1.5 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer border-0 shadow-xs">
                    Re-Approve & Enroll
                  </button>
                ` : `
                  <button
                    data-action="reject-app"
                    data-app-id="${app.id}"
                    class="px-3.5 py-1.5 rounded-md text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer border border-rose-300 dark:border-rose-900 bg-transparent">
                    Revoke Clearance
                  </button>
                  <button
                    data-action="delete-app"
                    data-app-id="${app.id}"
                    class="px-3 py-1.5 rounded-md text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer border border-rose-300 dark:border-rose-900 bg-transparent">
                    Delete
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('')}

        ${filtered.length === 0 ? `
          <div class="col-span-2 p-12 text-center text-xs text-[#282828]/50 dark:text-white bg-white dark:bg-[#102B22] rounded-xl border border-dashed border-[#282828]/20 dark:border-[#25473C]">
            No ${applicationFilter !== 'all' ? applicationFilter : ''} applications in the records.
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: CERTIFICATES & SEAL
// ─────────────────────────────────────────────────────────────────────────────
function renderCertificatesTab() {
  return `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold font-sans">Certificates & Academic Seal</h2>
          <p class="text-xs text-[#282828]/60 dark:text-white">
            Official club credentials stamped with the Presidential Academic Seal.
          </p>
        </div>
        <span class="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
          ${certificatesList.length} Verified Credentials
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${certificatesList.map(cert => `
          <div class="p-4 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono text-[#282828]/50 dark:text-white">${escapeHtml(cert.certificateId)}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold ${cert.isRevoked ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}">
                ${cert.isRevoked ? 'REVOKED' : 'VERIFIED'}
              </span>
            </div>
            <h4 class="text-sm font-bold text-[#282828] dark:text-white">${escapeHtml(cert.studentName)}</h4>
            <p class="text-xs text-[#282828]/70 dark:text-white">${escapeHtml(cert.courseTitle || 'Curriculum Course')}</p>
            <div class="pt-2 flex items-center justify-between border-t border-[#282828]/5 dark:border-[#25473C] text-[11px]">
              <span class="text-[#282828]/50 dark:text-white">${new Date(cert.issueDate || cert.createdAt).toLocaleDateString()}</span>
              <button
                data-action="delete-cert"
                data-cert-id="${cert.id}"
                class="text-rose-600 hover:underline cursor-pointer border-0 bg-transparent text-[11px] font-bold">
                Revoke & Delete
              </button>
            </div>
          </div>
        `).join('')}
        ${certificatesList.length === 0 ? `
          <div class="col-span-3 p-12 text-center text-xs text-[#282828]/50 dark:text-white bg-white dark:bg-[#102B22] rounded-xl border border-dashed border-[#282828]/20 dark:border-[#25473C]">
            No certificates issued yet.
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: CURRICULUM TRACKS
// ─────────────────────────────────────────────────────────────────────────────
function renderCoursesTab() {
  return `
    <div class="space-y-6">
      <div>
        <h2 class="text-xl font-bold font-sans">Curriculum Tracks & Syllabi</h2>
        <p class="text-xs text-[#282828]/60 dark:text-white">
          The 4 core technical pillars of ARX IT CLUB OF SJS.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${coursesList.map(course => `
          <div class="p-5 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-400">
                ${escapeHtml(course.track || 'Track')}
              </span>
              <span class="text-xs font-mono font-bold text-[#282828] dark:text-white">${escapeHtml(course.code || 'ARX-CRS')}</span>
            </div>
            <h3 class="text-base font-bold text-[#282828] dark:text-white font-sans">${escapeHtml(course.title)}</h3>
            <p class="text-xs text-[#282828]/70 dark:text-white line-clamp-2">${escapeHtml(course.description)}</p>
            <div class="pt-2 flex items-center justify-between text-xs text-[#282828]/60 dark:text-white border-t border-[#282828]/5 dark:border-[#25473C]">
              <span>Instructor: ${escapeHtml(course.instructor || 'Club Advisor')}</span>
              <span>${escapeHtml(course.schedule || 'Lab Hours')}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: ATTENDANCE (PRESIDENTIAL EXECUTIVE OVERSIGHT)
// ─────────────────────────────────────────────────────────────────────────────
function renderAttendanceTab() {
  const clock = (() => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const eat = new Date(utc + (3600000 * 3));
    const h = eat.getHours();
    const m = eat.getMinutes();
    const s = eat.getSeconds();
    let ethH = h >= 6 && h < 18 ? h - 6 : (h >= 18 ? h - 18 : h + 6);
    if (ethH === 0) ethH = 12;
    const period = (h >= 6 && h < 12) ? 'Morning' : (h === 12 ? 'Midday' : (h >= 13 && h < 18 ? 'Afternoon' : 'Night'));
    const intl12 = (h % 12) || 12;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const minP = String(m).padStart(2, '0');
    const secP = String(s).padStart(2, '0');
    return {
      dateStr: eat.toISOString().split('T')[0],
      timeStr: `${String(h).padStart(2, '0')}:${minP}:${secP}`,
      ethiopianStr: `${ethH}:${minP} ${period}`,
      internationalStr: `${intl12}:${minP}:${secP} ${ampm} EAT`,
      isOpen: (h === 13 && m < 40),
      isPastDeadline: (h > 13 || (h === 13 && m >= 40))
    };
  })();

  const pendingReviews = attendanceRecordsList.filter(r => r.reviewStatus === 'Pending');
  const presentCount = attendanceRecordsList.filter(r => (r.finalClassification || r.status) === 'Present').length;
  const lateCount = attendanceRecordsList.filter(r => (r.finalClassification || r.status) === 'Late').length;
  const absentCount = attendanceRecordsList.filter(r => (r.finalClassification || r.status) === 'Absent').length;

  return `
    <div class="space-y-6">
      <!-- Top Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold font-sans">Lab Attendance Supreme Roster</h2>
          <p class="text-xs text-[#282828]/60 dark:text-white">
            Authoritative Ethiopian clock schedule oversight for Computer Lab 3 assemblies.
          </p>
        </div>
        <button
          id="btn-pres-jump-officer-att"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 cursor-pointer">
          ${icon('Shield', 'w-3.5 h-3.5')}
          <span>Open Full Officer Console</span>
        </button>
      </div>

      <!-- Live Clock Banner -->
      <div class="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 shadow-xs space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                <span class="w-1.5 h-1.5 rounded-full ${clock.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}"></span>
                ${clock.isOpen ? 'SUBMISSION WINDOW OPEN' : 'WINDOW CLOSED'}
              </span>
              <span class="text-[11px] font-mono text-[#282828]/60 dark:text-white">UTC+3 Addis Ababa</span>
            </div>
            <h3 class="text-lg font-bold text-[#282828] dark:text-white font-sans">
              Schedule: 7:00 – 7:40 Ethiopian Time (1:00 PM – 1:40 PM International)
            </h3>
            <p class="text-xs text-[#282828]/70 dark:text-white">
              On-Time Window: 7:00 to 7:30 • Late Grace Window: 7:30 to 7:40 • Hard Closing &amp; Absence Finalization: 7:40 onward.
            </p>
          </div>

          <div class="p-3.5 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] text-right min-w-[200px]">
            <div class="text-[10px] font-mono text-[#282828]/50 dark:text-white uppercase">Live Clock</div>
            <div class="text-xl font-black font-mono text-amber-600 dark:text-amber-400">${escapeHtml(clock.ethiopianStr)}</div>
            <div class="text-[11px] font-mono text-[#282828]/60 dark:text-white">${escapeHtml(clock.internationalStr)}</div>
          </div>
        </div>

        <!-- Metrics Row -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-amber-500/20 text-xs">
          <div class="p-3 rounded-lg bg-white/70 dark:bg-[#0A211A]/70 border border-[#282828]/10 dark:border-[#25473C]">
            <span class="text-[10px] font-mono uppercase text-[#282828]/50 dark:text-white block">Scheduled Sessions</span>
            <span class="text-lg font-bold font-mono">${attendanceSessionsList.length}</span>
          </div>
          <div class="p-3 rounded-lg bg-white/70 dark:bg-[#0A211A]/70 border border-[#282828]/10 dark:border-[#25473C]">
            <span class="text-[10px] font-mono uppercase text-[#282828]/50 dark:text-white block">Pending Officer Review</span>
            <span class="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">${pendingReviews.length}</span>
          </div>
          <div class="p-3 rounded-lg bg-white/70 dark:bg-[#0A211A]/70 border border-[#282828]/10 dark:border-[#25473C]">
            <span class="text-[10px] font-mono uppercase text-[#282828]/50 dark:text-white block">Present / Late Submissions</span>
            <span class="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">${presentCount} <span class="text-xs text-amber-600 font-normal">(${lateCount} late)</span></span>
          </div>
          <div class="p-3 rounded-lg bg-white/70 dark:bg-[#0A211A]/70 border border-[#282828]/10 dark:border-[#25473C]">
            <span class="text-[10px] font-mono uppercase text-[#282828]/50 dark:text-white block">Finalized Absences</span>
            <span class="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">${absentCount}</span>
          </div>
        </div>
      </div>

      <!-- Active Sessions List -->
      <div class="p-6 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-4">
        <h3 class="text-sm font-bold font-sans">Active &amp; Configured Attendance Sessions</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          ${attendanceSessionsList.map(s => {
            const isFin = s.status === 'finalized';
            return `
              <div class="p-4 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-[#282828]/5 dark:bg-[#0A211A] space-y-2.5">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">${escapeHtml(s.courseTitle || 'General Lab')}</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold ${isFin ? 'bg-emerald-500/15 text-emerald-600' : 'bg-blue-500/15 text-blue-600'}">
                    ${escapeHtml(s.status || 'PUBLISHED')}
                  </span>
                </div>
                <h4 class="text-xs font-bold font-sans">${escapeHtml(s.title)}</h4>
                <div class="text-[11px] font-mono text-[#282828]/60 dark:text-white space-y-0.5">
                  <div>Date: ${escapeHtml(s.date)}</div>
                  <div>Ethiopian Hours: ${escapeHtml(s.ethiopianOpenTime || '07:00')} – ${escapeHtml(s.ethiopianLateCutoff || '07:40')}</div>
                </div>
                <div class="pt-2 flex justify-between border-t border-[#282828]/10 dark:border-[#25473C]">
                  <button
                    data-action="pres-finalize-absences"
                    data-session-id="${s.id}"
                    class="px-2.5 py-1 rounded text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer border-0">
                    Finalize Absences
                  </button>
                </div>
              </div>
            `;
          }).join('')}
          ${attendanceSessionsList.length === 0 ? `
            <div class="col-span-3 p-8 text-center text-xs text-[#282828]/60 dark:text-white">No sessions configured.</div>
          ` : ''}
        </div>
      </div>

      <!-- Pending Reviews (Supreme Executive Authority) -->
      ${pendingReviews.length > 0 ? `
        <div class="p-6 rounded-xl border border-amber-500/30 bg-white dark:bg-[#102B22] shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold font-sans text-amber-700 dark:text-amber-300">
                Awaiting Presidential Clearance (${pendingReviews.length} Submissions)
              </h3>
              <p class="text-xs text-[#282828]/60 dark:text-white">
                Instant executive approval or rejection of student check-in submissions.
              </p>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-[#282828]/5 dark:bg-[#0A211A] border-b border-[#282828]/10 dark:border-[#25473C] font-mono text-[11px] text-[#282828]/70 dark:text-white">
                <tr>
                  <th class="p-2.5">Student</th>
                  <th class="p-2.5">Member ID</th>
                  <th class="p-2.5">Session</th>
                  <th class="p-2.5">Submission Time</th>
                  <th class="p-2.5">Provisional</th>
                  <th class="p-2.5 text-right">Supreme Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#282828]/5 dark:divide-[#25473C]">
                ${pendingReviews.map(r => `
                  <tr>
                    <td class="p-2.5 font-semibold">${escapeHtml(r.studentName)}</td>
                    <td class="p-2.5 font-mono font-bold text-amber-600">${escapeHtml(r.memberId)}</td>
                    <td class="p-2.5">${escapeHtml(r.sessionTitle)}</td>
                    <td class="p-2.5 font-mono text-[11px]">${escapeHtml(r.submissionTimeEthiopian || '')}</td>
                    <td class="p-2.5 font-bold ${r.finalClassification === 'Late' ? 'text-amber-600' : 'text-emerald-600'}">
                      ${escapeHtml(r.finalClassification || 'Present')}
                    </td>
                    <td class="p-2.5 text-right">
                      <button
                        data-action="pres-approve-att"
                        data-rec-id="${r.id}"
                        class="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer border-0">
                        Approve
                      </button>
                      <button
                        data-action="pres-reject-att"
                        data-rec-id="${r.id}"
                        class="px-2 py-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-semibold cursor-pointer border border-rose-300 dark:border-rose-900 ml-1">
                        Reject
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────
function renderAssignmentsTab() {
  return `
    <div class="space-y-6">
      <div>
        <h2 class="text-xl font-bold font-sans">Submissions & Grading Oversight</h2>
        <p class="text-xs text-[#282828]/60 dark:text-white">
          Review practical project work submitted by students across all 4 tracks.
        </p>
      </div>

      <div class="p-8 text-center text-xs text-[#282828]/50 dark:text-white bg-white dark:bg-[#102B22] rounded-xl border border-dashed border-[#282828]/20 dark:border-[#25473C]">
        ${icon('FolderGit2', 'w-10 h-10 mx-auto text-amber-500 mb-2')}
        All student code submissions and projects are synced with the repository reviewer.
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: TELEGRAM & BROADCASTS
// ─────────────────────────────────────────────────────────────────────────────
function renderTelegramTab() {
  return `
    <div class="space-y-6">
      <div>
        <h2 class="text-xl font-bold font-sans">Telegram Bot & Broadcast Hub</h2>
        <p class="text-xs text-[#282828]/60 dark:text-white">
          Direct communication layer to the official channel @arxitclub and club bot.
        </p>
      </div>

      <div class="p-6 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center">
            ${icon('Send', 'w-5 h-5')}
          </div>
          <div>
            <h4 class="text-sm font-bold font-sans">Official Bot Link</h4>
            <p class="text-xs font-mono text-teal-600 dark:text-teal-400">@${escapeHtml(settings.telegramBotUsername || 'ARXITCLUB_bot')}</p>
          </div>
        </div>

        <div class="pt-2 flex gap-2">
          <button
            id="btn-test-telegram-bot"
            class="px-4 py-2 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white cursor-pointer border-0 shadow-xs">
            Test Bot Connection
          </button>
          <button
            id="btn-sync-webhook"
            class="px-4 py-2 rounded-lg text-xs font-semibold bg-[#282828]/5 dark:bg-[#15362B] text-[#282828] dark:text-white hover:bg-[#282828]/10 cursor-pointer border-0">
            Sync Webhook
          </button>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: GOVERNANCE & IDENTITY
// ─────────────────────────────────────────────────────────────────────────────
function renderSettingsTab() {
  const currentWebsiteUrl = settings.websiteUrl || window.location.origin;
  const currentAdminUrl = settings.adminUrl || '/admin';
  const botUrl = settings.telegramBotUrl || `https://t.me/${settings.telegramBotUsername || 'ARXITCLUB_bot'}`;
  const channelUrl = settings.telegramChannelUrl || 'https://t.me/arxitclub';
  const isRegClosed = settings.registrationStatus === 'CLOSED';

  // Recent settings audit logs
  const settingsLogs = auditLogsList
    .filter(l => l.action?.includes('SETTINGS') || l.action?.includes('CONFIG') || l.action?.includes('REGISTRATION'))
    .slice(0, 5);

  return `
    <div class="space-y-6 max-w-5xl">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-bold font-sans text-[#282828] dark:text-white flex items-center gap-2">
            ${icon('Settings', 'w-5 h-5 text-amber-600 dark:text-amber-400')}
            Governance, Platform Endpoints &amp; URLs
          </h2>
          <p class="text-xs text-[#282828]/60 dark:text-white mt-0.5">
            Executive control over canonical domains, system routing, Telegram endpoints, and club identity metadata.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300">
            PRESIDENTIAL OVERRIDE ACTIVE
          </span>
        </div>
      </div>

      <!-- Registration Lifecycle Gate -->
      <div class="p-5 sm:p-6 rounded-xl border border-amber-500/20 dark:border-amber-500/15 bg-gradient-to-br from-amber-500/[0.05] via-white dark:via-[#102B22] to-transparent dark:bg-[#102B22] shadow-xs space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="space-y-1">
            <h3 class="text-sm font-bold text-[#282828] dark:text-white flex items-center gap-2">
              ${icon('ShieldCheck', 'w-4 h-4 text-amber-600 dark:text-amber-400')}
              Club Registration &amp; Student Intake Control
            </h3>
            <p class="text-xs text-[#282828]/70 dark:text-white">
              Instant master switch controlling applicant onboarding across public site and bot.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full text-xs font-bold font-mono ${
              isRegClosed
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
            }">
              ${isRegClosed ? '● REGISTRATION CLOSED' : '● REGISTRATION OPEN'}
            </span>
          </div>
        </div>

        <div class="p-3.5 rounded-lg bg-[#FAF4EE] dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <button
              type="button"
              id="btn-pres-reg-open"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isRegClosed
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#102B22] border border-[#282828]/20 dark:border-[#25473C] text-[#282828] dark:text-white hover:bg-amber-500/10'
              }">
              ${icon('Check', 'w-3.5 h-3.5 inline mr-1')} Open Registration
            </button>
            <button
              type="button"
              id="btn-pres-reg-close"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isRegClosed
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#102B22] border border-[#282828]/20 dark:border-[#25473C] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }">
              ${icon('XCircle', 'w-3.5 h-3.5 inline mr-1')} Close Registration
            </button>
          </div>
          <span class="text-xs font-mono text-[#282828]/60 dark:text-white">
            Current Intake: <strong class="${isRegClosed ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}">${isRegClosed ? 'Intake Closed' : 'Intake Open'}</strong>
          </span>
        </div>
      </div>

      <!-- Settings Form -->
      <form id="pres-settings-form" class="space-y-6 text-xs">
        <!-- Section: Canonical URLs & Web Endpoints -->
        <div class="p-6 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs space-y-5">
          <div class="flex items-center justify-between border-b border-[#282828]/10 dark:border-[#25473C] pb-3">
            <div>
              <h3 class="text-sm font-bold text-[#282828] dark:text-white flex items-center gap-2">
                ${icon('Globe', 'w-4 h-4 text-amber-600 dark:text-amber-400')}
                Canonical URLs &amp; Platform Endpoints
              </h3>
              <p class="text-xs text-[#282828]/70 dark:text-white mt-0.5">
                Configure official website domain, staff console route, Telegram bot/channel, and external social media.
              </p>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300">
              CONFIGURABLE ENDPOINTS
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Public Website URL -->
            <div class="space-y-1.5">
              <label class="block font-bold text-[#282828] dark:text-white">
                Canonical Public Website URL <span class="text-rose-500">*</span>
              </label>
              <div class="flex items-center gap-2">
                <input
                  name="websiteUrl"
                  type="url"
                  required
                  placeholder="https://arx-website-sjs.vercel.app"
                  value="${escapeHtml(settings.websiteUrl || '')}"
                  class="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white font-mono text-xs focus:border-amber-500 focus:outline-none">
                <button
                  type="button"
                  data-copy="${escapeHtml(currentWebsiteUrl)}"
                  title="Copy Website URL"
                  class="px-2.5 py-2 rounded-lg border border-[#282828]/15 dark:border-[#25473C] bg-[#FAF4EE] dark:bg-[#0A211A] hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] text-[#282828] dark:text-white cursor-pointer transition-colors shrink-0">
                  ${icon('Copy', 'w-3.5 h-3.5')}
                </button>
                <a
                  href="${escapeHtml(currentWebsiteUrl)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open Website in new tab"
                  class="px-2.5 py-2 rounded-lg border border-[#282828]/15 dark:border-[#25473C] bg-[#FAF4EE] dark:bg-[#0A211A] hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] text-amber-600 dark:text-amber-400 cursor-pointer transition-colors shrink-0">
                  ${icon('ExternalLink', 'w-3.5 h-3.5')}
                </a>
              </div>
              <p class="text-[11px] text-[#282828]/60 dark:text-white">Base domain used for certificates, QR verification codes, and SEO metadata.</p>
            </div>

            <!-- Admin URL -->
            <div class="space-y-1.5">
              <label class="block font-bold text-[#282828] dark:text-white">
                Admin Portal URL / Route <span class="text-rose-500">*</span>
              </label>
              <div class="flex items-center gap-2">
                <input
                  name="adminUrl"
                  type="text"
                  required
                  placeholder="/admin or /71354caa6bea2251"
                  value="${escapeHtml(settings.adminUrl || '')}"
                  class="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white font-mono text-xs focus:border-amber-500 focus:outline-none">
                <button
                  type="button"
                  data-copy="${escapeHtml(currentAdminUrl)}"
                  title="Copy Admin URL"
                  class="px-2.5 py-2 rounded-lg border border-[#282828]/15 dark:border-[#25473C] bg-[#FAF4EE] dark:bg-[#0A211A] hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] text-[#282828] dark:text-white cursor-pointer transition-colors shrink-0">
                  ${icon('Copy', 'w-3.5 h-3.5')}
                </button>
              </div>
              <p class="text-[11px] text-[#282828]/60 dark:text-white">Direct canonical route for staff &amp; administration operations.</p>
            </div>
          </div>

          <!-- Telegram Bot Settings -->
          <div class="p-4 rounded-xl bg-[#FAF4EE]/70 dark:bg-[#0A211A]/80 border border-[#282828]/10 dark:border-[#25473C] space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-[#282828] dark:text-white flex items-center gap-2">
                ${icon('Send', 'w-3.5 h-3.5 text-[#2AABEE]')}
                Official Telegram Bot Configuration
              </h4>
              <a href="${escapeHtml(botUrl)}" target="_blank" rel="noopener noreferrer" class="text-[11px] font-mono text-[#2AABEE] hover:underline flex items-center gap-1">
                <span>Test Bot Link</span>
                ${icon('ExternalLink', 'w-3 h-3')}
              </a>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-[#282828] dark:text-white mb-1">Bot Username</label>
                <input
                  name="telegramBotUsername"
                  type="text"
                  placeholder="ARXITCLUB_bot"
                  value="${escapeHtml(settings.telegramBotUsername || '')}"
                  class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white font-mono text-xs">
              </div>
              <div>
                <label class="block font-semibold text-[#282828] dark:text-white mb-1">Direct Bot URL</label>
                <div class="flex items-center gap-2">
                  <input
                    name="telegramBotUrl"
                    type="url"
                    placeholder="https://t.me/ARXITCLUB_bot"
                    value="${escapeHtml(settings.telegramBotUrl || '')}"
                    class="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white font-mono text-xs">
                  <button
                    type="button"
                    data-copy="${escapeHtml(botUrl)}"
                    title="Copy Bot Link"
                    class="px-2.5 py-2 rounded-lg border border-[#282828]/15 dark:border-[#25473C] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-[#15362B] transition-colors shrink-0">
                    ${icon('Copy', 'w-3.5 h-3.5')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Telegram Channel Settings -->
          <div class="p-4 rounded-xl bg-[#FAF4EE]/70 dark:bg-[#0A211A]/80 border border-[#282828]/10 dark:border-[#25473C] space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-[#282828] dark:text-white flex items-center gap-2">
                ${icon('Send', 'w-3.5 h-3.5 text-[#2AABEE]')}
                Official Telegram Channel &amp; Broadcasts
              </h4>
              <a href="${escapeHtml(channelUrl)}" target="_blank" rel="noopener noreferrer" class="text-[11px] font-mono text-[#2AABEE] hover:underline flex items-center gap-1">
                <span>Test Channel Link</span>
                ${icon('ExternalLink', 'w-3 h-3')}
              </a>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-[#282828] dark:text-white mb-1">Channel Handle / Name</label>
                <input
                  name="telegramChannelName"
                  type="text"
                  placeholder="@arxitclub"
                  value="${escapeHtml(settings.telegramChannelName || '')}"
                  class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white font-mono text-xs">
              </div>
              <div>
                <label class="block font-semibold text-[#282828] dark:text-white mb-1">Channel Broadcast Link</label>
                <div class="flex items-center gap-2">
                  <input
                    name="telegramChannelUrl"
                    type="url"
                    placeholder="https://t.me/arxitclub"
                    value="${escapeHtml(settings.telegramChannelUrl || '')}"
                    class="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white font-mono text-xs">
                  <button
                    type="button"
                    data-copy="${escapeHtml(channelUrl)}"
                    title="Copy Channel Link"
                    class="px-2.5 py-2 rounded-lg border border-[#282828]/15 dark:border-[#25473C] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-[#15362B] transition-colors shrink-0">
                    ${icon('Copy', 'w-3.5 h-3.5')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Social Profiles & External Links -->
          <div class="space-y-3">
            <h4 class="text-xs font-bold text-[#282828] dark:text-white">Community &amp; Social Links</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="block font-semibold text-[#282828] dark:text-white mb-1">GitHub Organization</label>
                <input
                  name="githubUrl"
                  type="url"
                  placeholder="https://github.com/ARX-IT-CLUB"
                  value="${escapeHtml(settings.githubUrl || '')}"
                  class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white text-xs">
              </div>
              <div>
                <label class="block font-semibold text-[#282828] dark:text-white mb-1">YouTube Channel</label>
                <input
                  name="youtubeUrl"
                  type="url"
                  placeholder="https://youtube.com/@arxitclub"
                  value="${escapeHtml(settings.youtubeUrl || '')}"
                  class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white text-xs">
              </div>
              <div>
                <label class="block font-semibold text-[#282828] dark:text-white mb-1">LinkedIn Page</label>
                <input
                  name="linkedinUrl"
                  type="url"
                  placeholder="https://linkedin.com/company/arx-it-club"
                  value="${escapeHtml(settings.linkedinUrl || '')}"
                  class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white text-xs">
              </div>
            </div>
          </div>
        </div>

        <!-- Section: Club Identity, Academic Metadata & Logistics -->
        <div class="p-6 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs space-y-5">
          <div class="border-b border-[#282828]/10 dark:border-[#25473C] pb-3">
            <h3 class="text-sm font-bold text-[#282828] dark:text-white flex items-center gap-2">
              ${icon('Shield', 'w-4 h-4 text-amber-600 dark:text-amber-400')}
              Club Identity, School Affiliation &amp; Logistics
            </h3>
            <p class="text-xs text-[#282828]/70 dark:text-white mt-0.5">
              Public branding, school department affiliation, contact info, and meeting details.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-[#282828] dark:text-white mb-1">Club Name</label>
              <input name="clubName" type="text" value="${escapeHtml(settings.clubName || '')}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">
            </div>
            <div>
              <label class="block font-bold text-[#282828] dark:text-white mb-1">Tagline</label>
              <input name="tagline" type="text" value="${escapeHtml(settings.tagline || '')}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-[#282828] dark:text-white mb-1">School Name</label>
              <input name="schoolName" type="text" value="${escapeHtml(settings.schoolName || '')}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">
            </div>
            <div>
              <label class="block font-bold text-[#282828] dark:text-white mb-1">School Department</label>
              <input name="schoolDepartment" type="text" value="${escapeHtml(settings.schoolDepartment || '')}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-[#282828] dark:text-white mb-1">Official Contact Email</label>
              <input name="contactEmail" type="email" value="${escapeHtml(settings.contactEmail || '')}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">
            </div>
            <div>
              <label class="block font-bold text-[#282828] dark:text-white mb-1">Official Contact Phone</label>
              <input name="contactPhone" type="text" value="${escapeHtml(settings.contactPhone || '')}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-[#282828] dark:text-white mb-1">Physical Lab Location</label>
              <input name="meetingLocation" type="text" value="${escapeHtml(settings.meetingLocation || '')}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">
            </div>
            <div>
              <label class="block font-bold text-[#282828] dark:text-white mb-1">Regular Meeting Schedule</label>
              <input name="meetingSchedule" type="text" value="${escapeHtml(settings.meetingSchedule || '')}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">
            </div>
          </div>

          <div>
            <label class="block font-bold text-[#282828] dark:text-white mb-1">Registration Closed Notice (Shown to applicants when intake is closed)</label>
            <textarea name="registrationClosedMessage" rows="2" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">${escapeHtml(settings.registrationClosedMessage || '')}</textarea>
          </div>

          <div>
            <label class="block font-bold text-[#282828] dark:text-white mb-1">Footer Tagline</label>
            <input name="footerText" type="text" value="${escapeHtml(settings.footerText || '')}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">
          </div>

          <div class="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#282828]/10 dark:border-[#25473C]">
            <p class="text-[11px] text-[#282828]/60 dark:text-white">
              Changes apply synchronously across all public routes, Telegram bot interactions, and certificates.
            </p>
            <div class="flex items-center gap-2">
              <button
                type="submit"
                class="px-5 py-2.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer active:scale-95 transition-all shadow-xs flex items-center gap-2">
                ${icon('Check', 'w-4 h-4')}
                <span>Save All Governance &amp; URL Settings</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      <!-- Settings Audit Trail -->
      ${settingsLogs.length > 0 ? `
        <div class="p-5 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs space-y-3">
          <div class="flex items-center justify-between border-b border-[#282828]/10 dark:border-[#25473C] pb-2">
            <h4 class="text-xs font-bold text-[#282828] dark:text-white flex items-center gap-1.5">
              ${icon('Clock', 'w-3.5 h-3.5 text-amber-600 dark:text-amber-400')}
              Recent Settings &amp; Governance Audit Records
            </h4>
            <span class="text-[10px] font-mono text-[#282828]/50 dark:text-white">Authoritative Log</span>
          </div>
          <div class="space-y-1.5">
            ${settingsLogs.map(log => `
              <div class="flex items-center justify-between p-2 rounded-lg bg-[#FAF4EE] dark:bg-[#0A211A] text-[11px] font-mono">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span class="font-bold text-[#282828] dark:text-white">${escapeHtml(log.action || 'SETTINGS_CHANGE')}</span>
                  <span class="text-[#282828]/60 dark:text-white">${escapeHtml(log.details || log.target || '')}</span>
                </div>
                <div class="text-[10px] text-[#282828]/50 dark:text-white">
                  ${log.adminId ? `Admin: ${escapeHtml(log.adminId)} • ` : ''}${new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: SYSTEM CORE & DATABASE BACKUP (PRESIDENT ONLY)
// ─────────────────────────────────────────────────────────────────────────────
function renderSystemTab() {
  return `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold font-sans">System Core & Database Backup</h2>
          <p class="text-xs text-[#282828]/60 dark:text-white">
            Supreme database export, live security logs, and infrastructure status.
          </p>
        </div>
        <button
          id="btn-export-full-db"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer border-0 shadow-xs">
          ${icon('Download', 'w-4 h-4')}
          <span>Download JSON Snapshot</span>
        </button>
      </div>

      <!-- Infrastructure Info -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-4 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-1">
          <div class="text-[10px] font-mono text-[#282828]/50 dark:text-white uppercase">Storage Mode</div>
          <div class="text-sm font-bold font-mono">Dual-Persistence</div>
          <div class="text-[10px] text-teal-600 dark:text-teal-400">Disk JSON + Supabase Sync</div>
        </div>
        <div class="p-4 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-1">
          <div class="text-[10px] font-mono text-[#282828]/50 dark:text-white uppercase">Security Standard</div>
          <div class="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">Cryptographic Salted Hash</div>
          <div class="text-[10px] text-[#282828]/60 dark:text-white">High-Entropy Passphrases</div>
        </div>
        <div class="p-4 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-1">
          <div class="text-[10px] font-mono text-[#282828]/50 dark:text-white uppercase">Total Audit Records</div>
          <div class="text-sm font-bold font-mono">${auditLogsList.length}</div>
          <div class="text-[10px] text-emerald-600 dark:text-emerald-400">Full Audit History</div>
        </div>
      </div>

      <!-- Complete Audit Log Table -->
      <div class="rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] overflow-hidden shadow-xs">
        <div class="p-4 border-b border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between">
          <h3 class="text-sm font-bold font-sans">Full Audit & Action Ledger</h3>
          <span class="text-xs font-mono text-[#282828]/50 dark:text-white">Latest 200 events</span>
        </div>
        <div class="overflow-x-auto max-h-96">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#282828]/5 dark:bg-[#0A211A] border-b border-[#282828]/10 dark:border-[#25473C] font-mono text-[11px] text-[#282828]/70 dark:text-white sticky top-0">
              <tr>
                <th class="p-3">Timestamp</th>
                <th class="p-3">Actor</th>
                <th class="p-3">Action</th>
                <th class="p-3">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#282828]/5 dark:divide-[#25473C]">
              ${auditLogsList.map(log => `
                <tr class="hover:bg-[#282828]/[0.02] dark:hover:bg-[#15362B]/50 transition-colors">
                  <td class="p-3 font-mono text-[11px] text-[#282828]/60 dark:text-white whitespace-nowrap">
                    ${new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td class="p-3 font-semibold text-[#282828] dark:text-white whitespace-nowrap">
                    ${escapeHtml(log.actor)}
                  </td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      ${escapeHtml(log.action)}
                    </span>
                  </td>
                  <td class="p-3 text-[#282828]/80 dark:text-white">
                    ${escapeHtml(log.details)}
                  </td>
                </tr>
              `).join('')}
              ${auditLogsList.length === 0 ? `
                <tr><td colspan="4" class="p-8 text-center text-xs text-[#282828]/40 dark:text-white">No audit entries recorded yet.</td></tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: EXECUTIVE SECURITY & PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
function renderSecurityTab() {
  return `
    <div class="space-y-6 max-w-xl">
      <div>
        <h2 class="text-xl font-bold font-sans">President Security Passphrase</h2>
        <p class="text-xs text-[#282828]/60 dark:text-white">
          Update the master presidential security key for supreme access.
        </p>
      </div>

      <div class="p-6 rounded-xl border border-amber-500/30 bg-white dark:bg-[#102B22] shadow-xs space-y-4">
        <form id="president-change-pwd-form" class="space-y-4 text-xs">
          <div>
            <label class="block font-bold mb-1.5 text-[#282828] dark:text-white">
              New President Passphrase
            </label>
            <input
              id="pres-new-pwd"
              type="password"
              required
              minlength="8"
              placeholder="Enter complex high-entropy passphrase..."
              class="w-full px-3.5 py-2.5 rounded-lg border border-[#282828]/20 dark:border-[#294B40] font-mono bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
            <p class="text-[11px] text-[#282828]/50 dark:text-white mt-1">
              Must be at least 8 characters. Recommended to include letters, digits, and symbols.
            </p>
          </div>

          <div>
            <label class="block font-bold mb-1.5 text-[#282828] dark:text-white">
              Confirm Passphrase
            </label>
            <input
              id="pres-confirm-pwd"
              type="password"
              required
              minlength="8"
              placeholder="Re-type new passphrase..."
              class="w-full px-3.5 py-2.5 rounded-lg border border-[#282828]/20 dark:border-[#294B40] font-mono bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
          </div>

          <button
            type="submit"
            class="w-full py-2.5 px-4 rounded-lg font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer border-0 shadow-xs transition-all">
            Update Presidential Key
          </button>
        </form>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: STUDENT PROJECT REVIEW
// ─────────────────────────────────────────────────────────────────────────────
function renderProjectReviewsTab() {
  const total = projectSubmissionsList.length;
  const pending = projectSubmissionsList.filter(s => s.status === 'pending').length;
  const approved = projectSubmissionsList.filter(s => s.status === 'approved').length;
  const needsRevision = projectSubmissionsList.filter(s => s.status === 'needs_revision').length;
  const rejected = projectSubmissionsList.filter(s => s.status === 'rejected').length;

  const statusBadge = (status) => {
    const map = {
      pending: ['bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30', '⏳ Pending Review'],
      approved: ['bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30', '✅ Approved'],
      needs_revision: ['bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30', '✏️ Needs Revision'],
      rejected: ['bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30', '❌ Not Accepted']
    };
    const [cls, label] = map[status] || ['bg-[#282828]/10 text-[#282828] dark:bg-[#15362B] dark:text-white border-transparent', status];
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${cls}">${label}</span>`;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-bold font-sans">Executive Student Project Review</h2>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              PRESIDENTIAL DESK
            </span>
          </div>
          <p class="text-xs text-[#282828]/60 dark:text-white mt-0.5">
            Student project deliverables submitted via the ARX Telegram Bot for presidential appraisal and faculty review.
          </p>
        </div>
        <button
          data-action="refresh-project-submissions"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-white dark:bg-[#102B22] hover:bg-amber-500/10 text-xs font-semibold text-[#282828] dark:text-white transition-colors cursor-pointer">
          ${icon('RefreshCw', 'w-3.5 h-3.5 mr-1 text-amber-500')} Refresh Submissions
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        ${[
          { label: 'Total Submitted', value: total, color: 'text-[#282828] dark:text-white', bg: 'bg-white dark:bg-[#102B22]', iconName: 'FolderGit2' },
          { label: 'Pending Review', value: pending, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-950/20', iconName: 'Clock' },
          { label: 'Approved', value: approved, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-950/20', iconName: 'CheckCircle' },
          { label: 'Needs Revision', value: needsRevision, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-950/20', iconName: 'Edit' }
        ].map(c => `
          <div class="rounded-xl border border-amber-500/20 dark:border-[#25473C] ${c.bg} p-4 flex flex-col gap-1 shadow-xs">
            <div class="flex items-center gap-2 text-[#282828]/50 dark:text-white">
              ${icon(c.iconName, 'w-4 h-4 text-amber-500')}
              <span class="text-[10px] font-mono uppercase tracking-wider">${c.label}</span>
            </div>
            <div class="text-2xl font-bold font-mono ${c.color}">${c.value}</div>
          </div>
        `).join('')}
      </div>

      <!-- Submissions Table -->
      <div class="rounded-xl border border-amber-500/20 dark:border-[#25473C] bg-white dark:bg-[#102B22] overflow-hidden shadow-xs">
        <div class="p-4 border-b border-amber-500/15 dark:border-[#25473C] flex items-center justify-between">
          <div class="flex items-center gap-2">
            ${icon('FolderGit2', 'w-4 h-4 text-amber-500')}
            <h3 class="text-xs font-bold font-sans uppercase tracking-wider text-[#282828] dark:text-white">
              Submitted Projects (${total})
            </h3>
          </div>
          <span class="text-[11px] font-mono text-amber-600 dark:text-amber-400">
            ${pending} awaiting evaluation
          </span>
        </div>

        ${projectSubmissionsList.length === 0 ? `
          <div class="p-12 text-center text-[#282828]/40 dark:text-white space-y-2">
            ${icon('FolderGit2', 'w-8 h-8 mx-auto opacity-40 text-amber-500')}
            <div class="text-xs font-medium">No student project submissions recorded yet.</div>
            <div class="text-[11px] font-mono">Students can send project files to the Telegram bot with /submitproject.</div>
          </div>
        ` : `
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-[#282828]/5 dark:bg-[#0A211A] border-b border-amber-500/15 dark:border-[#25473C] font-mono text-[11px] text-[#282828]/70 dark:text-white">
                <tr>
                  <th class="p-3.5">Student Member</th>
                  <th class="p-3.5">Project Title</th>
                  <th class="p-3.5">Deliverable File</th>
                  <th class="p-3.5">Submitted</th>
                  <th class="p-3.5">Status</th>
                  <th class="p-3.5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#282828]/5 dark:divide-[#25473C]">
                ${projectSubmissionsList.map(s => `
                  <tr class="hover:bg-amber-500/[0.03] dark:hover:bg-[#15362B]/50 transition-colors">
                    <td class="p-3.5">
                      <div class="font-bold text-[#282828] dark:text-white">${escapeHtml(s.studentName)}</div>
                      <div class="font-mono text-[11px] text-[#282828]/50 dark:text-white">${escapeHtml(s.memberId)} • ${escapeHtml(s.class || 'N/A')}</div>
                      ${s.telegramUsername ? `<div class="text-[10px] text-sky-600 dark:text-sky-400 font-mono">@${escapeHtml(s.telegramUsername.replace(/^@/, ''))}</div>` : ''}
                    </td>
                    <td class="p-3.5 max-w-xs">
                      <div class="font-semibold text-[#282828] dark:text-white line-clamp-1">${escapeHtml(s.title || 'Untitled Project')}</div>
                      ${s.description ? `<div class="text-[11px] text-[#282828]/60 dark:text-white line-clamp-1 mt-0.5">${escapeHtml(s.description)}</div>` : ''}
                    </td>
                    <td class="p-3.5 font-mono text-[11px]">
                      <div class="text-[#282828] dark:text-white truncate max-w-[150px]" title="${escapeHtml(s.fileName)}">
                        ${escapeHtml(s.fileName)}
                      </div>
                      <div class="text-[10px] text-[#282828]/40 dark:text-white">${formatBytes(s.fileSize)}</div>
                    </td>
                    <td class="p-3.5 font-mono text-[11px] text-[#282828]/50 dark:text-white whitespace-nowrap">
                      ${formatDate(s.submittedAt)}
                    </td>
                    <td class="p-3.5">
                      ${statusBadge(s.status)}
                      ${s.reviewNotes ? `<div class="text-[10px] text-[#282828]/60 dark:text-white mt-1 truncate max-w-[120px]" title="${escapeHtml(s.reviewNotes)}">Note: ${escapeHtml(s.reviewNotes)}</div>` : ''}
                    </td>
                    <td class="p-3.5 text-right whitespace-nowrap space-x-1.5">
                      <button
                        data-action="review-submission"
                        data-sub-id="${escapeHtml(s.id)}"
                        class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer border-0 shadow-xs inline-flex items-center gap-1">
                        ${icon('ClipboardCheck', 'w-3 h-3')} Review
                      </button>
                      ${s.storagePath ? `
                        <button
                          data-action="download-submission"
                          data-sub-id="${escapeHtml(s.id)}"
                          class="px-2 py-1 rounded-md text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 cursor-pointer border border-sky-300 dark:border-sky-800 bg-transparent inline-flex items-center gap-1">
                          ${icon('Download', 'w-3 h-3')} File
                        </button>
                      ` : ''}
                      <button
                        data-action="delete-submission"
                        data-sub-id="${escapeHtml(s.id)}"
                        data-sub-title="${escapeHtml(s.title || s.id)}"
                        class="px-2 py-1 rounded-md text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer border border-rose-300 dark:border-rose-900 bg-transparent inline-flex items-center gap-1">
                        ${icon('Trash2', 'w-3 h-3')}
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Telegram Bot Submission Info Card -->
      <div class="rounded-xl border border-amber-500/20 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-4 shadow-xs">
        <div class="flex items-start gap-3">
          ${icon('Send', 'w-4 h-4 text-amber-500 shrink-0 mt-0.5')}
          <div>
            <h3 class="text-xs font-semibold text-[#282828] dark:text-white mb-1">Telegram Project Submission Pipeline</h3>
            <p class="text-xs text-[#282828]/60 dark:text-white leading-relaxed">
              Enrolled students upload project archives (ZIP, PDF, documents, scripts) through the verified ARX Telegram Bot.
              Each submission is securely isolated, extension-verified, size-checked (up to 25MB), and placed in this queue.
              Once evaluated, status updates and feedback are immediately transmitted back to the student on Telegram.
            </p>
            <div class="mt-2 flex items-center gap-2">
              <span class="text-[10px] font-mono text-[#282828]/50 dark:text-white">Student Bot command:</span>
              <code class="text-[10px] bg-amber-500/10 dark:bg-[#294B40] text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">/submitproject</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODALS
// ─────────────────────────────────────────────────────────────────────────────
function renderActiveModal() {
  if (!activeModal) return '';

  if (activeModal === 'create_admin') {
    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div class="w-full max-w-md bg-white dark:bg-[#102B22] rounded-2xl border border-amber-500/30 p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold font-sans flex items-center gap-2">
              ${icon('ShieldPlus', 'w-4 h-4 text-amber-500')}
              <span>Appoint Lower Admin</span>
            </h3>
            <button class="text-xs opacity-60 hover:opacity-100 cursor-pointer border-0 bg-transparent" onclick="window.closePresidentModal()">&times;</button>
          </div>

          <form id="modal-create-admin-form" class="space-y-3.5 text-xs">
            <div>
              <label class="block font-bold mb-1">Username / Identifier</label>
              <input id="cadm-id" type="text" required placeholder="e.g. ARX-OFFICER-002 or mod.john" class="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white font-mono" />
            </div>

            <div>
              <label class="block font-bold mb-1">Officer Full Name</label>
              <input id="cadm-name" type="text" required placeholder="e.g. John Doe" class="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white" />
            </div>

            <div>
              <label class="block font-bold mb-1">Officer Title / Role</label>
              <input id="cadm-title" type="text" placeholder="e.g. Web Dev Track Coordinator" class="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white" />
            </div>

            <div>
              <label class="block font-bold mb-1">Initial Security Password</label>
              <input id="cadm-pwd" type="password" required minlength="6" placeholder="••••••••••••" class="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white font-mono" />
            </div>

            <div class="pt-2 flex items-center justify-end gap-2">
              <button type="button" class="px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer border border-[#282828]/20 dark:border-[#294B40] bg-transparent" onclick="window.closePresidentModal()">
                Cancel
              </button>
              <button type="submit" class="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer border-0 shadow-xs">
                Appoint Officer
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  if (activeModal === 'reset_admin_pwd') {
    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div class="w-full max-w-sm bg-white dark:bg-[#102B22] rounded-2xl border border-amber-500/30 p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold font-sans">Reset Security Key</h3>
            <button class="text-xs opacity-60 hover:opacity-100 cursor-pointer border-0 bg-transparent" onclick="window.closePresidentModal()">&times;</button>
          </div>
          <p class="text-xs text-[#282828]/70 dark:text-white">
            Enter a new security key for <strong>${escapeHtml(modalData?.name)}</strong>:
          </p>
          <form id="modal-reset-pwd-form" class="space-y-3.5 text-xs">
            <input id="reset-pwd-val" type="password" required minlength="6" placeholder="New strong key..." class="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white font-mono" />
            <div class="flex items-center justify-end gap-2">
              <button type="button" class="px-3 py-1.5 rounded-lg text-xs cursor-pointer border border-[#282828]/20 dark:border-[#294B40] bg-transparent" onclick="window.closePresidentModal()">Cancel</button>
              <button type="submit" class="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white cursor-pointer border-0">Save Key</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  if (activeModal === 'delete_member') {
    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div class="w-full max-w-sm bg-white dark:bg-[#102B22] rounded-2xl border border-rose-500/40 p-6 shadow-2xl space-y-4">
          <div class="w-10 h-10 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
            ${icon('AlertTriangle', 'w-5 h-5')}
          </div>
          <div class="text-center space-y-1">
            <h3 class="text-base font-bold font-sans text-rose-600 dark:text-rose-400">Permanently Delete Member?</h3>
            <p class="text-xs text-[#282828]/70 dark:text-white">
              Are you sure you want to permanently erase <strong>${escapeHtml(modalData?.name)}</strong>? All certificates, enrollments, and submissions will be cascaded and purged forever.
            </p>
          </div>
          <div class="flex items-center justify-center gap-2 pt-2">
            <button class="px-3.5 py-2 rounded-lg text-xs cursor-pointer border border-[#282828]/20 dark:border-[#294B40] bg-transparent" onclick="window.closePresidentModal()">Cancel</button>
            <button id="btn-confirm-delete-member" class="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer border-0 shadow-xs">
              Confirm & Purge
            </button>
          </div>
        </div>
      </div>
    `;
  }

  if (activeModal === 'review_submission' && modalData) {
    const s = modalData;
    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div class="w-full max-w-lg bg-white dark:bg-[#102B22] rounded-2xl border border-amber-500/30 p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold font-sans flex items-center gap-2 text-[#282828] dark:text-white">
              ${icon('ClipboardCheck', 'w-4 h-4 text-amber-500')}
              <span>Review Project: ${escapeHtml(s.title || 'Submission')}</span>
            </h3>
            <button class="text-xs opacity-60 hover:opacity-100 cursor-pointer border-0 bg-transparent text-[#282828] dark:text-white" onclick="window.closePresidentModal()">&times;</button>
          </div>

          <div class="p-3.5 rounded-xl bg-[#282828]/5 dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] space-y-1.5 text-xs font-mono">
            <div><span class="text-[#282828]/50 dark:text-white">Student:</span> <span class="font-semibold text-[#282828] dark:text-white">${escapeHtml(s.studentName)}</span></div>
            <div><span class="text-[#282828]/50 dark:text-white">Member ID:</span> <span class="font-semibold text-[#282828] dark:text-white">${escapeHtml(s.memberId)}</span></div>
            <div><span class="text-[#282828]/50 dark:text-white">Class / Track:</span> <span>${escapeHtml(s.class || '—')}</span></div>
            <div><span class="text-[#282828]/50 dark:text-white">File:</span> <span class="text-amber-600 dark:text-amber-400 font-bold">${escapeHtml(s.fileName)}</span></div>
            ${s.description ? `<div><span class="text-[#282828]/50 dark:text-white">Description:</span> <span class="text-[#282828] dark:text-white">${escapeHtml(s.description)}</span></div>` : ''}
            ${s.telegramUsername ? `<div><span class="text-[#282828]/50 dark:text-white">Telegram:</span> <span class="text-sky-600 dark:text-sky-400 font-semibold">${escapeHtml(s.telegramUsername)}</span></div>` : ''}
          </div>

          <form id="pres-review-submission-form" class="space-y-3.5 text-xs">
            <div>
              <label class="block font-bold mb-1.5 text-[#282828] dark:text-white">Review Decision *</label>
              <select id="pres-review-status" required
                class="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30">
                <option value="pending" ${s.status === 'pending' ? 'selected' : ''}>⏳ Pending Review</option>
                <option value="approved" ${s.status === 'approved' ? 'selected' : ''}>✅ Approved (Passed)</option>
                <option value="needs_revision" ${s.status === 'needs_revision' ? 'selected' : ''}>✏️ Needs Revision</option>
                <option value="rejected" ${s.status === 'rejected' ? 'selected' : ''}>❌ Not Accepted</option>
              </select>
            </div>

            <div>
              <label class="block font-bold mb-1.5 text-[#282828] dark:text-white">Executive Feedback / Notes</label>
              <textarea id="pres-review-notes" rows="3" placeholder="Provide feedback to student (sent via Telegram notification)..."
                class="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white text-xs resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-sans">${escapeHtml(s.reviewNotes || '')}</textarea>
            </div>

            <div class="pt-2 flex items-center justify-end gap-2">
              <button type="button" class="px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer border border-[#282828]/20 dark:border-[#294B40] bg-transparent text-[#282828] dark:text-white" onclick="window.closePresidentModal()">
                Cancel
              </button>
              <button type="submit" class="px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer border-0 shadow-xs">
                Save Decision & Notify
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  if (activeModal === 'approve_app' && modalData) {
    const app = modalData;
    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div class="w-full max-w-md bg-white dark:bg-[#102B22] rounded-2xl border border-emerald-500/40 p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold font-sans flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              ${icon('CheckCircle', 'w-4 h-4')}
              <span>Approve & Enroll Student</span>
            </h3>
            <button class="text-xs opacity-60 hover:opacity-100 cursor-pointer border-0 bg-transparent text-[#282828] dark:text-white" onclick="window.closePresidentModal()">&times;</button>
          </div>

          <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-1 text-xs font-mono">
            <div><span class="text-emerald-700/60 dark:text-emerald-400/60">Applicant:</span> <span class="font-semibold text-[#282828] dark:text-white">${escapeHtml(app.studentName)}</span></div>
            <div><span class="text-emerald-700/60 dark:text-emerald-400/60">Member ID:</span> <span class="font-semibold text-[#282828] dark:text-white">${escapeHtml(app.memberId)}</span></div>
            <div><span class="text-emerald-700/60 dark:text-emerald-400/60">Grade:</span> <span>${escapeHtml(app.class || '—')}</span></div>
            <div><span class="text-emerald-700/60 dark:text-emerald-400/60">Tracks:</span> <span>${escapeHtml(app.courseTitles || app.courseTitle || '—')}</span></div>
          </div>

          <p class="text-xs text-[#282828]/60 dark:text-white">
            Approving this application will activate the student's official membership and grant access to the student portal and enrolled course tracks.
          </p>

          <div class="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              class="px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer border border-[#282828]/20 dark:border-[#294B40] bg-transparent text-[#282828] dark:text-white hover:bg-[#282828]/5 transition-colors"
              onclick="window.closePresidentModal()"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-approve-app"
              type="button"
              class="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer border-0 shadow-xs transition-colors"
            >
              Confirm & Activate Student
            </button>
          </div>
        </div>
      </div>
    `;
  }

  if (activeModal === 'reject_app' && modalData) {
    const app = modalData;
    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div class="w-full max-w-md bg-white dark:bg-[#102B22] rounded-2xl border border-rose-500/40 p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold font-sans flex items-center gap-2 text-rose-600 dark:text-rose-400">
              ${icon('XCircle', 'w-4 h-4')}
              <span>Decline Application</span>
            </h3>
            <button class="text-xs opacity-60 hover:opacity-100 cursor-pointer border-0 bg-transparent text-[#282828] dark:text-white" onclick="window.closePresidentModal()">&times;</button>
          </div>

          <div class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-1 text-xs font-mono">
            <div><span class="text-rose-700/60 dark:text-rose-400/60">Applicant:</span> <span class="font-semibold text-[#282828] dark:text-white">${escapeHtml(app.studentName)}</span></div>
            <div><span class="text-rose-700/60 dark:text-rose-400/60">Member ID:</span> <span class="font-semibold text-[#282828] dark:text-white">${escapeHtml(app.memberId)}</span></div>
            <div><span class="text-rose-700/60 dark:text-rose-400/60">Grade:</span> <span>${escapeHtml(app.class || '—')}</span></div>
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-bold text-[#282828] dark:text-white">Rejection Reason <span class="font-normal opacity-60">(optional — shown to applicant)</span></label>
            <textarea
              id="pres-reject-reason-input"
              rows="3"
              placeholder="e.g. Prerequisites not met, invalid credentials..."
              class="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-rose-900/60 bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white text-xs resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/30 font-sans placeholder:text-[#282828]/30 dark:placeholder:text-[#7F9990]"
            ></textarea>
          </div>

          <div class="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              class="px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer border border-[#282828]/20 dark:border-[#294B40] bg-transparent text-[#282828] dark:text-white hover:bg-[#282828]/5 transition-colors"
              onclick="window.closePresidentModal()"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-reject-app"
              type="button"
              class="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer border-0 shadow-xs transition-colors"
            >
              Confirm Decline
            </button>
          </div>
        </div>
      </div>
    `;
  }

  return '';
}

// DOM Binding
function updateDOM() {
  const container = document.getElementById('president-dashboard-container');
  if (container) {
    container.innerHTML = renderPresidentDashboardPage();
    attachEvents();
    return;
  }
  const root = document.getElementById('root');
  if (root && router.getCurrentPath().startsWith('/president')) {
    root.innerHTML = renderPresidentDashboardPage();
    attachEvents();
  }
}

export function initPresidentDashboardPageEvents() {
  window.closePresidentModal = () => {
    activeModal = null;
    modalData = null;
    updateDOM();
  };

  loadPresidentData();
  attachEvents();
}

function attachEvents() {
  // Sidebar tab changes
  initPresidentSidebarEvents((newTab) => {
    activeTab = newTab;
    updateDOM();
  });

  // Top header actions
  const quickExportBtn = document.getElementById('btn-quick-export-db');
  if (quickExportBtn) {
    quickExportBtn.onclick = async () => {
      try {
        const data = await api.exportDatabase();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `arx_full_db_snapshot_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showFeedback('success', 'Full system database snapshot exported successfully.');
      } catch (err) {
        showFeedback('error', err?.message || 'Database export failed.');
      }
    };
  }

  const exportFullBtn = document.getElementById('btn-export-full-db');
  if (exportFullBtn) {
    exportFullBtn.onclick = quickExportBtn.onclick;
  }

  const actionDownloadDb = document.getElementById('btn-action-download-db');
  if (actionDownloadDb) {
    actionDownloadDb.onclick = quickExportBtn.onclick;
  }

  const jumpOfficerBtn = document.getElementById('btn-jump-officer-console');
  if (jumpOfficerBtn) {
    jumpOfficerBtn.onclick = () => {
      router.navigate(ADMIN_DASHBOARD_PATH);
    };
  }

  // Toggle registration lifecycle
  const toggleRegBtn = document.getElementById('btn-toggle-reg-status');
  if (toggleRegBtn) {
    toggleRegBtn.onclick = async () => {
      try {
        const nextStatus = settings.registrationStatus === 'CLOSED' ? 'OPEN' : 'CLOSED';
        const res = await api.toggleRegistrationStatus({ status: nextStatus });
        settings.registrationStatus = res.registrationStatus;
        showFeedback('success', `Club registration status updated to ${nextStatus}.`);
        updateDOM();
      } catch (err) {
        showFeedback('error', err.message || 'Failed to update registration status.');
      }
    };
  }

  const presRegOpenBtn = document.getElementById('btn-pres-reg-open');
  if (presRegOpenBtn) {
    presRegOpenBtn.onclick = async () => {
      try {
        const res = await api.setRegistrationStatus('OPEN', settings.registrationClosedMessage);
        settings.registrationStatus = 'OPEN';
        if (res?.settings) settings = { ...settings, ...res.settings };
        updateDOM();
        showFeedback('success', 'Club registration is now OPEN.');
      } catch (err) {
        showFeedback('error', err.message || 'Failed to open registration.');
      }
    };
  }

  const presRegCloseBtn = document.getElementById('btn-pres-reg-close');
  if (presRegCloseBtn) {
    presRegCloseBtn.onclick = async () => {
      try {
        const res = await api.setRegistrationStatus('CLOSED', settings.registrationClosedMessage);
        settings.registrationStatus = 'CLOSED';
        if (res?.settings) settings = { ...settings, ...res.settings };
        updateDOM();
        showFeedback('success', 'Club registration is now CLOSED.');
      } catch (err) {
        showFeedback('error', err.message || 'Failed to close registration.');
      }
    };
  }

  // Pres Settings Form
  const presSettingsForm = document.getElementById('pres-settings-form');
  if (presSettingsForm) {
    presSettingsForm.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(presSettingsForm);
      const data = Object.fromEntries(fd.entries());
      settings = { ...settings, ...data };
      try {
        const res = await api.updateAdminSettings(settings);
        if (res?.settings) settings = { ...settings, ...res.settings };
        showFeedback('success', 'Governance & URL settings saved successfully.');
        updateDOM();
      } catch (err) {
        showFeedback('error', err.message || 'Failed to save settings.');
      }
    };
  }

  // Global copy to clipboard handler for president dashboard
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();
      const val = btn.getAttribute('data-copy');
      if (val && navigator.clipboard) {
        navigator.clipboard.writeText(val).then(() => {
          showFeedback('success', 'Copied to clipboard!');
        }).catch(() => {
          showFeedback('error', 'Failed to copy to clipboard.');
        });
      }
    };
  });

  // Modals opening
  const openCreateAdminBtn = document.getElementById('btn-open-create-admin');
  if (openCreateAdminBtn) {
    openCreateAdminBtn.onclick = () => {
      activeModal = 'create_admin';
      updateDOM();
    };
  }

  const openCreateAdminModal = document.getElementById('btn-create-admin-modal');
  if (openCreateAdminModal) {
    openCreateAdminModal.onclick = () => {
      activeModal = 'create_admin';
      updateDOM();
    };
  }

  // Modal forms
  const createAdminForm = document.getElementById('modal-create-admin-form');
  if (createAdminForm) {
    createAdminForm.onsubmit = async (e) => {
      e.preventDefault();
      const idVal = document.getElementById('cadm-id')?.value.trim();
      const nameVal = document.getElementById('cadm-name')?.value.trim();
      const titleVal = document.getElementById('cadm-title')?.value.trim();
      const pwdVal = document.getElementById('cadm-pwd')?.value;

      try {
        await api.createAdmin({
          memberId: idVal,
          studentName: nameVal,
          officerTitle: titleVal,
          password: pwdVal,
          role: 'admin'
        });
        showFeedback('success', `Staff officer "${nameVal}" appointed successfully.`);
        activeModal = null;
        loadPresidentData();
      } catch (err) {
        showFeedback('error', err.message || 'Failed to appoint officer.');
      }
    };
  }

  // Reset Admin Password
  document.querySelectorAll('[data-action="reset-admin-pwd"]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-admin-id');
      const name = btn.getAttribute('data-admin-name');
      activeModal = 'reset_admin_pwd';
      modalData = { id, name };
      updateDOM();
    };
  });

  const resetPwdForm = document.getElementById('modal-reset-pwd-form');
  if (resetPwdForm) {
    resetPwdForm.onsubmit = async (e) => {
      e.preventDefault();
      const newKey = document.getElementById('reset-pwd-val')?.value;
      if (!modalData?.id || !newKey) return;
      try {
        await api.updateAdminPassword(modalData.id, newKey);
        showFeedback('success', `Security credentials for "${modalData.name}" updated successfully.`);
        activeModal = null;
        modalData = null;
        updateDOM();
      } catch (err) {
        showFeedback('error', err.message || 'Failed to update credentials.');
      }
    };
  }

  // Delete Lower Admin
  document.querySelectorAll('[data-action="delete-admin"]').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-admin-id');
      const name = btn.getAttribute('data-admin-name');
      if (confirm(`Revoke administrator clearance for "${name}"?`)) {
        try {
          await api.deleteAdmin(id);
          showFeedback('success', `Administrator account "${name}" revoked.`);
          loadPresidentData();
        } catch (err) {
          showFeedback('error', err.message || 'Failed to revoke administrator.');
        }
      }
    };
  });

  // Delete Member (Permanent Purge)
  document.querySelectorAll('[data-action="perm-delete-member"]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-member-id');
      const name = btn.getAttribute('data-member-name');
      activeModal = 'delete_member';
      modalData = { id, name };
      updateDOM();
    };
  });

  const confirmDeleteMemberBtn = document.getElementById('btn-confirm-delete-member');
  if (confirmDeleteMemberBtn) {
    confirmDeleteMemberBtn.onclick = async () => {
      if (!modalData?.id) return;
      try {
        await api.deleteAdminMember(modalData.id);
        showFeedback('success', `Member account for "${modalData.name}" was permanently purged.`);
        activeModal = null;
        modalData = null;
        loadPresidentData();
      } catch (err) {
        showFeedback('error', err.message || 'Failed to delete member account.');
      }
    };
  }

  // Application Filter Tabs
  document.querySelectorAll('[data-app-filter]').forEach(btn => {
    btn.onclick = () => {
      applicationFilter = btn.getAttribute('data-app-filter') || 'pending';
      updateDOM();
    };
  });

  // Approve / Reject / Delete Applications
  document.querySelectorAll('[data-action="approve-app"]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-app-id');
      const app = applicationsList.find(a => a.id === id);
      if (!app) return;
      activeModal = 'approve_app';
      modalData = app;
      updateDOM();
    };
  });

  // Approve-app modal confirm handler (attached after DOM update)
  const confirmApproveBtn = document.getElementById('btn-confirm-approve-app');
  if (confirmApproveBtn) {
    confirmApproveBtn.onclick = async () => {
      const app = modalData;
      if (!app) return;
      confirmApproveBtn.disabled = true;
      confirmApproveBtn.textContent = 'Processing...';
      try {
        await api.approveApplication(app.id);
        activeModal = null;
        modalData = null;
        showFeedback('success', `Application for ${app.studentName} approved and officially enrolled.`);
        await loadPresidentData();
      } catch (err) {
        confirmApproveBtn.disabled = false;
        confirmApproveBtn.textContent = 'Confirm & Activate Student';
        showFeedback('error', err.message || 'Approval failed.');
      }
    };
  }

  document.querySelectorAll('[data-action="reject-app"]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-app-id');
      const app = applicationsList.find(a => a.id === id);
      if (!app) return;
      activeModal = 'reject_app';
      modalData = app;
      updateDOM();
    };
  });

  // Reject-app modal confirm handler (attached after DOM update)
  const confirmRejectBtn = document.getElementById('btn-confirm-reject-app');
  if (confirmRejectBtn) {
    confirmRejectBtn.onclick = async () => {
      const app = modalData;
      if (!app) return;
      const reasonInput = document.getElementById('pres-reject-reason-input');
      const reason = reasonInput ? reasonInput.value.trim() : '';
      confirmRejectBtn.disabled = true;
      confirmRejectBtn.textContent = 'Processing...';
      try {
        await api.rejectApplication(app.id, reason || 'Did not meet club entry requirements.');
        activeModal = null;
        modalData = null;
        showFeedback('success', `Application for ${app.studentName} has been declined.`);
        await loadPresidentData();
      } catch (err) {
        confirmRejectBtn.disabled = false;
        confirmRejectBtn.textContent = 'Confirm Decline';
        showFeedback('error', err.message || 'Decline failed.');
      }
    };
  }

  document.querySelectorAll('[data-action="delete-app"]').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-app-id');
      if (confirm('Permanently purge this student application record? This action cannot be reversed.')) {
        try {
          await api.deleteAdminApplication(id);
          showFeedback('success', 'Application permanently deleted.');
          await loadPresidentData();
        } catch (err) {
          showFeedback('error', err.message || 'Failed to delete application.');
        }
      }
    };
  });

  // Delete Certificate
  document.querySelectorAll('[data-action="delete-cert"]').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-cert-id');
      if (confirm('Permanently delete and revoke this certificate?')) {
        try {
          await api.deleteAdminCertificate(id);
          showFeedback('success', 'Certificate revoked and purged.');
          loadPresidentData();
        } catch (err) {
          showFeedback('error', err.message || 'Failed to delete certificate.');
        }
      }
    };
  });

  // Member search input
  const searchInput = document.getElementById('member-search-input');
  if (searchInput) {
    searchInput.oninput = (e) => {
      memberSearch = e.target.value;
      updateDOM();
    };
  }

  const filterSelect = document.getElementById('member-filter-select');
  if (filterSelect) {
    filterSelect.onchange = (e) => {
      memberFilter = e.target.value;
      updateDOM();
    };
  }

  // President change password form
  const presPwdForm = document.getElementById('president-change-pwd-form');
  if (presPwdForm) {
    presPwdForm.onsubmit = async (e) => {
      e.preventDefault();
      const newPwd = document.getElementById('pres-new-pwd')?.value;
      const confirmPwd = document.getElementById('pres-confirm-pwd')?.value;

      if (newPwd !== confirmPwd) {
        showFeedback('error', 'Passphrases do not match.');
        return;
      }

      try {
        await api.changeAdminPassword(newPwd);
        showFeedback('success', 'Master President passphrase updated successfully.');
        presPwdForm.reset();
      } catch (err) {
        showFeedback('error', err.message || 'Failed to update passphrase.');
      }
    };
  }

  // Student Project Review Actions
  document.querySelectorAll('[data-action="refresh-project-submissions"]').forEach(btn => {
    btn.onclick = async () => {
      try {
        const psRes = await api.getAdminProjectSubmissions?.();
        if (psRes?.submissions) {
          projectSubmissionsList = psRes.submissions;
        }
        updateDOM();
        showFeedback('success', 'Student project submissions refreshed.');
      } catch (err) {
        showFeedback('error', err.message || 'Failed to refresh submissions.');
      }
    };
  });

  document.querySelectorAll('[data-action="review-submission"]').forEach(btn => {
    btn.onclick = () => {
      const subId = btn.getAttribute('data-sub-id');
      const sub = projectSubmissionsList.find(s => s.id === subId);
      if (sub) {
        activeModal = 'review_submission';
        modalData = sub;
        updateDOM();
      }
    };
  });

  document.querySelectorAll('[data-action="download-submission"]').forEach(btn => {
    btn.onclick = () => {
      const subId = btn.getAttribute('data-sub-id');
      if (subId) {
        const link = document.createElement('a');
        link.href = `/api/admin/project-submissions/${encodeURIComponent(subId)}/download`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
  });

  document.querySelectorAll('[data-action="delete-submission"]').forEach(btn => {
    btn.onclick = async () => {
      const subId = btn.getAttribute('data-sub-id');
      const subTitle = btn.getAttribute('data-sub-title');
      if (subId && confirm(`Permanently delete project submission "${subTitle || subId}"? This cannot be undone.`)) {
        try {
          await api.deleteAdminProjectSubmission(subId);
          projectSubmissionsList = projectSubmissionsList.filter(s => s.id !== subId);
          updateDOM();
          showFeedback('success', 'Project submission deleted.');
        } catch (err) {
          showFeedback('error', err.message || 'Failed to delete submission.');
        }
      }
    };
  });

  const presReviewForm = document.getElementById('pres-review-submission-form');
  if (presReviewForm) {
    presReviewForm.onsubmit = async (e) => {
      e.preventDefault();
      const status = document.getElementById('pres-review-status')?.value;
      const notes = (document.getElementById('pres-review-notes')?.value || '').trim();
      const subId = modalData?.id;
      if (!subId || !status) return;

      try {
        const res = await api.reviewAdminProjectSubmission(subId, { status, reviewNotes: notes });
        if (res?.submission) {
          const idx = projectSubmissionsList.findIndex(s => s.id === subId);
          if (idx !== -1) projectSubmissionsList[idx] = res.submission;
        }
        activeModal = null;
        modalData = null;
        updateDOM();
        showFeedback('success', `Project marked as "${status}". Student notified via Telegram.`);
      } catch (err) {
        showFeedback('error', err.message || 'Failed to save review.');
      }
    };
  }
}
