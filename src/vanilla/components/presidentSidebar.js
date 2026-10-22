import { authState, themeState, router } from '../state.js';
import { icon } from '../icons.js';
import { ADMIN_LOGIN_PATH, ADMIN_DASHBOARD_PATH } from '../../config/adminRoute.js';

let isPresMobileNavOpen = false;

export function renderPresidentSidebar(currentTab = 'overview', pendingCount = 0, pendingSubmissionsCount = 0) {
  const isDark = themeState.theme === 'dark';

  const navItems = [
    { id: 'overview', label: 'Executive Center', iconName: 'LayoutDashboard' },
    { id: 'admins', label: 'Staff Admins & Roles', iconName: 'ShieldCheck', highlight: true },
    { id: 'members', label: 'Master Members', iconName: 'Users' },
    { id: 'applications', label: 'Application Clearance', iconName: 'ClipboardCheck', badge: pendingCount },
    { id: 'project-reviews', label: 'Student Project Review', iconName: 'FolderGit2', highlight: true, badge: pendingSubmissionsCount },
    { id: 'certificates', label: 'Certificates & Seal', iconName: 'Award' },
    { id: 'courses', label: 'Curriculum Tracks', iconName: 'BookOpen' },
    { id: 'attendance', label: 'Lab Attendance', iconName: 'Calendar' },
    { id: 'assignments', label: 'Submissions & Grading', iconName: 'FolderGit2' },
    { id: 'telegram', label: 'Telegram & Broadcasts', iconName: 'Send' },
    { id: 'settings', label: 'Governance & Identity', iconName: 'Settings' },
    { id: 'system', label: 'Database & Audit Logs', iconName: 'Database', highlight: true },
    { id: 'security', label: 'Executive Security', iconName: 'Key' }
  ];

  return `
    <aside class="w-full lg:w-68 bg-[#FAF6F0] dark:bg-[#071913] border-b lg:border-b-0 lg:border-r border-amber-500/20 dark:border-amber-500/15 text-[#282828] dark:text-white flex flex-col shrink-0 transition-colors duration-200">
      <!-- President Header -->
      <div class="p-3.5 sm:p-4 border-b border-amber-500/20 dark:border-amber-500/15 bg-gradient-to-r from-amber-500/[0.07] via-amber-500/[0.02] to-transparent">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex items-center justify-center bg-amber-500/10 border border-amber-500/30 shrink-0 text-amber-600 dark:text-amber-400 shadow-sm">
              ${icon('Crown', 'w-6 h-6')}
            </div>
            <div class="min-w-0">
              <h4 class="text-xs font-black text-[#282828] dark:text-white uppercase tracking-wider font-sans truncate">
                Presidential Suite
              </h4>
              <p class="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold tracking-tight">
                ABSOLUTE CLEARANCE
              </p>
            </div>
          </div>

          <!-- Mobile Toggle Button (>=44x44px target) -->
          <button
            id="president-mobile-menu-toggle"
            class="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-amber-500/30 bg-white dark:bg-[#102B22] text-amber-700 dark:text-amber-400 cursor-pointer active:scale-95 transition-all"
            aria-label="Toggle executive navigation menu">
            ${icon(isPresMobileNavOpen ? 'X' : 'Menu', 'w-4 h-4')}
          </button>
        </div>

        <div class="mt-3 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-[10px]">
          <span class="text-amber-800 dark:text-amber-300 font-mono font-medium">Clearance: Level 0 (Master)</span>
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </div>

      <!-- Mobile Horizontal Quick-Tab Strip -->
      <div class="lg:hidden overflow-x-auto flex items-center gap-1.5 p-2 bg-white/70 dark:bg-[#071913]/70 border-b border-amber-500/15 no-scrollbar">
        ${navItems.map(item => {
          const active = currentTab === item.id;
          return `
            <button
              data-president-tab="${item.id}"
              class="shrink-0 min-h-[36px] flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer border ${
                active
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-600 font-bold shadow-xs'
                  : 'bg-white dark:bg-[#102B22] border-amber-500/20 text-[#282828]/80 dark:text-white hover:bg-amber-500/10'
              }">
              ${icon(item.iconName, 'w-3 h-3')}
              <span>${item.label}</span>
              ${item.badge && item.badge > 0 ? `
                <span class="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${active ? 'bg-white text-amber-700' : 'bg-amber-500 text-white'}">
                  ${item.badge}
                </span>
              ` : ''}
            </button>
          `;
        }).join('')}
      </div>

      <!-- Navigation Links (Collapsible on Mobile, always open on Desktop) -->
      <nav id="president-sidebar-nav" class="${isPresMobileNavOpen ? 'block' : 'hidden lg:block'} p-2 space-y-1 flex-1 overflow-y-auto">
        <div class="px-3 py-1.5 text-[10px] font-mono font-bold text-amber-700/60 dark:text-amber-400/60 uppercase tracking-wider">
          Executive Operations
        </div>
        ${navItems.map(item => {
          const active = currentTab === item.id;
          return `
            <button
              data-president-tab="${item.id}"
              class="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer border-0 active:scale-[0.99] ${
                active
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold shadow-sm shadow-amber-600/30'
                  : item.highlight
                    ? 'text-amber-900 dark:text-amber-300 hover:bg-amber-500/10 dark:hover:bg-amber-500/15'
                    : 'text-[#282828]/70 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] hover:bg-[#282828]/5 dark:hover:bg-[#102B22]'
              }">
              ${icon(item.iconName, `w-4 h-4 shrink-0 ${active ? 'text-white' : item.highlight ? 'text-amber-600 dark:text-amber-400' : 'text-[#282828]/50 dark:text-white'}`)}
              <span class="flex-1 text-left truncate">${item.label}</span>
              ${item.badge && item.badge > 0 ? `
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold leading-normal ${
                  active
                    ? 'bg-white text-amber-700'
                    : 'bg-amber-500 text-white dark:bg-amber-600'
                }">
                  ${item.badge}
                </span>
              ` : ''}
            </button>
          `;
        }).join('')}
      </nav>

      <!-- Bottom Controls (Collapsible on Mobile, always open on Desktop) -->
      <div id="president-sidebar-bottom" class="${isPresMobileNavOpen ? 'block' : 'hidden lg:block'} p-3 border-t border-amber-500/20 dark:border-amber-500/15 space-y-1.5 bg-amber-500/[0.02]">
        <!-- Jump to Lower Admin Desk -->
        <button
          id="btn-switch-to-officer"
          class="w-full min-h-[44px] flex items-center justify-between px-3.5 py-2 rounded-lg text-xs text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 transition-colors cursor-pointer border border-teal-500/20 bg-teal-500/[0.05] active:scale-95">
          <span class="flex items-center gap-2">
            ${icon('Shield', 'w-4 h-4 text-teal-600 dark:text-teal-400')}
            <span>Staff Desk View</span>
          </span>
          <span class="text-[10px] font-mono uppercase text-teal-600 dark:text-teal-400 font-bold">Officer Desk</span>
        </button>

        <button
          id="president-sidebar-theme-toggle"
          class="w-full min-h-[44px] flex items-center justify-between px-3.5 py-2 rounded-lg text-xs text-[#282828]/70 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer border-0 bg-transparent active:scale-95">
          <span class="flex items-center gap-2">
            ${isDark ? icon('Sun', 'w-4 h-4 text-amber-400') : icon('Moon', 'w-4 h-4 text-[#282828]')}
            <span>${isDark ? 'Light Mode' : 'Night Mode'}</span>
          </span>
          <span class="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400">Toggle</span>
        </button>

        <button
          data-nav="/"
          class="w-full min-h-[44px] flex items-center justify-between px-3.5 py-2 rounded-lg text-xs text-[#282828]/70 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] hover:bg-[#282828]/5 dark:hover:bg-[#102B22] transition-colors cursor-pointer border-0 bg-transparent active:scale-95">
          <span>View Public Site</span>
          ${icon('ExternalLink', 'w-4 h-4 text-[#282828]/40 dark:text-white')}
        </button>

        <button
          id="president-sidebar-exit-btn"
          class="w-full min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border-0 bg-transparent active:scale-95">
          ${icon('LogOut', 'w-4 h-4')}
          <span>Lock &amp; Exit Console</span>
        </button>
      </div>
    </aside>
  `;
}

