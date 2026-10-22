import React, { useEffect, useState } from 'react';
import { useRouter } from '../context/RouterContext.tsx';
import { api } from '../services/api.js';
import Icon from '../components/Icon.tsx';

interface AboutData {
  clubName: string;
  aboutText: string;
  aboutImage: string;
  meetingLocation: string;
  meetingSchedule: string;
}

const benefits = [
  {
    title: 'Practical Hands-on Projects',
    desc: 'Build real web portals, games, algorithms, and tools rather than purely theoretical textbook exercises.',
    iconName: 'Cpu'
  },
  {
    title: 'Peer Mentorship & Code Reviews',
    desc: 'Learn directly from senior student mentors and peers who share an enthusiasm for modern technology.',
    iconName: 'Users'
  },
  {
    title: 'Hackathons & Competitions',
    desc: 'Represent the school at regional coding challenges, algorithm contests, and international robotics fairs.',
    iconName: 'Lightbulb'
  },
  {
    title: 'Verified Technical Credentials',
    desc: 'Graduate from curriculum tracks with verifiable certificates featuring cryptographic IDs and QR codes.',
    iconName: 'Shield'
  }
];

interface TeamMember {
  id?: string;
  name: string;
  role: string;
  specialty?: string;
  department?: string;
  category?: string;
  img: string;
  pos: string;
  description?: string;
  isUniqueRole?: boolean;
  socialLinks?: {
    telegram?: string;
    github?: string;
    linkedin?: string;
    email?: string;
  };
}

const defaultTeamMembers: TeamMember[] = [
  {
    name: 'Kidus Elias',
    role: 'President',
    specialty: 'Cyber Security Instructor',
    department: 'Cyber Security',
    category: 'leadership',
    img: '/team/kidus.jpg',
    pos: 'center center',
    description: 'Co-Founder & President of ARX IT CLUB. Mentors students on cybersecurity defense, ethical hacking, and network systems.'
  },
  {
    name: 'Yohannes Nigatu',
    role: 'Vice President',
    specialty: 'AI & Machine Learning Instructor',
    department: 'AI & Machine Learning',
    category: 'leadership',
    img: '/team/jo.jpg?v=2',
    pos: 'center center',
    description: 'Co-Founder & Vice President. Directs AI research, neural network architectures, and student machine learning initiatives.'
  },
  {
    name: 'Nathan Haddis',
    role: 'Chief Marketing Officer',
    specialty: 'AI & Machine Learning Instructor',
    department: 'AI & Machine Learning',
    category: 'leadership',
    img: '/team/nathan-haddis.jpg',
    pos: 'center center',
    description: 'Chief Marketing Officer & Lead AI Instructor. Leads club outreach, branding campaigns, creative media, and AI curricula.'
  },
  {
    name: 'Natan Yonas',
    role: 'Chief Technology Officer (CTO)',
    specialty: 'Robotics Instructor',
    department: 'Robotics & Hardware',
    category: 'leadership',
    img: '/team/me.jpg?v=2',
    pos: 'center center',
    description: 'Chief Technology Officer (CTO) & Robotics Instructor. Directs technical architecture, robotics prototyping, and embedded micro-controller projects.'
  },
  {
    name: 'Nathan Wendesen',
    role: 'Front-End Development Instructor',
    specialty: 'Web Development Instructor',
    department: 'Web Development',
    category: 'instructor',
    img: '/team/nathan.jpg',
    pos: 'center center',
    description: 'Mentors students on modern UI/UX design, interactive frontend applications, responsive architectures, and web standards.'
  },
  {
    name: 'Abenezer Ameha',
    role: 'Software Engineering Instructor',
    specialty: 'Software Engineering Instructor',
    department: 'Software Engineering',
    category: 'instructor',
    img: '/team/ab.jpg?v=2',
    pos: 'center center',
    description: 'Guides students through foundational algorithms, data structures, backend engineering, and version control workflows.'
  },
  {
    name: 'Nafyad Bayissa',
    role: 'Python Instructor',
    specialty: 'Python Instructor',
    department: 'Python Programming',
    category: 'instructor',
    img: '/team/nafyad.jpg',
    pos: 'center center',
    description: 'Teaches foundational and advanced Python syntax, object-oriented concepts, scripting automation, and computational thinking.'
  },
  {
    name: 'Firaol Tadesse',
    role: 'Python Instructor',
    specialty: 'Python Instructor',
    department: 'Python Programming',
    category: 'instructor',
    img: '/team/firaol.png',
    pos: 'center center',
    description: 'Teaches Python programming foundations, problem solving, and hands-on laboratory exercises for student developers.'
  }
];

