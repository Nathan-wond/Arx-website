import { authState, themeState, router } from '../state.js';
import { api } from '../../services/api.js';
import { icon } from '../icons.js';
import { ADMIN_DASHBOARD_PATH } from '../../config/adminRoute.js';

let brandSettings = {
  logoUrl: '/assets/arx-logo-light.jpg',
  logoDarkUrl: '/assets/arx-logo-dark.jpg',
  clubName: 'ARX IT CLUB',
  registrationStatus: 'OPEN'
};

let brandLoaded = false;
async function ensureBrand() {
  if (brandLoaded) return;
  try {
    const res = await api.getPublicSettings();
    if (res?.settings) {
      if (res.settings.compactLogoUrl || res.settings.logoUrl) {
        brandSettings.logoUrl = res.settings.compactLogoUrl || res.settings.logoUrl || '/assets/arx-logo-light.jpg';
        brandSettings.logoDarkUrl = res.settings.compactLogoDarkUrl || res.settings.logoDarkUrl || res.settings.compactLogoUrl || res.settings.logoUrl || '/assets/arx-logo-dark.jpg';
      }
      if (res.settings.clubName) brandSettings.clubName = res.settings.clubName;
      if (res.settings.registrationStatus) brandSettings.registrationStatus = res.settings.registrationStatus;
      brandLoaded = true;
    }
  } catch {}
}

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Courses', path: '/courses' },
  { label: 'Projects', path: '/projects' },
  { label: 'Event', path: '/events' },
  { label: 'Contact', path: '/contact' }
];