export function initPresidentSidebarEvents(onTabChange) {
  document.querySelectorAll('[data-president-tab]').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const tab = btn.getAttribute('data-president-tab');
      isPresMobileNavOpen = false;
      if (tab && typeof onTabChange === 'function') {
        onTabChange(tab);
      }
    };
  });

  const presMobileToggle = document.getElementById('president-mobile-menu-toggle');
  if (presMobileToggle) {
    presMobileToggle.onclick = () => {
      isPresMobileNavOpen = !isPresMobileNavOpen;
      const nav = document.getElementById('president-sidebar-nav');
      const bottom = document.getElementById('president-sidebar-bottom');
      if (nav) {
        if (isPresMobileNavOpen) {
          nav.classList.remove('hidden');
        } else {
          nav.classList.add('hidden');
        }
      }
      if (bottom) {
        if (isPresMobileNavOpen) {
          bottom.classList.remove('hidden');
        } else {
          bottom.classList.add('hidden');
        }
      }
    };
  }

  const toggleBtn = document.getElementById('president-sidebar-theme-toggle');
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      themeState.toggle();
    };
  }

  const switchBtn = document.getElementById('btn-switch-to-officer');
  if (switchBtn) {
    switchBtn.onclick = () => {
      router.navigate(ADMIN_DASHBOARD_PATH);
    };
  }

  const exitBtn = document.getElementById('president-sidebar-exit-btn');
  if (exitBtn) {
    exitBtn.onclick = () => {
      authState.logout();
      router.navigate(ADMIN_LOGIN_PATH);
    };
  }
}