export const AboutPage: React.FC = () => {
  const { navigate } = useRouter();
  const [data, setData] = useState<AboutData>({
    clubName: 'ARX IT CLUB',
    aboutText: '',
    aboutImage: '/uploads/about-campus.svg',
    meetingLocation: 'Computer Lab 3, Highschool',
    meetingSchedule: 'Monday to Tuesday · 3:30 PM – 5:30 PM'
  });
  const [team, setTeam] = useState<TeamMember[]>(defaultTeamMembers);

  useEffect(() => {
    let mounted = true;
    api.getPublicSettings()
      .then((res: any) => {
        if (!mounted || !res?.settings) return;
        setData(prev => ({
          ...prev,
          clubName: res.settings.clubName === 'ARX IT CLUB OF SJS' ? 'ARX IT CLUB' : (res.settings.clubName || prev.clubName),
          aboutText: res.settings.aboutText || prev.aboutText,
          aboutImage: res.settings.aboutImageUrl || prev.aboutImage,
          meetingLocation: res.settings.meetingLocation || prev.meetingLocation,
          meetingSchedule: res.settings.meetingSchedule || prev.meetingSchedule
        }));
      })
      .catch(() => {});

    api.getGovernanceRoles()
      .then((res: any) => {
        if (!mounted) return;
        const list = res?.governance || res?.team;
        if (Array.isArray(list) && list.length > 0) {
          const mapped: TeamMember[] = list.map((item: any) => {
            const isNatan = item.name === 'Natan Yonas' || item.id === 'gov_natan_yonas';
            return {
              id: item.id,
              name: item.name,
              role: isNatan ? 'Chief Technology Officer (CTO)' : item.role,
              specialty: isNatan ? 'Robotics Instructor' : (item.specialty || item.department || 'Technical Instructor'),
              department: isNatan ? 'Robotics & Hardware' : item.department,
              category: isNatan ? 'leadership' : (item.category === 'board' ? 'instructor' : item.category),
              img: (item.name === 'Firaol Tadesse' || item.id === 'gov_firaol_tadesse' || item.photoUrl?.includes('leadership') || item.photoUrl?.includes('generic'))
                ? '/team/firaol.png'
                : (item.photoUrl || '/team/firaol.png'),
              pos: 'center center',
              description: isNatan
                ? 'Chief Technology Officer (CTO) & Robotics Instructor. Directs technical architecture, robotics prototyping, and embedded micro-controller projects.'
                : item.description,
              isUniqueRole: item.isUniqueRole,
              socialLinks: item.socialLinks
            };
          });
          setTeam(mapped);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  // Split into leadership and instructors (no board section)
  const primaryLeadership = team
    .filter(m => 
      m.role === 'President' || 
      m.role === 'Vice President' || 
      m.role === 'Chief Marketing Officer' ||
      m.role.includes('Chief Technology Officer') ||
      m.role.includes('CTO') ||
      m.name === 'Natan Yonas' ||
      m.category === 'leadership'
    )
    .reduce<TeamMember[]>((acc, member) => {
      // Prevent duplicate profiles
      if (!acc.some(existing => existing.name === member.name || (member.id && existing.id === member.id))) {
        acc.push(member);
      }
      return acc;
    }, [])
    .sort((a, b) => {
      const order = ['Kidus Elias', 'Yohannes Nigatu', 'Nathan Haddis', 'Natan Yonas'];
      const idxA = order.indexOf(a.name);
      const idxB = order.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });

  const instructors = team.filter(m => 
    !primaryLeadership.some(l => (l.id && l.id === m.id) || l.name === m.name) &&
    m.name !== 'Natan Yonas' &&
    m.category !== 'board' &&
    m.role !== 'Board of Director'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-16">
      {/* Header */}
      <div className="max-w-3xl space-y-4">
        <span className="text-xs font-mono uppercase tracking-wider text-[#FC6454] dark:text-[#6BB89E] font-medium">
          ORGANIZATION &amp; COMMUNITY
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#282828] dark:text-white tracking-tight font-sans">
          Building the Future of Tech at St. Joseph School
        </h1>
        <p className="text-sm sm:text-base text-[#282828]/80 dark:text-white leading-relaxed">
          {data.aboutText ||
            'ARX IT CLUB is a student-led organization established to provide practical software engineering experience, hardware prototyping, algorithms, and technology mentorship in a collaborative laboratory environment.'}
        </p>
      </div>

      {/* Lab Location & Schedule Banner */}
      <div className="p-6 sm:p-8 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-[#FC6454] dark:text-[#6BB89E] font-medium uppercase tracking-wider">
            CAMPUS HEADQUARTERS
          </span>
          <h3 className="text-xl font-bold text-[#282828] dark:text-white font-sans">
            {data.meetingLocation}
          </h3>
          <p className="text-xs text-[#282828]/70 dark:text-white">
            {data.meetingSchedule}
          </p>
        </div>
        <button
          onClick={() => navigate('/register')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer border-0 shadow-xs shrink-0 self-start md:self-auto"
        >
          <Icon name="UserPlus" className="w-3.5 h-3.5" />
          <span>Apply for Membership</span>
        </button>
      </div>

      {/* Benefits Pillars */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-[#282828] dark:text-white tracking-tight font-sans">
          Our Four Pillars
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-3 shadow-xs transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[#FC6454]/10 dark:bg-[#2F8068]/20 text-[#FC6454] dark:text-[#6BB89E] border border-[#FC6454]/20 dark:border-[#2F8068]/40 flex items-center justify-center font-bold">
                <Icon name={b.iconName} className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#282828] dark:text-white">
                {b.title}
              </h3>
              <p className="text-xs text-[#282828]/70 dark:text-white leading-relaxed">
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Section: Primary Leadership Group (Executive Governance) */}
      <div className="space-y-8">
        <div className="border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
          <span className="text-xs font-mono uppercase tracking-wider text-[#FC6454] dark:text-[#6BB89E] font-semibold">
            EXECUTIVE GOVERNANCE
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">
            Primary Leadership Group
          </h2>
          <p className="text-xs text-[#282828]/70 dark:text-white mt-1 max-w-2xl">
            The core student executives spearheading club strategy, academic curriculum, institutional partnerships, and communications.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {primaryLeadership.map((member, idx) => (
            <div
              key={member.id || idx}
              className="rounded-2xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group"
            >
              <div className="w-full aspect-square overflow-hidden relative bg-[#282828]/5 dark:bg-[#071A14]" style={{ aspectRatio: '1 / 1' }}>
                <img
                  src={member.img}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  style={{ objectPosition: member.pos || 'center center' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/team/firaol.png';
                  }}
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-[#FC6454] text-white dark:bg-[#2F8068] uppercase tracking-wider shadow-sm">
                  Rank #{idx + 1}
                </span>
              </div>
              <div className="space-y-2 w-full flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-[#282828] dark:text-white font-sans">
                  {member.name}
                </h3>
                
                {/* Dual Roles / Role Pills */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <div className="inline-block px-2.5 py-1 rounded bg-[#FC6454]/10 dark:bg-[#2F8068]/30 border border-[#FC6454]/20 dark:border-[#2F8068]/60">
                    <span className="text-xs font-mono font-bold text-[#FC6454] dark:text-[#82CBB2] uppercase tracking-wider">
                      {member.role}
                    </span>
                  </div>
                  {member.specialty && member.specialty !== member.role && (
                    <div className="inline-block px-2 py-0.5 rounded bg-[#282828]/5 dark:bg-[#15362B] border border-[#282828]/15 dark:border-[#25473C]">
                      <span className="text-xs font-mono font-medium text-[#282828]/90 dark:text-white">
                        {member.specialty}
                      </span>
                    </div>
                  )}
                </div>

                {member.department && member.department !== member.role && member.department !== member.specialty && (
                  <p className="text-xs font-medium text-[#282828]/70 dark:text-white">
                    {member.department}
                  </p>
                )}

                {member.description ? (
                  <p className="text-xs text-[#282828]/80 dark:text-white leading-relaxed pt-2 border-t border-[#282828]/10 dark:border-[#25473C]/60 mt-auto text-left">
                    {member.description}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section: Technical Instructors & Specialists */}
      <div className="space-y-8">
        <div className="border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-600 dark:text-teal-300 font-semibold">
            CURRICULUM MENTORS
          </span>
          <h2 className="text-2xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">
            Technical Instructors &amp; Specialists
          </h2>
          <p className="text-xs text-[#282828]/70 dark:text-white mt-1 max-w-2xl">
            Leading classroom laboratory workshops, code reviews, and practical hands-on software development across disciplines.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {instructors.map((member, idx) => (
            <div
              key={member.id || idx}
              className="rounded-2xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group"
            >
              <div className="w-full aspect-square overflow-hidden relative bg-[#282828]/5 dark:bg-[#071A14]" style={{ aspectRatio: '1 / 1' }}>
                <img
                  src={member.img}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  style={{ objectPosition: member.pos || 'center center' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/team/firaol.png';
                  }}
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-cyan-700 text-white dark:bg-teal-700 uppercase tracking-wider shadow-sm">
                  Instructor
                </span>
              </div>
              <div className="space-y-1.5 w-full flex-1 flex flex-col">
                <h3 className="text-base font-bold text-[#282828] dark:text-white font-sans">
                  {member.name}
                </h3>
                <span className="inline-block text-xs font-mono font-medium text-cyan-700 dark:text-teal-300 uppercase tracking-wider">
                  {member.role || member.specialty}
                </span>
                {member.department && member.department !== member.role ? (
                  <p className="text-xs text-[#282828]/70 dark:text-white">
                    {member.department}
                  </p>
                ) : null}
                {member.description ? (
                  <p className="text-xs text-[#282828]/80 dark:text-white leading-relaxed pt-2 border-t border-[#282828]/10 dark:border-[#25473C]/60 mt-auto text-left line-clamp-3">
                    {member.description}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
