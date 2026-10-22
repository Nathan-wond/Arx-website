export const ADMIN_PATH = '/71354caa6bea2251';
export const ADMIN_LOGIN_PATH = '/71354caa6bea2251/login';
export const ADMIN_DASHBOARD_PATH = '/71354caa6bea2251/dashboard';
export const ADMIN_APPLICATIONS_PATH = '/71354caa6bea2251/applications';

export const PRESIDENT_PATH = '/president';
export const PRESIDENT_LOGIN_PATH = '/president/login';
export const PRESIDENT_DASHBOARD_PATH = '/president/dashboard';

export function isPresidentRoute(pathname) {
  if (!pathname) return false;
  const clean = pathname.split('?')[0].replace(/\/+$/, '');
  return (
    clean === PRESIDENT_PATH ||
    clean === PRESIDENT_LOGIN_PATH ||
    clean === PRESIDENT_DASHBOARD_PATH ||
    clean.startsWith('/president/')
  );
}

export function isPresidentDashboardRoute(pathname) {
  if (!pathname) return false;
  const clean = pathname.split('?')[0].replace(/\/+$/, '');
  return clean === PRESIDENT_PATH || clean === PRESIDENT_DASHBOARD_PATH;
}

export function isPresidentLoginRoute(pathname) {
  if (!pathname) return false;
  const clean = pathname.split('?')[0].replace(/\/+$/, '');
  return clean === PRESIDENT_LOGIN_PATH;
}

export function isAdminRoute(pathname) {
  if (!pathname) return false;
  const clean = pathname.split('?')[0].replace(/\/+$/, '');
  return (
    clean === ADMIN_PATH ||
    clean === ADMIN_LOGIN_PATH ||
    clean === ADMIN_DASHBOARD_PATH ||
    clean === ADMIN_APPLICATIONS_PATH ||
    clean.startsWith('/71354caa6bea2251/') ||
    clean === '/admin' ||
    clean === '/admin/login' ||
    clean === '/admin/dashboard' ||
    clean === '/admin/applications' ||
    clean.startsWith('/admin/') ||
    isPresidentRoute(pathname)
  );
}

export function isAdminDashboardRoute(pathname) {
  if (!pathname) return false;
  const clean = pathname.split('?')[0].replace(/\/+$/, '');
  return (
    clean === ADMIN_PATH ||
    clean === ADMIN_DASHBOARD_PATH ||
    clean === '/admin' ||
    clean === '/admin/dashboard'
  );
}

export function isAdminLoginRoute(pathname) {
  if (!pathname) return false;
  const clean = pathname.split('?')[0].replace(/\/+$/, '');
  return (
    clean === ADMIN_LOGIN_PATH ||
    clean === '/admin/login' ||
    clean === PRESIDENT_LOGIN_PATH
  );
}
