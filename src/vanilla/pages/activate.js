import { api } from '../../services/api.js';
import { icon } from '../icons.js';
import { router } from '../state.js';

let code = '';
let loading = false;
let errorMessage = null;
let alreadyActiveInfo = null;
let activationResult = null;

async function handleActivate(e) {
  if (e) e.preventDefault();
  const inputEl = document.getElementById('activate-code-input');
  if (inputEl) code = inputEl.value.trim();

  if (!code) {
    errorMessage = 'Please enter your activation code.';
    renderContainer();
    return;
  }

  loading = true;
  errorMessage = null;
  alreadyActiveInfo = null;
  renderContainer();

  try {
    const res = await api.activateAccount(code);
    if (res?.alreadyActive) {
      alreadyActiveInfo = {
        memberId: res.member?.memberId,
        studentName: res.member?.studentName
      };
      return;
    }

    if (res?.success && res?.member) {
      activationResult = {
        memberId: res.member.memberId,
        studentName: res.member.studentName,
        class: res.member.class,
        telegramBotUrl: res.telegramBotUrl || 'https://t.me/ARXITCLUB_bot',
        telegramChannelUrl: res.telegramChannelUrl || 'https://t.me/arxitclub'
      };
      if (typeof window.confetti === 'function') {
        window.confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }
    } else {
      errorMessage = res?.message || 'Activation failed. Please check the code and try again.';
    }
  } catch (err) {
    errorMessage = err.message || 'Something went wrong while activating your account. Please try again later.';
  } finally {
    loading = false;
    renderContainer();
  }
}

