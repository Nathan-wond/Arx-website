import { api } from '../../../services/api.js';
import { authState, themeState, router, events } from '../../state.js';
import { icon } from '../../icons.js';
import { renderAdminSidebar, initAdminSidebarEvents } from '../../components/adminSidebar.js';
import { ADMIN_LOGIN_PATH } from '../../../config/adminRoute.js';

// ─── MODULE STATE ───────────────────────────────────────────────────────────
let activeTab = 'overview';
let feedback = null;
let feedbackTimer = null;

let overview = {
  totalMembers: 0,
  totalCourses: 0,
  completedCourses: 0,
  certificatesIssued: 0,
  awards: 0,
  projects: 0,
  upcomingEvents: 0
};
let applicationsList = [];
let loadingApplications = false;
let selectedApplicationDetail = null;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
let membersList = [];
let coursesList = [];
let enrollmentsList = [];
let certificatesList = [];
let awardsList = [];
let projectsList = [];
let eventsList = [];
let achievementsList = [];
let announcementsList = [];
let projectSubmissionsList = [];
let teamList = [];
let attendanceSessionsList = [];
let attendanceRecordsList = [];
let attendanceSubTab = 'sessions';
let attendanceFilter = { courseId: 'all', reviewStatus: 'all', classification: 'all', date: '', q: '' };
let selectedAbsenceSessionId = '';
let unsubmittedMembersList = [];
let loadingUnsubmitted = false;
let attendanceReviewModalRecord = null;
let attendanceRejectReason = '';
let attendanceCorrectionRecord = null;
let attendanceCorrectionClass = 'Present';
let attendanceCorrectionNotes = '';
let sessionForm = {
  courseId: 'general',
  title: '',
  date: '',
  ethiopianOpenTime: '07:00',
  ethiopianPresentCutoff: '07:30',
  ethiopianLateCutoff: '07:40',
  instructions: 'Computer Lab 3 attendance verification.',
  status: 'published'
};
let isSavingSession = false;
let sessionError = null;
let teamFilterCategory = 'all';
let isSavingTeamMember = false;
let teamMemberError = null;
let teamMemberForm = {
  name: '',
  role: '',
  category: 'instructor',
  specialty: '',
  department: '',
  photoUrl: '/uploads/student-leadership.svg',
  positionOffset: 'center 20%',
  description: '',
  socialLinks: { telegram: '', github: '', linkedin: '', email: '' },
  order: 10,
  isPublished: true
};
let isTransferringRole = false;
let transferRoleError = null;
let transferRoleForm = {
  sourceMemberId: '',
  targetMemberId: '',
  roleTitle: 'Chief Marketing Officer',
  newSourceRole: 'Front-End Development Instructor'
};
let settings = {
  clubName: 'ARX IT CLUB',
  tagline: 'Learn. Build. Grow.',
  description: '',
  contactEmail: '',
  telegramBotUsername: 'ARXITCLUB_bot',
  telegramBotUrl: 'https://t.me/ARXITCLUB_bot',
  telegramChannelUrl: 'https://t.me/arxitclub',
  telegramChannelName: '@arxitclub',
  githubUrl: '',
  youtubeUrl: '',
  heroHeadline: '',
  heroSubheadline: '',
  meetingLocation: '',
  meetingSchedule: '',
  footerText: '',
  logoUrl: '/assets/arx-logo-light.jpg',
  compactLogoUrl: '/assets/arx-logo-light.jpg',
  logoDarkUrl: '/assets/arx-logo-dark.jpg',
  compactLogoDarkUrl: '/assets/arx-logo-dark.jpg',
  symbolUrl: '/uploads/arx-symbol-mark.png',
  heroImageUrl: '/uploads/hero-banner.svg',
  aboutImageUrl: '/uploads/about-campus.svg',
  certificateStampUrl: '/uploads/certificate-seal.svg',
  registrationStatus: 'OPEN',
  registrationClosedMessage: ''
};

let memberSearch = '';
let memberFilterStatus = 'all';
let appFilterStatus = 'all';
let appSearch = '';
let enrollmentSearch = '';
let selectedMemberDetail = null;
let selectedMemberBadge = null;
let resetPasswordMember = null;
let newPasswordInput = '';
let editMemberForm = {
  studentName: '',
  class: '',
  phoneNumber: '',
  telegramUsername: '',
  award: ''
};

let modalType = null;
let activeItem = null;

let selectedMemberIds = new Set();
let generateCertForm = {
  memberId: '',
  studentName: '',
  courseName: 'Web & Software Engineering Track',
  role: 'MEMBER',
  achievement: 'Excellence in Software Development, Tech Innovation & Active Club Contribution',
  issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  deliverTelegram: true,
  deliverEmail: true
};
let isGeneratingCert = false;
let bulkCertForm = {
  courseName: 'Web & Software Engineering Track',
  role: 'MEMBER',
  achievement: 'Excellence in Software Development, Tech Innovation & Active Club Contribution',
  issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  deliverTelegram: true,
  deliverEmail: true
};
let isBulkGeneratingCert = false;

let webhookInfo = null;
let webhookLoading = false;
let webhookSyncing = false;
let webhookSyncMessage = null;
let botStatus = null;
let botStatusLoading = false;
let botTokenInput = '';
let showBotToken = false;
let savingBotToken = false;
let testingConnection = false;
let testResult = null;
let botCommandsList = [];
let syncingCommands = false;
let botContentSettings = null;
let savingBotContent = false;
let editingCommand = null;
let adminPasswordInput = '';

let isSavingCourse = false;
let courseError = null;
let courseForm = {
  title: '',
  description: '',
  longDescription: '',
  category: 'Web Development',
  difficulty: 'Beginner',
  duration: '4 weeks',
  instructor: 'IT Club Instructor',
  status: 'Available',
  topics: ['Introduction to Core Concepts', 'Hands-on Practice'],
  learningObjectives: ['Build functional projects'],
  requirements: ['Curiosity to learn'],
  certificateInfo: 'Verified Certificate awarded upon completion.',
  thumbnailUrl: '',
  bannerUrl: '',
  thumbnailMediaId: '',
  bannerMediaId: '',
  isPublished: true,
  isAvailableForRegistration: true
};

let isSavingProject = false;
let projectError = null;
let projectForm = {
  title: '',
  description: '',
  technologies: ['Software'],
  projectMembers: ['IT Club Members'],
  status: 'In Progress',
  category: 'Web App',
  date: '2026',
  imageUrl: '',
  githubUrl: '',
  liveDemoUrl: '',
  isPublished: true
};

let isSavingEvent = false;
let eventError = null;
let eventForm = {
  title: '',
  description: '',
  date: '',
  time: '',
  location: 'Computer Lab 3, Highschool',
  locationType: 'Onsite',
  organizer: 'IT Club Tech Committee',
  seatsAvailable: 30,
  status: 'Upcoming',
  imageUrl: '',
  coverImageUrl: '',
  isPublished: true
};

let certForm = { memberId: '', courseName: '', issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) };
let awardForm = { memberId: '', title: '', description: '', category: 'Excellence' };
let achievementForm = { title: '', description: '', category: 'Competition', year: new Date().getFullYear(), rank: '1st Place' };

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  feedback = { message, type };
  clearTimeout(feedbackTimer);
  const el = document.getElementById('admin-toast');
  if (el) {
    el.innerHTML = `
      <span class="shrink-0">${type === 'success' ? icon('CheckCircle', 'w-4 h-4 text-emerald-300') : icon('XCircle', 'w-4 h-4 text-rose-300')}</span>
      <span>${message}</span>`;
    el.className = `fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-md shadow-xl flex items-center gap-2 text-xs font-mono uppercase tracking-wider border animate-in fade-in ${
      type === 'success'
        ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
        : 'bg-rose-900 text-rose-100 border-rose-700'
    }`;
    el.style.display = 'flex';
    feedbackTimer = setTimeout(() => { if (el) el.style.display = 'none'; }, 4000);
  }
}

function badge(text, variant = 'slate', size = 'sm') {
  const colors = {
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    rose: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
  };
  const sz = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs';
  return `<span class="inline-flex items-center gap-1 rounded border font-mono font-semibold uppercase tracking-wider ${sz} ${colors[variant] || colors.slate}">${text}</span>`;
}

function btn(text, variant = 'outline', size = 'sm', extra = '') {
  const v = {
    primary: 'bg-[#FC6454] hover:bg-[#e8574a] text-white border-transparent',
    outline: 'bg-white dark:bg-[#102B22] border-[#282828]/20 dark:border-[#25473C] text-[#282828] dark:text-white hover:bg-[#EFE6DE] dark:hover:bg-[#15362B]',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white border-transparent',
    ghost: 'bg-transparent border-transparent text-[#282828]/70 dark:text-white hover:bg-[#EFE6DE] dark:hover:bg-[#15362B]',
  };
  const sz = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return `<button class="inline-flex items-center justify-center gap-1.5 rounded-md border font-medium transition-colors cursor-pointer ${sz} ${v[variant] || v.outline}" ${extra}>${text}</button>`;
}

function reRender(focusInputId = null) {
  const root = document.getElementById('admin-dashboard-root');
  if (root) {
    const fresh = buildDashboard();
    root.replaceWith(fresh);
  }
  bindEvents();
  if (focusInputId) {
    const el = document.getElementById(focusInputId);
    if (el) {
      el.focus();
      const len = el.value.length;
      try { el.setSelectionRange(len, len); } catch {}
    }
  }
}

// ─── DATA LOADING ─────────────────────────────────────────────────────────────
async function loadAllAdminData() {
  try {
    const [ovRes, membersRes, coursesRes, certsRes, awardsRes, projRes, eventsRes, achieveRes, enrollRes, settingsRes, annRes, projSubsRes, appsRes, govRes, attSessRes, attRecRes] = await Promise.allSettled([
      api.getAdminOverview(),
      api.getAdminMembers(),
      api.getAdminCourses(),
      api.getAdminCertificates(),
      api.getAdminAwards(),
      api.getAdminProjects(),
      api.getAdminEvents(),
      api.getAdminAchievements(),
      api.getAdminEnrollments?.() || Promise.resolve({ enrollments: [] }),
      api.getAdminSettings(),
      api.getAdminAnnouncements?.() || Promise.resolve({ announcements: [] }),
      api.getAdminProjectSubmissions?.() || Promise.resolve({ submissions: [] }),
      api.getAdminApplications?.('all') || Promise.resolve({ applications: [] }),
      api.getAdminGovernance?.() || Promise.resolve({ governance: [] }),
      api.getAdminAttendanceSessions?.() || Promise.resolve({ sessions: [] }),
      api.getAdminAttendanceRecords?.() || Promise.resolve({ records: [] })
    ]);
    if (ovRes.status === 'fulfilled' && ovRes.value?.stats) overview = { ...overview, ...ovRes.value.stats };
    if (membersRes.status === 'fulfilled' && membersRes.value?.members) membersList = membersRes.value.members;
    if (coursesRes.status === 'fulfilled' && coursesRes.value?.courses) coursesList = coursesRes.value.courses;
    if (certsRes.status === 'fulfilled' && certsRes.value?.certificates) certificatesList = certsRes.value.certificates;
    if (awardsRes.status === 'fulfilled' && awardsRes.value?.awards) awardsList = awardsRes.value.awards;
    if (projRes.status === 'fulfilled' && projRes.value?.projects) projectsList = projRes.value.projects;
    if (eventsRes.status === 'fulfilled' && eventsRes.value?.events) eventsList = eventsRes.value.events;
    if (achieveRes.status === 'fulfilled' && achieveRes.value?.achievements) achievementsList = achieveRes.value.achievements;
    if (enrollRes.status === 'fulfilled' && enrollRes.value?.enrollments) enrollmentsList = enrollRes.value.enrollments;
    if (settingsRes.status === 'fulfilled' && settingsRes.value?.settings) settings = { ...settings, ...settingsRes.value.settings };
    if (annRes.status === 'fulfilled' && annRes.value?.announcements) announcementsList = annRes.value.announcements;
    if (projSubsRes.status === 'fulfilled' && projSubsRes.value?.submissions) projectSubmissionsList = projSubsRes.value.submissions;
    if (appsRes.status === 'fulfilled' && (appsRes.value?.applications || appsRes.value?.members)) {
      applicationsList = appsRes.value.applications || appsRes.value.members || [];
    }
    if (govRes.status === 'fulfilled') {
      teamList = govRes.value?.governance || govRes.value?.team || [];
    }
    if (attSessRes.status === 'fulfilled' && attSessRes.value?.sessions) {
      attendanceSessionsList = attSessRes.value.sessions;
    }
    if (attRecRes.status === 'fulfilled' && attRecRes.value?.records) {
      attendanceRecordsList = attRecRes.value.records;
    }
  } catch (err) {
    console.error('[AdminDashboard] Data load error', err);
  }
  reRender();
}

async function loadApplications() {
  loadingApplications = true;
  try {
    const res = await api.getAdminApplications('all');
    applicationsList = res?.applications || res?.members || [];
  } catch {
    applicationsList = [];
  }
  loadingApplications = false;
}

async function loadTelegramBotData() {
  botStatusLoading = true;
  try {
    const [statusRes, commandsRes, contentRes] = await Promise.allSettled([
      api.getAdminTelegramStatus(),
      api.getAdminBotCommands(),
      api.getAdminBotContent()
    ]);
    if (statusRes.status === 'fulfilled' && statusRes.value?.status) botStatus = statusRes.value.status;
    if (commandsRes.status === 'fulfilled' && commandsRes.value?.commands) botCommandsList = commandsRes.value.commands;
    if (contentRes.status === 'fulfilled' && contentRes.value?.content) botContentSettings = contentRes.value.content;
  } catch {}
  botStatusLoading = false;
}

async function loadWebhookInfo() {
  webhookLoading = true;
  try {
    const res = await api.getTelegramWebhookInfo();
    webhookInfo = res;
  } catch {}
  webhookLoading = false;
}

// ─── TAB CONTENT BUILDERS ─────────────────────────────────────────────────────

function buildOverviewTab() {
  const pending = applicationsList.filter(a => a.status === 'pending');
  return `
    <div class="space-y-6">
      ${pending.length > 0 ? `
        <div data-action="go-applications" class="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition-all shadow-xs">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              ${icon('ClipboardCheck', 'w-5 h-5')}
            </div>
            <div>
              <h4 class="font-bold text-sm text-amber-900 dark:text-amber-200">${pending.length} Pending Application${pending.length > 1 ? 's' : ''} Awaiting Review</h4>
              <p class="text-xs text-amber-700 dark:text-amber-300">New students have registered and require manual administrator review before they can access the portal.</p>
            </div>
          </div>
          <span class="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-semibold shrink-0">Review Applications &rarr;</span>
        </div>` : ''}

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="p-5 bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] text-[#282828] dark:text-white space-y-1 rounded-lg shadow-xs transition-colors">
          <div class="flex items-center justify-between text-[#FC6454] dark:text-[#6BB89E]">${icon('Users', 'w-4 h-4')}<span class="text-[10px] font-mono uppercase tracking-wider text-[#282828]/50 dark:text-white">MEMBERS</span></div>
          <p class="text-3xl font-bold font-mono tabular-nums">${overview.totalMembers}</p>
          <p class="text-xs font-mono uppercase tracking-wider text-[#282828]/60 dark:text-white">Total Members</p>
        </div>
        <div class="p-5 bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] text-[#282828] dark:text-white space-y-1 rounded-lg shadow-xs transition-colors">
          <div class="flex items-center justify-between text-[#FC6454] dark:text-[#6BB89E]">${icon('BookOpen', 'w-4 h-4')}<span class="text-[10px] font-mono uppercase tracking-wider text-[#282828]/50 dark:text-white">TRACKS</span></div>
          <p class="text-3xl font-bold font-mono tabular-nums">${overview.totalCourses}</p>
          <p class="text-xs font-mono uppercase tracking-wider text-[#282828]/60 dark:text-white">Total Courses</p>
        </div>
        <div class="p-5 bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] text-[#282828] dark:text-white space-y-1 rounded-lg shadow-xs transition-colors">
          <div class="flex items-center justify-between text-emerald-600 dark:text-[#58B889]">${icon('Award', 'w-4 h-4')}<span class="text-[10px] font-mono uppercase tracking-wider text-[#282828]/50 dark:text-white">CREDENTIALS</span></div>
          <p class="text-3xl font-bold font-mono text-emerald-600 dark:text-[#58B889] tabular-nums">${overview.certificatesIssued}</p>
          <p class="text-xs font-mono uppercase tracking-wider text-[#282828]/60 dark:text-white">Certificates Issued</p>
        </div>
        <div class="p-5 bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] text-[#282828] dark:text-white space-y-1 rounded-lg shadow-xs transition-colors">
          <div class="flex items-center justify-between text-amber-600 dark:text-[#D6A84F]">${icon('Calendar', 'w-4 h-4')}<span class="text-[10px] font-mono uppercase tracking-wider text-[#282828]/50 dark:text-white">SESSIONS</span></div>
          <p class="text-3xl font-bold font-mono tabular-nums">${overview.upcomingEvents}</p>
          <p class="text-xs font-mono uppercase tracking-wider text-[#282828]/60 dark:text-white">Upcoming Events</p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div class="p-4 bg-white dark:bg-[#15362B] border border-[#282828]/10 dark:border-[#25473C] text-center rounded-lg shadow-xs transition-colors">
          <p class="text-xl font-bold font-mono text-[#FC6454] dark:text-[#6BB89E] tabular-nums">${overview.completedCourses}</p>
          <p class="text-[11px] font-mono uppercase tracking-wider text-[#282828]/60 dark:text-white mt-1">Completed Enrollments</p>
        </div>
        <div class="p-4 bg-white dark:bg-[#15362B] border border-[#282828]/10 dark:border-[#25473C] text-center rounded-lg shadow-xs transition-colors">
          <p class="text-xl font-bold font-mono text-[#FC6454] dark:text-[#6BB89E] tabular-nums">${overview.projects}</p>
          <p class="text-[11px] font-mono uppercase tracking-wider text-[#282828]/60 dark:text-white mt-1">Club Projects</p>
        </div>
        <div class="p-4 bg-white dark:bg-[#15362B] border border-[#282828]/10 dark:border-[#25473C] text-center rounded-lg shadow-xs transition-colors">
          <p class="text-xl font-bold font-mono text-amber-600 dark:text-[#D6A84F] tabular-nums">${overview.awards}</p>
          <p class="text-[11px] font-mono uppercase tracking-wider text-[#282828]/60 dark:text-white mt-1">Assigned Awards</p>
        </div>
      </div>

      <div class="p-6 bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] space-y-4 rounded-lg shadow-xs transition-colors">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#282828]/10 dark:border-[#25473C] pb-3">
          <div class="flex items-center gap-2">
            ${icon('ShieldCheck', 'w-5 h-5 text-[#FC6454] dark:text-[#6BB89E]')}
            <div>
              <h3 class="text-sm font-bold text-[#282828] dark:text-white uppercase tracking-wider font-mono">Student Registration Lifecycle</h3>
              <p class="text-xs text-[#282828]/60 dark:text-white font-sans">Authoritative backend control over member registration availability.</p>
            </div>
          </div>
          ${badge(settings.registrationStatus === 'CLOSED' ? 'Registration Closed' : 'Registration Open', settings.registrationStatus === 'CLOSED' ? 'rose' : 'emerald', 'md')}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div class="text-xs text-[#282828]/70 dark:text-white font-sans space-y-2 leading-relaxed">
            <p>When <strong>Registration is Closed</strong>, public &ldquo;Join Club&rdquo; links and registration forms are deactivated.</p>
            <div class="font-mono text-[11px] text-[#282828]/60 dark:text-white">Authoritative DB State: <strong class="${settings.registrationStatus === 'CLOSED' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-[#58B889]'}">${settings.registrationStatus || 'OPEN'}</strong></div>
          </div>
          <div class="flex flex-col sm:flex-row items-center gap-3 justify-end">
            ${btn(icon('Check', 'w-3.5 h-3.5') + ' Open Registration', settings.registrationStatus !== 'CLOSED' ? 'outline' : 'primary', 'md', 'data-action="reg-open"')}
            ${btn(icon('XCircle', 'w-3.5 h-3.5') + ' Close Registration', settings.registrationStatus === 'CLOSED' ? 'outline' : 'danger', 'md', 'data-action="reg-close"')}
          </div>
        </div>
      </div>

      <div class="p-6 bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] space-y-2 rounded-lg shadow-xs transition-colors">
        <h3 class="text-base font-bold text-[#282828] dark:text-white flex items-center gap-2">
          ${icon('Shield', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]')} Live Operational State (Real Records)
        </h3>
        <p class="text-xs text-[#282828]/70 dark:text-white leading-relaxed font-sans">
          All metrics reflect actual database records. Use the sidebar to create courses, post projects, schedule events, publish achievements, and issue verified credentials to students.
        </p>
      </div>
    </div>`;
}

