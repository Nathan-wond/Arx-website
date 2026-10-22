import { api } from '../../services/api.js';
import { icon } from '../icons.js';
import { router } from '../state.js';

let pageData = {
  clubName: 'ARX IT CLUB',
  aboutText: '',
  aboutImage: '/uploads/about-campus.svg'
};
let pageDataLoaded = false;

let teamMembers = [
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

async function loadAboutData() {
  try {
    const [settingsRes, govRes] = await Promise.allSettled([
      api.getPublicSettings(),
      api.getGovernanceRoles()
    ]);

    if (settingsRes.status === 'fulfilled' && settingsRes.value?.settings) {
      if (settingsRes.value.settings.clubName) {
        pageData.clubName = settingsRes.value.settings.clubName === 'ARX IT CLUB OF SJS' ? 'ARX IT CLUB' : settingsRes.value.settings.clubName;
      }
      if (settingsRes.value.settings.aboutText) pageData.aboutText = settingsRes.value.settings.aboutText;
      if (settingsRes.value.settings.aboutImageUrl) pageData.aboutImage = settingsRes.value.settings.aboutImageUrl;
    }

    if (govRes.status === 'fulfilled') {
      const list = govRes.value?.governance || govRes.value?.team;
      if (Array.isArray(list) && list.length > 0) {
        teamMembers = list.map(item => {
          const isNatan = item.name === 'Natan Yonas' || item.id === 'gov_natan_yonas';
          return {
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
            isUniqueRole: item.isUniqueRole
          };
        });
      }
    }
    pageDataLoaded = true;
  } catch {}
}

function renderTeamSections(list) {
  const primaryLeadership = list
    .filter(m => 
      m.role === 'President' || 
      m.role === 'Vice President' || 
      m.role === 'Chief Marketing Officer' ||
      m.role.includes('Chief Technology Officer') ||
      m.role.includes('CTO') ||
      m.name === 'Natan Yonas' ||
      m.category === 'leadership'
    )
    .reduce((acc, member) => {
      if (!acc.some(existing => existing.name === member.name)) {
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

  const instructors = list.filter(m => 
    !primaryLeadership.some(l => l.name === m.name) &&
    m.name !== 'Natan Yonas' &&
    m.category !== 'board' &&
    m.role !== 'Board of Director'
  );

  return `
    <!-- Primary Leadership Group -->
    <div class="space-y-6">
      <div class="border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
        <span class="text-xs font-mono uppercase tracking-wider text-[#FC6454] dark:text-[#6BB89E] font-semibold">
          EXECUTIVE LEADERSHIP
        </span>
        <h2 class="text-2xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">
          Primary Leadership Group
        </h2>
        <p class="text-xs text-[#282828]/70 dark:text-white mt-1 max-w-2xl">
          Steering the strategic vision, technical operations, and outreach initiatives of the ARX IT CLUB.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        ${primaryLeadership.map((m, idx) => `
          <div class="rounded-2xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group">
            <div class="w-full aspect-square overflow-hidden relative bg-[#282828]/5 dark:bg-[#071A14]" style="aspect-ratio: 1 / 1;">
              <img
                src="${m.img}"
                alt="${m.name}"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                style="object-position: ${m.pos || 'center center'};"
                onerror="this.onerror=null; this.src='/team/firaol.png';" />
              <span class="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-[#FC6454] text-white dark:bg-[#2F8068] uppercase tracking-wider shadow-sm">
                Rank #${idx + 1}
              </span>
            </div>
            <div class="p-5 space-y-2 w-full flex-1 flex flex-col">
              <h3 class="text-lg font-bold text-[#282828] dark:text-white font-sans">${m.name}</h3>
              <div class="flex flex-wrap gap-1.5 items-center">
                <div class="inline-block px-2.5 py-1 rounded bg-[#FC6454]/10 dark:bg-[#2F8068]/30 border border-[#FC6454]/20 dark:border-[#2F8068]/60">
                  <span class="text-xs font-mono font-bold text-[#FC6454] dark:text-[#82CBB2] uppercase tracking-wider">
                    ${m.role}
                  </span>
                </div>
                ${m.specialty && m.specialty !== m.role ? `
                  <div class="inline-block px-2 py-0.5 rounded bg-[#282828]/5 dark:bg-[#15362B] border border-[#282828]/15 dark:border-[#25473C]">
                    <span class="text-xs font-mono font-medium text-[#282828]/90 dark:text-white">
                      ${m.specialty}
                    </span>
                  </div>
                ` : ''}
              </div>
              ${m.description ? `
                <p class="text-xs text-[#282828]/80 dark:text-[#CBE0D8] leading-relaxed pt-2 border-t border-[#282828]/10 dark:border-[#25473C]/60 mt-auto text-left">
                  ${m.description}
                </p>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Technical Instructors -->
    <div class="space-y-6">
      <div class="border-b border-[#282828]/10 dark:border-[#25473C] pb-4">
        <span class="text-xs font-mono uppercase tracking-wider text-cyan-600 dark:text-teal-300 font-semibold">
          CURRICULUM MENTORS
        </span>
        <h2 class="text-2xl font-bold text-[#282828] dark:text-white tracking-tight mt-1 font-sans">
          Technical Instructors &amp; Specialists
        </h2>
        <p class="text-xs text-[#282828]/70 dark:text-white mt-1 max-w-2xl">
          Leading classroom laboratory workshops, code reviews, and practical hands-on software development across disciplines.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        ${instructors.map(m => `
          <div class="rounded-2xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group">
            <div class="w-full aspect-square overflow-hidden relative bg-[#282828]/5 dark:bg-[#071A14]" style="aspect-ratio: 1 / 1;">
              <img
                src="${m.img}"
                alt="${m.name}"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                style="object-position: ${m.pos || 'center center'};"
                onerror="this.onerror=null; this.src='/team/firaol.png';" />
              <span class="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-cyan-700 text-white dark:bg-teal-700 uppercase tracking-wider shadow-sm">
                Instructor
              </span>
            </div>
            <div class="p-5 space-y-1.5 w-full flex-1 flex flex-col">
              <h3 class="text-base font-bold text-[#282828] dark:text-white font-sans">${m.name}</h3>
              <span class="inline-block text-xs font-mono font-medium text-cyan-700 dark:text-teal-300 uppercase tracking-wider">
                ${m.role || m.specialty}
              </span>
              ${m.department && m.department !== m.role ? `
                <p class="text-xs text-[#282828]/70 dark:text-white">${m.department}</p>
              ` : ''}
              ${m.description ? `
                <p class="text-xs text-[#282828]/80 dark:text-[#CBE0D8] leading-relaxed pt-2 border-t border-[#282828]/10 dark:border-[#25473C]/60 mt-auto text-left line-clamp-3">
                  ${m.description}
                </p>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderAboutPage() {
  loadAboutData().then(() => {
    const headerTitle = document.querySelector('#about-page-title');
    if (headerTitle) headerTitle.textContent = `About ${pageData.clubName}`;
    const teamContainer = document.querySelector('#about-team-container');
    if (teamContainer) teamContainer.innerHTML = renderTeamSections(teamMembers);
  });

  return `
    <div class="space-y-16 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section 1: Header -->
      <div class="max-w-3xl space-y-4">
        <span class="text-xs font-mono uppercase tracking-wider text-[#FC6454] dark:text-[#6BB89E] font-medium">
          ORGANIZATION &amp; COMMUNITY
        </span>
        <h1 id="about-page-title" class="text-3xl sm:text-5xl font-extrabold text-[#282828] dark:text-white tracking-tight font-sans">
          Building the Future of Tech at St. Joseph School
        </h1>
        <p class="text-sm sm:text-base text-[#282828]/80 dark:text-white leading-relaxed">
          ${pageData.aboutText ||
            'ARX IT CLUB is a student-led organization established to provide practical software engineering experience, hardware prototyping, algorithms, and technology mentorship in a collaborative laboratory environment.'}
        </p>
      </div>

      <!-- Section 2: Meeting Location Banner -->
      <div class="p-6 sm:p-8 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div class="space-y-1">
          <span class="text-[11px] font-mono text-[#FC6454] dark:text-[#6BB89E] font-medium uppercase tracking-wider">
            CAMPUS HEADQUARTERS
          </span>
          <h3 class="text-xl font-bold text-[#282828] dark:text-white font-sans">
            Computer Lab 3, Highschool
          </h3>
          <p class="text-xs text-[#282828]/70 dark:text-white">
            Monday to Tuesday &middot; 3:30 PM &ndash; 5:30 PM
          </p>
        </div>
        <button
          data-nav="/register"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-all cursor-pointer border-0 shadow-xs shrink-0 self-start md:self-auto">
          ${icon('UserPlus', 'w-3.5 h-3.5')}
          <span>Apply for Membership</span>
        </button>
      </div>

      <!-- Section 3: Four Pillars -->
      <div class="space-y-6">
        <h2 class="text-2xl font-bold text-[#282828] dark:text-white tracking-tight font-sans">
          Our Four Pillars
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="p-6 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-3 shadow-xs transition-colors">
            <div class="w-10 h-10 rounded-lg bg-[#FC6454]/10 dark:bg-[#2F8068]/20 text-[#FC6454] dark:text-[#6BB89E] border border-[#FC6454]/20 dark:border-[#2F8068]/40 flex items-center justify-center font-bold">
              ${icon('Cpu', 'w-5 h-5')}
            </div>
            <h3 class="text-base font-bold text-[#282828] dark:text-white">Practical Hands-on Projects</h3>
            <p class="text-xs text-[#282828]/70 dark:text-white leading-relaxed">
              Build real web portals, games, algorithms, and tools rather than purely theoretical textbook exercises.
            </p>
          </div>

          <div class="p-6 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-3 shadow-xs transition-colors">
            <div class="w-10 h-10 rounded-lg bg-[#FC6454]/10 dark:bg-[#2F8068]/20 text-[#FC6454] dark:text-[#6BB89E] border border-[#FC6454]/20 dark:border-[#2F8068]/40 flex items-center justify-center font-bold">
              ${icon('Users', 'w-5 h-5')}
            </div>
            <h3 class="text-base font-bold text-[#282828] dark:text-white">Peer Mentorship &amp; Reviews</h3>
            <p class="text-xs text-[#282828]/70 dark:text-white leading-relaxed">
              Learn directly from senior student mentors and peers who share an enthusiasm for modern technology.
            </p>
          </div>

          <div class="p-6 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-3 shadow-xs transition-colors">
            <div class="w-10 h-10 rounded-lg bg-[#FC6454]/10 dark:bg-[#2F8068]/20 text-[#FC6454] dark:text-[#6BB89E] border border-[#FC6454]/20 dark:border-[#2F8068]/40 flex items-center justify-center font-bold">
              ${icon('Lightbulb', 'w-5 h-5')}
            </div>
            <h3 class="text-base font-bold text-[#282828] dark:text-white">Hackathons &amp; Competitions</h3>
            <p class="text-xs text-[#282828]/70 dark:text-white leading-relaxed">
              Represent the school at regional coding challenges, algorithm contests, and international robotics fairs.
            </p>
          </div>

          <div class="p-6 rounded-xl border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] space-y-3 shadow-xs transition-colors">
            <div class="w-10 h-10 rounded-lg bg-[#FC6454]/10 dark:bg-[#2F8068]/20 text-[#FC6454] dark:text-[#6BB89E] border border-[#FC6454]/20 dark:border-[#2F8068]/40 flex items-center justify-center font-bold">
              ${icon('Shield', 'w-5 h-5')}
            </div>
            <h3 class="text-base font-bold text-[#282828] dark:text-white">Verified Credentials</h3>
            <p class="text-xs text-[#282828]/70 dark:text-white leading-relaxed">
              Graduate from curriculum tracks with verifiable certificates featuring cryptographic IDs and QR codes.
            </p>
          </div>
        </div>
      </div>

      <!-- Section 4: Dynamic Team Sections Container -->
      <div id="about-team-container" class="space-y-12">
        ${renderTeamSections(teamMembers)}
      </div>
    </div>
  `;
}

export function initAboutPageEvents() {
  // Handlers for dynamic elements
}
