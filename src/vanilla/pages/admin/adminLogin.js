import { authState, router } from '../../state.js';
import { api } from '../../../services/api.js';
import { icon } from '../../icons.js';
import { ADMIN_DASHBOARD_PATH, PRESIDENT_DASHBOARD_PATH } from '../../../config/adminRoute.js';

let selectedRoleTab = 'president'; // 'president' | 'officer'
let memberId = '';
let password = '';
let newPassword = '';
let confirmNewPassword = '';
let loading = false;
let errorMessage = null;
let mustChangePasswordStep = false;
let cachedLoginResponse = null;

export function renderAdminLoginPage() {
  const isPresident = selectedRoleTab === 'president';

  return `
    <div id="admin-login-root" class="min-h-[85vh] flex flex-col justify-center max-w-lg mx-auto px-4 py-8 sm:py-12 space-y-6">
      <div class="flex items-center justify-between">
        <button
          data-nav="/"
          class="inline-flex items-center gap-2 text-xs text-[#282828]/70 hover:text-[#282828] dark:text-white dark:hover:text-[#6BB89E] cursor-pointer transition-colors border-0 bg-transparent p-2 min-h-[44px]">
          ${icon('ArrowLeft', 'w-4 h-4')} Back to Public Site
        </button>

        <span class="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-3 py-1 rounded-full ${
          isPresident
            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
            : 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/30'
        }">
          ${isPresident ? 'EXECUTIVE CLEARANCE' : 'STAFF DESK'}
        </span>
      </div>

      <!-- Header -->
      <div class="text-center space-y-2">
        <div class="w-14 h-14 rounded-2xl ${
          isPresident
            ? 'bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent border border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-amber-500/10'
            : 'bg-gradient-to-br from-[#FC6454]/20 via-[#2F8068]/10 to-transparent border border-[#282828]/15 dark:border-[#25473C] text-[#FC6454] dark:text-[#6BB89E]'
        } shadow-sm flex items-center justify-center mx-auto p-2 transition-all duration-300">
          ${isPresident ? icon('Crown', 'w-7 h-7') : icon('ShieldCheck', 'w-7 h-7')}
        </div>
        
        <h1 class="text-2xl sm:text-3xl font-extrabold text-[#282828] dark:text-white tracking-tight font-sans">
          ${mustChangePasswordStep ? 'Initial Security Passphrase Setup' : (isPresident ? 'Presidential Executive Suite' : 'Club Operations Desk')}
        </h1>
        <p class="text-xs text-[#282828]/70 dark:text-white max-w-sm mx-auto leading-relaxed">
          ${
            mustChangePasswordStep
              ? 'To protect system integrity, you must replace the initial temporary password with your permanent high-entropy password.'
              : isPresident
                ? 'Master console with absolute control over club governance, staff administrators, student records, and system security.'
                : 'Administrative desk for operations officers, attendance records, application reviews, and student project evaluation.'
          }
        </p>
      </div>

      ${!mustChangePasswordStep ? `
        <!-- Role Selector Tabs -->
        <div class="grid grid-cols-2 p-1.5 rounded-xl bg-[#282828]/5 dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] text-xs font-semibold gap-1.5">
          <button
            type="button"
            id="tab-btn-president"
            class="flex items-center justify-center gap-2 py-3 px-3 rounded-lg transition-all cursor-pointer border-0 min-h-[44px] ${
              isPresident
                ? 'bg-white dark:bg-[#15362B] text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                : 'text-[#282828]/60 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] bg-transparent'
            }">
            ${icon('Crown', 'w-4 h-4')}
            <span>Presidential (adminp)</span>
          </button>
          <button
            type="button"
            id="tab-btn-officer"
            class="flex items-center justify-center gap-2 py-3 px-3 rounded-lg transition-all cursor-pointer border-0 min-h-[44px] ${
              !isPresident
                ? 'bg-white dark:bg-[#15362B] text-[#FC6454] dark:text-[#6BB89E] shadow-xs font-bold'
                : 'text-[#282828]/60 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] bg-transparent'
            }">
            ${icon('Shield', 'w-4 h-4')}
            <span>Officer Desk (admino)</span>
          </button>
        </div>
      ` : ''}

      <!-- Login / Password Change Card -->
      <div class="p-6 sm:p-8 rounded-2xl border ${
        isPresident
          ? 'border-amber-500/30 bg-gradient-to-b from-amber-500/[0.03] to-white dark:to-[#102B22]'
          : 'border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22]'
      } shadow-md transition-all">
        ${errorMessage ? `
          <div class="mb-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-3 animate-in fade-in">
            ${icon('AlertCircle', 'w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5')}
            <span class="leading-relaxed">${errorMessage}</span>
          </div>
        ` : ''}

        ${mustChangePasswordStep ? `
          <!-- Must Change Password Form -->
          <form id="admin-must-change-pwd-form" class="space-y-4">
            <div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
              <strong>First Login Detected:</strong> Enter a new, private security passphrase (minimum 6 characters) to secure your account.
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#282828]/80 dark:text-white mb-1.5">
                New Security Passphrase
              </label>
              <input
                id="admin-new-pwd-input"
                type="password"
                required
                minlength="6"
                placeholder="Enter new strong passphrase..."
                class="w-full px-4 py-3 rounded-lg border border-[#282828]/20 dark:border-[#294B40] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40 bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white min-h-[44px]" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#282828]/80 dark:text-white mb-1.5">
                Confirm New Passphrase
              </label>
              <input
                id="admin-confirm-pwd-input"
                type="password"
                required
                minlength="6"
                placeholder="Re-enter new passphrase..."
                class="w-full px-4 py-3 rounded-lg border border-[#282828]/20 dark:border-[#294B40] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40 bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white min-h-[44px]" />
            </div>

            <div class="pt-2">
              <button
                id="admin-save-new-pwd-btn"
                type="submit"
                ${loading ? 'disabled' : ''}
                class="w-full inline-flex items-center justify-center font-sans tracking-tight font-bold transition-all duration-200 rounded-lg min-h-[46px] px-4 text-xs sm:text-sm bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0">
                ${loading ? (
                  `<span class="inline-flex items-center gap-2">${icon('Loader2', 'w-4 h-4 animate-spin')} Securing Account...</span>`
                ) : (
                  'Save Passphrase & Enter Dashboard'
                )}
              </button>
            </div>
          </form>
        ` : `
          <!-- Standard Admin Login Form -->
          <form id="admin-login-form" class="space-y-4">
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-semibold text-[#282828]/80 dark:text-white">
                  ${isPresident ? 'Presidential Administrator Username' : 'Officer Administrator Username'}
                </label>
              </div>
              <input
                id="admin-login-id"
                type="text"
                required
                autocomplete="username"
                placeholder="${isPresident ? 'adminp' : 'admino'}"
                value="${memberId || (isPresident ? 'adminp' : 'admino')}"
                class="w-full px-4 py-3 rounded-lg border border-[#282828]/20 dark:border-[#294B40] text-sm font-mono focus:outline-none focus:ring-2 ${
                  isPresident
                    ? 'focus:ring-amber-500/40 focus:border-amber-500'
                    : 'focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30'
                } bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white transition-all min-h-[44px]" />
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-semibold text-[#282828]/80 dark:text-white">
                  Security Passphrase
                </label>
              </div>
              <input
                id="admin-login-pwd"
                type="password"
                required
                autocomplete="current-password"
                placeholder="Enter your passphrase"
                value="${password}"
                class="w-full px-4 py-3 rounded-lg border border-[#282828]/20 dark:border-[#294B40] text-sm font-mono focus:outline-none focus:ring-2 ${
                  isPresident
                    ? 'focus:ring-amber-500/40 focus:border-amber-500'
                    : 'focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30'
                } bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white transition-all min-h-[44px]" />
            </div>

            <div class="pt-2">
              <button
                id="admin-login-submit-btn"
                type="submit"
                ${loading ? 'disabled' : ''}
                class="w-full inline-flex items-center justify-center font-sans tracking-tight select-none transition-all duration-200 rounded-lg min-h-[46px] px-4 text-xs sm:text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 ${
                  isPresident
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold shadow-md shadow-amber-500/20'
                    : 'bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:text-white dark:hover:bg-[#3A9277] font-semibold shadow-xs'
                }">
                ${loading ? (
                  `<span class="inline-flex items-center gap-2">${icon('Loader2', 'w-4 h-4 animate-spin')} Authenticating Clearance...</span>`
                ) : (
                  isPresident ? 'Enter Presidential Suite (adminp)' : 'Sign In as Officer (admino)'
                )}
              </button>
            </div>
          </form>
        `}

        <!-- Access Rights Notice -->
        <div class="mt-6 pt-5 border-t border-[#282828]/10 dark:border-[#25473C] text-[11px] text-[#282828]/60 dark:text-white space-y-1.5">
          <div class="flex items-center gap-1.5 font-semibold text-[#282828] dark:text-white">
            ${icon('Lock', 'w-3.5 h-3.5 text-amber-500')}
            <span>${isPresident ? 'Presidential Authority: adminp' : 'Officer Authority: admino'}</span>
          </div>
          <p class="leading-relaxed">
            ${
              isPresident
                ? 'Username: adminp | Role: presidential | Holds supreme authority: full database snapshot export, administrator access management, team governance, and security credentials.'
                : 'Username: admino | Role: officer | Scoped authority for daily club management: membership applications, course records, attendance tracking, and student reviews.'
            }
          </p>
        </div>
      </div>
    </div>
  `;
}

