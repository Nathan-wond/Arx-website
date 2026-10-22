import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.js';
import Icon from '../../components/Icon.tsx';

export const MyProfilePage: React.FC = () => {
  const { member, updateMemberState } = useAuth();

  const [form, setForm] = useState({
    studentName: member?.studentName || '',
    class: member?.class || '',
    phoneNumber: member?.phoneNumber || '',
    telegramUsername: member?.telegramUsername || '',
    award: member?.award || ''
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await api.updateProfile(form);
      if (res?.member) {
        updateMemberState(res.member);
      }
      setFeedback({ type: 'success', message: 'Profile details saved successfully.' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
        <span className="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider">
          ACCOUNT SETTINGS
        </span>
        <h1 className="text-2xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">
          My Profile
        </h1>
        <p className="text-xs text-[#282828]/60 dark:text-white">
          Manage your personal club information and contact preferences.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-[#58B889] border border-emerald-200 dark:border-[#25473C]'
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
      <div className="p-6 sm:p-8 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#282828]/10 dark:border-[#25473C]">
          <div className="w-14 h-14 rounded-full bg-[#FC6454]/15 dark:bg-[#2F8068]/30 border border-[#FC6454]/30 dark:border-[#2F8068] text-[#FC6454] dark:text-[#6BB89E] flex items-center justify-center font-bold text-xl font-mono">
            {member?.studentName ? member.studentName.charAt(0).toUpperCase() : 'M'}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#282828] dark:text-white">
              {member?.studentName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs text-[#FC6454] dark:text-[#6BB89E] font-semibold">
                {member?.memberId}
              </span>
              <span className="text-xs text-[#282828]/60 dark:text-white">
                • Class {member?.class || '—'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
              Student Full Name
            </label>
            <input
              type="text"
              required
              value={form.studentName}
              onChange={(e) => setForm({ ...form, studentName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
                Grade / Section
              </label>
              <input
                type="text"
                value={form.class}
                onChange={(e) => setForm({ ...form, class: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
              Telegram Username
            </label>
            <input
              type="text"
              placeholder="@username"
              value={form.telegramUsername}
              onChange={(e) => setForm({ ...form, telegramUsername: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#282828]/80 dark:text-white mb-1">
              Awards / Distinctions Note
            </label>
            <textarea
              rows={2}
              value={form.award}
              onChange={(e) => setForm({ ...form, award: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] disabled:opacity-50 transition-all cursor-pointer border-0 shadow-xs active:scale-95 flex items-center gap-2"
          >
            <Icon name="Check" className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving Changes...' : 'Save Profile Details'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default MyProfilePage;