function renderContainer() {
  const container = document.getElementById('activate-page-root');
  if (!container) return;

  if (activationResult) {
    container.innerHTML = `
      <div class="max-w-md mx-auto px-4 py-16 space-y-8">
        <div class="text-center space-y-2.5">
          <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-[#102B22] text-emerald-600 dark:text-[#58B889] flex items-center justify-center mx-auto border border-emerald-200 dark:border-[#25473C]">
            ${icon('CheckCircle2', 'w-6 h-6')}
          </div>
          <span class="text-xs font-mono text-emerald-700 dark:text-[#58B889] uppercase tracking-wider font-semibold">
            STATUS &middot; ACTIVATED
          </span>
          <h1 class="text-2xl font-bold text-[#282828] dark:text-white tracking-tight font-sans">Account Activated</h1>
          <p class="text-xs text-[#282828]/70 dark:text-white">
            Welcome to ARX IT CLUB, <strong>${activationResult.studentName || ''}</strong>. Your membership is verified.
          </p>
        </div>

        <div class="p-6 sm:p-8 border border-[#282828]/10 dark:border-[#25473C] rounded-xl bg-white dark:bg-[#102B22] space-y-6 shadow-xs transition-colors">
          <div class="bg-[#FAF4EE] dark:bg-[#0A211A] rounded-lg p-5 text-center space-y-1.5 border border-[#282828]/10 dark:border-[#25473C]">
            <p class="text-[11px] uppercase tracking-wider text-[#282828]/60 dark:text-white font-mono">
              Assigned Member ID
            </p>
            <p class="font-mono text-3xl font-bold text-[#FC6454] dark:text-[#6BB89E] tracking-wider">
              ${activationResult.memberId}
            </p>
            ${activationResult.class ? `
              <p class="text-xs font-mono text-[#282828]/60 dark:text-white">
                Classroom: <strong class="text-[#282828] dark:text-white">${activationResult.class}</strong>
              </p>
            ` : ''}
          </div>

          <div class="p-4 bg-[#FAF4EE]/70 dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] rounded-lg space-y-2 text-left text-xs">
            <div class="flex items-center gap-2">
              ${icon('Send', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]')}
              <span class="font-semibold text-[#282828] dark:text-white">Official Telegram Community</span>
            </div>
            <p class="text-[#282828]/70 dark:text-white leading-relaxed">
              Stay connected with club announcements, assignments, and workshops on our official channels:
            </p>
            <div class="flex flex-col gap-2 pt-1">
              <a
                href="${activationResult.telegramBotUrl}"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-between px-3 py-2 bg-white dark:bg-[#15362B] border border-[#282828]/10 dark:border-[#25473C] rounded-md text-[#282828] dark:text-white hover:text-[#FC6454] dark:hover:text-[#6BB89E] transition-colors">
                <span>ARX Bot (@ARXITCLUB_bot)</span>
                ${icon('ExternalLink', 'w-3.5 h-3.5 text-[#282828]/40 dark:text-white')}
              </a>
              <a
                href="${activationResult.telegramChannelUrl}"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-between px-3 py-2 bg-white dark:bg-[#15362B] border border-[#282828]/10 dark:border-[#25473C] rounded-md text-[#282828] dark:text-white hover:text-[#FC6454] dark:hover:text-[#6BB89E] transition-colors">
                <span>Broadcast Channel (@arxitclub)</span>
                ${icon('ExternalLink', 'w-3.5 h-3.5 text-[#282828]/40 dark:text-white')}
              </a>
            </div>
          </div>

          <div class="pt-2">
            <button
              data-nav="/login"
              class="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer shadow-xs border-0">
              Sign In to Member Portal &rarr;
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (alreadyActiveInfo) {
    container.innerHTML = `
      <div class="max-w-md mx-auto px-4 py-16 space-y-6">
        <div class="p-6 sm:p-8 border border-[#282828]/10 dark:border-[#25473C] rounded-xl bg-white dark:bg-[#102B22] text-center space-y-4 shadow-xs transition-colors">
          <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-[#15362B] text-emerald-600 dark:text-[#58B889] flex items-center justify-center mx-auto border border-emerald-200 dark:border-[#25473C]">
            ${icon('CheckCircle2', 'w-6 h-6')}
          </div>
          <h2 class="text-xl font-bold text-[#282828] dark:text-white">Account Already Active</h2>
          <p class="text-xs text-[#282828]/70 dark:text-white">
            This account (${alreadyActiveInfo.memberId}) is already activated and ready for use.
          </p>
          <div class="pt-2">
            <button
              data-nav="/login"
              class="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer shadow-xs border-0">
              Sign In to Portal
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="max-w-md mx-auto px-4 py-16 space-y-8">
      <div class="text-center space-y-2.5">
        <div class="w-10 h-10 rounded-md bg-[#FAF4EE] dark:bg-[#15362B] flex items-center justify-center mx-auto border border-[#282828]/15 dark:border-[#25473C] p-1 text-[#FC6454] dark:text-[#6BB89E]">
          ${icon('KeyRound', 'w-5 h-5 text-[#FC6454] dark:text-[#6BB89E]')}
        </div>
        <span class="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider font-semibold">
          ACCOUNT VERIFICATION
        </span>
        <h1 class="text-2xl font-bold text-[#282828] dark:text-white tracking-tight font-sans">Activate Account</h1>
        <p class="text-xs text-[#282828]/60 dark:text-white">
          Enter the official single-use activation code received from the club Telegram bot.
        </p>
      </div>

      <div class="p-6 sm:p-8 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs transition-colors space-y-5">
        <div class="p-4 bg-[#FAF4EE]/70 dark:bg-[#0A211A] rounded-lg border border-[#282828]/10 dark:border-[#25473C] space-y-2 text-xs text-[#282828]/80 dark:text-white">
          <div class="flex items-center justify-between">
            <span class="font-bold text-[#282828] dark:text-white">Activate with Telegram</span>
            <a
              href="https://t.me/ARXITCLUB_bot"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 font-mono text-[11px] text-[#FC6454] dark:text-[#6BB89E] hover:underline">
              <span>@ARXITCLUB_bot</span>
              ${icon('ExternalLink', 'w-3 h-3')}
            </a>
          </div>
          <ol class="list-decimal list-inside space-y-1.5 leading-relaxed pl-1 text-[11px] text-[#282828]/80 dark:text-white">
            <li>Open the <strong>ARX IT CLUB Telegram Bot</strong></li>
            <li>Complete the verification process in Telegram</li>
            <li>The bot will send you your activation code</li>
            <li>Return here and enter that code below</li>
          </ol>
        </div>

        ${errorMessage ? `
          <div class="p-3 rounded-md bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900/60 text-red-800 dark:text-rose-300 text-xs flex items-start gap-2">
            ${icon('AlertCircle', 'w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-rose-400')}
            <span>${errorMessage}</span>
          </div>
        ` : ''}

        <form id="activate-form" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
              Enter activation code
            </label>
            <input
              id="activate-code-input"
              type="text"
              required
              placeholder="ARX-ACT-XXXX"
              value="${code}"
              class="w-full px-3.5 py-2.5 rounded-lg border border-[#282828]/20 dark:border-[#294B40] text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#6BB89E]/40 bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white uppercase placeholder:normal-case placeholder:font-sans placeholder:tracking-normal" />
            <p class="text-[11px] text-[#282828]/50 dark:text-white mt-1 font-mono">
              Format: ARX-ACT-XXXX &bull; Single-use &bull; 5-minute expiry
            </p>
          </div>

          <div class="pt-1">
            <button
              type="submit"
              ${loading ? 'disabled' : ''}
              class="w-full inline-flex items-center justify-center text-xs font-mono uppercase tracking-wider py-2.5 px-4 rounded-md bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer shadow-xs border-0 ${loading ? 'opacity-70 cursor-not-allowed' : ''}">
              ${icon('KeyRound', 'w-3.5 h-3.5 mr-1.5')}
              ${loading ? 'Activating...' : 'Activate Account'}
            </button>
          </div>
        </form>

        <div class="pt-3 border-t border-[#282828]/10 dark:border-[#25473C] text-center text-xs text-[#282828]/60 dark:text-white">
          Already activated?{' '}
          <button
            data-nav="/login"
            class="text-[#FC6454] dark:text-[#6BB89E] font-semibold hover:underline cursor-pointer border-0 bg-transparent p-0">
            Sign In Here &rarr;
          </button>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('activate-form');
  if (form) form.onsubmit = handleActivate;
}

export function renderActivatePage(initialCode = '') {
  code = initialCode;
  alreadyActiveInfo = null;
  activationResult = null;
  errorMessage = null;

  setTimeout(renderContainer, 10);
  return `<div id="activate-page-root"></div>`;
}

export function initActivatePageEvents() {
  renderContainer();
}
