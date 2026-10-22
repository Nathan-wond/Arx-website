import { authState, router } from '../state.js';
import { icon } from '../icons.js';

let memberId = '';
let password = '';
let rememberMe = true;
let loading = false;
let errorMessage = null;
let forgotModalOpen = false;

async function handleLoginSubmit(e) {
  if (e) e.preventDefault();
  const midInput = document.getElementById('login-member-id');
  const pwdInput = document.getElementById('login-password');
  if (midInput) memberId = midInput.value.trim().toUpperCase();
  if (pwdInput) password = pwdInput.value;

  if (!memberId || !password) return;

  loading = true;
  errorMessage = null;
  renderLoginFormContainer();

  try {
    const res = await authState.login(memberId, password);
    if (res?.success) {
      router.navigate('/portal/dashboard');
      return;
    }
  } catch (err) {
    errorMessage = err.message || 'Invalid Member ID or password. Please verify your credentials.';
  } finally {
    loading = false;
    renderLoginFormContainer();
  }
}

function renderLoginFormContainer() {
  const container = document.getElementById('login-card-container');
  if (!container) return;

  const isUnderReview = errorMessage && errorMessage.toLowerCase().includes('under review');

  container.innerHTML = `
    ${errorMessage ? `
      ${isUnderReview ? `
        <div class="mb-5 p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
          ${icon('Clock', 'w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400')}
          <div>
            <strong class="block font-semibold">Application Under Review</strong>
            <span class="text-[11px] text-amber-800 dark:text-amber-300">
              ${errorMessage}
            </span>
          </div>
        </div>
      ` : `
        <div class="mb-5 p-3 rounded-md bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900/60 text-red-800 dark:text-rose-300 text-xs flex items-start gap-2">
          ${icon('AlertCircle', 'w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-rose-400')}
          <span>${errorMessage}</span>
        </div>
      `}
    ` : ''}

    <form id="member-login-form" class="space-y-4">
      <div>
        <label class="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
          Member ID
        </label>
        <input
          id="login-member-id"
          type="text"
          required
          placeholder="e.g. ARX-2026-001"
          value="${memberId}"
          class="w-full px-3 py-2 rounded-md border border-[#282828]/20 dark:border-[#294B40] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30 bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white" />
        <p class="text-[11px] text-[#282828]/50 dark:text-white mt-1">
          Your official club identifier format: &ldquo;ARX-2026-###&rdquo;.
        </p>
      </div>

      <div>
        <label class="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          required
          placeholder="••••••••••••"
          value="${password}"
          class="w-full px-3 py-2 rounded-md border border-[#282828]/20 dark:border-[#294B40] text-xs focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30 bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white" />
      </div>

      <div class="flex items-center justify-between text-xs pt-1">
        <label class="flex items-center gap-2 cursor-pointer text-[#282828]/70 dark:text-white">
          <input
            id="login-remember-me"
            type="checkbox"
            ${rememberMe ? 'checked' : ''}
            class="rounded border-[#282828]/20 dark:border-[#294B40] text-[#FC6454] dark:text-[#6BB89E] focus:ring-0" />
          <span>Remember session</span>
        </label>
        <button
          id="login-forgot-pwd-btn"
          type="button"
          class="text-[#FC6454] dark:text-[#6BB89E] text-xs hover:underline cursor-pointer border-0 bg-transparent p-0">
          Forgot Password?
        </button>
      </div>

      <div class="pt-2">
        <button
          type="submit"
          ${loading ? 'disabled' : ''}
          class="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer shadow-xs border-0 ${loading ? 'opacity-70 cursor-not-allowed' : ''}">
          ${loading ? 'Signing In...' : 'Sign In'}
        </button>
      </div>
    </form>

    <div class="mt-6 pt-4 border-t border-[#282828]/10 dark:border-[#25473C] text-center text-xs text-[#282828]/60 dark:text-white space-y-2">
      <div>
        Don&apos;t have an account?{' '}
        <button
          data-nav="/register"
          class="text-[#FC6454] dark:text-[#6BB89E] font-semibold hover:underline cursor-pointer border-0 bg-transparent p-0">
          Register Here &rarr;
        </button>
      </div>
      <div>
        Received an activation code?{' '}
        <button
          data-nav="/activate"
          class="text-[#FC6454] dark:text-[#6BB89E] font-semibold hover:underline cursor-pointer border-0 bg-transparent p-0">
          Activate Account &rarr;
        </button>
      </div>
    </div>
  `;

  const form = document.getElementById('member-login-form');
  if (form) form.onsubmit = handleLoginSubmit;

  const forgotBtn = document.getElementById('login-forgot-pwd-btn');
  if (forgotBtn) {
    forgotBtn.onclick = () => {
      forgotModalOpen = true;
      renderModal();
    };
  }

  const rememberCb = document.getElementById('login-remember-me');
  if (rememberCb) {
    rememberCb.onchange = (e) => { rememberMe = e.target.checked; };
  }
}