export function renderNavbar(currentPath) {
  ensureBrand().then(() => {
    // update logos/name if loaded asynchronously
    const nameEl = document.querySelector('[data-navbar-brand-name]');
    if (nameEl && nameEl.textContent !== brandSettings.clubName) {
      nameEl.textContent = brandSettings.clubName;
    }
  });

  const isActive = (path) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && (currentPath === path || currentPath.startsWith(path + '/'))) return true;
    return false;
  };

  const isAuth = authState.isAuthenticated && authState.member;
  const member = authState.member;
  const isDark = themeState.theme === 'dark';

  return `
    <header class="sticky top-0 z-40 w-full bg-[#F7EFE8]/95 dark:bg-[#071A14]/95 backdrop-blur-md border-b border-[#282828]/10 dark:border-[#25473C] transition-colors duration-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo Brand -->
          <button
            data-nav="/"
            class="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FC6454] dark:focus-visible:ring-[#6BB89E] rounded-sm bg-transparent border-0 p-0">
            <div class="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-transparent shrink-0">
              <img
                src="${brandSettings.logoUrl}"
                alt="${brandSettings.clubName} Logo Light"
                class="w-full h-full object-cover rounded-full dark:hidden"
                onerror="this.src='/assets/arx-logo-light.jpg'" />
              <img
                src="${brandSettings.logoDarkUrl}"
                alt="${brandSettings.clubName} Logo Dark"
                class="w-full h-full object-cover rounded-full hidden dark:block"
                onerror="this.src='/assets/arx-logo-dark.jpg'" />
            </div>
            <span data-navbar-brand-name class="font-semibold text-base tracking-tight text-[#282828] dark:text-white font-sans">
              ${brandSettings.clubName}
            </span>
          </button>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex items-center gap-1 lg:gap-2">
            ${navLinks.map(link => {
              const active = isActive(link.path);
              return `
                <button
                  data-nav="${link.path}"
                  class="px-3 py-1.5 text-xs font-medium tracking-tight transition-colors duration-150 cursor-pointer rounded-md border-0 ${
                    active
                      ? 'text-[#FC6454] dark:text-[#6BB89E] font-semibold bg-[#FC6454]/15 dark:bg-[#2F8068]/20'
                      : 'text-[#282828]/80 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] hover:bg-[#FC6454]/10 dark:hover:bg-[#102B22]'
                  }">
                  ${link.label}
                </button>
              `;
            }).join('')}
          </nav>

          <!-- Desktop Actions -->
          <div class="hidden md:flex items-center gap-2.5">
            <!-- Theme Toggle -->
            <button
              id="navbar-theme-toggle"
              class="p-2 rounded-md text-[#282828]/70 dark:text-white hover:text-[#FC6454] dark:hover:text-[#6BB89E] hover:bg-[#FC6454]/10 dark:hover:bg-[#102B22] border border-[#282828]/15 dark:border-[#25473C] transition-colors cursor-pointer"
              title="${isDark ? 'Switch to light mode' : 'Switch to dark mode'}"
              aria-label="Toggle visual theme">
              ${isDark ? icon('Sun', 'w-4 h-4 text-[#6BB89E]') : icon('Moon', 'w-4 h-4 text-[#282828]')}
            </button>

            ${isAuth ? `
              <!-- User Dropdown Menu -->
              <div class="relative" id="navbar-user-dropdown-container">
                <button
                  id="navbar-user-dropdown-btn"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white dark:bg-[#102B22] hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white transition-colors cursor-pointer">
                  <div class="w-5 h-5 rounded-sm bg-[#FC6454]/15 dark:bg-[#2F8068]/30 text-[#FC6454] dark:text-[#6BB89E] flex items-center justify-center text-[10px] font-mono font-bold">
                    ${member.studentName ? member.studentName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div class="text-left text-xs">
                    <p class="font-medium text-[#282828] dark:text-white leading-none">
                      ${member.studentName ? member.studentName.split(' ')[0] : 'Member'}
                    </p>
                    <p class="text-[10px] font-mono text-[#FC6454] dark:text-[#6BB89E] tracking-wider">
                      ${member.memberId || ''}
                    </p>
                  </div>
                  ${icon('ChevronDown', 'w-3.5 h-3.5 text-[#282828]/50 dark:text-white/60 ml-0.5')}
                </button>

                <!-- Dropdown panel -->
                <div id="navbar-user-dropdown-panel" class="hidden absolute right-0 mt-2 w-56 rounded-lg bg-white dark:bg-[#102B22] border border-[#282828]/15 dark:border-[#25473C] py-1.5 shadow-lg text-[#282828] dark:text-white z-50">
                  <div class="px-3.5 py-2 border-b border-[#282828]/10 dark:border-[#25473C]">
                    <p class="text-xs font-semibold text-[#282828] dark:text-white">${member.studentName || ''}</p>
                    <p class="text-[10px] font-mono text-[#FC6454] dark:text-[#6BB89E]">
                      ${member.memberId || ''} &bull; Class ${member.class || ''}
                    </p>
                  </div>
                  ${member.role === 'president' ? `
                    <button
                      data-nav="/president"
                      class="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 dark:hover:bg-[#15362B] text-left font-bold transition-colors cursor-pointer border-0">
                      ${icon('Crown', 'w-3.5 h-3.5 text-amber-500')}
                      Presidential Suite
                    </button>
                    <button
                      data-nav="${ADMIN_DASHBOARD_PATH}"
                      class="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 dark:hover:bg-[#15362B] text-left font-medium transition-colors cursor-pointer border-0">
                      ${icon('Shield', 'w-3.5 h-3.5 text-teal-600 dark:text-teal-400')}
                      Staff Operations Console
                    </button>
                  ` : member.role === 'admin' ? `
                    <button
                      data-nav="${ADMIN_DASHBOARD_PATH}"
                      class="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#FC6454] dark:text-[#6BB89E] hover:bg-[#FC6454]/10 dark:hover:bg-[#15362B] text-left font-medium transition-colors cursor-pointer border-0">
                      ${icon('LayoutDashboard', 'w-3.5 h-3.5 text-[#FC6454] dark:text-[#6BB89E]')}
                      Admin Operations
                    </button>
                  ` : ''}
                  <button
                    data-nav="${member.role === 'president' ? '/president' : (member.role === 'admin' ? ADMIN_DASHBOARD_PATH : '/portal/dashboard')}"
                    class="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs hover:bg-[#FC6454]/10 dark:hover:bg-[#15362B] text-left transition-colors cursor-pointer border-0">
                    ${icon('LayoutDashboard', 'w-3.5 h-3.5 text-[#282828]/50 dark:text-white/70')}
                    ${member.role === 'president' ? 'Executive Dashboard' : (member.role === 'admin' ? 'Control Console' : 'Member Dashboard')}
                  </button>
                  ${member.role !== 'admin' ? `
                    <button
                      data-nav="/portal/profile"
                      class="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs hover:bg-[#FC6454]/10 dark:hover:bg-[#15362B] text-left transition-colors cursor-pointer border-0">
                      ${icon('User', 'w-3.5 h-3.5 text-[#282828]/50 dark:text-white/70')}
                      My Profile
                    </button>
                  ` : ''}
                  <div class="my-1 border-t border-[#282828]/10 dark:border-[#25473C]"></div>
                  <button
                    id="navbar-logout-btn"
                    class="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition-colors cursor-pointer border-0">
                    ${icon('LogOut', 'w-3.5 h-3.5 text-rose-600 dark:text-rose-400')}
                    Log Out
                  </button>
                </div>
              </div>
            ` : `
              <button
                data-nav="/login"
                class="px-3 py-1.5 text-xs font-medium text-[#282828] dark:text-white hover:text-[#FC6454] dark:hover:text-[#6BB89E] transition-colors cursor-pointer border-0 bg-transparent">
                Member Login
              </button>
              <button
                data-nav="/register"
                class="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer shadow-xs border-0">
                Join Club
              </button>
            `}
          </div>

          <!-- Mobile Hamburger and Theme Toggle -->
          <div class="flex items-center gap-2 md:hidden">
            <button
              id="navbar-theme-toggle-mobile"
              class="p-2 rounded-md text-[#282828]/70 dark:text-white hover:text-[#FC6454] dark:hover:text-[#6BB89E] border border-[#282828]/15 dark:border-[#25473C] transition-colors cursor-pointer"
              aria-label="Toggle visual theme">
              ${isDark ? icon('Sun', 'w-4 h-4 text-[#6BB89E]') : icon('Moon', 'w-4 h-4 text-[#282828]')}
            </button>
            <button
              id="navbar-mobile-toggle-btn"
              class="p-2 rounded-md text-[#282828]/70 dark:text-white hover:text-[#FC6454] dark:hover:text-[#6BB89E] border border-[#282828]/15 dark:border-[#25473C] transition-colors cursor-pointer"
              aria-label="Toggle mobile menu">
              ${icon('Menu', 'w-5 h-5')}
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Dropdown Menu -->
      <div id="navbar-mobile-menu" class="hidden md:hidden border-b border-[#282828]/10 dark:border-[#25473C] bg-[#F7EFE8] dark:bg-[#071A14] px-4 pt-2 pb-4 space-y-1">
        ${navLinks.map(link => {
          const active = isActive(link.path);
          return `
            <button
              data-nav="${link.path}"
              class="w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors border-0 ${
                active
                  ? 'text-[#FC6454] dark:text-[#6BB89E] font-semibold bg-[#FC6454]/15 dark:bg-[#2F8068]/20'
                  : 'text-[#282828]/80 dark:text-white hover:bg-[#FC6454]/10 dark:hover:bg-[#102B22]'
              }">
              ${link.label}
            </button>
          `;
        }).join('')}
        <div class="pt-2 border-t border-[#282828]/10 dark:border-[#25473C] space-y-1">
          ${isAuth ? `
            <div class="px-3 py-2">
              <p class="text-xs font-semibold text-[#282828] dark:text-white">${member.studentName || ''}</p>
              <p class="text-[10px] font-mono text-[#FC6454] dark:text-[#6BB89E]">${member.memberId || ''}</p>
            </div>
            ${member.role === 'president' ? `
              <button
                data-nav="/president"
                class="w-full text-left px-3 py-2 text-sm text-amber-600 dark:text-amber-400 font-bold border-0 bg-transparent flex items-center gap-2">
                ${icon('Crown', 'w-4 h-4 text-amber-500')}
                <span>Presidential Suite</span>
              </button>
              <button
                data-nav="${ADMIN_DASHBOARD_PATH}"
                class="w-full text-left px-3 py-2 text-sm text-teal-700 dark:text-teal-400 font-medium border-0 bg-transparent flex items-center gap-2">
                ${icon('Shield', 'w-4 h-4 text-teal-600 dark:text-teal-400')}
                <span>Staff Operations Console</span>
              </button>
            ` : member.role === 'admin' ? `
              <button
                data-nav="${ADMIN_DASHBOARD_PATH}"
                class="w-full text-left px-3 py-2 text-sm text-[#FC6454] dark:text-[#6BB89E] font-medium border-0 bg-transparent">
                Admin Operations
              </button>
            ` : ''}
            <button
              data-nav="${member.role === 'president' ? '/president' : (member.role === 'admin' ? ADMIN_DASHBOARD_PATH : '/portal/dashboard')}"
              class="w-full text-left px-3 py-2 text-sm text-[#282828] dark:text-white border-0 bg-transparent">
              ${member.role === 'president' ? 'Executive Dashboard' : (member.role === 'admin' ? 'Control Console' : 'Member Dashboard')}
            </button>
            <button
              id="navbar-mobile-logout-btn"
              class="w-full text-left px-3 py-2 text-sm text-rose-600 dark:text-rose-400 font-medium border-0 bg-transparent">
              Log Out
            </button>
          ` : `
            <button
              data-nav="/login"
              class="w-full text-left px-3 py-2 text-sm font-medium text-[#282828] dark:text-white border-0 bg-transparent">
              Member Login
            </button>
            <button
              data-nav="/register"
              class="w-full text-center px-4 py-2 text-sm font-semibold rounded-md bg-[#FC6454] text-white dark:bg-[#2F8068] border-0">
              Join Club
            </button>
          `}
        </div>
      </div>
    </header>
  `;
}