function updateDOM() {
  const root = document.getElementById('admin-login-root');
  if (root) {
    const parent = root.parentElement;
    if (parent) {
      parent.innerHTML = renderAdminLoginPage();
      attachListeners();
    }
  }
}

export function initAdminLoginPageEvents() {
  attachListeners();
}

function attachListeners() {
  const presTab = document.getElementById('tab-btn-president');
  if (presTab) {
    presTab.onclick = () => {
      selectedRoleTab = 'president';
      memberId = 'adminp';
      password = '';
      errorMessage = null;
      updateDOM();
    };
  }

  const officerTab = document.getElementById('tab-btn-officer');
  if (officerTab) {
    officerTab.onclick = () => {
      selectedRoleTab = 'officer';
      memberId = 'admino';
      password = '';
      errorMessage = null;
      updateDOM();
    };
  }

  // Must change password form submit
  const changePwdForm = document.getElementById('admin-must-change-pwd-form');
  if (changePwdForm) {
    changePwdForm.onsubmit = async (e) => {
      e.preventDefault();
      const newPInput = document.getElementById('admin-new-pwd-input');
      const confPInput = document.getElementById('admin-confirm-pwd-input');
      const nPwd = newPInput?.value || '';
      const cPwd = confPInput?.value || '';

      if (nPwd !== cPwd) {
        errorMessage = 'Passwords do not match. Please re-enter both fields.';
        updateDOM();
        return;
      }
      if (nPwd.length < 6) {
        errorMessage = 'New password must be at least 6 characters long.';
        updateDOM();
        return;
      }

      loading = true;
      errorMessage = null;
      updateDOM();

      try {
        await api.changeAdminPassword({ currentPassword: password, newPassword: nPwd });
        if (cachedLoginResponse?.member?.role === 'president' || cachedLoginResponse?.redirectUrl === '/president') {
          router.navigate(PRESIDENT_DASHBOARD_PATH);
        } else {
          router.navigate(ADMIN_DASHBOARD_PATH);
        }
      } catch (err) {
        errorMessage = err.message || 'Failed to update password. Please try again.';
      } finally {
        loading = false;
        updateDOM();
      }
    };
  }

  const formEl = document.getElementById('admin-login-form');
  if (formEl) {
    formEl.onsubmit = async (e) => {
      e.preventDefault();
      const midInput = document.getElementById('admin-login-id');
      const pwdInput = document.getElementById('admin-login-pwd');

      memberId = midInput ? midInput.value.trim() : '';
      password = pwdInput ? pwdInput.value : '';

      loading = true;
      errorMessage = null;
      updateDOM();

      try {
        const res = await authState.adminLogin(memberId, password);
        if (res?.success) {
          cachedLoginResponse = res;
          if (res.mustChangePassword) {
            mustChangePasswordStep = true;
            updateDOM();
            return;
          }

          if (res.member?.role === 'president' || res.redirectUrl === '/president') {
            router.navigate(PRESIDENT_DASHBOARD_PATH);
          } else {
            router.navigate(ADMIN_DASHBOARD_PATH);
          }
          return;
        }
      } catch (err) {
        errorMessage = err.message || 'Invalid administrative credentials. Access denied.';
      } finally {
        loading = false;
        updateDOM();
      }
    };
  }
}
