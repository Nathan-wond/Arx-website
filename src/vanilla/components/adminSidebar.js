import { authState, themeState, router } from '../state.js';
import { icon } from '../icons.js';
import { ADMIN_LOGIN_PATH } from '../../config/adminRoute.js';

let isMobileNavOpen = false;

export function renderAdminSidebar(currentTab = 'overview', pendingApplicationsCount = 0, pendingSubmissionsCount = 0) {
  const isDark = themeState.theme === 'dark';
  const isPresident = authState.isPresident;

  const navItems = [
    { id: 'overview', label: 'Dashboard', iconName: 'LayoutDashboard' },
    { id: 'team', label: 'Team & Leadership', iconName: 'Shield' },
    { id: 'applications', label: 'Application Review', iconName: 'ClipboardCheck', badge: pendingApplicationsCount },
    { id: 'project-reviews', label: 'Student Project Review', iconName: 'FolderGit2', badge: pendingSubmissionsCount },
    { id: 'media', label: 'Media Library', iconName: 'Image' },
    { id: 'members', label: 'Members', iconName: 'Users' },
    { id: 'courses', label: 'Courses', iconName: 'BookOpen' },
    { id: 'enrollments', label: 'Enrollments', iconName: 'GraduationCap' },
    { id: 'attendance', label: 'Lab Attendance', iconName: 'Clock' },
    { id: 'certificates', label: 'Certificates', iconName: 'Award' },
    { id: 'awards', label: 'Awards', iconName: 'Trophy' },
    { id: 'projects', label: 'Projects', iconName: 'FolderGit2' },
    { id: 'events', label: 'Events', iconName: 'Calendar' },
    { id: 'achievements', label: 'Achievements', iconName: 'Medal' },
    { id: 'announcements', label: 'Announcements', iconName: 'Bell' },
    { id: 'settings', label: 'Website Settings', iconName: 'Settings' }
  ];

  const currentItem = navItems.find(i => i.id === currentTab) || navItems[0];

  return `
    <aside class="w-full lg:w-64 bg-[#EFE6DE]/60 dark:bg-[#0A211A] border-b lg:border-b-0 lg:border-r border-[#282828]/10 dark:border-[#25473C] text-[#282828] dark:text-white flex flex-col shrink-0 transition-colors duration-200">
      <!-- Admin Header (Desktop & Mobile Bar) -->
      <div class="p-3.5 sm:p-4 border-b border-[#282828]/10 dark:border-[#25473C]">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex items-center justify-center bg-transparent shrink-0">
              <img
                src="/assets/arx-logo-light.jpg"
                alt="ARX Compact Logo Light"
                class="w-full h-full object-cover rounded-full dark:hidden" />
              <img
                src="/assets/arx-logo-dark.jpg"
                alt="ARX Compact Logo Dark"
                class="w-full h-full object-cover rounded-full hidden dark:block" />
            </div>
            <div>
              <h4 class="text-xs font-bold text-[#282828] dark:text-white uppercase tracking-wider font-sans">Operations Console</h4>
              <p class="text-[10px] font-mono text-[#FC6454] dark:text-[#6BB89E] font-medium">STAFF &amp; OFFICER DESK</p>
            </div>
          </div>

          <!-- Mobile Toggle Button (>=44x44px target) -->
          <button
            id="admin-mobile-menu-toggle"
            class="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-[#282828]/15 dark:border-[#25473C] bg-white dark:bg-[#102B22] text-[#282828] dark:text-white cursor-pointer active:scale-95 transition-all"
            aria-label="Toggle section navigation drawer">
            ${icon(isMobileNavOpen ? 'X' : 'Menu', 'w-4 h-4')}
          </button>
        </div>

        ${isPresident ? `
          <div class="mt-3">
            <button
              id="admin-to-president-btn"
              class="w-full min-h-[40px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 transition-all cursor-pointer active:scale-95">
              ${icon('Crown', 'w-3.5 h-3.5')}
              <span>Enter Presidential Suite</span>
            </button>
          </div>
        ` : `
          <div class="mt-2.5 px-2.5 py-1 rounded bg-[#282828]/5 dark:bg-[#102B22] text-[10px] text-[#282828]/60 dark:text-white flex items-center justify-between">
            <span>Clearance: Officer</span>
            <span class="font-mono text-teal-600 dark:text-teal-400 font-semibold">Scoped Desk</span>
          </div>
        `}
      </div>

      <!-- Mobile Horizontal Quick-Tab Strip -->
      <div class="lg:hidden overflow-x-auto flex items-center gap-1.5 p-2 bg-white/70 dark:bg-[#071A14]/70 border-b border-[#282828]/10 dark:border-[#25473C] no-scrollbar">
        ${navItems.map(item => {
          const active = currentTab === item.id;
          return `
            <button
              data-admin-tab="${item.id}"
              class="shrink-0 min-h-[36px] flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer border ${
                active
                  ? 'bg-[#FC6454] text-white dark:bg-[#2F8068] dark:text-white border-[#FC6454] dark:border-[#2F8068] font-semibold shadow-xs'
                  : 'bg-white dark:bg-[#102B22] border-[#282828]/10 dark:border-[#25473C] text-[#282828]/80 dark:text-white hover:bg-[#FC6454]/10 dark:hover:bg-[#15362B]'
              }">
              ${icon(item.iconName, 'w-3 h-3')}
              <span>${item.label}</span>
              ${item.badge && item.badge > 0 ? `
                <span class="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                  active ? 'bg-white text-[#FC6454] dark:bg-[#0A211A] dark:text-[#6BB89E]' : 'bg-[#FC6454] text-white dark:bg-[#2F8068]'
                }">
                  ${item.badge}
                </span>
              ` : ''}
            </button>
          `;
        }).join('')}
      </div>

      <!-- Nav Items (Collapsible on Mobile, always open on Desktop) -->
      <nav id="admin-sidebar-nav" class="${isMobileNavOpen ? 'block' : 'hidden lg:block'} p-2 space-y-1 flex-1 overflow-y-auto">
        ${navItems.map(item => {
          const active = currentTab === item.id;
          return `
            <button
              data-admin-tab="${item.id}"
              class="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer border-0 active:scale-[0.99] ${
                active
                  ? 'bg-[#FC6454] text-white dark:bg-[#2F8068] dark:text-white font-semibold shadow-xs'
                  : 'text-[#282828]/70 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] hover:bg-[#FC6454]/10 dark:hover:bg-[#102B22]'
              }">
              ${icon(item.iconName, `w-4 h-4 shrink-0 ${active ? 'text-white dark:text-white' : 'text-[#282828]/40 dark:text-white'}`)}
              <span class="flex-1 text-left truncate">${item.label}</span>
              ${item.badge && item.badge > 0 ? `
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold leading-normal ${
                  active
                    ? 'bg-white text-[#FC6454] dark:bg-[#0A211A] dark:text-[#6BB89E]'
                    : 'bg-[#FC6454] text-white dark:bg-[#2F8068] dark:text-white'
                }">
                  ${item.badge}
                </span>
              ` : ''}
            </button>
          `;
        }).join('')}
      </nav>

      <!-- Bottom Controls (Collapsible on Mobile, always open on Desktop) -->
      <div id="admin-sidebar-bottom" class="${isMobileNavOpen ? 'block' : 'hidden lg:block'} p-3 border-t border-[#282828]/10 dark:border-[#25473C] space-y-1.5 bg-white/40 dark:bg-transparent">
        <button
          id="admin-sidebar-theme-toggle"
          class="w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-lg text-xs text-[#282828]/70 dark:text-white hover:text-[#FC6454] dark:hover:text-[#6BB89E] hover:bg-[#FC6454]/10 dark:hover:bg-[#102B22] transition-colors cursor-pointer border-0 bg-transparent active:scale-95">
          <span class="flex items-center gap-2">
            ${isDark ? icon('Sun', 'w-4 h-4 text-[#6BB89E]') : icon('Moon', 'w-4 h-4 text-[#282828]')}
            <span>${isDark ? 'Light Mode' : 'Night Mode'}</span>
          </span>
          <span class="text-[10px] font-mono uppercase text-[#FC6454] dark:text-[#6BB89E]">Toggle</span>
        </button>

        <button
          data-nav="/"
          class="w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-lg text-xs text-[#282828]/70 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] hover:bg-[#FC6454]/10 dark:hover:bg-[#102B22] transition-colors cursor-pointer border-0 bg-transparent active:scale-95">
          <span>View Public Site</span>
          ${icon('ExternalLink', 'w-4 h-4 text-[#282828]/40 dark:text-white')}
        </button>

        <button
          id="admin-sidebar-exit-btn"
          class="w-full min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border-0 bg-transparent active:scale-95">
          ${icon('LogOut', 'w-4 h-4')}
          <span>Exit Console</span>
        </button>
      </div>
    </aside>
  `;
}

