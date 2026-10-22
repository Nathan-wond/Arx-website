import { api } from '../../services/api.js';
import { icon } from '../icons.js';
import { router } from '../state.js';
import { renderCourseVisual } from '../components/courseVisual.js';

let stats = { activeMembers: 0, coursesCount: 0, projectsCount: 0, eventsCount: 0 };
let settings = {
  clubName: 'ARX IT CLUB',
  tagline: 'Learn. Build. Grow.',
  description: 'The school technology club giving students hands-on experience in software engineering, systems design, collaborative projects, and verified credentials.',
  meetingLocation: 'Computer Lab 3, Highschool',
  meetingSchedule: 'Monday to Tuesday · 3:30 PM – 5:30 PM',
  telegramChannelUrl: 'https://t.me/arxitclub',
  registrationStatus: 'OPEN'
};
let courses = [];
let projects = [];
let homeLoaded = false;
let lookupCertId = '';

async function loadHomeData() {
  if (homeLoaded) return;
  try {
    const [statsRes, settingsRes, coursesRes, projectsRes] = await Promise.all([
      api.getStats().catch(() => ({ stats: { activeMembers: 0, coursesCount: 0, projectsCount: 0, eventsCount: 0 } })),
      api.getSettings().catch(() => ({ settings: null })),
      api.getCourses().catch(() => ({ courses: [] })),
      api.getProjects().catch(() => ({ projects: [] }))
    ]);
    if (statsRes?.stats) stats = statsRes.stats;
    if (settingsRes?.settings) settings = { ...settings, ...settingsRes.settings };
    if (coursesRes?.courses) courses = coursesRes.courses.slice(0, 4);
    if (projectsRes?.projects) projects = projectsRes.projects.slice(0, 3);
    homeLoaded = true;
    renderDynamicParts();
  } catch { }
}

