import React, { useEffect, useState } from 'react';
import { useRouter } from '../context/RouterContext.tsx';
import { api } from '../services/api.js';
import Icon from '../components/Icon.tsx';

interface ActivatePageProps {
  initialCode?: string;
}

export const ActivatePage: React.FC<ActivatePageProps> = ({ initialCode = '' }) => {
  const { searchParams, navigate } = useRouter();
  const queryCode = searchParams.get('code') || searchParams.get('token') || initialCode;

  const [code, setCode] = useState(queryCode);
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alreadyActiveInfo, setAlreadyActiveInfo] = useState<any>(null);
  const [activationResult, setActivationResult] = useState<any>(null);

  const handleActivate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      setErrorMessage('Please enter your activation code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setAlreadyActiveInfo(null);

    try {
      const res = await api.activateAccount(code.trim(), memberId.trim() || undefined);
      if (res?.alreadyActive) {
        setAlreadyActiveInfo({
          memberId: res.member?.memberId,
          studentName: res.member?.studentName
        });
        return;
      }

      if (res?.success && res?.member) {
        setActivationResult({
          memberId: res.member.memberId,
          studentName: res.member.studentName,
          class: res.member.class,
          telegramBotUrl: res.telegramBotUrl || 'https://t.me/ARXITCLUB_bot',
          telegramChannelUrl: res.telegramChannelUrl || 'https://t.me/arxitclub'
        });
        if (typeof (window as any).confetti === 'function') {
          (window as any).confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        }
      } else {
        setErrorMessage(res?.message || 'Activation failed. Please check the code and try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong while activating your account. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryCode) {
      setCode(queryCode);
      // Auto-trigger if code provided in url
      handleActivate();
    }
  }, [queryCode]);

  return (
    <div className="min-h-[80vh] flex flex-col justify-center max-w-md mx-auto px-4 py-12 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-[#15362B] text-amber-600 dark:text-[#D6A84F] border border-amber-200 dark:border-[#25473C] flex items-center justify-center mx-auto shadow-xs">
          <Icon name="Key" className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#282828] dark:text-white tracking-tight font-sans">
          Account Activation
        </h1>
        <p className="text-xs text-[#282828]/70 dark:text-white">
          Enter your single-use code to verify and activate your student account.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-xl border border-[#282828]/15 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <Icon name="AlertCircle" className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {alreadyActiveInfo && (
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 space-y-2 text-center">
            <Icon name="CheckCircle" className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto" />
            <h3 className="font-bold text-sm">Account is Already Active</h3>
            <p>Member ID: <strong>{alreadyActiveInfo.memberId}</strong> ({alreadyActiveInfo.studentName})</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 px-4 py-2 rounded-md text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
            >
              Sign In to Portal
            </button>
          </div>
        )}

        {activationResult ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-[#25473C] text-xs text-emerald-900 dark:text-[#58B889] space-y-3 text-center">
            <Icon name="CheckCircle" className="w-8 h-8 text-emerald-600 dark:text-[#58B889] mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-base">Account Successfully Activated!</h3>
              <p>Welcome, <strong>{activationResult.studentName}</strong> (Class {activationResult.class}).</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white/80 dark:bg-[#071A14] font-mono font-bold text-xs">
              ID: {activationResult.memberId}
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
              >
                Log In to Student Workspace
              </button>
            </div>
          </div>
        ) : (
          !alreadyActiveInfo && (
            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
                  Activation Code / Token *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ARX-ACT-9821"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
                  Member ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TI000001"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] disabled:opacity-50 transition-all cursor-pointer border-0 shadow-xs"
              >
                {loading ? 'Activating Account...' : 'Activate Account'}
              </button>
            </form>
          )
        )}

        <div className="pt-4 border-t border-[#282828]/10 dark:border-[#25473C] text-center text-xs">
          <button
            onClick={() => navigate('/login')}
            className="text-[#FC6454] dark:text-[#6BB89E] font-medium hover:underline cursor-pointer border-0 bg-transparent p-0"
          >
            Already activated? Return to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivatePage;