function buildApplicationsTab() {
  const pending = applicationsList.filter(a => a.status === 'pending');
  const approved = applicationsList.filter(a => a.status === 'approved' || a.status === 'active');
  const rejected = applicationsList.filter(a => a.status === 'rejected');

  if (loadingApplications) return `<div class="p-12 text-center text-[#282828]/60 dark:text-white">${icon('RefreshCw', 'w-6 h-6 mx-auto mb-2 animate-spin')} Loading applications...</div>`;

  const filtered = applicationsList.filter(a => {
    if (appFilterStatus === 'pending' && a.status !== 'pending') return false;
    if (appFilterStatus === 'approved' && a.status !== 'approved' && a.status !== 'active') return false;
    if (appFilterStatus === 'rejected' && a.status !== 'rejected') return false;
    if (!appSearch) return true;
    const s = appSearch.toLowerCase();
    return (a.studentName || a.name || '').toLowerCase().includes(s) ||
           (a.memberId || '').toLowerCase().includes(s) ||
           (a.email || '').toLowerCase().includes(s) ||
           (a.phoneNumber || '').toLowerCase().includes(s) ||
           (a.class || '').toLowerCase().includes(s) ||
           (a.courseTitle || '').toLowerCase().includes(s) ||
           (Array.isArray(a.courses) && a.courses.some(c => (c.title || '').toLowerCase().includes(s)));
  });

  return `
    <div class="space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Status Filter Tabs -->
        <div class="flex flex-wrap items-center gap-1.5 p-1 bg-[#FAF4EE] dark:bg-[#0A211A] rounded-lg border border-[#282828]/10 dark:border-[#25473C] text-xs font-mono">
          <button data-action="filter-apps" data-filter="all" class="px-3 py-1 rounded-md transition-colors cursor-pointer ${appFilterStatus === 'all' ? 'bg-[#FC6454] text-white font-bold shadow-xs' : 'text-[#282828]/70 dark:text-white hover:bg-black/5 dark:hover:bg-white/5'}">
            All <span class="opacity-80">(${applicationsList.length})</span>
          </button>
          <button data-action="filter-apps" data-filter="pending" class="px-3 py-1 rounded-md transition-colors cursor-pointer ${appFilterStatus === 'pending' ? 'bg-amber-600 text-white font-bold shadow-xs' : 'text-[#282828]/70 dark:text-white hover:bg-black/5 dark:hover:bg-white/5'}">
            Pending <span class="opacity-80">(${pending.length})</span>
          </button>
          <button data-action="filter-apps" data-filter="approved" class="px-3 py-1 rounded-md transition-colors cursor-pointer ${appFilterStatus === 'approved' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-[#282828]/70 dark:text-white hover:bg-black/5 dark:hover:bg-white/5'}">
            Approved <span class="opacity-80">(${approved.length})</span>
          </button>
          <button data-action="filter-apps" data-filter="rejected" class="px-3 py-1 rounded-md transition-colors cursor-pointer ${appFilterStatus === 'rejected' ? 'bg-rose-600 text-white font-bold shadow-xs' : 'text-[#282828]/70 dark:text-white hover:bg-black/5 dark:hover:bg-white/5'}">
            Rejected <span class="opacity-80">(${rejected.length})</span>
          </button>
        </div>

        <!-- Search & Refresh -->
        <div class="flex items-center gap-2">
          <div class="relative">
            <input type="text" id="app-search-input" placeholder="Search applicant, ID, track..." value="${escapeHtml(appSearch)}" class="px-3 py-1.5 pl-8 text-xs rounded-md bg-white dark:bg-[#102B22] border border-[#282828]/20 dark:border-[#25473C] text-[#282828] dark:text-white w-64 focus:outline-hidden focus:border-[#FC6454]" />
            <span class="absolute left-2.5 top-2 text-[#282828]/40 dark:text-white">${icon('Search', 'w-3.5 h-3.5')}</span>
          </div>
          ${btn(icon('RefreshCw', 'w-3.5 h-3.5') + ' Refresh', 'outline', 'sm', 'data-action="refresh-apps"')}
        </div>
      </div>

      ${filtered.length === 0 ? `
        <div class="p-12 text-center bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl text-[#282828]/60 dark:text-white">
          ${icon('ClipboardCheck', 'w-10 h-10 mx-auto mb-2')}
          <p class="font-semibold text-sm">
            ${applicationsList.length === 0 ? 'No applications to review.' : 'No applications match your current filter or search.'}
          </p>
          ${appSearch || appFilterStatus !== 'all' ? `
            <button data-action="filter-apps" data-filter="all" class="mt-3 px-3 py-1 text-xs rounded border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#FAF4EE] dark:hover:bg-[#15362B] cursor-pointer">
              Clear Filters
            </button>
          ` : ''}
        </div>` : `
        <div class="overflow-x-auto rounded-xl border border-[#282828]/10 dark:border-[#25473C]">
          <table class="w-full text-left text-xs text-[#282828] dark:text-white bg-white dark:bg-[#102B22]">
            <thead class="bg-[#FAF4EE] dark:bg-[#0A211A] text-[#282828]/70 dark:text-white border-b border-[#282828]/10 dark:border-[#25473C] uppercase font-mono text-[10px]">
              <tr>
                <th class="p-3">Applicant &amp; ID</th>
                <th class="p-3">Class &amp; Course</th>
                <th class="p-3">Contact (Phone / Email / TG)</th>
                <th class="p-3">Motivation Statement</th>
                <th class="p-3">Honors &amp; Proof</th>
                <th class="p-3">Status</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#282828]/10 dark:divide-[#25473C]">
              ${filtered.map(a => {
                const essayText = a.motivationEssay || a.essay || '';
                const wordCount = essayText ? essayText.split(/\s+/).filter(Boolean).length : 0;
                return `
                <tr class="hover:bg-[#FAF4EE]/70 dark:hover:bg-[#15362B] transition-colors">
                  <td class="p-3">
                    <div class="font-bold text-[#282828] dark:text-white">${escapeHtml(a.studentName || a.name || '—')}</div>
                    <div class="font-mono text-[10px] text-[#282828]/50 dark:text-white">${escapeHtml(a.memberId || 'Pending')}</div>
                  </td>
                  <td class="p-3">
                    <div class="font-medium">${escapeHtml(a.class || '—')}</div>
                    <div class="flex flex-col gap-0.5 mt-0.5">
                      ${(Array.isArray(a.courses) && a.courses.length > 0)
                        ? a.courses.map((c, ci) => `
                            <span class="inline-flex items-center gap-1 font-mono text-[10px] text-cyan-700 dark:text-cyan-400 font-semibold truncate max-w-[170px]" title="${escapeHtml(c.title)}">
                              <span class="opacity-60 text-[9px]">#${ci + 1}</span> ${escapeHtml(c.title)}
                            </span>
                          `).join('')
                        : `<span class="font-mono text-[10px] text-cyan-700 dark:text-cyan-400 truncate max-w-[150px]">${escapeHtml(a.courseTitle || a.course?.title || '—')}</span>`
                      }
                    </div>
                  </td>
                  <td class="p-3 text-[11px] space-y-0.5">
                    <div class="font-mono text-[#282828]/70 dark:text-white">${escapeHtml(a.phoneNumber || '—')}</div>
                    ${a.email ? `<div class="font-mono text-[10px] text-[#282828]/50 dark:text-white truncate max-w-[160px]">${escapeHtml(a.email)}</div>` : ''}
                    ${a.telegramUsername ? `<div class="font-mono text-[10px] text-sky-600 dark:text-sky-400 font-bold">${escapeHtml(a.telegramUsername)}</div>` : ''}
                  </td>
                  <td class="p-3 max-w-[200px]">
                    ${essayText ? `
                      <button data-action="view-app" data-id="${a.id}" class="text-left group cursor-pointer border-0 bg-transparent p-0 block">
                        <p class="text-[11px] text-[#282828]/70 dark:text-white line-clamp-2 italic group-hover:text-[#FC6454] dark:group-hover:text-[#6BB89E]">
                          "${escapeHtml(essayText.slice(0, 70))}${essayText.length > 70 ? '...' : ''}"
                        </p>
                        <span class="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold group-hover:underline">
                          Read full essay (${wordCount}w) &rarr;
                        </span>
                      </button>
                    ` : `<span class="text-[#282828]/40 dark:text-white italic text-[11px]">None provided</span>`}
                  </td>
                  <td class="p-3 text-[11px]">
                    ${a.award ? `<div class="truncate max-w-[140px] text-[#282828] dark:text-white font-medium" title="${escapeHtml(a.award)}">${escapeHtml(a.award)}</div>` : ''}
                    ${a.awardFiles && a.awardFiles.length > 0 ? `
                      <span class="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        ${a.awardFiles.length} file(s)
                      </span>
                    ` : (!a.award ? `<span class="text-[#282828]/40 dark:text-white italic">None</span>` : '')}
                  </td>
                  <td class="p-3">
                    ${badge(a.status, a.status === 'pending' ? 'amber' : a.status === 'approved' || a.status === 'active' ? 'emerald' : 'rose')}
                  </td>
                  <td class="p-3 text-right space-x-1 whitespace-nowrap">
                    <button data-action="view-app" data-id="${a.id}" class="px-2 py-1 rounded text-[10px] font-mono font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs">
                      View Details
                    </button>
                    ${a.status === 'pending' ? `
                      <button data-action="approve-app" data-id="${a.id}" class="px-2 py-1 rounded text-[10px] font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs">Approve</button>
                      <button data-action="reject-app" data-id="${a.id}" class="px-2 py-1 rounded text-[10px] font-mono font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs">Reject</button>
                    ` : a.status === 'rejected' ? `
                      <button data-action="approve-app" data-id="${a.id}" class="px-2 py-1 rounded text-[10px] font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs" title="Re-approve application">Re-Approve</button>
                      <button data-action="del-app" data-id="${a.id}" class="px-2 py-1 rounded text-[10px] font-mono font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer" title="Permanently delete application record">Delete</button>
                    ` : `
                      <span class="text-[10px] text-[#282828]/40 dark:text-white font-mono uppercase mr-1">${a.status}</span>
                      <button data-action="del-app" data-id="${a.id}" class="px-2 py-1 rounded text-[10px] font-mono font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer" title="Permanently delete application record">Delete</button>
                    `}
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>`}
    </div>`;
}

function buildMembersTab() {
  const filtered = membersList.filter(m => {
    if (m.status === 'rejected' || m.status === 'pending') return false;
    if (memberFilterStatus === 'active' && m.status !== 'active' && m.status !== 'approved') return false;
    if (memberFilterStatus === 'suspended' && m.status !== 'suspended') return false;
    if (!memberSearch) return true;
    const s = memberSearch.toLowerCase();
    return (m.studentName || '').toLowerCase().includes(s) || (m.memberId || '').toLowerCase().includes(s) || (m.class || '').toLowerCase().includes(s);
  });
  return `
    <div class="space-y-4">
      <div class="grid grid-cols-3 gap-3">
        <div class="p-3 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between shadow-xs">
          <div><p class="text-[10px] text-[#282828]/60 dark:text-white uppercase font-bold tracking-wider">Total Registered</p><p class="text-xl font-mono font-bold text-[#282828] dark:text-white">${membersList.filter(m => m.role === 'member' && m.status !== 'rejected').length}</p></div>
          ${icon('Users', 'w-5 h-5 text-blue-400')}
        </div>
        <div class="p-3 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between shadow-xs">
          <div><p class="text-[10px] text-[#282828]/60 dark:text-white uppercase font-bold tracking-wider">Active Students</p><p class="text-xl font-mono font-bold text-emerald-400">${membersList.filter(m => m.role === 'member' && (m.status === 'active' || m.status === 'approved')).length}</p></div>
          ${icon('CheckCircle', 'w-5 h-5 text-emerald-400')}
        </div>
        <div class="p-3 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between shadow-xs">
          <div><p class="text-[10px] text-[#282828]/60 dark:text-white uppercase font-bold tracking-wider">Suspended</p><p class="text-xl font-mono font-bold text-rose-400">${membersList.filter(m => m.role === 'member' && m.status === 'suspended').length}</p></div>
          ${icon('XCircle', 'w-5 h-5 text-rose-400')}
        </div>
      </div>
      <div class="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div class="relative w-full sm:w-80">
          ${icon('Search', 'w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500')}
          <input id="member-search" type="text" placeholder="Search member name, ID, class..." value="${memberSearch}"
            class="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <select id="member-filter" class="bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white rounded-lg px-3 py-1.5">
            <option value="all" ${memberFilterStatus === 'all' ? 'selected' : ''}>All Statuses</option>
            <option value="active" ${memberFilterStatus === 'active' ? 'selected' : ''}>Active / Approved Only</option>
            <option value="suspended" ${memberFilterStatus === 'suspended' ? 'selected' : ''}>Suspended Only</option>
          </select>
          <button data-action="bulk-cert-trigger" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#2F8068] hover:bg-[#3A9277] text-white cursor-pointer shadow-xs">
            ${icon('Award', 'w-3.5 h-3.5')} Bulk Issue Certificates ${selectedMemberIds.size > 0 ? `(${selectedMemberIds.size})` : ''}
          </button>
          ${btn(icon('Download', 'w-3.5 h-3.5 text-cyan-400') + ' Export CSV', 'outline', 'sm', 'data-action="export-csv"')}
        </div>
      </div>
      ${filtered.length === 0 ? `
        <div class="p-12 text-center bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl text-[#282828]/60 dark:text-white">
          ${icon('Users', 'w-10 h-10 mx-auto mb-2')}
          <p class="font-semibold text-sm">No members found.</p>
        </div>` : `
      <div class="overflow-x-auto rounded-xl border border-[#282828]/10 dark:border-[#25473C]">
        <table class="w-full text-left text-xs text-[#282828] dark:text-white bg-white dark:bg-[#102B22]">
          <thead class="bg-[#FAF4EE] dark:bg-[#0A211A] text-[#282828]/70 dark:text-white border-b border-[#282828]/10 dark:border-[#25473C] uppercase font-mono text-[10px]">
            <tr>
              <th class="p-3 w-8 text-center">
                <input type="checkbox" id="chk-select-all-members" class="rounded accent-emerald-600 cursor-pointer" ${selectedMemberIds.size > 0 && selectedMemberIds.size >= filtered.filter(m => m.role !== 'admin').length ? 'checked' : ''} title="Select All Members">
              </th>
              <th class="p-3">Member ID</th>
              <th class="p-3">Student Name</th>
              <th class="p-3">Class</th>
              <th class="p-3">Phone</th>
              <th class="p-3">Telegram</th>
              <th class="p-3">Role</th>
              <th class="p-3">Status</th>
              <th class="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#282828]/10 dark:divide-[#25473C] font-sans">
            ${filtered.map(m => {
              const isMemberActive = m.status === 'active' || m.status === 'approved';
              const isSelected = selectedMemberIds.has(m.id);
              return `
              <tr class="hover:bg-[#FAF4EE]/70 dark:hover:bg-[#15362B] ${isSelected ? 'bg-emerald-500/10 dark:bg-emerald-950/20' : ''}">
                <td class="p-3 text-center">
                  ${m.role !== 'admin' ? `
                    <input type="checkbox" class="member-select-chk rounded accent-emerald-600 cursor-pointer" data-id="${m.id}" ${isSelected ? 'checked' : ''}>
                  ` : ''}
                </td>
                <td class="p-3 font-mono font-bold text-[#FC6454] dark:text-[#6BB89E]">${m.memberId}</td>
                <td class="p-3 font-semibold">${m.studentName}</td>
                <td class="p-3">${m.class}</td>
                <td class="p-3 font-mono text-[11px] text-[#282828]/60 dark:text-white">${m.phoneNumber}</td>
                <td class="p-3 font-mono text-xs font-semibold text-[#FC6454] dark:text-[#6BB89E]">${m.telegramUsername}</td>
                <td class="p-3">${badge(m.role, m.role === 'admin' ? 'purple' : 'slate')}</td>
                <td class="p-3">${badge(m.status, isMemberActive ? 'emerald' : 'rose')}</td>
                <td class="p-3 text-right space-x-1 whitespace-nowrap">
                  ${m.role !== 'admin' ? `
                    <button data-action="cert-member" data-id="${m.id}" class="p-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer" title="Generate Personalized Certificate">${icon('Award', 'w-3.5 h-3.5 inline')}</button>
                    <button data-action="view-member" data-id="${m.id}" class="p-1.5 hover:text-[#FC6454] dark:hover:text-[#6BB89E] text-[#282828]/60 dark:text-white rounded hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] cursor-pointer" title="View Profile">${icon('Eye', 'w-3.5 h-3.5 inline')}</button>
                    <button data-action="edit-member" data-id="${m.id}" class="p-1.5 hover:text-blue-500 text-[#282828]/60 dark:text-white rounded hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] cursor-pointer" title="Edit Member">${icon('Edit', 'w-3.5 h-3.5 inline')}</button>
                    <button data-action="reset-pw" data-id="${m.id}" class="p-1.5 hover:text-amber-500 text-[#282828]/60 dark:text-white rounded hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] cursor-pointer" title="Reset Password">${icon('KeyRound', 'w-3.5 h-3.5 inline')}</button>
                    <button data-action="toggle-member" data-id="${m.id}" class="p-1.5 hover:text-amber-500 text-[#282828]/60 dark:text-white rounded hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] cursor-pointer" title="${isMemberActive ? 'Suspend Member' : 'Activate Member'}">
                      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EFE6DE] dark:bg-[#15362B] text-[#282828] dark:text-white">${isMemberActive ? 'Suspend' : 'Activate'}</span>
                    </button>
                    <button data-action="del-member" data-id="${m.id}" class="p-1.5 text-rose-500 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer" title="Delete Permanently">${icon('Trash2', 'w-3.5 h-3.5 inline')}</button>
                  ` : `<span class="text-[10px] text-[#282828]/40 dark:text-white font-mono">Protected Admin</span>`}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`}
    </div>`;
}

function buildCoursesTab() {
  return `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <p class="text-xs text-slate-400">Total Courses: ${coursesList.length}</p>
        ${btn(icon('Plus', 'w-3.5 h-3.5') + ' Add New Course', 'primary', 'sm', 'data-action="add-course"')}
      </div>
      ${coursesList.length === 0 ? `
        <div class="p-12 text-center bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl text-[#282828]/60 dark:text-white">
          ${icon('BookOpen', 'w-10 h-10 mx-auto mb-2')}
          <p class="font-semibold text-sm">No courses added yet.</p>
        </div>` : `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${coursesList.map(c => `
          <div class="p-5 bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl shadow-xs space-y-3 transition-colors">
            ${c.thumbnailUrl ? `
              <div class="w-full h-32 rounded-lg overflow-hidden bg-[#FAF4EE] dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C]">
                <img src="${c.thumbnailUrl}" alt="${c.title}" class="w-full h-full object-cover">
              </div>` : ''}
            <div class="flex justify-between items-start gap-2">
              <div class="space-y-1 flex-1 min-w-0">
                ${badge(c.category || 'General', 'blue')}
                <h4 class="font-bold text-base text-[#282828] dark:text-white leading-tight truncate mt-1">${c.title}</h4>
              </div>
              <div class="flex flex-col items-end gap-1 shrink-0">
                ${badge(c.status === 'Available' ? 'Available' : 'Archived', c.status === 'Available' ? 'emerald' : 'slate')}
                ${badge(c.isAvailableForRegistration !== false ? 'Reg: Open' : 'Reg: Closed', c.isAvailableForRegistration !== false ? 'emerald' : 'amber')}
              </div>
            </div>
            <p class="text-xs text-[#282828]/70 dark:text-white line-clamp-2">${c.description || ''}</p>
            <div class="flex items-center justify-between text-[11px] text-[#282828]/60 dark:text-white pt-2 border-t border-[#282828]/10 dark:border-[#25473C]">
              <span>Instructor: ${c.instructor || '—'}</span>
              <span>${c.duration || '—'}</span>
            </div>
            <div class="pt-2 flex flex-wrap justify-end gap-2">
              <button data-action="toggle-course-reg" data-id="${c.id}" class="px-2.5 py-1 rounded border border-[#282828]/20 dark:border-[#25473C] text-xs text-[#282828] dark:text-white hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] cursor-pointer">
                ${c.isAvailableForRegistration !== false ? 'Close for Reg' : 'Open for Reg'}
              </button>
              <button data-action="edit-course" data-id="${c.id}" class="px-2.5 py-1 rounded border border-[#282828]/20 dark:border-[#25473C] text-xs text-[#282828] dark:text-white hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] cursor-pointer inline-flex items-center gap-1">
                ${icon('Edit', 'w-3 h-3')} Edit
              </button>
              <button data-action="del-course" data-id="${c.id}" class="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs cursor-pointer">
                ${icon('Trash2', 'w-3 h-3')}
              </button>
            </div>
          </div>`).join('')}
      </div>`}
    </div>`;
}

function buildEnrollmentsTab() {
  const filtered = enrollmentsList.filter(e => {
    if (!enrollmentSearch) return true;
    const q = enrollmentSearch.toLowerCase();
    return (e.studentName || '').toLowerCase().includes(q) ||
           (e.memberId || '').toLowerCase().includes(q) ||
           (e.courseTitle || '').toLowerCase().includes(q);
  });

  return `
    <div class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <p class="text-xs font-mono text-[#282828]/70 dark:text-white">
            Total Enrollments: <span class="font-bold text-[#282828] dark:text-white">${enrollmentsList.length}</span>
            ${enrollmentSearch ? `<span class="text-amber-500 font-semibold">(${filtered.length} matching)</span>` : ''}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative">
            <input type="text" id="enrollment-search-input" placeholder="Search student or course..." value="${escapeHtml(enrollmentSearch)}" class="px-3 py-1.5 pl-8 text-xs rounded-md bg-white dark:bg-[#102B22] border border-[#282828]/20 dark:border-[#25473C] text-[#282828] dark:text-white w-64 focus:outline-hidden focus:border-[#FC6454]" />
            <span class="absolute left-2.5 top-2 text-[#282828]/40 dark:text-white">${icon('Search', 'w-3.5 h-3.5')}</span>
          </div>
          ${btn(icon('RefreshCw', 'w-3.5 h-3.5') + ' Refresh', 'outline', 'sm', 'data-action="refresh-data"')}
        </div>
      </div>
      ${filtered.length === 0 ? `
        <div class="p-12 text-center bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl text-[#282828]/60 dark:text-white">
          ${icon('GraduationCap', 'w-10 h-10 mx-auto mb-2')}
          <p class="font-semibold text-sm">${enrollmentsList.length === 0 ? 'No student enrollments yet.' : 'No enrollments match your search query.'}</p>
        </div>` : `
      <div class="overflow-x-auto rounded-xl border border-[#282828]/10 dark:border-[#25473C]">
        <table class="w-full text-left text-xs text-[#282828] dark:text-white bg-white dark:bg-[#102B22]">
          <thead class="bg-[#FAF4EE] dark:bg-[#0A211A] text-[#282828]/70 dark:text-white border-b border-[#282828]/10 dark:border-[#25473C] uppercase font-mono text-[10px]">
            <tr>
              <th class="p-3">Student</th>
              <th class="p-3">Course</th>
              <th class="p-3">Progress</th>
              <th class="p-3">Status</th>
              <th class="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#282828]/10 dark:divide-[#25473C]">
            ${filtered.map(enr => `
              <tr class="hover:bg-[#FAF4EE]/70 dark:hover:bg-[#15362B] transition-colors">
                <td class="p-3">
                  <div class="font-semibold text-[#282828] dark:text-white">${escapeHtml(enr.studentName || enr.memberId || '—')}</div>
                  ${enr.memberId ? `<div class="font-mono text-[10px] text-[#282828]/50 dark:text-white">${escapeHtml(enr.memberId)}</div>` : ''}
                </td>
                <td class="p-3 font-medium">${escapeHtml(enr.courseTitle || '—')}</td>
                <td class="p-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">${enr.progress ?? 0}%</td>
                <td class="p-3">${badge(enr.status || (enr.progress === 100 ? 'Completed' : 'Active'), enr.progress === 100 ? 'emerald' : 'blue')}</td>
                <td class="p-3 text-right whitespace-nowrap space-x-1.5">
                  ${enr.progress < 100 ? `
                    <button data-action="complete-enrollment" data-id="${enr.id}" class="px-2 py-1 rounded text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-500/30 cursor-pointer">
                      Mark Complete
                    </button>
                  ` : ''}
                  <button data-action="delete-enrollment" data-id="${enr.id}" data-name="${escapeHtml(enr.studentName || enr.memberId || 'Student')}" data-course="${escapeHtml(enr.courseTitle || 'Course')}" class="px-2 py-1 rounded text-[11px] font-mono font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-500/30 cursor-pointer" title="Remove this enrollment">
                    Remove
                  </button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`}
    </div>`;
}

function buildProjectsTab() {
  return `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <p class="text-xs text-slate-400">Total Projects: ${projectsList.length}</p>
        ${btn(icon('Plus', 'w-3.5 h-3.5') + ' Add Project', 'primary', 'sm', 'data-action="add-project"')}
      </div>
      ${projectsList.length === 0 ? `
        <div class="p-12 text-center bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl text-[#282828]/60 dark:text-white">
          ${icon('FolderGit2', 'w-10 h-10 mx-auto mb-2')}
          <p class="font-semibold text-sm">No projects published yet.</p>
        </div>` : `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${projectsList.map(p => `
          <div class="p-5 bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] text-[#282828] dark:text-white space-y-2 rounded-xl shadow-xs">
            ${p.imageUrl ? `
              <div class="w-full h-32 rounded-lg overflow-hidden bg-[#FAF4EE] dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] mb-1">
                <img src="${p.imageUrl}" alt="${p.title}" class="w-full h-full object-cover">
              </div>` : ''}
            <div class="flex justify-between items-start gap-2">
              <div>
                <h4 class="font-bold text-[#282828] dark:text-white text-base">${p.title}</h4>
                <span class="text-[10px] font-mono text-[#FC6454] dark:text-[#6BB89E]">${p.category || 'Web App'} &bull; ${p.date || '2026'}</span>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                ${badge(p.status === 'Completed' ? 'Completed' : 'In Progress', p.status === 'Completed' ? 'emerald' : 'blue')}
                ${badge(p.isPublished !== false ? 'Published' : 'Draft', p.isPublished !== false ? 'emerald' : 'slate')}
              </div>
            </div>
            <p class="text-xs text-[#282828]/70 dark:text-white line-clamp-2">${p.description || ''}</p>
            <div class="flex flex-wrap gap-1 pt-1">
              ${(Array.isArray(p.technologies) ? p.technologies : []).map(t => `<span class="text-[10px] px-2 py-0.5 rounded bg-[#FAF4EE] dark:bg-[#0A211A] text-[#282828] dark:text-white border border-[#282828]/10 dark:border-[#25473C]">${t}</span>`).join('')}
            </div>
            <div class="pt-2 flex justify-end gap-2 border-t border-[#282828]/10 dark:border-[#25473C]">
              <button data-action="edit-project" data-id="${p.id}" class="px-2.5 py-1 rounded border border-[#282828]/20 dark:border-[#25473C] text-xs text-[#282828] dark:text-white hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] cursor-pointer">Edit</button>
              <button data-action="del-project" data-id="${p.id}" class="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs cursor-pointer">Delete</button>
            </div>
          </div>`).join('')}
      </div>`}
    </div>`;
}

function buildEventsTab() {
  return `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <p class="text-xs text-slate-400">Total Events: ${eventsList.length}</p>
        ${btn(icon('Plus', 'w-3.5 h-3.5') + ' Create Event', 'primary', 'sm', 'data-action="add-event"')}
      </div>
      ${eventsList.length === 0 ? `
        <div class="p-12 text-center bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl text-[#282828]/60 dark:text-white">
          ${icon('Calendar', 'w-10 h-10 mx-auto mb-2')}
          <p class="font-semibold text-sm">No upcoming events.</p>
        </div>` : `
      <div class="space-y-3">
        ${eventsList.map(ev => `
          <div class="p-4 bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] text-[#282828] dark:text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 rounded-xl shadow-xs">
            <div class="flex items-center gap-3">
              ${(ev.imageUrl || ev.coverImageUrl) ? `
                <div class="w-16 h-14 rounded-lg overflow-hidden bg-[#FAF4EE] dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] shrink-0">
                  <img src="${ev.imageUrl || ev.coverImageUrl}" alt="${ev.title}" class="w-full h-full object-cover">
                </div>` : ''}
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-[#FC6454] dark:text-[#6BB89E] font-bold text-xs">${ev.date || (ev.formattedDate ? `${ev.formattedDate.day} ${ev.formattedDate.month}` : '—')}</span>
                  <span class="text-xs text-[#282828]/60 dark:text-white">&bull; ${ev.time || '—'}</span>
                  ${badge(ev.status || 'Upcoming', ev.status === 'Upcoming' ? 'emerald' : 'slate')}
                  ${badge(ev.isPublished !== false ? 'Published' : 'Draft', ev.isPublished !== false ? 'emerald' : 'slate')}
                </div>
                <h4 class="font-bold text-[#282828] dark:text-white text-sm mt-1">${ev.title}</h4>
                <p class="text-xs text-[#282828]/70 dark:text-white">${ev.location || 'Computer Lab 3, Highschool'} (${ev.locationType || 'Onsite'})</p>
              </div>
            </div>
            <div class="flex gap-2 self-end sm:self-center">
              <button data-action="edit-event" data-id="${ev.id}" class="px-2.5 py-1 rounded border border-[#282828]/20 dark:border-[#25473C] text-xs text-[#282828] dark:text-white hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] cursor-pointer">Edit</button>
              <button data-action="del-event" data-id="${ev.id}" class="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs cursor-pointer">Delete</button>
            </div>
          </div>`).join('')}
      </div>`}
    </div>`;
}

function buildCertificatesTab() {
  return `
    <div class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-bold text-[#282828] dark:text-white uppercase tracking-wider font-mono">Issued Credentials Registry</h3>
          <p class="text-xs text-[#282828]/60 dark:text-white">Total Issued: ${certificatesList.length} verified certificates</p>
        </div>
        ${btn(icon('Award', 'w-3.5 h-3.5') + ' Generate New Certificate', 'primary', 'sm', 'data-action="generate-cert-open"')}
      </div>
      ${certificatesList.length === 0 ? `
        <div class="p-12 text-center bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl text-[#282828]/60 dark:text-white">
          ${icon('Award', 'w-10 h-10 mx-auto mb-2 text-[#FC6454] dark:text-[#6BB89E]')}
          <p class="font-semibold text-sm">No certificates have been issued yet.</p>
          <p class="text-xs mt-1 text-[#282828]/50 dark:text-white">Click &ldquo;Generate New Certificate&rdquo; above to award a verified credential to any student.</p>
        </div>` : `
      <div class="overflow-x-auto rounded-xl border border-[#282828]/10 dark:border-[#25473C]">
        <table class="w-full text-left text-xs text-[#282828] dark:text-white bg-white dark:bg-[#102B22]">
          <thead class="bg-[#FAF4EE] dark:bg-[#0A211A] text-[#282828]/70 dark:text-white border-b border-[#282828]/10 dark:border-[#25473C] uppercase font-mono text-[10px]">
            <tr>
              <th class="p-3">Certificate ID</th>
              <th class="p-3">Student Name</th>
              <th class="p-3">Course / Track</th>
              <th class="p-3">Issue Date</th>
              <th class="p-3">Status</th>
              <th class="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#282828]/10 dark:divide-[#25473C]">
            ${certificatesList.map(c => {
              const isVerified = (c.status === 'VERIFIED' || c.isActive === true) && c.status !== 'REVOKED' && c.isActive !== false;
              const certId = c.certificateId || c.id;
              const student = c.member?.studentName || c.studentName || 'Student Member';
              return `
              <tr class="hover:bg-[#FAF4EE]/70 dark:hover:bg-[#15362B] transition-colors">
                <td class="p-3 font-mono font-bold text-[#FC6454] dark:text-[#6BB89E]">${c.certificateId || c.id}</td>
                <td class="p-3 font-semibold text-[#282828] dark:text-white">${student}</td>
                <td class="p-3 text-[#282828]/80 dark:text-white">${c.courseName || c.courseTitle || '—'}</td>
                <td class="p-3 font-mono text-[11px] text-[#282828]/60 dark:text-white">${c.issueDate || '—'}</td>
                <td class="p-3">${badge(isVerified ? 'Active Verified' : 'Revoked', isVerified ? 'emerald' : 'rose')}</td>
                <td class="p-3 text-right">
                  <div class="inline-flex items-center gap-1.5 justify-end flex-wrap">
                    <a href="/api/certificates/${encodeURIComponent(certId)}/download?format=pdf" target="_blank" class="px-2 py-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer inline-flex items-center gap-1 font-mono font-bold text-[10px] border border-emerald-600/30" title="Download Official Vector PDF">
                      ${icon('Download', 'w-3 h-3')} PDF
                    </a>
                    <a href="/api/certificates/${encodeURIComponent(certId)}/download?format=png" target="_blank" class="px-2 py-1 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 rounded hover:bg-cyan-50 dark:hover:bg-cyan-950/40 cursor-pointer inline-flex items-center gap-1 font-mono font-bold text-[10px] border border-cyan-600/30" title="Download High-Res PNG">
                      ${icon('Download', 'w-3 h-3')} PNG
                    </a>
                    <button data-action="deliver-cert-btn" data-id="${certId}" class="p-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-700 rounded hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer" title="Send to Member via Telegram &amp; Email">${icon('Send', 'w-3.5 h-3.5 inline')}</button>
                    <button data-action="view-cert" data-id="${certId}" class="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer" title="View &amp; Print Certificate">${icon('Eye', 'w-3.5 h-3.5 inline')}</button>
                    <button data-action="toggle-cert" data-id="${c.id || certId}" class="p-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-700 rounded hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer" title="Toggle Verified / Revoked">${icon('RefreshCw', 'w-3.5 h-3.5 inline')}</button>
                    <button data-action="del-cert" data-id="${c.id || certId}" class="p-1.5 text-rose-500 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer" title="Delete Certificate">${icon('Trash2', 'w-3.5 h-3.5 inline')}</button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`}
    </div>`;
}

function buildAwardsTab() {
  return `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <p class="text-xs text-slate-400">Total Awards: ${awardsList.length}</p>
        ${btn(icon('Plus', 'w-3.5 h-3.5') + ' Assign Award', 'primary', 'sm', 'data-action="add-award"')}
      </div>
      ${awardsList.length === 0 ? `
        <div class="p-12 text-center bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl text-[#282828]/60 dark:text-white">
          ${icon('Trophy', 'w-10 h-10 mx-auto mb-2')}
          <p class="font-semibold text-sm">No awards assigned yet.</p>
        </div>` : `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${awardsList.map(a => `
          <div class="p-4 bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl shadow-xs flex items-start justify-between gap-3">
            <div class="space-y-1">
              <h4 class="font-bold text-sm text-[#282828] dark:text-white">${a.title}</h4>
              <p class="text-xs text-[#282828]/60 dark:text-white">${a.member?.studentName || a.studentName || '—'} &bull; ${a.category || 'Excellence'}</p>
              ${a.description ? `<p class="text-xs text-[#282828]/50 dark:text-white">${a.description}</p>` : ''}
            </div>
            <button data-action="del-award" data-id="${a.id}" class="p-1.5 text-rose-500 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0">${icon('Trash2', 'w-3.5 h-3.5')}</button>
          </div>`).join('')}
      </div>`}
    </div>`;
}

function buildAchievementsTab() {
  return `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <p class="text-xs text-slate-400">Total Achievements: ${achievementsList.length}</p>
        ${btn(icon('Plus', 'w-3.5 h-3.5') + ' Add Achievement', 'primary', 'sm', 'data-action="add-achievement"')}
      </div>
      ${achievementsList.length === 0 ? `
        <div class="p-12 text-center bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl text-[#282828]/60 dark:text-white">
          ${icon('Medal', 'w-10 h-10 mx-auto mb-2')}
          <p class="font-semibold text-sm">No achievements published yet.</p>
        </div>` : `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${achievementsList.map(a => `
          <div class="p-4 bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl shadow-xs flex items-start justify-between gap-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-sm text-[#282828] dark:text-white">${a.title}</h4>
                ${badge(a.rank || a.category || 'Achievement', 'amber')}
              </div>
              <p class="text-xs text-[#282828]/70 dark:text-white">${a.description || ''}</p>
              <span class="text-[10px] font-mono text-[#282828]/40 dark:text-white">${a.year || ''}</span>
            </div>
            <div class="flex gap-1 shrink-0">
              <button data-action="del-achievement" data-id="${a.id}" class="p-1.5 text-rose-500 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer">${icon('Trash2', 'w-3.5 h-3.5')}</button>
            </div>
          </div>`).join('')}
      </div>`}
    </div>`;
}

function buildTelegramTab() {
  return `
    <div class="space-y-6 max-w-4xl">
      <div class="p-6 bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl shadow-xs space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold text-[#282828] dark:text-white flex items-center gap-2">
              ${icon('Bot', 'w-5 h-5 text-[#FC6454] dark:text-[#6BB89E]')}
              ARX IT CLUB &mdash; Telegram Bot &amp; Channel Operations
            </h3>
            <p class="text-xs text-[#282828]/70 dark:text-white mt-1">
              Authoritative administration for Telegram member verification, automated student services, and channel sync.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button data-action="refresh-telegram" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#282828]/20 dark:border-[#25473C] text-xs font-mono text-[#282828] dark:text-white hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] cursor-pointer">
              ${icon('RefreshCw', `w-3.5 h-3.5 ${botStatusLoading ? 'animate-spin' : ''}`)} Refresh
            </button>
            <a href="${settings.telegramBotUrl || 'https://t.me/ARXITCLUB_bot'}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FC6454] text-white hover:bg-[#eb5545] text-xs font-mono transition-colors shadow-sm">
              <span>Open Bot (@${settings.telegramBotUsername || 'ARXITCLUB_bot'})</span>
              ${icon('ExternalLink', 'w-3.5 h-3.5')}
            </a>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-[#FAF4EE] dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#282828]/10 dark:border-[#25473C] pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold uppercase tracking-wider text-[#282828] dark:text-white">Connection Status:</span>
              ${botStatus?.connectionStatus === 'CONNECTED' ? `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> CONNECTED &amp; ACTIVE
                </span>` : `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                  ${icon('AlertTriangle', 'w-3.5 h-3.5')} ${botStatus?.configured ? 'CHECKING...' : 'TOKEN NOT CONFIGURED'}
                </span>`}
            </div>
            ${btn(icon('Terminal', 'w-3.5 h-3.5 mr-1 text-[#FC6454] dark:text-[#6BB89E]') + (testingConnection ? ' Testing API...' : ' Run Diagnostics'), 'outline', 'sm', `data-action="test-bot" ${testingConnection ? 'disabled' : ''}`)}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            <div class="p-2.5 bg-white dark:bg-[#15362B] rounded-lg border border-[#282828]/10 dark:border-[#25473C]">
              <span class="text-[#282828]/60 dark:text-slate-400 block text-[10px] uppercase">Bot Handle</span>
              <span class="font-bold text-[#FC6454] dark:text-cyan-300">@${botStatus?.botUsername || settings.telegramBotUsername || 'ARXITCLUB_bot'}</span>
            </div>
            <div class="p-2.5 bg-white dark:bg-[#15362B] rounded-lg border border-[#282828]/10 dark:border-[#25473C]">
              <span class="text-[#282828]/60 dark:text-slate-400 block text-[10px] uppercase">Display Name</span>
              <span class="font-bold text-[#282828] dark:text-white">${botStatus?.botDisplayName || 'ARX IT CLUB Bot'}</span>
            </div>
            <div class="p-2.5 bg-white dark:bg-[#15362B] rounded-lg border border-[#282828]/10 dark:border-[#25473C]">
              <span class="text-[#282828]/60 dark:text-slate-400 block text-[10px] uppercase">Bot ID</span>
              <span class="text-[#282828] dark:text-slate-200">${botStatus?.botId ? String(botStatus.botId) : 'Authenticated'}</span>
            </div>
            <div class="p-2.5 bg-white dark:bg-[#15362B] rounded-lg border border-[#282828]/10 dark:border-[#25473C]">
              <span class="text-[#282828]/60 dark:text-slate-400 block text-[10px] uppercase">Engine</span>
              <span class="font-bold capitalize text-emerald-600 dark:text-emerald-400">${botStatus?.updateMode === 'webhook' ? 'Webhook' : 'Polling'}</span>
            </div>
          </div>

          ${testResult ? `
            <div class="p-3.5 bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] rounded-lg space-y-2">
              <div class="flex items-center justify-between text-xs font-mono font-bold">
                <span>Diagnostic Results:</span>
                <span class="${testResult.success ? 'text-emerald-600' : 'text-rose-600'}">${testResult.success ? 'PASSED' : 'FAILED'}</span>
              </div>
              <div class="space-y-1">
                ${(testResult.steps || []).map(st => `
                  <div class="flex items-start gap-2 text-xs font-mono">
                    ${st.status === 'SUCCESS' ? icon('CheckCircle', 'w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5') : icon('XCircle', 'w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5')}
                    <div><span class="font-bold">${st.name}:</span> <span class="text-[#282828]/70 dark:text-white">${st.detail}</span></div>
                  </div>`).join('')}
              </div>
            </div>` : ''}
        </div>

        <div class="p-4 rounded-xl bg-[#FAF4EE] dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-2">
              ${icon('KeyRound', 'w-3.5 h-3.5 text-[#FC6454] dark:text-[#6BB89E]')}
              Telegram Bot API Token
            </span>
            ${badge(botStatus?.configured ? 'Token Active' : 'Setup Required', botStatus?.configured ? 'emerald' : 'amber')}
          </div>
          <form id="bot-token-form" class="space-y-3">
            <div class="relative flex items-center">
              <input id="bot-token-input" type="${showBotToken ? 'text' : 'password'}" value="${botTokenInput}"
                placeholder="${botStatus?.maskedToken ? `${botStatus.maskedToken} (Token saved - enter new to rotate)` : 'e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ'}"
                class="w-full pl-3.5 pr-20 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-sm font-mono text-[#282828] dark:text-cyan-300 focus:outline-none">
              <button type="button" data-action="toggle-bot-token" class="absolute right-2 px-2 py-1 text-xs text-[#282828]/60 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] transition-colors cursor-pointer">
                ${icon(showBotToken ? 'EyeOff' : 'Eye', 'w-4 h-4')}
              </button>
            </div>
            <div class="flex justify-between items-center">
              ${btn(icon('KeyRound', 'w-3.5 h-3.5 mr-1') + (savingBotToken ? 'Authenticating...' : 'Save & Verify Bot Token'), 'primary', 'sm', 'type="submit"')}
              ${btn(icon('Send', 'w-3.5 h-3.5 mr-1') + (webhookSyncing ? 'Registering...' : 'Sync Webhook'), 'outline', 'sm', 'data-action="sync-webhook"')}
            </div>
          </form>
          ${webhookSyncMessage ? `<div class="p-2.5 bg-white dark:bg-[#102B22] border border-[#282828]/10 rounded text-xs font-mono">${webhookSyncMessage}</div>` : ''}
        </div>
      </div>
    </div>`;
}

function buildSettingsTab() {
  const currentWebsiteUrl = settings.websiteUrl || window.location.origin;
  const currentAdminUrl = settings.adminUrl || '/admin';
  const botUrl = settings.telegramBotUrl || `https://t.me/${settings.telegramBotUsername || 'ARXITCLUB_bot'}`;
  const channelUrl = settings.telegramChannelUrl || 'https://t.me/arxitclub';

  return `
    <div class="space-y-6 max-w-4xl">
      <!-- Registration Management -->
      <div class="p-6 bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl shadow-xs space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="space-y-1">
            <h3 class="text-base font-bold text-[#282828] dark:text-white flex items-center gap-2">
              ${icon('ShieldCheck', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]')}
              Registration Management
            </h3>
            <p class="text-xs text-[#282828]/70 dark:text-white">
              Authoritative switch to open or close applicant registration for ARX IT CLUB.
            </p>
          </div>
          ${badge(settings.registrationStatus === 'CLOSED' ? 'Registration Closed' : 'Registration Open', settings.registrationStatus === 'CLOSED' ? 'rose' : 'emerald', 'md')}
        </div>
        <div class="p-3.5 rounded-lg bg-[#FAF4EE] dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            ${btn('Open Registration', settings.registrationStatus === 'CLOSED' ? 'primary' : 'outline', 'sm', 'data-action="reg-open"')}
            ${btn('Close Registration', settings.registrationStatus === 'CLOSED' ? 'outline' : 'danger', 'sm', 'data-action="reg-close"')}
          </div>
          <span class="text-xs font-mono text-[#282828]/60 dark:text-slate-400">
            Current Status: <strong class="${settings.registrationStatus === 'CLOSED' ? 'text-rose-600' : 'text-emerald-600'}">${settings.registrationStatus === 'CLOSED' ? 'Registration Closed' : 'Registration Open'}</strong>
          </span>
        </div>
      </div>

      <!-- Settings Form -->
      <form id="settings-form" class="space-y-6 text-xs">
        <!-- Section: Website URLs & Platform Endpoints -->
        <div class="p-6 bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl shadow-xs space-y-5">
          <div class="flex items-center justify-between border-b border-[#282828]/10 dark:border-[#25473C] pb-3">
            <div>
              <h3 class="text-base font-bold text-[#282828] dark:text-white flex items-center gap-2">
                ${icon('Globe', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]')}
                Website Settings &amp; Editable URLs
              </h3>
              <p class="text-xs text-[#282828]/70 dark:text-white mt-0.5">
                Manage the public URL, admin portal route, official Telegram endpoints, and community social links.
              </p>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FC6454]/10 dark:bg-[#2F8068]/20 text-[#FC6454] dark:text-[#6BB89E]">
              LIVE ENDPOINTS
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Public Website URL -->
            <div class="space-y-1.5">
              <label class="block font-bold text-[#282828] dark:text-white">
                Public Website URL <span class="text-rose-500">*</span>
              </label>
              <div class="flex items-center gap-2">
                <input
                  name="websiteUrl"
                  type="url"
                  required
                  placeholder="https://arx-website-sjs.vercel.app"
                  value="${settings.websiteUrl || ''}"
                  class="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white font-mono text-xs">
                <button
                  type="button"
                  data-copy="${currentWebsiteUrl}"
                  title="Copy Website URL"
                  class="px-2.5 py-2 rounded-lg border border-[#282828]/15 dark:border-[#25473C] bg-[#FAF4EE] dark:bg-[#0A211A] hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] text-[#282828] dark:text-white cursor-pointer transition-colors shrink-0">
                  ${icon('Copy', 'w-3.5 h-3.5')}
                </button>
              </div>
              <p class="text-[11px] text-[#282828]/60 dark:text-white">Base domain used for certificates, verification links, and SEO.</p>
            </div>

            <!-- Admin URL -->
            <div class="space-y-1.5">
              <label class="block font-bold text-[#282828] dark:text-white">
                Admin Portal URL / Path <span class="text-rose-500">*</span>
              </label>
              <div class="flex items-center gap-2">
                <input
                  name="adminUrl"
                  type="text"
                  required
                  placeholder="/admin or /71354caa6bea2251"
                  value="${settings.adminUrl || ''}"
                  class="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white font-mono text-xs">
                <button
                  type="button"
                  data-copy="${currentAdminUrl}"
                  title="Copy Admin URL"
                  class="px-2.5 py-2 rounded-lg border border-[#282828]/15 dark:border-[#25473C] bg-[#FAF4EE] dark:bg-[#0A211A] hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] text-[#282828] dark:text-white cursor-pointer transition-colors shrink-0">
                  ${icon('Copy', 'w-3.5 h-3.5')}
                </button>
              </div>
              <p class="text-[11px] text-[#282828]/60 dark:text-white">Direct route to access the staff &amp; administration console.</p>
            </div>
          </div>

          <!-- Telegram Bot Settings -->
          <div class="p-4 rounded-xl bg-[#FAF4EE]/70 dark:bg-[#0A211A]/80 border border-[#282828]/10 dark:border-[#25473C] space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-[#282828] dark:text-white flex items-center gap-2">
                ${icon('Send', 'w-3.5 h-3.5 text-[#2AABEE]')}
                Official Telegram Bot Integration
              </h4>
              <a href="${botUrl}" target="_blank" rel="noopener noreferrer" class="text-[11px] font-mono text-[#2AABEE] hover:underline flex items-center gap-1">
                <span>Open Bot</span>
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
                  value="${settings.telegramBotUsername || ''}"
                  class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white font-mono text-xs">
              </div>
              <div>
                <label class="block font-semibold text-[#282828] dark:text-white mb-1">Direct Bot URL</label>
                <div class="flex items-center gap-2">
                  <input
                    name="telegramBotUrl"
                    type="url"
                    placeholder="https://t.me/ARXITCLUB_bot"
                    value="${settings.telegramBotUrl || ''}"
                    class="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white font-mono text-xs">
                  <button
                    type="button"
                    data-copy="${botUrl}"
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
              <a href="${channelUrl}" target="_blank" rel="noopener noreferrer" class="text-[11px] font-mono text-[#2AABEE] hover:underline flex items-center gap-1">
                <span>Open Channel</span>
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
                  value="${settings.telegramChannelName || ''}"
                  class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white font-mono text-xs">
              </div>
              <div>
                <label class="block font-semibold text-[#282828] dark:text-white mb-1">Channel Broadcast Link</label>
                <div class="flex items-center gap-2">
                  <input
                    name="telegramChannelUrl"
                    type="url"
                    placeholder="https://t.me/arxitclub"
                    value="${settings.telegramChannelUrl || ''}"
                    class="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white font-mono text-xs">
                  <button
                    type="button"
                    data-copy="${channelUrl}"
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
            <h4 class="text-xs font-bold text-[#282828] dark:text-white">Community &amp; Social Profiles</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="block font-semibold text-[#282828] dark:text-white mb-1">GitHub Organization</label>
                <input
                  name="githubUrl"
                  type="url"
                  placeholder="https://github.com/ARX-IT-CLUB"
                  value="${settings.githubUrl || ''}"
                  class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white text-xs">
              </div>
              <div>
                <label class="block font-semibold text-[#282828] dark:text-white mb-1">YouTube Channel</label>
                <input
                  name="youtubeUrl"
                  type="url"
                  placeholder="https://youtube.com/@arxitclub"
                  value="${settings.youtubeUrl || ''}"
                  class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white text-xs">
              </div>
              <div>
                <label class="block font-semibold text-[#282828] dark:text-white mb-1">LinkedIn Page</label>
                <input
                  name="linkedinUrl"
                  type="url"
                  placeholder="https://linkedin.com/company/arx-it-club"
                  value="${settings.linkedinUrl || ''}"
                  class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white text-xs">
              </div>
            </div>
          </div>
        </div>

        <!-- Section: Website Content & Club Info -->
        <div class="p-6 bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl shadow-xs space-y-5">
          <div class="border-b border-[#282828]/10 dark:border-[#25473C] pb-3">
            <h3 class="text-base font-bold text-[#282828] dark:text-white flex items-center gap-2">
              ${icon('Settings', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]')}
              Club Identity, School &amp; Logistics
            </h3>
            <p class="text-xs text-[#282828]/70 dark:text-white mt-0.5">
              Public branding, school department affiliation, contact info, and meeting details.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-[#282828] dark:text-white mb-1">Club Name</label>
              <input name="clubName" type="text" value="${settings.clubName || ''}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">
            </div>
            <div>
              <label class="block font-bold text-[#282828] dark:text-white mb-1">Tagline</label>
              <input name="tagline" type="text" value="${settings.tagline || ''}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-[#282828] dark:text-white mb-1">School Name</label>
              <input name="schoolName" type="text" value="${settings.schoolName || ''}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">
            </div>
            <div>
              <label class="block font-bold text-[#282828] dark:text-white mb-1">Department</label>
              <input name="schoolDepartment" type="text" value="${settings.schoolDepartment || ''}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-[#282828] dark:text-white mb-1">Contact Email</label>
              <input name="contactEmail" type="email" value="${settings.contactEmail || ''}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">
            </div>
            <div>
              <label class="block font-bold text-[#282828] dark:text-white mb-1">Contact Phone</label>
              <input name="contactPhone" type="text" value="${settings.contactPhone || ''}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-[#282828] dark:text-white mb-1">Physical Lab Location</label>
              <input name="meetingLocation" type="text" value="${settings.meetingLocation || ''}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">
            </div>
            <div>
              <label class="block font-bold text-[#282828] dark:text-white mb-1">Regular Meeting Schedule</label>
              <input name="meetingSchedule" type="text" value="${settings.meetingSchedule || ''}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">
            </div>
          </div>

          <div>
            <label class="block font-bold text-[#282828] dark:text-white mb-1">Registration Closed Notice</label>
            <textarea name="registrationClosedMessage" rows="2" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">${settings.registrationClosedMessage || ''}</textarea>
          </div>

          <div>
            <label class="block font-bold text-[#282828] dark:text-white mb-1">Footer Tagline</label>
            <input name="footerText" type="text" value="${settings.footerText || ''}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white">
          </div>

          <div class="pt-4 flex items-center justify-between border-t border-[#282828]/10 dark:border-[#25473C]">
            <p class="text-[11px] text-[#282828]/60 dark:text-white">
              Changes take effect immediately across all public and administrative pages.
            </p>
            ${btn('Save All Website Settings', 'primary', 'md', 'type="submit"')}
          </div>
        </div>
      </form>
    </div>`;
}

function buildProfileTab() {
  const member = authState.member;
  return `
    <div class="p-6 bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] text-[#282828] dark:text-white space-y-5 max-w-md rounded-xl shadow-xs">
      <div>
        <h3 class="text-base font-bold text-[#282828] dark:text-white flex items-center gap-2">
          ${icon('KeyRound', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]')}
          Change Administrator Password
        </h3>
        <p class="text-xs text-[#282828]/70 dark:text-white">
          Update the password for administrator account <strong>${member?.memberId || 'ADMIN01'}</strong>.
        </p>
      </div>
      <form id="admin-pw-form" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-[#282828] dark:text-white mb-1">New Password</label>
          <input id="admin-pw-input" type="password" required minlength="6" placeholder="Minimum 6 characters" value="${adminPasswordInput}"
            class="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-sm text-[#282828] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FC6454]">
        </div>
        ${btn('Update Admin Password', 'primary', 'md', 'type="submit"')}
      </form>
    </div>`;
}

function buildMediaTab() {
  return `
    <div class="space-y-4">
      <div class="p-6 bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl shadow-xs">
        <h3 class="text-sm font-bold text-[#282828] dark:text-white flex items-center gap-2 mb-4">${icon('Image', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]')} Media Library</h3>
        <div id="media-upload-zone" class="border-2 border-dashed border-[#282828]/20 dark:border-[#25473C] rounded-xl p-8 text-center space-y-2 hover:border-[#FC6454] dark:hover:border-[#6BB89E] transition-colors cursor-pointer">
          ${icon('Image', 'w-8 h-8 mx-auto text-[#282828]/30 dark:text-white')}
          <p class="text-xs text-[#282828]/60 dark:text-white">Click or drag files here to upload media assets</p>
          <input id="media-file-input" type="file" accept="image/*,video/*" multiple class="hidden">
          ${btn(icon('Plus', 'w-3.5 h-3.5') + ' Upload Files', 'primary', 'sm', 'data-action="trigger-media-upload"')}
        </div>
      </div>
    </div>`;
}

// ─── MODALS ───────────────────────────────────────────────────────────────────

function buildModal() {
  if (!modalType) return '';

  let title = '';
  let body = '';

  if (modalType === 'course') {
    title = activeItem ? 'Edit Course' : 'Create New Course';
    body = `
      <form id="course-form" class="space-y-4 text-xs">
        ${courseError ? `<div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">${icon('XCircle', 'w-4 h-4 text-rose-600')}<span>${courseError}</span></div>` : ''}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="md:col-span-2 space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Course Title *</label>
            <input name="title" type="text" value="${courseForm.title || ''}" required class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
          </div>
          <div class="space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Category</label>
            <select name="category" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
              ${['Web Development','Cybersecurity','Artificial Intelligence','Data Science','Mobile Development','Game Development','Networking','Digital Literacy'].map(c => `<option value="${c}" ${courseForm.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Difficulty</label>
            <select name="difficulty" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
              ${['Beginner','Intermediate','Advanced'].map(d => `<option value="${d}" ${courseForm.difficulty === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
          </div>
          <div class="space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Duration</label>
            <input name="duration" type="text" value="${courseForm.duration || ''}" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
          </div>
          <div class="space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Instructor</label>
            <input name="instructor" type="text" value="${courseForm.instructor || ''}" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
          </div>
          <div class="md:col-span-2 space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Short Description *</label>
            <textarea name="description" rows="2" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white resize-none">${courseForm.description || ''}</textarea>
          </div>
          <div class="space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Thumbnail URL</label>
            <input name="thumbnailUrl" type="text" value="${courseForm.thumbnailUrl || ''}" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
          </div>
          <div class="space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Banner URL</label>
            <input name="bannerUrl" type="text" value="${courseForm.bannerUrl || ''}" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
          </div>
          <div class="flex items-center gap-2">
            <input name="isPublished" type="checkbox" id="course-published" ${courseForm.isPublished ? 'checked' : ''} class="rounded">
            <label for="course-published" class="text-xs text-[#282828] dark:text-white">Published</label>
          </div>
          <div class="flex items-center gap-2">
            <input name="isAvailableForRegistration" type="checkbox" id="course-open-reg" ${courseForm.isAvailableForRegistration !== false ? 'checked' : ''} class="rounded">
            <label for="course-open-reg" class="text-xs text-[#282828] dark:text-white">Open for registration</label>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-[#282828]/10 dark:border-[#25473C]">
          <button type="button" data-action="close-modal" class="px-3 py-1.5 rounded-md border border-[#282828]/20 dark:border-[#25473C] text-xs text-[#282828] dark:text-white cursor-pointer">Cancel</button>
          <button type="submit" class="px-3 py-1.5 rounded-md bg-[#FC6454] hover:bg-[#e8574a] text-white text-xs font-medium cursor-pointer" ${isSavingCourse ? 'disabled' : ''}>${isSavingCourse ? 'Saving...' : (activeItem ? 'Update Course' : 'Publish Course')}</button>
        </div>
      </form>`;
  }

  if (modalType === 'project') {
    title = activeItem ? 'Edit Project' : 'New Project';
    body = `
      <form id="project-form" class="space-y-4 text-xs">
        ${projectError ? `<div class="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">${projectError}</div>` : ''}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="md:col-span-2 space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Project Title *</label>
            <input name="title" type="text" value="${projectForm.title || ''}" required class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
          </div>
          <div class="md:col-span-2 space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Description *</label>
            <textarea name="description" rows="3" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white resize-none">${projectForm.description || ''}</textarea>
          </div>
          <div class="space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Technologies (comma-separated)</label>
            <input name="technologies" type="text" value="${Array.isArray(projectForm.technologies) ? projectForm.technologies.join(', ') : projectForm.technologies || ''}" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
          </div>
          <div class="space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Project Members (comma-separated)</label>
            <input name="projectMembers" type="text" value="${Array.isArray(projectForm.projectMembers) ? projectForm.projectMembers.join(', ') : projectForm.projectMembers || ''}" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
          </div>
          <div class="space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Image URL</label>
            <input name="imageUrl" type="text" value="${projectForm.imageUrl || ''}" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
          </div>
          <div class="space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">GitHub URL</label>
            <input name="githubUrl" type="text" value="${projectForm.githubUrl || ''}" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-[#282828]/10 dark:border-[#25473C]">
          <button type="button" data-action="close-modal" class="px-3 py-1.5 rounded-md border border-[#282828]/20 dark:border-[#25473C] text-xs text-[#282828] dark:text-white cursor-pointer">Cancel</button>
          <button type="submit" class="px-3 py-1.5 rounded-md bg-[#FC6454] hover:bg-[#e8574a] text-white text-xs font-medium cursor-pointer" ${isSavingProject ? 'disabled' : ''}>${isSavingProject ? 'Saving...' : (activeItem ? 'Update Project' : 'Publish Project')}</button>
        </div>
      </form>`;
  }

  if (modalType === 'event') {
    title = activeItem ? 'Edit Event' : 'Create Event';
    body = `
      <form id="event-form" class="space-y-4 text-xs">
        ${eventError ? `<div class="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">${eventError}</div>` : ''}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="md:col-span-2 space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Event Title *</label>
            <input name="title" type="text" value="${eventForm.title || ''}" required class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
          </div>
          <div class="space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Date *</label>
            <input name="date" type="date" value="${eventForm.date || ''}" required class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
          </div>
          <div class="space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Time *</label>
            <input name="time" type="text" value="${eventForm.time || ''}" placeholder="2:00 PM - 4:00 PM" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
          </div>
          <div class="space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Location</label>
            <input name="location" type="text" value="${eventForm.location || ''}" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
          </div>
          <div class="space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Location Type</label>
            <select name="locationType" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
              <option value="Onsite" ${eventForm.locationType === 'Onsite' ? 'selected' : ''}>Onsite</option>
              <option value="Online" ${eventForm.locationType === 'Online' ? 'selected' : ''}>Online</option>
              <option value="Hybrid" ${eventForm.locationType === 'Hybrid' ? 'selected' : ''}>Hybrid</option>
            </select>
          </div>
          <div class="md:col-span-2 space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Description</label>
            <textarea name="description" rows="3" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white resize-none">${eventForm.description || ''}</textarea>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-[#282828]/10 dark:border-[#25473C]">
          <button type="button" data-action="close-modal" class="px-3 py-1.5 rounded-md border border-[#282828]/20 dark:border-[#25473C] text-xs text-[#282828] dark:text-white cursor-pointer">Cancel</button>
          <button type="submit" class="px-3 py-1.5 rounded-md bg-[#FC6454] hover:bg-[#e8574a] text-white text-xs font-medium cursor-pointer" ${isSavingEvent ? 'disabled' : ''}>${isSavingEvent ? 'Saving...' : (activeItem ? 'Update Event' : 'Create Event')}</button>
        </div>
      </form>`;
  }

  if (modalType === 'cert') {
    title = 'Issue Verified Landscape Certificate';
    const memberOptions = membersList.map(m => {
      const isSelected = certForm.memberId === m.id || certForm.memberId === m.memberId;
      return `<option value="${m.id}" data-name="${m.studentName || ''}" ${isSelected ? 'selected' : ''}>${m.studentName || 'Student'} (${m.memberId || m.id}) &bull; ${m.class || 'Student'}</option>`;
    }).join('');

    const defaultCourses = [
      'Cybersecurity & Ethical Hacking',
      'Robotics & Embedded IoT Systems',
      'Full-Stack Web Engineering',
      'Python Programming & Data Science',
      'AI & Machine Learning Foundations',
      'Software Engineering & Architecture'
    ];
    const courseListOptions = coursesList.length > 0 ? coursesList.map(c => `<option value="${c.title}">${c.title}</option>`).join('') : defaultCourses.map(c => `<option value="${c}">${c}</option>`).join('');

    body = `
      <form id="cert-form" class="space-y-4 text-xs">
        <div class="space-y-1">
          <label class="block font-bold text-[#282828] dark:text-white">Select Enrolled Student or Member</label>
          <select name="memberId" id="cert-member-select" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
            <option value="custom">-- Enter Custom Student Details Manually --</option>
            ${memberOptions}
          </select>
          <p class="text-[10px] text-[#282828]/50 dark:text-white">Selecting a member auto-fills their official student name below.</p>
        </div>

        <div class="space-y-1">
          <label class="block font-bold text-[#282828] dark:text-white">Student Full Name *</label>
          <input name="studentName" id="cert-student-name" type="text" value="${certForm.studentName || ''}" placeholder="e.g. Samuel Bekele" required class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Course Track Preset</label>
            <select name="coursePreset" id="cert-course-preset" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
              <option value="">-- Choose Curriculum Track --</option>
              ${courseListOptions}
              <option value="custom">Other / Custom Course</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Course / Track Title *</label>
            <input name="courseName" id="cert-course-name" type="text" value="${certForm.courseName || ''}" placeholder="e.g. Cybersecurity & Ethical Hacking" required class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Issue Date</label>
            <input name="issueDate" type="text" value="${certForm.issueDate || ''}" placeholder="e.g. October 14, 2026" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
          </div>
          <div class="space-y-1">
            <label class="block font-bold text-[#282828] dark:text-white">Signatory Name</label>
            <input name="signatoryName" type="text" value="NEXORA" placeholder="Signatory (e.g. NEXORA)" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-[#282828]/10 dark:border-[#25473C]">
          <button type="button" data-action="close-modal" class="px-3 py-1.5 rounded-md border border-[#282828]/20 dark:border-[#25473C] text-xs text-[#282828] dark:text-white cursor-pointer">Cancel</button>
          <button type="submit" class="px-3 py-1.5 rounded-md bg-[#FC6454] hover:bg-[#e8574a] text-white text-xs font-medium cursor-pointer">Issue Verified Certificate</button>
        </div>
      </form>`;
  }

  if (modalType === 'generateCert') {
    title = `Generate Personalized Certificate — ${generateCertForm.studentName || 'Member'}`;
    const memberOptions = membersList.filter(m => m.role !== 'admin').map(m => {
      const isSelected = generateCertForm.memberId === m.id || generateCertForm.memberId === m.memberId;
      return `<option value="${m.id}" data-name="${escapeHtml(m.studentName || '')}" data-role="${escapeHtml(m.role || 'MEMBER')}" ${isSelected ? 'selected' : ''}>${escapeHtml(m.studentName || 'Student')} (${escapeHtml(m.memberId || m.id)}) &bull; ${escapeHtml(m.class || 'Student')}</option>`;
    }).join('');

    body = `
      <form id="automated-cert-form" class="space-y-4 text-xs text-[#282828] dark:text-white">
        <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200 flex items-start gap-3">
          <div class="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
            ${icon('Award', 'w-4 h-4')}
          </div>
          <div>
            <p class="font-bold text-xs">Automated Certificate Generator &amp; Delivery</p>
            <p class="text-[11px] opacity-85 mt-0.5">Dynamically generates vector PDF &amp; high-res image credentials, embeds official academic seals, and dispatches directly via Telegram &amp; email.</p>
          </div>
        </div>

        <div>
          <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Select Member Record</label>
          <select id="acert-member-select" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500">
            <option value="">-- Choose Member or Enter Custom Recipient --</option>
            ${memberOptions}
          </select>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Member Full Name *</label>
            <input id="acert-name" type="text" required value="${escapeHtml(generateCertForm.studentName)}" placeholder="e.g. Samuel Bekele" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500">
          </div>
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Club Role / Distinction</label>
            <select id="acert-role" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="ACTIVE MEMBER" ${generateCertForm.role === 'ACTIVE MEMBER' || generateCertForm.role === 'MEMBER' ? 'selected' : ''}>Active Member</option>
              <option value="PROJECT LEAD" ${generateCertForm.role === 'PROJECT LEAD' ? 'selected' : ''}>Project Lead</option>
              <option value="WORKSHOP GRADUATE" ${generateCertForm.role === 'WORKSHOP GRADUATE' ? 'selected' : ''}>Workshop Graduate</option>
              <option value="TECH COORDINATOR" ${generateCertForm.role === 'TECH COORDINATOR' ? 'selected' : ''}>Tech Coordinator</option>
              <option value="HACKATHON FINALIST" ${generateCertForm.role === 'HACKATHON FINALIST' ? 'selected' : ''}>Hackathon Finalist</option>
              <option value="HONORARY CONTRIBUTOR" ${generateCertForm.role === 'HONORARY CONTRIBUTOR' ? 'selected' : ''}>Honorary Contributor</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Event / Course Track / Project *</label>
          <input id="acert-course" type="text" required value="${escapeHtml(generateCertForm.courseName)}" placeholder="e.g. Full-Stack Web Engineering, AI &amp; Python Workshop" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500">
        </div>

        <div>
          <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Milestone Achievement Citation</label>
          <textarea id="acert-achievement" rows="2" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500">${escapeHtml(generateCertForm.achievement)}</textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Completion / Issue Date</label>
            <input id="acert-date" type="text" value="${escapeHtml(generateCertForm.issueDate)}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500">
          </div>
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Signatory Title</label>
            <input id="acert-signatory" type="text" value="ARX IT Club Leadership" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500">
          </div>
        </div>

        <div class="p-3 rounded-xl bg-[#FAF4EE] dark:bg-[#15362B] border border-[#282828]/10 dark:border-[#25473C] space-y-2">
          <p class="font-mono uppercase text-[10px] text-[#282828]/70 dark:text-white font-bold">Automated Delivery Channels</p>
          <div class="flex flex-col sm:flex-row gap-3">
            <label class="inline-flex items-center gap-2 cursor-pointer text-xs">
              <input type="checkbox" id="acert-chk-tg" ${generateCertForm.deliverTelegram ? 'checked' : ''} class="rounded accent-emerald-600">
              <span>✈️ Send PDF to linked Telegram chat</span>
            </label>
            <label class="inline-flex items-center gap-2 cursor-pointer text-xs">
              <input type="checkbox" id="acert-chk-email" ${generateCertForm.deliverEmail ? 'checked' : ''} class="rounded accent-emerald-600">
              <span>📧 Send Dispatch via Email</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-[#282828]/10 dark:border-[#25473C]">
          <button type="button" data-action="close-modal" class="px-3.5 py-2 rounded-lg border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold cursor-pointer">Cancel</button>
          <button type="submit" id="btn-submit-automated-cert" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs" ${isGeneratingCert ? 'disabled' : ''}>
            ${icon('Award', 'w-4 h-4')} ${isGeneratingCert ? 'Generating...' : 'Generate &amp; Deliver Certificate'}
          </button>
        </div>
      </form>
    `;
  }

  if (modalType === 'bulkGenerateCert') {
    const selectedList = membersList.filter(m => selectedMemberIds.has(m.id));
    title = `Bulk Issue Certificates (${selectedList.length} Selected Members)`;

    body = `
      <form id="bulk-cert-form" class="space-y-4 text-xs text-[#282828] dark:text-white">
        <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200 flex items-start gap-3">
          <div class="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
            ${icon('Award', 'w-4 h-4')}
          </div>
          <div>
            <p class="font-bold text-xs">Batch Certificate Generation Pipeline</p>
            <p class="text-[11px] opacity-85 mt-0.5">Generates individual personalized credentials for each selected member and automatically delivers them across chosen channels.</p>
          </div>
        </div>

        <div>
          <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Target Member Recipients (${selectedList.length})</label>
          <div class="max-h-28 overflow-y-auto p-2.5 rounded-lg bg-[#FAF4EE] dark:bg-[#0C241C] border border-[#282828]/10 dark:border-[#25473C] flex flex-wrap gap-1.5">
            ${selectedList.map(m => `
              <span class="px-2 py-0.5 rounded-md bg-white dark:bg-[#15362B] border border-[#282828]/10 dark:border-[#25473C] font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                ${escapeHtml(m.studentName)} (${escapeHtml(m.memberId)})
              </span>
            `).join('')}
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Event / Course Track / Project Title *</label>
            <input id="bcert-course" type="text" required value="${escapeHtml(bulkCertForm.courseName)}" placeholder="e.g. Web Development Program, IT Hackathon" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500">
          </div>
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Conferred Role</label>
            <select id="bcert-role" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="ACTIVE MEMBER">Active Member</option>
              <option value="WORKSHOP GRADUATE">Workshop Graduate</option>
              <option value="PROJECT LEAD">Project Lead</option>
              <option value="HACKATHON PARTICIPANT">Hackathon Participant</option>
              <option value="HONOR ROLL">Honor Roll</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Milestone Achievement Citation</label>
          <input id="bcert-achievement" type="text" value="${escapeHtml(bulkCertForm.achievement)}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500">
        </div>

        <div>
          <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Completion Date</label>
          <input id="bcert-date" type="text" value="${escapeHtml(bulkCertForm.issueDate)}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500">
        </div>

        <div class="p-3 rounded-xl bg-[#FAF4EE] dark:bg-[#15362B] border border-[#282828]/10 dark:border-[#25473C] space-y-2">
          <p class="font-mono uppercase text-[10px] text-[#282828]/70 dark:text-white font-bold">Automated Delivery Channels</p>
          <div class="flex flex-col sm:flex-row gap-3">
            <label class="inline-flex items-center gap-2 cursor-pointer text-xs">
              <input type="checkbox" id="bcert-chk-tg" ${bulkCertForm.deliverTelegram ? 'checked' : ''} class="rounded accent-emerald-600">
              <span>✈️ Send PDF to linked Telegram accounts</span>
            </label>
            <label class="inline-flex items-center gap-2 cursor-pointer text-xs">
              <input type="checkbox" id="bcert-chk-email" ${bulkCertForm.deliverEmail ? 'checked' : ''} class="rounded accent-emerald-600">
              <span>📧 Send Dispatch via Email</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-[#282828]/10 dark:border-[#25473C]">
          <button type="button" data-action="close-modal" class="px-3.5 py-2 rounded-lg border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold cursor-pointer">Cancel</button>
          <button type="submit" id="btn-submit-bulk-cert" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs" ${isBulkGeneratingCert ? 'disabled' : ''}>
            ${icon('Award', 'w-4 h-4')} ${isBulkGeneratingCert ? 'Processing Batch...' : `Execute Bulk Issuance (${selectedList.length})`}
          </button>
        </div>
      </form>
    `;
  }

  if (modalType === 'award') {
    title = 'Assign Award';
    body = `
      <form id="award-form" class="space-y-4 text-xs">
        <div class="space-y-1">
          <label class="block font-bold text-[#282828] dark:text-white">Select Student *</label>
          <select name="memberId" required class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
            <option value="">-- Select a member --</option>
            ${membersList.filter(m => m.role === 'member').map(m => `<option value="${m.id}">${m.studentName} (${m.memberId})</option>`).join('')}
          </select>
        </div>
        <div class="space-y-1">
          <label class="block font-bold text-[#282828] dark:text-white">Award Title *</label>
          <input name="title" type="text" value="${awardForm.title || ''}" required class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
        </div>
        <div class="space-y-1">
          <label class="block font-bold text-[#282828] dark:text-white">Category</label>
          <input name="category" type="text" value="${awardForm.category || 'Excellence'}" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
        </div>
        <div class="space-y-1">
          <label class="block font-bold text-[#282828] dark:text-white">Description</label>
          <textarea name="description" rows="2" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white resize-none">${awardForm.description || ''}</textarea>
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-[#282828]/10 dark:border-[#25473C]">
          <button type="button" data-action="close-modal" class="px-3 py-1.5 rounded-md border border-[#282828]/20 dark:border-[#25473C] text-xs text-[#282828] dark:text-white cursor-pointer">Cancel</button>
          <button type="submit" class="px-3 py-1.5 rounded-md bg-[#FC6454] hover:bg-[#e8574a] text-white text-xs font-medium cursor-pointer">Assign Award</button>
        </div>
      </form>`;
  }

  if (modalType === 'achievement') {
    title = 'Add Achievement';
    body = `
      <form id="achievement-form" class="space-y-4 text-xs">
        <div class="space-y-1">
          <label class="block font-bold text-[#282828] dark:text-white">Achievement Title *</label>
          <input name="title" type="text" value="${achievementForm.title || ''}" required class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
        </div>
        <div class="space-y-1">
          <label class="block font-bold text-[#282828] dark:text-white">Category / Rank</label>
          <input name="category" type="text" value="${achievementForm.category || 'Competition'}" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
        </div>
        <div class="space-y-1">
          <label class="block font-bold text-[#282828] dark:text-white">Year</label>
          <input name="year" type="number" value="${achievementForm.year || 2026}" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
        </div>
        <div class="space-y-1">
          <label class="block font-bold text-[#282828] dark:text-white">Description</label>
          <textarea name="description" rows="3" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white resize-none">${achievementForm.description || ''}</textarea>
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-[#282828]/10 dark:border-[#25473C]">
          <button type="button" data-action="close-modal" class="px-3 py-1.5 rounded-md border border-[#282828]/20 dark:border-[#25473C] text-xs text-[#282828] dark:text-white cursor-pointer">Cancel</button>
          <button type="submit" class="px-3 py-1.5 rounded-md bg-[#FC6454] hover:bg-[#e8574a] text-white text-xs font-medium cursor-pointer">Publish Achievement</button>
        </div>
      </form>`;
  }

  if (modalType === 'editMember') {
    title = 'Edit Member Profile';
    body = `
      <form id="edit-member-form" class="space-y-4 text-xs">
        <div class="grid grid-cols-2 gap-3">
          ${[['studentName','Student Name'],['class','Class'],['phoneNumber','Phone Number'],['telegramUsername','Telegram Username'],['award','Award / Recognition']].map(([k,l]) => `
            <div class="space-y-1">
              <label class="block font-bold text-[#282828] dark:text-white">${l}</label>
              <input name="${k}" type="text" value="${editMemberForm[k] || ''}" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
            </div>`).join('')}
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-[#282828]/10 dark:border-[#25473C]">
          <button type="button" data-action="close-modal" class="px-3 py-1.5 rounded-md border border-[#282828]/20 dark:border-[#25473C] text-xs text-[#282828] dark:text-white cursor-pointer">Cancel</button>
          <button type="submit" class="px-3 py-1.5 rounded-md bg-[#FC6454] hover:bg-[#e8574a] text-white text-xs font-medium cursor-pointer">Save Changes</button>
        </div>
      </form>`;
  }

  if (modalType === 'resetMemberPassword') {
    title = `Reset Password — ${resetPasswordMember?.studentName || ''}`;
    body = `
      <form id="reset-pw-form" class="space-y-4 text-xs">
        <p class="text-xs text-[#282828]/70 dark:text-white">Enter a new password for student ${resetPasswordMember?.studentName} (${resetPasswordMember?.memberId}). Minimum 6 characters.</p>
        <input id="new-pw-input" type="password" value="${newPasswordInput}" placeholder="New password..." class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#294B40] text-xs text-[#282828] dark:text-white">
        <div class="flex justify-end gap-2 pt-2 border-t border-[#282828]/10 dark:border-[#25473C]">
          <button type="button" data-action="close-modal" class="px-3 py-1.5 rounded-md border border-[#282828]/20 dark:border-[#25473C] text-xs text-[#282828] dark:text-white cursor-pointer">Cancel</button>
          <button type="submit" class="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium cursor-pointer">Reset Password</button>
        </div>
      </form>`;
  }

  if (modalType === 'appDetail' && selectedApplicationDetail) {
    const a = selectedApplicationDetail;
    title = `Student Application — ${a.studentName || 'Applicant'}`;
    const essayText = a.motivationEssay || a.essay || '';
    const wordCount = essayText ? essayText.split(/\s+/).filter(Boolean).length : 0;
    const charCount = essayText ? essayText.length : 0;

    body = `
      <div class="space-y-4 text-xs text-[#282828] dark:text-white">
        <!-- Header Info Card -->
        <div class="p-4 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-[#282828] dark:text-white">${escapeHtml(a.studentName || '—')}</h3>
              ${badge(a.status, a.status === 'pending' ? 'amber' : a.status === 'approved' ? 'emerald' : 'rose')}
            </div>
            <p class="font-mono text-[11px] text-[#282828]/60 dark:text-white mt-0.5">
              Member ID: <span class="font-bold text-[#282828] dark:text-white">${escapeHtml(a.memberId || 'Pending')}</span>
              &bull; Applied: ${a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}
            </p>
          </div>
          <div class="flex items-center gap-2">
            ${a.status === 'pending' ? `
              <button data-action="approve-app" data-id="${a.id}" class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs">
                Approve Application
              </button>
              <button data-action="reject-app" data-id="${a.id}" class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs">
                Reject
              </button>
              <button data-action="del-app" data-id="${a.id}" class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-500/30 cursor-pointer shadow-xs">
                Delete
              </button>
            ` : a.status === 'rejected' ? `
              <button data-action="approve-app" data-id="${a.id}" class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs">
                Re-Approve
              </button>
              <button data-action="del-app" data-id="${a.id}" class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-500/30 cursor-pointer shadow-xs">
                Delete Permanently
              </button>
            ` : `
              <button data-action="reject-app" data-id="${a.id}" class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs">
                Revoke Approval
              </button>
              <button data-action="del-app" data-id="${a.id}" class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-500/30 cursor-pointer shadow-xs">
                Delete
              </button>
            `}
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div class="p-3 rounded-lg bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C]">
            <span class="font-mono text-[#282828]/50 dark:text-white uppercase text-[10px] font-bold">Class Section</span>
            <p class="font-semibold text-sm mt-0.5">${escapeHtml(a.class || '—')}</p>
          </div>
          <div class="p-3 rounded-lg bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C]">
            <span class="font-mono text-[#282828]/50 dark:text-white uppercase text-[10px] font-bold">Selected Course Tracks (${Array.isArray(a.courses) ? a.courses.length : 1})</span>
            <div class="mt-0.5 space-y-0.5">
              ${(Array.isArray(a.courses) && a.courses.length > 0)
                ? a.courses.map((c, i) => `
                    <p class="font-semibold text-xs font-mono text-cyan-600 dark:text-cyan-400">
                      #${i + 1}: ${escapeHtml(c.title || c.id)} ${c.category ? `<span class="opacity-60 text-[10px]">(${escapeHtml(c.category)})</span>` : ''}
                    </p>
                  `).join('')
                : `<p class="font-semibold text-sm font-mono text-cyan-600 dark:text-cyan-400">${escapeHtml(a.courseTitle || a.course?.title || a.courseName || '—')}</p>`
              }
            </div>
          </div>
          <div class="p-3 rounded-lg bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C]">
            <span class="font-mono text-[#282828]/50 dark:text-white uppercase text-[10px] font-bold">Phone Number</span>
            <p class="font-semibold text-sm mt-0.5">
              ${a.phoneNumber ? `<a href="tel:${escapeHtml(a.phoneNumber)}" class="text-blue-600 dark:text-blue-400 hover:underline font-mono">${escapeHtml(a.phoneNumber)}</a>` : '—'}
            </p>
          </div>
          <div class="p-3 rounded-lg bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C]">
            <span class="font-mono text-[#282828]/50 dark:text-white uppercase text-[10px] font-bold">Email Address</span>
            <p class="font-semibold text-sm mt-0.5 font-mono truncate">
              ${a.email ? `<a href="mailto:${escapeHtml(a.email)}" class="text-blue-600 dark:text-blue-400 hover:underline">${escapeHtml(a.email)}</a>` : '<span class="text-[#282828]/40 dark:text-white">Not provided</span>'}
            </p>
          </div>
          <div class="p-3 rounded-lg bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C]">
            <span class="font-mono text-[#282828]/50 dark:text-white uppercase text-[10px] font-bold">Telegram Account</span>
            <p class="font-semibold text-sm mt-0.5">
              ${a.telegramUsername ? `
                <a href="https://t.me/${escapeHtml(a.telegramUsername.replace(/^@/, ''))}" target="_blank" rel="noopener noreferrer" class="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 font-mono">
                  ${escapeHtml(a.telegramUsername)} &nearr;
                </a>
              ` : '<span class="text-[#282828]/40 dark:text-white">Not provided</span>'}
            </p>
            ${a.telegramUserId ? `<p class="text-[10px] font-mono text-[#282828]/50 dark:text-white mt-0.5">ID: ${escapeHtml(a.telegramUserId)} (${a.telegramActivated ? 'Verified' : 'Unverified'})</p>` : ''}
          </div>
          <div class="p-3 rounded-lg bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C]">
            <span class="font-mono text-[#282828]/50 dark:text-white uppercase text-[10px] font-bold">Name Breakdown</span>
            <p class="font-semibold text-xs mt-0.5 text-[#282828]/70 dark:text-white">
              First: <strong>${escapeHtml(a.firstName || '—')}</strong> &bull; Mid: <strong>${escapeHtml(a.secondName || '—')}</strong> &bull; Last: <strong>${escapeHtml(a.lastName || '—')}</strong>
            </p>
          </div>
        </div>

        <!-- Motivation Essay Section -->
        <div class="p-4 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] space-y-2.5 shadow-xs">
          <div class="flex items-center justify-between border-b border-[#282828]/10 dark:border-[#25473C] pb-2">
            <span class="font-mono text-xs font-bold text-[#FC6454] dark:text-[#6BB89E] flex items-center gap-1.5 uppercase">
              ${icon('BookOpen', 'w-4 h-4')} Full Motivation Statement / Essay
            </span>
            <span class="font-mono text-[10px] text-[#282828]/60 dark:text-white">
              ${wordCount} words &bull; ${charCount} characters
            </span>
          </div>
          ${essayText ? `
            <div class="p-4 rounded-lg bg-[#FAF4EE] dark:bg-[#071A14] border border-[#282828]/10 dark:border-[#25473C] text-xs leading-relaxed text-[#282828] dark:text-white whitespace-pre-wrap font-sans max-h-60 overflow-y-auto">
              ${escapeHtml(essayText)}
            </div>
            ${a.aiEssayScore !== undefined ? `
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF4EE] dark:bg-[#071A14] border border-[#282828]/10 dark:border-[#25473C] text-[11px] font-mono">
                <span class="${a.aiEssaySuspected ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}">
                  ${a.aiEssaySuspected ? 'High AI Probability Suspected' : 'Authentic Student Submission'} (${Math.round((a.aiEssayScore || 0) * 100)}% AI likelihood)
                </span>
                <span class="text-[#282828]/50 dark:text-white">Method: ${escapeHtml(a.aiEssayMethod || 'standard')}</span>
              </div>
            ` : ''}
          ` : `
            <p class="text-xs text-[#282828]/50 dark:text-white italic py-2">The applicant did not provide a motivation statement during registration.</p>
          `}
        </div>

        <!-- Honors, Awards & Uploaded Proof Documents -->
        <div class="p-4 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] space-y-3 shadow-xs">
          <div class="flex items-center justify-between border-b border-[#282828]/10 dark:border-[#25473C] pb-2">
            <span class="font-mono text-xs font-bold text-[#282828] dark:text-white flex items-center gap-1.5 uppercase">
              ${icon('Award', 'w-4 h-4 text-amber-500')} Honors, Awards &amp; Supporting Documents
            </span>
            <span class="font-mono text-[10px] text-[#282828]/60 dark:text-white">
              ${(a.awardFiles || []).length} file(s) attached
            </span>
          </div>
          <div>
            <span class="font-mono text-[#282828]/50 dark:text-white uppercase text-[10px] font-bold">Awards &amp; Distinctions Description</span>
            <p class="text-xs mt-1 text-[#282828]/80 dark:text-white leading-relaxed">
              ${a.award ? escapeHtml(a.award) : '<em class="text-[#282828]/40 dark:text-white">None stated</em>'}
            </p>
          </div>
          ${a.awardFiles && a.awardFiles.length > 0 ? `
            <div>
              <span class="font-mono text-[#282828]/50 dark:text-white uppercase text-[10px] font-bold mb-1.5 block">Attached Proof Documents</span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                ${a.awardFiles.map((file, idx) => `
                  <a href="${file.dataUrl || file.url || '#'}" target="_blank" rel="noopener noreferrer" class="p-2.5 rounded-lg bg-[#FAF4EE] dark:bg-[#071A14] border border-[#282828]/10 dark:border-[#25473C] hover:border-blue-500 flex items-center justify-between transition-colors">
                    <div class="truncate mr-2">
                      <p class="font-medium text-xs truncate">${escapeHtml(file.fileName || `Supporting Document ${idx + 1}`)}</p>
                      <p class="text-[10px] font-mono text-[#282828]/50 dark:text-white">${file.fileSize ? Math.round(file.fileSize / 1024) + ' KB' : (file.mimeType || 'Document')}</p>
                    </div>
                    <span class="text-blue-600 dark:text-blue-400 font-mono text-[11px] shrink-0 font-bold">View &nearr;</span>
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Modal Footer Actions -->
        <div class="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#282828]/10 dark:border-[#25473C]">
          <div class="flex flex-wrap items-center gap-2">
            ${a.status === 'pending' ? `
              <button data-action="approve-app" data-id="${a.id}" class="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs inline-flex items-center gap-1">
                ${icon('CheckCircle', 'w-3.5 h-3.5')} Accept &amp; Approve
              </button>
              <button data-action="reject-app" data-id="${a.id}" class="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs inline-flex items-center gap-1">
                ${icon('XCircle', 'w-3.5 h-3.5')} Decline
              </button>
            ` : a.status === 'rejected' ? `
              <button data-action="approve-app" data-id="${a.id}" class="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs inline-flex items-center gap-1">
                ${icon('CheckCircle', 'w-3.5 h-3.5')} Re-Approve
              </button>
            ` : `
              <button data-action="cert-member" data-id="${a.id}" class="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#2F8068] hover:bg-[#3A9277] text-white cursor-pointer shadow-xs inline-flex items-center gap-1">
                ${icon('Award', 'w-3.5 h-3.5')} Issue Certificate
              </button>
              <button data-action="reject-app" data-id="${a.id}" class="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs inline-flex items-center gap-1">
                ${icon('XCircle', 'w-3.5 h-3.5')} Revoke
              </button>
            `}
            <button data-action="del-app" data-id="${a.id}" class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-500/30 cursor-pointer shadow-xs inline-flex items-center gap-1">
              ${icon('Trash2', 'w-3.5 h-3.5')} Delete Record
            </button>
          </div>
          <button data-action="close-modal" class="px-4 py-1.5 rounded-lg border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold text-[#282828] dark:text-white hover:bg-[#FAF4EE] dark:hover:bg-[#15362B] cursor-pointer">
            Close Panel
          </button>
        </div>
      </div>
    `;
  }

  if (modalType === 'memberDetail' && selectedMemberDetail) {
    const md = selectedMemberDetail;
    const memberObj = md.member || md;
    title = `Member Profile — ${memberObj.studentName || ''}`;
    const essayText = memberObj.motivationEssay || memberObj.essay || '';
    const wordCount = essayText ? essayText.split(/\s+/).filter(Boolean).length : 0;

    body = `
      <div class="space-y-4 text-xs text-[#282828] dark:text-white">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          ${[
            ['Member ID', memberObj.memberId],
            ['Class Grade', memberObj.class],
            ['Phone Number', memberObj.phoneNumber ? `<a href="tel:${escapeHtml(memberObj.phoneNumber)}" class="text-blue-600 hover:underline font-mono">${escapeHtml(memberObj.phoneNumber)}</a>` : '—'],
            ['Email Address', memberObj.email ? `<a href="mailto:${escapeHtml(memberObj.email)}" class="text-blue-600 hover:underline font-mono truncate block">${escapeHtml(memberObj.email)}</a>` : '—'],
            ['Telegram', memberObj.telegramUsername ? `<a href="https://t.me/${escapeHtml(memberObj.telegramUsername.replace(/^@/, ''))}" target="_blank" class="text-sky-600 font-mono font-bold hover:underline">${escapeHtml(memberObj.telegramUsername)} &nearr;</a>` : '—'],
            ['Telegram Status', memberObj.telegramActivated ? '<span class="text-emerald-500 font-bold">Activated</span>' : '<span class="text-amber-500 font-mono">Unlinked</span>'],
            ['Status', badge(memberObj.status, memberObj.status === 'active' || memberObj.status === 'approved' ? 'emerald' : memberObj.status === 'suspended' ? 'rose' : 'amber')],
            ['Role', memberObj.role ? memberObj.role.toUpperCase() : 'MEMBER']
          ].map(([k,v]) => `
            <div class="p-2.5 rounded-lg bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C]">
              <span class="font-mono text-[#282828]/50 dark:text-white uppercase text-[10px] font-bold block">${k}</span>
              <div class="font-semibold text-xs mt-0.5">${v || '—'}</div>
            </div>`).join('')}
        </div>

        ${essayText ? `
          <div class="p-3 rounded-lg bg-[#FAF4EE] dark:bg-[#15362B] border border-[#282828]/10 dark:border-[#25473C] space-y-1.5">
            <div class="flex items-center justify-between font-mono text-[10px] text-[#282828]/60 dark:text-white uppercase font-bold">
              <span>Motivation Statement</span>
              <span>${wordCount} words</span>
            </div>
            <p class="text-xs text-[#282828]/80 dark:text-[#E2ECE8] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">${escapeHtml(essayText)}</p>
            ${memberObj.aiEssayScore !== undefined ? `
              <div class="mt-1.5 pt-1.5 border-t border-[#282828]/10 dark:border-[#25473C] flex items-center gap-2 text-[10px] font-mono">
                <span class="${memberObj.aiEssaySuspected ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}">
                  ${memberObj.aiEssaySuspected ? 'AI Flagged' : 'Authentic'} (${Math.round((memberObj.aiEssayScore || 0) * 100)}% AI likelihood)
                </span>
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${memberObj.award ? `
          <div class="p-2.5 rounded-lg bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C]">
            <span class="font-mono text-[#282828]/50 dark:text-white uppercase text-[10px] font-bold">Honors &amp; Awards</span>
            <p class="text-xs text-[#282828] dark:text-white mt-0.5">${escapeHtml(memberObj.award)}</p>
          </div>
        ` : ''}

        ${(memberObj.awardFiles?.length || md.awardFiles?.length) ? `
          <div>
            <span class="font-mono text-[#282828]/50 dark:text-white uppercase text-[10px] font-bold mb-1 block">Submitted Proof Documents (${(memberObj.awardFiles || md.awardFiles).length})</span>
            <div class="grid grid-cols-2 gap-2">
              ${(memberObj.awardFiles || md.awardFiles).map((f, idx) => `
                <a href="${f.dataUrl || f.url || '#'}" target="_blank" rel="noopener noreferrer" class="p-2 rounded bg-white dark:bg-[#0C241C] border border-[#282828]/10 dark:border-[#294B40] text-[11px] text-[#282828] dark:text-white hover:border-blue-500 flex items-center justify-between">
                  <span class="truncate">${escapeHtml(f.fileName || `Document #${idx + 1}`)}</span>
                  <span class="text-[10px] text-sky-500 font-mono font-bold">Open &nearr;</span>
                </a>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${md.enrollments?.length ? `
          <div>
            <p class="text-[11px] font-mono uppercase tracking-wider text-[#282828]/60 dark:text-white mb-1.5 font-bold">Course Enrollments (${md.enrollments.length})</p>
            <div class="space-y-1">${md.enrollments.map(e => `
              <div class="flex items-center justify-between p-2 rounded bg-white dark:bg-[#15362B] border border-[#282828]/10 dark:border-[#25473C] text-xs">
                <span class="font-medium">${escapeHtml(e.course?.title || e.courseName || '—')}</span>
                ${badge(e.status || 'enrolled', e.status === 'completed' ? 'emerald' : 'blue')}
              </div>`).join('')}</div>
          </div>` : ''}

        <div class="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#282828]/10 dark:border-[#25473C]">
          <div class="flex items-center gap-2">
            <button data-action="cert-member" data-id="${memberObj.id}" class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#2F8068] hover:bg-[#3A9277] text-white cursor-pointer shadow-xs inline-flex items-center gap-1">
              ${icon('Award', 'w-3.5 h-3.5')} Issue Certificate
            </button>
            ${memberObj.role !== 'admin' ? `
              <button data-action="del-member" data-id="${memberObj.id}" class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-500/30 cursor-pointer shadow-xs inline-flex items-center gap-1">
                ${icon('Trash2', 'w-3.5 h-3.5')} Delete Member
              </button>
            ` : ''}
          </div>
          <button data-action="close-modal" class="px-4 py-1.5 rounded-lg border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold text-[#282828] dark:text-white bg-white dark:bg-[#102B22] hover:bg-[#FAF4EE] dark:hover:bg-[#15362B] cursor-pointer">Close</button>
        </div>
      </div>`;
  }

  if (modalType === 'create-announcement') {
    title = 'Publish Club Announcement';
    body = `
      <form id="announcement-modal-form" class="space-y-4 text-xs">
        <div>
          <label class="block font-bold text-[#282828] dark:text-white mb-1">Announcement Title *</label>
          <input
            id="ann-title"
            type="text"
            required
            placeholder="e.g. Computer Lab 3 Robotics Workshop Schedule Update"
            class="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-[#282828] dark:text-white mb-1">Priority Level</label>
            <select
              id="ann-priority"
              class="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white">
              <option value="normal">Normal Notice</option>
              <option value="important">Important Update</option>
              <option value="urgent">Urgent / Action Required</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-[#282828] dark:text-white mb-1">Category</label>
            <select
              id="ann-category"
              class="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white">
              <option value="General">General Announcement</option>
              <option value="Workshop & Events">Workshop &amp; Events</option>
              <option value="Assignment Deadline">Assignment Deadline</option>
              <option value="Lab Schedule">Lab Schedule</option>
              <option value="Competition">Competition &amp; Awards</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block font-bold text-[#282828] dark:text-white mb-1">Announcement Message *</label>
          <textarea
            id="ann-content"
            rows="5"
            required
            placeholder="Write the full announcement details here..."
            class="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white font-sans leading-relaxed"></textarea>
        </div>

        <div class="p-3 rounded-lg bg-[#FAF4EE] dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] space-y-2">
          <label class="flex items-center gap-2 cursor-pointer font-medium text-[#282828] dark:text-white">
            <input id="ann-publish" type="checkbox" checked class="rounded border-[#282828]/30 dark:border-[#294B40] text-[#FC6454]" />
            <span>Publish immediately to website &amp; student portal</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer font-medium text-[#282828] dark:text-white">
            <input id="ann-tg" type="checkbox" class="rounded border-[#282828]/30 dark:border-[#294B40] text-[#FC6454]" />
            <span>Broadcast via Telegram Bot (delivered to enrolled bot students)</span>
          </label>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-[#282828]/10 dark:border-[#25473C]">
          <button
            type="button"
            data-action="close-modal"
            class="px-4 py-2 rounded-lg border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#FAF4EE] dark:hover:bg-[#15362B] cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            data-action="save-announcement"
            class="px-4 py-2 rounded-lg bg-[#FC6454] hover:bg-[#e8574a] text-white font-bold cursor-pointer border-0 shadow-xs">
            Post Announcement
          </button>
        </div>
      </form>
    `;
  }

  if (modalType === 'reviewSubmission' && activeItem) {
    title = `Review: ${escapeHtml(activeItem.title || 'Project Submission')}`;
    body = `
      <form id="review-submission-form" class="space-y-4">
        <div class="p-3 rounded-lg bg-[#FAF4EE] dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] space-y-1 text-xs font-mono">
          <div><span class="text-[#282828]/50 dark:text-white">Student:</span> <span class="font-semibold text-[#282828] dark:text-white">${escapeHtml(activeItem.studentName)}</span></div>
          <div><span class="text-[#282828]/50 dark:text-white">Member ID:</span> <span class="font-semibold">${escapeHtml(activeItem.memberId)}</span></div>
          <div><span class="text-[#282828]/50 dark:text-white">Class:</span> <span>${escapeHtml(activeItem.class || '—')}</span></div>
          <div><span class="text-[#282828]/50 dark:text-white">File:</span> <span>${escapeHtml(activeItem.fileName)}</span></div>
          ${activeItem.description ? `<div><span class="text-[#282828]/50 dark:text-white">Description:</span> <span>${escapeHtml(activeItem.description)}</span></div>` : ''}
          ${activeItem.telegramUsername ? `<div><span class="text-[#282828]/50 dark:text-white">Telegram:</span> <span class="text-sky-600 dark:text-sky-400">${escapeHtml(activeItem.telegramUsername)}</span></div>` : ''}
        </div>
        <div>
          <label class="block text-xs font-semibold text-[#282828] dark:text-white mb-1.5">Review Decision *</label>
          <select id="review-status" required
            class="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white text-sm">
            <option value="pending" ${activeItem.status === 'pending' ? 'selected' : ''}>⏳ Pending Review</option>
            <option value="approved" ${activeItem.status === 'approved' ? 'selected' : ''}>✅ Approved</option>
            <option value="needs_revision" ${activeItem.status === 'needs_revision' ? 'selected' : ''}>✏️ Needs Revision</option>
            <option value="rejected" ${activeItem.status === 'rejected' ? 'selected' : ''}>❌ Not Accepted</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-[#282828] dark:text-white mb-1.5">Reviewer Notes / Feedback <span class="text-[#282828]/40 dark:text-white font-normal">(Optional — sent to student via Telegram)</span></label>
          <textarea id="review-notes" rows="3" placeholder="e.g. Great work! Consider improving error handling in your main module..."
            class="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white text-sm resize-none">${escapeHtml(activeItem.reviewNotes || '')}</textarea>
          ${activeItem.telegramUsername ? `<p class="text-[10px] font-mono text-sky-600 dark:text-sky-400 mt-1">${icon('Send', 'w-3 h-3 inline')} Student will be notified via Telegram bot.</p>` : ''}
        </div>
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-[#282828]/10 dark:border-[#25473C]">
          <button type="button" data-action="close-modal"
            class="px-4 py-2 rounded-lg border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#FAF4EE] dark:hover:bg-[#15362B] cursor-pointer text-sm">Cancel</button>
          <button type="submit"
            class="px-4 py-2 rounded-lg bg-[#FC6454] hover:bg-[#e8574a] text-white font-bold cursor-pointer border-0 shadow-xs text-sm">
            ${icon('ClipboardCheck', 'w-4 h-4 inline mr-1')} Save Review
          </button>
        </div>
      </form>
    `;
  }

  if (modalType === 'teamMember') {
    title = activeItem ? `Edit Team Member — ${escapeHtml(activeItem.name || '')}` : 'Add New Team Member';
    const form = teamMemberForm;
    body = `
      <form id="team-member-form" class="space-y-4 text-xs text-[#282828] dark:text-white">
        ${teamMemberError ? `
          <div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium">
            ${escapeHtml(teamMemberError)}
          </div>
        ` : ''}

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Full Name *</label>
            <input id="team-name" type="text" required value="${escapeHtml(form.name)}" placeholder="e.g. Natan Yonas" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#FC6454] dark:focus:ring-[#6BB89E]" />
          </div>
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-[#A2C0B6] font-bold mb-1">Role / Executive Title *</label>
            <input id="team-role" type="text" required value="${escapeHtml(form.role)}" placeholder="e.g. Chief Technology Officer (CTO), President, Python Instructor" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#FC6454] dark:focus:ring-[#6BB89E]" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-[#A2C0B6] font-bold mb-1">Hierarchy Tier *</label>
            <select id="team-category" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold">
              <option value="leadership" ${form.category === 'leadership' ? 'selected' : ''}>Primary Leadership</option>
              <option value="instructor" ${form.category === 'instructor' ? 'selected' : ''}>Technical Instructor</option>
              <option value="core_team" ${form.category === 'core_team' ? 'selected' : ''}>Core Contributor</option>
            </select>
          </div>
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Specialty / Department</label>
            <input id="team-specialty" type="text" value="${escapeHtml(form.specialty || '')}" placeholder="e.g. Robotics, AI &amp; Machine Learning" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold" />
          </div>
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Display Sort Order</label>
            <input id="team-order" type="number" min="1" max="99" value="${form.order || 1}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-mono font-bold" />
          </div>
        </div>

        <!-- Photograph & Preset Portraits -->
        <div class="p-3.5 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] space-y-3">
          <div class="flex items-center justify-between">
            <label class="font-mono uppercase text-[10px] text-[#282828]/70 dark:text-white font-bold">Official Club Portrait</label>
            <span class="text-[10px] font-mono text-[#282828]/50 dark:text-white">Click a preset or enter custom image URL</span>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full overflow-hidden bg-[#FAF4EE] dark:bg-[#071A14] border-2 border-[#FC6454]/40 dark:border-[#6BB89E]/40 shrink-0">
              <img id="team-preview-img" src="${escapeHtml(form.photoUrl || '/uploads/student-leadership.svg')}" style="object-position: ${form.positionOffset || 'center 20%'};" class="w-full h-full object-cover" onerror="this.src='/uploads/student-leadership.svg'" />
            </div>
            <div class="flex-1 space-y-2">
              <input id="team-photo-url" type="text" value="${escapeHtml(form.photoUrl || '')}" placeholder="/team/name.jpg or custom URL" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-mono" />
              <div class="flex flex-wrap gap-1">
                ${[
                  { label: 'Kidus', url: '/team/kidus.jpg', pos: 'center 15%' },
                  { label: 'Yohannes', url: '/team/jo.jpg?v=2', pos: 'center 42%' },
                  { label: 'Nathan Haddis', url: '/team/nathan-haddis.jpg', pos: 'center 20%' },
                  { label: 'Natan Yonas', url: '/team/me.jpg?v=2', pos: 'center 35%' },
                  { label: 'Nathan W.', url: '/team/nathan.jpg', pos: 'center 35%' },
                  { label: 'Abenezer', url: '/team/ab.jpg?v=2', pos: 'center 20%' },
                  { label: 'Nafyad', url: '/team/nafyad.jpg', pos: 'center 15%' },
                  { label: 'Default', url: '/uploads/student-leadership.svg', pos: 'center 20%' }
                ].map(p => `
                  <button type="button" data-action="team-preset-portrait" data-url="${p.url}" data-pos="${p.pos}" class="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FAF4EE] dark:bg-[#15362B] border border-[#282828]/10 dark:border-[#25473C] hover:border-[#FC6454] cursor-pointer">
                    ${p.label}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Image Framing Offset (CSS object-position)</label>
            <input id="team-pos-offset" type="text" value="${escapeHtml(form.positionOffset || 'center 20%')}" placeholder="center 20%" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-mono" />
          </div>
        </div>

        <div>
          <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Biography &amp; Responsibilities</label>
          <textarea id="team-desc" rows="3" placeholder="Summary of mentorship and leadership contributions..." class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs leading-relaxed font-sans">${escapeHtml(form.description || '')}</textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Telegram Handle</label>
            <input id="team-telegram" type="text" value="${escapeHtml(form.socialLinks?.telegram || '')}" placeholder="@username" class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-mono" />
          </div>
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">GitHub Profile URL</label>
            <input id="team-github" type="text" value="${escapeHtml(form.socialLinks?.github || '')}" placeholder="https://github.com/..." class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-mono" />
          </div>
        </div>

        <div class="p-3 rounded-lg bg-[#FAF4EE] dark:bg-[#15362B] border border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between">
          <label class="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold">
            <input id="team-publish-chk" type="checkbox" ${form.isPublished !== false ? 'checked' : ''} class="rounded accent-[#FC6454] dark:accent-[#6BB89E]" />
            <span>Publicly Visible on About Page</span>
          </label>
          <span class="text-[10px] font-mono text-[#282828]/50 dark:text-white">Unique roles verified automatically</span>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-[#282828]/10 dark:border-[#25473C]">
          <button type="button" data-action="close-modal" class="px-3.5 py-2 rounded-lg border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold cursor-pointer">Cancel</button>
          <button type="submit" id="btn-submit-team-member" class="px-4 py-2 rounded-lg bg-[#FC6454] hover:bg-[#e04d3e] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs" ${isSavingTeamMember ? 'disabled' : ''}>
            ${isSavingTeamMember ? 'Saving Member...' : (activeItem ? 'Update Profile' : 'Add Team Member')}
          </button>
        </div>
      </form>
    `;
  }

  if (modalType === 'transferRole') {
    title = 'Transfer Leadership Role';
    const form = transferRoleForm;
    body = `
      <form id="transfer-role-form" class="space-y-4 text-xs text-[#282828] dark:text-white">
        <div class="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 flex items-start gap-3">
          <div class="p-2 rounded-lg bg-amber-500 text-white shrink-0">
            ${icon('RefreshCw', 'w-4 h-4')}
          </div>
          <div>
            <p class="font-bold text-xs">Executive Role Transfer Utility</p>
            <p class="text-[11px] opacity-85 mt-0.5">
              Reassign a unique executive position (e.g. Chief Marketing Officer) from one leader to another. This automatically updates both profiles and assigns a designated departmental title to the predecessor, preventing duplicate titles.
            </p>
          </div>
        </div>

        ${transferRoleError ? `
          <div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium">
            ${escapeHtml(transferRoleError)}
          </div>
        ` : ''}

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Predecessor (Current Title Holder) *</label>
            <select id="transfer-source" required class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold">
              <option value="">-- Select Current Holder --</option>
              ${teamList.map(m => `
                <option value="${m.id}" ${form.sourceMemberId === m.id ? 'selected' : ''}>
                  ${escapeHtml(m.name)} — ${escapeHtml(m.role)}
                </option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Successor (New Title Holder) *</label>
            <select id="transfer-target" required class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold">
              <option value="">-- Select New Holder --</option>
              ${teamList.map(m => `
                <option value="${m.id}" ${form.targetMemberId === m.id ? 'selected' : ''}>
                  ${escapeHtml(m.name)} — ${escapeHtml(m.role)}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Role Title to Transfer *</label>
            <input id="transfer-role-title" type="text" required value="${escapeHtml(form.roleTitle || 'Chief Marketing Officer')}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold" />
          </div>
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Designated Title for Predecessor *</label>
            <input id="transfer-new-source-role" type="text" required value="${escapeHtml(form.newSourceRole || 'Front-End Development Instructor')}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold" />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-[#282828]/10 dark:border-[#25473C]">
          <button type="button" data-action="close-modal" class="px-3.5 py-2 rounded-lg border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold cursor-pointer">Cancel</button>
          <button type="submit" id="btn-submit-transfer-role" class="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs" ${isTransferringRole ? 'disabled' : ''}>
            ${isTransferringRole ? 'Transferring...' : 'Execute Role Transfer'}
          </button>
        </div>
      </form>
    `;
  }

  if (modalType === 'create-attendance-session') {
    title = 'Schedule Lab Attendance Session';
    const form = sessionForm;
    body = `
      <form id="attendance-session-form" class="space-y-4 text-xs text-[#282828] dark:text-white">
        <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200 flex items-start gap-3">
          <div class="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
            ${icon('Clock', 'w-4 h-4')}
          </div>
          <div>
            <p class="font-bold text-xs">Ethiopian Clock Schedule Configuration</p>
            <p class="text-[11px] opacity-85 mt-0.5">
              Standard lab sessions open at 7:00 Afternoon (1:00 PM EAT). Students checking in between 7:00 and 7:30 are classified as Present. Students checking in between 7:30 and 7:40 are classified as Late. Submissions close strictly at 7:40 (1:40 PM).
            </p>
          </div>
        </div>

        ${sessionError ? `
          <div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium">
            ${escapeHtml(sessionError)}
          </div>
        ` : ''}

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Target Curriculum Track *</label>
            <select id="att-form-course" required class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold">
              <option value="general" ${form.courseId === 'general' ? 'selected' : ''}>General Lab Session (All Enrolled Members)</option>
              ${coursesList.map(c => `
                <option value="${c.id}" ${form.courseId === c.id ? 'selected' : ''}>${escapeHtml(c.title)}</option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Session Date (YYYY-MM-DD) *</label>
            <input id="att-form-date" type="date" required value="${form.date || new Date().toISOString().split('T')[0]}" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold font-mono" />
          </div>
        </div>

        <div>
          <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Session Title / Topic *</label>
          <input id="att-form-title" type="text" required value="${escapeHtml(form.title || '')}" placeholder="e.g. Lab 4: Hands-on Robotics & Sensors Assembly" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold" />
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Open Time (Eth)</label>
            <input id="att-form-open" type="text" value="${escapeHtml(form.ethiopianOpenTime || '07:00')}" placeholder="07:00" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-mono font-bold" />
            <span class="text-[9px] text-[#282828]/50 dark:text-white">13:00 International</span>
          </div>
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Late Cutoff (Eth)</label>
            <input id="att-form-present-cutoff" type="text" value="${escapeHtml(form.ethiopianPresentCutoff || '07:30')}" placeholder="07:30" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-mono font-bold" />
            <span class="text-[9px] text-[#282828]/50 dark:text-white">13:30 International</span>
          </div>
          <div>
            <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Hard Close (Eth)</label>
            <input id="att-form-late-cutoff" type="text" value="${escapeHtml(form.ethiopianLateCutoff || '07:40')}" placeholder="07:40" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-mono font-bold" />
            <span class="text-[9px] text-[#282828]/50 dark:text-white">13:40 International</span>
          </div>
        </div>

        <div>
          <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Instructions for Students</label>
          <textarea id="att-form-instructions" rows="2" class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-sans">${escapeHtml(form.instructions || 'Computer Lab 3 attendance verification.')}</textarea>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-[#282828]/10 dark:border-[#25473C]">
          <button type="button" data-action="close-modal" class="px-3.5 py-2 rounded-lg border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold cursor-pointer">Cancel</button>
          <button type="submit" id="btn-submit-att-session" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs" ${isSavingSession ? 'disabled' : ''}>
            ${isSavingSession ? 'Scheduling...' : 'Create Lab Session'}
          </button>
        </div>
      </form>
    `;
  }

  if (modalType === 'review-attendance-reject' && attendanceReviewModalRecord) {
    title = 'Reject Attendance Submission';
    const rec = attendanceReviewModalRecord;
    body = `
      <form id="attendance-reject-form" class="space-y-4 text-xs text-[#282828] dark:text-white">
        <div class="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-200 flex items-start gap-3">
          <div class="p-2 rounded-lg bg-rose-600 text-white shrink-0">
            ${icon('XCircle', 'w-4 h-4')}
          </div>
          <div>
            <p class="font-bold text-xs">Submission Rejection Notice</p>
            <p class="text-[11px] opacity-85 mt-0.5">
              Rejecting this attendance verification will mark the record as <strong>Rejected</strong> and prompt the student with the official reason in their member dashboard.
            </p>
          </div>
        </div>

        <div class="p-3 rounded-lg bg-[#282828]/5 dark:bg-[#0A211A] space-y-1 font-mono text-[11px]">
          <div>Student: <strong>${escapeHtml(rec.studentName)}</strong> (${escapeHtml(rec.memberId)})</div>
          <div>Session: <strong>${escapeHtml(rec.sessionTitle)}</strong> (${escapeHtml(rec.date)})</div>
          <div>Submitted At: <strong>${escapeHtml(rec.submissionTimeEthiopian || '')}</strong></div>
        </div>

        <div>
          <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Reason for Rejection *</label>
          <textarea id="att-reject-reason" required rows="3" placeholder="e.g. Student not physically present in Computer Lab 3 during scheduled session..." class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-sans">${escapeHtml(attendanceRejectReason)}</textarea>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-[#282828]/10 dark:border-[#25473C]">
          <button type="button" data-action="close-modal" class="px-3.5 py-2 rounded-lg border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold cursor-pointer">Cancel</button>
          <button type="submit" id="btn-confirm-att-reject" class="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
            Confirm Rejection
          </button>
        </div>
      </form>
    `;
  }

  if (modalType === 'correct-attendance-record' && attendanceCorrectionRecord) {
    title = 'Override Attendance Classification';
    const rec = attendanceCorrectionRecord;
    body = `
      <form id="attendance-correct-form" class="space-y-4 text-xs text-[#282828] dark:text-white">
        <div class="p-3 rounded-lg bg-[#282828]/5 dark:bg-[#0A211A] space-y-1 font-mono text-[11px]">
          <div>Student: <strong>${escapeHtml(rec.studentName)}</strong> (${escapeHtml(rec.memberId)})</div>
          <div>Current Classification: <strong>${escapeHtml(rec.finalClassification || rec.status)}</strong></div>
          <div>Session: <strong>${escapeHtml(rec.sessionTitle)}</strong></div>
        </div>

        <div>
          <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">New Classification *</label>
          <select id="att-correct-class" required class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-bold">
            <option value="Present" ${attendanceCorrectionClass === 'Present' ? 'selected' : ''}>Present (Full Credit)</option>
            <option value="Late" ${attendanceCorrectionClass === 'Late' ? 'selected' : ''}>Late (Late Arrival)</option>
            <option value="Absent" ${attendanceCorrectionClass === 'Absent' ? 'selected' : ''}>Absent (No Attendance)</option>
          </select>
        </div>

        <div>
          <label class="block font-mono uppercase text-[10px] text-[#282828]/60 dark:text-white font-bold mb-1">Administrative Override Notes *</label>
          <textarea id="att-correct-notes" required rows="2" placeholder="e.g. Excused tardiness due to school competition..." class="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0C241C] border border-[#282828]/20 dark:border-[#25473C] text-xs font-sans">${escapeHtml(attendanceCorrectionNotes)}</textarea>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-[#282828]/10 dark:border-[#25473C]">
          <button type="button" data-action="close-modal" class="px-3.5 py-2 rounded-lg border border-[#282828]/20 dark:border-[#25473C] text-xs font-semibold cursor-pointer">Cancel</button>
          <button type="submit" id="btn-confirm-att-correct" class="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
            Save Override
          </button>
        </div>
      </form>
    `;
  }

  if (!body) return '';

  return `
    <div id="admin-modal-overlay" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" data-action="close-modal-overlay">
      <div class="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#F7EFE8] dark:bg-[#071A14] border border-[#282828]/15 dark:border-[#25473C] rounded-2xl shadow-2xl">
        <div class="flex items-center justify-between p-5 border-b border-[#282828]/10 dark:border-[#25473C] sticky top-0 bg-[#F7EFE8] dark:bg-[#071A14] z-10">
          <h2 class="text-base font-bold text-[#282828] dark:text-white font-sans">${title}</h2>
          <button data-action="close-modal" class="p-1.5 rounded-md hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] text-[#282828]/60 dark:text-white cursor-pointer">${icon('XCircle', 'w-4 h-4')}</button>
        </div>
        <div class="p-5">${body}</div>
      </div>
    </div>`;
}

function buildAnnouncementsTab() {
  const publishedCount = announcementsList.filter(a => a.isPublished !== false).length;
  const urgentCount = announcementsList.filter(a => a.priority === 'urgent' || a.priority === 'important').length;

  return `
    <div class="space-y-5">
      <!-- Top Actions Bar -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 class="text-base font-bold text-[#282828] dark:text-white flex items-center gap-2">
            ${icon('Bell', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]')}
            Club Announcements &amp; Broadcasts
          </h2>
          <p class="text-xs text-[#282828]/60 dark:text-white">
            Post official club updates, assignment notices, and broadcast alerts to member portal &amp; Telegram.
          </p>
        </div>
        ${btn(icon('Plus', 'w-3.5 h-3.5') + ' New Announcement', 'primary', 'sm', 'data-action="add-announcement"')}
      </div>

      <!-- Stats Overview -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="p-3.5 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C]">
          <span class="text-[10px] font-mono uppercase text-[#282828]/60 dark:text-white block">Total Announcements</span>
          <span class="text-xl font-extrabold text-[#282828] dark:text-white">${announcementsList.length}</span>
        </div>
        <div class="p-3.5 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C]">
          <span class="text-[10px] font-mono uppercase text-[#282828]/60 dark:text-white block">Published &amp; Active</span>
          <span class="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">${publishedCount}</span>
        </div>
        <div class="p-3.5 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C]">
          <span class="text-[10px] font-mono uppercase text-[#282828]/60 dark:text-white block">High Priority Notices</span>
          <span class="text-xl font-extrabold text-amber-600 dark:text-amber-400">${urgentCount}</span>
        </div>
      </div>

      <!-- Announcements Feed -->
      ${announcementsList.length === 0 ? `
        <div class="p-12 text-center bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl text-[#282828]/60 dark:text-white space-y-3">
          ${icon('Bell', 'w-10 h-10 mx-auto text-[#282828]/30 dark:text-white')}
          <p class="font-semibold text-sm">No announcements published yet.</p>
          <p class="text-xs max-w-sm mx-auto">Click "New Announcement" above to broadcast an update to all club members and the public site.</p>
          ${btn(icon('Plus', 'w-3.5 h-3.5') + ' Post First Announcement', 'primary', 'sm', 'data-action="add-announcement"')}
        </div>
      ` : `
        <div class="space-y-3">
          ${announcementsList.map(ann => {
            const isPub = ann.isPublished !== false;
            const priorityVariant = ann.priority === 'urgent' ? 'rose' : ann.priority === 'important' ? 'amber' : 'slate';
            return `
              <div class="p-4 bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-xl shadow-xs space-y-3">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#282828]/10 dark:border-[#25473C] pb-2.5">
                  <div class="flex flex-wrap items-center gap-2">
                    ${badge(ann.priority || 'Normal', priorityVariant)}
                    ${ann.category ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-[#282828]/5 dark:bg-[#15362B] text-[#282828]/70 dark:text-white">${escapeHtml(ann.category)}</span>` : ''}
                    ${badge(isPub ? 'Published' : 'Draft / Hidden', isPub ? 'emerald' : 'slate')}
                    <span class="text-[11px] font-mono text-[#282828]/50 dark:text-white">
                      ${escapeHtml(ann.publishedDate || (ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : ''))}
                    </span>
                    ${ann.author ? `<span class="text-[11px] text-[#282828]/60 dark:text-white">by <strong>${escapeHtml(ann.author)}</strong></span>` : ''}
                  </div>
                  <div class="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      data-action="toggle-announcement"
                      data-id="${ann.id}"
                      class="px-2.5 py-1 rounded text-xs font-mono font-medium border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#FAF4EE] dark:hover:bg-[#15362B] cursor-pointer">
                      ${isPub ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      data-action="del-announcement"
                      data-id="${ann.id}"
                      class="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-medium cursor-pointer border-0">
                      Delete
                    </button>
                  </div>
                </div>

                <div>
                  <h3 class="text-sm font-bold text-[#282828] dark:text-white font-sans">${escapeHtml(ann.title)}</h3>
                  <div class="text-xs text-[#282828]/80 dark:text-[#E2ECE8] leading-relaxed mt-1 whitespace-pre-wrap">${escapeHtml(ann.content)}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}

// ─── TAB: STUDENT PROJECT REVIEW ─────────────────────────────────────────────
function buildProjectReviewsTab() {
  const total = projectSubmissionsList.length;
  const pending = projectSubmissionsList.filter(s => s.status === 'pending').length;
  const approved = projectSubmissionsList.filter(s => s.status === 'approved').length;
  const needsRevision = projectSubmissionsList.filter(s => s.status === 'needs_revision').length;
  const rejected = projectSubmissionsList.filter(s => s.status === 'rejected').length;

  const statusBadge = (status) => {
    const map = {
      pending: ['amber', '⏳ Pending Review'],
      approved: ['emerald', '✅ Approved'],
      needs_revision: ['blue', '✏️ Needs Revision'],
      rejected: ['rose', '❌ Not Accepted']
    };
    const [color, label] = map[status] || ['slate', status];
    return badge(label, color);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return iso; }
  };

  return `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold text-[#282828] dark:text-white uppercase tracking-tight font-sans">Student Project Review</h2>
          <p class="text-xs font-mono text-[#282828]/60 dark:text-white mt-0.5">Projects submitted by students via the Telegram bot for faculty review.</p>
        </div>
        <button data-action="refresh-project-submissions"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#282828]/15 dark:border-[#25473C] bg-white dark:bg-[#102B22] hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] text-xs font-medium text-[#282828] dark:text-white transition-colors cursor-pointer">
          ${icon('RefreshCw', 'w-3.5 h-3.5 mr-1')} Refresh
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        ${[
          { label: 'Total Submitted', value: total, color: 'text-[#282828] dark:text-white', bg: 'bg-white dark:bg-[#102B22]', iconName: 'FolderGit2' },
          { label: 'Pending Review', value: pending, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', iconName: 'Clock' },
          { label: 'Approved', value: approved, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', iconName: 'CheckCircle' },
          { label: 'Needs Revision', value: needsRevision, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', iconName: 'Edit3' }
        ].map(c => `
          <div class="rounded-xl border border-[#282828]/10 dark:border-[#25473C] ${c.bg} p-4 flex flex-col gap-1">
            <div class="flex items-center gap-2 text-[#282828]/50 dark:text-white">
              ${icon(c.iconName, 'w-4 h-4')}
              <span class="text-[10px] font-mono uppercase tracking-wider">${c.label}</span>
            </div>
            <div class="text-2xl font-bold font-mono ${c.color}">${c.value}</div>
          </div>
        `).join('')}
      </div>

      <!-- Submissions Table -->
      <div class="rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] overflow-hidden">
        <div class="px-4 py-3 border-b border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between">
          <span class="text-xs font-mono font-semibold uppercase tracking-wider text-[#282828]/60 dark:text-white">
            ${icon('FolderGit2', 'w-3.5 h-3.5 inline mr-1')} Submitted Projects (${total})
          </span>
          ${pending > 0 ? `<span class="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">${pending} awaiting review</span>` : ''}
        </div>

        ${total === 0 ? `
          <div class="py-16 text-center">
            ${icon('InboxIcon', 'w-10 h-10 mx-auto text-[#282828]/20 dark:text-[#294B40] mb-3')}
            <p class="text-sm text-[#282828]/50 dark:text-white font-mono">No project submissions yet.</p>
            <p class="text-xs text-[#282828]/40 dark:text-white mt-1">Students can submit projects via the Telegram bot using <code class="bg-[#282828]/10 dark:bg-[#294B40] px-1 rounded">/submitproject</code></p>
          </div>
        ` : `
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="bg-[#282828]/5 dark:bg-[#0C241C]">
                <tr>
                  ${['Student', 'Class', 'Project Title', 'File', 'Submitted', 'Status', 'Actions'].map(h =>
                    `<th class="text-left px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#282828]/50 dark:text-white">${h}</th>`
                  ).join('')}
                </tr>
              </thead>
              <tbody class="divide-y divide-[#282828]/5 dark:divide-[#25473C]">
                ${projectSubmissionsList.map(s => `
                  <tr class="hover:bg-[#282828]/3 dark:hover:bg-[#0C241C]/50 transition-colors">
                    <td class="px-3 py-2.5">
                      <div class="font-semibold text-[#282828] dark:text-white">${escapeHtml(s.studentName)}</div>
                      <div class="font-mono text-[10px] text-[#282828]/50 dark:text-white">${escapeHtml(s.memberId)}</div>
                      ${s.telegramUsername ? `<div class="font-mono text-[10px] text-sky-600 dark:text-sky-400">${escapeHtml(s.telegramUsername)}</div>` : ''}
                    </td>
                    <td class="px-3 py-2.5 font-mono text-[#282828]/70 dark:text-white">${escapeHtml(s.class || '—')}</td>
                    <td class="px-3 py-2.5 max-w-[180px]">
                      <div class="font-semibold text-[#282828] dark:text-white truncate" title="${escapeHtml(s.title)}">${escapeHtml(s.title)}</div>
                      ${s.description ? `<div class="text-[10px] text-[#282828]/50 dark:text-white truncate max-w-[160px]" title="${escapeHtml(s.description)}">${escapeHtml(s.description)}</div>` : ''}
                      ${s.track ? `<div class="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">${escapeHtml(s.track)}</div>` : ''}
                    </td>
                    <td class="px-3 py-2.5">
                      <div class="font-mono text-[#282828]/70 dark:text-white truncate max-w-[120px]" title="${escapeHtml(s.fileName)}">${escapeHtml(s.fileName)}</div>
                      <div class="text-[10px] text-[#282828]/40 dark:text-white">${formatBytes(s.fileSize)}</div>
                    </td>
                    <td class="px-3 py-2.5 font-mono text-[10px] text-[#282828]/50 dark:text-white whitespace-nowrap">${formatDate(s.submittedAt)}</td>
                    <td class="px-3 py-2.5">
                      ${statusBadge(s.status)}
                      ${s.reviewNotes ? `<div class="text-[10px] text-[#282828]/50 dark:text-white mt-0.5 truncate max-w-[100px]" title="${escapeHtml(s.reviewNotes)}">Note: ${escapeHtml(s.reviewNotes)}</div>` : ''}
                    </td>
                    <td class="px-3 py-2.5">
                      <div class="flex items-center gap-1">
                        <button data-action="review-submission" data-sub-id="${escapeHtml(s.id)}" data-sub-title="${escapeHtml(s.title)}" data-sub-status="${escapeHtml(s.status)}" data-sub-notes="${escapeHtml(s.reviewNotes || '')}"
                          class="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-semibold bg-[#FC6454]/10 hover:bg-[#FC6454]/20 text-[#FC6454] dark:text-[#e8574a] border border-[#FC6454]/20 transition-colors cursor-pointer">
                          ${icon('ClipboardCheck', 'w-3 h-3')} Review
                        </button>
                        ${s.storagePath ? `
                          <button data-action="download-submission" data-sub-id="${escapeHtml(s.id)}"
                            class="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-semibold bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 transition-colors cursor-pointer">
                            ${icon('Download', 'w-3 h-3')} File
                          </button>
                        ` : ''}
                        <button data-action="delete-submission" data-sub-id="${escapeHtml(s.id)}" data-sub-title="${escapeHtml(s.title)}"
                          class="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-semibold bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 transition-colors cursor-pointer">
                          ${icon('Trash2', 'w-3 h-3')}
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Telegram Bot Submission Info -->
      <div class="rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-4">
        <div class="flex items-start gap-3">
          ${icon('Send', 'w-4 h-4 text-sky-500 shrink-0 mt-0.5')}
          <div>
            <h3 class="text-xs font-semibold text-[#282828] dark:text-white mb-1">How Students Submit Projects</h3>
            <p class="text-xs text-[#282828]/60 dark:text-white leading-relaxed">
              Students send their project files (ZIP, PDF, code files, documents) directly to the ARX Telegram bot.
              The bot automatically transfers the file to this review panel with status <code class="bg-[#282828]/10 dark:bg-[#294B40] px-1 rounded font-mono">pending</code>.
              After review, the student is automatically notified on Telegram with your feedback.
            </p>
            <div class="mt-2 flex items-center gap-2">
              <span class="text-[10px] font-mono text-[#282828]/50 dark:text-white">Bot command:</span>
              <code class="text-[10px] bg-[#282828]/10 dark:bg-[#294B40] px-1.5 py-0.5 rounded font-mono text-sky-600 dark:text-sky-400">/submitproject</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ─── TAB: TEAM & LEADERSHIP ────────────────────────────────────────────────
function buildTeamTab() {
  const sortedTeam = [...teamList].sort((a, b) => (a.order || 99) - (b.order || 99));
  const total = sortedTeam.length;
  const leadershipCount = sortedTeam.filter(m => (
    m.category === 'leadership' || 
    m.role === 'President' || 
    m.role === 'Vice President' || 
    m.role === 'Chief Marketing Officer' ||
    (m.role && (m.role.includes('CTO') || m.role.includes('Chief Technology Officer'))) ||
    m.name === 'Natan Yonas'
  )).length;
  const instructorCount = sortedTeam.filter(m => (!['leadership'].includes(m.category) && !['President', 'Vice President', 'Chief Marketing Officer'].includes(m.role) && !m.role?.includes('CTO') && m.name !== 'Natan Yonas')).length;

  const filteredTeam = sortedTeam.filter(m => {
    if (teamFilterCategory === 'leadership') {
      return m.category === 'leadership' || 
        ['President', 'Vice President', 'Chief Marketing Officer'].includes(m.role) ||
        (m.role && (m.role.includes('CTO') || m.role.includes('Chief Technology Officer'))) ||
        m.name === 'Natan Yonas';
    }
    if (teamFilterCategory === 'instructor') {
      return !['leadership'].includes(m.category) && 
        !['President', 'Vice President', 'Chief Marketing Officer'].includes(m.role) &&
        !m.role?.includes('CTO') &&
        m.name !== 'Natan Yonas';
    }
    return true;
  });

  const categoryBadge = (cat, role) => {
    if (cat === 'leadership' || ['President', 'Vice President', 'Chief Marketing Officer'].includes(role) || (role && (role.includes('CTO') || role.includes('Chief Technology Officer')))) {
      return badge('Leadership', 'amber');
    }
    return badge('Instructor', 'emerald');
  };

  return `
    <div class="space-y-6">
      <!-- Top Action Bar -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 class="text-lg font-bold text-[#282828] dark:text-white uppercase tracking-tight font-sans flex items-center gap-2">
            ${icon('Shield', 'w-5 h-5 text-[#FC6454] dark:text-[#6BB89E]')}
            Team Structure &amp; Governance
          </h2>
          <p class="text-xs text-[#282828]/60 dark:text-white mt-0.5">
            Authoritative club leadership hierarchy, faculty instructors, role uniqueness constraints, and public display sorting.
          </p>
        </div>
        <div class="flex items-center gap-2 self-stretch sm:self-auto">
          <button data-action="transfer-team-role" class="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
            ${icon('RefreshCw', 'w-3.5 h-3.5')} Transfer Role
          </button>
          <button data-action="add-team-member" class="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#FC6454] hover:bg-[#e04d3e] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] text-white transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
            ${icon('Plus', 'w-3.5 h-3.5')} Add Member
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="p-3.5 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C]">
          <span class="text-[10px] font-mono uppercase text-[#282828]/60 dark:text-[#A2C0B6] block">Total Roster</span>
          <span class="text-xl font-extrabold text-[#282828] dark:text-white font-mono">${total}</span>
        </div>
        <div class="p-3.5 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C]">
          <span class="text-[10px] font-mono uppercase text-[#282828]/60 dark:text-[#A2C0B6] block">Primary Leadership</span>
          <span class="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">${leadershipCount}</span>
        </div>
        <div class="p-3.5 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C]">
          <span class="text-[10px] font-mono uppercase text-[#282828]/60 dark:text-[#A2C0B6] block">Core Instructors</span>
          <span class="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">${instructorCount}</span>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-1.5 p-1 bg-white/50 dark:bg-[#102B22]/50 border border-[#282828]/10 dark:border-[#25473C] rounded-xl overflow-x-auto">
        ${[
          { id: 'all', label: `All (${total})` },
          { id: 'leadership', label: `Leadership (${leadershipCount})` },
          { id: 'instructor', label: `Instructors (${instructorCount})` }
        ].map(cat => `
          <button data-action="filter-team-category" data-category="${cat.id}" class="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer shrink-0 ${
            teamFilterCategory === cat.id
              ? 'bg-[#FC6454] text-white dark:bg-[#2F8068] shadow-xs'
              : 'text-[#282828]/70 dark:text-white hover:bg-[#282828]/5 dark:hover:bg-[#15362B]'
          }">
            ${cat.label}
          </button>
        `).join('')}
      </div>

      <!-- Team Members Roster -->
      <div class="rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] overflow-hidden shadow-xs">
        ${filteredTeam.length === 0 ? `
          <div class="py-16 text-center text-[#282828]/50 dark:text-white">
            ${icon('Users', 'w-10 h-10 mx-auto opacity-30 mb-2')}
            <p class="text-sm font-semibold">No team members match this category.</p>
          </div>
        ` : `
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="bg-[#282828]/5 dark:bg-[#0C241C] border-b border-[#282828]/10 dark:border-[#25473C]">
                <tr>
                  <th class="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-wider text-[#282828]/50 dark:text-white w-12"># Order</th>
                  <th class="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-wider text-[#282828]/50 dark:text-white">Member &amp; Portrait</th>
                  <th class="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-wider text-[#282828]/50 dark:text-white">Executive Role / Title</th>
                  <th class="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-wider text-[#282828]/50 dark:text-white">Department</th>
                  <th class="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-wider text-[#282828]/50 dark:text-white">Tier</th>
                  <th class="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-wider text-[#282828]/50 dark:text-white">Visibility</th>
                  <th class="px-3 py-2.5 text-right text-[10px] font-mono uppercase tracking-wider text-[#282828]/50 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#282828]/5 dark:divide-[#25473C]">
                ${filteredTeam.map((m, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === filteredTeam.length - 1;
                  const isPub = m.isPublished !== false;
                  return `
                    <tr class="hover:bg-[#282828]/3 dark:hover:bg-[#0C241C]/50 transition-colors">
                      <td class="px-3 py-3 font-mono font-bold text-xs text-[#282828]/60 dark:text-white">
                        <div class="flex items-center gap-1">
                          <span class="w-6 text-center font-bold text-[#FC6454] dark:text-[#6BB89E]">${m.order || (idx + 1)}</span>
                          <div class="flex flex-col">
                            <button data-action="reorder-team-up" data-id="${m.id}" class="text-[#282828]/40 dark:text-white hover:text-[#FC6454] dark:hover:text-[#6BB89E] cursor-pointer p-0.5 leading-none ${isFirst ? 'opacity-20 cursor-not-allowed' : ''}" ${isFirst ? 'disabled' : ''} title="Move Up">
                              ▲
                            </button>
                            <button data-action="reorder-team-down" data-id="${m.id}" class="text-[#282828]/40 dark:text-white hover:text-[#FC6454] dark:hover:text-[#6BB89E] cursor-pointer p-0.5 leading-none ${isLast ? 'opacity-20 cursor-not-allowed' : ''}" ${isLast ? 'disabled' : ''} title="Move Down">
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>
                      <td class="px-3 py-3">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-full overflow-hidden bg-[#FAF4EE] dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] shrink-0">
                            <img src="${escapeHtml(m.photoUrl || '/uploads/student-leadership.svg')}" alt="${escapeHtml(m.name)}" style="object-position: ${m.positionOffset || 'center 20%'};" class="w-full h-full object-cover" onerror="this.src='/uploads/student-leadership.svg'" />
                          </div>
                          <div>
                            <div class="font-bold text-xs text-[#282828] dark:text-white flex items-center gap-1.5">
                              <span>${escapeHtml(m.name)}</span>
                              ${m.isUniqueRole ? `<span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">UNIQUE</span>` : ''}
                            </div>
                            <div class="text-[10px] text-[#282828]/50 dark:text-white font-mono truncate max-w-xs">
                              ${escapeHtml(m.description || 'No biography entered.')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-3 py-3 font-semibold text-xs text-[#282828] dark:text-white">
                        ${escapeHtml(m.role)}
                      </td>
                      <td class="px-3 py-3 font-mono text-[11px] text-[#282828]/70 dark:text-white">
                        ${escapeHtml(m.specialty || m.department || '—')}
                      </td>
                      <td class="px-3 py-3">
                        ${categoryBadge(m.category, m.role)}
                      </td>
                      <td class="px-3 py-3">
                        <button data-action="toggle-team-publish" data-id="${m.id}" data-pub="${isPub}" class="cursor-pointer">
                          ${badge(isPub ? 'Published' : 'Hidden', isPub ? 'emerald' : 'slate')}
                        </button>
                      </td>
                      <td class="px-3 py-3 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                          <button data-action="edit-team-member" data-id="${m.id}" class="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-[#282828]/5 hover:bg-[#282828]/10 dark:bg-[#15362B] dark:hover:bg-[#1C4436] text-[#282828] dark:text-white transition-colors cursor-pointer">
                            Edit
                          </button>
                          <button data-action="delete-team-member" data-id="${m.id}" data-name="${escapeHtml(m.name)}" class="px-2.5 py-1 rounded text-xs font-mono font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60 transition-colors cursor-pointer">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </div>
  `;
}

// ─── TAB: LAB ATTENDANCE MANAGEMENT ──────────────────────────────────────────
function buildAttendanceTab() {
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
      isOnTime: (h === 13 && m < 30),
      isLate: (h === 13 && m >= 30 && m < 40),
      isPastDeadline: (h > 13 || (h === 13 && m >= 40))
    };
  })();

  const pendingReviews = attendanceRecordsList.filter(r => r.reviewStatus === 'Pending');
  const presentCount = attendanceRecordsList.filter(r => (r.finalClassification || r.status) === 'Present').length;
  const lateCount = attendanceRecordsList.filter(r => (r.finalClassification || r.status) === 'Late').length;
  const absentCount = attendanceRecordsList.filter(r => (r.finalClassification || r.status) === 'Absent').length;

  return `
    <div class="space-y-6">
      <!-- Live Ethiopian Clock & System Schedule Banner -->
      <div class="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 shadow-xs relative overflow-hidden">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="space-y-1.5 max-w-2xl">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                <span class="w-1.5 h-1.5 rounded-full ${clock.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}"></span>
                ${clock.isOpen ? 'ACTIVE SUBMISSION WINDOW OPEN' : 'SESSION WINDOW CLOSED'}
              </span>
              <span class="text-[11px] font-mono text-[#282828]/60 dark:text-white">
                Timezone: Africa/Addis_Ababa (UTC+3)
              </span>
            </div>
            <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-[#282828] dark:text-white font-sans">
              Computer Lab 3 Attendance Operations
            </h2>
            <p class="text-xs text-[#282828]/70 dark:text-white leading-relaxed">
              Official Ethiopian clock-bound attendance desk. Student check-in opens at <strong>7:00 Afternoon</strong> (1:00 PM EAT), transitions to Late at <strong>7:30</strong> (1:30 PM), and strictly closes at <strong>7:40</strong> (1:40 PM). Absences may only be finalized post-deadline.
            </p>
          </div>

          <!-- Live Clock Readout Tile -->
          <div class="p-4 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] shadow-xs text-right min-w-[220px] shrink-0 space-y-1">
            <div class="text-[10px] font-mono uppercase tracking-wider text-[#282828]/50 dark:text-white">Addis Ababa Clock</div>
            <div class="text-xl font-black font-mono text-emerald-600 dark:text-[#58B889]">
              ${escapeHtml(clock.ethiopianStr)}
            </div>
            <div class="text-[11px] font-mono text-[#282828]/60 dark:text-white">
              ${escapeHtml(clock.internationalStr)}
            </div>
            <div class="text-[10px] font-mono text-[#282828]/40 dark:text-white">
              ${escapeHtml(clock.dateStr)}
            </div>
          </div>
        </div>

        <!-- Metric Summary Chips -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-emerald-500/20">
          <div class="p-3 rounded-lg bg-white/60 dark:bg-[#0A211A]/80 border border-[#282828]/10 dark:border-[#25473C]">
            <span class="text-[10px] font-mono uppercase text-[#282828]/60 dark:text-white block">Configured Sessions</span>
            <span class="text-lg font-bold font-mono text-[#282828] dark:text-white">${attendanceSessionsList.length}</span>
          </div>
          <div class="p-3 rounded-lg bg-white/60 dark:bg-[#0A211A]/80 border border-[#282828]/10 dark:border-[#25473C]">
            <span class="text-[10px] font-mono uppercase text-[#282828]/60 dark:text-white block">Pending Review</span>
            <span class="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">${pendingReviews.length}</span>
          </div>
          <div class="p-3 rounded-lg bg-white/60 dark:bg-[#0A211A]/80 border border-[#282828]/10 dark:border-[#25473C]">
            <span class="text-[10px] font-mono uppercase text-[#282828]/60 dark:text-white block">Present / Late Submissions</span>
            <span class="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">${presentCount} <span class="text-xs text-amber-600">(${lateCount} late)</span></span>
          </div>
          <div class="p-3 rounded-lg bg-white/60 dark:bg-[#0A211A]/80 border border-[#282828]/10 dark:border-[#25473C]">
            <span class="text-[10px] font-mono uppercase text-[#282828]/60 dark:text-white block">Recorded Absences</span>
            <span class="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">${absentCount}</span>
          </div>
        </div>
      </div>

      <!-- Attendance Sub-Navigation Bar -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#282828]/10 dark:border-[#25473C] pb-3">
        <div class="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C]">
          <button data-action="switch-attendance-subtab" data-subtab="sessions"
            class="px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${attendanceSubTab === 'sessions' ? 'bg-[#FC6454] dark:bg-[#2F8068] text-white shadow-xs' : 'text-[#282828]/70 dark:text-white hover:bg-[#282828]/5 dark:hover:bg-[#15362B]'}">
            Sessions Manager (${attendanceSessionsList.length})
          </button>
          <button data-action="switch-attendance-subtab" data-subtab="review"
            class="px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${attendanceSubTab === 'review' ? 'bg-[#FC6454] dark:bg-[#2F8068] text-white shadow-xs' : 'text-[#282828]/70 dark:text-white hover:bg-[#282828]/5 dark:hover:bg-[#15362B]'}">
            <span>Review Queue</span>
            ${pendingReviews.length > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white">${pendingReviews.length}</span>` : ''}
          </button>
          <button data-action="switch-attendance-subtab" data-subtab="absences"
            class="px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${attendanceSubTab === 'absences' ? 'bg-[#FC6454] dark:bg-[#2F8068] text-white shadow-xs' : 'text-[#282828]/70 dark:text-white hover:bg-[#282828]/5 dark:hover:bg-[#15362B]'}">
            Absence Finalization
          </button>
          <button data-action="switch-attendance-subtab" data-subtab="records"
            class="px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${attendanceSubTab === 'records' ? 'bg-[#FC6454] dark:bg-[#2F8068] text-white shadow-xs' : 'text-[#282828]/70 dark:text-white hover:bg-[#282828]/5 dark:hover:bg-[#15362B]'}">
            Master Records (${attendanceRecordsList.length})
          </button>
        </div>

        <div class="flex items-center gap-2">
          ${btn(icon('Plus', 'w-3.5 h-3.5') + ' New Lab Session', 'primary', 'sm', 'data-action="add-attendance-session"')}
        </div>
      </div>

      <!-- Subtab Content Switching -->
      ${renderAttendanceSubTabContent(clock, pendingReviews)}
    </div>
  `;
}

function renderAttendanceSubTabContent(clock, pendingReviews) {
  if (attendanceSubTab === 'review') {
    return renderAttendanceReviewSubTab(pendingReviews);
  } else if (attendanceSubTab === 'absences') {
    return renderAttendanceAbsencesSubTab(clock);
  } else if (attendanceSubTab === 'records') {
    return renderAttendanceRecordsSubTab();
  }
  return renderAttendanceSessionsSubTab();
}

function renderAttendanceSessionsSubTab() {
  if (attendanceSessionsList.length === 0) {
    return `
      <div class="p-12 text-center bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-2xl text-[#282828]/60 dark:text-white space-y-3">
        ${icon('Clock', 'w-10 h-10 mx-auto text-[#282828]/30 dark:text-white')}
        <p class="font-semibold text-sm">No attendance sessions scheduled.</p>
        <p class="text-xs max-w-sm mx-auto">Click "New Lab Session" to schedule a course or general lab check-in window with Ethiopian clock boundaries.</p>
        ${btn(icon('Plus', 'w-3.5 h-3.5') + ' Create First Lab Session', 'primary', 'sm', 'data-action="add-attendance-session"')}
      </div>
    `;
  }

  return `
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${attendanceSessionsList.map(sess => {
          const stats = sess.stats || {
            totalSubmissions: 0,
            presentCount: 0,
            lateCount: 0,
            absentCount: 0,
            pendingReviewCount: 0,
            enrolledCount: 0,
            unsubmittedCount: 0
          };
          const isFinalized = sess.status === 'finalized';
          const isClosed = sess.status === 'closed';
          const statusVariant = isFinalized ? 'emerald' : isClosed ? 'slate' : 'blue';

          return `
            <div class="p-5 rounded-2xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] shadow-xs space-y-3 flex flex-col justify-between">
              <div class="space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FC6454]/10 dark:bg-[#2F8068]/20 text-[#FC6454] dark:text-[#6BB89E]">
                    ${escapeHtml(sess.courseTitle || 'General Lab')}
                  </span>
                  ${badge(sess.status ? sess.status.toUpperCase() : 'PUBLISHED', statusVariant)}
                </div>

                <h3 class="text-sm font-bold text-[#282828] dark:text-white font-sans">
                  ${escapeHtml(sess.title)}
                </h3>

                <div class="p-2.5 rounded-lg bg-[#282828]/5 dark:bg-[#0A211A] space-y-1 text-[11px] font-mono">
                  <div class="flex items-center justify-between text-[#282828]/70 dark:text-white">
                    <span>Date:</span>
                    <strong>${escapeHtml(sess.date)}</strong>
                  </div>
                  <div class="flex items-center justify-between text-[#282828]/70 dark:text-white">
                    <span>Ethiopian Schedule:</span>
                    <strong class="text-emerald-600 dark:text-emerald-400">${escapeHtml(sess.ethiopianOpenTime || '07:00')} – ${escapeHtml(sess.ethiopianLateCutoff || '07:40')}</strong>
                  </div>
                  <div class="flex items-center justify-between text-[#282828]/50 dark:text-white">
                    <span>International (EAT):</span>
                    <span>${escapeHtml(sess.internationalOpenTime || '13:00')} – ${escapeHtml(sess.internationalLateCutoff || '13:40')}</span>
                  </div>
                </div>

                <!-- Live Submissions Counters -->
                <div class="grid grid-cols-4 gap-1 text-center pt-1 font-mono text-[10px]">
                  <div class="p-1 rounded bg-[#282828]/5 dark:bg-[#15362B]">
                    <span class="block text-[#282828]/50 dark:text-white">Present</span>
                    <strong class="text-emerald-600">${stats.presentCount}</strong>
                  </div>
                  <div class="p-1 rounded bg-[#282828]/5 dark:bg-[#15362B]">
                    <span class="block text-[#282828]/50 dark:text-white">Late</span>
                    <strong class="text-amber-600">${stats.lateCount}</strong>
                  </div>
                  <div class="p-1 rounded bg-[#282828]/5 dark:bg-[#15362B]">
                    <span class="block text-[#282828]/50 dark:text-white">Absent</span>
                    <strong class="text-rose-600">${stats.absentCount}</strong>
                  </div>
                  <div class="p-1 rounded bg-[#282828]/5 dark:bg-[#15362B]">
                    <span class="block text-[#282828]/50 dark:text-white">Pending</span>
                    <strong class="${stats.pendingReviewCount > 0 ? 'text-amber-600 font-bold' : ''}">${stats.pendingReviewCount}</strong>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="pt-3 border-t border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between gap-2">
                <button
                  data-action="select-session-for-absences"
                  data-id="${sess.id}"
                  class="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#FAF4EE] dark:hover:bg-[#15362B] cursor-pointer text-[#282828] dark:text-white">
                  Finalize Absences
                </button>
                <div class="flex items-center gap-1.5">
                  <button
                    data-action="view-session-records"
                    data-id="${sess.id}"
                    class="p-1.5 rounded-md text-[#282828]/60 dark:text-white hover:bg-[#282828]/10 dark:hover:bg-[#15362B] cursor-pointer"
                    title="View Records">
                    ${icon('Users', 'w-4 h-4')}
                  </button>
                  <button
                    data-action="del-attendance-session"
                    data-id="${sess.id}"
                    data-title="${escapeHtml(sess.title)}"
                    class="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    title="Delete Session">
                    ${icon('Trash2', 'w-4 h-4')}
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderAttendanceReviewSubTab(pendingReviews) {
  if (pendingReviews.length === 0) {
    return `
      <div class="p-12 text-center bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-2xl text-[#282828]/60 dark:text-white space-y-3">
        ${icon('CheckCircle', 'w-10 h-10 mx-auto text-emerald-500')}
        <p class="font-semibold text-sm">Review queue is completely clear!</p>
        <p class="text-xs max-w-sm mx-auto">All submitted member check-ins have been reviewed and approved by staff officers.</p>
      </div>
    `;
  }

  return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-[#282828] dark:text-white font-sans">
            Pending Officer Review Queue (${pendingReviews.length})
          </h3>
          <p class="text-xs text-[#282828]/60 dark:text-white">
            Approve provisional submissions or reject invalid submissions with reason notes.
          </p>
        </div>
      </div>

      <div class="rounded-2xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] overflow-hidden shadow-xs">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#282828]/5 dark:bg-[#0A211A] border-b border-[#282828]/10 dark:border-[#25473C] font-mono text-[11px] text-[#282828]/70 dark:text-white">
              <tr>
                <th class="p-3">Student Name</th>
                <th class="p-3">Member ID</th>
                <th class="p-3">Class</th>
                <th class="p-3">Course / Session</th>
                <th class="p-3">Submitted At</th>
                <th class="p-3">Provisional Standing</th>
                <th class="p-3 text-right">Officer Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#282828]/5 dark:divide-[#25473C]">
              ${pendingReviews.map(r => {
                const isLate = (r.finalClassification || r.initialClassification) === 'Late';
                return `
                  <tr class="hover:bg-[#282828]/[0.02] dark:hover:bg-[#15362B]/50 transition-colors">
                    <td class="p-3 font-semibold text-[#282828] dark:text-white">
                      ${escapeHtml(r.studentName)}
                    </td>
                    <td class="p-3 font-mono font-bold text-[#FC6454] dark:text-[#6BB89E]">
                      ${escapeHtml(r.memberId)}
                    </td>
                    <td class="p-3 font-mono text-[11px] text-[#282828]/60 dark:text-white">
                      ${escapeHtml(r.studentClass || '—')}
                    </td>
                    <td class="p-3">
                      <div class="font-semibold text-xs">${escapeHtml(r.courseTitle || r.courseId)}</div>
                      <div class="text-[10px] text-[#282828]/50 dark:text-white font-mono">${escapeHtml(r.sessionTitle)}</div>
                    </td>
                    <td class="p-3 font-mono text-[11px]">
                      <div class="text-emerald-700 dark:text-emerald-400 font-semibold">${escapeHtml(r.submissionTimeEthiopian || '')}</div>
                      <div class="text-[10px] text-[#282828]/50 dark:text-white">${escapeHtml(r.submissionTimeInternational || '')}</div>
                    </td>
                    <td class="p-3">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isLate ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'}">
                        ${isLate ? '⏰ Provisional Late' : '✅ Provisional Present'}
                      </span>
                    </td>
                    <td class="p-3 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button
                          data-action="approve-attendance-record"
                          data-id="${r.id}"
                          class="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer border-0 shadow-xs inline-flex items-center gap-1">
                          ${icon('Check', 'w-3.5 h-3.5')} Approve
                        </button>
                        <button
                          data-action="open-reject-attendance-modal"
                          data-id="${r.id}"
                          class="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-300 dark:border-rose-900 cursor-pointer">
                          Reject...
                        </button>
                      </div>
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

function renderAttendanceAbsencesSubTab(clock) {
  const currentSession = attendanceSessionsList.find(s => s.id === selectedAbsenceSessionId) || attendanceSessionsList[0];

  return `
    <div class="space-y-5">
      <!-- Session Selection & Deadline Rules Header -->
      <div class="p-5 rounded-2xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-[#282828] dark:text-white font-sans">
              Controlled Absence Finalization
            </h3>
            <p class="text-xs text-[#282828]/60 dark:text-white">
              Strictly available only after the <strong>7:40 Ethiopian deadline</strong> (13:40 EAT). Identifies enrolled students who did not check in and idempotently registers verified absence records.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <select
              id="absence-session-select"
              data-action="change-absence-session"
              class="px-3 py-2 rounded-lg bg-[#282828]/5 dark:bg-[#0A211A] border border-[#282828]/15 dark:border-[#25473C] text-xs font-semibold text-[#282828] dark:text-white">
              ${attendanceSessionsList.map(s => `
                <option value="${s.id}" ${currentSession?.id === s.id ? 'selected' : ''}>
                  ${escapeHtml(s.title)} (${escapeHtml(s.date)}) — ${escapeHtml(s.courseTitle)}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        ${currentSession ? `
          <div class="p-4 rounded-xl ${clock.isPastDeadline || currentSession.date !== clock.dateStr ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'} border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p class="font-bold">Target Session: ${escapeHtml(currentSession.title)}</p>
              <p class="text-[11px] opacity-80 font-mono mt-0.5">
                Course: ${escapeHtml(currentSession.courseTitle)} • Date: ${escapeHtml(currentSession.date)} • Closing Deadline: ${escapeHtml(currentSession.ethiopianLateCutoff || '7:40')} Ethiopian
              </p>
            </div>
            <button
              data-action="finalize-session-absences"
              data-id="${currentSession.id}"
              class="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer border-0 shadow-xs inline-flex items-center gap-1.5 shrink-0">
              ${icon('AlertTriangle', 'w-4 h-4')} Finalize Absences for Enrolled Students
            </button>
          </div>
        ` : `
          <div class="p-6 text-center text-xs text-[#282828]/60 dark:text-white">No sessions available to finalize.</div>
        `}
      </div>

      <!-- Unsubmitted Enrolled Students Preview -->
      <div class="p-5 rounded-2xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold uppercase tracking-wider text-[#282828]/70 dark:text-white font-mono">
            Enrolled Students Awaiting Absence Finalization
          </h4>
          <span class="text-xs font-mono text-[#282828]/50 dark:text-white">
            ${unsubmittedMembersList.length} Students Pending Absent Record
          </span>
        </div>

        ${unsubmittedMembersList.length === 0 ? `
          <div class="p-8 text-center text-xs text-[#282828]/50 dark:text-white bg-[#282828]/5 dark:bg-[#0A211A] rounded-xl border border-dashed border-[#282828]/15 dark:border-[#25473C]">
            All enrolled students have submitted or absences are already finalized for this session.
          </div>
        ` : `
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            ${unsubmittedMembersList.map(m => `
              <div class="p-3 rounded-xl bg-[#282828]/5 dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <div class="font-bold text-xs text-[#282828] dark:text-white truncate">${escapeHtml(m.studentName)}</div>
                  <div class="font-mono text-[10px] text-[#FC6454] dark:text-[#6BB89E]">${escapeHtml(m.memberId)} • Class ${escapeHtml(m.class || 'N/A')}</div>
                </div>
                <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400">UNSUBMITTED</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

function renderAttendanceRecordsSubTab() {
  let records = [...attendanceRecordsList];

  if (attendanceFilter.courseId && attendanceFilter.courseId !== 'all') {
    records = records.filter(r => r.courseId === attendanceFilter.courseId);
  }
  if (attendanceFilter.classification && attendanceFilter.classification !== 'all') {
    records = records.filter(r => (r.finalClassification || r.status) === attendanceFilter.classification);
  }
  if (attendanceFilter.reviewStatus && attendanceFilter.reviewStatus !== 'all') {
    records = records.filter(r => r.reviewStatus === attendanceFilter.reviewStatus);
  }
  if (attendanceFilter.q) {
    const q = attendanceFilter.q.toLowerCase().trim();
    records = records.filter(r =>
      (r.studentName || '').toLowerCase().includes(q) ||
      (r.memberId || '').toLowerCase().includes(q) ||
      (r.sessionTitle || '').toLowerCase().includes(q)
    );
  }

  return `
    <div class="space-y-4">
      <!-- Master Filters Bar -->
      <div class="p-4 rounded-2xl bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="flex flex-wrap items-center gap-2">
          <!-- Course Filter -->
          <select id="att-filter-course" data-action="filter-att-change" class="px-3 py-1.5 rounded-lg bg-[#282828]/5 dark:bg-[#0A211A] border border-[#282828]/15 dark:border-[#25473C] text-xs font-semibold">
            <option value="all">All Courses</option>
            ${coursesList.map(c => `
              <option value="${c.id}" ${attendanceFilter.courseId === c.id ? 'selected' : ''}>${escapeHtml(c.title)}</option>
            `).join('')}
          </select>

          <!-- Classification Filter -->
          <select id="att-filter-class" data-action="filter-att-change" class="px-3 py-1.5 rounded-lg bg-[#282828]/5 dark:bg-[#0A211A] border border-[#282828]/15 dark:border-[#25473C] text-xs font-semibold">
            <option value="all" ${attendanceFilter.classification === 'all' ? 'selected' : ''}>All Standings</option>
            <option value="Present" ${attendanceFilter.classification === 'Present' ? 'selected' : ''}>Present</option>
            <option value="Late" ${attendanceFilter.classification === 'Late' ? 'selected' : ''}>Late</option>
            <option value="Absent" ${attendanceFilter.classification === 'Absent' ? 'selected' : ''}>Absent</option>
          </select>

          <!-- Review Status Filter -->
          <select id="att-filter-review" data-action="filter-att-change" class="px-3 py-1.5 rounded-lg bg-[#282828]/5 dark:bg-[#0A211A] border border-[#282828]/15 dark:border-[#25473C] text-xs font-semibold">
            <option value="all" ${attendanceFilter.reviewStatus === 'all' ? 'selected' : ''}>All Review States</option>
            <option value="Pending" ${attendanceFilter.reviewStatus === 'Pending' ? 'selected' : ''}>Pending Review</option>
            <option value="Approved" ${attendanceFilter.reviewStatus === 'Approved' ? 'selected' : ''}>Approved</option>
            <option value="Rejected" ${attendanceFilter.reviewStatus === 'Rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </div>

        <div class="w-full sm:w-64">
          <input
            id="att-search-input"
            type="text"
            placeholder="Search student or ID..."
            value="${escapeHtml(attendanceFilter.q || '')}"
            class="w-full px-3 py-1.5 rounded-lg bg-[#282828]/5 dark:bg-[#0A211A] border border-[#282828]/15 dark:border-[#25473C] text-xs font-mono" />
        </div>
      </div>

      <!-- Master Records Table -->
      <div class="rounded-2xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] overflow-hidden shadow-xs">
        <div class="overflow-x-auto max-h-[600px]">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#282828]/5 dark:bg-[#0A211A] border-b border-[#282828]/10 dark:border-[#25473C] font-mono text-[11px] text-[#282828]/70 dark:text-white sticky top-0 z-10">
              <tr>
                <th class="p-3">Student Name</th>
                <th class="p-3">Member ID</th>
                <th class="p-3">Session &amp; Course</th>
                <th class="p-3">Submission Timestamp</th>
                <th class="p-3">Final Standing</th>
                <th class="p-3">Review Status</th>
                <th class="p-3">Officer Review</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#282828]/5 dark:divide-[#25473C]">
              ${records.map(r => {
                const standing = r.finalClassification || r.status || 'Present';
                const standingVariant = standing === 'Present' ? 'emerald' : standing === 'Late' ? 'amber' : 'rose';
                const reviewVariant = r.reviewStatus === 'Approved' ? 'emerald' : r.reviewStatus === 'Rejected' ? 'rose' : 'amber';

                return `
                  <tr class="hover:bg-[#282828]/[0.02] dark:hover:bg-[#15362B]/50 transition-colors">
                    <td class="p-3 font-semibold text-[#282828] dark:text-white">
                      ${escapeHtml(r.studentName)}
                      <div class="text-[10px] font-mono text-[#282828]/50 dark:text-white">Class ${escapeHtml(r.studentClass || 'N/A')}</div>
                    </td>
                    <td class="p-3 font-mono font-bold text-[#FC6454] dark:text-[#6BB89E]">
                      ${escapeHtml(r.memberId)}
                    </td>
                    <td class="p-3">
                      <div class="font-semibold text-xs">${escapeHtml(r.sessionTitle || 'Lab Session')}</div>
                      <div class="text-[10px] text-[#282828]/50 dark:text-white font-mono">${escapeHtml(r.courseTitle || r.courseId)} • ${escapeHtml(r.date)}</div>
                    </td>
                    <td class="p-3 font-mono text-[11px]">
                      <div>${escapeHtml(r.submissionTimeEthiopian || 'N/A')}</div>
                      <div class="text-[10px] text-[#282828]/50 dark:text-white">${escapeHtml(r.submissionTimeInternational || '')}</div>
                    </td>
                    <td class="p-3">
                      ${badge(standing, standingVariant)}
                    </td>
                    <td class="p-3">
                      ${badge(r.reviewStatus || 'Pending', reviewVariant)}
                      ${r.rejectionReason ? `<div class="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 truncate max-w-xs" title="${escapeHtml(r.rejectionReason)}">${escapeHtml(r.rejectionReason)}</div>` : ''}
                    </td>
                    <td class="p-3 font-mono text-[10px] text-[#282828]/60 dark:text-white">
                      ${r.reviewedBy ? `${escapeHtml(r.reviewedBy)}` : '—'}
                    </td>
                    <td class="p-3 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button
                          data-action="open-correct-attendance-modal"
                          data-id="${r.id}"
                          class="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-[#282828]/5 hover:bg-[#282828]/10 dark:bg-[#15362B] dark:hover:bg-[#1C4436] text-[#282828] dark:text-white transition-colors cursor-pointer">
                          Override
                        </button>
                        <button
                          data-action="del-attendance-record"
                          data-id="${r.id}"
                          class="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded cursor-pointer"
                          title="Delete Record">
                          ${icon('Trash2', 'w-3.5 h-3.5')}
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
              ${records.length === 0 ? `
                <tr><td colspan="8" class="p-8 text-center text-xs text-[#282828]/50 dark:text-white">No attendance records found matching filters.</td></tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ─── MAIN BUILD ───────────────────────────────────────────────────────────────
function buildTabContent() {
  const map = {
    overview: buildOverviewTab,
    team: buildTeamTab,
    applications: buildApplicationsTab,
    'project-reviews': buildProjectReviewsTab,
    announcements: buildAnnouncementsTab,
    members: buildMembersTab,
    courses: buildCoursesTab,
    enrollments: buildEnrollmentsTab,
    attendance: buildAttendanceTab,
    projects: buildProjectsTab,
    events: buildEventsTab,
    certificates: buildCertificatesTab,
    awards: buildAwardsTab,
    achievements: buildAchievementsTab,
    media: buildMediaTab,
    settings: buildSettingsTab
  };
  return (map[activeTab] || buildOverviewTab)();
}

function buildDashboard() {
  const el = document.createElement('div');
  el.id = 'admin-dashboard-root';
  el.className = 'min-h-screen flex flex-col lg:flex-row bg-[#F7EFE8] dark:bg-[#071A14] text-[#282828] dark:text-white transition-colors duration-200';
  
  const pendingCount = applicationsList.filter(a => a.status === 'pending').length;
  const pendingSubmissionsCount = projectSubmissionsList.filter(s => s.status === 'pending').length;

  el.innerHTML = `
    <div id="admin-toast" style="display:none" class="fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-md shadow-xl flex items-center gap-2 text-xs font-mono uppercase tracking-wider border"></div>

    ${renderAdminSidebar(activeTab, pendingCount, pendingSubmissionsCount)}

    <main class="flex-1 p-4 sm:p-8 bg-[#F7EFE8] dark:bg-[#071A14] text-[#282828] dark:text-white overflow-y-auto">
      <div class="max-w-6xl mx-auto space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-[#282828] dark:text-white uppercase tracking-tight font-sans">
                ${activeTab === 'overview' ? 'Dashboard Overview' : activeTab.replace('-', ' ')}
              </h1>
              <span class="inline-flex items-center gap-1 rounded border font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60">Admin Role</span>
            </div>
            <p class="text-xs font-mono text-[#282828]/60 dark:text-white mt-1">Real-time club control, content management &amp; student records.</p>
          </div>
          <div class="flex items-center gap-2">
            <button data-action="toggle-theme"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#282828]/15 dark:border-[#25473C] bg-white dark:bg-[#102B22] hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] text-xs font-medium text-[#282828] dark:text-white transition-colors cursor-pointer">
              ${themeState.theme === 'dark'
                ? `${icon('Sun', 'w-3.5 h-3.5 text-[#6BB89E]')}<span>Light</span>`
                : `${icon('Moon', 'w-3.5 h-3.5')}<span>Dark</span>`}
            </button>
            <button data-action="refresh-data" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#282828]/15 dark:border-[#25473C] bg-white dark:bg-[#102B22] hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] text-xs font-medium text-[#282828] dark:text-white transition-colors cursor-pointer">
              ${icon('RefreshCw', 'w-3.5 h-3.5 mr-1')} Refresh
            </button>
          </div>
        </div>

        ${buildTabContent()}
      </div>
    </main>

    ${buildModal()}`;
  return el;
}

// ─── EVENT BINDING ────────────────────────────────────────────────────────────
function bindEvents() {
  const root = document.getElementById('admin-dashboard-root');
  if (!root) return;

  // Initialize sidebar events
  initAdminSidebarEvents((tab) => {
    activeTab = tab;
    if (tab === 'applications') loadApplications().then(() => reRender());
    reRender();
  });

  // Delegated action handler
  root.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const id = el.dataset.id;

    switch (action) {
      case 'toggle-theme':
        themeState.toggleTheme();
        reRender();
        break;

      case 'add-announcement':
        modalType = 'create-announcement';
        reRender();
        break;

      case 'save-announcement': {
        const titleEl = document.getElementById('ann-title');
        const contentEl = document.getElementById('ann-content');
        const priorityEl = document.getElementById('ann-priority');
        const categoryEl = document.getElementById('ann-category');
        const pubEl = document.getElementById('ann-publish');
        const tgEl = document.getElementById('ann-tg');

        const titleVal = titleEl?.value?.trim();
        const contentVal = contentEl?.value?.trim();

        if (!titleVal || !contentVal) {
          showToast('Title and content are required.', 'error');
          return;
        }

        try {
          const res = await api.createAdminAnnouncement({
            title: titleVal,
            content: contentVal,
            priority: priorityEl?.value || 'normal',
            category: categoryEl?.value || 'General',
            isPublished: pubEl ? pubEl.checked : true,
            broadcastTelegram: tgEl ? tgEl.checked : false
          });
          if (res?.announcement) {
            announcementsList.unshift(res.announcement);
            modalType = null;
            showToast(res.telegramBroadcast ? 'Announcement posted & broadcasted via Telegram Bot!' : 'Announcement published successfully!');
            reRender();
          }
        } catch (err) {
          showToast(err.message || 'Failed to post announcement', 'error');
        }
        break;
      }

      case 'toggle-announcement': {
        try {
          const res = await api.toggleAdminAnnouncement(id);
          if (res?.announcement) {
            const idx = announcementsList.findIndex(a => a.id === id);
            if (idx !== -1) announcementsList[idx] = res.announcement;
            showToast(`Announcement ${res.announcement.isPublished ? 'published' : 'unpublished'}.`);
            reRender();
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
        break;
      }

      case 'del-announcement': {
        if (!confirm('Are you sure you want to delete this announcement?')) return;
        try {
          await api.deleteAdminAnnouncement(id);
          announcementsList = announcementsList.filter(a => a.id !== id);
          showToast('Announcement deleted.');
          reRender();
        } catch (err) {
          showToast(err.message, 'error');
        }
        break;
      }

      case 'refresh-data':
        await loadAllAdminData();
        break;

      case 'switch-attendance-subtab': {
        const sub = el.dataset.subtab || 'sessions';
        attendanceSubTab = sub;
        if (sub === 'absences') {
          if (!selectedAbsenceSessionId && attendanceSessionsList.length > 0) {
            selectedAbsenceSessionId = attendanceSessionsList[0].id;
          }
          if (selectedAbsenceSessionId) {
            api.getAdminUnsubmittedAttendance(selectedAbsenceSessionId).then(res => {
              unsubmittedMembersList = res?.unsubmitted || [];
              reRender();
            }).catch(() => {});
          }
        }
        reRender();
        break;
      }

      case 'add-attendance-session': {
        sessionForm = {
          courseId: 'general',
          title: '',
          date: new Date().toISOString().split('T')[0],
          ethiopianOpenTime: '07:00',
          ethiopianPresentCutoff: '07:30',
          ethiopianLateCutoff: '07:40',
          instructions: 'Computer Lab 3 attendance verification.',
          status: 'published'
        };
        sessionError = null;
        modalType = 'create-attendance-session';
        reRender();
        break;
      }

      case 'del-attendance-session': {
        const title = el.dataset.title || 'this session';
        if (!confirm(`Are you sure you want to delete session "${title}" and all its records?`)) return;
        try {
          await api.deleteAdminAttendanceSession(id);
          attendanceSessionsList = attendanceSessionsList.filter(s => s.id !== id);
          attendanceRecordsList = attendanceRecordsList.filter(r => r.sessionId !== id);
          showToast('Attendance session deleted.');
          reRender();
        } catch (err) {
          showToast(err.message || 'Failed to delete session', 'error');
        }
        break;
      }

      case 'select-session-for-absences': {
        selectedAbsenceSessionId = id;
        attendanceSubTab = 'absences';
        try {
          const res = await api.getAdminUnsubmittedAttendance(id);
          unsubmittedMembersList = res?.unsubmitted || [];
        } catch {}
        reRender();
        break;
      }

      case 'change-absence-session': {
        const select = root.querySelector('#absence-session-select');
        if (select) {
          selectedAbsenceSessionId = select.value;
          try {
            const res = await api.getAdminUnsubmittedAttendance(selectedAbsenceSessionId);
            unsubmittedMembersList = res?.unsubmitted || [];
          } catch {}
          reRender();
        }
        break;
      }

      case 'finalize-session-absences': {
        const sessId = id || selectedAbsenceSessionId;
        if (!sessId) {
          showToast('No session selected for absence finalization.', 'error');
          return;
        }
        if (!confirm('Finalize absences for all enrolled students who have not checked in? Note: This requires the 7:40 Ethiopian deadline to have passed.')) return;
        try {
          const res = await api.finalizeAdminAttendanceAbsences(sessId);
          showToast(res?.message || 'Absences finalized successfully!');
          await loadAllAdminData();
          if (selectedAbsenceSessionId) {
            const unRes = await api.getAdminUnsubmittedAttendance(selectedAbsenceSessionId).catch(() => ({ unsubmitted: [] }));
            unsubmittedMembersList = unRes?.unsubmitted || [];
          }
          reRender();
        } catch (err) {
          showToast(err.message || 'Failed to finalize absences. Make sure the 7:40 deadline has passed.', 'error');
        }
        break;
      }

      case 'approve-attendance-record': {
        try {
          const res = await api.reviewAdminAttendanceRecord(id, { reviewStatus: 'Approved' });
          if (res?.record) {
            const idx = attendanceRecordsList.findIndex(r => r.id === id);
            if (idx !== -1) attendanceRecordsList[idx] = res.record;
            showToast(`Approved attendance for ${res.record.studentName}`);
            reRender();
          }
        } catch (err) {
          showToast(err.message || 'Failed to approve attendance', 'error');
        }
        break;
      }

      case 'open-reject-attendance-modal': {
        const rec = attendanceRecordsList.find(r => r.id === id);
        if (rec) {
          attendanceReviewModalRecord = rec;
          attendanceRejectReason = '';
          modalType = 'review-attendance-reject';
          reRender();
        }
        break;
      }

      case 'open-correct-attendance-modal': {
        const rec = attendanceRecordsList.find(r => r.id === id);
        if (rec) {
          attendanceCorrectionRecord = rec;
          attendanceCorrectionClass = rec.finalClassification || rec.status || 'Present';
          attendanceCorrectionNotes = '';
          modalType = 'correct-attendance-record';
          reRender();
        }
        break;
      }

      case 'del-attendance-record': {
        if (!confirm('Are you sure you want to delete this attendance record?')) return;
        try {
          await api.deleteAdminAttendanceRecord(id);
          attendanceRecordsList = attendanceRecordsList.filter(r => r.id !== id);
          showToast('Attendance record deleted.');
          reRender();
        } catch (err) {
          showToast(err.message || 'Failed to delete record', 'error');
        }
        break;
      }

      case 'view-session-records': {
        attendanceFilter.courseId = 'all';
        attendanceSubTab = 'records';
        const sess = attendanceSessionsList.find(s => s.id === id);
        if (sess) {
          attendanceFilter.q = sess.title;
        }
        reRender();
        break;
      }

      case 'filter-att-change': {
        const cEl = root.querySelector('#att-filter-course');
        const stEl = root.querySelector('#att-filter-class');
        const revEl = root.querySelector('#att-filter-review');
        if (cEl) attendanceFilter.courseId = cEl.value;
        if (stEl) attendanceFilter.classification = stEl.value;
        if (revEl) attendanceFilter.reviewStatus = revEl.value;
        reRender();
        break;
      }

      case 'refresh-project-submissions': {
        try {
          const psRes = await api.getAdminProjectSubmissions?.();
          if (psRes?.submissions) projectSubmissionsList = psRes.submissions;
          reRender();
          showToast('Project submissions refreshed.');
        } catch (err) {
          showToast(err.message || 'Failed to refresh submissions.', 'error');
        }
        break;
      }

      case 'review-submission': {
        const subId = el.getAttribute('data-sub-id');
        const sub = projectSubmissionsList.find(s => s.id === subId);
        if (sub) {
          activeItem = sub;
          modalType = 'reviewSubmission';
          reRender();
        }
        break;
      }

      case 'download-submission': {
        const dSubId = el.getAttribute('data-sub-id');
        if (dSubId) {
          const link = document.createElement('a');
          link.href = `/api/admin/project-submissions/${encodeURIComponent(dSubId)}/download`;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        break;
      }

      case 'delete-submission': {
        const dSubId = el.getAttribute('data-sub-id');
        const dSubTitle = el.getAttribute('data-sub-title');
        if (dSubId && confirm(`Permanently delete project submission "${dSubTitle || dSubId}"? This cannot be undone.`)) {
          try {
            await api.deleteAdminProjectSubmission(dSubId);
            projectSubmissionsList = projectSubmissionsList.filter(s => s.id !== dSubId);
            reRender();
            showToast('Project submission deleted.');
          } catch (err) {
            showToast(err.message || 'Failed to delete submission.', 'error');
          }
        }
        break;
      }

      case 'refresh-telegram':
        await Promise.all([loadTelegramBotData(), loadWebhookInfo()]);
        reRender();
        break;

      case 'go-applications':
        activeTab = 'applications';
        await loadApplications();
        reRender();
        break;

      case 'reg-open':
        try {
          const r = await api.setRegistrationStatus('OPEN', settings.registrationClosedMessage);
          if (r?.settings) settings = { ...settings, ...r.settings };
          reRender();
          showToast('Registration opened!');
        } catch (err) {
          showToast(err.message, 'error');
        }
        break;

      case 'reg-close':
        try {
          const r = await api.setRegistrationStatus('CLOSED', settings.registrationClosedMessage);
          if (r?.settings) settings = { ...settings, ...r.settings };
          reRender();
          showToast('Registration closed!');
        } catch (err) {
          showToast(err.message, 'error');
        }
        break;

      case 'filter-apps':
        appFilterStatus = el.dataset.filter || 'all';
        reRender();
        break;

      case 'refresh-apps':
        await loadApplications();
        reRender();
        break;

      case 'view-app': {
        const app = applicationsList.find(x => x.id === id);
        if (app) {
          selectedApplicationDetail = app;
          modalType = 'appDetail';
          reRender();
        }
        break;
      }

      case 'approve-app':
        try {
          await api.approveAdminApplication(id);
          showToast('Application approved!');
          applicationsList = applicationsList.map(a => a.id === id ? { ...a, status: 'approved' } : a);
          if (selectedApplicationDetail && selectedApplicationDetail.id === id) {
            selectedApplicationDetail = { ...selectedApplicationDetail, status: 'approved' };
          }
          reRender();
        } catch (err) {
          showToast(err.message, 'error');
        }
        break;

      case 'reject-app': {
        const reason = prompt('Rejection reason (optional):');
        if (reason === null) break;
        try {
          await api.rejectAdminApplication(id, reason || 'Application rejected by admin.');
          showToast('Application rejected.');
          applicationsList = applicationsList.map(a => a.id === id ? { ...a, status: 'rejected', rejectionReason: reason || 'Application rejected by admin.' } : a);
          if (selectedApplicationDetail && selectedApplicationDetail.id === id) {
            selectedApplicationDetail = { ...selectedApplicationDetail, status: 'rejected', rejectionReason: reason || 'Application rejected by admin.' };
          }
          await loadAllAdminData();
          reRender();
        } catch (err) {
          showToast(err.message, 'error');
        }
        break;
      }

      case 'del-app':
        if (!confirm('Are you sure you want to permanently delete this application record? This cannot be undone.')) return;
        try {
          await api.deleteAdminApplication(id);
          showToast('Application permanently deleted.');
          applicationsList = applicationsList.filter(a => a.id !== id);
          if (selectedApplicationDetail && selectedApplicationDetail.id === id) {
            selectedApplicationDetail = null;
            modalType = null;
          }
          await loadAllAdminData();
          reRender();
        } catch (err) {
          showToast(err.message || 'Failed to delete application', 'error');
        }
        break;

      case 'export-csv': {
        if (membersList.length === 0) {
          showToast('No members to export.', 'error');
          return;
        }
        const headers = ['Member ID','Student Name','Class','Phone','Telegram','Role','Status','Registered At'];
        const rows = membersList.map(m => [m.memberId, `"${(m.studentName || '').replace(/"/g,'""')}"`, m.class, m.phoneNumber, m.telegramUsername, m.role, m.status, m.createdAt]);
        const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const a = document.createElement('a');
        a.href = encodeURI(csv);
        a.download = `it_club_members_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('Member roster exported successfully!');
        break;
      }

      case 'view-member':
        try {
          const r = await api.getAdminMemberDetail(id);
          selectedMemberDetail = r;
          modalType = 'memberDetail';
          reRender();
        } catch (err) {
          showToast(err.message || 'Failed to load member profile', 'error');
        }
        break;

      case 'edit-member': {
        const m = membersList.find(x => x.id === id);
        if (!m) return;
        editMemberForm = {
          studentName: m.studentName,
          class: m.class,
          phoneNumber: m.phoneNumber,
          telegramUsername: m.telegramUsername,
          award: m.award || ''
        };
        activeItem = m;
        modalType = 'editMember';
        reRender();
        break;
      }

      case 'reset-pw': {
        const m = membersList.find(x => x.id === id);
        if (!m) return;
        resetPasswordMember = m;
        newPasswordInput = '';
        modalType = 'resetMemberPassword';
        reRender();
        break;
      }

      case 'toggle-member':
        try {
          await api.toggleAdminMemberStatus(id);
          showToast('Member status changed.');
          await loadAllAdminData();
        } catch (err) {
          showToast(err.message, 'error');
        }
        break;

      case 'del-member':
        if (!confirm('Delete this member permanently? This cannot be undone.')) return;
        try {
          await api.deleteAdminMember(id);
          showToast('Member account deleted.');
          membersList = membersList.filter(m => m.id !== id);
          await loadAllAdminData();
          reRender();
        } catch (err) {
          showToast(err.message, 'error');
        }
        break;

      case 'complete-enrollment':
        try {
          await api.updateAdminEnrollment(id, { progress: 100, status: 'Completed' });
          showToast('Marked 100% completed.');
          await loadAllAdminData();
        } catch (err) {
          showToast(err.message, 'error');
        }
        break;

      case 'delete-enrollment': {
        const studentName = el.dataset.name || 'this student';
        const courseName = el.dataset.course || 'this course';
        if (!confirm(`Are you sure you want to remove ${studentName} from "${courseName}"? This will permanently delete their enrollment record.`)) return;
        try {
          await api.deleteAdminEnrollment(id);
          showToast(`Enrollment for ${studentName} removed.`);
          enrollmentsList = enrollmentsList.filter(e => e.id !== id);
          reRender();
        } catch (err) {
          showToast(err.message || 'Failed to remove enrollment', 'error');
        }
        break;
      }

      case 'add-course':
        activeItem = null;
        courseError = null;
        courseForm = {
          title: '',
          description: '',
          longDescription: '',
          category: 'Web Development',
          difficulty: 'Beginner',
          duration: '4 weeks',
          instructor: 'IT Club Instructor',
          status: 'Available',
          topics: ['Introduction to Core Concepts', 'Hands-on Practice'],
          learningObjectives: ['Build functional projects'],
          requirements: ['Curiosity to learn'],
          certificateInfo: 'Verified Certificate awarded upon completion.',
          thumbnailUrl: '',
          bannerUrl: '',
          thumbnailMediaId: '',
          bannerMediaId: '',
          isPublished: true,
          isAvailableForRegistration: true
        };
        modalType = 'course';
        reRender();
        break;

      case 'edit-course': {
        const c = coursesList.find(x => x.id === id);
        if (!c) return;
        activeItem = c;
        courseError = null;
        courseForm = { ...c };
        modalType = 'course';
        reRender();
        break;
      }

      case 'del-course':
        if (!confirm('Delete this course?')) return;
        try {
          await api.deleteAdminCourse(id);
          showToast('Course deleted.');
          coursesList = coursesList.filter(c => c.id !== id);
          reRender();
        } catch (err) {
          showToast(err.message, 'error');
        }
        break;

      case 'toggle-course-reg': {
        const c = coursesList.find(x => x.id === id);
        if (!c) return;
        const newAvail = !(c.isAvailableForRegistration !== false);
        try {
          await api.updateAdminCourse(id, { isAvailableForRegistration: newAvail });
          showToast(`Course "${c.title}" registration is now ${newAvail ? 'OPEN' : 'CLOSED'}`);
          await loadAllAdminData();
        } catch (err) {
          showToast(err.message, 'error');
        }
        break;
      }

      case 'add-project':
        activeItem = null;
        projectError = null;
        projectForm = {
          title: '',
          description: '',
          technologies: ['Software'],
          projectMembers: ['IT Club Members'],
          status: 'In Progress',
          category: 'Web App',
          date: '2026',
          imageUrl: '',
          githubUrl: '',
          liveDemoUrl: '',
          isPublished: true
        };
        modalType = 'project';
        reRender();
        break;

      case 'edit-project': {
        const p = projectsList.find(x => x.id === id);
        if (!p) return;
        activeItem = p;
        projectError = null;
        projectForm = { ...p };
        modalType = 'project';
        reRender();
        break;
      }

      case 'del-project':
        if (!confirm('Delete this project?')) return;
        try {
          await api.deleteAdminProject(id);
          showToast('Project deleted.');
          projectsList = projectsList.filter(p => p.id !== id);
          reRender();
        } catch (err) {
          showToast(err.message, 'error');
        }
        break;

      case 'add-event':
        activeItem = null;
        eventError = null;
        eventForm = {
          title: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          time: '2:00 PM - 4:00 PM',
          location: 'Computer Lab 3, Highschool',
          locationType: 'Onsite',
          organizer: 'IT Club Tech Committee',
          seatsAvailable: 30,
          status: 'Upcoming',
          imageUrl: '',
          coverImageUrl: '',
          isPublished: true
        };
        modalType = 'event';
        reRender();
        break;

      case 'edit-event': {
        const ev = eventsList.find(x => x.id === id);
        if (!ev) return;
        activeItem = ev;
        eventError = null;
        eventForm = { ...ev, date: ev.date || '' };
        modalType = 'event';
        reRender();
        break;
      }

      case 'del-event':
        if (!confirm('Delete this event?')) return;
        try {
          await api.deleteAdminEvent(id);
          showToast('Event deleted.');
          eventsList = eventsList.filter(ev => ev.id !== id);
          reRender();
        } catch (err) {
          showToast(err.message, 'error');
        }
        break;

      case 'generate-cert-open':
        generateCertForm = {
          memberId: membersList.find(m => m.role !== 'admin')?.id || '',
          studentName: membersList.find(m => m.role !== 'admin')?.studentName || '',
          courseName: coursesList[0]?.title || 'Full-Stack Web Engineering',
          role: 'ACTIVE MEMBER',
          achievement: 'Excellence in Software Development, Tech Innovation & Active Club Contribution',
          issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          deliverTelegram: true,
          deliverEmail: true
        };
        modalType = 'generateCert';
        reRender();
        break;

      case 'cert-member': {
        const m = membersList.find(x => x.id === id || x.memberId === id) || applicationsList.find(x => x.id === id);
        if (!m) return;
        const defaultCourse = Array.isArray(m.courses) && m.courses[0]?.title
          ? m.courses[0].title
          : (m.course?.title || m.courseName || coursesList[0]?.title || 'Full-Stack Web Engineering');
        generateCertForm = {
          memberId: m.id || m.memberId,
          studentName: m.studentName || '',
          courseName: defaultCourse,
          role: (m.role && m.role !== 'member') ? m.role.toUpperCase() : 'ACTIVE MEMBER',
          achievement: `Excellence in Software Development and Active Leadership in ${m.class || 'Club Activities'}`,
          issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          deliverTelegram: true,
          deliverEmail: true
        };
        modalType = 'generateCert';
        reRender();
        break;
      }

      case 'bulk-cert-trigger': {
        if (selectedMemberIds.size === 0) {
          showToast('Please select at least one member using the table checkboxes.', 'error');
          return;
        }
        bulkCertForm = {
          courseName: coursesList[0]?.title || 'Full-Stack Web Engineering Track',
          role: 'ACTIVE MEMBER',
          achievement: 'Excellence in Software Development & Distinguished Contribution to ARX IT Club',
          issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          deliverTelegram: true,
          deliverEmail: true
        };
        modalType = 'bulkGenerateCert';
        reRender();
        break;
      }

      case 'deliver-cert-btn': {
        try {
          showToast('Dispatching certificate via Telegram & Email...');
          const res = await api.deliverAdminCertificate(id, ['telegram', 'email']);
          showToast(res?.message || 'Certificate successfully dispatched!');
          await loadAllAdminData();
          reRender();
        } catch (err) {
          showToast(err.message || 'Delivery dispatch failed.', 'error');
        }
        break;
      }

      case 'view-cert': {
        const cert = certificatesList.find(c => c.id === id || c.certificateId === id);
        if (cert) {
          modalState.openCertificateModal(cert.certificateId || cert.id);
        }
        break;
      }

      case 'toggle-cert':
        try {
          const res = await api.toggleAdminCertificate(id);
          showToast(res?.message || 'Certificate status updated.');
          await loadAllAdminData();
        } catch (err) {
          showToast(err.message, 'error');
        }
        break;

      case 'del-cert': {
        if (!confirm('Are you sure you want to permanently delete this certificate record?')) return;
        try {
          await api.deleteAdminCertificate(id);
          showToast('Certificate record deleted.');
          certificatesList = certificatesList.filter(c => c.id !== id && c.certificateId !== id);
          reRender();
        } catch (err) {
          showToast(err.message, 'error');
        }
        break;
      }

      case 'add-cert':
        certForm = {
          memberId: membersList[0]?.id || '',
          studentName: membersList[0]?.studentName || '',
          courseName: coursesList[0]?.title || 'Cybersecurity & Ethical Hacking',
          issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        };
        modalType = 'cert';
        reRender();
        break;

      case 'add-award':
        awardForm = {
          memberId: membersList.find(m => m.role === 'member')?.id || '',
          title: '',
          description: '',
          category: 'Excellence'
        };
        modalType = 'award';
        reRender();
        break;

      case 'del-award':
        if (!confirm('Delete this award?')) return;
        try {
          await api.deleteAdminAward(id);
          showToast('Award removed.');
          awardsList = awardsList.filter(a => a.id !== id);
          reRender();
        } catch (err) {
          showToast(err.message, 'error');
        }
        break;

      case 'add-achievement':
        activeItem = null;
        achievementForm = {
          title: '',
          description: '',
          category: 'Competition',
          year: new Date().getFullYear(),
          rank: '1st Place'
        };
        modalType = 'achievement';
        reRender();
        break;

      case 'del-achievement':
        if (!confirm('Delete achievement?')) return;
        try {
          await api.deleteAdminAchievement(id);
          showToast('Achievement deleted.');
          achievementsList = achievementsList.filter(a => a.id !== id);
          reRender();
        } catch (err) {
          showToast(err.message, 'error');
        }
        break;

      case 'toggle-bot-token':
        showBotToken = !showBotToken;
        reRender();
        break;

      case 'test-bot':
        testingConnection = true;
        testResult = null;
        reRender();
        try {
          const r = await api.testAdminTelegramConnection();
          testResult = r;
          if (r.success) {
            showToast('All Telegram connection checks passed!');
            await loadTelegramBotData();
          } else {
            showToast(r.error || 'Telegram connection test failed', 'error');
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
        testingConnection = false;
        reRender();
        break;

      case 'sync-webhook':
        webhookSyncing = true;
        webhookSyncMessage = null;
        reRender();
        try {
          const r = await api.syncTelegramWebhook();
          webhookSyncMessage = r.success ? 'Webhook successfully registered with Telegram.' : `Webhook registration failed: ${r.error || 'Check token'}`;
          if (r.success) {
            showToast('Webhook registered with Telegram!');
            await loadWebhookInfo();
          } else {
            showToast('Failed to register webhook', 'error');
          }
        } catch (err) {
          webhookSyncMessage = `Error: ${err.message}`;
          showToast(err.message, 'error');
        }
        webhookSyncing = false;
        reRender();
        break;

      case 'add-team-member':
        activeItem = null;
        teamMemberError = null;
        teamMemberForm = {
          name: '',
          role: '',
          category: 'instructor',
          specialty: '',
          department: '',
          photoUrl: '/uploads/student-leadership.svg',
          positionOffset: 'center 20%',
          description: '',
          socialLinks: { telegram: '', github: '', linkedin: '', email: '' },
          order: teamList.length + 1,
          isPublished: true
        };
        modalType = 'teamMember';
        reRender();
        break;

      case 'edit-team-member': {
        const m = teamList.find(x => x.id === id);
        if (!m) return;
        activeItem = m;
        teamMemberError = null;
        teamMemberForm = {
          name: m.name || '',
          role: m.role || '',
          category: m.category || 'instructor',
          specialty: m.specialty || '',
          department: m.department || '',
          photoUrl: m.photoUrl || '/uploads/student-leadership.svg',
          positionOffset: m.positionOffset || 'center 20%',
          description: m.description || '',
          socialLinks: m.socialLinks || { telegram: '', github: '', linkedin: '', email: '' },
          order: m.order || 1,
          isPublished: m.isPublished !== false
        };
        modalType = 'teamMember';
        reRender();
        break;
      }

      case 'transfer-team-role': {
        transferRoleError = null;
        const currentCmo = teamList.find(m => m.role === 'Chief Marketing Officer') || teamList[0];
        const candidate = teamList.find(m => m.id !== currentCmo?.id) || teamList[1];
        transferRoleForm = {
          sourceMemberId: currentCmo?.id || '',
          targetMemberId: candidate?.id || '',
          roleTitle: currentCmo?.role || 'Chief Marketing Officer',
          newSourceRole: 'Front-End Development Instructor'
        };
        modalType = 'transferRole';
        reRender();
        break;
      }

      case 'team-preset-portrait': {
        const pUrl = el.dataset.url;
        const pPos = el.dataset.pos || 'center 20%';
        const pInput = root.querySelector('#team-photo-url');
        const posInput = root.querySelector('#team-pos-offset');
        const prevImg = root.querySelector('#team-preview-img');
        if (pInput && pUrl) pInput.value = pUrl;
        if (posInput && pPos) posInput.value = pPos;
        if (prevImg && pUrl) {
          prevImg.src = pUrl;
          prevImg.style.objectPosition = pPos;
        }
        teamMemberForm.photoUrl = pUrl;
        teamMemberForm.positionOffset = pPos;
        break;
      }

      case 'toggle-team-publish': {
        const m = teamList.find(x => x.id === id);
        if (!m) return;
        const nextPub = !(m.isPublished !== false);
        try {
          await api.updateAdminGovernance(id, { isPublished: nextPub });
          m.isPublished = nextPub;
          showToast(`Team member ${m.name} is now ${nextPub ? 'visible on site' : 'hidden'}.`);
          await loadAllAdminData();
          reRender();
        } catch (err) {
          showToast(err.message || 'Failed to update visibility.', 'error');
        }
        break;
      }

      case 'delete-team-member': {
        const name = el.dataset.name || 'this member';
        if (!confirm(`Are you sure you want to remove ${name} from the leadership/faculty roster? This cannot be undone.`)) return;
        try {
          await api.deleteAdminGovernance(id);
          teamList = teamList.filter(x => x.id !== id);
          showToast(`Team member ${name} removed.`);
          await loadAllAdminData();
          reRender();
        } catch (err) {
          showToast(err.message || 'Failed to delete member.', 'error');
        }
        break;
      }

      case 'reorder-team-up': {
        const sorted = [...teamList].sort((a, b) => (a.order || 99) - (b.order || 99));
        const index = sorted.findIndex(x => x.id === id);
        if (index > 0) {
          const temp = sorted[index].order;
          sorted[index].order = sorted[index - 1].order;
          sorted[index - 1].order = temp;
          try {
            await api.reorderAdminGovernance(sorted.map(x => x.id));
            await loadAllAdminData();
            showToast('Team order updated.');
            reRender();
          } catch (err) {
            showToast(err.message || 'Failed to reorder.', 'error');
          }
        }
        break;
      }

      case 'reorder-team-down': {
        const sorted = [...teamList].sort((a, b) => (a.order || 99) - (b.order || 99));
        const index = sorted.findIndex(x => x.id === id);
        if (index >= 0 && index < sorted.length - 1) {
          const temp = sorted[index].order;
          sorted[index].order = sorted[index + 1].order;
          sorted[index + 1].order = temp;
          try {
            await api.reorderAdminGovernance(sorted.map(x => x.id));
            await loadAllAdminData();
            showToast('Team order updated.');
            reRender();
          } catch (err) {
            showToast(err.message || 'Failed to reorder.', 'error');
          }
        }
        break;
      }

      case 'filter-team-category': {
        teamFilterCategory = el.dataset.category || 'all';
        reRender();
        break;
      }

      case 'close-modal':
        modalType = null;
        activeItem = null;
        selectedApplicationDetail = null;
        selectedMemberDetail = null;
        reRender();
        break;

      case 'close-modal-overlay':
        if (e.target && (e.target.id === 'admin-modal-overlay' || e.target.getAttribute('data-action') === 'close-modal-overlay')) {
          modalType = null;
          activeItem = null;
          selectedApplicationDetail = null;
          selectedMemberDetail = null;
          reRender();
        }
        break;
    }
  });

  // Search and filter inputs
  const appSearchEl = root.querySelector('#app-search-input');
  if (appSearchEl) {
    appSearchEl.addEventListener('input', (e) => {
      appSearch = e.target.value;
      reRender('app-search-input');
    });
  }

  const enrollmentSearchEl = root.querySelector('#enrollment-search-input');
  if (enrollmentSearchEl) {
    enrollmentSearchEl.addEventListener('input', (e) => {
      enrollmentSearch = e.target.value;
      reRender('enrollment-search-input');
    });
  }

  const memberSearchEl = root.querySelector('#member-search');
  if (memberSearchEl) {
    memberSearchEl.addEventListener('input', (e) => {
      memberSearch = e.target.value;
      reRender('member-search');
    });
  }
  const memberFilterEl = root.querySelector('#member-filter');
  if (memberFilterEl) {
    memberFilterEl.addEventListener('change', (e) => {
      memberFilterStatus = e.target.value;
      reRender();
    });
  }

  // Bind forms
  bindForms(root);
}

function bindForms(root) {
  // Review Submission form (Student Project Review)
  const reviewSubFormEl = root.querySelector('#review-submission-form');
  if (reviewSubFormEl) {
    reviewSubFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = root.querySelector('#review-status')?.value;
      const notes = (root.querySelector('#review-notes')?.value || '').trim();
      const subId = activeItem?.id;
      if (!subId || !status) return;
      try {
        const res = await api.reviewAdminProjectSubmission(subId, { status, reviewNotes: notes });
        if (res?.submission) {
          const idx = projectSubmissionsList.findIndex(s => s.id === subId);
          if (idx !== -1) projectSubmissionsList[idx] = res.submission;
        }
        modalType = null;
        activeItem = null;
        reRender();
        showToast(`Project marked as "${status}". Student notified.`);
      } catch (err) {
        showToast(err.message || 'Failed to save review.', 'error');
      }
    });
  }

  // Course form
  const courseFormEl = root.querySelector('#course-form');
  if (courseFormEl) {
    courseFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(courseFormEl);
      const data = Object.fromEntries(fd.entries());
      const payload = {
        ...courseForm,
        title: (data.title || '').trim(),
        description: (data.description || '').trim(),
        category: data.category,
        difficulty: data.difficulty,
        duration: data.duration,
        instructor: data.instructor,
        thumbnailUrl: data.thumbnailUrl,
        bannerUrl: data.bannerUrl,
        isPublished: courseFormEl.querySelector('[name="isPublished"]')?.checked !== false,
        isAvailableForRegistration: courseFormEl.querySelector('[name="isAvailableForRegistration"]')?.checked !== false
      };
      if (!payload.title) {
        courseError = 'Course title is required.';
        reRender();
        return;
      }
      isSavingCourse = true;
      reRender();
      try {
        if (activeItem?.id) {
          const r = await api.updateAdminCourse(activeItem.id, payload);
          coursesList = coursesList.map(c => c.id === activeItem.id ? (r?.course || { ...activeItem, ...payload }) : c);
          showToast('Course updated successfully!');
        } else {
          const r = await api.createAdminCourse(payload);
          coursesList = [r?.course || { ...payload, id: `c_${Date.now()}` }, ...coursesList];
          showToast('Course published successfully!');
        }
        modalType = null;
        courseError = null;
      } catch (err) {
        courseError = err.message;
        showToast(err.message, 'error');
      }
      isSavingCourse = false;
      reRender();
    });
  }

  // Project form
  const projectFormEl = root.querySelector('#project-form');
  if (projectFormEl) {
    projectFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(projectFormEl);
      const data = Object.fromEntries(fd.entries());
      const payload = {
        title: (data.title || '').trim(),
        description: (data.description || '').trim(),
        technologies: (data.technologies || '').split(',').map(t => t.trim()).filter(Boolean),
        projectMembers: (data.projectMembers || '').split(',').map(m => m.trim()).filter(Boolean),
        githubUrl: data.githubUrl,
        imageUrl: data.imageUrl,
        isPublished: true
      };
      if (!payload.title) {
        projectError = 'Project title is required.';
        reRender();
        return;
      }
      isSavingProject = true;
      reRender();
      try {
        if (activeItem?.id) {
          const r = await api.updateAdminProject(activeItem.id, payload);
          projectsList = projectsList.map(p => p.id === activeItem.id ? (r?.project || { ...activeItem, ...payload }) : p);
          showToast('Project updated successfully!');
        } else {
          const r = await api.createAdminProject(payload);
          projectsList = [r?.project || { ...payload, id: `p_${Date.now()}` }, ...projectsList];
          showToast('Project published successfully!');
        }
        modalType = null;
        projectError = null;
      } catch (err) {
        projectError = err.message;
        showToast(err.message, 'error');
      }
      isSavingProject = false;
      reRender();
    });
  }

  // Event form
  const eventFormEl = root.querySelector('#event-form');
  if (eventFormEl) {
    eventFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(eventFormEl);
      const data = Object.fromEntries(fd.entries());
      const dateObj = data.date ? new Date(data.date + 'T00:00:00') : new Date();
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      const payload = {
        title: (data.title || '').trim(),
        description: (data.description || '').trim(),
        date: data.date,
        time: (data.time || '').trim(),
        location: (data.location || '').trim() || 'Computer Lab 3, Highschool',
        locationType: data.locationType || 'Onsite',
        formattedDate: { day: String(dateObj.getDate()), month: months[dateObj.getMonth()] || 'OCT', year: String(dateObj.getFullYear()) },
        isPublished: true
      };
      if (!payload.title || !payload.date || !payload.time) {
        eventError = 'Title, date, and time are required.';
        reRender();
        return;
      }
      isSavingEvent = true;
      reRender();
      try {
        if (activeItem?.id) {
          const r = await api.updateAdminEvent(activeItem.id, payload);
          eventsList = eventsList.map(ev => ev.id === activeItem.id ? (r?.event || { ...activeItem, ...payload }) : ev);
          showToast('Event updated successfully!');
        } else {
          const r = await api.createAdminEvent(payload);
          eventsList = [r?.event || { ...payload, id: `ev_${Date.now()}` }, ...eventsList];
          showToast('Event created successfully!');
        }
        modalType = null;
        eventError = null;
      } catch (err) {
        eventError = err.message;
        showToast(err.message, 'error');
      }
      isSavingEvent = false;
      reRender();
    });
  }

  // Certificate form
  const certFormEl = root.querySelector('#cert-form');
  if (certFormEl) {
    const memberSelect = certFormEl.querySelector('#cert-member-select');
    const nameInput = certFormEl.querySelector('#cert-student-name');
    if (memberSelect && nameInput) {
      memberSelect.addEventListener('change', () => {
        const opt = memberSelect.options[memberSelect.selectedIndex];
        const studentName = opt?.dataset?.name;
        if (studentName) {
          nameInput.value = studentName;
        }
      });
    }

    const coursePreset = certFormEl.querySelector('#cert-course-preset');
    const courseInput = certFormEl.querySelector('#cert-course-name');
    if (coursePreset && courseInput) {
      coursePreset.addEventListener('change', () => {
        if (coursePreset.value && coursePreset.value !== 'custom') {
          courseInput.value = coursePreset.value;
        }
      });
    }

    certFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(certFormEl);
      const data = Object.fromEntries(fd.entries());
      const studentName = (data.studentName || '').trim();
      const courseName = (data.courseName || '').trim();
      const memberId = (data.memberId && data.memberId !== 'custom') ? data.memberId : undefined;

      if (!studentName && !memberId) {
        showToast('Please specify a student name.', 'error');
        return;
      }
      if (!courseName) {
        showToast('Please enter or select a course name.', 'error');
        return;
      }

      try {
        const r = await api.issueAdminCertificate({
          memberId,
          studentName,
          courseName,
          issueDate: data.issueDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          authorizedSignatures: [
            { title: 'Club President', name: (data.signatoryName || 'NEXORA').trim() },
            { title: 'Authorized Faculty Advisor', name: 'Academic Director' }
          ]
        });
        showToast(`Certificate issued! ID: ${r.certificate?.certificateId || 'Success'}`);
        modalType = null;
        await loadAllAdminData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Award form
  const awardFormEl = root.querySelector('#award-form');
  if (awardFormEl) {
    awardFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(awardFormEl);
      const data = Object.fromEntries(fd.entries());
      if (!data.memberId || !data.title) {
        showToast('Student and title are required.', 'error');
        return;
      }
      try {
        await api.createAdminAward({ memberId: data.memberId, title: data.title, description: data.description, category: data.category });
        showToast('Award assigned to student!');
        modalType = null;
        await loadAllAdminData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Achievement form
  const achieveFormEl = root.querySelector('#achievement-form');
  if (achieveFormEl) {
    achieveFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(achieveFormEl);
      const data = Object.fromEntries(fd.entries());
      const payload = { title: data.title, description: data.description, category: data.category, year: Number(data.year) || 2026 };
      try {
        const r = await api.createAdminAchievement(payload);
        showToast('Achievement published!');
        achievementsList = [r?.achievement || { ...payload, id: `ach_${Date.now()}` }, ...achievementsList];
        modalType = null;
        reRender();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Edit member form
  const editMemberFormEl = root.querySelector('#edit-member-form');
  if (editMemberFormEl) {
    editMemberFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(editMemberFormEl);
      const data = Object.fromEntries(fd.entries());
      try {
        await api.updateAdminMember(activeItem.id, data);
        showToast('Member profile updated successfully!');
        membersList = membersList.map(m => m.id === activeItem.id ? { ...m, ...data } : m);
        modalType = null;
        reRender();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Reset member password form
  const resetPwFormEl = root.querySelector('#reset-pw-form');
  if (resetPwFormEl) {
    resetPwFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pw = root.querySelector('#new-pw-input')?.value || '';
      if (pw.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
      }
      try {
        await api.resetAdminMemberPassword(resetPasswordMember.id, pw);
        showToast(`Password for ${resetPasswordMember.studentName} has been reset.`);
        modalType = null;
        reRender();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Bot token form
  const botTokenFormEl = root.querySelector('#bot-token-form');
  if (botTokenFormEl) {
    botTokenFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = (root.querySelector('#bot-token-input')?.value || '').trim();
      if (!token) {
        showToast('Please enter a valid Telegram bot token.', 'error');
        return;
      }
      savingBotToken = true;
      reRender();
      try {
        const r = await api.updateAdminTelegramToken(token);
        if (r.success) {
          showToast(r.message || 'Telegram Bot connected successfully!');
          botTokenInput = '';
          await loadTelegramBotData();
          await loadWebhookInfo();
        } else {
          showToast(r.error || 'Failed to authenticate bot token', 'error');
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
      savingBotToken = false;
      reRender();
    });
  }

  // Settings form
  const settingsFormEl = root.querySelector('#settings-form');
  if (settingsFormEl) {
    settingsFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(settingsFormEl);
      const data = Object.fromEntries(fd.entries());
      settings = { ...settings, ...data };
      try {
        await api.updateAdminSettings(settings);
        showToast('Settings saved successfully!');
        reRender();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Copy to clipboard helper
  root.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const val = btn.getAttribute('data-copy');
      if (val && navigator.clipboard) {
        navigator.clipboard.writeText(val).then(() => {
          showToast('Copied to clipboard!');
        }).catch(() => {
          showToast('Failed to copy', 'error');
        });
      }
    });
  });

  // Admin password form
  const adminPwFormEl = root.querySelector('#admin-pw-form');
  if (adminPwFormEl) {
    adminPwFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pw = (root.querySelector('#admin-pw-input')?.value || '').trim();
      if (pw.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
      }
      try {
        await api.changeAdminPassword(pw);
        showToast('Administrator password updated!');
        adminPasswordInput = '';
        reRender();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Member table checkboxes (single and select-all)
  const selectAllChk = root.querySelector('#chk-select-all-members');
  if (selectAllChk) {
    selectAllChk.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      const filteredMembers = membersList.filter(m => m.role !== 'admin');
      if (isChecked) {
        filteredMembers.forEach(m => selectedMemberIds.add(m.id));
      } else {
        selectedMemberIds.clear();
      }
      reRender();
    });
  }

  root.querySelectorAll('.member-select-chk').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const mid = e.target.getAttribute('data-id');
      if (e.target.checked) {
        selectedMemberIds.add(mid);
      } else {
        selectedMemberIds.delete(mid);
      }
      const bulkBtn = root.querySelector('[data-action="bulk-cert-trigger"]');
      if (bulkBtn) {
        bulkBtn.innerHTML = `${icon('Award', 'w-3.5 h-3.5')} Bulk Issue Certificates ${selectedMemberIds.size > 0 ? `(${selectedMemberIds.size})` : ''}`;
      }
    });
  });

  // Automated Individual Certificate Form
  const autoCertFormEl = root.querySelector('#automated-cert-form');
  if (autoCertFormEl) {
    const memSel = autoCertFormEl.querySelector('#acert-member-select');
    const nameInp = autoCertFormEl.querySelector('#acert-name');
    const roleSel = autoCertFormEl.querySelector('#acert-role');
    if (memSel && nameInp) {
      memSel.addEventListener('change', () => {
        const opt = memSel.options[memSel.selectedIndex];
        if (opt?.dataset?.name) {
          nameInp.value = opt.dataset.name;
          generateCertForm.memberId = memSel.value;
          generateCertForm.studentName = opt.dataset.name;
        }
        if (opt?.dataset?.role && roleSel) {
          const r = opt.dataset.role.toUpperCase();
          roleSel.value = r === 'ADMIN' ? 'ACTIVE MEMBER' : r;
        }
      });
    }

    autoCertFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const studentName = (autoCertFormEl.querySelector('#acert-name')?.value || '').trim();
      const courseName = (autoCertFormEl.querySelector('#acert-course')?.value || '').trim();
      const achievement = (autoCertFormEl.querySelector('#acert-achievement')?.value || '').trim();
      const role = (autoCertFormEl.querySelector('#acert-role')?.value || 'MEMBER').trim();
      const issueDate = (autoCertFormEl.querySelector('#acert-date')?.value || '').trim();
      const deliverTg = autoCertFormEl.querySelector('#acert-chk-tg')?.checked;
      const deliverEmail = autoCertFormEl.querySelector('#acert-chk-email')?.checked;
      const memberId = autoCertFormEl.querySelector('#acert-member-select')?.value || generateCertForm.memberId;

      if (!studentName) {
        showToast('Recipient member name is required.', 'error');
        return;
      }
      if (!courseName) {
        showToast('Course or project track title is required.', 'error');
        return;
      }

      isGeneratingCert = true;
      reRender();

      try {
        const deliverVia = [];
        if (deliverTg) deliverVia.push('telegram');
        if (deliverEmail) deliverVia.push('email');

        const res = await api.generateAdminCertificate({
          memberId: memberId || undefined,
          studentName,
          courseName,
          achievement,
          role,
          issueDate: issueDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          deliverVia
        });

        showToast(res?.message || 'Certificate generated successfully!');
        modalType = null;
        await loadAllAdminData();
        reRender();
      } catch (err) {
        showToast(err.message || 'Failed to generate certificate.', 'error');
      } finally {
        isGeneratingCert = false;
        reRender();
      }
    });
  }

  // Bulk Certificate Generation Form
  const bulkCertFormEl = root.querySelector('#bulk-cert-form');
  if (bulkCertFormEl) {
    bulkCertFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const courseName = (bulkCertFormEl.querySelector('#bcert-course')?.value || '').trim();
      const role = (bulkCertFormEl.querySelector('#bcert-role')?.value || 'MEMBER').trim();
      const achievement = (bulkCertFormEl.querySelector('#bcert-achievement')?.value || '').trim();
      const issueDate = (bulkCertFormEl.querySelector('#bcert-date')?.value || '').trim();
      const deliverTg = bulkCertFormEl.querySelector('#bcert-chk-tg')?.checked;
      const deliverEmail = bulkCertFormEl.querySelector('#bcert-chk-email')?.checked;

      if (!courseName) {
        showToast('Please specify the event or course title.', 'error');
        return;
      }

      isBulkGeneratingCert = true;
      reRender();

      try {
        const deliverVia = [];
        if (deliverTg) deliverVia.push('telegram');
        if (deliverEmail) deliverVia.push('email');

        const memberIds = Array.from(selectedMemberIds);
        const res = await api.bulkGenerateAdminCertificates({
          memberIds,
          courseName,
          role,
          achievement,
          issueDate: issueDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          deliverVia
        });

        showToast(res?.message || `Successfully generated ${res?.successCount || memberIds.length} certificates!`);
        selectedMemberIds.clear();
        modalType = null;
        await loadAllAdminData();
        reRender();
      } catch (err) {
        showToast(err.message || 'Failed to complete bulk generation.', 'error');
      } finally {
        isBulkGeneratingCert = false;
        reRender();
      }
    });
  }

  // Team Member Form
  const teamMemberFormEl = root.querySelector('#team-member-form');
  if (teamMemberFormEl) {
    teamMemberFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = root.querySelector('#team-name')?.value?.trim();
      const role = root.querySelector('#team-role')?.value?.trim();
      const category = root.querySelector('#team-category')?.value;
      const specialty = root.querySelector('#team-specialty')?.value?.trim();
      const order = Number(root.querySelector('#team-order')?.value) || 1;
      const photoUrl = root.querySelector('#team-photo-url')?.value?.trim() || '/uploads/student-leadership.svg';
      const positionOffset = root.querySelector('#team-pos-offset')?.value?.trim() || 'center 20%';
      const description = root.querySelector('#team-desc')?.value?.trim() || '';
      const telegram = root.querySelector('#team-telegram')?.value?.trim() || '';
      const github = root.querySelector('#team-github')?.value?.trim() || '';
      const isPublished = root.querySelector('#team-publish-chk')?.checked !== false;

      if (!name || !role) {
        teamMemberError = 'Name and Role are required.';
        reRender();
        return;
      }

      const payload = {
        name,
        role,
        category,
        specialty,
        department: specialty,
        order,
        photoUrl,
        positionOffset,
        description,
        socialLinks: { telegram, github },
        isPublished
      };

      isSavingTeamMember = true;
      teamMemberError = null;
      reRender();

      try {
        if (activeItem) {
          await api.updateAdminGovernance(activeItem.id, payload);
          showToast(`Profile for ${name} updated successfully!`);
        } else {
          await api.createAdminGovernance(payload);
          showToast(`New team member ${name} added!`);
        }
        modalType = null;
        activeItem = null;
        await loadAllAdminData();
        reRender();
      } catch (err) {
        teamMemberError = err.message || 'Failed to save team member profile.';
        isSavingTeamMember = false;
        reRender();
      }
    });
  }

  // Transfer Role Form
  const transferRoleFormEl = root.querySelector('#transfer-role-form');
  if (transferRoleFormEl) {
    transferRoleFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const sourceMemberId = root.querySelector('#transfer-source')?.value;
      const targetMemberId = root.querySelector('#transfer-target')?.value;
      const roleTitle = root.querySelector('#transfer-role-title')?.value?.trim();
      const newSourceRole = root.querySelector('#transfer-new-source-role')?.value?.trim();

      if (!sourceMemberId || !targetMemberId) {
        transferRoleError = 'Please select both predecessor and successor.';
        reRender();
        return;
      }
      if (sourceMemberId === targetMemberId) {
        transferRoleError = 'Predecessor and Successor cannot be the same person.';
        reRender();
        return;
      }

      isTransferringRole = true;
      transferRoleError = null;
      reRender();

      try {
        const res = await api.transferAdminGovernanceRole({
          sourceMemberId,
          targetMemberId,
          roleTitle,
          newSourceRole
        });
        showToast(res?.message || 'Leadership role transferred successfully!');
        modalType = null;
        await loadAllAdminData();
        reRender();
      } catch (err) {
        transferRoleError = err.message || 'Failed to execute role transfer.';
        isTransferringRole = false;
        reRender();
      }
    });
  }

  // Attendance Session Form
  const attSessionFormEl = root.querySelector('#attendance-session-form');
  if (attSessionFormEl) {
    attSessionFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const courseId = root.querySelector('#att-form-course')?.value || 'general';
      const date = root.querySelector('#att-form-date')?.value;
      const title = root.querySelector('#att-form-title')?.value?.trim();
      const openTime = root.querySelector('#att-form-open')?.value?.trim() || '07:00';
      const presentCutoff = root.querySelector('#att-form-present-cutoff')?.value?.trim() || '07:30';
      const lateCutoff = root.querySelector('#att-form-late-cutoff')?.value?.trim() || '07:40';
      const instructions = root.querySelector('#att-form-instructions')?.value?.trim();

      if (!title || !date) {
        sessionError = 'Title and Date are required.';
        reRender();
        return;
      }

      isSavingSession = true;
      sessionError = null;
      reRender();

      try {
        await api.createAdminAttendanceSession({
          courseId,
          title,
          date,
          ethiopianOpenTime: openTime,
          ethiopianPresentCutoff: presentCutoff,
          ethiopianLateCutoff: lateCutoff,
          instructions,
          status: 'published'
        });
        showToast(`Attendance session "${title}" created successfully!`);
        modalType = null;
        await loadAllAdminData();
        reRender();
      } catch (err) {
        sessionError = err.message || 'Failed to create attendance session.';
        isSavingSession = false;
        reRender();
      }
    });
  }

  // Attendance Rejection Form
  const attRejectFormEl = root.querySelector('#attendance-reject-form');
  if (attRejectFormEl) {
    attRejectFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const reason = root.querySelector('#att-reject-reason')?.value?.trim();
      if (!attendanceReviewModalRecord) return;
      if (!reason) {
        showToast('Please provide a reason for rejection.', 'error');
        return;
      }

      try {
        const res = await api.reviewAdminAttendanceRecord(attendanceReviewModalRecord.id, {
          reviewStatus: 'Rejected',
          rejectionReason: reason
        });
        if (res?.record) {
          const idx = attendanceRecordsList.findIndex(r => r.id === attendanceReviewModalRecord.id);
          if (idx !== -1) attendanceRecordsList[idx] = res.record;
          showToast(`Submission rejected with official reason.`);
          modalType = null;
          attendanceReviewModalRecord = null;
          reRender();
        }
      } catch (err) {
        showToast(err.message || 'Failed to reject submission.', 'error');
      }
    });
  }

  // Attendance Classification Override Form
  const attCorrectFormEl = root.querySelector('#attendance-correct-form');
  if (attCorrectFormEl) {
    attCorrectFormEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const classification = root.querySelector('#att-correct-class')?.value;
      const notes = root.querySelector('#att-correct-notes')?.value?.trim();
      if (!attendanceCorrectionRecord) return;
      if (!classification || !notes) {
        showToast('Classification and override notes are required.', 'error');
        return;
      }

      try {
        const res = await api.correctAdminAttendanceRecord(attendanceCorrectionRecord.id, {
          finalClassification: classification,
          correctionNotes: notes
        });
        if (res?.record) {
          const idx = attendanceRecordsList.findIndex(r => r.id === attendanceCorrectionRecord.id);
          if (idx !== -1) attendanceRecordsList[idx] = res.record;
          showToast(`Classification overridden to ${classification}.`);
          modalType = null;
          attendanceCorrectionRecord = null;
          reRender();
        }
      } catch (err) {
        showToast(err.message || 'Failed to correct classification.', 'error');
      }
    });
  }

  // Attendance Search Filter
  const attSearchInputEl = root.querySelector('#att-search-input');
  if (attSearchInputEl) {
    attSearchInputEl.addEventListener('input', (e) => {
      attendanceFilter.q = e.target.value;
      renderAttendanceRecordsSubTab();
      reRender();
    });
  }
}

// ─── EXPORTED RENDER FUNCTION ─────────────────────────────────────────────────
let initialized = false;

export function renderAdminDashboardPage() {
  const member = authState.member;
  if (!member || (member.role !== 'admin' && member.role !== 'president')) {
    window.location.hash = ADMIN_LOGIN_PATH;
    return `<div>Redirecting to admin login...</div>`;
  }

  if (!initialized) {
    activeTab = 'overview';
    initialized = true;
    loadApplications();
    loadAllAdminData();
  }

  setTimeout(() => bindEvents(), 0);

  const pendingCount = applicationsList.filter(a => a.status === 'pending').length;
  const pendingSubmissionsCount = projectSubmissionsList.filter(s => s.status === 'pending').length;

  return `
    <div id="admin-dashboard-root" class="min-h-screen flex flex-col lg:flex-row bg-[#F7EFE8] dark:bg-[#071A14] text-[#282828] dark:text-white transition-colors duration-200">
      <div id="admin-toast" style="display:none" class="fixed top-4 right-4 z-[100] px-4 py-2.5 rounded-md shadow-xl flex items-center gap-2 text-xs font-mono uppercase tracking-wider border"></div>

      ${renderAdminSidebar(activeTab, pendingCount, pendingSubmissionsCount)}

      <main class="flex-1 p-4 sm:p-8 bg-[#F7EFE8] dark:bg-[#071A14] text-[#282828] dark:text-white overflow-y-auto">
        <div class="max-w-6xl mx-auto space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-bold text-[#282828] dark:text-white uppercase tracking-tight font-sans">
                  ${activeTab === 'overview' ? 'Dashboard Overview' : activeTab.replace('-', ' ')}
                </h1>
                <span class="inline-flex items-center gap-1 rounded border font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60">Admin Role</span>
              </div>
              <p class="text-xs font-mono text-[#282828]/60 dark:text-white mt-1">Real-time club control, content management &amp; student records.</p>
            </div>
            <div class="flex items-center gap-2">
              <button data-action="toggle-theme"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#282828]/15 dark:border-[#25473C] bg-white dark:bg-[#102B22] hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] text-xs font-medium text-[#282828] dark:text-white transition-colors cursor-pointer">
                ${themeState.theme === 'dark'
                  ? `${icon('Sun', 'w-3.5 h-3.5 text-[#6BB89E]')}<span>Light</span>`
                  : `${icon('Moon', 'w-3.5 h-3.5')}<span>Dark</span>`}
              </button>
              <button data-action="refresh-data" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#282828]/15 dark:border-[#25473C] bg-white dark:bg-[#102B22] hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] text-xs font-medium text-[#282828] dark:text-white transition-colors cursor-pointer">
                ${icon('RefreshCw', 'w-3.5 h-3.5 mr-1')} Refresh
              </button>
            </div>
          </div>

          ${buildTabContent()}
        </div>
      </main>

      ${buildModal()}
    </div>
  `;
}

export function initAdminDashboardPageEvents() {
  bindEvents();
}
