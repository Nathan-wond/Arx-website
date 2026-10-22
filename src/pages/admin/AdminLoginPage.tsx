import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import Icon from '../../components/Icon.tsx';
import { ADMIN_DASHBOARD_PATH, PRESIDENT_DASHBOARD_PATH } from '../../config/adminRoute.js';

export const AdminLoginPage: React.FC = () => {
  const { navigate } = useRouter();
  const { adminLogin } = useAuth();

  const [selectedRoleTab, setSelectedRoleTab] = useState<'president' | 'officer'>('president');
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPresident = selectedRoleTab === 'president';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = memberId.trim();
    if (!cleanId || !password) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await adminLogin(cleanId, password);
      if (res?.success) {
        if (res.member?.role === 'president') {
          navigate(PRESIDENT_DASHBOARD_PATH);
        } else {
          navigate(ADMIN_DASHBOARD_PATH);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify administrative credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (presetId: string, presetPass: string) => {
    setMemberId(presetId);
    setPassword(presetPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center max-w-lg mx-auto px-4 py-8 sm:py-12 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs text-[#282828]/60 hover:text-[#282828] dark:text-white dark:hover:text-[#6BB89E] cursor-pointer transition-colors border-0 bg-transparent min-h-[44px] p-2"
        >
          <Icon name="ArrowLeft" className="w-4 h-4" />
          <span>Back to Public Site</span>
        </button>

        <span
          className={`inline-flex items-center gap-1 text-[11px] font-mono font-medium px-3 py-1 rounded-full ${
            isPresident
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
              : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30'
          }`}
        >
          {isPresident ? 'EXECUTIVE CLEARANCE' : 'STAFF DESK'}
        </span>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div
          className={`w-14 h-14 rounded-2xl ${
            isPresident
              ? 'bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent border border-amber-500/30 text-amber-600 dark:text-amber-400'
              : 'bg-gradient-to-br from-[#FC6454]/20 via-[#2F8068]/10 to-transparent border border-[#282828]/15 dark:border-[#25473C] text-[#FC6454] dark:text-[#6BB89E]'
          } shadow-sm flex items-center justify-center mx-auto p-2 transition-all duration-300`}
        >
          <Icon name={isPresident ? 'Crown' : 'ShieldCheck'} className="w-7 h-7" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#282828] dark:text-white tracking-tight font-sans">
          {isPresident ? 'Presidential Executive Suite' : 'Club Operations Desk'}
        </h1>
        <p className="text-xs text-[#282828]/70 dark:text-white max-w-sm mx-auto leading-relaxed">
          {isPresident
            ? 'Master console with absolute control over club members, staff roles, system databases, and governance.'
            : 'Administrative desk for club officers, attendance tracking, student applications, and assignment evaluations.'}
        </p>
      </div>

      {/* Role Selector Tabs */}
      <div className="grid grid-cols-2 p-1.5 rounded-xl bg-[#282828]/5 dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] text-xs font-semibold gap-1.5">
        <button
          type="button"
          onClick={() => {
            setSelectedRoleTab('president');
            setMemberId('adminp');
            setPassword('');
            setErrorMessage(null);
          }}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg transition-all cursor-pointer border-0 min-h-[44px] ${
            isPresident
              ? 'bg-white dark:bg-[#15362B] text-amber-700 dark:text-amber-300 shadow-sm border border-amber-500/20 font-bold'
              : 'text-[#282828]/60 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] bg-transparent'
          }`}
        >
          <Icon name="Crown" className="w-4 h-4 text-amber-500" />
          <span>Presidential (adminp)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedRoleTab('officer');
            setMemberId('admino');
            setPassword('');
            setErrorMessage(null);
          }}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg transition-all cursor-pointer border-0 min-h-[44px] ${
            !isPresident
              ? 'bg-white dark:bg-[#15362B] text-[#FC6454] dark:text-[#6BB89E] shadow-sm border border-[#FC6454]/20 dark:border-[#2F8068] font-bold'
              : 'text-[#282828]/60 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] bg-transparent'
          }`}
        >
          <Icon name="Shield" className="w-4 h-4 text-blue-500" />
          <span>Officer Desk (admino)</span>
        </button>
      </div>

      {/* Form Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-[#282828]/15 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-sm space-y-4">
        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <Icon name="AlertCircle" className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#282828]/80 dark:text-white">
                Admin / Executive ID
              </label>
              <button
                type="button"
                onClick={() => { setMemberId(isPresident ? 'adminp' : 'admino'); setPassword(''); }}
                className="text-[10px] font-mono font-medium text-amber-600 dark:text-amber-400 hover:underline cursor-pointer border-0 bg-transparent p-0"
              >
                Use {isPresident ? 'adminp' : 'admino'} ID
              </button>
            </div>
            <input
              type="text"
              required
              placeholder={isPresident ? 'e.g. adminp' : 'e.g. admino'}
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] text-sm font-mono rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:focus:ring-amber-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#282828]/80 dark:text-white mb-1.5">
              Clearance Passphrase
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3.5 pr-11 py-2.5 min-h-[44px] text-sm rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:focus:ring-amber-500/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-[#282828]/40 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] cursor-pointer border-0 bg-transparent"
                aria-label="Toggle password visibility"
              >
                <Icon name={showPassword ? 'EyeOff' : 'Eye'} className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 min-h-[44px] rounded-lg text-xs font-semibold text-white transition-all cursor-pointer border-0 shadow-sm active:scale-95 flex items-center justify-center gap-2 mt-2 ${
              isPresident
                ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600'
                : 'bg-[#FC6454] hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277]'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying Clearance...</span>
              </>
            ) : (
              <>
                <Icon name="Key" className="w-4 h-4" />
                <span>{isPresident ? 'Authenticate Presidential Suite' : 'Enter Admin Operations'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
