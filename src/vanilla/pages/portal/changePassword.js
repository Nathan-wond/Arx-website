import { api } from '../../../services/api.js';
import { icon } from '../../icons.js';

let form = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
};

let loading = false;
let feedback = null;

export function renderChangePasswordPage() {
  return `
    <div id="portal-change-password-root" class="max-w-xl space-y-6">
      <!-- Header -->
      <div class="border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
        <span class="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider font-semibold">
          SECURITY &amp; ACCESS
        </span>
        <h1 class="text-2xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">
          Change Password
        </h1>
        <p class="text-xs text-[#282828]/60 dark:text-white">
          Ensure your account stays secure with an updated personal passphrase.
        </p>
      </div>

      <!-- Feedback -->
      ${feedback ? `
        <div class="p-3 rounded-md text-xs flex items-center gap-2.5 ${
          feedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-[#15362B] text-emerald-800 dark:text-[#58B889] border border-emerald-200 dark:border-[#25473C]'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
        }">
          ${feedback.type === 'success'
            ? icon('CheckCircle', 'w-4 h-4 text-emerald-600 dark:text-[#58B889] shrink-0')
            : icon('ShieldAlert', 'w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0')
          }
          <span>${feedback.message}</span>
        </div>
      ` : ''}

      <!-- Form Card -->
      <div class="p-6 sm:p-8 border border-[#282828]/10 dark:border-[#25473C] rounded-xl bg-white dark:bg-[#102B22] shadow-xs transition-colors">
        <form id="change-pwd-form" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
              Current Password
            </label>
            <input
              id="change-pwd-current"
              type="password"
              required
              placeholder="••••••••••••"
              value="${form.currentPassword}"
              class="w-full px-3 py-2 rounded-md border border-[#282828]/20 dark:border-[#294B40] text-xs focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30 bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white" />
          </div>

          <div>
            <label class="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
              New Password
            </label>
            <input
              id="change-pwd-new"
              type="password"
              required
              minlength="6"
              placeholder="Minimum 6 characters"
              value="${form.newPassword}"
              class="w-full px-3 py-2 rounded-md border border-[#282828]/20 dark:border-[#294B40] text-xs focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30 bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white" />
          </div>

          <div>
            <label class="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
              Confirm New Password
            </label>
            <input
              id="change-pwd-confirm"
              type="password"
              required
              minlength="6"
              placeholder="Re-enter new password"
              value="${form.confirmPassword}"
              class="w-full px-3 py-2 rounded-md border border-[#282828]/20 dark:border-[#294B40] text-xs focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30 bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white" />
          </div>

          <div class="pt-2">
            <button
              id="change-pwd-submit-btn"
              type="submit"
              ${loading ? 'disabled' : ''}
              class="inline-flex items-center justify-center font-sans tracking-tight select-none transition-colors duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#6BB89E]/40 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap shrink-0 text-xs sm:text-sm px-3.5 py-2 gap-2 font-medium bg-[#FC6454] text-white hover:bg-[#E04D3E] border border-[#FC6454] dark:bg-[#2F8068] dark:text-white dark:hover:bg-[#3A9277] dark:border-[#2F8068] dark:font-semibold shadow-xs w-full sm:w-auto">
              ${loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function updateDOM() {
  const root = document.getElementById('portal-change-password-root');
  if (root) {
    const parent = root.parentElement;
    if (parent) {
      parent.innerHTML = renderChangePasswordPage();
      attachListeners();
    }
  }
}

export function initChangePasswordPageEvents() {
  attachListeners();
}

function attachListeners() {
  const formEl = document.getElementById('change-pwd-form');
  if (formEl) {
    formEl.onsubmit = async (e) => {
      e.preventDefault();
      feedback = null;

      const cur = document.getElementById('change-pwd-current');
      const nw = document.getElementById('change-pwd-new');
      const cf = document.getElementById('change-pwd-confirm');

      form.currentPassword = cur ? cur.value : '';
      form.newPassword = nw ? nw.value : '';
      form.confirmPassword = cf ? cf.value : '';

      if (form.newPassword.length < 6) {
        feedback = { type: 'error', message: 'New password must be at least 6 characters long.' };
        updateDOM();
        return;
      }

      if (form.newPassword !== form.confirmPassword) {
        feedback = { type: 'error', message: 'New passwords do not match.' };
        updateDOM();
        return;
      }

      loading = true;
      updateDOM();

      try {
        const res = await api.changePassword({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword
        });

        if (res.success) {
          feedback = { type: 'success', message: 'Password changed successfully!' };
          form = { currentPassword: '', newPassword: '', confirmPassword: '' };
        }
      } catch (err) {
        feedback = {
          type: 'error',
          message: err.message || 'Failed to change password. Please check your current password.'
        };
      } finally {
        loading = false;
        updateDOM();
      }
    };
  }
}
