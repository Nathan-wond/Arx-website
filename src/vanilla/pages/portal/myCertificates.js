import { api } from '../../../services/api.js';
import { modalState } from '../../state.js';
import { icon } from '../../icons.js';

let certificates = [];
let loading = true;

export function renderMyCertificatesPage() {
  return `
    <div id="portal-my-certificates-root" class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
        <div>
          <span class="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider">
            CREDENTIAL REGISTRY
          </span>
          <h1 class="text-2xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">
            My Certificates
          </h1>
          <p class="text-xs text-[#282828]/60 dark:text-white">
            Verified credentials earned through completed IT Club courses and assessments.
          </p>
        </div>
        <button
          data-nav="/certificates"
          class="inline-flex items-center justify-center font-sans tracking-tight select-none rounded-md text-xs px-2.5 py-1.5 font-medium bg-transparent text-[#282828] hover:bg-[#FC6454]/10 border border-[#282828]/25 dark:text-white dark:hover:bg-[#2F8068]/20 dark:border-[#25473C] cursor-pointer">
          ${icon('ShieldCheck', 'w-3.5 h-3.5 mr-1.5 text-[#FC6454] dark:text-[#6BB89E]')}
          Verify Credentials Publicly
        </button>
      </div>

      <!-- Content -->
      ${loading ? `
        <div class="py-16 text-center text-xs font-mono text-[#282828]/50 dark:text-white">Loading certificates...</div>
      ` : certificates.length === 0 ? `
        <div class="py-16 text-center bg-[#FAF4EE] dark:bg-[#102B22] rounded-lg border border-[#282828]/10 dark:border-[#25473C] p-8 space-y-4">
          ${icon('Award', 'w-10 h-10 text-[#282828]/40 dark:text-white mx-auto')}
          <div class="space-y-1">
            <h3 class="text-sm font-semibold text-[#282828] dark:text-white">
              No certificates issued yet
            </h3>
            <p class="text-xs text-[#282828]/60 dark:text-white max-w-sm mx-auto">
              Complete your first course track to unlock an official verified IT Club certificate.
            </p>
          </div>
          <button
            data-nav="/portal/courses"
            class="inline-flex items-center justify-center font-sans tracking-tight select-none transition-colors duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#6BB89E]/40 cursor-pointer whitespace-nowrap shrink-0 text-xs px-2.5 py-1.5 font-medium bg-[#FC6454] text-white hover:bg-[#E04D3E] border border-[#FC6454] dark:bg-[#2F8068] dark:text-white dark:hover:bg-[#3A9277] dark:border-[#2F8068] shadow-xs">
            Explore Courses
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${certificates.map((cert) => `
            <div
              class="p-6 border border-[#282828]/10 dark:border-[#25473C] flex flex-col justify-between space-y-4 rounded-lg bg-white dark:bg-[#102B22] shadow-xs hover:border-[#FC6454]/40 dark:hover:border-[#366656] transition-colors">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="w-8 h-8 rounded-md bg-[#EFE6DE]/60 dark:bg-[#15362B] text-[#FC6454] dark:text-[#6BB89E] border border-[#282828]/10 dark:border-[#25473C] flex items-center justify-center font-bold">
                    ${icon('Award', 'w-4 h-4')}
                  </div>
                  <span class="inline-flex items-center rounded-sm text-[11px] px-1.5 py-0.5 tracking-tight font-medium bg-emerald-50 dark:bg-[#102B22] text-emerald-700 dark:text-[#58B889] border border-emerald-200 dark:border-[#25473C]">
                    ${cert.status || 'Active'}
                  </span>
                </div>

                <div>
                  <h3 class="text-base font-bold text-[#282828] dark:text-white">${cert.courseName}</h3>
                  <p class="text-xs font-mono text-[#282828]/50 dark:text-white mt-1">
                    Completed: <span class="text-[#282828] dark:text-white font-semibold">${cert.issueDate}</span>
                  </p>
                </div>

                <div class="p-2.5 rounded-md bg-[#FAF4EE] dark:bg-[#0C241C] border border-[#282828]/10 dark:border-[#294B40] font-mono text-xs flex items-center justify-between">
                  <span class="text-[#282828]/50 dark:text-white">ID:</span>
                  <span class="font-bold text-[#FC6454] dark:text-[#6BB89E]">${cert.certificateId}</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="pt-4 border-t border-[#282828]/10 dark:border-[#25473C] flex items-center justify-end gap-2">
                <button
                  data-cert-id="${cert.certificateId}"
                  class="my-cert-view-btn inline-flex items-center justify-center font-sans tracking-tight select-none rounded-md text-xs px-2.5 py-1.5 font-medium bg-transparent text-[#282828] hover:bg-[#FC6454]/10 border border-[#282828]/25 dark:text-white dark:hover:bg-[#2F8068]/20 dark:border-[#25473C] cursor-pointer">
                  ${icon('Eye', 'w-3.5 h-3.5 mr-1')}
                  View
                </button>
                <button
                  data-cert-id="${cert.certificateId}"
                  class="my-cert-download-btn inline-flex items-center justify-center font-sans tracking-tight select-none transition-colors duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC6454]/40 dark:focus:ring-[#6BB89E]/40 cursor-pointer whitespace-nowrap shrink-0 text-xs px-2.5 py-1.5 font-medium bg-[#FC6454] text-white hover:bg-[#E04D3E] border border-[#FC6454] dark:bg-[#2F8068] dark:text-white dark:hover:bg-[#3A9277] dark:border-[#2F8068] shadow-xs">
                  ${icon('Download', 'w-3.5 h-3.5 mr-1')}
                  Download
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

function updateDOM() {
  const root = document.getElementById('portal-my-certificates-root');
  if (root) {
    const parent = root.parentElement;
    if (parent) {
      parent.innerHTML = renderMyCertificatesPage();
      attachListeners();
    }
  }
}

export async function initMyCertificatesPageEvents() {
  attachListeners();
  loading = true;

  try {
    const res = await api.getMemberCertificates();
    if (res.certificates) certificates = res.certificates;
  } catch (err) {
    console.error('Failed to load certificates', err);
  } finally {
    loading = false;
    updateDOM();
  }
}

function attachListeners() {
  document.querySelectorAll('.my-cert-view-btn, .my-cert-download-btn').forEach(btn => {
    btn.onclick = () => {
      const certId = btn.getAttribute('data-cert-id');
      if (certId) modalState.openCertificateModal(certId);
    };
  });
}
