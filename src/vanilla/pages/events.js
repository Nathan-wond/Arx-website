import { api } from '../../services/api.js';
import { authState, router } from '../state.js';
import { icon } from '../icons.js';

let selectedStatus = 'Upcoming';
let eventsList = [];
let loading = true;
let registeringId = null;
let toastMessage = null;
let errorMessage = null;

async function loadEvents() {
  loading = true;
  try {
    const res = await api.getEvents(selectedStatus);
    if (res?.events) eventsList = res.events;
  } catch (err) {
    console.error('Failed to load events', err);
  } finally {
    loading = false;
    renderEventsGrid();
  }
}

async function handleRegister(event) {
  if (!authState.isAuthenticated) {
    router.navigate('/login');
    return;
  }

  registeringId = event.id;
  errorMessage = null;
  renderFeedback();

  try {
    const res = await api.registerEvent(event.id, authState.member?.id);
    toastMessage = res.message || `Registered for ${event.title}!`;
    setTimeout(() => {
      toastMessage = null;
      renderFeedback();
    }, 4000);
    const updated = await api.getEvents(selectedStatus);
    if (updated?.events) eventsList = updated.events;
  } catch (err) {
    errorMessage = err.message || 'Registration failed.';
    setTimeout(() => {
      errorMessage = null;
      renderFeedback();
    }, 4000);
  } finally {
    registeringId = null;
    renderFeedback();
    renderEventsGrid();
  }
}

function renderFeedback() {
  const container = document.getElementById('events-feedback-container');
  if (!container) return;

  container.innerHTML = `
    ${toastMessage ? `
      <div class="fixed top-20 right-4 z-50 bg-emerald-900 text-emerald-100 border border-emerald-700 px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2.5">
        ${icon('CheckCircle', 'w-4 h-4 text-emerald-300 shrink-0')}
        <span class="text-xs font-medium">${toastMessage}</span>
      </div>
    ` : ''}
    ${errorMessage ? `
      <div class="fixed top-20 right-4 z-50 bg-rose-900 text-rose-100 border border-rose-700 px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2.5">
        ${icon('AlertCircle', 'w-4 h-4 text-rose-300 shrink-0')}
        <span class="text-xs font-medium">${errorMessage}</span>
      </div>
    ` : ''}
  `;
}

function renderEventsGrid() {
  const container = document.getElementById('events-grid-container');
  if (!container) return;

  if (loading) {
    container.innerHTML = `
      <div class="py-20 text-center text-[#282828]/50 dark:text-white space-y-2 col-span-full">
        <div class="w-6 h-6 border-2 border-[#FC6454] dark:border-[#6BB89E] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs font-mono">Loading schedule...</p>
      </div>
    `;
    return;
  }

  if (eventsList.length === 0) {
    container.innerHTML = `
      <div class="py-20 text-center bg-[#FAF4EE] dark:bg-[#071A14] rounded-2xl border border-[#282828]/10 dark:border-[#25473C] px-8 flex flex-col items-center gap-6 relative overflow-hidden col-span-full">
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <div class="w-64 h-64 rounded-full border border-dashed border-[#FC6454]/15 dark:border-[#6BB89E]/15 animate-[spin_18s_linear_infinite]"></div>
          <div class="absolute w-44 h-44 rounded-full border border-dashed border-[#FC6454]/10 dark:border-[#6BB89E]/10 animate-[spin_12s_linear_infinite_reverse]"></div>
          <div class="absolute w-24 h-24 rounded-full border border-[#FC6454]/20 dark:border-[#6BB89E]/20"></div>
        </div>

        <div class="relative z-10 w-16 h-16 rounded-full bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] flex items-center justify-center shadow-lg">
          ${icon('Calendar', 'w-7 h-7 text-[#FC6454] dark:text-[#6BB89E]')}
        </div>

        <div class="relative z-10 space-y-2">
          <p class="text-[10px] font-mono uppercase tracking-[0.25em] text-[#FC6454] dark:text-[#6BB89E]">SYSTEM STATUS</p>
          <h3 class="text-xl sm:text-2xl font-bold text-[#282828] dark:text-white tracking-tight">No current event</h3>
          <p class="text-xs sm:text-sm text-[#282828]/60 dark:text-white max-w-sm mx-auto leading-relaxed">
            No events are currently orbiting or scheduled. New workshops and lab sessions
            will appear here once launched — follow the official channel for launch alerts.
          </p>
        </div>

        <div class="relative z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] text-xs font-mono text-[#282828]/50 dark:text-white">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          ORBIT CLEAR &middot; ${selectedStatus.toUpperCase()} QUEUE EMPTY
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = eventsList.map(event => {
    let month = 'EVT';
    let day = '15';
    if (event.formattedDate) {
      month = event.formattedDate.month || month;
      day = event.formattedDate.day || day;
    } else if (event.date) {
      try {
        const d = new Date(event.date + 'T00:00:00');
        month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        day = String(d.getDate());
      } catch {}
    }

    return `
      <div class="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] flex flex-col justify-between overflow-hidden hover:border-[#FC6454]/40 dark:hover:border-[#366656] transition-colors shadow-xs">
        <div>
          ${(event.imageUrl || event.coverImageUrl) ? `
            <div class="w-full h-44 bg-[#FAF4EE] dark:bg-[#071A14] border-b border-[#282828]/10 dark:border-[#25473C] overflow-hidden">
              <img src="${event.imageUrl || event.coverImageUrl}" alt="${event.title || ''}" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
            </div>
          ` : `
            <div class="w-full h-24 bg-[#FAF4EE] dark:bg-[#0C241C] border-b border-[#282828]/10 dark:border-[#25473C] p-4 flex items-center gap-3">
              <div class="w-12 h-12 rounded-md bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] flex flex-col items-center justify-center">
                <span class="text-[10px] font-mono uppercase text-[#FC6454] dark:text-[#6BB89E] font-bold">${month}</span>
                <span class="text-base font-bold text-[#282828] dark:text-white font-mono leading-none">${day}</span>
              </div>
              <div>
                <span class="text-xs font-medium text-[#FC6454] dark:text-[#6BB89E]">${event.category || event.locationType || 'Session'}</span>
                <p class="text-[11px] text-[#282828]/60 dark:text-white font-mono">${event.time || ''}</p>
              </div>
            </div>
          `}

          <div class="p-6 space-y-3">
            <div class="flex items-center gap-2 text-xs text-[#282828]/60 dark:text-white">
              <span class="font-mono">${event.date || ''}</span>
              <span aria-hidden="true">&middot;</span>
              <span class="text-emerald-700 dark:text-[#58B889] font-medium">${event.type || 'Workshop'}</span>
            </div>
            <h3 class="text-base font-semibold text-[#282828] dark:text-white leading-snug">
              ${event.title || ''}
            </h3>
            <p class="text-xs text-[#282828]/70 dark:text-white line-clamp-3 leading-relaxed">
              ${event.description || ''}
            </p>
            <div class="pt-2 text-xs text-[#282828]/60 dark:text-white space-y-1">
              <div class="flex items-center gap-1.5">
                ${icon('MapPin', 'w-3.5 h-3.5 text-[#282828]/40 dark:text-white shrink-0')}
                <span>${event.location || ''}</span>
              </div>
              ${event.time ? `
                <div class="flex items-center gap-1.5">
                  ${icon('Clock', 'w-3.5 h-3.5 text-[#282828]/40 dark:text-white shrink-0')}
                  <span>${event.time}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-[#282828]/10 dark:border-[#25473C] bg-[#FAF4EE]/50 dark:bg-[#0A211A]/50 flex items-center justify-between text-xs">
          <span class="text-[#282828]/60 dark:text-white">
            ${event.registeredCount ? `${event.registeredCount} enrolled` : 'Open access'}
          </span>
          ${selectedStatus === 'Upcoming' ? `
            <button
              data-register-event="${event.id}"
              ${registeringId === event.id ? 'disabled' : ''}
              class="px-3 py-1.5 text-xs font-semibold rounded-md bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer border-0">
              ${registeringId === event.id ? 'Registering...' : 'Register'}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('[data-register-event]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-register-event');
      const ev = eventsList.find(e => String(e.id) === String(id));
      if (ev) handleRegister(ev);
    };
  });
}

