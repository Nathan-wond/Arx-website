import { api } from '../../services/api.js';
import { icon } from '../icons.js';
import { modalState } from '../state.js';

let certIdInput = '';
let loading = false;
let searched = false;
let verifiedCert = null;
let errorMessage = null;

async function handleVerify(idToVerify) {
  const targetId = (idToVerify || certIdInput).trim();
  if (!targetId) return;

  loading = true;
  searched = true;
  errorMessage = null;
  verifiedCert = null;
  renderResult();

  try {
    const res = await api.verifyCertificate(targetId);
    if (res?.verified && res?.certificate) {
      verifiedCert = res.certificate;
    } else {
      errorMessage = 'Certificate not found. Please verify the ID.';
    }
  } catch (err) {
    errorMessage = err.message || 'Certificate not found. The ID entered does not match our verified registry.';
  } finally {
    loading = false;
    renderResult();
  }
}

function renderResult() {
  const container = document.getElementById('cert-verify-result');
  if (!container) return;

  if (loading) {
    container.innerHTML = `
      <div class="py-12 text-center text-[#282828]/60 dark:text-white space-y-2">
        <div class="w-6 h-6 border-2 border-[#FC6454] dark:border-[#6BB89E] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="text-xs font-mono">Querying credential registry...</p>
      </div>
    `;
    return;
  }

  if (verifiedCert) {
    container.innerHTML = `
      <div class="p-6 sm:p-8 border border-emerald-200 dark:border-[#25473C] bg-white dark:bg-[#102B22] rounded-xl space-y-6 shadow-xs animate-in fade-in transition-colors">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#282828]/10 dark:border-[#25473C] gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-[#15362B] text-emerald-600 dark:text-[#58B889] border border-emerald-200 dark:border-[#25473C] flex items-center justify-center">
              ${icon('CheckCircle', 'w-5 h-5')}
            </div>
            <div>
              <span class="text-[11px] font-mono uppercase text-emerald-700 dark:text-[#58B889] font-medium">
                REGISTRY VERIFICATION
              </span>
              <h3 class="text-xl font-bold text-[#282828] dark:text-white font-sans">
                Authentic Credential Verified
              </h3>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <a
              href="/api/certificates/${encodeURIComponent(verifiedCert.certificateId)}/download?format=pdf"
              target="_blank"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
              ${icon('Download', 'w-3.5 h-3.5')} PDF
            </a>
            <a
              href="/api/certificates/${encodeURIComponent(verifiedCert.certificateId)}/download?format=png"
              target="_blank"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-700 transition-colors">
              ${icon('Download', 'w-3.5 h-3.5')} Image
            </a>
            <button
              id="cert-view-modal-btn"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer">
              ${icon('Award', 'w-4 h-4')} View
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div class="space-y-1">
            <span class="text-xs text-[#282828]/60 dark:text-white flex items-center gap-1.5">
              ${icon('User', 'w-3.5 h-3.5 text-[#282828]/40 dark:text-white')} Student Name
            </span>
            <p class="text-base font-semibold text-[#282828] dark:text-white">${verifiedCert.studentName || ''}</p>
          </div>

          <div class="space-y-1">
            <span class="text-xs text-[#282828]/60 dark:text-white flex items-center gap-1.5">
              ${icon('BookOpen', 'w-3.5 h-3.5 text-[#282828]/40 dark:text-white')} Course Track
            </span>
            <p class="text-base font-semibold text-[#282828] dark:text-white">${verifiedCert.courseName || ''}</p>
          </div>

          <div class="space-y-1">
            <span class="text-xs text-[#282828]/60 dark:text-white flex items-center gap-1.5">
              ${icon('Calendar', 'w-3.5 h-3.5 text-[#282828]/40 dark:text-white')} Completion Date
            </span>
            <p class="text-sm font-medium text-[#282828] dark:text-white">${verifiedCert.issueDate || ''}</p>
          </div>

          <div class="space-y-1">
            <span class="text-xs text-[#282828]/60 dark:text-white">Certificate Identifier</span>
            <p class="text-sm font-mono font-bold text-[#FC6454] dark:text-[#6BB89E]">
              ${verifiedCert.certificateId || ''}
            </p>
          </div>
        </div>

        <div class="p-3.5 rounded-lg bg-[#FAF4EE] dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] text-xs text-[#282828]/70 dark:text-white flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Authorized By: <strong class="text-[#282828] dark:text-white">IT Club Academic Council</strong>
          </span>
          <span class="text-emerald-700 dark:text-[#58B889] font-mono text-[11px]">
            SHA-256 Ledger Verified &middot; 2026
          </span>
        </div>
      </div>
    `;

    const viewBtn = document.getElementById('cert-view-modal-btn');
    if (viewBtn) {
      viewBtn.onclick = () => {
        modalState.openCertificateModal(verifiedCert.certificateId);
      };
    }
    return;
  }

  if (searched && errorMessage) {
    container.innerHTML = `
      <div class="p-8 border border-red-200 dark:border-rose-900/60 bg-red-50/50 dark:bg-rose-950/20 text-center space-y-3 rounded-xl">
        <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-rose-900/40 text-red-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          ${icon('XCircle', 'w-5 h-5')}
        </div>
        <div>
          <h3 class="text-base font-semibold text-red-900 dark:text-rose-200">Certificate Not Found</h3>
          <p class="text-xs text-red-700 dark:text-rose-300 mt-1 max-w-md mx-auto">
            We could not locate any certificate matching ID "${certIdInput}". Please verify the characters and try again.
          </p>
        </div>
        <p class="text-xs text-[#282828]/60 dark:text-white pt-2">
          For credential lookup assistance, contact club leadership via the Contact page.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
}

export function renderCertificatesVerifyPage(initialId = '') {
  certIdInput = initialId;
  if (initialId) {
    setTimeout(() => handleVerify(initialId), 50);
  }

  return `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <!-- Header -->
      <div class="text-left space-y-2 border-b border-[#282828]/10 dark:border-[#25473C] pb-6">
        <span class="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider font-semibold">
          CREDENTIAL VERIFICATION
        </span>
        <h1 class="text-3xl sm:text-4xl font-bold text-[#282828] dark:text-white tracking-tight font-sans">
          Public Certificate Registry
        </h1>
        <p class="text-sm text-[#282828]/70 dark:text-white max-w-2xl leading-relaxed">
          Instantly verify certificates and credentials issued by ARX IT CLUB. Each certificate
          carries a tamper-proof SHA-256 validation identifier.
        </p>
      </div>

      <!-- Search Box Form -->
      <div class="p-6 sm:p-8 border border-[#282828]/10 dark:border-[#25473C] rounded-xl bg-white dark:bg-[#102B22] shadow-xs transition-colors">
        <form id="cert-verify-form" class="space-y-4">
          <label class="block text-xs font-medium text-[#282828]/80 dark:text-white">
            Enter Certificate ID
          </label>
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#282828]/40 dark:text-white">
                ${icon('Search', 'w-4 h-4')}
              </span>
              <input
                id="cert-verify-input"
                type="text"
                placeholder="e.g. ITC-PY-2026-00421"
                value="${certIdInput}"
                class="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#282828]/20 dark:border-[#294B40] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30 bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white"
                required />
            </div>
            <button
              type="submit"
              class="sm:w-36 px-4 py-2.5 text-xs font-semibold rounded-md bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer shadow-xs border-0">
              Verify ID
            </button>
          </div>
          <p class="text-xs text-[#282828]/60 dark:text-white">
            Enter the unique ID printed at the bottom of the issued certificate or scanned via QR code.
          </p>
        </form>
      </div>

      <!-- Result Container -->
      <div id="cert-verify-result"></div>
    </div>
  `;
}

export function initCertificatesVerifyPageEvents() {
  const form = document.getElementById('cert-verify-form');
  const input = document.getElementById('cert-verify-input');
  if (input) {
    input.oninput = (e) => {
      certIdInput = e.target.value;
    };
  }
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      handleVerify(certIdInput);
    };
  }
}
