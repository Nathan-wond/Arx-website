import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import Icon from '../components/Icon.tsx';

export const LoginPage: React.FC = () => {
  const { navigate } = useRouter();
  const { login } = useAuth();

  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId.trim() || !password) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await login(memberId.trim().toUpperCase(), password);
      if (res?.success) {
        navigate('/portal/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid Member ID or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const isUnderReview = errorMessage && errorMessage.toLowerCase().includes('under review');

  return (
    <div className="min-h-[80vh] flex flex-col justify-center max-w-md mx-auto px-4 py-12 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-[#FC6454]/10 dark:bg-[#2F8068]/20 border border-[#FC6454]/20 dark:border-[#2F8068]/40 text-[#FC6454] dark:text-[#6BB89E] flex items-center justify-center mx-auto shadow-xs">
          <Icon name="Lock" className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#282828] dark:text-white tracking-tight font-sans">
          Member Workspace Login
        </h1>
        <p className="text-xs text-[#282828]/70 dark:text-white">
          Sign in to access your enrolled courses, certificates, assignments, and attendance logs.
        </p>
      </div>

      {/* Login Card */}
      <div className="p-6 sm:p-8 rounded-xl border border-[#282828]/15 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs">
        {errorMessage && (
          isUnderReview ? (
            <div className="mb-5 p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <Icon name="Clock" className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <strong className="block font-semibold">Application Under Review</strong>
                <span className="text-[11px] text-amber-800 dark:text-amber-300">
                  {errorMessage}
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-5 p-3 rounded-md bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900/60 text-red-800 dark:text-rose-300 text-xs flex items-start gap-2">
              <Icon name="AlertCircle" className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
              Member ID
            </label>
            <input
              type="text"
              required
              placeholder="e.g. TI000001"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[#282828]/80 dark:text-white">
                Password
              </label>
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-[11px] text-[#FC6454] dark:text-[#6BB89E] hover:underline cursor-pointer border-0 bg-transparent p-0"
              >
                Forgot passphrase?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3 pr-10 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#282828]/40 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] cursor-pointer border-0 bg-transparent p-0"
              >
                <Icon name={showPassword ? 'EyeOff' : 'Eye'} className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] disabled:opacity-50 transition-all cursor-pointer border-0 shadow-xs active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <Icon name="LogIn" className="w-3.5 h-3.5" />
                <span>Sign in to Workspace</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between text-xs text-[#282828]/70 dark:text-white">
          <span>Need an account?</span>
          <button
            onClick={() => navigate('/register')}
            className="text-[#FC6454] dark:text-[#6BB89E] font-semibold hover:underline cursor-pointer border-0 bg-transparent p-0"
          >
            Apply for Membership
          </button>
        </div>

        <div className="mt-2 text-center">
          <button
            onClick={() => navigate('/activate')}
            className="text-[11px] text-[#282828]/60 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] transition-colors cursor-pointer border-0 bg-transparent p-0"
          >
            Have an activation code? <span className="underline">Activate account</span>
          </button>
        </div>
      </div>

      {/* Forgot Passphrase Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#102B22] p-6 rounded-xl border border-[#282828]/15 dark:border-[#25473C] max-w-sm w-full space-y-4 shadow-xl">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-[#15362B] text-amber-600 dark:text-[#D6A84F] flex items-center justify-center">
              <Icon name="Key" className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#282828] dark:text-white">
              Password Reset Assistance
            </h3>
            <p className="text-xs text-[#282828]/70 dark:text-white leading-relaxed">
              To protect school member records, passwords can be reset via the official automated Telegram bot <strong>@ARXITCLUB_bot</strong> or by visiting Computer Lab 3 during club hours.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2">
              <a
                href="https://t.me/ARXITCLUB_bot"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
              >
                Open Bot
              </a>
              <button
                onClick={() => setForgotModalOpen(false)}
                className="px-3 py-1.5 rounded-md text-xs font-medium border border-[#282828]/20 dark:border-[#25473C] text-[#282828] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
