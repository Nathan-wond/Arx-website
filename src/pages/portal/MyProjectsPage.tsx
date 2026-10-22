import React, { useEffect, useState } from 'react';
import { useRouter } from '../../context/RouterContext.tsx';
import { api } from '../../services/api.js';
import Icon from '../../components/Icon.tsx';

export const MyProjectsPage: React.FC = () => {
  const { navigate } = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getMyProjects()
      .then((res: any) => {
        if (!mounted) return;
        if (res?.projects) setProjects(res.projects);
      })
      .catch((err: any) => {
        console.error('Failed to load student projects', err);
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
            PORTFOLIO &amp; REPOSITORIES
          </span>
          <h1 className="text-2xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">
            My Projects
          </h1>
          <p className="text-xs text-[#282828]/60 dark:text-white">
            Collaborative initiatives and software products you have built or are actively developing.
          </p>
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[#282828]/25 dark:border-[#25473C] hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer"
        >
          Browse All Club Projects
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-xs font-mono text-[#282828]/50 dark:text-white">
          Loading your projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center border border-[#282828]/10 dark:border-[#25473C] rounded-xl bg-white dark:bg-[#102B22] max-w-xl mx-auto space-y-4">
          <Icon name="FolderGit2" className="w-10 h-10 text-[#282828]/40 dark:text-white mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[#282828] dark:text-white">
              No projects linked to your account yet
            </h3>
            <p className="text-xs text-[#282828]/60 dark:text-white max-w-sm mx-auto leading-relaxed">
              Collaborate with club members in Computer Lab 3 or propose a new software initiative to get started.
            </p>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer border-0 shadow-xs"
          >
            Explore Projects
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="p-6 border border-[#282828]/10 dark:border-[#25473C] rounded-xl bg-white dark:bg-[#102B22] shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#FC6454] dark:text-[#6BB89E]">
                  {proj.category || 'Software'}
                </span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-[#58B889] font-medium">
                  {proj.status || 'Active'}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#282828] dark:text-white">
                {proj.title}
              </h3>
              <p className="text-xs text-[#282828]/70 dark:text-white leading-relaxed">
                {proj.description}
              </p>
              {proj.liveUrl && (
                <div className="pt-2 border-t border-[#282828]/10 dark:border-[#25473C]">
                  <a
                    href={proj.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#FC6454] dark:text-[#6BB89E] text-xs font-medium flex items-center gap-1 hover:underline"
                  >
                    <Icon name="ExternalLink" className="w-3.5 h-3.5" />
                    <span>View Live Build</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProjectsPage;
