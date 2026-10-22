import React, { useEffect, useState } from 'react';
import { useRouter } from '../context/RouterContext.tsx';
import { useModal } from '../context/ModalContext.tsx';
import { api } from '../services/api.js';
import Icon from '../components/Icon.tsx';

interface CertificatesVerifyPageProps {
  initialId?: string;
}

export const CertificatesVerifyPage: React.FC<CertificatesVerifyPageProps> = ({ initialId = '' }) => {
  const { searchParams } = useRouter();
  const { openCertificateModal } = useModal();

  const queryId = searchParams.get('id') || initialId;
  const [certInput, setCertInput] = useState(queryId);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [verifiedCert, setVerifiedCert] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = async (idToVerify: string) => {
    const targetId = idToVerify.trim();
    if (!targetId) return;

    setLoading(true);
    setSearched(true);
    setErrorMessage(null);
    setVerifiedCert(null);

    try {
      const res = await api.verifyCertificate(targetId);
      if (res?.verified && res?.certificate) {
        setVerifiedCert(res.certificate);
      } else {
        setErrorMessage('Certificate not found. Please verify the credential ID.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Certificate not found. The ID entered does not match our verified registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryId) {
      setCertInput(queryId);
      handleVerify(queryId);
    }
  }, [queryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(certInput);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-[#15362B] text-emerald-600 dark:text-[#58B889] border border-emerald-200 dark:border-[#25473C] flex items-center justify-center mx-auto shadow-xs">
          <Icon name="ShieldCheck" className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#282828] dark:text-white tracking-tight font-sans">
          Public Credential Verification
        </h1>
        <p className="text-xs sm:text-sm text-[#282828]/70 dark:text-white">
          Verify authentic certificates and technical completion credentials issued by ARX IT CLUB.
        </p>
      </div>

      {/* Verification Input Box */}
      <div className="p-6 sm:p-8 rounded-xl border border-[#282828]/15 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs max-w-2xl mx-auto space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            placeholder="Enter Certificate ID (e.g. ARX-2026-WD-1082)"
            value={certInput}
            onChange={(e) => setCertInput(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg border border-[#282828]/20 dark:border-[#294B40] text-xs font-mono uppercase bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] disabled:opacity-50 transition-all cursor-pointer border-0 shadow-xs shrink-0"
          >
            {loading ? 'Verifying...' : 'Verify Credential'}
          </button>
        </form>

        <p className="text-[11px] text-[#282828]/50 dark:text-white text-center font-mono">
          Each ARX credential is cryptographically logged with a timestamp and unique registration hash.
        </p>
      </div>

      {/* Result Container */}
      <div id="cert-verify-result">
        {loading && (
          <div className="py-12 text-center text-[#282828]/60 dark:text-white space-y-2">
            <div className="w-6 h-6 border-2 border-[#FC6454] dark:border-[#6BB89E] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono">Querying credential registry...</p>
          </div>
        )}

        {!loading && errorMessage && (
          <div className="p-6 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-center space-y-2 max-w-xl mx-auto">
            <Icon name="AlertCircle" className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto" />
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">Verification Query Failed</h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
              {errorMessage}
            </p>
          </div>
        )}

        {!loading && verifiedCert && (
          <div className="p-6 sm:p-8 border border-emerald-200 dark:border-[#25473C] bg-white dark:bg-[#102B22] rounded-xl space-y-6 shadow-xs transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#282828]/10 dark:border-[#25473C] gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-[#15362B] text-emerald-600 dark:text-[#58B889] border border-emerald-200 dark:border-[#25473C] flex items-center justify-center">
                  <Icon name="CheckCircle" className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase text-emerald-700 dark:text-[#58B889] font-medium">
                    REGISTRY VERIFICATION
                  </span>
                  <h3 className="text-xl font-bold text-[#282828] dark:text-white font-sans">
                    Authentic Credential Verified
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`/api/certificates/${encodeURIComponent(verifiedCert.certificateId)}/download?format=pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  <Icon name="Download" className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
                <button
                  onClick={() => openCertificateModal(verifiedCert)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer border-0"
                >
                  <Icon name="Eye" className="w-3.5 h-3.5" />
                  <span>View Printable Seal</span>
                </button>
              </div>
            </div>

            {/* Cert Data Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
              <div className="space-y-1">
                <span className="text-[#282828]/60 dark:text-white font-mono text-[11px] uppercase">
                  Recipient Name
                </span>
                <p className="font-bold text-sm text-[#282828] dark:text-white">
                  {verifiedCert.studentName}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[#282828]/60 dark:text-white font-mono text-[11px] uppercase">
                  Curriculum Track
                </span>
                <p className="font-bold text-sm text-[#282828] dark:text-white">
                  {verifiedCert.courseName}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[#282828]/60 dark:text-white font-mono text-[11px] uppercase">
                  Issue Date
                </span>
                <p className="font-bold text-sm text-[#282828] dark:text-white">
                  {verifiedCert.issueDate}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[#282828]/60 dark:text-white font-mono text-[11px] uppercase">
                  Certificate ID
                </span>
                <p className="font-mono font-bold text-sm text-blue-600 dark:text-cyan-400">
                  {verifiedCert.certificateId}
                </p>
              </div>
            </div>

            {/* Verification Seal Badge */}
            <div className="p-4 rounded-lg bg-[#EFE6DE]/40 dark:bg-[#071A14]/50 border border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-[#58B889] font-medium font-mono">
                <Icon name="ShieldCheck" className="w-4 h-4" />
                <span>Authorized Signatory Signature Verified</span>
              </div>
              <span className="text-[11px] text-[#282828]/60 dark:text-white">
                Issued by ARX IT Club Board
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificatesVerifyPage;
