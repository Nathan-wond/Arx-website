import React, { useEffect, useState } from 'react';
import { useRouter } from '../context/RouterContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.js';
import Icon from '../components/Icon.tsx';
import CourseVisual from '../components/CourseVisual.tsx';

interface CourseDetailPageProps {
  courseId: string;
}

export const CourseDetailPage: React.FC<CourseDetailPageProps> = ({ courseId }) => {
  const { navigate } = useRouter();
  const { isAuthenticated, member } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setFeedback(null);
    setErrorMessage(null);
    api.getCourseById(courseId)
      .then((res: any) => {
        if (!mounted) return;
        if (res?.course) setCourse(res.course);
      })
      .catch((err: any) => {
        console.error('Failed to load course details', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [courseId]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!course) return;

    setEnrolling(true);
    setErrorMessage(null);
    setFeedback(null);

    try {
      const res = await api.enrollCourse(course.id);
      setFeedback(res.message || 'You have successfully enrolled in this course track!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-[#FC6454] dark:border-[#6BB89E] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono text-[#282828]/50 dark:text-white">Loading course curriculum...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <Icon name="AlertCircle" className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-[#282828] dark:text-white">Course track not found</h2>
        <p className="text-xs text-[#282828]/60 dark:text-white">The requested course syllabus does not exist or has been archived.</p>
        <button
          onClick={() => navigate('/courses')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer border-0"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const isEnrolled = member?.enrolledCourses?.includes(course.id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back link */}
      <button
        onClick={() => navigate('/courses')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#282828]/60 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] transition-colors cursor-pointer border-0 bg-transparent p-0"
      >
        <Icon name="ArrowLeft" className="w-3.5 h-3.5" />
        <span>Back to All Courses</span>
      </button>

      {/* Course Banner */}
      <div className="rounded-xl overflow-hidden border border-[#282828]/10 dark:border-[#25473C] shadow-sm">
        <CourseVisual course={course} variant="banner" />
        <div className="p-6 sm:p-8 bg-white dark:bg-[#102B22] space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="px-2.5 py-0.5 rounded-full bg-[#FC6454]/10 dark:bg-[#2F8068]/20 text-[#FC6454] dark:text-[#6BB89E] border border-[#FC6454]/20 dark:border-[#2F8068]/40">
              {course.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EFE6DE]/60 dark:bg-[#15362B] text-[#282828]/70 dark:text-white">
              {course.duration}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EFE6DE]/60 dark:bg-[#15362B] text-[#282828]/70 dark:text-white">
              {course.level || 'All Skill Levels'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#282828] dark:text-white tracking-tight font-sans">
            {course.title}
          </h1>

          <p className="text-sm text-[#282828]/80 dark:text-white leading-relaxed max-w-3xl">
            {course.description}
          </p>

          {/* Feedback */}
          {feedback && (
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-[#58B889] border border-emerald-200 dark:border-[#25473C] text-xs flex items-center gap-2">
              <Icon name="CheckCircle" className="w-4 h-4 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}
          {errorMessage && (
            <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-[#25473C] text-xs flex items-center gap-2">
              <Icon name="AlertCircle" className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            {isEnrolled ? (
              <button
                onClick={() => navigate('/portal/courses')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer border-0 shadow-xs"
              >
                <Icon name="Check" className="w-4 h-4" />
                <span>You Are Enrolled • Go to My Courses</span>
              </button>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] disabled:opacity-50 transition-all cursor-pointer border-0 shadow-xs active:scale-95"
              >
                {enrolling ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Enrollment...</span>
                  </>
                ) : (
                  <>
                    <Icon name="UserPlus" className="w-4 h-4" />
                    <span>Enroll in this Track</span>
                  </>
                )}
              </button>
            )}

            <div className="text-xs text-[#282828]/60 dark:text-white/70 font-mono">
              Lead Instructor: <strong className="text-[#282828] dark:text-white font-medium">{course.instructor}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Syllabus Modules & Meta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-[#282828] dark:text-white font-sans">
            Curriculum & Syllabus Modules
          </h3>

          {course.modules && course.modules.length > 0 ? (
            <div className="space-y-3">
              {course.modules.map((mod: any, idx: number) => (
                <div
                  key={idx}
                  className="p-5 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[#FC6454] dark:text-[#6BB89E] font-semibold">
                      Module {idx + 1}
                    </span>
                    {mod.duration && (
                      <span className="text-[#282828]/50 dark:text-white/60 font-mono text-[11px]">
                        {mod.duration}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-[#282828] dark:text-white">
                    {mod.title}
                  </h4>
                  {mod.description && (
                    <p className="text-xs text-[#282828]/70 dark:text-white leading-relaxed">
                      {mod.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] text-xs text-[#282828]/60 dark:text-white">
              Syllabus modules and session breakdowns will be posted prior to the next scheduled workshop.
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#282828] dark:text-white font-mono">
              Track Requirements
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-medium text-[#282828] dark:text-white block">Prerequisites</span>
                <span className="text-[#282828]/70 dark:text-white mt-0.5 block">
                  {course.prerequisites || 'Basic computer literacy and curiosity to build software.'}
                </span>
              </div>
              <div>
                <span className="font-medium text-[#282828] dark:text-white block">Lab Schedule</span>
                <span className="text-[#282828]/70 dark:text-white mt-0.5 block">
                  {course.schedule || 'After-school sessions in Computer Lab 3.'}
                </span>
              </div>
              <div>
                <span className="font-medium text-[#282828] dark:text-white block">Credential Awarded</span>
                <span className="text-emerald-700 dark:text-[#58B889] font-medium mt-0.5 block">
                  Verified Certificate of Completion with Cryptographic ID
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
