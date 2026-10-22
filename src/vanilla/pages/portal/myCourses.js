import { api } from '../../../services/api.js';
import { router, modalState } from '../../state.js';
import { icon } from '../../icons.js';

let enrollments = [];
let availableCourses = [];
let activeTab = 'All';
let loading = true;

export function renderMyCoursesPage() {
  const filteredEnrollments = enrollments.filter((e) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'In Progress') return e.progress > 0 && e.progress < 100;
    if (activeTab === 'Completed') return e.progress === 100 || e.status === 'Completed';
    return false;
  });

  return `
    <div id="portal-my-courses-root" class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
        <div>
          <span class="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider">
            STUDENT ENROLLMENTS
          </span>
          <h1 class="text-2xl font-bold text-[#282828] dark:text-[#F1F7F4] tracking-tight mt-1 font-sans">My Courses</h1>
          <p class="text-xs text-[#282828]/60 dark:text-[#B7C9C2]">
            Track your ongoing curriculum, learning progress, and milestone credentials.
          </p>
        </div>
        <button
          data-nav="/courses"
          class="inline-flex items-center justify-center font-sans tracking-tight select-none transition-colors duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#6BB89E]/40 cursor-pointer whitespace-nowrap shrink-0 text-xs px-2.5 py-1.5 font-medium bg-[#FC6454] text-white hover:bg-[#E04D3E] border border-[#FC6454] dark:bg-[#2F8068] dark:text-[#F1F7F4] dark:hover:bg-[#3A9277] dark:border-[#2F8068] shadow-xs">
          Explore Catalog
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex flex-wrap items-center gap-1 p-1 bg-[#EFE6DE]/60 dark:bg-[#0A211A] rounded-lg border border-[#282828]/10 dark:border-[#25473C] w-fit">
        ${['All', 'In Progress', 'Completed', 'Available'].map((tab) => `
          <button
            data-course-tab="${tab}"
            class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border-0 ${
              activeTab === tab
                ? 'bg-white dark:bg-[#15362B] text-[#282828] dark:text-[#F1F7F4] shadow-xs font-semibold'
                : 'text-[#282828]/70 dark:text-[#B7C9C2] hover:text-[#282828] dark:hover:text-[#F1F7F4] bg-transparent'
            }">
            ${tab}
          </button>
        `).join('')}
      </div>

      <!-- Content Area -->
      ${loading ? `
        <div class="py-16 text-center text-xs font-mono text-[#282828]/50 dark:text-[#7F9990]">Loading your courses...</div>
      ` : activeTab === 'Available' ? (
        availableCourses.length === 0 ? `
          <div class="py-12 text-center bg-[#FAF4EE] dark:bg-[#102B22] rounded-lg border border-[#282828]/10 dark:border-[#25473C] p-8 space-y-3">
            <h3 class="text-sm font-semibold text-[#282828] dark:text-[#F1F7F4]">No courses available at this time</h3>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${availableCourses.map((crs) => `
              <div class="p-5 flex flex-col justify-between space-y-4 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs transition-colors">
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="inline-flex items-center rounded-sm text-[11px] px-1.5 py-0.5 tracking-tight font-medium bg-[#FC6454]/10 dark:bg-[#2F8068]/25 text-[#FC6454] dark:text-[#6BB89E] border border-[#FC6454]/25 dark:border-[#25473C]">
                      ${crs.category}
                    </span>
                    <span class="text-xs font-mono text-[#282828]/50 dark:text-[#7F9990]">${crs.duration}</span>
                  </div>
                  <h3 class="text-base font-bold text-[#282828] dark:text-[#F1F7F4]">${crs.title}</h3>
                  <p class="text-xs text-[#282828]/70 dark:text-[#B7C9C2] line-clamp-2 leading-relaxed">${crs.description}</p>
                </div>
                <div class="pt-3 border-t border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between text-xs">
                  <span class="text-[#282828]/60 dark:text-[#7F9990]">Instructor: ${crs.instructor}</span>
                  <button
                    data-nav="/courses/${crs.id}"
                    class="inline-flex items-center justify-center font-sans tracking-tight select-none rounded-md text-xs px-2.5 py-1.5 font-medium bg-transparent text-[#282828] hover:bg-[#FC6454]/10 border border-[#282828]/25 dark:text-[#F1F7F4] dark:hover:bg-[#2F8068]/20 dark:border-[#25473C] cursor-pointer">
                    View Details
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `
      ) : filteredEnrollments.length === 0 ? `
        <div class="py-12 text-center bg-[#FAF4EE] dark:bg-[#102B22] rounded-lg border border-[#282828]/10 dark:border-[#25473C] p-8 space-y-3">
          ${icon('BookOpen', 'w-8 h-8 text-[#282828]/40 dark:text-[#7F9990] mx-auto')}
          <h3 class="text-sm font-semibold text-[#282828] dark:text-[#F1F7F4]">No courses in this section</h3>
          <p class="text-xs text-[#282828]/60 dark:text-[#B7C9C2]">
            Browse our course catalog to find a learning track that fits your goals.
          </p>
          <button
            data-nav="/courses"
            class="inline-flex items-center justify-center font-sans tracking-tight select-none transition-colors duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#6BB89E]/40 cursor-pointer whitespace-nowrap shrink-0 text-xs px-2.5 py-1.5 font-medium bg-[#FC6454] text-white hover:bg-[#E04D3E] border border-[#FC6454] dark:bg-[#2F8068] dark:text-[#F1F7F4] dark:hover:bg-[#3A9277] dark:border-[#2F8068] shadow-xs">
            Explore Courses
          </button>
        </div>
      ` : `
        <div class="space-y-4">
          ${filteredEnrollments.map((enr) => {
            const isCompleted = enr.progress === 100 || enr.status === 'Completed';
            return `
              <div class="p-6 border border-[#282828]/10 dark:border-[#25473C] space-y-4 rounded-lg bg-white dark:bg-[#102B22] shadow-xs transition-colors">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 rounded-md bg-[#EFE6DE]/60 dark:bg-[#15362B] text-[#FC6454] dark:text-[#6BB89E] border border-[#282828]/10 dark:border-[#25473C] flex items-center justify-center shrink-0">
                      ${icon('BookOpen', 'w-5 h-5')}
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <h3 class="text-base font-bold text-[#282828] dark:text-[#F1F7F4]">
                          ${enr.courseTitle || enr.course?.title || 'Course'}
                        </h3>
                        <span class="inline-flex items-center rounded-sm text-[11px] px-1.5 py-0.5 tracking-tight font-medium ${
                          isCompleted
                            ? 'bg-emerald-50 dark:bg-[#102B22] text-emerald-700 dark:text-[#58B889] border border-emerald-200 dark:border-[#25473C]'
                            : enr.progress > 0
                            ? 'bg-[#FC6454]/10 dark:bg-[#2F8068]/25 text-[#FC6454] dark:text-[#6BB89E] border border-[#FC6454]/25 dark:border-[#25473C]'
                            : 'bg-[#EFE6DE] dark:bg-[#15362B] text-[#282828] dark:text-[#F1F7F4] border border-[#282828]/15 dark:border-[#25473C]'
                        }">
                          ${isCompleted ? 'Completed' : enr.progress > 0 ? 'In Progress' : 'Not Started'}
                        </span>
                      </div>
                      <p class="text-xs font-mono text-[#282828]/50 dark:text-[#7F9990] mt-1">
                        Enrolled on ${enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-3">
                    ${isCompleted && enr.certificateId ? `
                      <button
                        data-cert-id="${enr.certificateId}"
                        class="course-view-cert-btn inline-flex items-center justify-center font-sans tracking-tight select-none rounded-md text-xs px-2.5 py-1.5 font-medium bg-transparent text-[#282828] hover:bg-[#FC6454]/10 border border-[#282828]/25 dark:text-[#F1F7F4] dark:hover:bg-[#2F8068]/20 dark:border-[#25473C] cursor-pointer">
                        ${icon('Award', 'w-3.5 h-3.5 mr-1.5 text-[#FC6454] dark:text-[#6BB89E]')}
                        View Certificate
                      </button>
                    ` : `
                      <button
                        data-nav="/courses/${enr.courseId}"
                        class="inline-flex items-center justify-center font-sans tracking-tight select-none rounded-md text-xs px-2.5 py-1.5 font-medium bg-transparent text-[#282828] hover:bg-[#FC6454]/10 border border-[#282828]/25 dark:text-[#F1F7F4] dark:hover:bg-[#2F8068]/20 dark:border-[#25473C] cursor-pointer">
                        ${icon('BookOpen', 'w-3.5 h-3.5 mr-1 text-[#FC6454] dark:text-[#6BB89E]')}
                        View Curriculum
                      </button>
                    `}
                  </div>
                </div>

                <!-- Progress Bar -->
                <div class="space-y-1.5 pt-2 border-t border-[#282828]/10 dark:border-[#25473C]">
                  <div class="flex justify-between text-xs font-mono text-[#282828]/70 dark:text-[#B7C9C2]">
                    <span class="text-[11px] tracking-wider text-[#282828]/50 dark:text-[#7F9990] uppercase">Course Progress</span>
                    <span class="font-bold text-[#FC6454] dark:text-[#6BB89E]">${enr.progress || 0}%</span>
                  </div>
                  <div class="w-full bg-[#EFE6DE] dark:bg-[#15362B] h-1.5 rounded-full overflow-hidden">
                    <div
                      class="h-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-emerald-500 dark:bg-[#58B889]'
                          : enr.progress > 0
                          ? 'bg-[#FC6454] dark:bg-[#2F8068]'
                          : 'bg-[#282828]/20 dark:bg-[#25473C]'
                      }"
                      style="width: ${enr.progress || 0}%"></div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}

