import { api } from '../../services/api.js';
import { icon } from '../icons.js';

let selectedStatus = 'All';
let projectsList = [];
let loading = true;

const statusFilters = ['All', 'Completed', 'In Progress', 'Planned'];

async function loadProjects() {
  loading = true;
  try {
    const res = await api.getProjects(selectedStatus);
    if (res?.projects) projectsList = res.projects;
  } catch (err) {
    console.error('Failed to load projects', err);
  } finally {
    loading = false;
    renderProjectsGrid();
  }
}

function renderProjectsGrid() {
  const container = document.getElementById('projects-grid-container');
  if (!container) return;

  if (loading) {
    container.innerHTML = `
      <div class="py-20 text-center text-[#282828]/50 dark:text-[#7F9990] space-y-2 col-span-full">
        <div class="w-6 h-6 border-2 border-[#FC6454] dark:border-[#6BB89E] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs font-mono">Loading project repository...</p>
      </div>
    `;
    return;
  }

  if (projectsList.length === 0) {
    container.innerHTML = `
      <div class="py-16 text-center bg-[#FAF4EE] dark:bg-[#102B22] rounded-lg border border-[#282828]/10 dark:border-[#25473C] p-8 space-y-2 col-span-full">
        ${icon('FolderGit2', 'w-8 h-8 text-[#282828]/40 dark:text-[#7F9990] mx-auto')}
        <h3 class="text-sm font-semibold text-[#282828] dark:text-[#F1F7F4]">No projects found</h3>
        <p class="text-xs text-[#282828]/60 dark:text-[#B7C9C2]">
          Student technology projects will appear here once published.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = projectsList.map(project => `
    <div class="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] flex flex-col justify-between overflow-hidden hover:border-[#FC6454]/40 dark:hover:border-[#366656] transition-colors shadow-xs">
      <div>
        ${project.imageUrl ? `
          <div class="w-full h-44 bg-[#FAF4EE] dark:bg-[#071A14] border-b border-[#282828]/10 dark:border-[#25473C] overflow-hidden">
            <img src="${project.imageUrl}" alt="${project.title || ''}" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
          </div>
        ` : ''}
        <div class="p-6 space-y-3">
          <div class="flex items-center gap-2 text-xs text-[#282828]/60 dark:text-[#B7C9C2]">
            <span class="font-medium text-[#FC6454] dark:text-[#6BB89E]">${project.category || 'Engineering'}</span>
            <span aria-hidden="true">&middot;</span>
            <span class="font-mono">${project.date || ''}</span>
            <span aria-hidden="true">&middot;</span>
            <span class="text-emerald-700 dark:text-[#58B889] font-medium">${project.status || ''}</span>
          </div>
          <h3 class="text-base font-semibold text-[#282828] dark:text-[#F1F7F4] leading-snug">
            ${project.title || ''}
          </h3>
          <p class="text-xs text-[#282828]/70 dark:text-[#B7C9C2] line-clamp-3 leading-relaxed">
            ${project.description || ''}
          </p>
          <div class="flex flex-wrap gap-1.5 pt-1">
            ${(Array.isArray(project.technologies) ? project.technologies : []).map(tech => `
              <span class="px-2 py-0.5 rounded-sm text-[11px] font-mono bg-[#FAF4EE] dark:bg-[#15362B] text-[#282828] dark:text-[#F1F7F4] border border-[#282828]/10 dark:border-[#25473C]">
                ${tech}
              </span>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="px-6 py-4 border-t border-[#282828]/10 dark:border-[#25473C] bg-[#FAF4EE]/50 dark:bg-[#0A211A]/50 flex items-center justify-between text-xs gap-2">
        <div class="text-[#282828]/60 dark:text-[#B7C9C2] truncate max-w-[170px]">
          Team: <strong class="text-[#282828] dark:text-[#F1F7F4] font-medium">
            ${Array.isArray(project.projectMembers) ? project.projectMembers.join(', ') : (project.projectMembers || 'IT Club Team')}
          </strong>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          ${(project.githubUrl || project.projectUrl) ? `
            <a
              href="${project.githubUrl || project.projectUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-[#282828] dark:text-[#B7C9C2] hover:text-[#FC6454] dark:hover:text-[#6BB89E] font-medium transition-colors"
              title="GitHub Repository">
              ${icon('Github', 'w-3.5 h-3.5')}
              <span>Code</span>
            </a>
          ` : ''}
          ${project.liveDemoUrl ? `
            <a
              href="${project.liveDemoUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-[#FC6454] dark:text-[#6BB89E] hover:underline font-medium transition-colors"
              title="Live Demo">
              <span>Live</span>
              ${icon('ExternalLink', 'w-3.5 h-3.5')}
            </a>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function updateStatusButtons() {
  document.querySelectorAll('[data-project-status]').forEach(btn => {
    const s = btn.getAttribute('data-project-status');
    if (s === selectedStatus) {
      btn.className = 'px-3 py-1.5 rounded-md text-xs font-semibold bg-white dark:bg-[#102B22] text-[#282828] dark:text-[#F1F7F4] shadow-xs cursor-pointer border-0';
    } else {
      btn.className = 'px-3 py-1.5 rounded-md text-xs font-medium text-[#282828]/70 dark:text-[#B7C9C2] hover:text-[#282828] dark:hover:text-[#F1F7F4] cursor-pointer border-0 bg-transparent';
    }
  });
}

export function renderProjectsPage() {
  loadProjects();

  return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <!-- Header -->
      <div class="text-left space-y-2 border-b border-[#282828]/10 dark:border-[#25473C] pb-6">
        <span class="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider font-semibold">
          SOFTWARE REPOSITORY
        </span>
        <h1 class="text-3xl sm:text-4xl font-bold text-[#282828] dark:text-[#F1F7F4] tracking-tight font-sans">
          Member Projects
        </h1>
        <p class="text-sm text-[#282828]/70 dark:text-[#B7C9C2] max-w-2xl leading-relaxed">
          Real tools, web applications, and embedded experiments created by student engineering teams
          in Computer Lab 3.
        </p>
      </div>

      <!-- Status Filter -->
      <div class="flex items-center gap-1 p-1 bg-[#EFE6DE]/60 dark:bg-[#0A211A] rounded-lg border border-[#282828]/10 dark:border-[#25473C] w-fit">
        ${statusFilters.map(status => `
          <button
            data-project-status="${status}"
            class="${selectedStatus === status ? 'bg-white dark:bg-[#102B22] text-[#282828] dark:text-[#F1F7F4] shadow-xs font-semibold' : 'text-[#282828]/70 dark:text-[#B7C9C2] hover:text-[#282828] dark:hover:text-[#F1F7F4]'} px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border-0">
            ${status}
          </button>
        `).join('')}
      </div>

      <!-- Grid -->
      <div id="projects-grid-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
    </div>
  `;
}

export function initProjectsPageEvents() {
  document.querySelectorAll('[data-project-status]').forEach(btn => {
    btn.onclick = () => {
      selectedStatus = btn.getAttribute('data-project-status');
      updateStatusButtons();
      loadProjects();
    };
  });
}
