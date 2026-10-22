import { api } from '../../services/api.js';
import { router } from '../state.js';
import { icon } from '../icons.js';
import { renderCourseVisual } from '../components/courseVisual.js';

let selectedCategory = 'All';
let searchQuery = '';
let coursesList = [];
let loading = true;

const categories = [
  'All',
  'Web Development',
  'Programming',
  'Cybersecurity',
  'Robotics'
];

async function loadCourses() {
  loading = true;
  try {
    const res = await api.getCourses(selectedCategory, searchQuery);
    if (res?.courses) coursesList = res.courses;
  } catch (err) {
    console.error('Failed to fetch courses', err);
  } finally {
    loading = false;
    renderCoursesGrid();
  }
}

function renderCoursesGrid() {
  const container = document.getElementById('courses-grid-container');
  if (!container) return;

  if (loading) {
    container.innerHTML = `
      <div class="py-20 text-center text-[#282828]/70 dark:text-white space-y-2 col-span-full">
        <div class="w-6 h-6 border-2 border-[#FC6454] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs font-mono text-[#282828]/70 dark:text-white">Loading curriculum...</p>
      </div>
    `;
    return;
  }

  if (coursesList.length === 0) {
    container.innerHTML = `
      <div class="py-16 text-center bg-white/70 dark:bg-[#102B22] rounded-lg border border-[#282828]/10 dark:border-[#25473C] p-8 space-y-2 col-span-full">
        ${icon('GraduationCap', 'w-8 h-8 text-[#282828]/60 dark:text-white mx-auto')}
        <h3 class="text-sm font-semibold text-[#282828] dark:text-white">
          ${searchQuery || selectedCategory !== 'All' ? 'No courses match your filter' : 'No courses available yet'}
        </h3>
        <p class="text-xs text-[#282828]/70 dark:text-white">
          ${searchQuery || selectedCategory !== 'All' ? 'Try resetting your search query or selecting another category.' : 'Courses will appear here once published by the club administrator.'}
        </p>
        ${searchQuery || selectedCategory !== 'All' ? `
          <button id="courses-clear-filters" class="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer">
            Clear Filters
          </button>
        ` : ''}
      </div>
    `;
    const clearBtn = document.getElementById('courses-clear-filters');
    if (clearBtn) {
      clearBtn.onclick = () => {
        selectedCategory = 'All';
        searchQuery = '';
        const searchInput = document.getElementById('courses-search-input');
        if (searchInput) searchInput.value = '';
        updateCategoryButtons();
        loadCourses();
      };
    }
    return;
  }

  container.innerHTML = coursesList.map(course => `
    <div class="group rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] flex flex-col justify-between overflow-hidden hover:border-[#FC6454]/50 dark:hover:border-[#FC6454]/60 transition-colors shadow-xs">
      <div>
        ${renderCourseVisual(course, 'card')}
        <div class="p-5 space-y-3">
          <div class="flex items-center gap-2 text-xs text-[#282828]/60 dark:text-white/60">
            <span class="font-medium text-[#FC6454] dark:text-[#6BB89E]">${course.category || 'Technology'}</span>
            <span aria-hidden="true">&middot;</span>
            <span>${course.duration || ''}</span>
            <span aria-hidden="true">&middot;</span>
            <span>${course.level || 'All Levels'}</span>
          </div>
          <h3 class="text-base font-semibold text-[#282828] dark:text-white leading-snug">
            ${course.title || ''}
          </h3>
          <p class="text-xs text-[#282828]/70 dark:text-white/70 line-clamp-3 leading-relaxed">
            ${course.description || ''}
          </p>
        </div>
      </div>
      <div class="px-6 py-4 border-t border-[#282828]/10 dark:border-[#25473C] bg-[#EFE6DE]/40 dark:bg-[#071A14]/50 flex items-center justify-between text-xs">
        <span class="text-[#282828]/60 dark:text-white/60">
          By <strong class="text-[#282828] dark:text-white font-medium">${course.instructor || ''}</strong>
        </span>
        <button
          data-nav="/courses/${course.id}"
          class="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-mono font-medium border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer">
          View Curriculum &rarr;
        </button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('[data-nav]').forEach(el => {
    el.onclick = (e) => {
      e.preventDefault();
      const target = el.getAttribute('data-nav');
      if (target) router.navigate(target);
    };
  });
}

function updateCategoryButtons() {
  document.querySelectorAll('[data-course-category]').forEach(btn => {
    const cat = btn.getAttribute('data-course-category');
    if (cat === selectedCategory) {
      btn.className = 'px-3 py-1.5 rounded-md text-xs font-semibold bg-white dark:bg-[#071A14] text-[#282828] dark:text-white shadow-xs cursor-pointer border-0';
    } else {
      btn.className = 'px-3 py-1.5 rounded-md text-xs font-medium text-[#282828]/70 dark:text-white/70 hover:text-[#282828] dark:hover:text-[#F7EFE8] cursor-pointer border-0 bg-transparent';
    }
  });
}

export function renderCoursesPage() {
  loadCourses();

  return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <!-- Header -->
      <div class="text-left space-y-2 border-b border-[#282828]/10 dark:border-[#25473C] pb-6">
        <span class="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider font-semibold">
          ACADEMIC CURRICULUM
        </span>
        <h1 class="text-3xl sm:text-4xl font-bold text-[#282828] dark:text-white tracking-tight font-sans">
          Courses &amp; Training
        </h1>
        <p class="text-sm text-[#282828]/70 dark:text-white max-w-2xl leading-relaxed">
          Structured student curriculum modules taught in Computer Lab 3 with hands-on projects,
          code reviews, and verified certificates.
        </p>
      </div>

      <!-- Filters & Search -->
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <!-- Categories -->
        <div class="flex flex-wrap items-center gap-1 p-1 bg-[#EFE6DE]/70 dark:bg-[#102B22] rounded-lg border border-[#282828]/10 dark:border-[#25473C]">
          ${categories.map(cat => `
            <button
              data-course-category="${cat}"
              class="${selectedCategory === cat ? 'bg-white dark:bg-[#071A14] text-[#282828] dark:text-white shadow-xs font-semibold' : 'text-[#282828]/70 dark:text-white/70 hover:text-[#282828] dark:hover:text-[#F7EFE8]'} px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border-0">
              ${cat}
            </button>
          `).join('')}
        </div>

        <!-- Search input -->
        <div class="relative w-full md:w-72">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#282828]/60 dark:text-white">
            ${icon('Search', 'w-4 h-4')}
          </span>
          <input
            id="courses-search-input"
            type="text"
            placeholder="Search courses..."
            value="${searchQuery}"
            class="w-full pl-9 pr-3 py-1.5 rounded-md border border-[#282828]/20 dark:border-[#25473C] text-xs focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 bg-white dark:bg-[#102B22] text-[#282828] dark:text-white" />
        </div>
      </div>

      <!-- Grid -->
      <div id="courses-grid-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- populated by renderCoursesGrid -->
      </div>
    </div>
  `;
}

export function initCoursesPageEvents() {
  document.querySelectorAll('[data-course-category]').forEach(btn => {
    btn.onclick = () => {
      selectedCategory = btn.getAttribute('data-course-category');
      updateCategoryButtons();
      loadCourses();
    };
  });

  const searchInput = document.getElementById('courses-search-input');
  if (searchInput) {
    let timer;
    searchInput.oninput = (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        searchQuery = e.target.value;
        loadCourses();
      }, 300);
    };
  }
}