function updateStatusButtons() {
  const upBtn = document.getElementById('events-tab-upcoming');
  const pastBtn = document.getElementById('events-tab-past');
  if (upBtn) {
    upBtn.className = `px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border-0 ${
      selectedStatus === 'Upcoming'
        ? 'bg-white dark:bg-[#102B22] text-[#282828] dark:text-white shadow-xs font-semibold'
        : 'text-[#282828]/70 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] bg-transparent'
    }`;
  }
  if (pastBtn) {
    pastBtn.className = `px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border-0 ${
      selectedStatus === 'Past'
        ? 'bg-white dark:bg-[#102B22] text-[#282828] dark:text-white shadow-xs font-semibold'
        : 'text-[#282828]/70 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] bg-transparent'
    }`;
  }
}

export function renderEventsPage() {
  loadEvents();

  return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div id="events-feedback-container"></div>

      <!-- Header -->
      <div class="text-left space-y-2 border-b border-[#282828]/10 dark:border-[#25473C] pb-6">
        <span class="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider font-semibold">
          CALENDAR &amp; ACTIVITIES
        </span>
        <h1 class="text-3xl sm:text-4xl font-bold text-[#282828] dark:text-white tracking-tight font-sans">
          Events &amp; Workshops
        </h1>
        <p class="text-sm text-[#282828]/70 dark:text-white max-w-2xl leading-relaxed">
          Attend hands-on workshops, lab coding sessions, speaker seminars, and competitive hackathons.
        </p>
      </div>

      <!-- Status Toggle -->
      <div class="flex items-center gap-1 p-1 bg-[#EFE6DE]/60 dark:bg-[#0A211A] rounded-lg border border-[#282828]/10 dark:border-[#25473C] w-fit">
        <button
          id="events-tab-upcoming"
          class="px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border-0 ${
            selectedStatus === 'Upcoming'
              ? 'bg-white dark:bg-[#102B22] text-[#282828] dark:text-white shadow-xs font-semibold'
              : 'text-[#282828]/70 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] bg-transparent'
          }">
          Upcoming Sessions
        </button>
        <button
          id="events-tab-past"
          class="px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border-0 ${
            selectedStatus === 'Past'
              ? 'bg-white dark:bg-[#102B22] text-[#282828] dark:text-white shadow-xs font-semibold'
              : 'text-[#282828]/70 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] bg-transparent'
          }">
          Past Sessions
        </button>
      </div>

      <!-- Grid -->
      <div id="events-grid-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
    </div>
  `;
}

export function initEventsPageEvents() {
  const upBtn = document.getElementById('events-tab-upcoming');
  const pastBtn = document.getElementById('events-tab-past');

  if (upBtn) {
    upBtn.onclick = () => {
      selectedStatus = 'Upcoming';
      updateStatusButtons();
      loadEvents();
    };
  }
  if (pastBtn) {
    pastBtn.onclick = () => {
      selectedStatus = 'Past';
      updateStatusButtons();
      loadEvents();
    };
  }
}
