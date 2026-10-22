import React, { useEffect, useState } from 'react';
import { useRouter } from '../../context/RouterContext.tsx';
import { api } from '../../services/api.js';
import Icon from '../../components/Icon.tsx';

export const MyCoursesPage: React.FC = () => {
  const { navigate } = useRouter();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'In Progress' | 'Completed'>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getMyEnrollments()
      .then((res: any) => {
        if (!mounted) return;
        if (res?.enrollments) setEnrollments(res.enrollments);
      })
      .catch((err: any) => {
        console.error('Failed to load enrollments', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = enrollments.filter((e) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'In Progress') return (e.progress || 0) < 100 && e.status !== 'Completed';
    if (activeTab === 'Completed') return (e.progress || 0) === 100 || e.status === 'Completed';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
        <div>
          <span className="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider">
            STUDENT ENROLLMENTS
          </span>
          <h1 className="text-2xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">
            My Courses
          </h1>
          <p className="text-xs text-[#282828]/60 dark:text-white">
            Track your ongoing curriculum, learning progress, and milestone credentials.
          </p>
        </div>
        <button
          onClick={() => navigate('/courses')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer border-0 shadow-xs"
        >
          <Icon name="BookOpen" className="w-3.5 h-3.5" />
          <span>Explore Catalog</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#EFE6DE]/60 dark:bg-[#0A211A] rounded-lg border border-[#282828]/10 dark:border-[#25473C] w-fit">
        {(['All', 'In Progress', 'Completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border-0 ${
              activeTab === tab
                ? 'bg-white dark:bg-[#15362B] text-[#282828] dark:text-white shadow-xs font-semibold'
                : 'text-[#282828]/70 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] bg-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-xs font-mono text-[#282828]/50 dark:text-white">
          Loading your courses...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-[#FAF4EE] dark:bg-[#102B22] rounded-lg border border-[#282828]/10 dark:border-[#25473C] p-8 space-y-4">
          <Icon name="BookOpen" className="w-10 h-10 text-[#282828]/40 dark:text-white mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[#282828] dark:text-white">
              No courses found in this view
            </h3>
            <p className="text-xs text-[#282828]/60 dark:text-white max-w-sm mx-auto">
              Explore our curriculum tracks and enroll to begin your journey.
            </p>
          </div>
          <button
            onClick={() => navigate('/courses')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer border-0 shadow-xs"
          >
            Browse Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((enr) => {
            const course = enr.course || enr;
            const progress = enr.progress || 0;
            return (
              <div
                key={enr.id || enr.courseId}
                className="p-6 border border-[#282828]/10 dark:border-[#25473C] rounded-xl bg-white dark:bg-[#102B22] shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[#FC6454] dark:text-[#6BB89E] font-semibold">
                      {course.category || 'Engineering'}
                    </span>
                    <span className="font-mono text-[11px] text-emerald-600 dark:text-[#58B889] font-medium">
                      {progress === 100 ? 'Completed' : `${progress}% Complete`}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#282828] dark:text-white">
                    {course.title || 'Curriculum Track'}
                  </h3>

                  <p className="text-xs text-[#282828]/70 dark:text-white line-clamp-2 leading-relaxed">
                    {course.description || ''}
                  </p>

                  {/* Progress bar */}
                  <div className="w-full bg-[#EFE6DE] dark:bg-[#071A14] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#FC6454] dark:bg-[#58B889] h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between text-xs">
                  <span className="text-[#282828]/60 dark:text-white">
                    Lead: {course.instructor || 'Lead Instructor'}
                  </span>
                  <button
                    onClick={() => navigate(`/courses/${course.id || enr.courseId}`)}
                    className="text-[#FC6454] dark:text-[#6BB89E] font-medium hover:underline flex items-center gap-1 cursor-pointer border-0 bg-transparent p-0"
                  >
                    <span>View Track</span>
                    <Icon name="ArrowRight" className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCoursesPage;
