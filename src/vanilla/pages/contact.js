import { icon } from '../icons.js';

let submitted = false;
let formState = {
  name: '',
  contactInfo: '',
  subject: 'General Inquiry',
  message: ''
};

function renderFormSection() {
  const container = document.getElementById('contact-form-container');
  if (!container) return;

  if (submitted) {
    container.innerHTML = `
      <div class="py-12 text-center space-y-3">
        ${icon('CheckCircle', 'w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto')}
        <h3 class="text-base font-semibold text-[#282828] dark:text-white">Message Dispatched</h3>
        <p class="text-xs text-[#282828]/70 dark:text-white max-w-sm mx-auto">
          Thank you for contacting ARX IT CLUB. An officer or instructor will review your note
          at the next lab session.
        </p>
        <div class="pt-2">
          <button
            id="contact-send-another-btn"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer">
            Send Another Note
          </button>
        </div>
      </div>
    `;

    const anotherBtn = document.getElementById('contact-send-another-btn');
    if (anotherBtn) {
      anotherBtn.onclick = () => {
        submitted = false;
        formState = { name: '', contactInfo: '', subject: 'General Inquiry', message: '' };
        renderFormSection();
      };
    }
    return;
  }

  container.innerHTML = `
    <form id="contact-direct-form" class="space-y-4">
      <h3 class="text-sm font-semibold text-[#282828] dark:text-white uppercase tracking-wider font-mono">
        Send a Direct Message
      </h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
            Your Full Name
          </label>
          <input
            id="contact-name"
            type="text"
            required
            placeholder="e.g. Alex Morgan"
            value="${formState.name}"
            class="w-full px-3 py-2 text-xs rounded-md border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30" />
        </div>

        <div>
          <label class="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
            Contact Email or Telegram
          </label>
          <input
            id="contact-info"
            type="text"
            required
            placeholder="e.g. alex@school.edu or @alex"
            value="${formState.contactInfo}"
            class="w-full px-3 py-2 text-xs rounded-md border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30" />
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
          Inquiry Subject
        </label>
        <select
          id="contact-subject"
          class="w-full px-3 py-2 text-xs rounded-md border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30">
          <option value="General Inquiry" ${formState.subject === 'General Inquiry' ? 'selected' : ''}>General Inquiry</option>
          <option value="Membership & Registration" ${formState.subject === 'Membership & Registration' ? 'selected' : ''}>Membership &amp; Registration</option>
          <option value="Curriculum & Workshop" ${formState.subject === 'Curriculum & Workshop' ? 'selected' : ''}>Curriculum &amp; Workshop Tracks</option>
          <option value="Project Collaboration" ${formState.subject === 'Project Collaboration' ? 'selected' : ''}>Project Collaboration</option>
          <option value="Certificate Verification Assistance" ${formState.subject === 'Certificate Verification Assistance' ? 'selected' : ''}>Certificate Verification Assistance</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows="5"
          placeholder="Type your message here..."
          class="w-full px-3 py-2 text-xs rounded-md border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30 resize-none">${formState.message}</textarea>
      </div>

      <div class="pt-2">
        <button
          type="submit"
          class="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-md bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer shadow-xs border-0">
          Transmit Message
        </button>
      </div>
    </form>
  `;

  const form = document.getElementById('contact-direct-form');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      submitted = true;
      renderFormSection();
    };
  }
}

export function renderContactPage() {
  return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <!-- Header -->
      <div class="text-left space-y-2 border-b border-[#282828]/10 dark:border-[#25473C] pb-6">
        <span class="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider font-semibold">
          COMMUNICATIONS
        </span>
        <h1 class="text-3xl sm:text-4xl font-bold text-[#282828] dark:text-white tracking-tight font-sans">
          Contact ARX IT CLUB
        </h1>
        <p class="text-sm text-[#282828]/70 dark:text-white max-w-2xl leading-relaxed">
          Questions about membership enrollment, curriculum modules, project collaborations,
          or lab schedules? Send us a message or visit Computer Lab 3.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Sidebar Info -->
        <div class="lg:col-span-5 space-y-6">
          <div class="p-6 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-4 shadow-xs">
            <h3 class="text-sm font-semibold text-[#282828] dark:text-white uppercase tracking-wider font-mono">
              Club Office &amp; Lab
            </h3>
            <div class="space-y-4 text-xs">
              <div class="flex items-start gap-3">
                ${icon('MapPin', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E] shrink-0 mt-0.5')}
                <div>
                  <p class="font-semibold text-[#282828] dark:text-white">Physical Location</p>
                  <p class="text-[#282828]/70 dark:text-white">Computer Lab 3, Highschool (Second Floor)</p>
                  <p class="text-[11px] text-[#282828]/50 dark:text-white mt-0.5">School Campus</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                ${icon('Clock', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E] shrink-0 mt-0.5')}
                <div>
                  <p class="font-semibold text-[#282828] dark:text-white">Regular Lab Sessions</p>
                  <p class="text-[#282828]/70 dark:text-white">Monday to Tuesday: 3:30 PM &ndash; 5:30 PM</p>
                  <p class="text-[#282828]/70 dark:text-white">Saturday Hack Lab: 10:00 AM &ndash; 1:00 PM</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                ${icon('Mail', 'w-4 h-4 text-[#FC6454] dark:text-[#6BB89E] shrink-0 mt-0.5')}
                <div>
                  <p class="font-semibold text-[#282828] dark:text-white">Official Correspondence</p>
                  <p class="text-[#282828]/70 dark:text-white font-mono">contact@arx-website-sjs.vercel.app</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Telegram Links -->
          <div class="p-6 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-[#FAF4EE]/80 dark:bg-[#102B22] space-y-3 shadow-xs">
            <div class="flex items-center gap-2 text-[#FC6454] dark:text-[#6BB89E] font-medium text-xs font-mono uppercase tracking-wider">
              ${icon('Send', 'w-3.5 h-3.5')}
              <span>Official Telegram Links</span>
            </div>
            <p class="text-xs text-[#282828]/70 dark:text-white leading-relaxed">
              Connect directly with our student assistant bot or follow daily broadcast announcements.
            </p>
            <div class="flex flex-wrap gap-2 pt-1">
              <a
                href="https://t.me/arxitclub"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white hover:text-[#FC6454] dark:hover:text-[#6BB89E] transition-colors">
                <span>Channel: @arxitclub</span>
                ${icon('Send', 'w-3 h-3 text-[#FC6454] dark:text-[#6BB89E]')}
              </a>
              <a
                href="https://t.me/ARXITCLUB_bot"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white hover:text-[#FC6454] dark:hover:text-[#6BB89E] transition-colors">
                <span>Bot: @ARXITCLUB_bot</span>
                ${icon('Send', 'w-3 h-3 text-[#FC6454] dark:text-[#6BB89E]')}
              </a>
            </div>
          </div>
        </div>

        <!-- Form Box -->
        <div class="lg:col-span-7">
          <div id="contact-form-container" class="p-6 sm:p-8 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs"></div>
        </div>
      </div>
    </div>
  `;
}

export function initContactPageEvents() {
  renderFormSection();
}
