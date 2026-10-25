import { injectSpeedInsights } from '@vercel/speed-insights';
import { authState, themeState, router, modalState, events } from './state.js';
import { getStoredToken } from '../services/api.js';
import { renderNavbar, initNavbarEvents } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { renderPortalSidebar } from './components/portalSidebar.js';
import { renderCertificateModal, initCertificateModalEvents } from './components/certificateModal.js';

// Public Pages
import { renderHomePage, initHomePageEvents } from './pages/home.js';
import { renderAboutPage } from './pages/about.js';
import { renderCoursesPage, initCoursesPageEvents } from './pages/courses.js';
import { renderCourseDetailPage } from './pages/courseDetail.js';
import { renderProjectsPage, initProjectsPageEvents } from './pages/projects.js';
import { renderEventsPage, initEventsPageEvents } from './pages/events.js';
import { renderAchievementsPage, initAchievementsPageEvents } from './pages/achievements.js';
import { renderCertificatesVerifyPage, initCertificatesVerifyPageEvents } from './pages/certificatesVerify.js';
import { renderContactPage, initContactPageEvents } from './pages/contact.js';
import { renderLoginPage, initLoginPageEvents } from './pages/login.js';
import { renderRegisterPage, initRegisterPageEvents } from './pages/register.js';
import { renderActivatePage, initActivatePageEvents } from './pages/activate.js';

// Portal Pages
import { renderDashboardPage, initDashboardPageEvents } from './pages/portal/dashboard.js';
import { renderMyCoursesPage, initMyCoursesPageEvents } from './pages/portal/myCourses.js';
import { renderMyAttendancePage, initMyAttendancePageEvents } from './pages/portal/myAttendance.js';
import { renderMyCertificatesPage, initMyCertificatesPageEvents } from './pages/portal/myCertificates.js';
import { renderMyAwardsPage, initMyAwardsPageEvents } from './pages/portal/myAwards.js';
import { renderMyProjectsPage, initMyProjectsPageEvents } from './pages/portal/myProjects.js';
import { renderMyProfilePage, initMyProfilePageEvents } from './pages/portal/myProfile.js';
import { renderChangePasswordPage, initChangePasswordPageEvents } from './pages/portal/changePassword.js';

// Admin & President Pages
import { renderAdminLoginPage, initAdminLoginPageEvents } from './pages/admin/adminLogin.js';
import { renderAdminDashboardPage, initAdminDashboardPageEvents } from './pages/admin/adminDashboard.js';
import { renderPresidentDashboardPage, initPresidentDashboardPageEvents } from './pages/president/presidentDashboard.js';
import {
  ADMIN_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_DASHBOARD_PATH,
  PRESIDENT_PATH,
  PRESIDENT_LOGIN_PATH,
  PRESIDENT_DASHBOARD_PATH,
  isAdminRoute,
  isAdminDashboardRoute,
  isAdminLoginRoute,
  isPresidentRoute,
  isPresidentDashboardRoute
} from '../config/adminRoute.js';

let isRendering = false;

export function bindNavigationLinks(container = document) {
  container.querySelectorAll('[data-nav]').forEach(el => {
    el.onclick = (e) => {
      e.preventDefault();
      const target = el.getAttribute('data-nav');
      if (target) router.navigate(target);
    };
  });
}

// Global delegated listener so any element with data-nav (even asynchronously loaded) works reliably
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const navEl = e.target.closest('[data-nav]');
    if (navEl) {
      e.preventDefault();
      const target = navEl.getAttribute('data-nav');
      if (target) {
        router.navigate(target);
      }
    }
  });
}

