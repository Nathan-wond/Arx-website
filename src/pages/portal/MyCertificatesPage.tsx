import React, { useEffect, useState } from 'react';
import { useRouter } from '../../context/RouterContext.tsx';
import { useModal } from '../../context/ModalContext.tsx';
import { api } from '../../services/api.js';
import Icon from '../../components/Icon.tsx';

export const MyCertificatesPage: React.FC = () => {
  const { navigate } = useRouter();
  const { openCertificateModal } = useModal();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getMyCertificates()
      .then((res: any) => {
        if (!mounted) return;
        if (res?.certificates) setCertificates(res.certificates);
      })
      .catch((err: any) => {
        console.error('Failed to load certificates', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
        <div>
          <span className="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider">
            CREDENTIAL REGISTRY
          </span>
          <h1 className="text-2xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">
            My Certificates
          </h1>
          <p className="text-xs text-[#282828]/60 dark:text-white">
            Verified credentials earned through completed IT Club tracks and capstone projects.
          </p>
        </div>
        <button
          onClick={() => navigate('/certificates')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[#282828]/25 dark:border-[#25473C] hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer"
        >
          <Icon name="ShieldCheck" className="w-3.5 h-3.5 text-emerald-600 dark:text-[#58B889]" />
          <span>Verify Credentials Publicly</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-xs font-mono text-[#282828]/50 dark:text-white">
          Loading certificates...
        </div>
      ) : certificates.length === 0 ? (
        <div className="py-16 text-center bg-[#FAF4EE] dark:bg-[#102B22] rounded-lg border border-[#282828]/10 dark:border-[#25473C] p-8 space-y-4">
          <Icon name="Award" className="w-10 h-10 text-[#282828]/40 dark:text-white mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[#282828] dark:text-white">
              No certificates issued yet
            </h3>
            <p className="text-xs text-[#282828]/60 dark:text-white max-w-sm mx-auto">
              Complete your first course track or hackathon challenge to unlock an official verified certificate.
            </p>
          </div>
          <button
            onClick={() => navigate('/portal/courses')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer border-0 shadow-xs"
          >
            Explore Courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="p-6 border border-[#282828]/10 dark:border-[#25473C] flex flex-col justify-between space-y-4 rounded-xl bg-white dark:bg-[#102B22] shadow-xs hover:border-[#FC6454]/40 dark:hover:border-[#366656] transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-[#15362B] text-amber-600 dark:text-[#D6A84F] border border-amber-200 dark:border-[#25473C] flex items-center justify-center font-bold">
                    <Icon name="Award" className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[11px] text-emerald-700 dark:text-[#58B889] bg-emerald-50 dark:bg-[#071A14] px-2 py-0.5 rounded border border-emerald-200 dark:border-[#25473C] font-semibold">
                    VERIFIED
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#282828] dark:text-white">
                    {cert.courseName}
                  </h3>
                  <p className="text-xs text-[#282828]/70 dark:text-white mt-1">
                    Issued to {cert.studentName} on {cert.issueDate}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#FAF4EE] dark:bg-[#071A14] border border-[#282828]/10 dark:border-[#25473C] font-mono text-[11px] text-blue-700 dark:text-cyan-400 font-bold">
                  ID: {cert.certificateId}
                </div>
              </div>

              <div className="pt-3 border-t border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between gap-2 flex-wrap">
                <button
                  onClick={() => openCertificateModal(cert)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer border-0"
                >
                  <Icon name="Eye" className="w-3.5 h-3.5" />
                  <span>Preview Seal</span>
                </button>

                <a
                  href={`/api/certificates/${encodeURIComponent(cert.certificateId || cert.id)}/download?format=pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  <Icon name="Download" className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCertificatesPage;
