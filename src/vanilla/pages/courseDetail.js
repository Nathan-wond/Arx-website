import { api } from '../../services/api.js';
import { authState, router } from '../state.js';
import { icon } from '../icons.js';
import { renderCourseVisual } from '../components/courseVisual.js';

let currentCourse = null;
let loading = true;
let enrolling = false;
let feedback = null;
let errorMessage = null;

async function loadCourseDetail(courseId) {
  loading = true;
  feedback = null;
  errorMessage = null;
  try {
    const res = await api.getCourseById(courseId);
    if (res?.course) currentCourse = res.course;
  } catch (err) {
    console.error('Failed to load course details', err);
  } finally {
    loading = false;
    renderContainer(courseId);
  }
}

async function handleEnroll(courseId) {
  if (!authState.isAuthenticated) {
    router.navigate('/login');
    return;
  }
  if (!currentCourse) return;

  enrolling = true;
  errorMessage = null;
  renderContainer(courseId);

  try {
    const res = await api.enrollCourse(currentCourse.id);
    feedback = res.message || 'You have successfully enrolled in this course!';
  } catch (err) {
    errorMessage = err.message || 'Enrollment failed.';
  } finally {
    enrolling = false;
    renderContainer(courseId);
  }
}

function renderContainer(courseId) {
  const container = document.getElementById('course-detail-root');
  if (!container) return;

  if (loading) {
    container.innerHTML = `
      <div class="max-w-4xl mx-auto py-24 text-center space-y-3">
        <div class="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs font-mono text-slate-500">Loading course curriculum...</p>
      </div>
    `;
    return;
  }

  if (!currentCourse) {
    container.innerHTML = `
      <div class="max-w-xl mx-auto py-20 text-center space-y-4">
        <h2 class="text-2xl font-bold text-[#282828] dark:text-white">Course Not Found</h2>
        <p class="text-[#282828]/70 dark:text-white text-sm">The course you are looking for does not exist or was removed.</p>
        <button
          data-nav="/courses"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer">
          ${icon('ArrowLeft', 'w-4 h-4 mr-2')} Back to Courses
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <!-- Back Button -->
      <button
        data-nav="/courses"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-[#282828]/60 hover:text-[#FC6454] dark:text-white/70 dark:hover:text-[#FD8072] cursor-pointer border-0 bg-transparent p-0">
        ${icon('ArrowLeft', 'w-3.5 h-3.5')} Back to Course Catalog
      </button>

      <!-- Course Header Box -->
      <div class="bg-white dark:bg-[#102B22] text-[#282828] dark:text-white rounded-xl overflow-hidden border border-[#282828]/10 dark:border-[#25473C] shadow-xs">
        ${renderCourseVisual(currentCourse, 'banner')}
        <div class="p-6 sm:p-8 space-y-4">
          <div class="flex flex-wrap items-center gap-2 text-xs text-[#282828]/60 dark:text-white/60">
            <span class="font-semibold text-[#FC6454] dark:text-[#6BB89E]">${currentCourse.category || 'Technology'}</span>
            <span aria-hidden="true">&middot;</span>
            <span class="text-emerald-700 dark:text-emerald-400 font-medium">${currentCourse.status || 'Active'}</span>
            <span aria-hidden="true">&middot;</span>
            <span>${currentCourse.difficulty || currentCourse.level || 'All Levels'}</span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-[#282828] dark:text-white">${currentCourse.title || ''}</h1>
          <p class="text-xs sm:text-sm text-[#282828]/70 dark:text-white/75 max-w-3xl leading-relaxed">
            ${currentCourse.longDescription || currentCourse.description || ''}
          </p>

          <div class="pt-4 border-t border-[#282828]/10 dark:border-[#25473C] flex flex-wrap items-center gap-6 text-xs text-[#282828]/60 dark:text-white/60 font-mono">
            <div class="flex items-center gap-2">
              ${icon('Clock', 'w-3.5 h-3.5 text-[#FC6454]')}
              <span>Duration: <strong class="text-[#282828] dark:text-white">${currentCourse.duration || 'Flexible'}</strong></span>
            </div>
            <div class="flex items-center gap-2">
              ${icon('User', 'w-3.5 h-3.5 text-[#FC6454]')}
              <span>Instructor: <strong class="text-[#282828] dark:text-white">${currentCourse.instructor || 'Staff'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Feedback / Error messages -->
      ${feedback ? `
        <div class="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div class="flex items-center gap-2">
            ${icon('CheckCircle', 'w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0')}
            <span>${feedback}</span>
          </div>
          <button
            data-nav="/portal/courses"
            class="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#FC6454] text-white dark:bg-[#2F8068] hover:opacity-90 transition-all border-0 cursor-pointer">
            Go to My Courses
          </button>
        </div>
      ` : ''}

      ${errorMessage ? `
        <div class="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
          ${icon('AlertCircle', 'w-4 h-4 text-red-600 dark:text-red-400 shrink-0')}
          <span>${errorMessage}</span>
        </div>
      ` : ''}

      <!-- Main Columns -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-8 space-y-6">
          ${currentCourse.syllabus && currentCourse.syllabus.length > 0 ? `
            <div class="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-6 space-y-4">
              <h3 class="text-base font-bold text-[#282828] dark:text-white flex items-center gap-2">
                ${icon('BookOpen', 'w-4 h-4 text-[#FC6454]')}
                Curriculum Syllabus
              </h3>
              <div class="divide-y divide-[#282828]/10 dark:divide-[#25473C]">
                ${currentCourse.syllabus.map((item, idx) => `
                  <div class="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                    <span class="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] font-bold shrink-0 mt-0.5">
                      ${String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span class="text-xs text-[#282828]/70 dark:text-white/75 leading-relaxed">${item}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${currentCourse.prerequisites && currentCourse.prerequisites.length > 0 ? `
            <div class="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-6 space-y-3">
              <h3 class="text-sm font-bold text-[#282828] dark:text-white">Prerequisites</h3>
              <ul class="space-y-1.5 text-xs text-[#282828]/60 dark:text-white/60">
                ${currentCourse.prerequisites.map(p => `
                  <li class="flex items-center gap-2">
                    ${icon('CheckCircle2', 'w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400')}
                    <span>${p}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>

        <div class="lg:col-span-4 space-y-4">
          <div class="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-[#FAF4EE] dark:bg-[#102B22] p-6 space-y-4">
            <h3 class="text-sm font-semibold text-[#282828] dark:text-white uppercase tracking-wider font-mono">
              Course Enrollment
            </h3>
            <p class="text-xs text-[#282828]/70 dark:text-white/70 leading-relaxed">
              Enrolling grants access to hands-on lab projects, course milestone quizzes, and eligibility
              for a verified completion certificate.
            </p>

            <div class="pt-2">
              <button
                id="course-enroll-submit-btn"
                ${enrolling ? 'disabled' : ''}
                class="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer shadow-xs border-0 ${enrolling ? 'opacity-70 cursor-not-allowed' : ''}">
                ${enrolling ? 'Enrolling...' : 'Enroll in Track'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const enrollBtn = document.getElementById('course-enroll-submit-btn');
  if (enrollBtn) {
    enrollBtn.onclick = () => handleEnroll(courseId);
  }
}

export function renderCourseDetailPage(courseId) {
  loadCourseDetail(courseId);
  return `<div id="course-detail-root"></div>`;
}