export function initAdminSidebarEvents(onSelectTab) {
  document.querySelectorAll('[data-admin-tab]').forEach(btn => {
    btn.onclick = () => {
      const tab = btn.getAttribute('data-admin-tab');
      isMobileNavOpen = false;
      if (onSelectTab) onSelectTab(tab);
    };
  });

  const mobileToggle = document.getElementById('admin-mobile-menu-toggle');
  if (mobileToggle) {
    mobileToggle.onclick = () => {
      isMobileNavOpen = !isMobileNavOpen;
      const nav = document.getElementById('admin-sidebar-nav');
      const bottom = document.getElementById('admin-sidebar-bottom');
      if (nav) {
        if (isMobileNavOpen) {
          nav.classList.remove('hidden');
        } else {
          nav.classList.add('hidden');
        }
      }
      if (bottom) {
        if (isMobileNavOpen) {
          bottom.classList.remove('hidden');
        } else {
          bottom.classList.add('hidden');
        }
      }
    };
  }

  const themeToggle = document.getElementById('admin-sidebar-theme-toggle');
  if (themeToggle) {
    themeToggle.onclick = () => themeState.toggleTheme();
  }

  const toPresBtn = document.getElementById('admin-to-president-btn');
  if (toPresBtn) {
    toPresBtn.onclick = () => {
      router.navigate('/president');
    };
  }

  const exitBtn = document.getElementById('admin-sidebar-exit-btn');
  if (exitBtn) {
    exitBtn.onclick = () => {
      authState.logout();
      router.navigate(ADMIN_LOGIN_PATH);
    };
  }
}
