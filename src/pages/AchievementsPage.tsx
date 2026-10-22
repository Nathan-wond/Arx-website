import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import Icon from '../components/Icon.tsx';

const tabs = [
  { id: 'all', label: 'All Honors' },
  { id: 'club', label: 'Club Milestones' },
  { id: 'member', label: 'Member Awards' },
  { id: 'competition', label: 'Competitions' },
  { id: 'award', label: 'Special Recognitions' }
];

export const AchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getAchievements()
      .then((res: any) => {
        if (!mounted) return;
        if (res?.achievements) setAchievements(res.achievements);
      })
      .catch((err: any) => {
        console.error('Failed to load achievements', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = achievements.filter(a => {
    if (activeTab === 'all') return true;
    return a.category === activeTab;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#FC6454] dark:text-[#6BB89E] font-medium">
            DISTINCTIONS & MEDALS
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#282828] dark:text-white tracking-tight font-sans mt-1">
            Honors & Achievements
          </h1>
          <p className="text-xs sm:text-sm text-[#282828]/70 dark:text-white mt-1">
            Official competition awards, olympiad medals, and student achievements earned by ARX IT CLUB OF SJS.
          </p>
        </div>

        {/* Tab pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border-0 ${
                activeTab === tab.id
                  ? 'bg-[#FC6454] text-white dark:bg-[#2F8068] dark:text-white font-semibold shadow-xs'
                  : 'bg-white dark:bg-[#102B22] text-[#282828]/70 dark:text-white border border-[#282828]/10 dark:border-[#25473C] hover:bg-[#EFE6DE] dark:hover:bg-[#15362B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-[#282828]/60 dark:text-white space-y-2">
          <div className="w-6 h-6 border-2 border-[#FC6454] dark:border-[#6BB89E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono">Loading honors archive...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-[#FAF4EE] dark:bg-[#102B22] rounded-lg border border-[#282828]/10 dark:border-[#25473C] p-8 space-y-2">
          <Icon name="Award" className="w-8 h-8 text-[#282828]/40 dark:text-white mx-auto" />
          <h3 className="text-sm font-semibold text-[#282828] dark:text-white">
            No achievements published in this category
          </h3>
          <p className="text-xs text-[#282828]/60 dark:text-white">
            Official club competition results and student recognitions will be posted here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-6 flex flex-col justify-between space-y-4 shadow-xs hover:border-[#FC6454]/40 dark:hover:border-[#366656] transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-[#15362B] text-amber-600 dark:text-[#D6A84F] border border-amber-200 dark:border-[#25473C] flex items-center justify-center font-bold">
                    <Icon name="Award" className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center rounded-sm text-[11px] px-2 py-0.5 tracking-tight font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-[#D6A84F] border border-amber-200 dark:border-amber-800/60 uppercase">
                    {item.category}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#282828] dark:text-white">
                  {item.title}
                </h3>

                <p className="text-xs text-[#282828]/70 dark:text-white leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between text-xs text-[#282828]/60 dark:text-white">
                <span className="font-mono text-[11px]">{item.date || '2026'}</span>
                {item.recipient && (
                  <span className="font-medium text-[#282828] dark:text-white">
                    {item.recipient}
                  </span>
                )}
                {item.fileUrl && (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#FC6454] dark:text-[#6BB89E] font-medium flex items-center gap-1 hover:underline"
                  >
                    <Icon name="Download" className="w-3.5 h-3.5" />
                    <span>View Proof</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AchievementsPage;
