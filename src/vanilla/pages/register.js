import { authState, router } from '../state.js';
import { api } from '../../services/api.js';
import { icon } from '../icons.js';

const GRADE_SECTIONS = [
  { grade: 'Grade 9', sections: ['9A', '9B', '9C', '9D', '9E'] },
  { grade: 'Grade 10', sections: ['10A', '10B', '10C', '10D', '10E'] },
  { grade: 'Grade 11', sections: ['11A', '11B', '11C', '11D', '11E'] },
  { grade: 'Grade 12', sections: ['12A', '12B', '12C', '12D', '12E'] }
];

const DEFAULT_COURSES = [
  { id: 'crs_web_dev', title: 'Web Design & Development', category: 'Web Development', duration: '12 Weeks' },
  { id: 'crs_python', title: 'Python Programming', category: 'Programming', duration: '10 Weeks' },
  { id: 'crs_cybersecurity', title: 'Cybersecurity Defense', category: 'Security', duration: '12 Weeks' },
  { id: 'crs_robotics', title: 'Robotics Engineering', category: 'Hardware & Engineering', duration: '14 Weeks' },
  { id: 'crs_ai&machinelearning', title: 'AI & Machine Learning', category: 'Artificial Intelligence', duration: '12 Weeks' }
];

export function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

// Initialize availableCourses immediately so the initial render is instantaneous (0ms lag)
let availableCourses = [...DEFAULT_COURSES];

let formState = {
  firstName: '',
  secondName: '',
  lastName: '',
  class: '',
  courseIds: [],
  password: '',
  confirmPassword: '',
  phoneNumber: '',
  email: '',
  telegramUsername: '',
  award: '',
  motivationEssay: ''
};

let tgStatus = {
  checking: false,
  valid: null,
  error: null,
  message: null,
  normalized: null
};

let emailStatus = {
  checking: false,
  valid: null,
  error: null
};

let tgCheckTimer = null;
let emailCheckTimer = null;

let awardFilesList = [];
let loading = false;
let errorMessage = null;
let awardFileUploadError = null;
let isRegistrationClosed = false;
let registrationResult = null;
let copiedMemberId = false;

// Synchronize all current DOM inputs into formState so no values are ever lost
function syncDOMToFormState() {
  const fn = document.getElementById('reg-first-name');
  if (fn) formState.firstName = fn.value;
  const sn = document.getElementById('reg-second-name');
  if (sn) formState.secondName = sn.value;
  const ln = document.getElementById('reg-last-name');
  if (ln) formState.lastName = ln.value;
  const cls = document.getElementById('reg-class');
  if (cls) formState.class = cls.value;
  const ph = document.getElementById('reg-phone');
  if (ph) formState.phoneNumber = ph.value;
  const em = document.getElementById('reg-email');
  if (em) formState.email = em.value;
  const tg = document.getElementById('reg-telegram');
  if (tg) formState.telegramUsername = tg.value;
  const pw = document.getElementById('reg-password');
  if (pw) formState.password = pw.value;
  const cpw = document.getElementById('reg-confirm-password');
  if (cpw) formState.confirmPassword = cpw.value;
  const aw = document.getElementById('reg-award');
  if (aw) formState.award = aw.value;
  const mot = document.getElementById('reg-motivation');
  if (mot) formState.motivationEssay = mot.value;

  const checkedCourses = Array.from(document.querySelectorAll('.reg-course-checkbox:checked')).map(cb => cb.value);
  if (checkedCourses.length > 0) {
    formState.courseIds = checkedCourses;
  }
}

async function loadInitData() {
  try {
    const [coursesRes, settingsRes] = await Promise.all([
      api.getCourses().catch(() => ({ courses: [] })),
      api.getPublicSettings().catch(() => ({ settings: null }))
    ]);

    let changed = false;
    if (coursesRes?.courses && coursesRes.courses.length > 0) {
      if (JSON.stringify(coursesRes.courses) !== JSON.stringify(availableCourses)) {
        availableCourses = coursesRes.courses;
        changed = true;
      }
    }

    if (settingsRes?.settings?.registrationStatus === 'CLOSED') {
      isRegistrationClosed = true;
      syncDOMToFormState();
      renderRegisterPageDOM();
      return;
    }

    if (changed) {
      syncDOMToFormState();
      renderRegisterPageDOM();
    }
  } catch {
    // Keep DEFAULT_COURSES
  }
}

