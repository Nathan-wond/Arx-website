import { authState, router } from '../state.js';
import { icon } from '../icons.js';

export function renderPortalSidebar(currentPath) {
  const member = authState.member;

  const navItems = [
    { label: 'Dashboard', path: '/portal/dashboard', iconName: 'LayoutDashboard' },
    { label: 'My Courses', path: '/portal/courses', iconName: 'BookOpen' },
    { label: 'Lab Attendance', path: '/portal/attendance', iconName: 'Clock' },
    { label: 'My Certificates', path: '/portal/certificates', iconName: 'Award' },
    { label: 'My Awards', path: '/portal/awards', iconName: 'Trophy' },
    { label: 'My Projects', path: '/portal/projects', iconName: 'FolderGit2' },
    { label: 'Events', path: '/events', iconName: 'Calendar' },
    { label: 'My Profile', path: '/portal/profile', iconName: 'User' },
    { label: 'Change Password', path: '/portal/change-password', iconName: 'KeyRound' }
  ];

  return `
    <aside class="w-full lg:w-64 bg-[#EFE6DE]/60 dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-lg text-[#282828] dark:text-white flex flex-col shrink-0 overflow-hidden shadow-xs transition-colors duration-200">
      <!-- Member Identity Header -->
      <div class="p-4 border-b border-[#282828]/10 dark:border-[#25473C] bg-white/40 dark:bg-[#0A211A]/80">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-md bg-[#FC6454]/15 dark:bg-[#2F8068]/30 border border-[#FC6454]/30 dark:border-[#2F8068] text-[#FC6454] dark:text-[#6BB89E] flex items-center justify-center font-mono font-bold text-xs shrink-0">
            ${member?.studentName ? member.studentName.charAt(0).toUpperCase() : 'M'}
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="text-xs font-semibold text-[#282828] dark:text-white truncate font-sans">
              ${member?.studentName || 'Member'}
            </h4>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="font-mono text-[10px] text-[#FC6454] dark:text-[#6BB89E] bg-[#FC6454]/10 dark:bg-[#071A14] px-1.5 py-0.2 rounded-sm border border-[#FC6454]/25 dark:border-[#25473C]">
                ${member?.memberId || 'TI------'}
              </span>
              <span class="text-[10px] text-[#282828]/60 dark:text-white">Class ${member?.class || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Nav Items -->
      <nav class="p-2 space-y-0.5 flex-1">
        ${navItems.map(item => {
          const active = currentPath === item.path;
          return `
            <button
              data-nav="${item.path}"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer border-0 ${
                active
                  ? 'bg-[#FC6454] text-white dark:bg-[#2F8068] dark:text-white font-semibold shadow-xs'
                  : 'text-[#282828]/70 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] hover:bg-[#FC6454]/10 dark:hover:bg-[#15362B]'
              }">
              ${icon(item.iconName, `w-3.5 h-3.5 ${active ? 'text-white dark:text-white' : 'text-[#282828]/40 dark:text-white'}`)}
              <span>${item.label}</span>
            </button>
          `;
        }).join('')}
      </nav>

      <!-- Telegram Status -->
      <div class="p-3 mx-2.5 mb-3 rounded-md bg-white dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] text-xs">
        <div class="flex items-center justify-between text-[#FC6454] dark:text-[#6BB89E] font-medium mb-1">
          <span class="flex items-center gap-1.5 text-[11px] font-mono">
            ${icon('Send', 'w-3.5 h-3.5 text-[#FC6454] dark:text-[#6BB89E]')} Telegram Hub
          </span>
          <span class="text-[9px] font-mono text-emerald-700 dark:text-[#58B889] bg-emerald-50 dark:bg-[#102B22] px-1 py-0.2 rounded-sm border border-emerald-200 dark:border-[#25473C]">
            ACTIVE
          </span>
        </div>
        <p class="text-[11px] text-[#282828]/60 dark:text-white leading-relaxed">
          Official channel announcements and bot notifications connected.
        </p>
      </div>

      <!-- Exit Session -->
      <div class="p-2 border-t border-[#282828]/10 dark:border-[#25473C] bg-white/40 dark:bg-transparent">
        <button
          id="portal-exit-session-btn"
          class="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-red-600 dark:text-rose-400 hover:bg-red-500/10 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border-0 bg-transparent">
          ${icon('LogOut', 'w-3.5 h-3.5')}
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  `;
}

export function initPortalSidebarEvents() {
  const exitBtn = document.getElementById('portal-exit-session-btn');
  if (exitBtn) {
    exitBtn.onclick = () => {
      authState.logout();
      router.navigate('/');
    };
  }
}