function renderModal() {
  const modalBox = document.getElementById('login-modal-wrapper');
  if (!modalBox) return;

  if (!forgotModalOpen) {
    modalBox.innerHTML = '';
    return;
  }

  modalBox.innerHTML = `
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div id="login-modal-overlay" class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"></div>
        <div class="relative transform overflow-hidden rounded-xl bg-white dark:bg-[#102B22] text-left transition-all sm:my-8 w-full max-w-md border border-[#282828]/15 dark:border-[#25473C] shadow-xl max-h-[90vh] flex flex-col z-10">
          <div class="flex items-center justify-between border-b border-[#282828]/10 dark:border-[#25473C] px-6 py-4 bg-[#FAF4EE] dark:bg-[#0A211A] shrink-0">
            <h3 class="text-sm font-semibold tracking-tight text-[#282828] dark:text-white font-sans">Password Recovery</h3>
            <button
              id="login-modal-x-btn"
              type="button"
              class="rounded-md p-1 text-[#282828]/50 hover:bg-[#EFE6DE] dark:text-white dark:hover:bg-[#15362B] hover:text-[#282828] dark:hover:text-[#F1F7F4] transition-colors cursor-pointer border-0 bg-transparent">
              ${icon('X', 'w-4 h-4')}
            </button>
          </div>
          <div class="p-6 text-[#282828] dark:text-white overflow-y-auto flex-1">
            <div class="space-y-4 text-xs text-[#282828]/70 dark:text-white">
              <p>For student security, credentials can be reset by club administrators or verified via Telegram.</p>
              <div class="p-3.5 rounded-lg bg-[#FAF4EE] dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] space-y-1.5">
                <p class="font-semibold text-[#282828] dark:text-white">Reset Options:</p>
                <p>1. Visit Computer Lab 3 during Monday to Tuesday sessions for an officer reset.</p>
                <p>2. Or message <strong>@ARXITCLUB_bot</strong> from your registered Telegram account.</p>
              </div>
              <div class="pt-2">
                <button
                  id="login-modal-dismiss-btn"
                  class="w-full inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const close = () => {
    forgotModalOpen = false;
    renderModal();
  };

  const overlay = document.getElementById('login-modal-overlay');
  if (overlay) overlay.onclick = close;
  const xBtn = document.getElementById('login-modal-x-btn');
  if (xBtn) xBtn.onclick = close;
  const dismissBtn = document.getElementById('login-modal-dismiss-btn');
  if (dismissBtn) dismissBtn.onclick = close;
}

export function renderLoginPage() {
  return `
    <div class="max-w-md mx-auto px-4 py-16 space-y-8">
      <!-- Header -->
      <div class="text-center space-y-2.5">
        <div class="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center mx-auto bg-transparent shrink-0">
          <img
            src="/assets/arx-logo-light.jpg"
            alt="ARX IT CLUB OF SJS Logo Light"
            class="w-full h-full object-cover rounded-full dark:hidden" />
          <img
            src="/assets/arx-logo-dark.jpg"
            alt="ARX IT CLUB OF SJS Logo Dark"
            class="w-full h-full object-cover rounded-full hidden dark:block" />
        </div>
        <span class="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider font-semibold">
          MEMBER PORTAL
        </span>
        <h1 class="text-2xl font-bold text-[#282828] dark:text-white tracking-tight font-sans">Sign In to Account</h1>
        <p class="text-xs text-[#282828]/60 dark:text-white">
          Enter your unique Member ID and password to access your coursework and credentials.
        </p>
      </div>

      <!-- Card -->
      <div id="login-card-container" class="p-6 sm:p-8 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs transition-colors"></div>

      <!-- Modal placeholder -->
      <div id="login-modal-wrapper"></div>
    </div>
  `;
}

export function initLoginPageEvents() {
  renderLoginFormContainer();
}
