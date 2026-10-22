import { api } from '../../../services/api.js';
import { icon } from '../../icons.js';

let awards = [];
let loading = true;

export function renderMyAwardsPage() {
  return `
    <div id="portal-my-awards-root" class="space-y-6">
      <!-- Header -->
      <div class="border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
        <span class="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider">
          MEMBER RECOGNITIONS
        </span>
        <h1 class="text-2xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">My Awards</h1>
        <p class="text-xs text-[#282828]/60 dark:text-white">
          Special recognitions, hackathon honors, and club distinctions recorded on your student profile.
        </p>
      </div>

      <!-- Content -->
      ${loading ? `
        <div class="py-16 text-center text-xs font-mono text-[#282828]/50 dark:text-white">Loading awards...</div>
      ` : awards.length === 0 ? `
        <div class="p-12 text-center border border-[#282828]/10 dark:border-[#25473C] rounded-lg bg-white dark:bg-[#102B22] max-w-xl mx-auto space-y-4">
          <div class="w-12 h-12 rounded-lg bg-amber-50 dark:bg-[#15362B] text-amber-600 dark:text-[#D6A84F] border border-amber-200 dark:border-[#25473C] flex items-center justify-center mx-auto">
            ${icon('Trophy', 'w-6 h-6')}
          </div>
          <div class="space-y-1">
            <h3 class="text-base font-bold text-[#282828] dark:text-white">No awards recorded yet</h3>
            <p class="text-xs text-[#282828]/60 dark:text-white max-w-sm mx-auto leading-relaxed">
              Keep learning, building, and participating in hackathons and club events to earn official recognitions.
            </p>
          </div>
          <button
            data-nav="/events"
            class="inline-flex items-center justify-center font-sans tracking-tight select-none transition-colors duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#6BB89E]/40 cursor-pointer whitespace-nowrap shrink-0 text-xs px-2.5 py-1.5 font-medium bg-[#FC6454] text-white hover:bg-[#E04D3E] border border-[#FC6454] dark:bg-[#2F8068] dark:text-white dark:hover:bg-[#3A9277] dark:border-[#2F8068] shadow-xs">
            Explore Events
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${awards.map((award) => `
            <div class="p-6 border border-[#282828]/10 dark:border-[#25473C] space-y-3 rounded-lg bg-white dark:bg-[#102B22] shadow-xs transition-colors">
              <div class="flex items-center justify-between">
                <div class="w-8 h-8 rounded-md bg-amber-50 dark:bg-[#15362B] text-amber-600 dark:text-[#D6A84F] border border-amber-200 dark:border-[#25473C] flex items-center justify-center font-bold">
                  ${icon('Trophy', 'w-4 h-4')}
                </div>
                <span class="inline-flex items-center rounded-sm text-[11px] px-1.5 py-0.5 tracking-tight font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-[#D6A84F] border border-amber-200 dark:border-amber-800/60">
                  ${award.category}
                </span>
              </div>

              <div>
                <h3 class="text-base font-bold text-[#282828] dark:text-white">${award.title}</h3>
                <p class="text-xs text-[#282828]/70 dark:text-white mt-1 leading-relaxed">
                  ${award.description}
                </p>
              </div>

              <div class="pt-3 border-t border-[#282828]/10 dark:border-[#25473C] flex items-center text-xs font-mono text-[#282828]/50 dark:text-white gap-1.5">
                ${icon('Calendar', 'w-3.5 h-3.5')}
                <span>Awarded on ${award.date}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

function updateDOM() {
  const root = document.getElementById('portal-my-awards-root');
  if (root) {
    const parent = root.parentElement;
    if (parent) {
      parent.innerHTML = renderMyAwardsPage();
    }
  }
}

export async function initMyAwardsPageEvents() {
  loading = true;
  try {
    const res = await api.getMemberAwards();
    if (res.awards) awards = res.awards;
  } catch (err) {
    console.error('Failed to load awards', err);
  } finally {
    loading = false;
    updateDOM();
  }
}
