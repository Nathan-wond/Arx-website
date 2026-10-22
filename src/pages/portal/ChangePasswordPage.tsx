import React, { useState } from 'react';
import { api } from '../../services/api.js';
import Icon from '../../components/Icon.tsx';

export const ChangePasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      setFeedback({ type: 'success', message: res?.message || 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to change password. Please check your current password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      {/* Header */}
      <div className="border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
        <span className="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider font-semibold">
          SECURITY &amp; ACCESS
        </span>
        <h1 className="text-2xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">
          Change Password
        </h1>
        <p className="text-xs text-[#282828]/60 dark:text-white">
          Ensure your account stays secure with an updated personal passphrase.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-[#15362B] text-emerald-800 dark:text-[#58B889] border border-emerald-200 dark:border-[#25473C]'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
          }`}
        >
          <Icon
            name={feedback.type === 'success' ? 'CheckCircle' : 'AlertCircle'}
            className="w-4 h-4 shrink-0"
          />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="p-6 sm:p-8 border border-[#282828]/10 dark:border-[#25473C] rounded-xl bg-white dark:bg-[#102B22] shadow-xs space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#294B40] text-xs focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30 bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
              New Password (min 6 characters)
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#294B40] text-xs focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30 bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#282828]/20 dark:border-[#294B40] text-xs focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30 bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] disabled:opacity-50 transition-all cursor-pointer border-0 shadow-xs active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            <Icon name="KeyRound" className="w-3.5 h-3.5" />
            <span>{loading ? 'Updating Password...' : 'Update Password'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
