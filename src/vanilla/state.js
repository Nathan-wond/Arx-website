import { api, getStoredToken, setStoredToken, clearStoredToken } from '../services/api.js';
import { ADMIN_DASHBOARD_PATH, ADMIN_LOGIN_PATH, isAdminDashboardRoute } from '../config/adminRoute.js';

class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }
  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }
  off(event, fn) {
    if (this.listeners.has(event)) this.listeners.get(event).delete(fn);
  }
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(fn => fn(data));
    }
  }
}

export const events = new EventEmitter();

// --- THEME STATE ---
export const themeState = {
  get theme() {
    try {
      const saved = localStorage.getItem('arx_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'light';
  },
  setTheme(theme) {
    try {
      localStorage.setItem('arx_theme', theme);
    } catch {}
    this.apply();
    events.emit('themeChange', theme);
  },
  toggleTheme() {
    const next = this.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  },
  apply() {
    const t = this.theme;
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    }
  }
};

// --- AUTH STATE ---
export const authState = {
  member: null,
  isLoading: true,
  get isAuthenticated() {
    return !!this.member;
  },
  get isAdmin() {
    return this.member?.role === 'admin' || this.member?.role === 'president';
  },
  get isPresident() {
    return this.member?.role === 'president';
  },
  get isLowerAdmin() {
    return this.member?.role === 'admin';
  },
  async refreshProfile() {
    const token = getStoredToken();
    if (!token) {
      this.member = null;
      this.isLoading = false;
      events.emit('authChange', this);
      return null;
    }
    try {
      const response = await api.getMe();
      if (response && response.member) {
        this.member = response.member;
      } else {
        clearStoredToken();
        this.member = null;
      }
    } catch {
      clearStoredToken();
      this.member = null;
    } finally {
      this.isLoading = false;
      events.emit('authChange', this);
    }
    return this.member;
  },
  async login(memberId, password) {
    const res = await api.login({ memberId, password });
    if (!res.token) throw new Error('Authentication failed: server did not return a session token.');
    setStoredToken(res.token);
    this.member = res.member;
    events.emit('authChange', this);
    return { success: true, member: res.member };
  },
  async adminLogin(memberId, password) {
    const res = await api.adminLogin({ memberId, password });
    if (!res.token) throw new Error('Admin authentication failed: server did not return a session token.');
    setStoredToken(res.token);
    this.member = res.member;
    events.emit('authChange', this);
    return { success: true, member: res.member, redirectUrl: res.redirectUrl };
  },
  async register(params) {
    const res = await api.register(params);
    if (res.token) {
      setStoredToken(res.token);
      this.member = res.member;
      events.emit('authChange', this);
    }
    return {
      success: true,
      memberId: res.memberId,
      member: res.member,
      course: res.course,
      enrollment: res.enrollment,
      activationUrl: res.activationUrl || (res.activation ? res.activation.activationUrl : undefined),
      activationToken: res.activationToken || (res.activation ? res.activation.token : undefined),
      activationCode: res.activationCode || (res.activation ? res.activation.activationCode : undefined),
      telegramBotUsername: res.telegramBotUsername || 'ARXITCLUB_bot',
      telegramBotUrl: res.telegramBotUrl || 'https://t.me/ARXITCLUB_bot',
      telegramChannelUrl: res.telegramChannelUrl || 'https://t.me/arxitclub',
      telegramChannelName: res.telegramChannelName || '@arxitclub'
    };
  },
  logout() {
    api.logout();
    clearStoredToken();
    this.member = null;
    events.emit('authChange', this);
  },
  updateMemberState(updatedMember) {
    this.member = updatedMember;
    events.emit('authChange', this);
  }
};

// --- ROUTER STATE ---
export const router = {
  getCurrentPath() {
    const realSearch = window.location.search;
    if (realSearch) {
      const params = new URLSearchParams(realSearch);
      const start = params.get('start');
      if (start) {
        const hash = `/activate?code=${encodeURIComponent(start)}`;
        window.location.hash = hash;
        return hash;
      }
    }
    if (window.location.hash) {
      return window.location.hash.slice(1) || '/';
    }
    return '/';
  },
  navigate(path) {
    if (window.location.hash.slice(1) === path) {
      events.emit('routeChange', path);
    } else {
      window.location.hash = path;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
  init() {
    window.addEventListener('hashchange', () => {
      const path = this.getCurrentPath();
      events.emit('routeChange', path);
    });
  }
};

// --- CERTIFICATE MODAL STATE ---
export const modalState = {
  activeCertificate: null,
  async openCertificateModal(certId) {
    try {
      const res = await api.getCertificateById(certId);
      if (res.certificate) {
        this.activeCertificate = res.certificate;
        events.emit('modalChange', this.activeCertificate);
      }
    } catch (err) {
      console.error('[CertModal] Failed to fetch certificate', certId, err);
    }
  },
  closeCertificateModal() {
    this.activeCertificate = null;
    events.emit('modalChange', null);
  }
};
