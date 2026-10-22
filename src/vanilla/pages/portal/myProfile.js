import { authState } from '../../state.js';
import { api } from '../../../services/api.js';
import { icon } from '../../icons.js';

let form = {
  studentName: '',
  class: '',
  phoneNumber: '',
  telegramUsername: '',
  award: ''
};

let saving = false;
let feedback = null;

function syncFormWithMember() {
  const member = authState.member;
  if (member) {
    form = {
      studentName: member.studentName || '',
      class: member.class || '',
      phoneNumber: member.phoneNumber || '',
      telegramUsername: member.telegramUsername || '',
      award: member.award || ''
    };
  }
}

export function renderMyProfilePage() {
  const member = authState.member;

  return `
    <div id="portal-my-profile-root" class="max-w-2xl space-y-6">
      <!-- Header -->
      <div class="border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
        <span class="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider">
          ACCOUNT SETTINGS
        </span>
        <h1 class="text-2xl font-bold text-[#282828] dark:text-[#F1F7F4] tracking-tight mt-1 font-sans">My Profile</h1>
        <p class="text-xs text-[#282828]/60 dark:text-[#B7C9C2]">
          Manage your personal club information and contact preferences.
        </p>
      </div>

      <!-- Feedback -->
      ${feedback ? `
        <div class="p-3 rounded-md text-xs flex items-center gap-2.5 ${
          feedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
        }">
          ${feedback.type === 'success'
            ? icon('CheckCircle', 'w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0')
            : icon('Shield', 'w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0')
          }
          <span>${feedback.message}</span>
        </div>
      ` : ''}

      <!-- Form Card -->
      <div class="p-6 sm:p-8 border border-[#282828]/10 dark:border-[#25473C] rounded-xl bg-white dark:bg-[#102B22] space-y-6 shadow-xs transition-colors">
        <form id="profile-edit-form" class="space-y-4">
          <!-- Member ID (Immutable) -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-medium text-[#282828]/80 dark:text-[#B7C9C2]">Member ID</label>
              <span class="text-[11px] font-mono text-[#282828]/50 dark:text-[#7F9990]">Immutable Identifier</span>
            </div>
            <div class="relative">
              <input
                type="text"
                disabled
                value="${member?.memberId || 'TI------'}"
                class="w-full px-3 py-2 rounded-md border border-[#282828]/10 dark:border-[#25473C] bg-[#FAF4EE] dark:bg-[#0A211A] text-[#FC6454] dark:text-[#6BB89E] font-mono text-xs cursor-not-allowed select-none font-bold" />
              ${icon('Lock', 'w-3.5 h-3.5 text-[#282828]/40 dark:text-[#7F9990] absolute right-3 top-1/2 -translate-y-1/2')}
            </div>
            <p class="text-[11px] text-[#282828]/50 dark:text-[#7F9990] mt-1">
              Assigned automatically upon registration. Used for logging in.
            </p>
          </div>

          <!-- Student Name -->
          <div>
            <label class="block text-xs font-medium text-[#282828]/80 dark:text-[#B7C9C2] mb-1">
              Student Full Name
            </label>
            <input
              id="profile-student-name"
              type="text"
              required
              value="${form.studentName}"
              class="w-full px-3 py-2 rounded-md border border-[#282828]/20 dark:border-[#294B40] text-xs focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30 bg-white dark:bg-[#0C241C] text-[#282828] dark:text-[#F1F7F4]" />
          </div>

          <!-- Class -->
          <div>
            <label class="block text-xs font-medium text-[#282828]/80 dark:text-[#B7C9C2] mb-1">Class</label>
            <input
              id="profile-class"
              type="text"
              required
              placeholder="e.g. 11A"
              value="${form.class}"
              class="w-full px-3 py-2 rounded-md border border-[#282828]/20 dark:border-[#294B40] text-xs focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30 bg-white dark:bg-[#0C241C] text-[#282828] dark:text-[#F1F7F4]" />
          </div>

          <!-- Phone Number -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-medium text-[#282828]/80 dark:text-[#B7C9C2]">Phone Number</label>
              <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-[#58B889] bg-emerald-50 dark:bg-[#15362B] px-1.5 py-0.5 rounded-sm border border-emerald-200 dark:border-[#25473C]">
                CONFIDENTIAL
              </span>
            </div>
            <div class="relative">
              ${icon('Phone', 'w-3.5 h-3.5 text-[#282828]/40 dark:text-[#7F9990] absolute left-3 top-1/2 -translate-y-1/2')}
              <input
                id="profile-phone"
                type="tel"
                required
                value="${form.phoneNumber}"
                class="w-full pl-9 pr-3 py-2 rounded-md border border-[#282828]/20 dark:border-[#294B40] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30 bg-white dark:bg-[#0C241C] text-[#282828] dark:text-[#F1F7F4]" />
            </div>
          </div>

          <!-- Telegram Username -->
          <div>
            <label class="block text-xs font-medium text-[#282828]/80 dark:text-[#B7C9C2] mb-1">
              Telegram Username
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#282828]/40 dark:text-[#7F9990] font-mono text-xs">
                @
              </span>
              <input
                id="profile-telegram"
                type="text"
                required
                value="${(form.telegramUsername || '').replace(/^@/, '')}"
                class="w-full pl-7 pr-3 py-2 rounded-md border border-[#282828]/20 dark:border-[#294B40] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30 bg-white dark:bg-[#0C241C] text-[#282828] dark:text-[#F1F7F4]" />
            </div>
            <div class="flex flex-wrap items-center justify-between gap-1 mt-1 text-[11px] text-[#282828]/50 dark:text-[#7F9990]">
              <span>
                Bot: @ARXITCLUB_bot · Channel: @arxitclub
              </span>
              ${member?.telegramActivated && member?.telegramUserId ? `
                <span class="text-emerald-600 dark:text-[#58B889] font-medium">
                  Verified Telegram ID: ${member.telegramUserId}
                </span>
              ` : `
                <a
                  href="https://t.me/ARXITCLUB_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-[#FC6454] dark:text-[#6BB89E] hover:underline">
                  Link with @ARXITCLUB_bot &rarr;
                </a>
              `}
            </div>
          </div>

          <!-- Awards / Honors -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-medium text-[#282828]/80 dark:text-[#B7C9C2]">Awards / Honors</label>
              <span class="text-[11px] text-[#282828]/50 dark:text-[#7F9990]">Optional</span>
            </div>
            <input
              id="profile-award"
              type="text"
              placeholder="e.g. Web Development Beginner, Hackathon 2nd Place"
              value="${form.award}"
              class="w-full px-3 py-2 rounded-md border border-[#282828]/20 dark:border-[#294B40] text-xs focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30 bg-white dark:bg-[#0C241C] text-[#282828] dark:text-[#F1F7F4]" />
          </div>

          <!-- Submit Button -->
          <div class="pt-2">
            <button
              id="profile-save-btn"
              type="submit"
              ${saving ? 'disabled' : ''}
              class="inline-flex items-center justify-center font-sans tracking-tight select-none transition-colors duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#6BB89E]/40 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap shrink-0 text-xs sm:text-sm px-3.5 py-2 gap-2 font-medium bg-[#FC6454] text-white hover:bg-[#E04D3E] border border-[#FC6454] dark:bg-[#2F8068] dark:text-[#F1F7F4] dark:hover:bg-[#3A9277] dark:border-[#2F8068] dark:font-semibold shadow-xs w-full sm:w-auto">
              ${saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function updateDOM() {
  const root = document.getElementById('portal-my-profile-root');
  if (root) {
    const parent = root.parentElement;
    if (parent) {
      parent.innerHTML = renderMyProfilePage();
      attachListeners();
    }
  }
}

export function initMyProfilePageEvents() {
  syncFormWithMember();
  attachListeners();
}

function attachListeners() {
  const formEl = document.getElementById('profile-edit-form');
  if (formEl) {
    formEl.onsubmit = async (e) => {
      e.preventDefault();
      const sName = document.getElementById('profile-student-name');
      const cls = document.getElementById('profile-class');
      const phone = document.getElementById('profile-phone');
      const tg = document.getElementById('profile-telegram');
      const awd = document.getElementById('profile-award');

      form.studentName = sName ? sName.value : form.studentName;
      form.class = cls ? cls.value : form.class;
      form.phoneNumber = phone ? phone.value : form.phoneNumber;
      form.telegramUsername = tg ? `@${tg.value.replace(/^@/, '')}` : form.telegramUsername;
      form.award = awd ? awd.value : form.award;

      saving = true;
      feedback = null;
      updateDOM();

      try {
        const res = await api.updateProfile(form);
        if (res.success && res.member) {
          authState.updateMemberState(res.member);
          feedback = { type: 'success', message: 'Profile updated successfully!' };
          setTimeout(() => {
            feedback = null;
            updateDOM();
          }, 4000);
        }
      } catch (err) {
        feedback = {
          type: 'error',
          message: err.message || 'Failed to update profile. Please try again.'
        };
      } finally {
        saving = false;
        updateDOM();
      }
    };
  }
}
