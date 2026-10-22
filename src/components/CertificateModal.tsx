import React, { useEffect } from 'react';
import { useModal } from '../context/ModalContext.tsx';
import { useRouter } from '../context/RouterContext.tsx';
import Icon from './Icon.tsx';

export const CertificateModal: React.FC = () => {
  const { activeCertificate: cert, closeCertificateModal } = useModal();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!cert) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCertificateModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cert, closeCertificateModal]);

  if (!cert) return null;

  const verifyUrl = `${window.location.origin}/#certificates?id=${encodeURIComponent(cert.certificateId || '')}`;

  return (
    <div id="cert-modal-backdrop" className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          id="cert-modal-overlay"
          onClick={closeCertificateModal}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        />

        <div className="relative transform overflow-hidden rounded-xl bg-white dark:bg-[#102B22] text-left transition-all sm:my-8 w-full max-w-4xl border border-[#282828]/15 dark:border-[#25473C] shadow-xl max-h-[90vh] flex flex-col z-10">
          <div className="p-6 text-[#282828] dark:text-white overflow-y-auto flex-1">
            <div className="space-y-4">
              {/* Printable Certificate Content */}
              <div className="overflow-x-auto pb-2">
                <div
                  id="printable-certificate"
                  className="w-full min-w-[700px] bg-white border-[10px] border-amber-600/30 p-6 sm:p-10 rounded-[2px] shadow-xl text-center select-none relative"
                  style={{
                    aspectRatio: '1.414 / 1',
                    backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #fcfbf7 100%)'
                  }}
                >
                  <div className="border-2 border-slate-900 h-full p-6 sm:p-8 flex flex-col justify-between relative">
                    {/* Gold Corner Accents */}
                    <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-amber-600" />
                    <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-amber-600" />
                    <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-amber-600" />
                    <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-amber-600" />

                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="font-mono text-cyan-600 font-extrabold text-2xl tracking-tighter">&lt; / &gt;</span>
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-wider">IT CLUB</span>
                      </div>
                      <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Learn. Build. Grow.</p>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 uppercase tracking-widest font-serif">
                        Certificate of Completion
                      </h2>
                      <div className="w-20 h-0.5 bg-amber-500 mx-auto my-2" />
                      <p className="text-xs sm:text-sm text-slate-500 italic mt-1">This certificate is proudly presented to</p>
                    </div>

                    {/* Student Name */}
                    <div className="my-2">
                      <h3 className="text-3xl sm:text-4xl font-serif font-bold text-blue-950 border-b-2 border-slate-300 inline-block pb-1 px-8 min-w-[280px]">
                        {cert.studentName || ''}
                      </h3>
                    </div>

                    {/* Course Title */}
                    <div>
                      <p className="text-xs sm:text-sm text-slate-600 mb-1">For successfully completing</p>
                      <h4 className="text-xl sm:text-2xl font-bold text-slate-800">{cert.courseName || ''}</h4>
                    </div>

                    {/* Footer Meta */}
                    <div className="grid grid-cols-3 gap-4 items-end pt-4 border-t border-slate-200 text-left">
                      {/* Col 1 */}
                      <div className="text-[11px] text-slate-600 space-y-1">
                        <div>
                          <span className="font-semibold text-slate-700">Completion Date:</span> {cert.issueDate || ''}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">Certificate ID:</span>{' '}
                          <span className="font-mono text-blue-700 font-bold">{cert.certificateId || ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 text-emerald-700 font-semibold">
                          <Icon name="CheckCircle" className="w-3.5 h-3.5" />
                          <span>Status: VERIFIED</span>
                        </div>
                      </div>

                      {/* Col 2: Stamp & QR */}
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-3">
                          {cert.certificateStampUrl ? (
                            <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center drop-shadow-sm">
                              <img src={cert.certificateStampUrl} alt="Official Seal" className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 shadow-sm border border-yellow-200 text-slate-900">
                              <Icon name="Award" className="w-7 h-7" />
                            </div>
                          )}
                          <div className="w-14 h-14 bg-white border border-slate-300 rounded p-1 flex flex-col items-center justify-center" title="Scan to verify online">
                            <Icon name="QrCode" className="w-11 h-11 text-slate-900" />
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-amber-900 uppercase mt-1 tracking-wider">
                          Official Academic Seal • Scan to Verify
                        </span>
                      </div>

                      {/* Col 3: Signature */}
                      <div className="text-right space-y-0.5">
                        <div className="font-serif italic text-base text-slate-800 border-b border-slate-400 pb-0.5 inline-block min-w-[140px] text-center">
                          {cert.authorizedSignatures?.[0]?.name || 'IT Club Leadership'}
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">
                          {cert.authorizedSignatures?.[0]?.title || 'Club President'}
                        </p>
                        <p className="text-[9px] text-slate-400">Authorized IT Club Signatory</p>
                      </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100">
                      <span className="font-mono">Verification: {verifyUrl}</span>
                      <span>Academic Year • School IT Club Organization</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-[#282828]/60 dark:text-white">
                  Certificate ID:{' '}
                  <code className="bg-[#FAF4EE] dark:bg-[#15362B] border border-[#282828]/10 dark:border-[#25473C] px-2 py-0.5 rounded font-mono text-[#282828] dark:text-white font-semibold">
                    {cert.certificateId}
                  </code>
                  <span className="text-emerald-600 dark:text-[#58B889] font-bold ml-1.5">(Landscape Format)</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`/api/certificates/${encodeURIComponent(cert.certificateId || cert.id)}/download?format=pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer"
                  >
                    <Icon name="Download" className="w-4 h-4" />
                    Download PDF
                  </a>
                  <a
                    href={`/api/certificates/${encodeURIComponent(cert.certificateId || cert.id)}/download?format=png`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-700 transition-all cursor-pointer"
                  >
                    <Icon name="Download" className="w-4 h-4" />
                    Download Image (PNG)
                  </a>
                  <button
                    onClick={() => {
                      closeCertificateModal();
                      navigate(`/certificates?id=${encodeURIComponent(cert.certificateId)}`);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border border-[#282828]/20 dark:border-[#25473C] text-[#282828] dark:text-white hover:bg-[#282828]/5 dark:hover:bg-[#102B22] transition-colors cursor-pointer"
                  >
                    <Icon name="ExternalLink" className="w-4 h-4" />
                    Verify Online
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer border-0"
                  >
                    <Icon name="Printer" className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={closeCertificateModal}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-[#282828]/70 dark:text-white hover:bg-[#282828]/5 dark:hover:bg-[#102B22] transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
