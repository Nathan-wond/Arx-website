import React, { useEffect, useState } from 'react';
import { useRouter } from '../context/RouterContext.tsx';
import { api } from '../services/api.js';
import Icon from '../components/Icon.tsx';
import CourseVisual from '../components/CourseVisual.tsx';

const categories = [
  'All',
  'Web Development',
  'Programming',
  'Cybersecurity',
  'Robotics'
];

export const CoursesPage: React.FC = () => {
  const { navigate } = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCourses = async (category = selectedCategory, query = searchQuery) => {
    setLoading(true);
    try {
      const res = await api.getCourses(category, query);
      if (res?.courses) setCourses(res.courses);
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#FC6454] dark:text-[#6BB89E] font-medium">
            LEARNING TRACKS
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#282828] dark:text-white tracking-tight font-sans mt-1">
            Curriculum Catalog
          </h1>
          <p className="text-xs sm:text-sm text-[#282828]/70 dark:text-white mt-1">
            Hands-on technology courses designed for high school engineers and creators.
          </p>
        </div>

        {/* Search */}
        <div className="w-full md:w-72 relative">
          <Icon name="Search" className="w-4 h-4 text-[#282828]/40 dark:text-white absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tracks, languages, tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer border-0 ${
              selectedCategory === cat
                ? 'bg-[#FC6454] text-white dark:bg-[#2F8068] dark:text-white font-semibold shadow-xs'
                : 'bg-white dark:bg-[#102B22] text-[#282828]/70 dark:text-white border border-[#282828]/10 dark:border-[#25473C] hover:bg-[#EFE6DE] dark:hover:bg-[#15362B]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="py-20 text-center text-[#282828]/70 dark:text-white space-y-2">
          <div className="w-6 h-6 border-2 border-[#FC6454] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-[#282828]/70 dark:text-white">Loading curriculum...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="py-16 text-center bg-white/70 dark:bg-[#102B22] rounded-lg border border-[#282828]/10 dark:border-[#25473C] p-8 space-y-2">
          <Icon name="GraduationCap" className="w-8 h-8 text-[#282828]/60 dark:text-white mx-auto" />
          <h3 className="text-sm font-semibold text-[#282828] dark:text-white">
            {searchQuery || selectedCategory !== 'All' ? 'No courses match your filter' : 'No courses available yet'}
          </h3>
          <p className="text-xs text-[#282828]/70 dark:text-white">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try resetting your search query or selecting another category.'
              : 'Courses will appear here once published by the club administrator.'}
          </p>
          {(searchQuery || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="group rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] flex flex-col justify-between overflow-hidden hover:border-[#FC6454]/50 dark:hover:border-[#FC6454]/60 transition-colors shadow-xs"
            >
              <div>
                <CourseVisual course={course} variant="card" />
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-[#282828]/70 dark:text-white">
                    <span className="font-medium text-[#FC6454] dark:text-[#6BB89E]">{course.category || 'Engineering'}</span>
                    <span aria-hidden="true">•</span>
                    <span>{course.duration || 'Track'}</span>
                    <span aria-hidden="true">•</span>
                    <span>{course.level || 'All Levels'}</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#282828] dark:text-white leading-snug">
                    {course.title || ''}
                  </h3>
                  <p className="text-xs text-[#282828]/80 dark:text-white line-clamp-2 leading-relaxed">
                    {course.description || ''}
                  </p>
                </div>
              </div>
              <div className="px-5 py-3.5 border-t border-[#282828]/10 dark:border-[#25473C] bg-[#EFE6DE]/40 dark:bg-[#071A14]/50 flex items-center justify-between text-xs">
                <span className="text-[#282828]/70 dark:text-white">
                  Lead: <strong className="text-[#282828] dark:text-white font-medium">{course.instructor || 'Lead'}</strong>
                </span>
                <button
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="text-[#FC6454] dark:text-[#6BB89E] hover:underline font-medium flex items-center gap-1 cursor-pointer border-0 bg-transparent p-0"
                >
                  <span>View Track</span>
                  <Icon name="ArrowRight" className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