function updateDOM() {
  const root = document.getElementById('portal-my-courses-root');
  if (root) {
    const parent = root.parentElement;
    if (parent) {
      parent.innerHTML = renderMyCoursesPage();
      attachListeners();
    }
  }
}

export async function initMyCoursesPageEvents() {
  attachListeners();

  loading = true;
  try {
    const [enrRes, crsRes] = await Promise.all([
      api.getMemberCourses().catch(() => ({ courses: [] })),
      api.getCourses().catch(() => ({ courses: [] }))
    ]);
    if (enrRes.courses) enrollments = enrRes.courses;
    if (crsRes.courses) availableCourses = crsRes.courses;
  } catch (err) {
    console.error('Failed to load courses', err);
  } finally {
    loading = false;
    updateDOM();
  }
}

function attachListeners() {
  // Tabs
  document.querySelectorAll('[data-course-tab]').forEach(btn => {
    btn.onclick = () => {
      activeTab = btn.getAttribute('data-course-tab');
      updateDOM();
    };
  });

  // Certificate Modal trigger
  document.querySelectorAll('.course-view-cert-btn').forEach(btn => {
    btn.onclick = () => {
      const certId = btn.getAttribute('data-cert-id');
      if (certId) modalState.openCertificateModal(certId);
    };
  });

  // Navigation buttons
  document.querySelectorAll('#portal-courses-container [data-nav]').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const target = btn.getAttribute('data-nav');
      if (target) router.navigate(target);
    };
  });
}
