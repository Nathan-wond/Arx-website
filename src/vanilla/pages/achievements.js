import { api } from '../../services/api.js';
import { icon } from '../icons.js';

let achievementsList = [];
let activeTab = 'all';
let loading = true;

const tabs = [
  { id: 'all', label: 'All Honors' },
  { id: 'club', label: 'Club Milestones' },
  { id: 'member', label: 'Member Awards' },
  { id: 'competition', label: 'Competitions' },
  { id: 'award', label: 'Special Recognitions' }
];

async function loadAchievements() {
  loading = true;
  try {
    const achRes = await api.getAchievements().catch(() => ({ achievements: [] }));
    if (achRes?.achievements) achievementsList = achRes.achievements;
  } catch (err) {
    console.error('Failed to load achievements data', err);
  } finally {
    loading = false;
    renderGrid();
  }
}

function renderGrid() {
  const container = document.getElementById('achievements-grid-container');
  if (!container) return;

  const filtered = achievementsList.filter(a => {
    if (activeTab === 'all') return true;
    return a.category === activeTab;
  });

  if (loading) {
    container.innerHTML = `
      <div class="py-20 text-center text-[#282828]/60 dark:text-white space-y-2 col-span-full">
        <div class="w-6 h-6 border-2 border-[#FC6454] dark:border-[#6BB89E] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs font-mono">Loading honors archive...</p>
      </div>
    `;
    return;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="py-16 text-center bg-[#FAF4EE] dark:bg-[#102B22] rounded-lg border border-[#282828]/10 dark:border-[#25473C] p-8 space-y-2 col-span-full">
        ${icon('Medal', 'w-8 h-8 text-[#282828]/40 dark:text-white mx-auto')}
        <h3 class="text-sm font-semibold text-[#282828] dark:text-white">
          No achievements published in this category
        </h3>
        <p class="text-xs text-[#282828]/60 dark:text-white">
          Official club competition results and student recognitions will be posted here.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <div class="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-6 space-y-4 hover:border-[#FC6454]/40 dark:hover:border-[#366656] transition-colors shadow-xs">
      <div class="flex items-center justify-between">
        ${item.imageUrl ? `
          <div class="w-12 h-12 rounded-md overflow-hidden bg-[#FAF4EE] dark:bg-[#15362B] border border-[#282828]/15 dark:border-[#25473C]">
            <img src="${item.imageUrl}" alt="${item.title || ''}" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
          </div>
        ` : `
          <div class="w-10 h-10 rounded-md bg-[#FAF4EE] dark:bg-[#15362B] text-[#FC6454] dark:text-[#6BB89E] border border-[#282828]/15 dark:border-[#25473C] flex items-center justify-center">
            ${icon('Award', 'w-5 h-5')}
          </div>
        `}
        <span class="text-[11px] font-mono text-[#282828]/50 dark:text-white">${item.date || ''}</span>
      </div>

      <div>
        <h3 class="text-base font-semibold text-[#282828] dark:text-white leading-snug">
          ${item.title || ''}
        </h3>
        <p class="text-xs text-[#282828]/70 dark:text-white mt-1 leading-relaxed">
          ${item.description || ''}
        </p>
      </div>

      <div class="pt-3 border-t border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between text-xs text-[#282828]/60 dark:text-white">
        <span class="capitalize">${item.category || ''} Category</span>
        <span class="text-[#FC6454] dark:text-[#6BB89E] font-medium font-mono text-[11px]">Verified Record</span>
      </div>
    </div>
  `).join('');
}

function updateTabButtons() {
  document.querySelectorAll('[data-ach-tab]').forEach(btn => {
    const id = btn.getAttribute('data-ach-tab');
    if (id === activeTab) {
      btn.className = 'px-3 py-1.5 rounded-md text-xs font-semibold bg-white dark:bg-[#15362B] text-[#282828] dark:text-white shadow-xs cursor-pointer border-0';
    } else {
      btn.className = 'px-3 py-1.5 rounded-md text-xs font-medium text-[#282828]/70 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] cursor-pointer border-0 bg-transparent';
    }
  });
}

export function renderAchievementsPage() {
  loadAchievements();

  return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <!-- Header -->
      <div class="text-left space-y-2 border-b border-[#282828]/10 dark:border-[#25473C] pb-6">
        <span class="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider font-semibold">
          HONORS &amp; RECOGNITION
        </span>
        <h1 class="text-3xl sm:text-4xl font-bold text-[#282828] dark:text-white tracking-tight font-sans">
          Club Achievements
        </h1>
        <p class="text-sm text-[#282828]/70 dark:text-white max-w-2xl leading-relaxed">
          Official recognitions, competitive victories, hackathon awards, and milestones earned by
          club members and student project teams.
        </p>
      </div>

      <!-- Tabs -->
      <div class="flex flex-wrap items-center gap-1 p-1 bg-[#FAF4EE] dark:bg-[#0A211A] rounded-lg border border-[#282828]/10 dark:border-[#25473C] w-fit">
        ${tabs.map(tab => `
          <button
            data-ach-tab="${tab.id}"
            class="${activeTab === tab.id ? 'bg-white dark:bg-[#15362B] text-[#282828] dark:text-white shadow-xs font-semibold' : 'text-[#282828]/70 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4]'} px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border-0">
            ${tab.label}
          </button>
        `).join('')}
      </div>

      <!-- Grid -->
      <div id="achievements-grid-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
    </div>
  `;
}

export function initAchievementsPageEvents() {
  document.querySelectorAll('[data-ach-tab]').forEach(btn => {
    btn.onclick = () => {
      activeTab = btn.getAttribute('data-ach-tab');
      updateTabButtons();
      renderGrid();
    };
  });
}