function renderCurrentRoute() {
  if (isRendering) return;
  isRendering = true;

  const root = document.getElementById('root');
  if (!root) {
    isRendering = false;
    return;
  }

  const currentPath = router.getCurrentPath();
  const isAuthenticated = authState.isAuthenticated;
  const isAdmin = authState.isAdmin;
  const isPresident = authState.isPresident;
  const isLoading = authState.isLoading;
  const member = authState.member;

  const isPortalRoute = currentPath.startsWith('/portal');
  const isAdminDashboard = isAdminDashboardRoute(currentPath);
  const isPresDashboard = isPresidentDashboardRoute(currentPath);

  // If initial profile check is still pending and a token is stored, display clean loading state
  // to avoid flashing the login screen or making premature redirects
  if (isLoading && getStoredToken()) {
    if (isPortalRoute || isAdminDashboard || isPresDashboard) {
      root.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)] font-sans">
          <div class="flex flex-col items-center gap-3">
            <div class="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs font-mono uppercase tracking-wider text-[var(--text)]/60">Verifying session...</p>
          </div>
        </div>
      `;
      isRendering = false;
      return;
    }
  }

  // Route protection
  if (!isLoading) {
    if (isPortalRoute) {
      if (!isAuthenticated || member?.status === 'pending' || member?.status === 'rejected') {
        isRendering = false;
        router.navigate('/login');
        return;
      }
    }


    if (isAdminRoute(currentPath)) {
      if (isAdminLoginRoute(currentPath)) {
        if (isAuthenticated) {
          if (isPresident) {
            isRendering = false;
            router.navigate(PRESIDENT_DASHBOARD_PATH);
            return;
          } else if (isAdmin) {
            isRendering = false;
            router.navigate(ADMIN_DASHBOARD_PATH);
            return;
          }
        }
      } else if (isPresDashboard) {
        if (!isAuthenticated) {
          isRendering = false;
          router.navigate(ADMIN_LOGIN_PATH);
          return;
        } else if (!isPresident) {
          // Lower admin attempted to access President suite -> redirect to Staff Desk
          isRendering = false;
          router.navigate(ADMIN_DASHBOARD_PATH);
          return;
        }
      } else if (!isAuthenticated || (!isAdmin && !isPresident)) {
        isRendering = false;
        router.navigate(ADMIN_LOGIN_PATH);
        return;
      }
    }
  }

  // President Dashboard special standalone view
  if (isPresDashboard && isAuthenticated && isPresident) {
    root.innerHTML = `
      <div class="min-h-screen bg-[var(--bg)] font-sans text-[var(--text)] selection:bg-amber-500/25 selection:text-amber-900">
        ${renderPresidentDashboardPage()}
      </div>
      <div id="cert-modal-container">
        ${renderCertificateModal(modalState.activeCertificate)}
      </div>
    `;
    if (modalState.activeCertificate) {
      initCertificateModalEvents(modalState.activeCertificate);
    }
    initPresidentDashboardPageEvents();
    bindNavigationLinks(root);
    isRendering = false;
    return;
  }

  // Admin Dashboard special standalone view
  if (isAdminDashboard && isAuthenticated && (isAdmin || isPresident)) {
    root.innerHTML = `
      <div class="min-h-screen bg-[var(--bg)] font-sans text-[var(--text)] selection:bg-[#FC6454]/25 selection:text-[#282828] dark:selection:bg-[#2F8068]/35 dark:selection:text-[#F1F7F4]">
        ${renderAdminDashboardPage()}
      </div>
      <div id="cert-modal-container">
        ${renderCertificateModal(modalState.activeCertificate)}
      </div>
    `;
    if (modalState.activeCertificate) {
      initCertificateModalEvents(modalState.activeCertificate);
    }
    if (typeof initAdminDashboardPageEvents === 'function') {
      initAdminDashboardPageEvents();
    }
    bindNavigationLinks(root);
    isRendering = false;
    return;
  }

  // Page resolution & event init function
  let pageHtml = '';
  let initEventsFn = null;

  if (isAdminLoginRoute(currentPath)) {
    pageHtml = renderAdminLoginPage();
    initEventsFn = initAdminLoginPageEvents;
  } else if (isPresDashboard) {
    if (!isAuthenticated || !isPresident) {
      pageHtml = renderAdminLoginPage();
      initEventsFn = initAdminLoginPageEvents;
    } else {
      pageHtml = renderPresidentDashboardPage();
      initEventsFn = initPresidentDashboardPageEvents;
    }
  } else if (isAdminDashboardRoute(currentPath)) {
    if (!isAuthenticated || (!isAdmin && !isPresident)) {
      pageHtml = renderAdminLoginPage();
      initEventsFn = initAdminLoginPageEvents;
    } else {
      pageHtml = renderAdminDashboardPage();
      initEventsFn = initAdminDashboardPageEvents;
    }
  } else if (currentPath.startsWith('/courses/') && currentPath.split('?')[0].replace('/courses/', '').trim()) {
    const courseId = currentPath.split('?')[0].replace('/courses/', '').trim();
    pageHtml = renderCourseDetailPage(courseId);
  } else if (currentPath.startsWith('/certificates')) {
    const urlParams = new URLSearchParams(currentPath.split('?')[1] || '');
    const certId = urlParams.get('id') || '';
    pageHtml = renderCertificatesVerifyPage(certId);
    initEventsFn = initCertificatesVerifyPageEvents;
  } else if (currentPath.startsWith('/activate')) {
    const urlParams = new URLSearchParams(currentPath.split('?')[1] || '');
    const code = urlParams.get('code') || urlParams.get('token') || '';
    pageHtml = renderActivatePage(code);
    initEventsFn = initActivatePageEvents;
  } else {
    switch (currentPath) {
      case '/':
        pageHtml = renderHomePage();
        initEventsFn = initHomePageEvents;
        break;
      case '/about':
        pageHtml = renderAboutPage();
        break;
      case '/courses':
        pageHtml = renderCoursesPage();
        initEventsFn = initCoursesPageEvents;
        break;
      case '/projects':
        pageHtml = renderProjectsPage();
        initEventsFn = initProjectsPageEvents;
        break;
      case '/events':
        pageHtml = renderEventsPage();
        initEventsFn = initEventsPageEvents;
        break;
      case '/achievements':
        pageHtml = renderAchievementsPage();
        initEventsFn = initAchievementsPageEvents;
        break;
      case '/contact':
        pageHtml = renderContactPage();
        initEventsFn = initContactPageEvents;
        break;
      case '/login':
        pageHtml = renderLoginPage();
        initEventsFn = initLoginPageEvents;
        break;
      case '/register':
        pageHtml = renderRegisterPage();
        initEventsFn = initRegisterPageEvents;
        break;
      case '/portal':
      case '/portal/dashboard':
        pageHtml = renderDashboardPage();
        initEventsFn = initDashboardPageEvents;
        break;
      case '/portal/courses':
        pageHtml = renderMyCoursesPage();
        initEventsFn = initMyCoursesPageEvents;
        break;
      case '/portal/attendance':
        pageHtml = renderMyAttendancePage();
        initEventsFn = initMyAttendancePageEvents;
        break;
      case '/portal/certificates':
        pageHtml = renderMyCertificatesPage();
        initEventsFn = initMyCertificatesPageEvents;
        break;
      case '/portal/awards':
        pageHtml = renderMyAwardsPage();
        initEventsFn = initMyAwardsPageEvents;
        break;
      case '/portal/projects':
        pageHtml = renderMyProjectsPage();
        initEventsFn = initMyProjectsPageEvents;
        break;
      case '/portal/profile':
        pageHtml = renderMyProfilePage();
        initEventsFn = initMyProfilePageEvents;
        break;
      case '/portal/change-password':
        pageHtml = renderChangePasswordPage();
        initEventsFn = initChangePasswordPageEvents;
        break;
      default:
        pageHtml = renderHomePage();
        initEventsFn = initHomePageEvents;
        break;
    }
  }

  // Public & Portal Layout
  root.innerHTML = `
    <div class="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] font-sans selection:bg-[#FC6454]/25 selection:text-[#282828] dark:selection:bg-[#2F8068]/35 dark:selection:text-[#F1F7F4] transition-colors duration-200">
      ${renderNavbar(currentPath)}

      ${isPortalRoute && isAuthenticated && member?.status !== 'pending' && member?.status !== 'rejected' ? `
        <div class="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
          ${renderPortalSidebar(currentPath)}
          <main class="flex-1 min-w-0 bg-[var(--surface)] dark:bg-[#102B22] rounded-lg border border-[var(--color-border)] dark:border-[#25473C] p-6 sm:p-8 shadow-xs">
            ${pageHtml}
          </main>
        </div>
      ` : `
        <main class="flex-1">${pageHtml}</main>
      `}

      ${renderFooter()}

      <div id="cert-modal-container">
        ${renderCertificateModal(modalState.activeCertificate)}
      </div>
    </div>
  `;

  // Attach navbar events
  initNavbarEvents();

  // Attach certificate modal events if open
  if (modalState.activeCertificate) {
    initCertificateModalEvents(modalState.activeCertificate);
  }

  // Attach page events
  if (typeof initEventsFn === 'function') {
    initEventsFn();
  }

  // Bind all data-nav clicks
  bindNavigationLinks(root);

  isRendering = false;
}

// Global initialization
export async function initApp() {
  let speedInsights = null;
  try {
    speedInsights = injectSpeedInsights();
  } catch (err) {
    console.debug('Speed insights init:', err);
  }

  themeState.apply();
  router.init();

  events.on('routeChange', () => {
    if (speedInsights && typeof speedInsights.setRoute === 'function') {
      try {
        speedInsights.setRoute(window.location.pathname);
      } catch (_) {}
    }
    renderCurrentRoute();
  });

  events.on('authChange', () => {
    renderCurrentRoute();
  });

  events.on('themeChange', () => {
    themeState.apply();
  });

  events.on('modalChange', (cert) => {
    const modalBox = document.getElementById('cert-modal-container');
    if (modalBox) {
      modalBox.innerHTML = renderCertificateModal(cert);
      if (cert) initCertificateModalEvents(cert);
    }
  });

  // Initial render immediately so public pages render in 0ms without waiting for network round-trips
  renderCurrentRoute();

  // Verify and refresh session in background — when resolved, 'authChange' event seamlessly updates navigation/portal
  authState.refreshProfile().catch(err => {
    console.debug('Session check completed:', err);
  });
}

// Auto-run if imported directly
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
