import React, { useEffect, useState } from 'react';
import { useRouter } from '../context/RouterContext.tsx';
import { api } from '../services/api.js';
import Icon from '../components/Icon.tsx';
import CourseVisual from '../components/CourseVisual.tsx';

interface HomeStats {
  activeMembers: number;
  coursesCount: number;
  projectsCount: number;
  eventsCount: number;
}

interface HomeSettings {
  clubName: string;
  tagline: string;
  description: string;
  meetingLocation: string;
  meetingSchedule: string;
  telegramChannelUrl: string;
  telegramBotUrl: string;
  telegramBotUsername: string;
  registrationStatus: string;
}

export const HomePage: React.FC = () => {
  const { navigate } = useRouter();
  const [stats, setStats] = useState<HomeStats>({
    activeMembers: 0,
    coursesCount: 0,
    projectsCount: 0,
    eventsCount: 0
  });
  const [settings, setSettings] = useState<HomeSettings>({
    clubName: 'ARX IT CLUB',
    tagline: 'Learn. Build. Grow.',
    description: 'The school technology club giving students hands-on experience in software engineering, systems design, collaborative projects, and verified credentials.',
    meetingLocation: 'Computer Lab 3, Highschool',
    meetingSchedule: 'Monday to Tuesday · 3:30 PM – 5:30 PM',
    telegramChannelUrl: 'https://t.me/arxitclub',
    telegramBotUrl: 'https://t.me/ARXITCLUB_bot',
    telegramBotUsername: 'ARXITCLUB_bot',
    registrationStatus: 'OPEN'
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [certInput, setCertInput] = useState('');

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.getStats().catch(() => ({ stats: { activeMembers: 0, coursesCount: 0, projectsCount: 0, eventsCount: 0 } })),
      api.getSettings().catch(() => ({ settings: null })),
      api.getCourses().catch(() => ({ courses: [] })),
      api.getProjects().catch(() => ({ projects: [] }))
    ]).then(([statsRes, settingsRes, coursesRes, projectsRes]: [any, any, any, any]) => {
      if (!mounted) return;
      if (statsRes?.stats) setStats(statsRes.stats);
      if (settingsRes?.settings) setSettings(prev => ({ ...prev, ...settingsRes.settings }));
      if (coursesRes?.courses) setCourses(coursesRes.courses.slice(0, 4));
      if (projectsRes?.projects) setProjects(projectsRes.projects.slice(0, 3));
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certInput.trim()) {
      navigate('/certificates');
      return;
    }
    navigate(`/certificates?id=${encodeURIComponent(certInput.trim())}`);
  };

  const isRegistrationClosed = settings.registrationStatus === 'CLOSED';

  return (
    <div className="space-y-16 lg:space-y-24 pb-20">
      {/* 1. Hero Section: 2-Column Split with Operations Desk */}
      <section className="border-b border-[#282828]/10 dark:border-[#25473C] bg-[#F7EFE8] dark:bg-[#071A14] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Column: Organization Branding & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="flex items-center gap-2 text-xs font-mono text-[#FC6454] dark:text-[#6BB89E]">
                <span className="w-2 h-2 rounded-full bg-[#FC6454] animate-pulse"></span>
                <span>OFFICIAL TECHNOLOGY ORGANIZATION</span>
                <span aria-hidden="true">&middot;</span>
                <span className="text-[#282828]/60 dark:text-white/60">2026 CYCLE</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#282828] dark:text-white leading-[1.08] text-balance font-sans">
                  {settings.clubName === 'ARX IT CLUB OF SJS' ? 'ARX IT CLUB' : (settings.clubName || 'ARX IT CLUB')}
                </h1>
                <p className="text-lg sm:text-xl font-medium text-[#282828]/80 dark:text-white/90">
                  {settings.tagline || 'Learn. Build. Grow.'}
                </p>
              </div>

              <p className="text-sm sm:text-base text-[#282828]/70 dark:text-white/75 leading-relaxed max-w-2xl">
                {settings.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {isRegistrationClosed ? (
                  <button
                    onClick={() => navigate('/register')}
                    className="px-4 py-2.5 rounded-md text-sm font-semibold border border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all cursor-pointer"
                  >
                    Admissions Closed
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/register')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer shadow-xs border-0"
                  >
                    <span>Join Club</span>
                    <Icon name="ArrowRight" className="w-4 h-4 ml-1" />
                  </button>
                )}
                <button
                  onClick={() => navigate('/courses')}
                  className="px-4 py-2.5 rounded-md text-sm font-medium border border-[#282828]/20 dark:border-[#25473C] text-[#282828] dark:text-white hover:bg-[#282828]/5 dark:hover:bg-[#102B22] transition-colors cursor-pointer"
                >
                  Explore Curriculum
                </button>
                <a
                  href={settings.telegramChannelUrl || 'https://t.me/arxitclub'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-md text-xs font-medium text-[#282828] dark:text-white hover:text-[#FC6454] border border-[#282828]/15 dark:border-[#25473C] hover:bg-[#FC6454]/10 transition-colors"
                >
                  <Icon name="Send" className="w-3.5 h-3.5 text-[#FC6454]" />
                  <span>@arxitclub</span>
                </a>
              </div>

              <div className="pt-4 border-t border-[#282828]/10 dark:border-[#25473C] flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#282828]/60 dark:text-white/60">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Free Student Membership</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FC6454]"></span>
                  <span>Lab Project Mentorship</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span>Verified Credentials</span>
                </div>
              </div>
            </div>

            {/* Right Column: Operations Desk */}
            <div className="lg:col-span-5 w-full">
              <div className="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white/70 dark:bg-[#102B22] overflow-hidden shadow-xs">
                <div className="px-5 py-3 border-b border-[#282828]/10 dark:border-[#25473C] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#282828] dark:text-white">OPERATIONS DESK</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#282828]/60 dark:text-white/60">STATUS / ACTIVE</span>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#282828]/60 dark:text-white/60">Headquarters &amp; Lab</span>
                    <div className="flex items-start gap-2 text-[#282828] dark:text-white font-medium">
                      <Icon name="MapPin" className="w-4 h-4 text-[#FC6454] shrink-0 mt-0.5" />
                      <span>{settings.meetingLocation}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#282828]/60 dark:text-white/60">Weekly Sessions</span>
                    <div className="flex items-start gap-2 text-[#282828] dark:text-white font-medium">
                      <Icon name="Clock" className="w-4 h-4 text-[#FC6454] shrink-0 mt-0.5" />
                      <span>{settings.meetingSchedule}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#282828]/10 dark:border-[#25473C] grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#EFE6DE]/60 dark:bg-[#071A14] rounded-md border border-[#282828]/10 dark:border-[#25473C]">
                      <p className="text-[11px] font-mono text-[#282828]/60 dark:text-white/60 uppercase">Enrolled Members</p>
                      <p className="text-lg font-bold text-[#282828] dark:text-white font-mono tabular-nums mt-0.5">{stats.activeMembers}</p>
                    </div>
                    <div className="p-3 bg-[#EFE6DE]/60 dark:bg-[#071A14] rounded-md border border-[#282828]/10 dark:border-[#25473C]">
                      <p className="text-[11px] font-mono text-[#282828]/60 dark:text-white/60 uppercase">Available Tracks</p>
                      <p className="text-lg font-bold text-[#FC6454] dark:text-[#6BB89E] font-mono tabular-nums mt-0.5">{stats.coursesCount}</p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => navigate('/about')}
                      className="w-full py-2 text-center text-xs font-medium text-[#282828] dark:text-white hover:text-[#FC6454] bg-[#EFE6DE]/70 dark:bg-[#071A14] rounded-md border border-[#282828]/15 dark:border-[#25473C] transition-colors cursor-pointer"
                    >
                      View Organization Charter &amp; Leadership &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Stats Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-[#FAF4EE] dark:bg-[#102B22] p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="space-y-1 sm:border-r border-[#282828]/10 dark:border-[#25473C] sm:pr-6">
              <span className="text-xs font-mono uppercase tracking-wider text-[#282828]/70 dark:text-white">Active Members</span>
              <p className="text-3xl sm:text-4xl font-bold text-[#282828] dark:text-white font-mono tabular-nums">{stats.activeMembers}</p>
              <p className="text-[11px] text-[#282828]/60 dark:text-white">Registered students</p>
            </div>
            <div className="space-y-1 md:border-r border-[#282828]/10 dark:border-[#25473C] md:pr-6">
              <span className="text-xs font-mono uppercase tracking-wider text-[#282828]/70 dark:text-white">Curriculum Courses</span>
              <p className="text-3xl sm:text-4xl font-bold text-[#FC6454] dark:text-[#6BB89E] font-mono tabular-nums">{stats.coursesCount}</p>
              <p className="text-[11px] text-[#282828]/60 dark:text-white">Structured training modules</p>
            </div>
            <div className="space-y-1 sm:border-r border-[#282828]/10 dark:border-[#25473C] sm:pr-6">
              <span className="text-xs font-mono uppercase tracking-wider text-[#282828]/70 dark:text-white">Software Projects</span>
              <p className="text-3xl sm:text-4xl font-bold text-[#282828] dark:text-white font-mono tabular-nums">{stats.projectsCount}</p>
              <p className="text-[11px] text-[#282828]/60 dark:text-white">Shipped student repos</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-[#282828]/70 dark:text-white">Activities &amp; Labs</span>
              <p className="text-3xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">{stats.eventsCount}</p>
              <p className="text-[11px] text-[#282828]/60 dark:text-white">Conducted workshops</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Pillars / Methodology */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
          <div>
            <span className="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider font-semibold">PILLARS / METHODOLOGY</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">Core Technical Tracks</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#282828]/60 dark:text-white/60 max-w-md">
            Four interconnected stages transforming classroom curiosity into production-grade software engineering.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-6 space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-[#282828]/60 dark:text-white/60 text-xs font-mono">
              <span>TRACK 01</span>
              <Icon name="Laptop" className="w-4 h-4 text-[#FC6454]" />
            </div>
            <h3 className="text-base font-semibold text-[#282828] dark:text-white">Learn Fundamentals</h3>
            <p className="text-xs text-[#282828]/70 dark:text-white/70 leading-relaxed">
              Master web architectures, typed programming with TypeScript and Python, networking basics, and algorithm design.
            </p>
          </div>

          <div className="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-6 space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-[#282828]/60 dark:text-white/60 text-xs font-mono">
              <span>TRACK 02</span>
              <Icon name="Code" className="w-4 h-4 text-[#FC6454]" />
            </div>
            <h3 className="text-base font-semibold text-[#282828] dark:text-white">Build Real Systems</h3>
            <p className="text-xs text-[#282828]/70 dark:text-white/70 leading-relaxed">
              Collaborate on real student web applications, automation bots, relational databases, and verifiable microservices.
            </p>
          </div>

          <div className="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-6 space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-[#282828]/60 dark:text-white/60 text-xs font-mono">
              <span>TRACK 03</span>
              <Icon name="Award" className="w-4 h-4 text-[#FC6454]" />
            </div>
            <h3 className="text-base font-semibold text-[#282828] dark:text-white">Compete &amp; Ship</h3>
            <p className="text-xs text-[#282828]/70 dark:text-white/70 leading-relaxed">
              Represent our school in hackathons, algorithm competitions, and robotics challenges with faculty guidance.
            </p>
          </div>

          <div className="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-6 space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-[#282828]/60 dark:text-white/60 text-xs font-mono">
              <span>TRACK 04</span>
              <Icon name="Users" className="w-4 h-4 text-[#FC6454]" />
            </div>
            <h3 className="text-base font-semibold text-[#282828] dark:text-white">Collaborate in Teams</h3>
            <p className="text-xs text-[#282828]/70 dark:text-white/70 leading-relaxed">
              Work under code reviews, git feature branches, peer programming sessions, and constructive design critiques.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Featured Courses */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
          <div>
            <span className="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider font-semibold">CURRICULUM / COURSES</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">Featured Training Modules</h2>
          </div>
          <button
            onClick={() => navigate('/courses')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer"
          >
            <span>View All Courses</span>
            <Icon name="ChevronRight" className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="group rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] flex flex-col justify-between overflow-hidden hover:border-[#FC6454]/50 dark:hover:border-[#FC6454]/60 transition-colors shadow-xs"
            >
              <div>
                <CourseVisual course={course} variant="card" />
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-[#282828]/60 dark:text-white/60">
                    <span className="font-medium text-[#FC6454] dark:text-[#6BB89E]">{course.category || 'Engineering'}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span>{course.duration || ''}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span>{course.level || 'All Levels'}</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#282828] dark:text-white leading-snug">
                    {course.title || ''}
                  </h3>
                  <p className="text-xs text-[#282828]/70 dark:text-white/70 line-clamp-2 leading-relaxed">
                    {course.description || ''}
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-[#282828]/10 dark:border-[#25473C] bg-[#EFE6DE]/40 dark:bg-[#071A14]/50 flex items-center justify-between text-xs">
                <span className="text-[#282828]/60 dark:text-white/60">
                  Lead: <strong className="text-[#282828] dark:text-white font-medium">{course.instructor || ''}</strong>
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
      </section>

      {/* 5. Selected Member Projects */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
          <div>
            <span className="text-xs font-mono text-[#FC6454] dark:text-[#6BB89E] uppercase tracking-wider font-semibold">SHOWCASE / REPOSITORIES</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">Selected Member Projects</h2>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer"
          >
            <span>View All Projects</span>
            <Icon name="ChevronRight" className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] flex flex-col justify-between overflow-hidden hover:border-[#FC6454]/50 dark:hover:border-[#FC6454]/60 transition-colors shadow-xs"
            >
              <div>
                {proj.imageUrl ? (
                  <div className="w-full h-40 bg-[#EFE6DE] dark:bg-[#071A14] border-b border-[#282828]/10 dark:border-[#25473C] overflow-hidden">
                    <img src={proj.imageUrl} alt={proj.title || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ) : null}
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-[#282828]/60 dark:text-white/60">
                    <span className="font-mono">{proj.date || '2026'}</span>
                    <span aria-hidden="true">&middot;</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{proj.status || ''}</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#282828] dark:text-white leading-snug">
                    {proj.title || ''}
                  </h3>
                  <p className="text-xs text-[#282828]/70 dark:text-white/70 line-clamp-3 leading-relaxed">
                    {proj.description || ''}
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-[#282828]/10 dark:border-[#25473C] bg-[#EFE6DE]/40 dark:bg-[#071A14]/50 flex items-center justify-between gap-2 text-xs">
                <div className="text-[#282828]/60 dark:text-white/60 truncate max-w-[170px]">
                  Team: <span className="text-[#282828] dark:text-white font-medium">
                    {Array.isArray(proj.projectMembers) ? proj.projectMembers.join(', ') : (proj.projectMembers || 'IT Club Team')}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(proj.githubUrl || proj.projectUrl) ? (
                    <a
                      href={proj.githubUrl || proj.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#282828] dark:text-white hover:text-[#FC6454] dark:hover:text-[#6BB89E] font-medium transition-colors"
                      title="Repository"
                    >
                      <span>Code</span>
                    </a>
                  ) : null}
                  {proj.liveDemoUrl ? (
                    <a
                      href={proj.liveDemoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#FC6454] dark:text-[#6BB89E] hover:underline font-medium transition-colors"
                      title="Live Demo"
                    >
                      <span>Demo</span>
                      <Icon name="ExternalLink" className="w-3 h-3" />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Verification Banner: Cryptographic Credential Registry */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-8 sm:p-12 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-[#FC6454] dark:text-[#6BB89E]">
                <Icon name="ShieldCheck" className="w-4 h-4 text-[#FC6454] dark:text-[#6BB89E]" />
                <span>CRYPTOGRAPHIC CREDENTIAL REGISTRY</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#282828] dark:text-white tracking-tight font-sans">
                Recognized Technical Certificates
              </h2>
              <p className="text-xs sm:text-sm text-[#282828]/70 dark:text-white leading-relaxed max-w-xl">
                Every certificate issued by ARX IT CLUB carries a unique certificate ID,
                academic seal, and verification hash. Universities, competitions, and employers
                can verify credential authenticity directly on our public ledger.
              </p>

              <form onSubmit={handleVerifySubmit} className="flex flex-col sm:flex-row gap-2 max-w-md pt-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#282828]/40 dark:text-white">
                    <Icon name="Search" className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Enter Certificate ID (e.g. ITC-...)"
                    value={certInput}
                    onChange={(e) => setCertInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-md border border-[#282828]/20 dark:border-[#294B40] bg-white dark:bg-[#0C241C] text-[#282828] dark:text-white placeholder-[#282828]/40 dark:placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-md bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer shadow-xs border-0 shrink-0"
                >
                  Verify Credential
                </button>
              </form>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm rounded-lg border border-[#282828]/10 dark:border-[#25473C] bg-[#FAF4EE] dark:bg-[#0C241C] p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#282828]/10 dark:border-[#25473C]">
                  <span className="text-xs font-mono text-[#282828]/50 dark:text-white uppercase">Tamper-Proof Registry</span>
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-[#58B889] bg-emerald-50 dark:bg-[#102B22] px-2 py-0.5 rounded-sm border border-emerald-200 dark:border-[#25473C]">VERIFIED</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#282828]/70 dark:text-white">
                    <span>Algorithm</span>
                    <span className="font-mono text-[#282828] dark:text-white">SHA-256 Digest</span>
                  </div>
                  <div className="flex justify-between text-[#282828]/70 dark:text-white">
                    <span>Public Lookup</span>
                    <span className="font-mono text-[#FC6454] dark:text-[#6BB89E]">Enabled</span>
                  </div>
                  <div className="flex justify-between text-[#282828]/70 dark:text-white">
                    <span>Print Format</span>
                    <span className="font-mono text-[#282828] dark:text-white">A4 Landscape</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/certificates')}
                  className="w-full px-3 py-1.5 rounded-md text-xs font-medium border border-[#282828]/20 dark:border-[#25473C] hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer text-center"
                >
                  Open Credential Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Bottom Join CTA with Official ARX IT Club Logo */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        {/* Official ARX IT Club Logo Mark */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl overflow-hidden border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-1 shadow-md transition-colors">
          <img
            src="/assets/arx-logo-light.jpg"
            alt="ARX IT CLUB Official Logo"
            className="w-full h-full object-cover rounded-xl dark:hidden"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/arx-primary-logo.png';
            }}
          />
          <img
            src="/assets/arx-logo-dark.jpg"
            alt="ARX IT CLUB Official Logo"
            className="w-full h-full object-cover rounded-xl hidden dark:block"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/arx-primary-logo.png';
            }}
          />
        </div>

        <span className="text-xs font-mono text-[#FC6454] dark:text-[#82CBB2] uppercase tracking-wider font-semibold block">
          MEMBERSHIP / JOIN
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold text-[#282828] dark:text-white tracking-tight font-sans">
          Ready to build with ARX IT CLUB?
        </h2>
        <p className="text-sm text-[#282828]/70 dark:text-white max-w-xl mx-auto leading-relaxed">
          Join our active student cohort, receive your unique Member ID, attend weekly lab workshops,
          and start building meaningful software projects.
        </p>
        <div className="pt-2">
          {isRegistrationClosed ? (
            <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2.5 rounded-md text-sm font-semibold border border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 cursor-pointer"
              >
                Admissions Notice
              </button>
              <a
                href={settings.telegramChannelUrl || 'https://t.me/arxitclub'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
              >
                <Icon name="Send" className="w-4 h-4" />
                <span>Join @arxitclub for Opening Announcements</span>
              </a>
            </div>
          ) : (
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer font-semibold text-sm shadow-xs border-0"
            >
              <span>Register as New Member</span>
              <Icon name="ArrowRight" className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
