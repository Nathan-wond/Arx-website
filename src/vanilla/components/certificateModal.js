import { modalState, router } from '../state.js';
import { icon } from '../icons.js';

export function renderCertificateModal(cert) {
  if (!cert) return '';

  const verifyUrl = `${window.location.origin}/#certificates?id=${encodeURIComponent(cert.certificateId)}`;

  return `
    <div id="cert-modal-backdrop" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div id="cert-modal-overlay" class="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"></div>

        <div class="relative transform overflow-hidden rounded-xl bg-white dark:bg-[#102B22] text-left transition-all sm:my-8 w-full max-w-4xl border border-[#282828]/15 dark:border-[#25473C] shadow-xl max-h-[90vh] flex flex-col z-10">
          <div class="p-6 text-[#282828] dark:text-white overflow-y-auto flex-1">
            <div class="space-y-4">
              <!-- Printable Certificate Content -->
              <div class="overflow-x-auto pb-2">
                <div
                  id="printable-certificate"
                  class="w-full min-w-[700px] bg-white border-[10px] border-amber-600/30 p-6 sm:p-10 rounded-[2px] shadow-xl text-center select-none relative"
                  style="aspect-ratio: 1.414 / 1; background-image: radial-gradient(circle at 50% 50%, #ffffff 0%, #fcfbf7 100%);">
                  
                  <div class="border-2 border-slate-900 h-full p-6 sm:p-8 flex flex-col justify-between relative">
                    <!-- Gold Corner Accents -->
                    <div class="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-600"></div>
                    <div class="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-600"></div>
                    <div class="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-600"></div>
                    <div class="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-600"></div>

                    <!-- Header -->
                    <div>
                      <div class="flex items-center justify-center gap-2 mb-1">
                        <span class="font-mono text-cyan-600 font-extrabold text-2xl tracking-tighter">&lt; / &gt;</span>
                        <span class="text-2xl sm:text-3xl font-black text-slate-900 tracking-wider">IT CLUB</span>
                      </div>
                      <p class="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Learn. Build. Grow.</p>
                      <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 uppercase tracking-widest font-serif">
                        Certificate of Completion
                      </h2>
                      <div class="w-20 h-0.5 bg-amber-500 mx-auto my-2"></div>
                      <p class="text-xs sm:text-sm text-slate-500 italic mt-1">This certificate is proudly presented to</p>
                    </div>

                    <!-- Student Name -->
                    <div class="my-2">
                      <h3 class="text-3xl sm:text-4xl font-serif font-bold text-blue-950 border-b-2 border-slate-300 inline-block pb-1 px-8 min-w-[280px]">
                        ${cert.studentName || ''}
                      </h3>
                    </div>

                    <!-- Course Title -->
                    <div>
                      <p class="text-xs sm:text-sm text-slate-600 mb-1">For successfully completing</p>
                      <h4 class="text-xl sm:text-2xl font-bold text-slate-800">${cert.courseName || ''}</h4>
                    </div>

                    <!-- Footer Meta -->
                    <div class="grid grid-cols-3 gap-4 items-end pt-4 border-t border-slate-200 text-left">
                      <!-- Col 1 -->
                      <div class="text-[11px] text-slate-600 space-y-1">
                        <div><span class="font-semibold text-slate-700">Completion Date:</span> ${cert.issueDate || ''}</div>
                        <div>
                          <span class="font-semibold text-slate-700">Certificate ID:</span>
                          <span class="font-mono text-blue-700 font-bold">${cert.certificateId || ''}</span>
                        </div>
                        <div class="flex items-center gap-1.5 pt-1 text-emerald-700 font-semibold">
                          ${icon('CheckCircle', 'w-3.5 h-3.5')}
                          <span>Status: VERIFIED</span>
                        </div>
                      </div>

                      <!-- Col 2: Stamp & QR -->
                      <div class="flex flex-col items-center justify-center">
                        <div class="flex items-center gap-3">
                          ${cert.certificateStampUrl ? `
                            <div class="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center drop-shadow-sm">
                              <img src="${cert.certificateStampUrl}" alt="Official Seal" class="w-full h-full object-contain" />
                            </div>
                          ` : `
                            <div class="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 shadow-sm border border-yellow-200 text-slate-900">
                              ${icon('Award', 'w-7 h-7')}
                            </div>
                          `}
                          <div class="w-14 h-14 bg-white border border-slate-300 rounded p-1 flex flex-col items-center justify-center" title="Scan to verify online">
                            ${icon('QrCode', 'w-11 h-11 text-slate-900')}
                          </div>
                        </div>
                        <span class="text-[9px] font-bold text-amber-900 uppercase mt-1 tracking-wider">
                          Official Academic Seal &bull; Scan to Verify
                        </span>
                      </div>

                      <!-- Col 3: Signature -->
                      <div class="text-right space-y-0.5">
                        <div class="font-serif italic text-base text-slate-800 border-b border-slate-400 pb-0.5 inline-block min-w-[140px] text-center">
                          ${cert.authorizedSignatures?.[0]?.name || 'IT Club Leadership'}
                        </div>
                        <p class="text-[11px] text-slate-600 font-medium">
                          ${cert.authorizedSignatures?.[0]?.title || 'Club President'}
                        </p>
                        <p class="text-[9px] text-slate-400">Authorized IT Club Signatory</p>
                      </div>
                    </div>

                    <!-- Bottom Bar -->
                    <div class="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100">
                      <span class="font-mono">Verification: ${verifyUrl}</span>
                      <span>Academic Year &bull; School IT Club Organization</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Controls -->
              <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div class="text-xs text-[#282828]/60 dark:text-white">
                  Certificate ID:
                  <code class="bg-[#FAF4EE] dark:bg-[#15362B] border border-[#282828]/10 dark:border-[#25473C] px-2 py-0.5 rounded font-mono text-[#282828] dark:text-white font-semibold">
                    ${cert.certificateId}
                  </code>
                  <span class="text-emerald-600 dark:text-[#58B889] font-bold ml-1.5">(Landscape Format)</span>
                </div>
                <div class="flex items-center gap-2">
                  <a
                    href="/api/certificates/${encodeURIComponent(cert.certificateId || cert.id)}/download?format=pdf"
                    target="_blank"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer">
                    ${icon('Download', 'w-4 h-4')}
                    Download PDF
                  </a>
                  <a
                    href="/api/certificates/${encodeURIComponent(cert.certificateId || cert.id)}/download?format=png"
                    target="_blank"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-700 transition-all cursor-pointer">
                    ${icon('Download', 'w-4 h-4')}
                    Download Image (PNG)
                  </a>
                  <button
                    id="cert-modal-verify-btn"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border border-[#282828]/20 dark:border-[#25473C] text-[#282828] dark:text-white hover:bg-[#282828]/5 dark:hover:bg-[#102B22] transition-colors cursor-pointer">
                    ${icon('ExternalLink', 'w-4 h-4')}
                    Verify Online
                  </button>
                  <button
                    id="cert-modal-print-btn"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer border-0">
                    ${icon('Printer', 'w-4 h-4')}
                    Print
                  </button>
                  <button
                    id="cert-modal-close-btn"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-[#282828]/70 dark:text-white hover:bg-[#282828]/5 dark:hover:bg-[#102B22] transition-colors cursor-pointer border-0 bg-transparent">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initCertificateModalEvents(cert) {
  if (!cert) return;

  const close = () => modalState.closeCertificateModal();

  const overlay = document.getElementById('cert-modal-overlay');
  if (overlay) overlay.onclick = close;

  const closeBtn = document.getElementById('cert-modal-close-btn');
  if (closeBtn) closeBtn.onclick = close;

  const printBtn = document.getElementById('cert-modal-print-btn');
  if (printBtn) printBtn.onclick = () => window.print();

  const verifyBtn = document.getElementById('cert-modal-verify-btn');
  if (verifyBtn) {
    verifyBtn.onclick = () => {
      close();
      router.navigate(`/certificates?id=${encodeURIComponent(cert.certificateId)}`);
    };
  }

  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      window.removeEventListener('keydown', handleEsc);
      close();
    }
  };
  window.addEventListener('keydown', handleEsc);
}
