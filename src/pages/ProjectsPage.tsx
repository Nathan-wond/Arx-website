import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import Icon from '../components/Icon.tsx';

const statusFilters = ['All', 'Completed', 'In Progress', 'Planned'];

export const ProjectsPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getProjects(selectedStatus)
      .then((res: any) => {
        if (!mounted) return;
        if (res?.projects) setProjects(res.projects);
      })
      .catch((err: any) => {
        console.error('Failed to load projects', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedStatus]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#FC6454] dark:text-[#6BB89E] font-medium">
            STUDENT PORTFOLIO
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#282828] dark:text-white tracking-tight font-sans mt-1">
            Projects & Software Repositories
          </h1>
          <p className="text-xs sm:text-sm text-[#282828]/70 dark:text-white mt-1">
            Explore collaborative open-source web apps, automation bots, and robotics software built by club members.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border-0 ${
                selectedStatus === status
                  ? 'bg-[#FC6454] text-white dark:bg-[#2F8068] dark:text-white font-semibold shadow-xs'
                  : 'bg-white dark:bg-[#102B22] text-[#282828]/70 dark:text-white border border-[#282828]/10 dark:border-[#25473C] hover:bg-[#EFE6DE] dark:hover:bg-[#15362B]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-[#282828]/50 dark:text-white space-y-2">
          <div className="w-6 h-6 border-2 border-[#FC6454] dark:border-[#6BB89E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono">Loading project repository...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center bg-[#FAF4EE] dark:bg-[#102B22] rounded-lg border border-[#282828]/10 dark:border-[#25473C] p-8 space-y-2">
          <Icon name="FolderGit2" className="w-8 h-8 text-[#282828]/40 dark:text-white mx-auto" />
          <h3 className="text-sm font-semibold text-[#282828] dark:text-white">No projects found</h3>
          <p className="text-xs text-[#282828]/60 dark:text-white">
            Student technology projects will appear here once published.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] flex flex-col justify-between overflow-hidden hover:border-[#FC6454]/40 dark:hover:border-[#366656] transition-colors shadow-xs"
            >
              <div>
                {project.imageUrl && (
                  <div className="w-full h-44 bg-[#FAF4EE] dark:bg-[#071A14] border-b border-[#282828]/10 dark:border-[#25473C] overflow-hidden">
                    <img src={project.imageUrl} alt={project.title || ''} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-[#282828]/60 dark:text-white">
                    <span className="font-medium text-[#FC6454] dark:text-[#6BB89E]">{project.category || 'Engineering'}</span>
                    <span aria-hidden="true">•</span>
                    <span className="font-mono">{project.date || '2026'}</span>
                    <span aria-hidden="true">•</span>
                    <span className="text-emerald-600 dark:text-[#58B889] font-medium">{project.status || 'Active'}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#282828] dark:text-white">
                    {project.title}
                  </h3>
                  <p className="text-xs text-[#282828]/70 dark:text-white/70 line-clamp-3 leading-relaxed">
                    {project.description}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 space-y-4">
                {project.techStack && project.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.map((tech: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#EFE6DE]/60 dark:bg-[#15362B] text-[#282828]/80 dark:text-white border border-[#282828]/10 dark:border-[#25473C]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                {(project.liveUrl || project.githubUrl) && (
                  <div className="pt-2 border-t border-[#282828]/10 dark:border-[#25473C] flex items-center gap-3 text-xs">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#FC6454] dark:text-[#6BB89E] font-medium flex items-center gap-1 hover:underline"
                      >
                        <Icon name="ExternalLink" className="w-3.5 h-3.5" />
                        <span>Live Demo</span>
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#282828]/70 dark:text-white font-medium flex items-center gap-1 hover:underline"
                      >
                        <Icon name="Code" className="w-3.5 h-3.5" />
                        <span>Repository</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
