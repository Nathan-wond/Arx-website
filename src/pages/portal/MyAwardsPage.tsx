import React, { useEffect, useState } from 'react';
import { useRouter } from '../../context/RouterContext.tsx';
import { api } from '../../services/api.js';
import Icon from '../../components/Icon.tsx';

export const MyAwardsPage: React.FC = () => {
  const { navigate } = useRouter();
  const [awards, setAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getMyAwards()
      .then((res: any) => {
        if (!mounted) return;
        if (res?.awards) setAwards(res.awards);
      })
      .catch((err: any) => {
        console.error('Failed to load awards', err);
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
      <div className="border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
        <span className="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider">
          MEMBER RECOGNITIONS
        </span>
        <h1 className="text-2xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">
          My Awards
        </h1>
        <p className="text-xs text-[#282828]/60 dark:text-white">
          Special recognitions, hackathon honors, and club distinctions recorded on your student profile.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-xs font-mono text-[#282828]/50 dark:text-white">
          Loading awards...
        </div>
      ) : awards.length === 0 ? (
        <div className="p-12 text-center border border-[#282828]/10 dark:border-[#25473C] rounded-xl bg-white dark:bg-[#102B22] max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-[#15362B] text-amber-600 dark:text-[#D6A84F] border border-amber-200 dark:border-[#25473C] flex items-center justify-center mx-auto">
            <Icon name="Trophy" className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#282828] dark:text-white">
              No awards recorded yet
            </h3>
            <p className="text-xs text-[#282828]/60 dark:text-white max-w-sm mx-auto leading-relaxed">
              Keep learning, building, and participating in hackathons and club events to earn official recognitions.
            </p>
          </div>
          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer border-0 shadow-xs"
          >
            Explore Events
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {awards.map((award) => (
            <div
              key={award.id}
              className="p-6 border border-[#282828]/10 dark:border-[#25473C] space-y-3 rounded-xl bg-white dark:bg-[#102B22] shadow-xs transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-md bg-amber-50 dark:bg-[#15362B] text-amber-600 dark:text-[#D6A84F] border border-amber-200 dark:border-[#25473C] flex items-center justify-center font-bold">
                  <Icon name="Trophy" className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center rounded-sm text-[11px] px-2 py-0.5 tracking-tight font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-[#D6A84F] border border-amber-200 dark:border-amber-800/60 uppercase">
                  {award.category}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#282828] dark:text-white">{award.title}</h3>
                <p className="text-xs text-[#282828]/70 dark:text-white mt-1 leading-relaxed">
                  {award.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between text-[11px] text-[#282828]/60 dark:text-white">
                <span className="font-mono">{award.date || '2026'}</span>
                {award.fileUrl && (
                  <a
                    href={award.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#FC6454] dark:text-[#6BB89E] font-medium flex items-center gap-1 hover:underline"
                  >
                    <Icon name="Download" className="w-3.5 h-3.5" />
                    <span>View Certificate</span>
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

export default MyAwardsPage;