export function initNavbarEvents() {
  // Theme toggles
  const themeToggle = document.getElementById('navbar-theme-toggle');
  if (themeToggle) {
    themeToggle.onclick = () => themeState.toggleTheme();
  }
  const themeToggleMob = document.getElementById('navbar-theme-toggle-mobile');
  if (themeToggleMob) {
    themeToggleMob.onclick = () => themeState.toggleTheme();
  }

  // Mobile menu toggle
  const mobToggle = document.getElementById('navbar-mobile-toggle-btn');
  const mobMenu = document.getElementById('navbar-mobile-menu');
  if (mobToggle && mobMenu) {
    mobToggle.onclick = () => {
      mobMenu.classList.toggle('hidden');
    };
  }

  // User dropdown toggle
  const userDropBtn = document.getElementById('navbar-user-dropdown-btn');
  const userDropPanel = document.getElementById('navbar-user-dropdown-panel');
  if (userDropBtn && userDropPanel) {
    userDropBtn.onclick = (e) => {
      e.stopPropagation();
      userDropPanel.classList.toggle('hidden');
    };
    document.addEventListener('click', (e) => {
      if (!userDropPanel.contains(e.target) && e.target !== userDropBtn) {
        userDropPanel.classList.add('hidden');
      }
    });
  }

  // Logout buttons
  const logoutBtn = document.getElementById('navbar-logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      authState.logout();
      router.navigate('/');
    };
  }
  const logoutBtnMob = document.getElementById('navbar-mobile-logout-btn');
  if (logoutBtnMob) {
    logoutBtnMob.onclick = () => {
      authState.logout();
      router.navigate('/');
    };
  }
}
