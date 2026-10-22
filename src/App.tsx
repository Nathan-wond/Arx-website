import React, { useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { RouterProvider, useRouter } from './context/RouterContext.tsx';
import { ModalProvider } from './context/ModalContext.tsx';

import Navbar from './components/Navbar.tsx';
import Footer from './components/Footer.tsx';
import PortalSidebar from './components/PortalSidebar.tsx';
import CertificateModal from './components/CertificateModal.tsx';

// Public pages
import HomePage from './pages/HomePage.tsx';
import AboutPage from './pages/AboutPage.tsx';
import CoursesPage from './pages/CoursesPage.tsx';
import CourseDetailPage from './pages/CourseDetailPage.tsx';
import ProjectsPage from './pages/ProjectsPage.tsx';
import EventsPage from './pages/EventsPage.tsx';
import CertificatesVerifyPage from './pages/CertificatesVerifyPage.tsx';
import ContactPage from './pages/ContactPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import ActivatePage from './pages/ActivatePage.tsx';

// Portal pages
import DashboardPage from './pages/portal/DashboardPage.tsx';
import MyCoursesPage from './pages/portal/MyCoursesPage.tsx';
import MyAttendancePage from './pages/portal/MyAttendancePage.tsx';
import MyCertificatesPage from './pages/portal/MyCertificatesPage.tsx';
import MyAwardsPage from './pages/portal/MyAwardsPage.tsx';
import MyProjectsPage from './pages/portal/MyProjectsPage.tsx';
import MyProfilePage from './pages/portal/MyProfilePage.tsx';
import ChangePasswordPage from './pages/portal/ChangePasswordPage.tsx';

// Admin pages
import AdminLoginPage from './pages/admin/AdminLoginPage.tsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.tsx';
import PresidentDashboardPage from './pages/president/PresidentDashboardPage.tsx';

import {
  ADMIN_LOGIN_PATH,
  ADMIN_DASHBOARD_PATH,
  PRESIDENT_LOGIN_PATH,
  PRESIDENT_DASHBOARD_PATH,
  isAdminRoute,
  isAdminDashboardRoute,
  isAdminLoginRoute,
  isPresidentRoute,
  isPresidentDashboardRoute
} from './config/adminRoute.js';

const AppContent: React.FC = () => {
  const { currentPath, pathname, searchParams, navigate } = useRouter();
  const { isAuthenticated, isAdmin, isPresident, isLoading, member } = useAuth();

  const isPortal = pathname.startsWith('/portal');
  const isAdminDashboard = isAdminDashboardRoute(pathname);
  const isPresDashboard = isPresidentDashboardRoute(pathname);

  // Route protection
  useEffect(() => {
    if (isLoading) return;

    if (isPortal) {
      if (!isAuthenticated || member?.status === 'pending' || member?.status === 'rejected') {
        navigate('/login');
      }
    } else if (isAdminRoute(pathname)) {
      if (isAdminLoginRoute(pathname)) {
        if (isAuthenticated) {
          if (isPresident) {
            navigate(PRESIDENT_DASHBOARD_PATH);
          } else if (isAdmin) {
            navigate(ADMIN_DASHBOARD_PATH);
          }
        }
      } else if (isPresDashboard) {
        if (!isAuthenticated) {
          navigate(ADMIN_LOGIN_PATH);
        } else if (!isPresident) {
          navigate(ADMIN_DASHBOARD_PATH);
        }
      } else if (!isAuthenticated || (!isAdmin && !isPresident)) {
        navigate(ADMIN_LOGIN_PATH);
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, isPresident, member, isPortal, pathname, isPresDashboard, navigate]);

  // Support global delegated clicks on [data-nav] elements
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const navEl = target?.closest('[data-nav]');
      if (navEl) {
        e.preventDefault();
        const route = navEl.getAttribute('data-nav');
        if (route) {
          navigate(route);
        }
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [navigate]);

  // Admin routes isolation (Standalone admin layout: never render public Navbar or Footer)
  if (isAdminRoute(pathname)) {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7EFE8] dark:bg-[#071A14] text-[#282828] dark:text-white font-sans">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#FC6454] dark:border-[#2F8068] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono tracking-wider uppercase text-[#282828]/60 dark:text-white">
              Authenticating Administrative Console...
            </span>
          </div>
        </div>
      );
    }

    if (isPresDashboard && isAuthenticated && isPresident) {
      return (
        <div className="min-h-screen bg-[var(--bg)] font-sans text-[var(--text)] selection:bg-amber-500/25 selection:text-amber-900">
          <PresidentDashboardPage />
          <CertificateModal />
        </div>
      );
    }

    if (isAdminDashboardRoute(pathname) && isAuthenticated && (isAdmin || isPresident)) {
      return (
        <div className="min-h-screen bg-[var(--bg)] font-sans text-[var(--text)] selection:bg-[#FC6454]/25 selection:text-[#282828] dark:selection:bg-[#2F8068]/35 dark:selection:text-[#F1F7F4]">
          <AdminDashboardPage />
          <CertificateModal />
        </div>
      );
    }

    // Admin login or unauthorized fallback - cleanly isolated
    return (
      <div className="min-h-screen bg-[#F7EFE8] dark:bg-[#071A14] font-sans text-[#282828] dark:text-white selection:bg-[#FC6454]/25 selection:text-[#282828] dark:selection:bg-[#2F8068]/35 dark:selection:text-[#F1F7F4]">
        <AdminLoginPage />
        <CertificateModal />
      </div>
    );
  }

  // Render Page Content
  const renderPage = () => {

    if (pathname.startsWith('/courses/')) {
      const courseId = pathname.replace('/courses/', '').trim();
      if (courseId) {
        return <CourseDetailPage courseId={courseId} />;
      }
    }

    if (pathname === '/certificates') {
      const certId = searchParams.get('id') || '';
      return <CertificatesVerifyPage initialId={certId} />;
    }

    if (pathname === '/activate') {
      const code = searchParams.get('code') || searchParams.get('token') || '';
      return <ActivatePage initialCode={code} />;
    }

    if (isPortal) {
      switch (pathname) {
        case '/portal':
        case '/portal/dashboard':
          return <DashboardPage />;
        case '/portal/courses':
          return <MyCoursesPage />;
        case '/portal/attendance':
          return <MyAttendancePage />;
        case '/portal/certificates':
          return <MyCertificatesPage />;
        case '/portal/awards':
          return <MyAwardsPage />;
        case '/portal/projects':
          return <MyProjectsPage />;
        case '/portal/profile':
          return <MyProfilePage />;
        case '/portal/change-password':
          return <ChangePasswordPage />;
        default:
          return <DashboardPage />;
      }
    }

    switch (pathname) {
      case '/':
        return <HomePage />;
      case '/about':
        return <AboutPage />;
      case '/courses':
        return <CoursesPage />;
      case '/projects':
        return <ProjectsPage />;
      case '/events':
        return <EventsPage />;
      case '/contact':
        return <ContactPage />;
      case '/login':
        return <LoginPage />;
      case '/register':
        return <RegisterPage />;
      default:
        return <HomePage />;
    }
  };

  if (isPortal) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg)] font-sans text-[var(--text)] selection:bg-[#FC6454]/25 selection:text-[#282828] dark:selection:bg-[#2F8068]/35 dark:selection:text-[#F1F7F4]">
        <Navbar />
        <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 gap-6">
          <PortalSidebar />
          <main className="flex-1 min-w-0">{renderPage()}</main>
        </div>
        <Footer />
        <CertificateModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] font-sans text-[var(--text)] selection:bg-[#FC6454]/25 selection:text-[#282828] dark:selection:bg-[#2F8068]/35 dark:selection:text-[#F1F7F4]">
      <Navbar />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
      <CertificateModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider>
          <ModalProvider>
            <AppContent />
          </ModalProvider>
        </RouterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