function renderDynamicParts() {
  const memCount = document.getElementById('home-stats-members');
  if (memCount) memCount.textContent = stats.activeMembers;
  const courseCount = document.getElementById('home-stats-courses');
  if (courseCount) courseCount.textContent = stats.coursesCount;
  const projCount = document.getElementById('home-stats-projects');
  if (projCount) projCount.textContent = stats.projectsCount;
  const eventCount = document.getElementById('home-stats-events');
  if (eventCount) eventCount.textContent = stats.eventsCount;

  const coursesContainer = document.getElementById('home-courses-grid');
  if (coursesContainer && courses.length > 0) {
    coursesContainer.innerHTML = courses.map(course => `
      <div class="group rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] flex flex-col justify-between overflow-hidden hover:border-[#FC6454]/50 dark:hover:border-[#FC6454]/60 transition-colors shadow-xs">
        <div>
          ${renderCourseVisual(course, 'card')}
          <div class="p-5 space-y-3">
            <div class="flex items-center gap-2 text-xs text-[#282828]/60 dark:text-white/60">
              <span class="font-medium text-[#FC6454] dark:text-[#6BB89E]">${course.category || 'Engineering'}</span>
              <span aria-hidden="true">&middot;</span>
              <span>${course.duration || ''}</span>
              <span aria-hidden="true">&middot;</span>
              <span>${course.level || 'All Levels'}</span>
            </div>
            <h3 class="text-base font-semibold text-[#282828] dark:text-white leading-snug">
              ${course.title || ''}
            </h3>
            <p class="text-xs text-[#282828]/70 dark:text-white/70 line-clamp-2 leading-relaxed">
              ${course.description || ''}
            </p>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-[#282828]/10 dark:border-[#25473C] bg-[#EFE6DE]/40 dark:bg-[#071A14]/50 flex items-center justify-between text-xs">
          <span class="text-[#282828]/60 dark:text-white/60">
            Lead: <strong class="text-[#282828] dark:text-white font-medium">${course.instructor || ''}</strong>
          </span>
          <button
            data-nav="/courses/${course.id}"
            class="text-[#FC6454] dark:text-[#6BB89E] hover:underline font-medium flex items-center gap-1 cursor-pointer border-0 bg-transparent p-0">
            <span>View Track</span>
            ${icon('ArrowRight', 'w-3.5 h-3.5')}
          </button>
        </div>
      </div>
    `).join('');
  }

  const projectsContainer = document.getElementById('home-projects-grid');
  if (projectsContainer && projects.length > 0) {
    projectsContainer.innerHTML = projects.map(proj => `
      <div class="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] flex flex-col justify-between overflow-hidden hover:border-[#FC6454]/50 dark:hover:border-[#FC6454]/60 transition-colors shadow-xs">
        <div>
          ${proj.imageUrl ? `
            <div class="w-full h-40 bg-[#EFE6DE] dark:bg-[#071A14] border-b border-[#282828]/10 dark:border-[#25473C] overflow-hidden">
              <img src="${proj.imageUrl}" alt="${proj.title || ''}" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
            </div>
          ` : ''}
          <div class="p-6 space-y-3">
            <div class="flex items-center gap-2 text-xs text-[#282828]/60 dark:text-white/60">
              <span class="font-mono">${proj.date || '2026'}</span>
              <span aria-hidden="true">&middot;</span>
              <span class="text-emerald-600 dark:text-emerald-400 font-medium">${proj.status || ''}</span>
            </div>
            <h3 class="text-base font-semibold text-[#282828] dark:text-white leading-snug">
              ${proj.title || ''}
            </h3>
            <p class="text-xs text-[#282828]/70 dark:text-white/70 line-clamp-3 leading-relaxed">
              ${proj.description || ''}
            </p>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-[#282828]/10 dark:border-[#25473C] bg-[#EFE6DE]/40 dark:bg-[#071A14]/50 flex items-center justify-between gap-2 text-xs">
          <div class="text-[#282828]/60 dark:text-white/60 truncate max-w-[170px]">
            Team: <span class="text-[#282828] dark:text-white font-medium">
              ${Array.isArray(proj.projectMembers) ? proj.projectMembers.join(', ') : (proj.projectMembers || 'IT Club Team')}
            </span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            ${(proj.githubUrl || proj.projectUrl) ? `
              <a
                href="${proj.githubUrl || proj.projectUrl}"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-[#282828] dark:text-white hover:text-[#FC6454] dark:hover:text-[#6BB89E] font-medium transition-colors"
                title="Repository">
                <span>Code</span>
              </a>
            ` : ''}
            ${proj.liveDemoUrl ? `
              <a
                href="${proj.liveDemoUrl}"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-[#FC6454] dark:text-[#6BB89E] hover:underline font-medium transition-colors"
                title="Live Demo">
                <span>Demo</span>
                ${icon('ExternalLink', 'w-3 h-3')}
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }
}

export function renderHomePage() {
  loadHomeData();

  return `
    <div class="space-y-16 lg:space-y-24 pb-20">
      <!-- Hero Section -->
      <section class="border-b border-[#282828]/10 dark:border-[#25473C] bg-[#F7EFE8] dark:bg-[#071A14] transition-colors duration-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <!-- Left Info -->
            <div class="lg:col-span-7 space-y-6 text-left">
              <div class="flex items-center gap-2 text-xs font-mono text-[#FC6454] dark:text-[#6BB89E]">
                <span class="w-2 h-2 rounded-full bg-[#FC6454] animate-pulse"></span>
                <span>OFFICIAL TECHNOLOGY ORGANIZATION</span>
                <span aria-hidden="true">&middot;</span>
                <span class="text-[#282828]/60 dark:text-white/60">2026 CYCLE</span>
              </div>

              <div class="space-y-3">
                <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#282828] dark:text-white leading-[1.08] text-balance font-sans">
                  ${settings.clubName === 'ARX IT CLUB OF SJS' ? 'ARX IT CLUB' : (settings.clubName || 'ARX IT CLUB')}
                </h1>
                <p class="text-lg sm:text-xl font-medium text-[#282828]/80 dark:text-white/90">
                  ${settings.tagline || 'Learn. Build. Grow.'}
                </p>
              </div>

              <p class="text-sm sm:text-base text-[#282828]/70 dark:text-white/75 leading-relaxed max-w-2xl">
                ${settings.description}
              </p>

              <div class="flex flex-wrap items-center gap-3 pt-2">
                ${settings.registrationStatus === 'CLOSED' ? `
                  <button
                    data-nav="/register"
                    class="px-4 py-2.5 rounded-md text-sm font-semibold border border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all cursor-pointer">
                    Admissions Closed
                  </button>
                ` : `
                  <button
                    data-nav="/register"
                    class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer shadow-xs border-0">
                    Join Club
                    ${icon('ArrowRight', 'w-4 h-4 ml-1')}
                  </button>
                `}
                <button
                  data-nav="/courses"
                  class="px-4 py-2.5 rounded-md text-sm font-medium border border-[#282828]/20 dark:border-[#25473C] text-[#282828] dark:text-white hover:bg-[#282828]/5 dark:hover:bg-[#102B22] transition-colors cursor-pointer">
                  Explore Curriculum
                </button>
                <a
                  href="${settings.telegramChannelUrl || 'https://t.me/arxitclub'}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-md text-xs font-medium text-[#282828] dark:text-white hover:text-[#FC6454] border border-[#282828]/15 dark:border-[#25473C] hover:bg-[#FC6454]/10 transition-colors">
                  ${icon('Send', 'w-3.5 h-3.5 text-[#FC6454]')}
                  <span>@arxitclub</span>
                </a>
              </div>

              <div class="pt-4 border-t border-[#282828]/10 dark:border-[#25473C] flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#282828]/60 dark:text-white/60">
                <div class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Free Student Membership</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#FC6454]"></span>
                  <span>Lab Project Mentorship</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span>Verified Credentials</span>
                </div>
              </div>
            </div>

            <!-- Operations Box -->
            <div class="lg:col-span-5 w-full">
              <div class="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white/70 dark:bg-[#102B22] overflow-hidden shadow-xs">
                <div class="px-5 py-3 border-b border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span class="text-xs font-mono font-medium uppercase tracking-wider text-[#282828] dark:text-white">OPERATIONS DESK</span>
                  </div>
                  <span class="text-[11px] font-mono text-[#282828]/60 dark:text-white/60">STATUS / ACTIVE</span>
                </div>

                <div class="p-5 space-y-4 text-xs">
                  <div class="space-y-1">
                    <span class="text-[11px] font-mono uppercase tracking-wider text-[#282828]/60 dark:text-white/60">Headquarters &amp; Lab</span>
                    <div class="flex items-start gap-2 text-[#282828] dark:text-white font-medium">
                      ${icon('MapPin', 'w-4 h-4 text-[#FC6454] shrink-0 mt-0.5')}
                      <span>${settings.meetingLocation}</span>
                    </div>
                  </div>

                  <div class="space-y-1">
                    <span class="text-[11px] font-mono uppercase tracking-wider text-[#282828]/60 dark:text-white/60">Weekly Sessions</span>
                    <div class="flex items-start gap-2 text-[#282828] dark:text-white font-medium">
                      ${icon('Clock', 'w-4 h-4 text-[#FC6454] shrink-0 mt-0.5')}
                      <span>${settings.meetingSchedule}</span>
                    </div>
                  </div>

                  <div class="pt-2 border-t border-[#282828]/10 dark:border-[#25473C] grid grid-cols-2 gap-3">
                    <div class="p-3 bg-[#EFE6DE]/60 dark:bg-[#071A14] rounded-md border border-[#282828]/10 dark:border-[#25473C]">
                      <p class="text-[11px] font-mono text-[#282828]/60 dark:text-white/60 uppercase">Enrolled Members</p>
                      <p id="home-stats-members" class="text-lg font-bold text-[#282828] dark:text-white font-mono tabular-nums mt-0.5">${stats.activeMembers}</p>
                    </div>
                    <div class="p-3 bg-[#EFE6DE]/60 dark:bg-[#071A14] rounded-md border border-[#282828]/10 dark:border-[#25473C]">
                      <p class="text-[11px] font-mono text-[#282828]/60 dark:text-white/60 uppercase">Available Tracks</p>
                      <p id="home-stats-courses" class="text-lg font-bold text-[#FC6454] dark:text-[#6BB89E] font-mono tabular-nums mt-0.5">${stats.coursesCount}</p>
                    </div>
                  </div>

                  <div class="pt-1">
                    <button
                      data-nav="/about"
                      class="w-full py-2 text-center text-xs font-medium text-[#282828] dark:text-white hover:text-[#FC6454] bg-[#EFE6DE]/70 dark:bg-[#071A14] rounded-md border border-[#282828]/15 dark:border-[#25473C] transition-colors cursor-pointer">
                      View Organization Charter &amp; Leadership &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Strip -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-[#FAF4EE] dark:bg-[#102B22] p-6 sm:p-8 shadow-xs">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div class="space-y-1 sm:border-r border-[#282828]/10 dark:border-[#25473C] sm:pr-6">
              <span class="text-xs font-mono uppercase tracking-wider text-[#282828]/70 dark:text-white">Active Members</span>
              <p id="home-stats-members-strip" class="text-3xl sm:text-4xl font-bold text-[#282828] dark:text-white font-mono tabular-nums">${stats.activeMembers}</p>
              <p class="text-[11px] text-[#282828]/60 dark:text-white">Registered students</p>
            </div>
            <div class="space-y-1 md:border-r border-[#282828]/10 dark:border-[#25473C] md:pr-6">
              <span class="text-xs font-mono uppercase tracking-wider text-[#282828]/70 dark:text-white">Curriculum Courses</span>
              <p id="home-stats-courses-strip" class="text-3xl sm:text-4xl font-bold text-[#FC6454] dark:text-[#6BB89E] font-mono tabular-nums">${stats.coursesCount}</p>
              <p class="text-[11px] text-[#282828]/60 dark:text-white">Structured training modules</p>
            </div>
            <div class="space-y-1 sm:border-r border-[#282828]/10 dark:border-[#25473C] sm:pr-6">
              <span class="text-xs font-mono uppercase tracking-wider text-[#282828]/70 dark:text-white">Software Projects</span>
              <p id="home-stats-projects" class="text-3xl sm:text-4xl font-bold text-[#282828] dark:text-white font-mono tabular-nums">${stats.projectsCount}</p>
              <p class="text-[11px] text-[#282828]/60 dark:text-white">Shipped student repos</p>
            </div>
            <div class="space-y-1">
              <span class="text-xs font-mono uppercase tracking-wider text-[#282828]/70 dark:text-white">Activities &amp; Labs</span>
              <p id="home-stats-events" class="text-3xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">${stats.eventsCount}</p>
              <p class="text-[11px] text-[#282828]/60 dark:text-white">Conducted workshops</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Pillars Section -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
          <div>
            <span class="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider">PILLARS / METHODOLOGY</span>
            <h2 class="text-2xl sm:text-3xl font-bold text-[#282828] dark:text-white tracking-tight mt-1">Core Technical Tracks</h2>
          </div>
          <p class="text-xs sm:text-sm text-[#282828]/60 dark:text-white/60 max-w-md">
            Four interconnected stages transforming classroom curiosity into production-grade software engineering.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-6 space-y-3 shadow-xs">
            <div class="flex items-center justify-between text-[#282828]/60 dark:text-white/60 text-xs font-mono">
              <span>TRACK 01</span>
              ${icon('Laptop', 'w-4 h-4 text-[#FC6454]')}
            </div>
            <h3 class="text-base font-semibold text-[#282828] dark:text-white">Learn Fundamentals</h3>
            <p class="text-xs text-[#282828]/70 dark:text-white/70 leading-relaxed">
              Master web architectures, typed programming with TypeScript and Python, networking basics, and algorithm design.
            </p>
          </div>

          <div class="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-6 space-y-3 shadow-xs">
            <div class="flex items-center justify-between text-[#282828]/60 dark:text-white/60 text-xs font-mono">
              <span>TRACK 02</span>
              ${icon('Code', 'w-4 h-4 text-[#FC6454]')}
            </div>
            <h3 class="text-base font-semibold text-[#282828] dark:text-white">Build Real Systems</h3>
            <p class="text-xs text-[#282828]/70 dark:text-white/70 leading-relaxed">
              Collaborate on real student web applications, automation bots, relational databases, and verifiable microservices.
            </p>
          </div>

          <div class="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-6 space-y-3 shadow-xs">
            <div class="flex items-center justify-between text-[#282828]/60 dark:text-white/60 text-xs font-mono">
              <span>TRACK 03</span>
              ${icon('Award', 'w-4 h-4 text-[#FC6454]')}
            </div>
            <h3 class="text-base font-semibold text-[#282828] dark:text-white">Compete &amp; Ship</h3>
            <p class="text-xs text-[#282828]/70 dark:text-white/70 leading-relaxed">
              Represent our school in hackathons, algorithm competitions, and robotics challenges with faculty guidance.
            </p>
          </div>

          <div class="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-6 space-y-3 shadow-xs">
            <div class="flex items-center justify-between text-[#282828]/60 dark:text-white/60 text-xs font-mono">
              <span>TRACK 04</span>
              ${icon('Users', 'w-4 h-4 text-[#FC6454]')}
            </div>
            <h3 class="text-base font-semibold text-[#282828] dark:text-white">Collaborate in Teams</h3>
            <p class="text-xs text-[#282828]/70 dark:text-white/70 leading-relaxed">
              Work under code reviews, git feature branches, peer programming sessions, and constructive design critiques.
            </p>
          </div>
        </div>
      </section>

      <!-- Featured Courses -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
          <div>
            <span class="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider">CURRICULUM / COURSES</span>
            <h2 class="text-2xl sm:text-3xl font-bold text-[#282828] dark:text-white tracking-tight mt-1">Featured Training Modules</h2>
          </div>
          <button
            data-nav="/courses"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer">
            <span>View All Courses</span>
            ${icon('ChevronRight', 'w-3.5 h-3.5 ml-1')}
          </button>
        </div>

        <div id="home-courses-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"></div>
      </section>

      <!-- Selected Projects -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
          <div>
            <span class="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider">SHOWCASE / REPOSITORIES</span>
            <h2 class="text-2xl sm:text-3xl font-bold text-[#282828] dark:text-white tracking-tight mt-1">Selected Member Projects</h2>
          </div>
          <button
            data-nav="/projects"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer">
            <span>View All Projects</span>
            ${icon('ChevronRight', 'w-3.5 h-3.5 ml-1')}
          </button>
        </div>

        <div id="home-projects-grid" class="grid grid-cols-1 md:grid-cols-3 gap-6"></div>
      </section>

      <!-- Verification Banner -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-8 sm:p-12 shadow-xs">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div class="lg:col-span-7 space-y-4 text-left">
              <div class="inline-flex items-center gap-2 text-xs font-mono text-[#FC6454] dark:text-[#6BB89E]">
                ${icon('ShieldCheck', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]')}
                <span>CRYPTOGRAPHIC CREDENTIAL REGISTRY</span>
              </div>
              <h2 class="text-2xl sm:text-3xl font-bold text-[#282828] dark:text-white tracking-tight">Recognized Technical Certificates</h2>
              <p class="text-xs sm:text-sm text-[#282828]/70 dark:text-white leading-relaxed max-w-xl">
                Every certificate issued by ARX IT CLUB carries a unique certificate ID,
                academic seal, and verification hash. Universities, competitions, and employers
                can verify credential authenticity directly on our public ledger.
              </p>

              <form id="home-verify-form" class="flex flex-col sm:flex-row gap-2 max-w-md pt-2">
                <div class="relative flex-1">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#282828]/40 dark:text-white">
                    ${icon('Search', 'w-4 h-4')}
                  </span>
                  <input
                    id="home-verify-input"
                    type="text"
                    placeholder="Enter Certificate ID (e.g. ITC-...)"
                    value="${lookupCertId}"
                    class="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-md border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white placeholder-[#282828]/40 dark:placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30" />
                </div>
                <button
                  type="submit"
                  class="px-4 py-2 text-xs font-semibold rounded-md bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer shadow-xs border-0">
                  Verify Credential
                </button>
              </form>
            </div>

            <div class="lg:col-span-5 flex justify-center">
              <div class="w-full max-w-sm rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-[#FAF4EE] dark:bg-[#0C241C] p-6 space-y-4 shadow-xs">
                <div class="flex items-center justify-between pb-3 border-b border-[#282828]/10 dark:border-[#25473C]">
                  <span class="text-xs font-mono text-[#282828]/50 dark:text-white uppercase">Tamper-Proof Registry</span>
                  <span class="text-[10px] font-mono text-emerald-700 dark:text-[#58B889] bg-emerald-50 dark:bg-[#102B22] px-2 py-0.5 rounded-sm border border-emerald-200 dark:border-[#25473C]">VERIFIED</span>
                </div>
                <div class="space-y-1.5 text-xs">
                  <div class="flex justify-between text-[#282828]/70 dark:text-white">
                    <span>Algorithm</span>
                    <span class="font-mono text-[#282828] dark:text-white">SHA-256 Digest</span>
                  </div>
                  <div class="flex justify-between text-[#282828]/70 dark:text-white">
                    <span>Public Lookup</span>
                    <span class="font-mono text-[#FC6454] dark:text-[#6BB89E]">Enabled</span>
                  </div>
                  <div class="flex justify-between text-[#282828]/70 dark:text-white">
                    <span>Print Format</span>
                    <span class="font-mono text-[#282828] dark:text-white">A4 Landscape</span>
                  </div>
                </div>
                <button
                  data-nav="/certificates"
                  class="w-full px-3 py-1.5 rounded-md text-xs font-medium border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer">
                  Open Credential Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Bottom Join CTA with Official ARX IT Club Logo -->
      <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div class="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl overflow-hidden border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-1 shadow-md transition-colors">
          <img
            src="/assets/arx-logo-light.jpg"
            alt="ARX IT CLUB Official Logo"
            class="w-full h-full object-cover rounded-xl dark:hidden"
            onerror="this.src='/arx-primary-logo.png'" />
          <img
            src="/assets/arx-logo-dark.jpg"
            alt="ARX IT CLUB Official Logo"
            class="w-full h-full object-cover rounded-xl hidden dark:block"
            onerror="this.src='/arx-primary-logo.png'" />
        </div>

        <span class="text-xs font-mono text-[#FC6454] dark:text-[#82CBB2] uppercase tracking-wider font-semibold block">MEMBERSHIP / JOIN</span>
        <h2 class="text-3xl sm:text-4xl font-bold text-[#282828] dark:text-white tracking-tight font-sans">Ready to build with ARX IT CLUB?</h2>
        <p class="text-sm text-[#282828]/70 dark:text-white max-w-xl mx-auto leading-relaxed">
          Join our active student cohort, receive your unique Member ID, attend weekly lab workshops,
          and start building meaningful software projects.
        </p>
        <div class="pt-2">
          ${settings.registrationStatus === 'CLOSED' ? `
            <div class="inline-flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                data-nav="/register"
                class="px-4 py-2.5 rounded-md text-sm font-semibold border border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 cursor-pointer">
                Admissions Notice
              </button>
              <a
                href="${settings.telegramChannelUrl || 'https://t.me/arxitclub'}"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors">
                ${icon('Send', 'w-4 h-4')}
                <span>Join @arxitclub for Opening Announcements</span>
              </a>
            </div>
          ` : `
            <button
              data-nav="/register"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer font-semibold text-sm shadow-xs border-0">
              Register as New Member
              ${icon('ArrowRight', 'w-4 h-4 ml-2')}
            </button>
          `}
        </div>
      </section>
    </div>
  `;
}

export function initHomePageEvents() {
  const form = document.getElementById('home-verify-form');
  const input = document.getElementById('home-verify-input');
  if (input) {
    input.oninput = (e) => { lookupCertId = e.target.value; };
  }
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      if (lookupCertId.trim()) {
        router.navigate(`/certificates?id=${encodeURIComponent(lookupCertId.trim())}`);
      } else {
        router.navigate('/certificates');
      }
    };
  }
}