async function compressAndProcessFile(file) {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    if (file.size > 2.5 * 1024 * 1024) {
      throw new Error(`PDF "${file.name}" exceeds 2.5MB limit. Please upload a compressed PDF or document photo.`);
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        file,
        dataUrl: reader.result,
        filename: file.name,
        formattedSize: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`,
        mimeType: file.type,
        byteSize: file.size
      });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const outputMime = 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputMime, 0.78);
        const approxBytes = Math.round((dataUrl.length * 3) / 4);
        let finalName = file.name;
        if (!finalName.toLowerCase().endsWith('.jpg') && !finalName.toLowerCase().endsWith('.jpeg')) {
          finalName = finalName.replace(/\.[^/.]+$/, '') + '.jpg';
        }
        resolve({
          file,
          dataUrl,
          filename: finalName,
          formattedSize: approxBytes > 1024 * 1024 ? `${(approxBytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(approxBytes / 1024)} KB`,
          mimeType: outputMime,
          byteSize: approxBytes
        });
      };
      img.onerror = () => resolve({
        file,
        dataUrl: event.target.result,
        filename: file.name,
        formattedSize: `${Math.round(file.size / 1024)} KB`,
        mimeType: file.type,
        byteSize: file.size
      });
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function getRegisterPageHTML() {
  if (isRegistrationClosed) {
    return `
      <div class="max-w-xl mx-auto px-4 py-16">
        <div class="p-8 sm:p-10 text-center space-y-6 border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] rounded-2xl shadow-sm">
          <div class="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto">
            ${icon('AlertCircle', 'w-8 h-8')}
          </div>
          <div class="space-y-3">
            <span class="text-xs font-mono font-bold tracking-widest text-amber-600 dark:text-amber-400 uppercase">STATUS · CLOSED</span>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] dark:text-[#F1F7F4] tracking-tight">Admissions Currently Closed</h2>
            <p class="text-sm sm:text-base text-[#282828]/80 dark:text-[#D1E0DA] leading-relaxed max-w-md mx-auto">
              Student registrations for the ARX IT CLUB cohort are currently closed. Please check our announcements channel on Telegram for the next intake cycle.
            </p>
          </div>
          <div class="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://t.me/arxitclub"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#FC6454] dark:bg-[#2F8068] text-white text-sm font-bold hover:opacity-90 transition-opacity">
              <span>Join Announcements Channel</span>
              ${icon('ExternalLink', 'w-4 h-4')}
            </a>
            <button
              data-nav="/"
              class="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-[#282828]/20 dark:border-[#25473C] text-[#282828] dark:text-[#F1F7F4] text-sm font-semibold hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer">
              Return to Home
            </button>
          </div>
        </div>
      </div>
    `;
  }

  if (registrationResult) {
    return `
      <div class="max-w-2xl mx-auto px-4 py-16">
        <div class="p-8 sm:p-10 text-center space-y-6 border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] rounded-2xl shadow-sm">
          <div class="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-[#15362B] text-emerald-600 dark:text-[#58B889] border border-emerald-300 dark:border-[#25473C] flex items-center justify-center mx-auto shadow-sm">
            ${icon('CheckCircle2', 'w-9 h-9')}
          </div>
          
          <div class="space-y-2">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider text-emerald-700 dark:text-[#58B889] bg-emerald-100/70 dark:bg-[#15362B]/80 uppercase">
              ${icon('Check', 'w-3.5 h-3.5')} Application Recorded
            </span>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-[#1a1a1a] dark:text-[#F1F7F4] tracking-tight">
              Registration Successful
            </h2>
            <p class="text-sm sm:text-base text-[#282828]/80 dark:text-[#D1E0DA] leading-relaxed max-w-lg mx-auto">
              Welcome to <strong>ARX IT CLUB</strong>, <strong>${registrationResult.studentName}</strong>. Your membership application has been successfully submitted!
            </p>
          </div>

          <!-- Status Indicator: Waiting for Admin Approval -->
          <div class="p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center gap-2.5 text-center">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span class="text-sm sm:text-base font-bold text-amber-800 dark:text-amber-300">
              Waiting for Admin Approval
            </span>
          </div>

          <!-- Member ID / Login ID Box -->
          <div class="bg-[#FAF4EE] dark:bg-[#0C241C] text-[#282828] dark:text-[#F1F7F4] rounded-xl p-6 sm:p-7 space-y-4 border border-[#282828]/10 dark:border-[#25473C] transition-colors shadow-xs">
            <div class="space-y-1">
              <p class="text-xs sm:text-sm uppercase tracking-wider text-[#FC6454] dark:text-[#6BB89E] font-mono font-bold">
                Your Official Login ID (Member ID)
              </p>
              <p class="text-xs text-[#282828]/60 dark:text-[#B7C9C2]">
                Please write down or copy this ID. You will use it to log in once your account is approved.
              </p>
            </div>

            <div class="flex items-center justify-center gap-3">
              <span class="font-mono text-3xl sm:text-4xl font-black text-[#FC6454] dark:text-[#6BB89E] tracking-widest selection:bg-[#FC6454]/20">
                ${registrationResult.memberId}
              </span>
              <button
                id="reg-copy-member-id"
                class="p-2.5 rounded-lg bg-white dark:bg-[#15362B] hover:bg-[#FC6454]/10 border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-[#F1F7F4] transition-colors cursor-pointer shadow-xs"
                title="Copy Login ID">
                ${copiedMemberId ? icon('Check', 'w-5 h-5 text-emerald-500') : icon('Copy', 'w-5 h-5')}
              </button>
            </div>
            ${copiedMemberId ? `<p class="text-xs sm:text-sm font-mono font-semibold text-emerald-600 dark:text-[#58B889]">Copied to clipboard!</p>` : ''}
          </div>

          <!-- What Happens Next Guide -->
          <div class="p-5 rounded-xl bg-slate-50 dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] text-left space-y-3">
            <h3 class="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-[#282828] dark:text-[#F1F7F4] flex items-center gap-2">
              ${icon('Info', 'w-4 h-4 text-sky-500')} What Happens Next?
            </h3>
            <ul class="space-y-2.5 text-xs sm:text-sm text-[#282828]/80 dark:text-[#D1E0DA]">
              <li class="flex items-start gap-2.5">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs shrink-0 mt-0.5">1</span>
                <span><strong>Admin Review:</strong> Club administrators will evaluate your application and course track selections.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs shrink-0 mt-0.5">2</span>
                <span><strong>Automated Notification:</strong> Once your application is reviewed, you will receive an automated message via email ${registrationResult.email ? `to <strong>${registrationResult.email}</strong>` : ''} and/or Telegram informing you whether your application is <strong>approved</strong>, <strong>denied</strong>, or <strong>suspended</strong>.</span>
              </li>
              <li class="flex items-start gap-2.5">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs shrink-0 mt-0.5">3</span>
                <span><strong>Sign In After Approval:</strong> Once approved, you can immediately access the student portal with your Login ID (<code class="font-mono text-[#FC6454] dark:text-[#6BB89E] font-bold">${registrationResult.memberId}</code>) and the password you created.</span>
              </li>
            </ul>
          </div>

          <!-- Action Buttons -->
          <div class="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              data-nav="/login"
              class="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-bold rounded-lg bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer border-0 shadow-sm">
              <span>Go to Sign In</span>
              ${icon('ArrowRight', 'w-4 h-4')}
            </button>
            <a
              href="${registrationResult.telegramChannelUrl || 'https://t.me/arxitclub'}"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-lg border border-[#282828]/20 dark:border-[#25473C] text-[#282828] dark:text-[#F1F7F4] hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors">
              <span>Join Announcements (@arxitclub)</span>
              ${icon('ExternalLink', 'w-4 h-4 text-[#282828]/40 dark:text-[#B7C9C2]/60')}
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // Regular Registration Form
  return `
    <div class="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div class="text-left space-y-2 border-b border-[#282828]/10 dark:border-[#25473C] pb-6">
        <span class="text-xs sm:text-sm font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider font-bold">
          STUDENT ADMISSIONS
        </span>
        <h1 class="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] dark:text-[#F1F7F4] tracking-tight font-sans">
          Register for ARX IT CLUB
        </h1>
        <p class="text-sm sm:text-base text-[#282828]/80 dark:text-[#D1E0DA] leading-relaxed">
          Admissions are open to all students passionate about programming, web systems, robotics, and cybersecurity.
        </p>
      </div>

      ${errorMessage ? `
        <div id="reg-form-error-box" class="p-4 rounded-xl bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900/60 text-sm text-red-800 dark:text-rose-300 flex items-center gap-3">
          ${icon('AlertCircle', 'w-5 h-5 shrink-0 text-red-600 dark:text-rose-400')}
          <span class="font-medium">${errorMessage}</span>
        </div>
      ` : ''}

      <form id="main-register-form" class="space-y-6">
        <!-- Section 1: Student Information -->
        <div class="p-6 sm:p-7 rounded-2xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-5 shadow-xs">
          <h3 class="text-xs sm:text-sm font-mono uppercase tracking-wider text-[#FC6454] dark:text-[#6BB89E] font-bold">
            1. Student Information
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-bold text-[#1e1e1e] dark:text-[#F1F7F4] mb-1.5">First Name *</label>
              <input
                id="reg-first-name"
                type="text"
                required
                placeholder="e.g. John"
                value="${formState.firstName}"
                class="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-lg border border-[#282828]/25 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#1c1c1c] dark:text-[#F1F7F4] placeholder:text-[#282828]/40 dark:placeholder:text-[#7F9990]/60 focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#2F8068]/50 transition-colors" />
            </div>
            <div>
              <label class="block text-sm font-bold text-[#1e1e1e] dark:text-[#F1F7F4] mb-1.5">Middle Name</label>
              <input
                id="reg-second-name"
                type="text"
                placeholder="e.g. Robert"
                value="${formState.secondName}"
                class="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-lg border border-[#282828]/25 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#1c1c1c] dark:text-[#F1F7F4] placeholder:text-[#282828]/40 dark:placeholder:text-[#7F9990]/60 focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#2F8068]/50 transition-colors" />
            </div>
            <div>
              <label class="block text-sm font-bold text-[#1e1e1e] dark:text-[#F1F7F4] mb-1.5">Last Name *</label>
              <input
                id="reg-last-name"
                type="text"
                required
                placeholder="e.g. Doe"
                value="${formState.lastName}"
                class="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-lg border border-[#282828]/25 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#1c1c1c] dark:text-[#F1F7F4] placeholder:text-[#282828]/40 dark:placeholder:text-[#7F9990]/60 focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#2F8068]/50 transition-colors" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
            <div>
              <label class="block text-sm font-bold text-[#1e1e1e] dark:text-[#F1F7F4] mb-1.5">Grade &amp; Section *</label>
              <select
                id="reg-class"
                required
                class="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-lg border border-[#282828]/25 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#1c1c1c] dark:text-[#F1F7F4] focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#2F8068]/50 transition-colors cursor-pointer">
                <option value="">Select Grade Section...</option>
                ${GRADE_SECTIONS.map(g => `
                  <optgroup label="${g.grade}" class="font-bold">
                    ${g.sections.map(s => `
                      <option value="${s}" ${formState.class === s ? 'selected' : ''}>${s}</option>
                    `).join('')}
                  </optgroup>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-sm font-bold text-[#1e1e1e] dark:text-[#F1F7F4] mb-2">
                Course Track Preferences *
                <span class="text-[#FC6454] dark:text-[#6BB89E] font-semibold text-xs sm:text-sm">(Choose exactly 2)</span>
              </label>
              <div id="reg-courses-container" class="grid grid-cols-1 gap-2.5">
                ${availableCourses.map(c => {
                  const isChecked = formState.courseIds.includes(c.id);
                  const isDisabled = !isChecked && formState.courseIds.length >= 2;
                  return `
                    <label data-course-card="${c.id}" class="flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                      isChecked
                        ? 'border-[#FC6454] dark:border-[#2F8068] bg-[#FC6454]/5 dark:bg-[#2F8068]/10 shadow-xs ring-1 ring-[#FC6454]/20 dark:ring-[#2F8068]/30 cursor-pointer'
                        : isDisabled
                        ? 'border-[#282828]/10 dark:border-[#25473C] opacity-45 cursor-not-allowed bg-[#282828]/5 dark:bg-[#0C241C]/30'
                        : 'border-[#282828]/15 dark:border-[#25473C] hover:border-[#FC6454]/50 dark:hover:border-[#2F8068]/50 hover:bg-[#FC6454]/[0.02] dark:hover:bg-[#2F8068]/[0.05] cursor-pointer'
                    }">
                      <input
                        type="checkbox"
                        class="reg-course-checkbox mt-1 w-4 h-4 rounded accent-[#FC6454] dark:accent-[#2F8068] cursor-pointer"
                        value="${c.id}"
                        ${isChecked ? 'checked' : ''}
                        ${isDisabled ? 'disabled' : ''} />
                      <div class="min-w-0 flex-1">
                        <p class="text-sm sm:text-base font-bold text-[#1c1c1c] dark:text-[#F1F7F4] leading-snug">${c.title}</p>
                        <p class="text-xs sm:text-sm text-[#282828]/70 dark:text-[#B7C9C2] mt-0.5">${c.category} &middot; ${c.duration}</p>
                      </div>
                    </label>
                  `;
                }).join('')}
              </div>
              <div id="reg-courses-counter" class="${formState.courseIds.length === 2 ? 'text-xs sm:text-sm font-bold text-emerald-600 dark:text-[#58B889] mt-2 flex items-center gap-1' : 'text-xs sm:text-sm font-semibold text-[#FC6454] dark:text-[#6BB89E] mt-2'}">
                ${formState.courseIds.length === 2 ? '✓ 2/2 course tracks selected' : `${formState.courseIds.length}/2 selected (Choose exactly 2)`}
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Contact & Telegram Linking -->
        <div class="p-6 sm:p-7 rounded-2xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-5 shadow-xs">
          <h3 class="text-xs sm:text-sm font-mono uppercase tracking-wider text-[#FC6454] dark:text-[#6BB89E] font-bold">
            2. Contact &amp; Telegram Linking
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold text-[#1e1e1e] dark:text-[#F1F7F4] mb-1.5">Phone Number *</label>
              <input
                id="reg-phone"
                type="tel"
                required
                placeholder="e.g. +251 911 234567"
                value="${formState.phoneNumber}"
                class="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-lg border border-[#282828]/25 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#1c1c1c] dark:text-[#F1F7F4] placeholder:text-[#282828]/40 dark:placeholder:text-[#7F9990]/60 focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#2F8068]/50 transition-colors" />
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="text-sm font-bold text-[#1e1e1e] dark:text-[#F1F7F4]">Email Address (Optional)</label>
                <span id="email-live-status" class="text-xs font-mono"></span>
              </div>
              <input
                id="reg-email"
                type="email"
                placeholder="e.g. student@school.edu"
                value="${formState.email}"
                class="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-lg border border-[#282828]/25 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#1c1c1c] dark:text-[#F1F7F4] placeholder:text-[#282828]/40 dark:placeholder:text-[#7F9990]/60 focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#2F8068]/50 transition-colors" />
              <div id="email-feedback" class="mt-1 text-xs"></div>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-sm font-bold text-[#1e1e1e] dark:text-[#F1F7F4]">Telegram Username *</label>
              <span id="tg-live-status" class="text-xs font-mono"></span>
            </div>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm sm:text-base font-mono font-bold text-[#282828]/40 dark:text-[#7F9990]">@</span>
              <input
                id="reg-telegram"
                type="text"
                required
                placeholder="username"
                value="${formState.telegramUsername.replace(/^@/, '')}"
                class="w-full pl-8 pr-3.5 py-2.5 text-sm sm:text-base rounded-lg border border-[#282828]/25 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#1c1c1c] dark:text-[#F1F7F4] placeholder:text-[#282828]/40 dark:placeholder:text-[#7F9990]/60 focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#2F8068]/50 transition-colors" />
            </div>
            <div id="tg-feedback" class="mt-1.5 text-xs">
              <p class="text-xs text-[#282828]/70 dark:text-[#B7C9C2] leading-normal">
                Accepts optional leading @. Account ownership will be verified through @ARXITCLUB_bot.
              </p>
            </div>
          </div>
        </div>

        <!-- Section 3: Password Security -->
        <div class="p-6 sm:p-7 rounded-2xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-5 shadow-xs">
          <h3 class="text-xs sm:text-sm font-mono uppercase tracking-wider text-[#FC6454] dark:text-[#6BB89E] font-bold">
            3. Account Password
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold text-[#1e1e1e] dark:text-[#F1F7F4] mb-1.5">Create Password *</label>
              <input
                id="reg-password"
                type="password"
                required
                placeholder="At least 8 characters"
                value="${formState.password}"
                class="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-lg border border-[#282828]/25 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#1c1c1c] dark:text-[#F1F7F4] placeholder:text-[#282828]/40 dark:placeholder:text-[#7F9990]/60 focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#2F8068]/50 transition-colors" />
            </div>
            <div>
              <label class="block text-sm font-bold text-[#1e1e1e] dark:text-[#F1F7F4] mb-1.5">Confirm Password *</label>
              <input
                id="reg-confirm-password"
                type="password"
                required
                placeholder="Re-type password"
                value="${formState.confirmPassword}"
                class="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-lg border border-[#282828]/25 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#1c1c1c] dark:text-[#F1F7F4] placeholder:text-[#282828]/40 dark:placeholder:text-[#7F9990]/60 focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#2F8068]/50 transition-colors" />
            </div>
          </div>
        </div>

        <!-- Section 4: Prior Achievements & Motivation -->
        <div class="p-6 sm:p-7 rounded-2xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-5 shadow-xs">
          <h3 class="text-xs sm:text-sm font-mono uppercase tracking-wider text-[#FC6454] dark:text-[#6BB89E] font-bold">
            4. Prior Achievements &amp; Motivation
          </h3>

          <div>
            <label class="block text-sm font-bold text-[#1e1e1e] dark:text-[#F1F7F4] mb-1.5">
              Awards &amp; Competitions <span class="text-[#282828]/50 dark:text-[#7F9990] font-normal text-xs sm:text-sm">(Optional)</span>
            </label>
            <input
              id="reg-award"
              type="text"
              placeholder="e.g. Science Fair 1st Place, Robotics Club member"
              value="${formState.award}"
              class="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-lg border border-[#282828]/25 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#1c1c1c] dark:text-[#F1F7F4] placeholder:text-[#282828]/40 dark:placeholder:text-[#7F9990]/60 focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#2F8068]/50 transition-colors" />
          </div>

          <!-- Attachments File Box Dropzone -->
          <div>
            <label class="block text-sm font-bold text-[#1e1e1e] dark:text-[#F1F7F4] mb-1.5">
              Upload Certificate / Document Photos <span class="text-[#282828]/50 dark:text-[#7F9990] font-normal text-xs sm:text-sm">(Optional)</span>
            </label>
            <div
              id="reg-award-dropzone"
              role="button"
              tabindex="0"
              class="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#282828]/25 dark:border-[#294B40] hover:border-[#FC6454] dark:hover:border-[#6BB89E] rounded-xl cursor-pointer bg-[#FAF4EE]/40 dark:bg-[#0C241C]/40 hover:bg-[#FAF4EE] dark:hover:bg-[#0C241C] transition-all group focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40"
            >
              <input
                id="reg-award-files"
                type="file"
                multiple
                accept=".pdf,image/jpeg,image/png,image/webp"
                class="hidden" />

              <div class="flex flex-col items-center justify-center text-center gap-2 pointer-events-none">
                <div class="w-12 h-12 rounded-full bg-[#FC6454]/10 dark:bg-[#2F8068]/20 text-[#FC6454] dark:text-[#6BB89E] flex items-center justify-center transition-transform group-hover:scale-110">
                  ${icon('UploadCloud', 'w-6 h-6')}
                </div>
                <div>
                  <p class="text-sm sm:text-base font-bold text-[#1c1c1c] dark:text-[#F1F7F4]">
                    <span class="text-[#FC6454] dark:text-[#6BB89E] underline underline-offset-2">Click this box to choose files</span> or drag and drop
                  </p>
                  <p class="text-xs sm:text-sm text-[#282828]/70 dark:text-[#B7C9C2] mt-1">
                    PDF, JPG, PNG or WEBP (Max 5 files, under 3.2MB total)
                  </p>
                </div>
              </div>
            </div>

            ${awardFileUploadError ? `<p class="text-xs sm:text-sm text-rose-600 dark:text-rose-400 mt-2 font-medium">${awardFileUploadError}</p>` : ''}
            ${awardFilesList.length > 0 ? `
              <div class="space-y-2 pt-3">
                <p class="text-xs sm:text-sm font-bold text-[#1e1e1e] dark:text-[#B7C9C2]">Attached Files (${awardFilesList.length}/5):</p>
                ${awardFilesList.map((f, idx) => `
                  <div class="flex items-center justify-between p-3 rounded-lg bg-[#FAF4EE] dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] text-sm">
                    <div class="flex items-center gap-2.5 truncate max-w-xs font-mono">
                      <span class="text-[#FC6454] dark:text-[#6BB89E]">${icon('FileText', 'w-4 h-4')}</span>
                      <span class="truncate font-medium">${f.filename}</span>
                      <span class="text-[#282828]/50 dark:text-[#B7C9C2]/60 text-xs">(${f.formattedSize})</span>
                    </div>
                    <button type="button" data-remove-award-file="${idx}" class="text-xs sm:text-sm font-bold text-rose-500 hover:text-rose-700 cursor-pointer border-0 bg-transparent px-2.5 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">Remove</button>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-sm font-bold text-[#1e1e1e] dark:text-[#F1F7F4]">
                Why do you want to join ARX IT Club? (Motivation Statement) <span class="text-[#FC6454] dark:text-[#6BB89E]">*</span>
              </label>
              <span class="text-xs font-mono text-[#282828]/60 dark:text-[#B7C9C2]">
                Min. 100 words
              </span>
            </div>
            <p class="text-xs sm:text-sm text-[#282828]/70 dark:text-[#B7C9C2] mb-2 leading-relaxed">
              Explain why you want to join ARX IT Club, what skills you hope to learn in Computer Lab 3, and what projects you want to build.
            </p>
            <textarea
              id="reg-motivation"
              rows="5"
              required
              placeholder="Explain why you want to join ARX IT Club (minimum 100 words required)..."
              class="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-lg border border-[#282828]/25 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#1c1c1c] dark:text-[#F1F7F4] placeholder:text-[#282828]/40 dark:placeholder:text-[#7F9990]/60 focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#2F8068]/50 resize-y min-h-[130px]">${formState.motivationEssay}</textarea>
            <div id="essay-word-counter" class="mt-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-mono">
              ${(() => {
                const count = countWords(formState.motivationEssay);
                const remaining = Math.max(0, 100 - count);
                const valid = count >= 100;
                if (valid) {
                  return `
                    <span class="inline-flex items-center gap-1.5 text-emerald-600 dark:text-[#58B889] font-semibold">
                      ${icon('CheckCircle', 'w-4 h-4')}
                      <span>Words written: ${count} / 100. Minimum requirement met!</span>
                    </span>
                    <span class="text-[11px] text-[#282828]/50 dark:text-[#7F9990]">Requirement satisfied</span>
                  `;
                } else {
                  return `
                    <span class="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                      ${icon('AlertCircle', 'w-4 h-4')}
                      <span>Words written: ${count} / 100. ${remaining} more words required.</span>
                    </span>
                    <span class="text-[11px] text-[#282828]/50 dark:text-[#7F9990]">Normalized non-empty words</span>
                  `;
                }
              })()}
            </div>
          </div>
        </div>

        <div class="pt-3">
          <button
            type="submit"
            ${loading ? 'disabled' : ''}
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-bold rounded-lg bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer shadow-md hover:shadow-lg border-0 ${loading ? 'opacity-70 cursor-not-allowed' : ''}">
            ${loading ? 'Submitting Application...' : 'Submit Application &amp; Register &rarr;'}
          </button>
        </div>
      </form>
    </div>
  `;
}

function attachRegisterPageEvents() {
  const root = document.getElementById('register-page-root');
  if (!root) return;

  // 1. Success screen handler (only copy button needed)
  if (registrationResult) {
    const copyBtn = document.getElementById('reg-copy-member-id');
    if (copyBtn) {
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(registrationResult.memberId);
        copiedMemberId = true;
        renderRegisterPageDOM();
        setTimeout(() => {
          copiedMemberId = false;
          renderRegisterPageDOM();
        }, 2000);
      };
    }
    return;
  }

  // 3. Two-way continuous sync on all inputs so student typing is NEVER lost
  const inputsToSync = [
    ['reg-first-name', 'firstName'],
    ['reg-second-name', 'secondName'],
    ['reg-last-name', 'lastName'],
    ['reg-class', 'class'],
    ['reg-phone', 'phoneNumber'],
    ['reg-email', 'email'],
    ['reg-telegram', 'telegramUsername'],
    ['reg-password', 'password'],
    ['reg-confirm-password', 'confirmPassword'],
    ['reg-award', 'award'],
    ['reg-motivation', 'motivationEssay']
  ];

  function updateEssayCounterUI() {
    const counter = document.getElementById('essay-word-counter');
    const textarea = document.getElementById('reg-motivation');
    if (!counter || !textarea) return;

    const count = countWords(textarea.value);
    const remaining = Math.max(0, 100 - count);
    const valid = count >= 100;

    if (valid) {
      textarea.classList.remove('border-amber-400', 'border-rose-400');
      textarea.classList.add('border-emerald-500');
      counter.innerHTML = `
        <span class="inline-flex items-center gap-1.5 text-emerald-600 dark:text-[#58B889] font-semibold">
          ${icon('CheckCircle', 'w-4 h-4')}
          <span>Words written: ${count} / 100. Minimum requirement met!</span>
        </span>
        <span class="text-[11px] text-[#282828]/50 dark:text-[#7F9990]">Requirement satisfied</span>
      `;
    } else {
      textarea.classList.remove('border-emerald-500');
      if (count > 0) textarea.classList.add('border-amber-400');
      counter.innerHTML = `
        <span class="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
          ${icon('AlertCircle', 'w-4 h-4')}
          <span>Words written: ${count} / 100. ${remaining} more words required.</span>
        </span>
        <span class="text-[11px] text-[#282828]/50 dark:text-[#7F9990]">Normalized non-empty words</span>
      `;
    }
  }

  function handleTelegramLiveValidation(raw) {
    const statusEl = document.getElementById('tg-live-status');
    const feedbackEl = document.getElementById('tg-feedback');
    const inputEl = document.getElementById('reg-telegram');
    if (!feedbackEl || !inputEl) return;

    if (tgCheckTimer) clearTimeout(tgCheckTimer);

    const trimmed = (raw || '').trim();
    if (!trimmed) {
      if (statusEl) statusEl.textContent = '';
      feedbackEl.innerHTML = `<p class="text-xs text-[#282828]/70 dark:text-[#B7C9C2] leading-normal">Accepts optional leading @. Account ownership will be verified through @ARXITCLUB_bot.</p>`;
      inputEl.classList.remove('border-emerald-500', 'border-rose-500');
      return;
    }

    const clean = trimmed.replace(/^https?:\/\/t\.me\//i, '').replace(/^@+/, '').trim();

    // Client syntax pre-validation
    if (clean.length < 5) {
      if (statusEl) statusEl.textContent = '';
      feedbackEl.innerHTML = `<p class="text-xs text-rose-600 dark:text-rose-400 font-medium leading-tight">Telegram username must be at least 5 characters long.</p>`;
      inputEl.classList.remove('border-emerald-500');
      inputEl.classList.add('border-rose-500');
      return;
    }
    if (clean.length > 32) {
      if (statusEl) statusEl.textContent = '';
      feedbackEl.innerHTML = `<p class="text-xs text-rose-600 dark:text-rose-400 font-medium leading-tight">Telegram username cannot exceed 32 characters.</p>`;
      inputEl.classList.remove('border-emerald-500');
      inputEl.classList.add('border-rose-500');
      return;
    }
    if (!/^[a-zA-Z]/.test(clean)) {
      if (statusEl) statusEl.textContent = '';
      feedbackEl.innerHTML = `<p class="text-xs text-rose-600 dark:text-rose-400 font-medium leading-tight">Telegram username must start with a letter (a-z).</p>`;
      inputEl.classList.remove('border-emerald-500');
      inputEl.classList.add('border-rose-500');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      if (statusEl) statusEl.textContent = '';
      feedbackEl.innerHTML = `<p class="text-xs text-rose-600 dark:text-rose-400 font-medium leading-tight">Please enter a valid Telegram username.</p>`;
      inputEl.classList.remove('border-emerald-500');
      inputEl.classList.add('border-rose-500');
      return;
    }
    if (clean.endsWith('_')) {
      if (statusEl) statusEl.textContent = '';
      feedbackEl.innerHTML = `<p class="text-xs text-rose-600 dark:text-rose-400 font-medium leading-tight">Telegram username cannot end with an underscore (_).</p>`;
      inputEl.classList.remove('border-emerald-500');
      inputEl.classList.add('border-rose-500');
      return;
    }
    if (/__/.test(clean)) {
      if (statusEl) statusEl.textContent = '';
      feedbackEl.innerHTML = `<p class="text-xs text-rose-600 dark:text-rose-400 font-medium leading-tight">Telegram username cannot contain consecutive underscores (__).</p>`;
      inputEl.classList.remove('border-emerald-500');
      inputEl.classList.add('border-rose-500');
      return;
    }

    if (statusEl) {
      statusEl.className = 'text-xs font-mono text-blue-600 dark:text-blue-400';
      statusEl.textContent = 'Checking...';
    }
    feedbackEl.innerHTML = `<p class="text-xs text-blue-600 dark:text-blue-400">Checking username availability…</p>`;

    tgCheckTimer = setTimeout(async () => {
      try {
        const res = await api.checkTelegramUsername(clean);
        if (res.available) {
          if (statusEl) statusEl.textContent = '';
          inputEl.classList.remove('border-rose-500');
          inputEl.classList.add('border-emerald-500');
          feedbackEl.innerHTML = `
            <p class="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              ${icon('CheckCircle', 'w-3.5 h-3.5')}
              <span>Username format is valid, but account ownership has not yet been verified.</span>
            </p>
            <p class="text-[11px] text-[#282828]/50 dark:text-[#7F9990] mt-0.5">Account ownership will be verified through @ARXITCLUB_bot upon registration.</p>
          `;
        } else {
          if (statusEl) statusEl.textContent = '';
          inputEl.classList.remove('border-emerald-500');
          inputEl.classList.add('border-rose-500');
          const errMsg = res.taken
            ? 'This username is already registered with ARX IT Club.'
            : (res.error || 'Please enter a valid Telegram username.');
          feedbackEl.innerHTML = `<p class="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">${icon('AlertCircle', 'w-3.5 h-3.5')}<span>${errMsg}</span></p>`;
        }
      } catch (err) {
        if (statusEl) statusEl.textContent = '';
        feedbackEl.innerHTML = `<p class="text-xs text-rose-600 dark:text-rose-400">${err.message || 'Error checking Telegram availability.'}</p>`;
      }
    }, 400);
  }

  function handleEmailLiveValidation(raw) {
    const statusEl = document.getElementById('email-live-status');
    const feedbackEl = document.getElementById('email-feedback');
    const inputEl = document.getElementById('reg-email');
    if (!feedbackEl || !inputEl) return;

    if (emailCheckTimer) clearTimeout(emailCheckTimer);

    const trimmed = (raw || '').trim();
    if (!trimmed) {
      if (statusEl) statusEl.textContent = '';
      feedbackEl.innerHTML = '';
      inputEl.classList.remove('border-emerald-500', 'border-rose-500');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      if (statusEl) statusEl.textContent = '';
      feedbackEl.innerHTML = `<p class="text-xs text-rose-600 dark:text-rose-400 font-medium">Please enter a valid email address (e.g. name@example.com).</p>`;
      inputEl.classList.remove('border-emerald-500');
      inputEl.classList.add('border-rose-500');
      return;
    }

    if (statusEl) {
      statusEl.className = 'text-xs font-mono text-blue-600 dark:text-blue-400';
      statusEl.textContent = 'Checking...';
    }

    emailCheckTimer = setTimeout(async () => {
      try {
        const res = await api.checkEmail(trimmed);
        if (res.available) {
          if (statusEl) statusEl.textContent = '';
          inputEl.classList.remove('border-rose-500');
          inputEl.classList.add('border-emerald-500');
          feedbackEl.innerHTML = `<p class="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">${icon('CheckCircle', 'w-3.5 h-3.5')}<span>Email format is valid and available.</span></p>`;
        } else {
          if (statusEl) statusEl.textContent = '';
          inputEl.classList.remove('border-emerald-500');
          inputEl.classList.add('border-rose-500');
          feedbackEl.innerHTML = `<p class="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">${icon('AlertCircle', 'w-3.5 h-3.5')}<span>${res.error || 'This email address is already registered with ARX IT Club.'}</span></p>`;
        }
      } catch (err) {
        if (statusEl) statusEl.textContent = '';
        feedbackEl.innerHTML = `<p class="text-xs text-rose-600 dark:text-rose-400">${err.message || 'Error checking email.'}</p>`;
      }
    }, 400);
  }

  inputsToSync.forEach(([id, prop]) => {
    const el = document.getElementById(id);
    if (el) {
      const handler = () => {
        formState[prop] = el.value;
        if (id === 'reg-motivation') {
          updateEssayCounterUI();
        } else if (id === 'reg-telegram') {
          handleTelegramLiveValidation(el.value);
        } else if (id === 'reg-email') {
          handleEmailLiveValidation(el.value);
        }
      };
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    }
  });

  // 4. In-place live course checkbox interactivity without re-rendering the DOM!
  // This completely solves the bug where name and grade fields disappeared.
  document.querySelectorAll('.reg-course-checkbox').forEach(cb => {
    cb.onchange = () => {
      const allCbs = Array.from(document.querySelectorAll('.reg-course-checkbox'));
      const checkedCbs = allCbs.filter(c => c.checked);

      // If user tries to check more than 2, cancel the new check
      if (checkedCbs.length > 2) {
        cb.checked = false;
        return;
      }

      formState.courseIds = allCbs.filter(c => c.checked).map(c => c.value);
      const isMaxReached = formState.courseIds.length >= 2;

      // Update styles and disabled states in-place
      allCbs.forEach(c => {
        const isChecked = c.checked;
        const isDisabled = !isChecked && isMaxReached;
        c.disabled = isDisabled;

        const card = c.closest('[data-course-card]');
        if (card) {
          if (isChecked) {
            card.className = 'flex items-start gap-3 p-3.5 rounded-xl border transition-all border-[#FC6454] dark:border-[#2F8068] bg-[#FC6454]/5 dark:bg-[#2F8068]/10 shadow-xs ring-1 ring-[#FC6454]/20 dark:ring-[#2F8068]/30 cursor-pointer';
          } else if (isDisabled) {
            card.className = 'flex items-start gap-3 p-3.5 rounded-xl border transition-all border-[#282828]/10 dark:border-[#25473C] opacity-45 cursor-not-allowed bg-[#282828]/5 dark:bg-[#0C241C]/30';
          } else {
            card.className = 'flex items-start gap-3 p-3.5 rounded-xl border transition-all border-[#282828]/15 dark:border-[#25473C] hover:border-[#FC6454]/50 dark:hover:border-[#2F8068]/50 hover:bg-[#FC6454]/[0.02] dark:hover:bg-[#2F8068]/[0.05] cursor-pointer';
          }
        }
      });

      // Update counter in-place
      const counter = document.getElementById('reg-courses-counter');
      if (counter) {
        if (formState.courseIds.length === 2) {
          counter.className = 'text-xs sm:text-sm font-bold text-emerald-600 dark:text-[#58B889] mt-2 flex items-center gap-1';
          counter.innerHTML = '✓ 2/2 course tracks selected';
        } else {
          counter.className = 'text-xs sm:text-sm font-semibold text-[#FC6454] dark:text-[#6BB89E] mt-2';
          counter.textContent = `${formState.courseIds.length}/2 selected (Choose exactly 2)`;
        }
      }

      // Clear courses validation error if satisfied
      const errBox = document.getElementById('reg-form-error-box');
      if (errBox && formState.courseIds.length === 2 && errorMessage?.includes('2 course')) {
        errorMessage = null;
        errBox.remove();
      }
    };
  });

  // 5. Dropzone file upload handling
  const dropzone = document.getElementById('reg-award-dropzone');
  const fileInput = document.getElementById('reg-award-files');

  if (dropzone && fileInput) {
    dropzone.onclick = (e) => {
      if (e.target !== fileInput) {
        fileInput.click();
      }
    };

    dropzone.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    };

    dropzone.ondragover = (e) => {
      e.preventDefault();
      dropzone.classList.add('border-[#FC6454]', 'dark:border-[#6BB89E]', 'bg-[#FC6454]/10');
    };

    dropzone.ondragleave = (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-[#FC6454]', 'dark:border-[#6BB89E]', 'bg-[#FC6454]/10');
    };

    dropzone.ondrop = async (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-[#FC6454]', 'dark:border-[#6BB89E]', 'bg-[#FC6454]/10');
      awardFileUploadError = null;
      syncDOMToFormState();
      const files = Array.from(e.dataTransfer?.files || []);
      for (const f of files) {
        try {
          const item = await compressAndProcessFile(f);
          if (item) awardFilesList.push(item);
        } catch (err) {
          awardFileUploadError = err.message;
        }
      }
      renderRegisterPageDOM();
    };

    fileInput.onchange = async (e) => {
      awardFileUploadError = null;
      syncDOMToFormState();
      const files = Array.from(e.target.files || []);
      for (const f of files) {
        try {
          const item = await compressAndProcessFile(f);
          if (item) awardFilesList.push(item);
        } catch (err) {
          awardFileUploadError = err.message;
        }
      }
      renderRegisterPageDOM();
    };
  }

  // 6. Remove award file handler
  document.querySelectorAll('[data-remove-award-file]').forEach(btn => {
    btn.onclick = () => {
      syncDOMToFormState();
      const idx = parseInt(btn.getAttribute('data-remove-award-file'), 10);
      awardFilesList.splice(idx, 1);
      renderRegisterPageDOM();
    };
  });

  // 7. Form submission handler
  const form = document.getElementById('main-register-form');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      syncDOMToFormState();

      if (formState.courseIds.length !== 2) {
        errorMessage = 'Please select exactly 2 course tracks before continuing.';
        renderRegisterPageDOM();
        const cnt = document.getElementById('reg-courses-counter');
        if (cnt) cnt.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (formState.password !== formState.confirmPassword) {
        errorMessage = 'Passwords do not match. Please verify both password fields.';
        renderRegisterPageDOM();
        return;
      }

      if (formState.password.length < 8) {
        errorMessage = 'Password must be at least 8 characters long.';
        renderRegisterPageDOM();
        return;
      }

      const essayWords = countWords(formState.motivationEssay);
      if (!formState.motivationEssay || essayWords < 100) {
        const remaining = Math.max(0, 100 - essayWords);
        errorMessage = `Motivation essay must contain at least 100 words. Current count: ${essayWords} / 100 words (${remaining > 0 ? `${remaining} more words required` : ''}). Please explain why you want to join ARX IT Club.`;
        renderRegisterPageDOM();
        return;
      }

      loading = true;
      errorMessage = null;
      renderRegisterPageDOM();

      const fullName = [formState.firstName, formState.secondName, formState.lastName].filter(Boolean).join(' ');

      try {
        const res = await authState.register({
          firstName: formState.firstName,
          secondName: formState.secondName || undefined,
          lastName: formState.lastName,
          studentName: fullName,
          class: formState.class,
          courseIds: formState.courseIds,
          courseId: formState.courseIds[0],
          password: formState.password,
          confirmPassword: formState.confirmPassword,
          phoneNumber: formState.phoneNumber,
          email: formState.email || undefined,
          telegramUsername: formState.telegramUsername,
          award: formState.award || undefined,
          motivationEssay: formState.motivationEssay || undefined,
          awardFiles: awardFilesList.length > 0 ? awardFilesList.map(f => ({
            dataUrl: f.dataUrl,
            filename: f.filename,
            mimeType: f.mimeType
          })) : undefined
        });

        if (res?.memberId) {
          registrationResult = {
            memberId: res.memberId,
            studentName: fullName,
            email: formState.email,
            enrolledCourse: res.course,
            telegramChannelUrl: res.telegramChannelUrl || 'https://t.me/arxitclub',
            telegramBotUrl: res.telegramBotUrl || 'https://t.me/ARXITCLUB_bot'
          };
          if (typeof window.confetti === 'function') {
            window.confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          }
        }
      } catch (err) {
        errorMessage = err.message || 'Registration failed. Please try again.';
      } finally {
        loading = false;
        renderRegisterPageDOM();
      }
    };
  }
}

function renderRegisterPageDOM() {
  const root = document.getElementById('register-page-root');
  if (!root) return;
  root.innerHTML = getRegisterPageHTML();
  attachRegisterPageEvents();
}

export function renderRegisterPage() {
  // Kick off background refresh of courses and settings without blocking initial paint
  loadInitData();
  // Return the full form immediately for 0ms initial render
  return `<div id="register-page-root">${getRegisterPageHTML()}</div>`;
}

export function initRegisterPageEvents() {
  attachRegisterPageEvents();
}
