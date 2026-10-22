import { api } from '../../../services/api.js';
import { icon } from '../../icons.js';

let projects = [];
let loading = true;

function getStatusBadge(status) {
  switch (status) {
    case 'Completed':
      return `<span class="inline-flex items-center rounded-sm text-[11px] px-1.5 py-0.5 tracking-tight font-medium bg-emerald-50 dark:bg-[#102B22] text-emerald-700 dark:text-[#58B889] border border-emerald-200 dark:border-[#25473C]">Completed</span>`;
    case 'In Progress':
      return `<span class="inline-flex items-center rounded-sm text-[11px] px-1.5 py-0.5 tracking-tight font-medium bg-[#FC6454]/10 dark:bg-[#2F8068]/25 text-[#FC6454] dark:text-[#6BB89E] border border-[#FC6454]/25 dark:border-[#25473C]">In Progress</span>`;
    case 'Planned':
      return `<span class="inline-flex items-center rounded-sm text-[11px] px-1.5 py-0.5 tracking-tight font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-[#D6A84F] border border-amber-200 dark:border-amber-800/60">Planned</span>`;
    default:
      return `<span class="inline-flex items-center rounded-sm text-[11px] px-1.5 py-0.5 tracking-tight font-medium bg-[#EFE6DE] dark:bg-[#15362B] text-[#282828] dark:text-[#F1F7F4] border border-[#282828]/15 dark:border-[#25473C]">${status || ''}</span>`;
  }
}

export function renderMyProjectsPage() {
  return `
    <div id="portal-my-projects-root" class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
        <div>
          <span class="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider">
            PORTFOLIO &amp; REPOSITORIES
          </span>
          <h1 class="text-2xl font-bold text-[#282828] dark:text-[#F1F7F4] tracking-tight mt-1 font-sans">My Projects</h1>
          <p class="text-xs text-[#282828]/60 dark:text-[#B7C9C2]">
            Collaborative initiatives and software products you have built or are actively developing.
          </p>
        </div>
        <button
          data-nav="/projects"
          class="inline-flex items-center justify-center font-sans tracking-tight select-none rounded-md text-xs px-2.5 py-1.5 font-medium bg-transparent text-[#282828] hover:bg-[#FC6454]/10 border border-[#282828]/25 dark:text-[#F1F7F4] dark:hover:bg-[#2F8068]/20 dark:border-[#25473C] cursor-pointer">
          Browse All Club Projects
        </button>
      </div>

      <!-- Content -->
      ${loading ? `
        <div class="py-16 text-center text-xs font-mono text-[#282828]/50 dark:text-[#7F9990]">Loading your projects...</div>
      ` : projects.length === 0 ? `
        <div class="p-12 text-center border border-[#282828]/10 dark:border-[#25473C] rounded-lg bg-white dark:bg-[#102B22] max-w-xl mx-auto space-y-4">
          ${icon('FolderGit2', 'w-10 h-10 text-[#282828]/40 dark:text-[#7F9990] mx-auto')}
          <div class="space-y-1">
            <h3 class="text-sm font-semibold text-[#282828] dark:text-[#F1F7F4]">
              No projects linked to your account yet
            </h3>
            <p class="text-xs text-[#282828]/60 dark:text-[#B7C9C2] max-w-sm mx-auto">
              Collaborate with club members in Computer Lab 3 or propose a new software initiative to get started.
            </p>
          </div>
          <button
            data-nav="/projects"
            class="inline-flex items-center justify-center font-sans tracking-tight select-none transition-colors duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#6BB89E]/40 cursor-pointer whitespace-nowrap shrink-0 text-xs px-2.5 py-1.5 font-medium bg-[#FC6454] text-white hover:bg-[#E04D3E] border border-[#FC6454] dark:bg-[#2F8068] dark:text-[#F1F7F4] dark:hover:bg-[#3A9277] dark:border-[#2F8068] shadow-xs">
            Explore Projects
          </button>
        </div>
      ` : `
        <div class="space-y-4">
          ${projects.map((proj) => `
            <div class="p-6 border border-[#282828]/10 dark:border-[#25473C] space-y-4 rounded-lg bg-white dark:bg-[#102B22] shadow-xs transition-colors">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-md bg-[#EFE6DE]/60 dark:bg-[#15362B] text-[#FC6454] dark:text-[#6BB89E] border border-[#282828]/10 dark:border-[#25473C] flex items-center justify-center font-bold">
                    ${icon('FolderGit2', 'w-4 h-4')}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-base font-bold text-[#282828] dark:text-[#F1F7F4]">${proj.title}</h3>
                      ${getStatusBadge(proj.status)}
                    </div>
                    <p class="text-xs font-mono text-[#282828]/50 dark:text-[#7F9990]">${proj.category}</p>
                  </div>
                </div>
                <span class="text-xs text-[#282828]/50 dark:text-[#7F9990] font-mono">${proj.date}</span>
              </div>

              <p class="text-xs text-[#282828]/70 dark:text-[#B7C9C2] leading-relaxed">${proj.description}</p>

              <!-- Tech tags -->
              <div class="flex flex-wrap gap-1.5 pt-1">
                ${(Array.isArray(proj.technologies) ? proj.technologies : []).map((t) => `
                  <span class="px-2 py-0.5 rounded-sm text-[11px] font-mono bg-[#EFE6DE] dark:bg-[#15362B] text-[#282828] dark:text-[#F1F7F4] border border-[#282828]/10 dark:border-[#25473C]">
                    ${t}
                  </span>
                `).join('')}
              </div>

              <!-- Team -->
              <div class="pt-3 border-t border-[#282828]/10 dark:border-[#25473C] flex items-center text-xs text-[#282828]/60 dark:text-[#B7C9C2] gap-2">
                ${icon('Users', 'w-3.5 h-3.5 text-slate-400')}
                <span>
                  Team Members: <strong class="text-slate-800 dark:text-slate-200">
                    ${Array.isArray(proj.projectMembers) ? proj.projectMembers.join(', ') : (proj.projectMembers || 'IT Club Team')}
                  </strong>
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

function updateDOM() {
  const root = document.getElementById('portal-my-projects-root');
  if (root) {
    const parent = root.parentElement;
    if (parent) {
      parent.innerHTML = renderMyProjectsPage();
    }
  }
}

export async function initMyProjectsPageEvents() {
  loading = true;
  try {
    const res = await api.getMemberProjects();
    if (res.projects) projects = res.projects;
  } catch (err) {
    console.error('Failed to load member projects', err);
  } finally {
    loading = false;
    updateDOM();
  }
}
