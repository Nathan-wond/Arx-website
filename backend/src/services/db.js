import fs from 'fs';
import { hashPassword, verifyPassword } from '../utils/passwordUtils.js';
import { generateMemberId, generateCertificateId } from '../utils/idGenerator.js';
import path from 'path';
import { ensureSeedImagesExist } from '../utils/seedImages.js';
import { CONFIG } from '../config/index.js';
import { readDb, readDbAsync, writeDb } from './fileService.js';
import { getAddisAbabaNow, internationalToEthiopianTime, ethiopianToInternationalTime, evaluateSessionWindow } from '../utils/ethiopianTimeUtils.js';
class DatabaseStore {
  isFileHydrated = false;
  lastFileSync = 0;
  initPromise = null;

  members = new Map();
  memberAwardFiles = new Map();
  courses = new Map();
  enrollments = new Map();
  certificates = new Map();
  awards = new Map();
  projects = new Map();
  events = new Map();
  achievements = new Map();
  announcements = new Map();
  activities = new Map();
  telegramBroadcasts = new Map();
  studentProjectSubmissions = new Map();
  activationSessions = new Map();
  passwordResetSessions = new Map();
  attendanceSessions = new Map();
  attendanceRecords = new Map();
  attendanceSessionConfigs = [
    {
      id: 'session_afternoon',
      name: 'ARX Afternoon General Assembly',
      ethiopianOpenTime: '7:00',
      ethiopianPresentCutoff: '7:30',
      ethiopianLateCutoff: '7:40',
      startTime: '13:00',
      endTime: '13:40',
      presentUntilMinutes: 30,
      lateUntilMinutes: 40,
      isActive: true,
      displaySchedule: '7:00 – 7:40 Ethiopian Time (1:00 PM – 1:40 PM International Time)'
    }
  ];

  assignments = new Map();
  assignmentSubmissions = new Map();
  clubResources = new Map();
  media = new Map();
  socialLinks = new Map();
  governance = new Map();
  botCommands = new Map();
  botContent = {};
  telegramUserStates =

    new Map();
  botStatus = {
    lastConnectedAt: undefined,
    lastUpdateReceivedAt: undefined,
    botId: undefined,
    botDisplayName: 'ARX IT CLUB OF SJS Official Bot',
    commandsSynced: false,
    lastError: null
  };
  auditLogs = [];
  settings;

  constructor() {
    
    try {
      const uploadsDir = path.resolve(process.cwd(), 'uploads');
      ensureSeedImagesExist(uploadsDir);
    } catch (e) {
      console.warn('Could not write seed images to disk:', e);
    }

    this.settings = {
      clubName: 'ARX IT CLUB',
      tagline: 'Learn. Build. Grow.',
      description:
        'ARX IT CLUB gives students opportunities to learn technology, build projects, participate in events, and develop practical IT skills.',
      aboutText:
        'The ARX IT CLUB is a student-led technology community dedicated to igniting curiosity, building digital products, and fostering essential technical skills for the next generation.',
      schoolName: 'St. Joseph School',
      schoolDepartment: 'Department of Computer Science & Robotics',
      contactEmail: 'contact@arx-website-sjs.vercel.app',
      contactPhone: '+1 (555) 234-5678',
      address: 'Computer Lab 3, Highschool (Second Floor), Campus Technology Wing',
      websiteUrl: 'https://arx-website-sjs.vercel.app',
      adminUrl: '/71354caa6bea2251',
      githubUrl: 'https://github.com/ARX-IT-CLUB',
      youtubeUrl: '',
      linkedinUrl: '',
      
      telegramBotUsername: CONFIG.TELEGRAM_BOT_USERNAME || 'ARXITCLUB_bot',
      telegramBotUrl: CONFIG.TELEGRAM_BOT_URL || 'https://t.me/ARXITCLUB_bot',
      
      telegramChannelUrl: CONFIG.TELEGRAM_CHANNEL_LINK || 'https://t.me/arxitclub',
      telegramChannelName: CONFIG.TELEGRAM_CHANNEL_HANDLE || '@arxitclub',
      heroHeadline: 'Welcome to ARX IT CLUB',
      heroSubheadline: 'Learn. Build. Grow.',
      meetingLocation: 'Computer Lab 3, Highschool (Second Floor)',
      meetingSchedule: 'Monday to Tuesday: 3:30 PM – 5:30 PM',
      footerText: 'Official ARX IT CLUB. Empowering the next generation of builders.',
      registrationStatus: 'OPEN',
      registrationClosedMessage:
        'Registration for ARX IT CLUB is currently closed. Please follow our official channel @arxitclub for future enrollment cycles.',
      logoUrl: '/assets/arx-logo-light.jpg',
      compactLogoUrl: '/assets/arx-logo-light.jpg',
      logoDarkUrl: '/assets/arx-logo-dark.jpg',
      compactLogoDarkUrl: '/assets/arx-logo-dark.jpg',
      symbolMarkUrl: '/uploads/arx-symbol-mark.png',
      heroBannerUrl: '/uploads/arx-hero-banner.svg',
      aboutHeroImageUrl: '/uploads/computer-lab-3.svg',
      aboutTeamImageUrl: '/uploads/student-leadership.svg',
      certificateStampUrl: '/uploads/academic-seal.svg',
      updatedAt: new Date().toISOString()
    };

    
    this.initAdmin();
    this.initMedia();
    this.initCourses();
    this.initCertificates();
    this.initProjects();
    this.initEvents();
    this.initAchievements();
    this.initSocialLinks();
    this.initGovernance();
    this.initTelegramBroadcasts();
    this.initClubResources();
    this.initAssignments();
    this.initBotCommands();
    this.initAttendanceSessions();

    
    this.ensureInitialized().catch((err) => {
      console.warn('[DB] File hydration error on startup:', err?.message || err);
    });
  }

  
  async ensureInitialized(force = false) {
    const now = Date.now();
    if (this.isFileHydrated && !force && (now - this.lastFileSync < 3000)) {
      return;
    }
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const data = await readDbAsync();
        if (!data) {
          this._saveToFile();
          this.isFileHydrated = true;
          this.lastFileSync = Date.now();
          return;
        }

        
        if (Array.isArray(data.members)) {
          for (const m of data.members) {
            if (m && m.id) this.members.set(m.id, m);
          }
        }

        
        let needsSave = false;
        // Ensure Presidential Administrator Account (adminp)
        let presMember = this.members.get('admin_presidential') || this.members.get('president_root');
        const configuredPresPassword = (process.env.PRESIDENT_PASSWORD || CONFIG.PRESIDENT_PASSWORD || '').trim();
        if (!this.members.has('admin_presidential')) {
          const presAccount = {
            id: 'admin_presidential',
            memberId: 'adminp',
            studentName: 'ARX Presidential Administrator',
            class: 'Club Executive / President',
            passwordHash: hashPassword(configuredPresPassword),
            phoneNumber: 'N/A',
            telegramUsername: '@arx_president',
            role: 'president',
            status: 'approved',
            isApproved: true,
            mustChangePassword: true,
            permissions: ['all', 'manage_admins', 'delete_members', 'system_backup', 'governance', 'settings', 'certificates', 'applications', 'courses'],
            createdAt: '2026-09-01T00:00:00.000Z',
            updatedAt: new Date().toISOString()
          };
          this.members.set(presAccount.id, presAccount);
          needsSave = true;
        }

        // Ensure legacy president_root remains synced
        let legacyPres = this.members.get('president_root');
        if (!legacyPres) {
          legacyPres = {
            id: 'president_root',
            memberId: 'NEXORA',
            studentName: 'ARX Club President',
            class: 'Club Executive / President',
            passwordHash: hashPassword(configuredPresPassword),
            phoneNumber: 'N/A',
            telegramUsername: '@arx_president',
            role: 'president',
            status: 'approved',
            isApproved: true,
            permissions: ['all', 'manage_admins', 'delete_members', 'system_backup', 'governance', 'settings', 'certificates', 'applications', 'courses'],
            createdAt: '2026-09-01T00:00:00.000Z',
            updatedAt: new Date().toISOString()
          };
          this.members.set(legacyPres.id, legacyPres);
          needsSave = true;
        }

        // Ensure Officer Administrator Account (admino)
        const configuredAdminPassword = (process.env.ADMIN_PASSWORD || CONFIG.ADMIN_PASSWORD || '').trim();
        if (!this.members.has('admin_officer')) {
          const officerAccount = {
            id: 'admin_officer',
            memberId: 'admino',
            studentName: 'ARX Officer Administrator',
            class: 'Club Officer / Moderator',
            passwordHash: hashPassword(configuredAdminPassword),
            phoneNumber: 'N/A',
            telegramUsername: '@itclub_admin',
            role: 'admin',
            status: 'approved',
            isApproved: true,
            mustChangePassword: true,
            permissions: ['applications_review', 'members_view', 'attendance', 'assignments_grade', 'courses_view', 'certificates_issue'],
            createdAt: '2026-09-01T00:00:00.000Z',
            updatedAt: new Date().toISOString()
          };
          this.members.set(officerAccount.id, officerAccount);
          needsSave = true;
        }

        // Ensure legacy admin_root remains synced
        let legacyOfficer = this.members.get('admin_root');
        if (!legacyOfficer) {
          legacyOfficer = {
            id: 'admin_root',
            memberId: 'ARX-OFFICER-001',
            studentName: 'ARX Operations Officer',
            class: 'Club Officer / Moderator',
            passwordHash: hashPassword(configuredAdminPassword),
            phoneNumber: 'N/A',
            telegramUsername: '@itclub_admin',
            role: 'admin',
            status: 'approved',
            isApproved: true,
            permissions: ['applications_review', 'members_view', 'attendance', 'assignments_grade', 'courses_view'],
            createdAt: '2026-09-01T00:00:00.000Z',
            updatedAt: new Date().toISOString()
          };
          this.members.set(legacyOfficer.id, legacyOfficer);
          needsSave = true;
        }

        if (Array.isArray(data.auditLogs)) {
          this.auditLogs = data.auditLogs;
        }

        
        if (Array.isArray(data.awardFiles)) {
          for (const f of data.awardFiles) {
            if (f && f.id) this.memberAwardFiles.set(f.id, f);
          }
        }

        
        if (Array.isArray(data.enrollments)) {
          for (const en of data.enrollments) {
            if (en && en.id) this.enrollments.set(en.id, en);
          }
        }

        
        if (data.settings && typeof data.settings === 'object') {
          this.settings = { ...this.settings, ...data.settings };
        }

        
        if (Array.isArray(data.courses) && data.courses.length > 0) {
          this.courses.clear();
          for (const c of data.courses) {
            if (c && c.id) this.courses.set(c.id, c);
          }
        }

        
        if (Array.isArray(data.activationSessions)) {
          for (const s of data.activationSessions) {
            if (s && s.token) this.activationSessions.set(s.token, s);
          }
        }

        
        if (Array.isArray(data.telegramUserStates)) {
          for (const item of data.telegramUserStates) {
            if (item && item.userId && item.state) this.telegramUserStates.set(item.userId, item.state);
          }
        }

        
        if (Array.isArray(data.certificates)) {
          this.certificates.clear();
          for (const cert of data.certificates) {
            if (cert && cert.id) this.certificates.set(cert.id, cert);
          }
        }
        if (this.certificates.size === 0) {
          const demoCert = {
            id: 'cert_seed_cyber_01',
            certificateId: 'ARX-CYBER-2026-10492',
            memberId: 'usr_admin_001',
            studentName: 'Yohannes Nigatu',
            courseId: 'crs_cybersecurity',
            courseName: 'Cybersecurity & Ethical Hacking',
            courseTitle: 'Cybersecurity & Ethical Hacking',
            issueDate: 'October 12, 2026',
            status: 'VERIFIED',
            isActive: true,
            authorizedSignatures: [
              { title: 'Club President', name: 'NEXORA' },
              { title: 'Authorized Faculty Advisor', name: 'Academic Director' }
            ],
            qrData: 'https://arx-website-sjs.vercel.app/#certificates?id=ARX-CYBER-2026-10492',
            createdAt: new Date().toISOString()
          };
          this.certificates.set(demoCert.id, demoCert);
        }

        
        if (Array.isArray(data.awards)) {
          this.awards.clear();
          for (const a of data.awards) {
            if (a && a.id) this.awards.set(a.id, a);
          }
        }

        
        if (Array.isArray(data.projects)) {
          this.projects.clear();
          for (const p of data.projects) {
            if (p && p.id) this.projects.set(p.id, p);
          }
        }

        
        if (Array.isArray(data.events)) {
          this.events.clear();
          for (const e of data.events) {
            if (e && e.id) this.events.set(e.id, e);
          }
        }

        
        if (Array.isArray(data.achievements)) {
          this.achievements.clear();
          for (const ach of data.achievements) {
            if (ach && ach.id) this.achievements.set(ach.id, ach);
          }
        }

        
        if (Array.isArray(data.announcements)) {
          this.announcements.clear();
          for (const ann of data.announcements) {
            if (ann && ann.id) this.announcements.set(ann.id, ann);
          }
        }

        
        if (Array.isArray(data.governance) && data.governance.length > 0) {
          this.governance.clear();
          for (const g of data.governance) {
            if (g && g.id) this.governance.set(g.id, g);
          }
        }

        // Ensure Natan Yonas has primary leadership role and no board designation
        const nyGov = this.governance.get('gov_natan_yonas');
        if (nyGov) {
          nyGov.role = 'Chief Technology Officer (CTO)';
          nyGov.specialty = 'Robotics Instructor';
          nyGov.department = 'Robotics & Hardware';
          nyGov.category = 'leadership';
          nyGov.description = 'Chief Technology Officer & Lead Robotics Instructor. Directs technical architecture, robotics prototyping, and embedded systems engineering.';
          nyGov.order = 4;
          this.governance.set('gov_natan_yonas', nyGov);
        }
        // Remove any remaining board category entries
        for (const [gid, g] of this.governance.entries()) {
          if (g.category === 'board' || g.role === 'Board of Director') {
            if (gid === 'gov_natan_yonas') {
              g.category = 'leadership';
              g.role = 'Chief Technology Officer (CTO)';
            } else {
              this.governance.delete(gid);
            }
          }
        }
        if (this.settings) {
          this.settings.clubName = 'ARX IT CLUB';
        }

        
        if (Array.isArray(data.socialLinks) && data.socialLinks.length > 0) {
          this.socialLinks.clear();
          for (const s of data.socialLinks) {
            if (s && s.id) this.socialLinks.set(s.id, s);
          }
        }

        
        if (Array.isArray(data.botCommands) && data.botCommands.length > 0) {
          this.botCommands.clear();
          for (const b of data.botCommands) {
            if (b && b.command) this.botCommands.set(b.command.toLowerCase(), b);
          }
        }

        if (Array.isArray(data.studentProjectSubmissions)) {
          this.studentProjectSubmissions.clear();
          for (const sp of data.studentProjectSubmissions) {
            if (sp && sp.id) this.studentProjectSubmissions.set(sp.id, sp);
          }
        }

        if (Array.isArray(data.attendanceSessions) && data.attendanceSessions.length > 0) {
          this.attendanceSessions.clear();
          for (const s of data.attendanceSessions) {
            if (s && s.id) this.attendanceSessions.set(s.id, s);
          }
        }
        if (this.attendanceSessions.size === 0) {
          this.initAttendanceSessions();
        }

        if (Array.isArray(data.attendanceRecords)) {
          this.attendanceRecords.clear();
          for (const r of data.attendanceRecords) {
            if (r && r.id) this.attendanceRecords.set(r.id, r);
          }
        }

        this.isFileHydrated = true;
        this.lastFileSync = Date.now();
        if (needsSave) {
          await this._saveToFile();
        }
        console.log('[DB] State loaded successfully:', {
          members: this.members.size,
          awardFiles: this.memberAwardFiles.size,
          enrollments: this.enrollments.size,
          courses: this.courses.size,
          activationSessions: this.activationSessions.size,
          attendanceSessions: this.attendanceSessions.size,
          attendanceRecords: this.attendanceRecords.size
        });
      } catch (err) {
        console.error('[DB] State hydration error:', err?.message || err);
        if (process.env.NODE_ENV === 'production') {
          throw err; // Fatal in production
        }
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  
  async _saveToFile() {
    try {
      this.lastFileSync = Date.now();
      const snapshot = {
        exportedAt: new Date().toISOString(),
        description: 'ARX IT CLUB OF SJS Full Database Export',
        settings: { ...this.settings },
        members: Array.from(this.members.values()),
        courses: Array.from(this.courses.values()),
        enrollments: Array.from(this.enrollments.values()),
        awardFiles: Array.from(this.memberAwardFiles.values()),
        activationSessions: Array.from(this.activationSessions.values()),
        telegramUserStates: Array.from(this.telegramUserStates.entries()).map(([k, v]) => ({ userId: k, state: v })),
        certificates: Array.from(this.certificates?.values() || []),
        awards: Array.from(this.awards?.values() || []),
        projects: Array.from(this.projects?.values() || []),
        events: Array.from(this.events?.values() || []),
        achievements: Array.from(this.achievements?.values() || []),
        announcements: Array.from(this.announcements?.values() || []),
        activities: Array.from(this.activities?.values() || []),
        telegramBroadcasts: Array.from(this.telegramBroadcasts?.values() || []),
        studentProjectSubmissions: Array.from(this.studentProjectSubmissions?.values() || []),
        attendanceSessions: Array.from(this.attendanceSessions?.values() || []),
        attendanceSessionConfigs: Array.isArray(this.attendanceSessionConfigs) ? this.attendanceSessionConfigs : [],
        attendanceRecords: Array.from(this.attendanceRecords?.values() || []),
        assignments: Array.from(this.assignments?.values() || []),
        assignmentSubmissions: Array.from(this.assignmentSubmissions?.values() || []),
        clubResources: Array.from(this.clubResources?.values() || []),
        media: Array.from(this.media?.values() || []),
        socialLinks: Array.from(this.socialLinks?.values() || []),
        governance: Array.from(this.governance?.values() || []),
        botCommands: Array.from(this.botCommands?.values() || []),
        auditLogs: Array.isArray(this.auditLogs) ? this.auditLogs : []
      };

      // Await the write operation to ensure data is persisted
      const success = await writeDb(snapshot);
      if (!success) {
        console.error('[DB] ❌ Persistence failed - data may not be saved!');
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Critical: Database write failed in production');
        }
      }
      return success;
    } catch (err) {
      console.error('[DB] ❌ Save error:', err?.message || err);
      if (process.env.NODE_ENV === 'production') {
        throw err; // Fatal in production
      }
      return false;
    }
  }

  initMedia() {
    const initialMedia = [
      {
        id: 'med_brand_logo',
        filename: 'arx-logo.svg',
        url: '/assets/arx-logo.svg',
        thumbnailUrl: '/assets/arx-logo.svg',
        title: 'ARX IT CLUB OF SJS Official Primary Logo',
        altText: 'ARX IT CLUB OF SJS St. Joseph School official primary crest emblem',
        description: 'Primary high-resolution official logo used on platform branding, about page, and credentials.',
        category: 'Branding',
        tags: ['logo', 'primary', 'official', 'school-crest', 'branding'],
        width: 800,
        height: 800,
        fileSize: 44809,
        formattedSize: '44.8 KB',
        mimeType: 'image/png',
        createdAt: '2026-09-01T08:00:00.000Z',
        updatedAt: '2026-09-01T08:00:00.000Z'
      },
      {
        id: 'med_brand_compact',
        filename: 'arx-logo.svg',
        url: '/assets/arx-logo.svg',
        thumbnailUrl: '/assets/arx-logo.svg',
        title: 'ARX IT CLUB OF SJS Compact Logo Badge',
        altText: 'ARX IT CLUB OF SJS compact circular badge',
        description: 'Compact round mark for navigation bar, mobile drawer, favicons, and profile avatars.',
        category: 'Branding',
        tags: ['logo', 'compact', 'badge', 'navbar'],
        width: 600,
        height: 600,
        fileSize: 16843,
        formattedSize: '16.8 KB',
        mimeType: 'image/png',
        createdAt: '2026-09-01T08:00:00.000Z',
        updatedAt: '2026-09-01T08:00:00.000Z'
      },
      {
        id: 'med_brand_symbol',
        filename: 'arx-symbol-mark.png',
        url: '/uploads/arx-symbol-mark.png',
        thumbnailUrl: '/uploads/arx-symbol-mark.png',
        title: 'ARX Technical Symbol Mark',
        altText: 'ARX circuit board letter N and heraldic tech snowflake symbol mark',
        description: 'Isolated technical symbol mark representing circuit connectivity and technical builder identity.',
        category: 'Branding',
        tags: ['symbol', 'mark', 'circuit', 'snowflake'],
        width: 600,
        height: 600,
        fileSize: 13579,
        formattedSize: '13.6 KB',
        mimeType: 'image/png',
        createdAt: '2026-09-01T08:00:00.000Z',
        updatedAt: '2026-09-01T08:00:00.000Z'
      },
      {
        id: 'med_home_hero',
        filename: 'arx-hero-banner.svg',
        url: '/uploads/arx-hero-banner.svg',
        thumbnailUrl: '/uploads/arx-hero-banner.svg',
        title: 'ARX Lab & Code Hub Hero Banner',
        altText: 'Modern developer workstation and cloud architecture illustration',
        description: 'Main promotional banner displayed on homepage hero and welcome screen.',
        category: 'Branding',
        tags: ['home', 'hero', 'banner', 'workspace'],
        width: 1200,
        height: 600,
        fileSize: 4200,
        formattedSize: '4.2 KB',
        mimeType: 'image/svg+xml',
        createdAt: '2026-09-02T10:00:00.000Z',
        updatedAt: '2026-09-02T10:00:00.000Z'
      },
      {
        id: 'med_cert_seal',
        filename: 'academic-seal.svg',
        url: '/uploads/academic-seal.svg',
        thumbnailUrl: '/uploads/academic-seal.svg',
        title: 'Academic Director Verified Gold Seal',
        altText: 'Golden verified certification seal of excellence',
        description: 'Official verified seal stamped onto landscape graduation certificates.',
        category: 'Certificates',
        tags: ['certificate', 'seal', 'verified', 'academic'],
        width: 300,
        height: 300,
        fileSize: 1450,
        formattedSize: '1.4 KB',
        mimeType: 'image/svg+xml',
        createdAt: '2026-09-03T11:00:00.000Z',
        updatedAt: '2026-09-03T11:00:00.000Z'
      },
      {
        id: 'med_about_lab',
        filename: 'computer-lab-3.svg',
        url: '/uploads/computer-lab-3.svg',
        thumbnailUrl: '/uploads/computer-lab-3.svg',
        title: 'Computer Lab 3 Workstation Facility',
        altText: 'High-tech student computer lab with modern developer workstations',
        description: 'Facility showcase photo of Computer Lab 3 (Highschool) technology wing.',
        category: 'About',
        tags: ['about', 'lab', 'campus', 'facilities'],
        width: 800,
        height: 500,
        fileSize: 2200,
        formattedSize: '2.2 KB',
        mimeType: 'image/svg+xml',
        createdAt: '2026-09-04T09:00:00.000Z',
        updatedAt: '2026-09-04T09:00:00.000Z'
      },
      {
        id: 'med_about_team',
        filename: 'student-leadership.svg',
        url: '/uploads/student-leadership.svg',
        thumbnailUrl: '/uploads/student-leadership.svg',
        title: 'Student Executive Council Team',
        altText: 'ARX IT CLUB OF SJS leadership team collaborating on curriculum',
        description: 'Student executive leadership committee portrait for About page.',
        category: 'About',
        tags: ['about', 'team', 'leadership', 'council'],
        width: 800,
        height: 500,
        fileSize: 2600,
        formattedSize: '2.6 KB',
        mimeType: 'image/svg+xml',
        createdAt: '2026-09-04T09:30:00.000Z',
        updatedAt: '2026-09-04T09:30:00.000Z'
      },
      {
        id: 'med_course_web_dev',
        filename: 'course-web-dev.svg',
        url: '/uploads/course-web-dev.svg',
        thumbnailUrl: '/uploads/course-web-dev.svg',
        title: 'Web Design & Development Track (Material Icon)',
        altText: 'Web Design & Development Material Icon devices artwork',
        description: 'Course thumbnail and banner for Web Design & Development curriculum track.',
        category: 'Courses',
        tags: ['course', 'web', 'design', 'development', 'material-icon'],
        width: 800,
        height: 480,
        fileSize: 2200,
        formattedSize: '2.2 KB',
        mimeType: 'image/svg+xml',
        createdAt: '2026-09-05T12:00:00.000Z',
        updatedAt: '2026-09-05T12:00:00.000Z'
      },
      {
        id: 'med_course_python',
        filename: 'course-python.svg',
        url: '/uploads/course-python.svg',
        thumbnailUrl: '/uploads/course-python.svg',
        title: 'Python Programming Track (Material Icon)',
        altText: 'Python programming terminal Material Icon artwork',
        description: 'Course thumbnail and header for Python programming track.',
        category: 'Courses',
        tags: ['course', 'python', 'terminal', 'material-icon'],
        width: 800,
        height: 480,
        fileSize: 2100,
        formattedSize: '2.1 KB',
        mimeType: 'image/svg+xml',
        createdAt: '2026-09-05T12:30:00.000Z',
        updatedAt: '2026-09-05T12:30:00.000Z'
      },
      {
        id: 'med_course_cyber',
        filename: 'course-cybersecurity.svg',
        url: '/uploads/course-cybersecurity.svg',
        thumbnailUrl: '/uploads/course-cybersecurity.svg',
        title: 'Cybersecurity Defense Track (Material Icon)',
        altText: 'Cybersecurity security shield Material Icon artwork',
        description: 'Course thumbnail and header for Cybersecurity track.',
        category: 'Courses',
        tags: ['course', 'cybersecurity', 'security', 'shield', 'material-icon'],
        width: 800,
        height: 480,
        fileSize: 2000,
        formattedSize: '2.0 KB',
        mimeType: 'image/svg+xml',
        createdAt: '2026-09-05T12:45:00.000Z',
        updatedAt: '2026-09-05T12:45:00.000Z'
      },
      {
        id: 'med_course_robotics',
        filename: 'course-robotics.svg',
        url: '/uploads/course-robotics.svg',
        thumbnailUrl: '/uploads/course-robotics.svg',
        title: 'Robotics Engineering Track (Material Icon)',
        altText: 'Robotics smart_toy Material Icon artwork',
        description: 'Course thumbnail for Robotics Engineering track.',
        category: 'Courses',
        tags: ['course', 'robotics', 'smart_toy', 'hardware', 'material-icon'],
        width: 800,
        height: 480,
        fileSize: 2300,
        formattedSize: '2.3 KB',
        mimeType: 'image/svg+xml',
        createdAt: '2026-09-05T13:15:00.000Z',
        updatedAt: '2026-09-05T13:15:00.000Z'
      },
      {
        id: 'med_project_portal',
        filename: 'project-portal.svg',
        url: '/uploads/project-portal.svg',
        thumbnailUrl: '/uploads/project-portal.svg',
        title: 'ARX Student Portal Web App',
        altText: 'Screenshot mockup of ARX student membership portal',
        description: 'Student portal dashboard portfolio project screenshot.',
        category: 'Projects',
        tags: ['project', 'portal', 'react', 'dashboard'],
        width: 800,
        height: 500,
        fileSize: 2300,
        formattedSize: '2.3 KB',
        mimeType: 'image/svg+xml',
        createdAt: '2026-09-06T14:00:00.000Z',
        updatedAt: '2026-09-06T14:00:00.000Z'
      },
      {
        id: 'med_project_bot',
        filename: 'project-bot.svg',
        url: '/uploads/project-bot.svg',
        thumbnailUrl: '/uploads/project-bot.svg',
        title: 'Lab 3 Telegram Notification Bot',
        altText: 'Telegram automated assistant bot interface for IT club members',
        description: 'Automated club assistant bot interface screenshot.',
        category: 'Projects',
        tags: ['project', 'telegram', 'bot', 'automation'],
        width: 800,
        height: 500,
        fileSize: 1950,
        formattedSize: '1.9 KB',
        mimeType: 'image/svg+xml',
        createdAt: '2026-09-06T14:30:00.000Z',
        updatedAt: '2026-09-06T14:30:00.000Z'
      },
      {
        id: 'med_event_hackathon',
        filename: 'event-hackathon.svg',
        url: '/uploads/event-hackathon.svg',
        thumbnailUrl: '/uploads/event-hackathon.svg',
        title: 'Annual ARX Hackathon 2026 Poster',
        altText: 'Annual 24-hour student code hackathon banner',
        description: 'Promotional event banner for the annual school hackathon.',
        category: 'Events',
        tags: ['event', 'hackathon', 'competition', 'banner'],
        width: 800,
        height: 500,
        fileSize: 2500,
        formattedSize: '2.5 KB',
        mimeType: 'image/svg+xml',
        createdAt: '2026-09-07T15:00:00.000Z',
        updatedAt: '2026-09-07T15:00:00.000Z'
      },
      {
        id: 'med_event_fullstack',
        filename: 'event-workshop.svg',
        url: '/uploads/event-workshop.svg',
        thumbnailUrl: '/uploads/event-workshop.svg',
        title: 'Modern Full-Stack React & Node Workshop',
        altText: 'Technical workshop poster on fullstack web engineering',
        description: 'Event cover graphic for Saturday technical workshop.',
        category: 'Events',
        tags: ['event', 'workshop', 'webdev', 'fullstack'],
        width: 800,
        height: 500,
        fileSize: 2200,
        formattedSize: '2.2 KB',
        mimeType: 'image/svg+xml',
        createdAt: '2026-09-07T15:30:00.000Z',
        updatedAt: '2026-09-07T15:30:00.000Z'
      },
      {
        id: 'med_achieve_gold',
        filename: 'achievement-gold.svg',
        url: '/uploads/achievement-gold.svg',
        thumbnailUrl: '/uploads/achievement-gold.svg',
        title: 'National Interschool Hackathon Gold Trophy',
        altText: 'Golden hackathon trophy for 1st place software innovation',
        description: '1st place championship trophy won by student team at Regional Tech Summit.',
        category: 'Achievements',
        tags: ['achievement', 'trophy', 'hackathon', 'gold'],
        width: 400,
        height: 400,
        fileSize: 1800,
        formattedSize: '1.8 KB',
        mimeType: 'image/svg+xml',
        createdAt: '2026-09-08T16:00:00.000Z',
        updatedAt: '2026-09-08T16:00:00.000Z'
      },
      {
        id: 'med_achieve_robotics',
        filename: 'achievement-robotics.svg',
        url: '/uploads/achievement-robotics.svg',
        thumbnailUrl: '/uploads/achievement-robotics.svg',
        title: 'Regional Robotics Autonomous League Cup',
        altText: 'Silver robotics championship cup for autonomous maze solver',
        description: 'Championship cup awarded for fastest maze-solving robot.',
        category: 'Achievements',
        tags: ['achievement', 'robotics', 'cup', 'autonomous'],
        width: 400,
        height: 400,
        fileSize: 1850,
        formattedSize: '1.8 KB',
        mimeType: 'image/svg+xml',
        createdAt: '2026-09-08T16:30:00.000Z',
        updatedAt: '2026-09-08T16:30:00.000Z'
      }];

    for (const m of initialMedia) {
      this.media.set(m.id, m);
    }
  }

  initCourses() {
    const coursesData = [
      {
        id: 'crs_web_dev',
        title: 'Web Design & Development',
        slug: 'web-design-development',
        description: 'Learn modern web design and development, from semantic HTML5 and responsive CSS to interactive modern JavaScript and complete web application deployment.',
        difficulty: 'Beginner',
        duration: '6 Weeks',
        instructor: 'Nathan Wondwossen ',
        status: 'Available',
        isAvailableForRegistration: true,
        category: 'Web Development',
        topics: [
          'UI/UX Design Principles & Prototyping',
          'Semantic HTML5 Architecture & Web Accessibility',
          'Modern CSS: Flexbox, Grid Systems & Responsive UI',
          'JavaScript Programming: ES6+, DOM & Event Engines',
          'Asynchronous APIs, Fetch & Dynamic Web Applications',
          'Version Control (Git/GitHub) & Cloud Production Hosting'],

        learningObjectives: [
          'Design intuitive, responsive user interfaces across mobile and desktop devices',
          'Write accessible, standards-compliant HTML5 and modern CSS layouts',
          'Develop interactive web applications utilizing modern JavaScript',
          'Deploy and manage live student web applications using Git workflows'],

        requirements: [
          'Basic computer literacy and a code editor (VS Code recommended)',
          'Passion for web design and building modern software'],

        certificateInfo: 'Verified ARX Landscape Certificate awarded upon publication and review of a capstone web application.',
        thumbnailUrl: '/uploads/course-web-dev.svg',
        bannerUrl: '/uploads/course-web-dev.svg',
        thumbnailMediaId: 'med_course_web_dev',
        bannerMediaId: 'med_course_web_dev',
        isPublished: true
      },
      {
        id: 'crs_python',
        title: 'Python',
        slug: 'python',
        description: 'Learn Python programming from fundamentals to real-world applications, covering data structures, object-oriented concepts, automation scripting, and algorithmic problem-solving.',
        difficulty: 'Beginner',
        duration: '6 Weeks',
        instructor: 'Nafyad Bayissa',
        status: 'Available',
        isAvailableForRegistration: true,
        category: 'Programming',
        topics: [
          'Python Setup & Interactive Shell Essentials',
          'Variables, Numeric Types & String Manipulation',
          'Decision Making & Control Flow Loops (for, while, range)',
          'Core Data Structures: Lists, Dictionaries, Sets & Tuples',
          'Functions, Modular Libraries & Object-Oriented Principles',
          'File Handling, Automation Scripts & Algorithmic Projects'],

        learningObjectives: [
          'Write clean, idiomatic Python code adhering to PEP 8 standards',
          'Select and leverage appropriate data structures for problem solving',
          'Automate repetitive computational tasks with custom scripts',
          'Build and demonstrate a functional Python capstone project'],

        requirements: [
          'No prior programming experience required',
          'Python 3 installed on your workstation (or use Computer Lab 3)'],

        certificateInfo: 'Verified ARX Landscape Certificate awarded upon submission of a functional Python project.',
        thumbnailUrl: '/uploads/course-python.svg',
        bannerUrl: '/uploads/course-python.svg',
        thumbnailMediaId: 'med_course_python',
        bannerMediaId: 'med_course_python',
        isPublished: true
      },
      {
        id: 'crs_cybersecurity',
        title: 'Cybersecurity',
        slug: 'cybersecurity',
        description: 'Master practical cybersecurity fundamentals, covering network defense, cryptography, threat modeling, ethical security principles, and system hardening.',
        difficulty: 'Intermediate',
        duration: '5 Weeks',
        instructor: 'Kidus Elias',
        status: 'Available',
        isAvailableForRegistration: true,
        category: 'Cybersecurity',
        topics: [
          'Security Principles & The CIA Triad',
          'Computer Networking Basics (IP, TCP/UDP, DNS, Firewalls)',
          'Common Threats, Malware & Social Engineering Defense',
          'Authentication, Password Security & Multi-Factor Auth',
          'Data Encryption Fundamentals (Symmetric vs Asymmetric)',
          'Ethical Security Rules & Practical System Hardening'],

        learningObjectives: [
          'Identify common cyber threats and apply mitigation techniques',
          'Analyze fundamental networking protocols and network defenses',
          'Understand cryptography basics and secure authentication protocols',
          'Adopt safe digital hygiene and ethical security research practices'],

        requirements: [
          'Basic familiarity with operating systems and networking concepts',
          'Ethical commitment to protective security standards'],

        certificateInfo: 'Verified ARX Landscape Certificate awarded upon completion of the security defense simulation.',
        thumbnailUrl: '/uploads/course-cybersecurity.svg',
        bannerUrl: '/uploads/course-cybersecurity.svg',
        thumbnailMediaId: 'med_course_cyber',
        bannerMediaId: 'med_course_cyber',
        isPublished: true
      },
      {
        id: 'crs_robotics',
        title: 'Robotics',
        slug: 'robotics',
        description: 'Learn the fundamentals of robotics, including electronics, sensors, microcontroller programming, automation, motor control, and hands-on robotics projects.',
        difficulty: 'Intermediate',
        duration: '6 Weeks',
        instructor: 'Natan yonas',
        status: 'Available',
        isAvailableForRegistration: true,
        category: 'Robotics',
        topics: [
          'Robotics Fundamentals & Microcontroller Overview',
          'Basic Electronics, Circuits, Breadboarding & Components',
          'Sensors & Perception (Ultrasonic, IR, Gyro, Temperature)',
          'Motors, Actuators & Motor Driver Circuits',
          'Embedded Programming & Closed-Loop Control Logic',
          'Hands-on Capstone Robot Build & Autonomous Navigation'],

        learningObjectives: [
          'Understand electronic circuit schematics and breadboard prototyping',
          'Program microcontrollers to read sensor inputs and actuate motors',
          'Implement autonomous algorithms for obstacle avoidance and line following',
          'Assemble and test a physical working robot in the lab'],

        requirements: [
          'Curiosity for hardware and hands-on laboratory tinkering',
          'Hardware kits available in Computer Lab 3 during club hours'],

        certificateInfo: 'Verified ARX Landscape Certificate awarded upon successful robot demonstration.',
        thumbnailUrl: '/uploads/course-robotics.svg',
        bannerUrl: '/uploads/course-robotics.svg',
        thumbnailMediaId: 'med_course_robotics',
        bannerMediaId: 'med_course_robotics',
        isPublished: true
      },
      {
        id: 'crs_ai&machinelearning',
        title: 'AI & Machine Learning',
        slug: 'ai&machinelearning',
        description: 'Learn the fundamentals of AI & Machine Learning, covering supervised and unsupervised learning, neural networks, deep learning, and practical applications of AI.',
        difficulty: 'Intermediate',
        duration: '5 Weeks',
        instructor: 'Yohannes Nigatu And Nathan Haddis',
        status: 'Available',
        isAvailableForRegistration: true,
        category: 'AI & Machine Learning',
        topics: [
          'Security Principles & The CIA Triad',
          'Computer Networking Basics (IP, TCP/UDP, DNS, Firewalls)',
          'Common Threats, Malware & Social Engineering Defense',
          'Authentication, Password Security & Multi-Factor Auth',
          'Data Encryption Fundamentals (Symmetric vs Asymmetric)',
          'Ethical Security Rules & Practical System Hardening'],

        learningObjectives: [
          'Identify common cyber threats and apply mitigation techniques',
          'Analyze fundamental networking protocols and network defenses',
          'Understand cryptography basics and secure authentication protocols',
          'Adopt safe digital hygiene and ethical security research practices'],

        requirements: [
          'Basic familiarity with operating systems and networking concepts',
          'Ethical commitment to protective security standards'],

        certificateInfo: 'Verified ARX Landscape Certificate awarded upon completion of the security defense simulation.',
        thumbnailUrl: '/uploads/course-cybersecurity.svg',
        bannerUrl: '/uploads/course-cybersecurity.svg',
        thumbnailMediaId: 'med_course_cyber',
        bannerMediaId: 'med_course_cyber',
        isPublished: true
      },

    ];

    const now = new Date().toISOString();
    for (const c of coursesData) {
      this.courses.set(c.id, {
        ...c,
        createdAt: now,
        updatedAt: now
      });
    }
  }

  initCertificates() {
    if (this.certificates.size > 0) return;
    const demoCert = {
      id: 'cert_seed_cyber_01',
      certificateId: 'ARX-CYBER-2026-10492',
      memberId: 'usr_admin_001',
      studentName: 'Yohannes Nigatu',
      courseId: 'crs_cybersecurity',
      courseName: 'Cybersecurity & Ethical Hacking',
      courseTitle: 'Cybersecurity & Ethical Hacking',
      issueDate: 'October 12, 2026',
      status: 'VERIFIED',
      isActive: true,
      authorizedSignatures: [
        { title: 'Club President', name: 'NEXORA' },
        { title: 'Authorized Faculty Advisor', name: 'Academic Director' }
      ],
      qrData: 'https://arx-website-sjs.vercel.app/#certificates?id=ARX-CYBER-2026-10492',
      createdAt: new Date().toISOString()
    };
    this.certificates.set(demoCert.id, demoCert);
  }

  initProjects() {

    
    
  } initSocialLinks() {
    const defaultLinks = [
      {
        platform: 'Telegram',
        name: 'Official Telegram Channel',
        url: CONFIG.TELEGRAM_CHANNEL_LINK || 'https://t.me/arxitclub',
        icon: 'send',
        isEnabled: true,
        order: 1
      },
      {
        platform: 'Instagram',
        name: 'ARX IT CLUB OF SJS Instagram',
        url: 'https://instagram.com/arx_itclub',
        icon: 'instagram',
        isEnabled: true,
        order: 2
      },
      {
        platform: 'LinkedIn',
        name: 'ARX IT CLUB OF SJS LinkedIn',
        url: 'https://linkedin.com/company/arx-itclub',
        icon: 'linkedin',
        isEnabled: false,
        order: 3
      },
      {
        platform: 'X',
        name: 'ARX IT CLUB OF SJS X (Twitter)',
        url: 'https://x.com/arx_itclub',
        icon: 'twitter',
        isEnabled: false,
        order: 4
      },
      {
        platform: 'Facebook',
        name: 'ARX IT CLUB OF SJS Facebook',
        url: 'https://facebook.com/arxitclub',
        icon: 'facebook',
        isEnabled: false,
        order: 5
      },
      {
        platform: 'TikTok',
        name: 'ARX IT CLUB OF SJS TikTok',
        url: 'https://tiktok.com/@arx_itclub',
        icon: 'video',
        isEnabled: false,
        order: 6
      }];

    for (const link of defaultLinks) {
      this.createSocialLink(link);
    }
  }

  initGovernance() {
    const defaultGovernance = [
      {
        id: 'gov_kidus_elias',
        name: 'Kidus Elias',
        role: 'President',
        specialty: 'Cyber Security Instructor',
        department: 'Cyber Security',
        category: 'leadership',
        description: 'Co-Founder & President of ARX IT CLUB OF SJS. Mentors students on cybersecurity defense, ethical hacking, and network systems.',
        photoUrl: '/team/kidus.jpg',
        positionOffset: 'center center',
        socialLinks: {},
        order: 1,
        isUniqueRole: true,
        isPublished: true
      },
      {
        id: 'gov_yohannes_nigatu',
        name: 'Yohannes Nigatu',
        role: 'Vice President',
        specialty: 'AI & Machine Learning Instructor',
        department: 'AI & Machine Learning',
        category: 'leadership',
        description: 'Co-Founder & Vice President. Directs AI research, neural network architectures, and student machine learning initiatives.',
        photoUrl: '/team/jo.jpg?v=2',
        positionOffset: 'center center',
        socialLinks: {},
        order: 2,
        isUniqueRole: true,
        isPublished: true
      },
      {
        id: 'gov_nathan_haddis',
        name: 'Nathan Haddis',
        role: 'Chief Marketing Officer',
        specialty: 'AI & Machine Learning Instructor',
        department: 'AI & Machine Learning',
        category: 'leadership',
        description: 'Chief Marketing Officer & Lead AI Instructor. Leads club outreach, branding campaigns, creative media, and AI curricula.',
        photoUrl: '/team/nathan-haddis.jpg',
        positionOffset: 'center center',
        socialLinks: {},
        order: 3,
        isUniqueRole: true,
        isPublished: true
      },
      {
        id: 'gov_natan_yonas',
        name: 'Natan Yonas',
        role: 'Chief Technology Officer (CTO)',
        specialty: 'Robotics Instructor',
        department: 'Robotics & Hardware',
        category: 'leadership',
        description: 'Chief Technology Officer & Lead Robotics Instructor. Directs technical architecture, robotics prototyping, and embedded micro-controller projects.',
        photoUrl: '/team/me.jpg?v=2',
        positionOffset: 'center center',
        socialLinks: {},
        order: 4,
        isUniqueRole: true,
        isPublished: true
      },
      {
        id: 'gov_nathan_wendesen',
        name: 'Nathan Wendesen',
        role: 'Front-End Development Instructor',
        specialty: 'Web Development Instructor',
        department: 'Web Development',
        category: 'instructor',
        description: 'Mentors students on modern UI/UX design, interactive frontend applications, responsive architectures, and web standards.',
        photoUrl: '/team/nathan.jpg',
        positionOffset: 'center center',
        socialLinks: {},
        order: 5,
        isUniqueRole: false,
        isPublished: true
      },
      {
        id: 'gov_abenezer_ameha',
        name: 'Abenezer Ameha',
        role: 'Software Engineering Instructor',
        specialty: 'Software Engineering Instructor',
        department: 'Software Engineering',
        category: 'instructor',
        description: 'Mentors and instructs club members on software engineering foundations, algorithmic problem solving, and modern development workflows.',
        photoUrl: '/team/ab.jpg?v=2',
        positionOffset: 'center center',
        socialLinks: {},
        order: 6,
        isUniqueRole: false,
        isPublished: true
      },
      {
        id: 'gov_nafyad_bayissa',
        name: 'Nafyad Bayissa',
        role: 'Python Instructor',
        specialty: 'Python Instructor',
        department: 'Python Programming',
        category: 'instructor',
        description: 'Teaches foundational and advanced Python syntax, object-oriented concepts, scripting automation, and computational thinking.',
        photoUrl: '/team/nafyad.jpg',
        positionOffset: 'center center',
        socialLinks: {},
        order: 7,
        isUniqueRole: false,
        isPublished: true
      },
      {
        id: 'gov_firaol_tadesse',
        name: 'Firaol Tadesse',
        role: 'Python Instructor',
        specialty: 'Python Instructor',
        department: 'Python Programming',
        category: 'instructor',
        description: 'Teaches Python programming foundations, problem solving, and hands-on laboratory exercises for student developers.',
        photoUrl: '/team/firaol.png',
        positionOffset: 'center center',
        socialLinks: {},
        order: 8,
        isUniqueRole: false,
        isPublished: true
      }
    ];

    for (const g of defaultGovernance) {
      this.createGovernanceRole(g);
    }
  }

  initEvents() {
    const eventsData = [];

    for (const ev of eventsData) {
      this.createEvent(ev);
    }
  }

  initAchievements() {
    const achievementsData = [];

    for (const ach of achievementsData) {
      this.createAchievement(ach);
    }
  }

  initTelegramBroadcasts() {
    const channelHandle = this.settings.telegramChannelName || CONFIG.TELEGRAM_CHANNEL_HANDLE || '@arxitclub';
    const broadcasts = [
      {
        id: 'tb_1',
        postId: 101,
        author: 'ARX IT CLUB OF SJS Admin',
        channelName: 'ARX IT CLUB OF SJS Official',
        channelHandle,
        date: 'Today',
        time: '09:00 AM',
        content: `📌 Welcome to the official ARX IT CLUB OF SJS communication feed!\n\nAll members can now view live broadcasts, lab opening hours, and curriculum notices directly from this integrated dashboard. No external app search required.\n\n📍 Computer Lab 3 (Highschool)\n🕒 Lab Sessions: Mon & Thu 3:30 PM - 5:30 PM`,
        tags: ['#announcements', '#lab', '#welcome'],
        pinned: true,
        views: 184,
        reactions: [
          { emoji: '🔥', count: 24 },
          { emoji: '🚀', count: 18 },
          { emoji: '❤️', count: 12 }]

      },
      {
        id: 'tb_2',
        postId: 102,
        author: 'Technical Lead',
        channelName: 'ARX IT CLUB OF SJS Official',
        channelHandle,
        date: 'Yesterday',
        time: '03:15 PM',
        content: `⚡ Technical Workshop: Modern Full-Stack Workflows with React & Node.js.\n\nWe will review REST API architecture, secure auth patterns, and repository workflows. Check the Club Resources tab below for prerequisite starter files and cheat sheets!\n\nBring your laptop or use Lab 3 workstations.`,
        tags: ['#workshops', '#webdev', '#curriculum'],
        views: 142,
        reactions: [
          { emoji: '💡', count: 19 },
          { emoji: '🚀', count: 15 },
          { emoji: '👍', count: 11 }]

      },
      {
        id: 'tb_3',
        postId: 103,
        author: 'ARX Executive Council',
        channelName: 'ARX IT CLUB OF SJS Official',
        channelHandle,
        date: '2 days ago',
        time: '11:45 AM',
        content: `🛡️ Verified Landscape Certificates are live!\n\nAll completed courses now issue tamper-proof certificates in landscape format featuring official signatures, academic seals, and public verification QR codes. Access yours anytime under My Certificates.`,
        tags: ['#certificates', '#academics'],
        views: 210,
        reactions: [
          { emoji: '🔥', count: 32 },
          { emoji: '🎉', count: 28 },
          { emoji: '❤️', count: 16 }]

      }];

    for (const b of broadcasts) {
      this.telegramBroadcasts.set(b.id, b);
    }
  }

  initClubResources() {
    const resources = [
      {
        id: 'res_1',
        title: 'ARX Full-Stack Web Development Handbook',
        category: 'Handbook',
        description: 'Complete student reference guide covering semantic HTML5, modern Tailwind CSS, React 19 hooks, and Express backend patterns.',
        format: 'PDF / Markdown',
        fileSize: '4.2 MB',
        version: 'v2.4 (2026)',
        tags: ['Web Dev', 'TypeScript', 'React']
      },
      {
        id: 'res_2',
        title: 'Python DSA & Problem Solving Starter Kit',
        category: 'Starter Kit',
        description: 'Hands-on repository scaffold containing data structures, automated unit tests, and algorithmic exercises for club coding rounds.',
        format: 'ZIP Archive',
        fileSize: '1.8 MB',
        version: 'v1.6',
        tags: ['Python', 'Algorithms', 'Tests']
      },
      {
        id: 'res_3',
        title: 'Git & GitHub Team Collaboration Cheatsheet',
        category: 'Cheatsheet',
        description: 'Essential terminal commands, pull request guidelines, conflict resolution techniques, and conventional commit standards.',
        format: 'PDF Quickref',
        fileSize: '820 KB',
        version: 'v3.0',
        tags: ['Git', 'GitHub', 'Workflow']
      },
      {
        id: 'res_4',
        title: 'Computer Lab 3 SSH & Dev Environment Setup',
        category: 'Lab Access',
        description: 'Step-by-step instructions for connecting to the school IT lab server, local port forwarding, and VS Code remote extension.',
        format: 'Technical Doc',
        fileSize: '1.1 MB',
        version: 'v2026.1',
        tags: ['Linux', 'SSH', 'Lab']
      }];

    for (const r of resources) {
      this.clubResources.set(r.id, r);
    }
  }

  initAssignments() {
    const defaultAssignments = [
      {
        id: 'asg_py_01',
        title: 'Python CLI Calculator & Unit Tests',
        description: 'Build a modular command-line calculator in Python supporting basic arithmetic, exponentiation, and error handling for division by zero. Include at least 3 unit tests.',
        courseId: 'course_python',
        courseTitle: 'Python Programming Masterclass',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxScore: 100,
        instructions: 'Submit a single .py file or a .zip archive containing your calculator.py and test_calculator.py files. Follow PEP 8 style standards.',
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'asg_web_01',
        title: 'Responsive Portfolio Page (HTML/CSS)',
        description: 'Design and code a semantic, accessible single-page portfolio using HTML5 and CSS3 with responsive viewport breakpoints (mobile & desktop).',
        courseId: 'course_web_dev',
        courseTitle: 'Full-Stack Web Engineering',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        maxScore: 100,
        instructions: 'Submit your index.html and style.css or a compressed .zip archive. Ensure valid markup without inline style attributes.',
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'asg_cyber_01',
        title: 'Network Reconnaissance & Port Scanning Lab Report',
        description: 'Document the methodology and findings from the Computer Lab 3 ethical port reconnaissance exercise on the isolated test subnet.',
        courseId: 'course_cybersecurity',
        courseTitle: 'Cybersecurity Fundamentals',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        maxScore: 100,
        instructions: 'Submit a PDF report detailing open ports, service banners, and defensive hardening recommendations.',
        isPublished: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }];

    for (const asg of defaultAssignments) {
      this.assignments.set(asg.id, asg);
    }
  }

  initBotCommands() {
    const commands = [
      {
        command: '/start',
        description: 'Welcome experience, member dashboard & quick navigation',
        isEnabled: true,
        showInMenu: true
      },
      {
        command: '/help',
        description: 'Complete command directory, guides & instructions',
        isEnabled: true,
        showInMenu: true
      },
      {
        command: '/menu',
        description: 'Interactive quick-access menu buttons',
        isEnabled: true,
        showInMenu: true
      },
      {
        command: '/dashboard',
        description: 'Student learning dashboard, active tracks & credentials',
        isEnabled: true,
        showInMenu: true
      },
      {
        command: '/account',
        description: 'View student member ID, credentials, class, and statistics',
        isEnabled: true,
        showInMenu: true
      },
      {
        command: '/profile',
        description: 'View student profile and membership details',
        isEnabled: true,
        showInMenu: false
      },
      {
        command: '/courses',
        description: 'Explore curriculum tracks and your enrollment progress',
        isEnabled: true,
        showInMenu: true
      },
      {
        command: '/certificates',
        description: 'View verified landscape certificates and credential IDs',
        isEnabled: true,
        showInMenu: true
      },
      {
        command: '/announcements',
        description: 'Read official club announcements and channel notices',
        isEnabled: true,
        showInMenu: true
      },
      {
        command: '/events',
        description: 'View upcoming workshops and tech talks in Computer Lab 3',
        isEnabled: true,
        showInMenu: true
      },
      {
        command: '/workshops',
        description: 'Upcoming hands-on lab workshops and hardware clinics',
        isEnabled: true,
        showInMenu: false
      },
      {
        command: '/attendance',
        description: 'Check session attendance rate and certificate qualification',
        isEnabled: true,
        showInMenu: true
      },
      {
        command: '/assignments',
        description: 'View active course assignments, homework tasks & deadlines',
        isEnabled: true,
        showInMenu: true
      },
      {
        command: '/resources',
        description: 'Access developer handbooks, starter kits, and cheatsheets',
        isEnabled: true,
        showInMenu: false
      },
      {
        command: '/lab',
        description: 'Computer Lab 3 hours, guidelines, and workstation policies',
        isEnabled: true,
        showInMenu: false
      },
      {
        command: '/support',
        description: 'Help desk, coordinator contact details, and lab office hours',
        isEnabled: true,
        showInMenu: true
      },
      {
        command: '/tickets',
        description: 'Support tickets, equipment help & advisor assistance',
        isEnabled: true,
        showInMenu: false
      },
      {
        command: '/settings',
        description: 'Membership settings, linked Telegram profile & preferences',
        isEnabled: true,
        showInMenu: true
      },
      {
        command: '/website',
        description: 'Official ARX IT CLUB OF SJS website & web portal links',
        isEnabled: true,
        showInMenu: false
      },
      {
        command: '/channel',
        description: 'Official Telegram announcement channel (@arxitclub)',
        isEnabled: true,
        showInMenu: false
      },
      {
        command: '/status',
        description: 'Quick member verification & credentials lookup',
        isEnabled: true,
        showInMenu: true
      },
      {
        command: '/cancel',
        description: 'Cancel any ongoing activation or input interaction',
        isEnabled: true,
        showInMenu: false
      }];

    for (const c of commands) {
      this.botCommands.set(c.command.toLowerCase(), c);
    }

    this.botContent = {
      welcomeMessageNew: `👋 Welcome to ARX IT CLUB OF SJS!\n\nTo link your student membership and receive verified credentials, please register through our official website first.\n\nUpon completing registration, you will receive your official Member ID and a personalized activation link to connect this Telegram account.`,
      welcomeMessageMember: `👋 Welcome back! Your ARX IT CLUB OF SJS membership is active and verified. Use the menu below to access your member services.`,
      helpMessage: `🤖 ARX IT CLUB OF SJS Official Bot Guide\n\nOfficial communication & member services layer for ARX IT CLUB OF SJS.\n\nAvailable Commands:\n• /start — Welcome screen & onboarding\n• /menu — Interactive quick buttons\n• /dashboard — Learning dashboard & credentials\n• /account — Membership credentials & enrollments\n• /courses — Curriculum tracks & learning progress\n• /assignments — Active course assignments & deadlines\n• /certificates — Verifiable certificates & credential IDs\n• /attendance — Attendance rate & certificate qualification\n• /announcements — Official club news & channel broadcasts\n• /events — Hands-on workshops in Computer Lab 3\n• /lab — Lab location, opening hours & rules\n• /support — Help desk & advisor contacts\n• /settings — Account settings & profile links\n• /website — Official website link\n• /channel — Official Telegram channel (@arxitclub)\n• /cancel — Cancel ongoing action\n• /verify <ID> — Verify any certificate or member ID`,
      activationInstructions: `To activate your account, please reply with your assigned Member ID (e.g. ARX-2026-XXXX). Once confirmed, you will receive a temporary activation code to enter on the website.`,
      supportMessage: `📞 ARX IT CLUB OF SJS Support & Academic Assistance\n• Email: contact@arx-website-sjs.vercel.app\n• Location: Computer Lab 3, Highschool\n• Schedule: Monday to Tuesday: 3:30 PM – 5:30 PM`
    };
  }

  initAttendanceSessions() {
    if (this.attendanceSessions.size > 0) return;
    const addis = getAddisAbabaNow();
    const todayStr = addis.dateStr;

    const defaultSessions = [
      {
        id: 'att_sess_web_dev',
        courseId: 'crs_web_dev',
        courseTitle: 'Web Design & Development',
        title: 'Lab 3: Modern Component Architecture & Responsive UI',
        date: todayStr,
        ethiopianOpenTime: '07:00',
        ethiopianPresentCutoff: '07:30',
        ethiopianLateCutoff: '07:40',
        internationalOpenTime: '13:00',
        internationalPresentCutoff: '13:30',
        internationalLateCutoff: '13:40',
        instructions: 'Computer Lab 3 attendance check-in. Sign in with your Member ID and account password between 7:00 and 7:40 Ethiopian time.',
        status: 'published',
        createdBy: 'Club Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'att_sess_python',
        courseId: 'crs_python',
        courseTitle: 'Python Programming',
        title: 'Lab 4: Data Structures & Problem Solving in Python',
        date: todayStr,
        ethiopianOpenTime: '07:00',
        ethiopianPresentCutoff: '07:30',
        ethiopianLateCutoff: '07:40',
        internationalOpenTime: '13:00',
        internationalPresentCutoff: '13:30',
        internationalLateCutoff: '13:40',
        instructions: 'Sign in with your Member ID and password between 7:00 and 7:40 Ethiopian time.',
        status: 'published',
        createdBy: 'Club Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'att_sess_general',
        courseId: 'general',
        courseTitle: 'General Lab Session',
        title: 'Computer Lab 3 General Assembly & Project Clinic',
        date: todayStr,
        ethiopianOpenTime: '07:00',
        ethiopianPresentCutoff: '07:30',
        ethiopianLateCutoff: '07:40',
        internationalOpenTime: '13:00',
        internationalPresentCutoff: '13:30',
        internationalLateCutoff: '13:40',
        instructions: 'Open to all active ARX IT Club members.',
        status: 'published',
        createdBy: 'Club President',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const sess of defaultSessions) {
      this.attendanceSessions.set(sess.id, sess);
    }
  }

  initAdmin() {
    const presPass = (process.env.PRESIDENT_PASSWORD || CONFIG.PRESIDENT_PASSWORD || '').trim();
    const presPasswordHash = hashPassword(presPass);

    const adminp = {
      id: 'admin_presidential',
      memberId: 'adminp',
      studentName: 'ARX Presidential Administrator',
      class: 'Club Executive / President',
      passwordHash: presPasswordHash,
      phoneNumber: 'N/A',
      telegramUsername: '@arx_president',
      role: 'president',
      status: 'approved',
      isApproved: true,
      mustChangePassword: true,
      permissions: ['all', 'manage_admins', 'delete_members', 'system_backup', 'governance', 'settings', 'certificates', 'applications', 'courses'],
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    };
    this.members.set(adminp.id, adminp);

    const president = {
      id: 'president_root',
      memberId: 'NEXORA',
      studentName: 'ARX Club President',
      class: 'Club Executive / President',
      passwordHash: presPasswordHash,
      phoneNumber: 'N/A',
      telegramUsername: '@arx_president',
      role: 'president',
      status: 'approved',
      isApproved: true,
      permissions: ['all', 'manage_admins', 'delete_members', 'system_backup', 'governance', 'settings', 'certificates', 'applications', 'courses'],
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    };
    this.members.set(president.id, president);

    const adminPass = (process.env.ADMIN_PASSWORD || CONFIG.ADMIN_PASSWORD || '').trim();
    const adminPasswordHash = hashPassword(adminPass);

    const admino = {
      id: 'admin_officer',
      memberId: 'admino',
      studentName: 'ARX Officer Administrator',
      class: 'Club Officer / Moderator',
      passwordHash: adminPasswordHash,
      phoneNumber: 'N/A',
      telegramUsername: '@itclub_admin',
      role: 'admin',
      status: 'approved',
      isApproved: true,
      mustChangePassword: true,
      permissions: ['applications_review', 'members_view', 'attendance', 'assignments_grade', 'courses_view', 'certificates_issue'],
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    };
    this.members.set(admino.id, admino);

    const admin = {
      id: 'admin_root',
      memberId: 'ARX-OFFICER-001',
      studentName: 'ARX Operations Officer',
      class: 'Club Officer / Moderator',
      passwordHash: adminPasswordHash,
      phoneNumber: 'N/A',
      telegramUsername: '@itclub_admin',
      role: 'admin',
      status: 'approved',
      isApproved: true,
      permissions: ['applications_review', 'members_view', 'attendance', 'assignments_grade', 'courses_view'],
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    };
    this.members.set(admin.id, admin);
  }

  getAllAdmins() {
    const admins = [];
    for (const m of this.members.values()) {
      if (m && (m.role === 'admin' || m.role === 'president')) {
        admins.push({
          id: m.id,
          memberId: m.memberId,
          studentName: m.studentName,
          class: m.class,
          role: m.role,
          status: m.status || 'approved',
          permissions: m.permissions || (m.role === 'president' ? ['all'] : ['applications_review', 'members_view', 'attendance', 'assignments_grade']),
          telegramUsername: m.telegramUsername || '',
          createdAt: m.createdAt,
          updatedAt: m.updatedAt
        });
      }
    }
    return admins;
  }

  createAdminAccount({ memberId, studentName, password, role = 'admin', permissions, officerTitle = 'Club Officer' }) {
    const cleanId = (memberId || '').trim().toUpperCase();
    if (!cleanId) throw new Error('Admin username / ID is required.');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters long.');

    for (const m of this.members.values()) {
      if (m.memberId && m.memberId.toUpperCase() === cleanId) {
        throw new Error(`Account with ID "${cleanId}" already exists.`);
      }
    }

    const newId = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAdmin = {
      id: newId,
      memberId: cleanId,
      studentName: (studentName || 'Operations Officer').trim(),
      class: officerTitle || 'Club Officer',
      passwordHash: hashPassword(password),
      phoneNumber: 'N/A',
      telegramUsername: '',
      role: role === 'president' ? 'president' : 'admin',
      status: 'approved',
      isApproved: true,
      permissions: Array.isArray(permissions) && permissions.length > 0
        ? permissions
        : ['applications_review', 'members_view', 'attendance', 'assignments_grade'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.members.set(newId, newAdmin);
    this.logAuditEvent({
      actor: 'President',
      action: 'CREATE_ADMIN',
      details: `Created new administrative account "${newAdmin.studentName}" (${cleanId}) with role "${newAdmin.role}"`
    });
    this._saveToFile();
    return {
      id: newAdmin.id,
      memberId: newAdmin.memberId,
      studentName: newAdmin.studentName,
      class: newAdmin.class,
      role: newAdmin.role,
      permissions: newAdmin.permissions
    };
  }

  updateAdminPassword(adminId, newPassword) {
    const admin = this.members.get(adminId);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'president')) {
      throw new Error('Administrative account not found.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }
    admin.passwordHash = hashPassword(newPassword);
    admin.updatedAt = new Date().toISOString();
    this.logAuditEvent({
      actor: 'President',
      action: 'UPDATE_ADMIN_PASSWORD',
      details: `Updated security credentials for administrator "${admin.studentName}" (${admin.memberId})`
    });
    this._saveToFile();
    return true;
  }

  deleteAdminAccount(adminId) {
    if (adminId === 'president_root' || adminId === 'admin_presidential') {
      throw new Error('The Presidential administrator account cannot be deleted.');
    }
    const admin = this.members.get(adminId);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'president')) {
      throw new Error('Administrative account not found.');
    }
    if (admin.role === 'president') {
      throw new Error('Presidential accounts cannot be removed directly.');
    }
    this.members.delete(adminId);
    this.logAuditEvent({
      actor: 'President',
      action: 'DELETE_ADMIN',
      details: `Removed lower administrator account "${admin.studentName}" (${admin.memberId})`
    });
    this._saveToFile();
    return true;
  }

  logAuditEvent({ actor, action, details, ip = 'internal' }) {
    if (!Array.isArray(this.auditLogs)) this.auditLogs = [];
    const event = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actor: actor || 'System',
      action: action || 'ACTION',
      details: details || '',
      ip
    };
    this.auditLogs.unshift(event);
    if (this.auditLogs.length > 200) {
      this.auditLogs = this.auditLogs.slice(0, 200);
    }
    return event;
  }

  getAuditLogs() {
    return Array.isArray(this.auditLogs) ? this.auditLogs : [];
  }

  getDatabaseExport() {
    return {
      exportedAt: new Date().toISOString(),
      clubName: this.settings?.clubName || 'ARX IT CLUB OF SJS',
      version: '2.0.0-executive',
      totalMembers: this.members.size,
      totalCourses: this.courses.size,
      totalCertificates: this.certificates.size,
      settings: { ...this.settings },
      admins: this.getAllAdmins(),
      members: Array.from(this.members.values()).map(m => {
        const copy = { ...m };
        delete copy.passwordHash;
        return copy;
      }),
      courses: Array.from(this.courses.values()),
      enrollments: Array.from(this.enrollments.values()),
      certificates: Array.from(this.certificates.values()),
      awards: Array.from(this.awards.values()),
      projects: Array.from(this.projects.values()),
      events: Array.from(this.events.values()),
      achievements: Array.from(this.achievements.values()),
      announcements: Array.from(this.announcements.values()),
      governance: Array.from(this.governance.values()),
      auditLogs: this.getAuditLogs()
    };
  }

  
  getSettings() {
    return { ...this.settings };
  }

  updateSettings(updates, adminUser = null) {
    const payload = { ...updates };
    if (payload.telegramBotUsername) {
      const cleanBot = payload.telegramBotUsername.
        replace(/^https?:\/\/t\.me\//i, '').
        replace(/^@/, '').
        split('/')[0].
        split('?')[0].
        trim();
      payload.telegramBotUsername = cleanBot;
      if (!payload.telegramBotUrl || payload.telegramBotUrl.includes('arx_') || payload.telegramBotUrl.includes('itclub_official')) {
        payload.telegramBotUrl = `https://t.me/${cleanBot}`;
      }
    }
    if (payload.telegramChannelName) {
      const cleanChan = payload.telegramChannelName.
        replace(/^https?:\/\/t\.me\//i, '').
        replace(/^@/, '').
        split('/')[0].
        split('?')[0].
        trim();
      if (cleanChan) {
        payload.telegramChannelName = `@${cleanChan}`;
        if (!payload.telegramChannelUrl) {
          payload.telegramChannelUrl = `https://t.me/${cleanChan}`;
        }
      }
    }

    const changedKeys = Object.keys(payload);
    this.settings = {
      ...this.settings,
      ...payload,
      updatedAt: new Date().toISOString()
    };

    if (adminUser) {
      this.logAuditEvent({
        actor: adminUser.studentName || adminUser.memberId || 'Administrator',
        action: 'UPDATE_WEBSITE_SETTINGS',
        details: `Updated website settings: ${changedKeys.join(', ')}`
      });
    }

    this._saveToFile();
    return { ...this.settings };
  }

  
  getAllExistingMemberIds() {
    const set = new Set();
    for (const m of this.members.values()) {
      if (m && m.memberId) {
        set.add(m.memberId.toUpperCase());
      }
    }
    return set;
  }

  findMemberByMemberId(memberId) {
    if (!memberId || typeof memberId !== 'string') return undefined;
    const cleanId = memberId.trim().toUpperCase();
    const alphanumeric = cleanId.replace(/[^A-Z0-9]/g, '');
    for (const m of this.members.values()) {
      if (!m.memberId) continue;
      const mUpper = m.memberId.toUpperCase();
      if (mUpper === cleanId) {
        return m;
      }
      if (alphanumeric.length >= 6 && mUpper.replace(/[^A-Z0-9]/g, '') === alphanumeric) {
        return m;
      }
    }
    return undefined;
  }

  findMemberById(id) {
    return this.members.get(id);
  }

  findMemberByPhone(normalizedPhone) {
    const cleanPhone = normalizedPhone.replace(/[\s\-\(\)\.]/g, '');
    for (const m of this.members.values()) {
      if (m.role !== 'member') continue;
      const mPhone = (m.phoneNumber || '').replace(/[\s\-\(\)\.]/g, '');
      if (mPhone && mPhone === cleanPhone) {
        return m;
      }
    }
    return undefined;
  }

  findMemberByEmail(email) {
    const cleanEmail = email.trim().toLowerCase();
    for (const m of this.members.values()) {
      if (m.email && m.email.trim().toLowerCase() === cleanEmail) {
        return m;
      }
    }
    return undefined;
  }

  findDuplicateRegistration(params) {
    const fn = (params.firstName || '').trim().toLowerCase();
    const sn = (params.secondName || '').trim().toLowerCase();
    const ln = (params.lastName || '').trim().toLowerCase();
    const cls = (params.class || '').trim().toLowerCase();
    const cleanPhone = (params.phoneNumber || '').replace(/[\s\-\(\)\.]/g, '');
    const cleanTg = (params.telegramUsername || '').replace(/^@/, '').trim().toLowerCase();

    for (const m of this.members.values()) {
      if (m.role !== 'member') continue;

      let mFn = (m.firstName || '').trim().toLowerCase();
      let mSn = (m.secondName || '').trim().toLowerCase();
      let mLn = (m.lastName || '').trim().toLowerCase();

      if (!mFn && !mLn && m.studentName) {
        const parts = m.studentName.trim().split(/\s+/);
        mFn = (parts[0] || '').toLowerCase();
        if (parts.length > 2) {
          mSn = parts.slice(1, -1).join(' ').toLowerCase();
          mLn = (parts[parts.length - 1] || '').toLowerCase();
        } else if (parts.length === 2) {
          mLn = (parts[1] || '').toLowerCase();
        }
      }

      const mCls = (m.class || '').trim().toLowerCase();
      const mPhone = (m.phoneNumber || '').replace(/[\s\-\(\)\.]/g, '');
      const mTg = (m.telegramUsername || '').replace(/^@/, '').trim().toLowerCase();

      const nameMatches = mFn === fn && mSn === sn && mLn === ln;
      const classMatches = mCls === cls;
      const phoneMatches = mPhone.length > 0 && mPhone === cleanPhone;
      const tgMatches = mTg.length > 0 && mTg === cleanTg;

      if (nameMatches && classMatches && phoneMatches && tgMatches) {
        return m;
      }
    }
    return undefined;
  }

  async createMember(params) {
    const existingIds = this.getAllExistingMemberIds();
    const newMemberId = generateMemberId(existingIds);
    const now = new Date().toISOString();

    const firstName = params.firstName ? params.firstName.trim() : '';
    const secondName = params.secondName ? params.secondName.trim() : '';
    const lastName = params.lastName ? params.lastName.trim() : '';

    let studentName = params.studentName?.trim() || '';
    if (firstName && lastName) {
      studentName = [firstName, secondName, lastName].filter(Boolean).join(' ');
    } else if (!studentName) {
      studentName = [firstName, secondName, lastName].filter(Boolean).join(' ') || 'Student Member';
    }

    const newMember = {
      id: `mem_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      memberId: newMemberId,
      studentName,
      firstName: firstName || undefined,
      secondName: secondName || undefined,
      lastName: lastName || undefined,
      class: params.class.trim(),
      passwordHash: hashPassword(params.password),
      phoneNumber: params.phoneNumber.trim(),
      email: params.email ? params.email.trim().toLowerCase() : undefined,
      telegramUsername: params.telegramUsername.trim().startsWith('@') ?
        params.telegramUsername.trim() :
        `@${params.telegramUsername.trim()}`,
      award: params.award ? params.award.trim() : undefined,
      motivationEssay: params.motivationEssay ? params.motivationEssay.trim() : (params.essay ? params.essay.trim() : undefined),
      essay: params.motivationEssay ? params.motivationEssay.trim() : (params.essay ? params.essay.trim() : undefined),

      aiEssayScore: params.aiEssayScore ?? 0,
      aiEssaySuspected: params.aiEssaySuspected ?? false,
      aiEssayFlags: params.aiEssayFlags ?? [],
      aiEssayMethod: params.aiEssayMethod ?? 'skipped',
      aiEssayAnalyzedAt: params.aiEssayAnalyzedAt ?? undefined,
      role: 'member',
      status: 'pending',
      isApproved: false,
      isActivated: false,
      telegramActivated: false,
      rejectionReason: undefined,
      courseIds: Array.isArray(params.courseIds) ? params.courseIds : (params.courseId ? [params.courseId] : []),
      courseId: params.courseId || (Array.isArray(params.courseIds) ? params.courseIds[0] : undefined),
      createdAt: now,
      updatedAt: now,
      auditTrail: [
        {
          action: 'registered',
          actorId: newMemberId,
          actorName: studentName,
          timestamp: now,
          notes: 'Online registration application submitted'
        }
      ]
    };

    this.members.set(newMember.id, newMember);
    await this._saveToFile();


    const activity = {
      id: `act_${Date.now()}`,
      memberId: newMember.id,
      title: 'Submitted Membership Application (Pending Review)',
      date: now,
      timeAgo: 'Just now',
      type: 'course'
    };
    this.activities.set(activity.id, activity);

    return newMember;
  }

  updateMemberProfile(
    id,
    updates) {
    const member = this.members.get(id) || this.findMemberById(id) || this.findMemberByMemberId(id);
    if (!member) return null;

    if (updates.studentName) {
      member.studentName = updates.studentName.trim();
      const parts = member.studentName.split(/\s+/);
      member.firstName = parts[0] || member.firstName;
      if (parts.length > 2) {
        member.secondName = parts.slice(1, -1).join(' ');
        member.lastName = parts[parts.length - 1];
      } else if (parts.length === 2) {
        member.lastName = parts[1];
      }
    }
    if (updates.class) member.class = updates.class.trim();
    if (updates.phoneNumber) member.phoneNumber = updates.phoneNumber.trim();
    if (updates.email !== undefined) member.email = updates.email ? updates.email.trim() : undefined;
    if (updates.telegramUsername) {
      const u = updates.telegramUsername.trim();
      member.telegramUsername = u.startsWith('@') ? u : `@${u}`;
    }
    if (updates.award !== undefined) member.award = updates.award.trim();
    if (updates.status && ['active', 'suspended', 'pending', 'approved', 'rejected'].includes(updates.status)) {
      member.status = updates.status;
    }
    member.updatedAt = new Date().toISOString();
    this._saveToFile();

    return member;
  }

  updateMemberPassword(id, newPassword) {
    const member = this.members.get(id);
    if (!member) return false;
    member.passwordHash = hashPassword(newPassword);
    member.mustChangePassword = false;
    member.updatedAt = new Date().toISOString();
    this._saveToFile();
    return true;
  }

  
  getAdminMembers() {
    return Array.from(this.members.values());
  }

  toggleMemberStatus(id) {
    const m = this.members.get(id);
    if (!m) return null;
    if (m.role === 'admin') return m; 
    m.status = (m.status === 'suspended') ? (m.isApproved ? 'approved' : 'pending') : 'suspended';
    m.updatedAt = new Date().toISOString();
    this._saveToFile();
    return m;
  }

  
  getApplications(status = 'pending') {
    return Array.from(this.members.values()).filter((m) => {
      if (m.role !== 'member') return false;
      if (!status || status === 'all') return true;
      return m.status === status;
    });
  }

  approveApplication(id, adminInfo = null) {
    const cleanId = typeof id === 'string' ? id.trim() : '';
    const member = this.members.get(cleanId) || this.findMemberByMemberId(cleanId);
    if (!member) return null;

    const adminId = adminInfo?.id || adminInfo?.memberId || 'admin';
    const adminName = adminInfo?.studentName || adminInfo?.fullName || 'Administrator';
    const nowIso = new Date().toISOString();

    member.status = 'approved';
    member.isApproved = true;
    member.rejectionReason = undefined;
    member.approvedAt = nowIso;
    member.reviewedAt = nowIso;
    member.approvedBy = { adminId, adminName };
    member.reviewedBy = { adminId, adminName };
    member.updatedAt = nowIso;

    member.auditTrail = Array.isArray(member.auditTrail) ? member.auditTrail : [];
    member.auditTrail.push({
      action: 'approved',
      actorId: adminId,
      actorName: adminName,
      timestamp: nowIso,
      notes: `Application approved by ${adminName}`
    });

    // Auto-enroll member in selected course tracks if not already enrolled
    const targetCourseIds = Array.isArray(member.courseIds) && member.courseIds.length > 0
      ? member.courseIds
      : (member.courseId ? [member.courseId] : []);
    for (const cid of targetCourseIds) {
      try {
        this.enrollMemberInCourse(member.id, cid);
      } catch { /* ignore individual enrollment failure */ }
    }

    this._saveToFile();

    const activity = {
      id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      memberId: member.id,
      title: `Membership Application Approved by ${adminName}`,
      date: nowIso,
      timeAgo: 'Just now',
      type: 'course'
    };
    this.activities.set(activity.id, activity);

    return member;
  }

  rejectApplication(id, rejectionReason, adminInfo = null) {
    const cleanId = typeof id === 'string' ? id.trim() : '';
    const member = this.members.get(cleanId) || this.findMemberByMemberId(cleanId);
    if (!member) return null;

    const adminId = adminInfo?.id || adminInfo?.memberId || 'admin';
    const adminName = adminInfo?.studentName || adminInfo?.fullName || 'Administrator';
    const cleanReason = rejectionReason ? rejectionReason.trim() : 'Application declined by administrator.';
    const nowIso = new Date().toISOString();

    member.status = 'rejected';
    member.isApproved = false;
    member.rejectionReason = cleanReason;
    member.rejectedAt = nowIso;
    member.reviewedAt = nowIso;
    member.rejectedBy = { adminId, adminName };
    member.reviewedBy = { adminId, adminName };
    member.updatedAt = nowIso;

    member.auditTrail = Array.isArray(member.auditTrail) ? member.auditTrail : [];
    member.auditTrail.push({
      action: 'rejected',
      actorId: adminId,
      actorName: adminName,
      timestamp: nowIso,
      reason: cleanReason,
      notes: cleanReason
    });

    // Remove course enrollments for rejected member so they don't appear in enrollment table
    for (const [enrollmentId, enrollment] of this.enrollments.entries()) {
      if (enrollment.memberId === member.id || enrollment.memberId === member.memberId) {
        this.enrollments.delete(enrollmentId);
      }
    }

    this._saveToFile();

    const activity = {
      id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      memberId: member.id,
      title: `Membership Application Declined by ${adminName}`,
      date: nowIso,
      timeAgo: 'Just now',
      type: 'course'
    };
    this.activities.set(activity.id, activity);

    return member;
  }

  deleteMember(id) {
    if (!id) return false;
    const m = this.members.get(id) || this.findMemberById(id) || this.findMemberByMemberId(id);
    if (!m || m.role === 'admin' || m.role === 'president' || m.id === 'admin_root' || m.id === 'president_root') return false;

    const targetId = m.id;
    const targetMemberId = m.memberId;

    // 1. Delete member record
    this.members.delete(targetId);

    // 2. Cascade delete enrollments
    for (const [enrId, enr] of this.enrollments.entries()) {
      if (enr.memberId === targetId || enr.memberId === targetMemberId) {
        this.enrollments.delete(enrId);
      }
    }

    // 3. Cascade delete member award files
    for (const [fileId, file] of this.memberAwardFiles.entries()) {
      if (file.memberId === targetId || file.memberId === targetMemberId) {
        if (file.storagePath && fs.existsSync(file.storagePath)) {
          try { fs.unlinkSync(file.storagePath); } catch { /* ignore */ }
        }
        this.memberAwardFiles.delete(fileId);
      }
    }

    // 4. Cascade delete certificates
    for (const [certId, cert] of this.certificates.entries()) {
      if (cert.memberId === targetId || cert.recipientMemberId === targetMemberId || cert.memberId === targetMemberId) {
        this.certificates.delete(certId);
      }
    }

    // 5. Cascade delete awards
    for (const [awardId, award] of this.awards.entries()) {
      if (award.memberId === targetId || award.memberId === targetMemberId) {
        this.awards.delete(awardId);
      }
    }

    // 6. Cascade delete attendance records
    for (const [attId, att] of this.attendanceRecords.entries()) {
      if (att.memberId === targetId || att.memberId === targetMemberId) {
        this.attendanceRecords.delete(attId);
      }
    }

    // 7. Cascade delete assignment submissions
    for (const [subId, sub] of this.assignmentSubmissions.entries()) {
      if (sub.memberId === targetId || sub.memberId === targetMemberId) {
        this.assignmentSubmissions.delete(subId);
      }
    }

    // 8. Cascade delete student project submissions
    for (const [projSubId, projSub] of this.studentProjectSubmissions.entries()) {
      if (projSub.memberId === targetId || projSub.memberId === targetMemberId) {
        if (projSub.storagePath && fs.existsSync(projSub.storagePath)) {
          try { fs.unlinkSync(projSub.storagePath); } catch { /* ignore */ }
        }
        this.studentProjectSubmissions.delete(projSubId);
      }
    }

    // 9. Cascade delete activation sessions
    for (const [token, ses] of this.activationSessions.entries()) {
      if (ses.userId === targetId || ses.memberId === targetMemberId) {
        this.activationSessions.delete(token);
      }
    }

    // 10. Cascade delete password reset sessions
    for (const [token, ses] of this.passwordResetSessions.entries()) {
      if (ses.memberId === targetId || ses.memberId === targetMemberId) {
        this.passwordResetSessions.delete(token);
      }
    }

    // 11. Cascade delete activities
    for (const [actId, act] of this.activities.entries()) {
      if (act.memberId === targetId || act.memberId === targetMemberId) {
        this.activities.delete(actId);
      }
    }

    // 12. Cascade delete telegram state
    if (this.telegramUserStates.has(targetId)) {
      this.telegramUserStates.delete(targetId);
    }
    if (m.telegramUserId && this.telegramUserStates.has(m.telegramUserId)) {
      this.telegramUserStates.delete(m.telegramUserId);
    }

    // 13. Persist updated database immediately
    this._saveToFile();
    return true;
  }

  
  getCourses(publicOnly = true) {
    const list = Array.from(this.courses.values());
    if (publicOnly) {
      return list.filter((c) => c.isPublished);
    }
    return list;
  }

  getRegistrationCourses() {
    return Array.from(this.courses.values()).filter(
      (c) => c.isPublished !== false && c.status === 'Available' && c.isAvailableForRegistration !== false
    );
  }

  getCourseById(id) {
    if (id === 'crs_html_css' || id === 'crs_javascript') {
      return this.courses.get('crs_web_dev') || this.courses.get(id);
    }
    return this.courses.get(id) || Array.from(this.courses.values()).find((c) => c.slug === id);
  }

  createCourse(data) {
    const now = new Date().toISOString();
    const id = `crs_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const course = {
      ...data,
      id,
      slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      createdAt: now,
      updatedAt: now
    };
    this.courses.set(course.id, course);
    this._saveToFile();
    return course;
  }

  updateCourse(id, updates) {
    const course = this.courses.get(id);
    if (!course) return null;
    Object.assign(course, updates, { updatedAt: new Date().toISOString() });
    this._saveToFile();
    return course;
  }

  deleteCourse(id) {
    const deleted = this.courses.delete(id);
    if (deleted) {
      this._saveToFile();
    }
    return deleted;
  }

  getMemberEnrollments(memberId) {
    if (!memberId) return [];
    const m = this.members.get(memberId) || this.findMemberById(memberId) || this.findMemberByMemberId(memberId);
    const id1 = m ? m.id : memberId;
    const id2 = m ? m.memberId : memberId;
    const directEnrollments = Array.from(this.enrollments.values()).filter((e) => e.memberId === id1 || e.memberId === id2);
    if (directEnrollments.length > 0) return directEnrollments;

    // Fallback: if student has courseIds or selectedCourseId recorded on member record
    const fallbackIds = Array.isArray(m?.courseIds) && m.courseIds.length > 0
      ? m.courseIds
      : [m?.courseId, m?.selectedCourseId].filter(Boolean);

    if (fallbackIds.length > 0) {
      return fallbackIds.map(cid => {
        const c = this.getCourseById(cid);
        return {
          id: `enr_${m.id}_${cid}`,
          memberId: m.id,
          studentName: m.studentName,
          courseId: cid,
          courseTitle: c?.title || cid,
          progress: 0,
          status: 'In Progress',
          enrolledAt: m.createdAt || new Date().toISOString()
        };
      });
    }

    return [];
  }

  updateEnrollmentStatus(
    enrollmentId,
    status,
    progress) {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) return undefined;
    enrollment.status = status;
    if (progress !== undefined) {
      enrollment.progress = Math.min(100, Math.max(0, progress));
    }
    if (status === 'Completed' && !enrollment.completedAt) {
      enrollment.completedAt = new Date().toISOString();
    }
    this.enrollments.set(enrollmentId, enrollment);
    return enrollment;
  }

  
  // ─── ATTENDANCE HELPERS & ELIGIBILITY ────────────────────────────────────
  isMemberEnrolledInCourse(memberId, courseId) {
    if (!courseId || courseId === 'general' || courseId === 'all') return true;
    const enrollments = this.getMemberEnrollments(memberId);
    return enrollments.some(e => e.courseId === courseId);
  }

  getEnrolledMembersForCourse(courseId) {
    const activeMembers = Array.from(this.members.values()).filter(
      m => m.role === 'member' && (m.status === 'approved' || m.status === 'active')
    );
    if (!courseId || courseId === 'general' || courseId === 'all') {
      return activeMembers;
    }
    return activeMembers.filter(m => this.isMemberEnrolledInCourse(m.id, courseId));
  }

  // ─── ATTENDANCE SESSIONS (COURSE-LINKED) ──────────────────────────────────
  getAllAttendanceSessions() {
    return Array.from(this.attendanceSessions.values()).sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }

  getAttendanceSessionById(sessionId) {
    if (!sessionId) return null;
    return this.attendanceSessions.get(sessionId) || null;
  }

  createAttendanceSession(data, createdBy = 'Club Admin') {
    const addis = getAddisAbabaNow();
    const id = `att_sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const course = data.courseId && data.courseId !== 'general' && data.courseId !== 'all'
      ? this.getCourseById(data.courseId)
      : null;

    const ethOpen = (data.ethiopianOpenTime || '07:00').trim();
    const ethPres = (data.ethiopianPresentCutoff || '07:30').trim();
    const ethLate = (data.ethiopianLateCutoff || '07:40').trim();

    const intlOpen = data.internationalOpenTime || ethiopianToInternationalTime(ethOpen, 'afternoon');
    const intlPres = data.internationalPresentCutoff || ethiopianToInternationalTime(ethPres, 'afternoon');
    const intlLate = data.internationalLateCutoff || ethiopianToInternationalTime(ethLate, 'afternoon');

    const session = {
      id,
      courseId: data.courseId || 'general',
      courseTitle: course ? course.title : (data.courseTitle || (data.courseId === 'general' ? 'General Lab Session' : 'All Courses')),
      title: data.title ? data.title.trim() : `Lab Session - ${data.date || addis.dateStr}`,
      date: data.date ? data.date.trim() : addis.dateStr,
      ethiopianOpenTime: ethOpen,
      ethiopianPresentCutoff: ethPres,
      ethiopianLateCutoff: ethLate,
      internationalOpenTime: intlOpen,
      internationalPresentCutoff: intlPres,
      internationalLateCutoff: intlLate,
      instructions: data.instructions ? data.instructions.trim() : 'Computer Lab 3 attendance verification.',
      status: data.status || 'published',
      createdBy: typeof createdBy === 'string' ? createdBy : (createdBy?.studentName || 'Club Admin'),
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.attendanceSessions.set(session.id, session);
    this.logAuditEvent({
      actor: session.createdBy,
      action: 'CREATE_ATTENDANCE_SESSION',
      details: `Created attendance session "${session.title}" for ${session.courseTitle} on ${session.date}`
    });
    this._saveToFile();
    return session;
  }

  updateAttendanceSession(id, data) {
    const session = this.attendanceSessions.get(id);
    if (!session) return null;

    if (data.title) session.title = data.title.trim();
    if (data.date) session.date = data.date.trim();
    if (data.courseId) {
      session.courseId = data.courseId;
      const course = this.getCourseById(data.courseId);
      session.courseTitle = course ? course.title : (data.courseTitle || session.courseTitle);
    }
    if (data.ethiopianOpenTime) {
      session.ethiopianOpenTime = data.ethiopianOpenTime.trim();
      session.internationalOpenTime = ethiopianToInternationalTime(session.ethiopianOpenTime, 'afternoon');
    }
    if (data.ethiopianPresentCutoff) {
      session.ethiopianPresentCutoff = data.ethiopianPresentCutoff.trim();
      session.internationalPresentCutoff = ethiopianToInternationalTime(session.ethiopianPresentCutoff, 'afternoon');
    }
    if (data.ethiopianLateCutoff) {
      session.ethiopianLateCutoff = data.ethiopianLateCutoff.trim();
      session.internationalLateCutoff = ethiopianToInternationalTime(session.ethiopianLateCutoff, 'afternoon');
    }
    if (data.instructions !== undefined) session.instructions = data.instructions.trim();
    if (data.status) session.status = data.status;

    session.updatedAt = new Date().toISOString();
    this._saveToFile();
    return session;
  }

  deleteAttendanceSession(id) {
    const session = this.attendanceSessions.get(id);
    if (!session) return false;
    this.attendanceSessions.delete(id);
    for (const [recId, rec] of this.attendanceRecords.entries()) {
      if (rec.sessionId === id) {
        this.attendanceRecords.delete(recId);
      }
    }
    this._saveToFile();
    return true;
  }

  getAvailableAttendanceSessions(memberIdOrUser, referenceTime = new Date()) {
    let member = null;
    if (typeof memberIdOrUser === 'string') {
      member = this.findMemberById(memberIdOrUser) || this.findMemberByMemberId(memberIdOrUser);
    } else if (memberIdOrUser && memberIdOrUser.id) {
      member = this.members.get(memberIdOrUser.id) || memberIdOrUser;
    }

    const allSessions = this.getAllAttendanceSessions();
    const results = [];

    for (const session of allSessions) {
      if (session.status !== 'published' && session.status !== 'finalized' && session.status !== 'closed') {
        continue;
      }

      const isEligible = !member || this.isMemberEnrolledInCourse(member.id, session.courseId);
      const windowStatus = evaluateSessionWindow(session, referenceTime);

      let memberRecord = null;
      if (member) {
        for (const r of this.attendanceRecords.values()) {
          if ((r.memberId === member.memberId || r.userId === member.id) && r.sessionId === session.id) {
            memberRecord = r;
            break;
          }
        }
      }

      results.push({
        ...session,
        isEligible,
        window: windowStatus,
        alreadySubmitted: !!memberRecord,
        memberRecord
      });
    }

    return results;
  }

  submitAttendanceSession({ sessionId, memberId, password, userContext, overrideTime }) {
    const member = this.findMemberByMemberId(memberId) || this.findMemberById(memberId);
    if (!member) {
      return { success: false, message: 'Member ID not found. Please verify your student ID.' };
    }

    if (member.status === 'suspended') {
      return { success: false, message: 'Your membership is suspended. Attendance check-in is restricted.' };
    }
    if (member.status === 'rejected') {
      return { success: false, message: 'Your membership application was not approved.' };
    }

    if (!verifyPassword(password, member.passwordHash)) {
      return { success: false, message: 'Invalid password. Proper member authentication is required.' };
    }

    // Identity binding: if userContext exists, prevent impersonating other students
    if (userContext && userContext.memberId) {
      const authId = String(userContext.memberId).trim().toUpperCase();
      const targetId = String(member.memberId).trim().toUpperCase();
      if (authId !== targetId && userContext.role !== 'admin' && userContext.role !== 'president') {
        return { success: false, message: 'You cannot submit attendance on behalf of another member.' };
      }
    }

    // Find the session
    let session = null;
    if (sessionId) {
      session = this.getAttendanceSessionById(sessionId);
    } else {
      const available = this.getAvailableAttendanceSessions(member.id);
      session = available.find(s => s.window.isOpen) || available[0];
    }

    if (!session) {
      return { success: false, message: 'Attendance session not found or not currently scheduled.' };
    }

    // Course enrollment verification
    if (session.courseId && session.courseId !== 'general' && session.courseId !== 'all') {
      const isEnrolled = this.isMemberEnrolledInCourse(member.id, session.courseId);
      if (!isEnrolled) {
        return {
          success: false,
          message: `You are not enrolled in "${session.courseTitle || session.courseId}". Attendance is restricted to enrolled students.`
        };
      }
    }

    // Duplicate check
    for (const record of this.attendanceRecords.values()) {
      if (
        (record.memberId === member.memberId || record.userId === member.id) &&
        record.sessionId === session.id
      ) {
        return {
          success: false,
          isDuplicate: true,
          message: `You have already submitted attendance for "${session.title}". Initial status: ${record.initialClassification}, Review status: ${record.reviewStatus}.`,
          record
        };
      }
    }

    // Strict boundary enforcement via Addis Ababa server time
    let checkDate = new Date();
    if (overrideTime instanceof Date) {
      checkDate = overrideTime;
    } else if (typeof overrideTime === 'string' || typeof overrideTime === 'number') {
      const d = new Date(overrideTime);
      if (!isNaN(d.getTime())) checkDate = d;
    } else if (overrideTime && typeof overrideTime === 'object' && overrideTime.time) {
      const d = new Date(overrideTime.time);
      if (!isNaN(d.getTime())) checkDate = d;
    }
    const window = evaluateSessionWindow(session, checkDate);

    if (!overrideTime) {
      if (window.isUpcoming) {
        return {
          success: false,
          isBoundaryRejection: true,
          message: `Attendance is not open yet. It opens promptly at ${session.ethiopianOpenTime || '7:00'} Ethiopian time (${session.internationalOpenTime || '13:00'} international time).`
        };
      }
      if (window.isClosed) {
        return {
          success: false,
          isBoundaryRejection: true,
          message: `Attendance window closed at ${session.ethiopianLateCutoff || '7:40'} Ethiopian time (${session.internationalLateCutoff || '13:40'} international time). No further submissions are accepted.`
        };
      }
    }

    const provisional = window.provisionalClassification || (overrideTime?.classification) || 'Present';
    const addis = window.serverTimeAddis || getAddisAbabaNow(checkDate);
    const ethInfo = internationalToEthiopianTime(addis.timeStr);
    const nowIso = new Date().toISOString();

    const recordId = `att_rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRecord = {
      id: recordId,
      sessionId: session.id,
      sessionTitle: session.title,
      courseId: session.courseId,
      courseTitle: session.courseTitle,
      date: session.date,

      userId: member.id,
      memberId: member.memberId,
      studentName: member.studentName,
      studentClass: member.class || 'N/A',

      submittedAt: nowIso,
      submissionTimeEthiopian: ethInfo.formatted,
      submissionTimeInternational: `${addis.timeStr} EAT`,

      initialClassification: provisional,
      finalClassification: provisional,
      reviewStatus: 'Pending',
      status: provisional,

      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      correctionNotes: null,
      history: [
        {
          timestamp: nowIso,
          changedBy: member.studentName,
          action: 'SUBMITTED',
          previousStatus: 'None',
          newStatus: `Provisional ${provisional}`
        }
      ]
    };

    this.attendanceRecords.set(newRecord.id, newRecord);
    this._saveToFile();

    return {
      success: true,
      record: newRecord,
      classification: provisional,
      reviewStatus: 'Pending',
      message: `Attendance confirmed! Marked as provisional ${provisional} at ${ethInfo.formatted}. Pending administrative review.`
    };
  }

  getUnsubmittedEnrolledMembers(sessionId) {
    const session = this.getAttendanceSessionById(sessionId);
    if (!session) return [];

    const enrolledMembers = this.getEnrolledMembersForCourse(session.courseId);
    const submittedUserIds = new Set();
    const submittedMemberIds = new Set();

    for (const r of this.attendanceRecords.values()) {
      if (r.sessionId === session.id) {
        if (r.userId) submittedUserIds.add(r.userId);
        if (r.memberId) submittedMemberIds.add(r.memberId.toUpperCase());
      }
    }

    return enrolledMembers.filter(m => {
      const hasSubmitted = submittedUserIds.has(m.id) || submittedMemberIds.has(m.memberId.toUpperCase());
      return !hasSubmitted;
    });
  }

  finalizeSessionAbsences(sessionId, finalizedBy = 'Administrator') {
    const session = this.getAttendanceSessionById(sessionId);
    if (!session) {
      return { success: false, message: 'Attendance session not found.' };
    }

    // Strict boundary enforcement: Absences cannot be finalized before 7:40 Ethiopian (13:40 EAT) on the session date
    const addis = getAddisAbabaNow();
    const window = evaluateSessionWindow(session);

    if (addis.dateStr === session.date && !window.isClosed) {
      return {
        success: false,
        message: `Absences can only be finalized after the session closing deadline (${session.ethiopianLateCutoff || '7:40'} Ethiopian time / ${session.internationalLateCutoff || '13:40'} international time). Current window is still open or upcoming.`
      };
    }

    const unsubmitted = this.getUnsubmittedEnrolledMembers(sessionId);
    const nowIso = new Date().toISOString();
    const absentRecordsCreated = [];

    for (const member of unsubmitted) {
      const recordId = `att_rec_abs_${session.id}_${member.id}`;
      if (this.attendanceRecords.has(recordId)) continue;

      const record = {
        id: recordId,
        sessionId: session.id,
        sessionTitle: session.title,
        courseId: session.courseId,
        courseTitle: session.courseTitle,
        date: session.date,

        userId: member.id,
        memberId: member.memberId,
        studentName: member.studentName,
        studentClass: member.class || 'N/A',

        submittedAt: nowIso,
        submissionTimeEthiopian: 'Absence Finalized Post-Deadline',
        submissionTimeInternational: 'Finalized by Admin',

        initialClassification: 'Absent',
        finalClassification: 'Absent',
        reviewStatus: 'Approved',
        status: 'Absent',

        reviewedBy: typeof finalizedBy === 'string' ? finalizedBy : (finalizedBy?.studentName || 'Administrator'),
        reviewedAt: nowIso,
        rejectionReason: null,
        correctionNotes: 'Automatic absence finalized after 7:40 Ethiopian deadline.',
        history: [
          {
            timestamp: nowIso,
            changedBy: typeof finalizedBy === 'string' ? finalizedBy : (finalizedBy?.studentName || 'Administrator'),
            action: 'ABSENCE_FINALIZED',
            previousStatus: 'Unsubmitted',
            newStatus: 'Absent'
          }
        ]
      };

      this.attendanceRecords.set(record.id, record);
      absentRecordsCreated.push(record);
    }

    session.status = 'finalized';
    session.finalizedAt = nowIso;
    session.finalizedBy = typeof finalizedBy === 'string' ? finalizedBy : (finalizedBy?.studentName || 'Administrator');
    session.updatedAt = nowIso;

    this.logAuditEvent({
      actor: session.finalizedBy,
      action: 'FINALIZE_SESSION_ABSENCES',
      details: `Finalized ${absentRecordsCreated.length} absences for session "${session.title}" (${session.date})`
    });

    this._saveToFile();

    return {
      success: true,
      finalizedCount: absentRecordsCreated.length,
      session,
      records: absentRecordsCreated,
      message: `Finalized absences for ${absentRecordsCreated.length} unsubmitted enrolled student(s).`
    };
  }

  reviewAttendanceRecord(recordId, { reviewStatus, rejectionReason, reviewedBy }) {
    const record = this.attendanceRecords.get(recordId);
    if (!record) {
      return { success: false, message: 'Attendance record not found.' };
    }

    const cleanReviewStatus = reviewStatus === 'Approved' ? 'Approved' : (reviewStatus === 'Rejected' ? 'Rejected' : 'Pending');
    const reviewerName = typeof reviewedBy === 'string' ? reviewedBy : (reviewedBy?.studentName || 'Administrator');
    const nowIso = new Date().toISOString();

    const prevReview = record.reviewStatus;
    record.reviewStatus = cleanReviewStatus;
    record.reviewedBy = reviewerName;
    record.reviewedAt = nowIso;

    if (cleanReviewStatus === 'Rejected') {
      record.rejectionReason = rejectionReason ? rejectionReason.trim() : 'Invalid attendance verification submission.';
    } else {
      record.rejectionReason = null;
    }

    record.history = Array.isArray(record.history) ? record.history : [];
    record.history.push({
      timestamp: nowIso,
      changedBy: reviewerName,
      action: `REVIEW_${cleanReviewStatus.toUpperCase()}`,
      previousStatus: prevReview,
      newStatus: cleanReviewStatus
    });

    this.logAuditEvent({
      actor: reviewerName,
      action: `ATTENDANCE_REVIEW_${cleanReviewStatus.toUpperCase()}`,
      details: `${cleanReviewStatus} attendance for ${record.studentName} (${record.memberId}) on ${record.date}`
    });

    this._saveToFile();

    return {
      success: true,
      record,
      message: `Attendance submission for ${record.studentName} has been ${cleanReviewStatus.toLowerCase()}.`
    };
  }

  correctAttendanceRecord(recordId, { finalClassification, correctionNotes, correctedBy }) {
    const record = this.attendanceRecords.get(recordId);
    if (!record) {
      return { success: false, message: 'Attendance record not found.' };
    }

    if (!['Present', 'Late', 'Absent'].includes(finalClassification)) {
      return { success: false, message: 'Invalid classification. Must be Present, Late, or Absent.' };
    }

    const actorName = typeof correctedBy === 'string' ? correctedBy : (correctedBy?.studentName || 'Administrator');
    const nowIso = new Date().toISOString();
    const prevClass = record.finalClassification;

    record.finalClassification = finalClassification;
    record.status = finalClassification;
    record.correctionNotes = correctionNotes ? correctionNotes.trim() : 'Administrative override.';
    record.reviewStatus = 'Approved';
    record.reviewedBy = actorName;
    record.reviewedAt = nowIso;

    record.history = Array.isArray(record.history) ? record.history : [];
    record.history.push({
      timestamp: nowIso,
      changedBy: actorName,
      action: 'CLASSIFICATION_CORRECTION',
      previousStatus: prevClass,
      newStatus: finalClassification
    });

    this.logAuditEvent({
      actor: actorName,
      action: 'CORRECT_ATTENDANCE_RECORD',
      details: `Corrected attendance for ${record.studentName} from "${prevClass}" to "${finalClassification}": ${record.correctionNotes}`
    });

    this._saveToFile();

    return {
      success: true,
      record,
      message: `Classification for ${record.studentName} updated to ${finalClassification}.`
    };
  }

  getAllAttendanceRecords(filter = {}) {
    let records = Array.from(this.attendanceRecords.values());

    if (filter.sessionId) {
      records = records.filter(r => r.sessionId === filter.sessionId);
    }
    if (filter.courseId && filter.courseId !== 'all') {
      records = records.filter(r => r.courseId === filter.courseId);
    }
    if (filter.reviewStatus && filter.reviewStatus !== 'all') {
      records = records.filter(r => r.reviewStatus === filter.reviewStatus);
    }
    if (filter.classification && filter.classification !== 'all') {
      records = records.filter(r => r.finalClassification === filter.classification || r.status === filter.classification);
    }
    if (filter.date) {
      records = records.filter(r => r.date === filter.date);
    }
    if (filter.q) {
      const q = filter.q.toLowerCase().trim();
      records = records.filter(r =>
        (r.studentName || '').toLowerCase().includes(q) ||
        (r.memberId || '').toLowerCase().includes(q) ||
        (r.sessionTitle || '').toLowerCase().includes(q)
      );
    }

    return records.sort((a, b) => new Date(b.submittedAt || b.createdAt || 0).getTime() - new Date(a.submittedAt || a.createdAt || 0).getTime());
  }

  createManualAttendanceRecord(record) {
    const member = record.memberId ?
      this.findMemberByMemberId(record.memberId) || this.findMemberById(record.memberId) :
      undefined;

    const id = `att_man_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const created = {
      id,
      sessionId: record.sessionId || 'session_manual',
      sessionTitle: record.sessionName || record.sessionTitle || 'Manual Attendance Session',
      courseId: record.courseId || 'general',
      courseTitle: record.courseTitle || 'General Lab Session',
      date: record.date || now.toISOString().split('T')[0],

      memberId: member?.memberId || record.memberId || 'UNKNOWN',
      userId: member?.id || record.userId || 'UNKNOWN',
      studentName: member?.studentName || record.studentName || 'Student Member',
      studentClass: member?.class || record.studentClass || 'N/A',

      submittedAt: now.toISOString(),
      submissionTimeEthiopian: 'Manual Entry by Admin',
      submissionTimeInternational: 'Manual Admin Record',

      initialClassification: record.status || 'Present',
      finalClassification: record.status || 'Present',
      reviewStatus: 'Approved',
      status: record.status || 'Present',

      verifiedBy: 'admin',
      reviewedBy: record.reviewedBy || 'Administrator',
      reviewedAt: now.toISOString(),
      notes: record.notes,
      correctionNotes: record.notes,
      createdAt: now.toISOString()
    };

    this.attendanceRecords.set(id, created);
    this._saveToFile();
    return created;
  }

  deleteAttendanceRecord(id) {
    const deleted = this.attendanceRecords.delete(id);
    if (deleted) this._saveToFile();
    return deleted;
  }

  getMemberAttendanceHistory(memberIdOrUser) {
    let member = null;
    if (typeof memberIdOrUser === 'string') {
      member = this.findMemberById(memberIdOrUser) || this.findMemberByMemberId(memberIdOrUser);
    } else if (memberIdOrUser && memberIdOrUser.id) {
      member = this.members.get(memberIdOrUser.id) || memberIdOrUser;
    }

    if (!member) {
      return {
        records: [],
        totalSessions: 0,
        presentSessions: 0,
        lateSessions: 0,
        absentSessions: 0,
        attendanceRate: 100,
        isCertificateEligible: true
      };
    }

    const records = Array.from(this.attendanceRecords.values()).filter(
      r => r.memberId === member.memberId || r.userId === member.id
    ).sort((a, b) => new Date(b.date || b.submittedAt || 0).getTime() - new Date(a.date || a.submittedAt || 0).getTime());

    const totalSessions = records.length;
    const presentSessions = records.filter(r => (r.finalClassification || r.status) === 'Present').length;
    const lateSessions = records.filter(r => (r.finalClassification || r.status) === 'Late').length;
    const absentSessions = records.filter(r => (r.finalClassification || r.status) === 'Absent').length;

    const attendedCount = presentSessions + lateSessions;
    const attendanceRate = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 100;
    const isCertificateEligible = attendanceRate >= 80;

    return {
      records,
      totalSessions,
      presentSessions,
      lateSessions,
      absentSessions,
      attendanceRate,
      isCertificateEligible,
      member: {
        id: member.id,
        memberId: member.memberId,
        studentName: member.studentName,
        class: member.class
      }
    };
  }

  // Backwards compatibility wrappers
  getAttendanceSessionConfigs() {
    return this.attendanceSessionConfigs;
  }

  updateAttendanceSessionConfigs(configs) {
    if (Array.isArray(configs)) {
      this.attendanceSessionConfigs = configs;
      this._saveToFile();
    }
  }

  getActiveAttendanceSession(clientDate = new Date()) {
    const sessions = this.getAvailableAttendanceSessions(null, clientDate);
    const activeSession = sessions.find(s => s.window.isOpen);
    const addis = getAddisAbabaNow(clientDate);
    const ethInfo = internationalToEthiopianTime(addis.timeStr);

    if (activeSession) {
      return {
        isOpen: true,
        session: activeSession,
        expectedStatus: activeSession.window.provisionalClassification,
        serverTimeAddis: addis,
        ethiopianTime: ethInfo.ethiopianTime,
        timeDisplay: ethInfo.formatted,
        message: activeSession.window.message
      };
    }

    return {
      isOpen: false,
      serverTimeAddis: addis,
      ethiopianTime: ethInfo.ethiopianTime,
      timeDisplay: ethInfo.formatted,
      message: `Attendance window is currently closed (${ethInfo.formatted}). Scheduled sessions: 7:00 – 7:40 Ethiopian time (1:00 PM – 1:40 PM international time).`
    };
  }

  submitAttendance(memberId, password, overrideTime) {
    return this.submitAttendanceSession({
      memberId,
      password,
      overrideTime
    });
  }

  getMemberAttendance(memberId) {
    const history = this.getMemberAttendanceHistory(memberId);
    if (history.records.length > 0) {
      return history.records.map(r => ({
        id: r.id,
        memberId: r.memberId,
        date: r.date,
        sessionTitle: r.sessionTitle || r.sessionName,
        status: r.finalClassification || r.status
      }));
    }

    const member = this.findMemberById(memberId) || this.findMemberByMemberId(memberId);
    if (!member) return [];

    const enrollments = this.getMemberEnrollments(member.id);
    if (enrollments.length === 0) {
      return [
        { id: `att_1_${member.memberId}`, memberId: member.memberId, date: '2026-04-14', sessionTitle: 'IT Club Orientation & Lab Setup', status: 'Present' },
        { id: `att_2_${member.memberId}`, memberId: member.memberId, date: '2026-04-21', sessionTitle: 'Git & Linux Terminal Workshop', status: 'Present' }
      ];
    }
    const records = [];
    let idx = 1;
    for (const enr of enrollments) {
      records.push({
        id: `att_${idx++}_${member.memberId}`,
        memberId: member.memberId,
        date: '2026-04-07',
        sessionTitle: `${enr.courseTitle} - Week 1 Orientation`,
        status: 'Present'
      });
      records.push({
        id: `att_${idx++}_${member.memberId}`,
        memberId: member.memberId,
        date: '2026-04-14',
        sessionTitle: `${enr.courseTitle} - Week 2 Core Workshop`,
        status: 'Present'
      });
      records.push({
        id: `att_${idx++}_${member.memberId}`,
        memberId: member.memberId,
        date: '2026-04-21',
        sessionTitle: `${enr.courseTitle} - Week 3 Lab Project`,
        status: enr.progress >= 50 ? 'Present' : 'Late'
      });
      records.push({
        id: `att_${idx++}_${member.memberId}`,
        memberId: member.memberId,
        date: '2026-04-28',
        sessionTitle: `${enr.courseTitle} - Final Assessment & Demo`,
        status: 'Present'
      });
    }
    return records;
  }

  
  getAssignments(courseId, onlyPublished = true) {
    const list = Array.from(this.assignments.values());
    return list.filter((a) => {
      if (onlyPublished && !a.isPublished) return false;
      if (courseId && a.courseId !== courseId) return false;
      return true;
    });
  }

  getAssignmentById(id) {
    return this.assignments.get(id);
  }

  createAssignment(data) {
    const id = `asg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newAsg = {
      id,
      title: data.title || 'Untitled Assignment',
      description: data.description || '',
      courseId: data.courseId || 'general',
      courseTitle: data.courseTitle || 'General Course Track',
      deadline: data.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      maxScore: data.maxScore || 100,
      instructions: data.instructions || '',
      fileAttachmentUrl: data.fileAttachmentUrl,
      fileAttachmentName: data.fileAttachmentName,
      isPublished: data.isPublished !== false,
      createdAt: now,
      updatedAt: now
    };
    this.assignments.set(id, newAsg);
    return newAsg;
  }

  updateAssignment(id, data) {
    const existing = this.assignments.get(id);
    if (!existing) return undefined;
    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.assignments.set(id, updated);
    return updated;
  }

  deleteAssignment(id) {
    return this.assignments.delete(id);
  }

  submitAssignment(submissionData) {
    const assignment = this.assignments.get(submissionData.assignmentId);
    if (!assignment) {
      return { success: false, message: 'Assignment not found.' };
    }

    const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const submission = {
      id: subId,
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      courseId: assignment.courseId,
      memberId: submissionData.memberId,
      studentName: submissionData.studentName,
      fileUrl: submissionData.fileUrl,
      fileName: submissionData.fileName,
      fileSize: submissionData.fileSize,
      fileType: submissionData.fileType,
      studentComment: submissionData.studentComment,
      submittedAt: new Date().toISOString(),
      status: 'Submitted'
    };

    this.assignmentSubmissions.set(subId, submission);
    return { success: true, submission, message: 'Assignment submitted successfully.' };
  }

  getMemberSubmissions(memberId) {
    return Array.from(this.assignmentSubmissions.values()).
      filter((s) => s.memberId === memberId).
      sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  getAssignmentSubmissions(assignmentId) {
    return Array.from(this.assignmentSubmissions.values()).
      filter((s) => s.assignmentId === assignmentId).
      sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  gradeSubmission(
    submissionId,
    score,
    feedback,
    status = 'Graded',
    gradedBy = 'Administrator') {
    const sub = this.assignmentSubmissions.get(submissionId);
    if (!sub) return undefined;
    sub.score = score;
    sub.feedback = feedback;
    sub.status = status;
    sub.gradedAt = new Date().toISOString();
    sub.gradedBy = gradedBy;
    this.assignmentSubmissions.set(submissionId, sub);
    return sub;
  }

  getAllEnrollments() {
    return Array.from(this.enrollments.values());
  }

  enrollMemberInCourse(memberId, courseId) {
    const course = this.getCourseById(courseId);
    const member = this.findMemberById(memberId);
    if (!course || !member) return null;

    const existing = Array.from(this.enrollments.values()).find(
      (e) => e.memberId === memberId && (e.courseId === course.id || e.courseId === course.slug)
    );
    if (existing) return existing;

    const newEnrollment = {
      id: `enr_${Date.now()}`,
      memberId,
      studentName: member.studentName,
      courseId: course.id,
      courseTitle: course.title,
      progress: 0,
      status: 'In Progress',
      enrolledAt: new Date().toISOString()
    };
    this.enrollments.set(newEnrollment.id, newEnrollment);
    this._saveToFile();

    
    const activity = {
      id: `act_${Date.now()}`,
      memberId,
      title: `Enrolled in ${course.title}`,
      date: new Date().toISOString(),
      timeAgo: 'Just now',
      type: 'course'
    };
    this.activities.set(activity.id, activity);

    return newEnrollment;
  }

  updateEnrollment(id, updates) {
    const enr = this.enrollments.get(id);
    if (!enr) return null;

    if (updates.progress !== undefined) enr.progress = Math.min(100, Math.max(0, updates.progress));
    if (updates.status) enr.status = updates.status;
    if (updates.certificateId) enr.certificateId = updates.certificateId;
    if (enr.progress === 100) {
      enr.status = 'Completed';
      enr.completedAt = new Date().toISOString();
    }
    this._saveToFile();
    return enr;
  }

  deleteEnrollment(id) {
    if (!id) return false;
    let deleted = this.enrollments.delete(id);
    if (!deleted) {
      for (const [key, enr] of this.enrollments.entries()) {
        if (enr.id === id || enr.memberId === id) {
          this.enrollments.delete(key);
          deleted = true;
          break;
        }
      }
    }
    if (deleted) {
      this._saveToFile();
    }
    return deleted;
  }

  
  getAllCertificates() {
    return Array.from(this.certificates.values());
  }

  getMemberCertificates(memberId) {
    return Array.from(this.certificates.values()).filter((c) => c.memberId === memberId);
  }

  getCertificateById(id) {
    if (!id) return null;
    return this.certificates.get(id) || this.verifyCertificateByCertId(id);
  }

  verifyCertificateByCertId(certId) {
    if (!certId) return null;
    const clean = certId.trim().toUpperCase();
    for (const c of this.certificates.values()) {
      if (c.certificateId && c.certificateId.toUpperCase() === clean) {
        return c;
      }
      if (c.id && c.id.toUpperCase() === clean) {
        return c;
      }
    }
    return null;
  }

  issueCertificate(params) {
    let member = null;
    if (params.memberId) {
      member = this.findMemberById(params.memberId) ||
               this.findMemberByMemberId(params.memberId) ||
               this.findMemberByPhone(params.memberId) ||
               this.findMemberByEmail(params.memberId);
    }

    let studentName = (params.studentName || '').trim();
    let memberId = params.memberId;

    if (member) {
      studentName = studentName || member.studentName;
      memberId = member.id;
    } else if (studentName) {
      memberId = memberId || `mbr_ext_${Date.now()}`;
    } else {
      return null;
    }

    const existingCertIds = new Set(Array.from(this.certificates.values()).map((c) => c.certificateId));
    const certId = generateCertificateId(params.courseName || 'Technology', existingCertIds);

    const certificate = {
      id: `cert_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      certificateId: certId,
      memberId: memberId,
      studentName: studentName,
      courseId: params.courseId || `crs_custom_${Date.now()}`,
      courseName: (params.courseName || 'Computer Science & Software Development').trim(),
      courseTitle: (params.courseName || 'Computer Science & Software Development').trim(),
      issueDate: params.issueDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      status: 'VERIFIED',
      isActive: true,
      authorizedSignatures: params.authorizedSignatures || [
        { title: 'Club President', name: (this.settings?.clubName ? this.settings.clubName : 'ARX') + ' Leadership' },
        { title: 'Authorized Faculty Advisor', name: 'Academic Director' }
      ],
      qrData: `${(this.settings?.websiteUrl || 'https://arx-website-sjs.vercel.app').replace(/\/+$/, '')}/#certificates?id=${certId}`,
      createdAt: new Date().toISOString()
    };

    this.certificates.set(certificate.id, certificate);

    if (member) {
      for (const enr of this.enrollments.values()) {
        if (enr.memberId === member.id && (enr.courseId === params.courseId || enr.courseTitle === params.courseName)) {
          enr.certificateId = certificate.certificateId;
          enr.progress = 100;
          enr.status = 'Completed';
        }
      }

      const activity = {
        id: `act_${Date.now()}`,
        memberId: member.id,
        title: `Received Certificate — ${params.courseName}`,
        date: new Date().toISOString(),
        timeAgo: 'Just now',
        type: 'certificate'
      };
      this.activities.set(activity.id, activity);
    }

    this._saveToFile();
    return certificate;
  }

  toggleCertificateStatus(id) {
    if (!id) return null;
    let cert = this.certificates.get(id) || this.verifyCertificateByCertId(id);
    if (!cert) return null;
    cert.status = cert.status === 'VERIFIED' ? 'REVOKED' : 'VERIFIED';
    cert.isActive = cert.status === 'VERIFIED';
    this._saveToFile();
    return cert;
  }

  deleteCertificate(id) {
    if (!id) return false;
    let cert = this.certificates.get(id) || this.verifyCertificateByCertId(id);
    if (!cert) return false;
    const deleted = this.certificates.delete(cert.id);
    if (deleted) this._saveToFile();
    return deleted;
  }

  
  getAllAwards() {
    return Array.from(this.awards.values());
  }

  getMemberAwards(memberId) {
    return Array.from(this.awards.values()).filter((a) => a.memberId === memberId);
  }

  createAward(params) {
    const member = this.findMemberById(params.memberId);
    if (!member) return null;

    const award = {
      id: `awd_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      memberId: member.id,
      studentName: member.studentName,
      title: params.title.trim(),
      description: params.description.trim(),
      date: params.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      category: params.category || 'General Honor',
      badge: params.badge || 'trophy',
      createdAt: new Date().toISOString()
    };
    this.awards.set(award.id, award);

    const activity = {
      id: `act_${Date.now()}`,
      memberId: member.id,
      title: `Received Award — ${award.title}`,
      date: new Date().toISOString(),
      timeAgo: 'Just now',
      type: 'award'
    };
    this.activities.set(activity.id, activity);

    return award;
  }

  deleteAward(id) {
    return this.awards.delete(id);
  }

  
  addMemberAwardFile(fileData) {
    const id = `awf_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const now = new Date().toISOString();
    const item = {
      ...fileData,
      id,
      uploadedAt: now
    };
    this.memberAwardFiles.set(id, item);

    const member = this.findMemberById(fileData.memberId);
    if (member) {
      if (!member.awardFiles) member.awardFiles = [];
      member.awardFiles.push(item);
    }
    this._saveToFile();
    return item;
  }

  getMemberAwardFiles(memberId) {
    return Array.from(this.memberAwardFiles.values()).filter((f) => f.memberId === memberId);
  }

  getAllMemberAwardFiles() {
    return Array.from(this.memberAwardFiles.values());
  }

  getMemberAwardFileById(id) {
    return this.memberAwardFiles.get(id);
  }

  
  getProjects(publicOnly = true) {
    const list = Array.from(this.projects.values());
    if (publicOnly) return list.filter((p) => p.isPublished !== false);
    return list;
  }

  getMemberProjects(studentName, memberId) {
    const lowerName = (studentName || '').toLowerCase().trim();
    const lowerId = (memberId || '').toLowerCase().trim();
    return Array.from(this.projects.values()).filter((p) => {
      if (p.isPublished === false) return false;
      if (!Array.isArray(p.projectMembers) || p.projectMembers.length === 0) return true;
      return p.projectMembers.some((m) => {
        const sm = String(m).toLowerCase().trim();
        return (lowerName && sm.includes(lowerName)) ||
          (lowerId && sm.includes(lowerId)) ||
          sm === 'it club members' ||
          sm === 'all members' ||
          sm === 'it club team';
      });
    });
  }

  createProject(data) {
    const project = {
      ...data,
      id: `prj_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      technologies: Array.isArray(data.technologies) ? data.technologies : ['Software'],
      projectMembers: Array.isArray(data.projectMembers) ? data.projectMembers : ['IT Club Team'],
      isPublished: data.isPublished !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.projects.set(project.id, project);
    this._saveToFile();
    return project;
  }

  updateProject(id, updates) {
    const proj = this.projects.get(id);
    if (!proj) return null;
    Object.assign(proj, updates, { updatedAt: new Date().toISOString() });
    if (updates.isPublished !== undefined) {
      proj.isPublished = updates.isPublished !== false;
    }
    this._saveToFile();
    return proj;
  }

  deleteProject(id) {
    const deleted = this.projects.delete(id);
    if (deleted) this._saveToFile();
    return deleted;
  }

  // ---------- Student Project Submissions ----------

  getStudentProjectSubmissions(filter = {}) {
    let list = Array.from(this.studentProjectSubmissions.values());
    if (filter.status && filter.status !== 'all') {
      list = list.filter((p) => p.status === filter.status);
    }
    if (filter.memberId) {
      list = list.filter((p) => p.memberId === filter.memberId);
    }
    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  findStudentProjectSubmissionById(id) {
    if (!id) return null;
    return this.studentProjectSubmissions.get(id) || null;
  }

  createStudentProjectSubmission(data) {
    const id = `proj_sub_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const submission = {
      id,
      memberId: data.memberId || 'GUEST',
      studentName: data.studentName || 'Anonymous Student',
      class: data.class || 'N/A',
      telegramUserId: data.telegramUserId || null,
      telegramUsername: data.telegramUsername || null,
      title: data.title || 'Untitled Project',
      description: data.description || '',
      track: data.track || 'General Tech',
      fileName: data.fileName || 'project_file',
      fileSize: data.fileSize || 0,
      mimeType: data.mimeType || 'application/octet-stream',
      storagePath: data.storagePath || '',
      telegramFileId: data.telegramFileId || '',
      submittedAt: new Date().toISOString(),
      status: 'pending', // pending | approved | needs_revision | rejected
      reviewNotes: '',
      reviewedBy: null,
      reviewedAt: null
    };
    this.studentProjectSubmissions.set(id, submission);
    this._saveToFile();
    return submission;
  }

  reviewStudentProjectSubmission(id, { status, reviewNotes, reviewerName }) {
    const item = this.studentProjectSubmissions.get(id);
    if (!item) return null;
    if (status && ['pending', 'approved', 'needs_revision', 'rejected'].includes(status)) {
      item.status = status;
    }
    if (reviewNotes !== undefined) item.reviewNotes = String(reviewNotes).trim();
    item.reviewedBy = reviewerName || 'Club Admin';
    item.reviewedAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    this._saveToFile();
    return item;
  }

  deleteStudentProjectSubmission(id) {
    const item = this.studentProjectSubmissions.get(id);
    if (!item) return false;
    if (item.storagePath && fs.existsSync(item.storagePath)) {
      try { fs.unlinkSync(item.storagePath); } catch (_) {}
    }
    this.studentProjectSubmissions.delete(id);
    this._saveToFile();
    return true;
  }

  
  getEvents(publicOnly = true) {
    const list = Array.from(this.events.values());
    if (publicOnly) return list.filter((e) => e.isPublished !== false);
    return list;
  }

  createEvent(data) {
    const dateObj = data.date ? new Date(data.date + 'T00:00:00') : new Date();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const formattedDate = data.formattedDate || {
      day: String(dateObj.getDate() || '15'),
      month: months[dateObj.getMonth()] || 'OCT',
      year: String(dateObj.getFullYear() || '2026')
    };

    const event = {
      ...data,
      id: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      formattedDate,
      registeredMembers: Array.isArray(data.registeredMembers) ? data.registeredMembers : [],
      isPublished: data.isPublished !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.events.set(event.id, event);
    this._saveToFile();
    return event;
  }

  updateEvent(id, updates) {
    const ev = this.events.get(id);
    if (!ev) return null;
    let formattedDate = ev.formattedDate;
    if (updates.date && updates.date !== ev.date) {
      const dateObj = new Date(updates.date + 'T00:00:00');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      formattedDate = {
        day: String(dateObj.getDate() || '15'),
        month: months[dateObj.getMonth()] || 'OCT',
        year: String(dateObj.getFullYear() || '2026')
      };
    }
    Object.assign(ev, updates, { formattedDate, updatedAt: new Date().toISOString() });
    if (updates.isPublished !== undefined) {
      ev.isPublished = updates.isPublished !== false;
    }
    this._saveToFile();
    return ev;
  }

  deleteEvent(id) {
    const deleted = this.events.delete(id);
    if (deleted) this._saveToFile();
    return deleted;
  }

  registerForEvent(eventId, memberId) {
    const ev = this.events.get(eventId);
    if (!ev) return { success: false, message: 'Event not found.' };

    if (ev.registeredMembers.includes(memberId)) {
      return { success: true, message: 'You are already registered for this event.' };
    }

    if (ev.seatsAvailable > 0) {
      ev.seatsAvailable -= 1;
    }
    ev.registeredMembers.push(memberId);

    const activity = {
      id: `act_${Date.now()}`,
      memberId,
      title: `Registered for ${ev.title}`,
      date: new Date().toISOString(),
      timeAgo: 'Just now',
      type: 'workshop'
    };
    this.activities.set(activity.id, activity);
    this._saveToFile();

    return { success: true, message: 'Successfully registered for event!' };
  }

  
  getAchievements(publicOnly = true) {
    const list = Array.from(this.achievements.values());
    if (publicOnly) return list.filter((a) => a.isPublished);
    return list;
  }

  createAchievement(data) {
    const ach = {
      ...data,
      id: `ach_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString()
    };
    this.achievements.set(ach.id, ach);
    this._saveToFile();
    return ach;
  }

  updateAchievement(id, updates) {
    const ach = this.achievements.get(id);
    if (!ach) return null;
    Object.assign(ach, updates);
    this._saveToFile();
    return ach;
  }

  deleteAchievement(id) {
    const deleted = this.achievements.delete(id);
    if (deleted) this._saveToFile();
    return deleted;
  }

  
  getAnnouncements(publicOnly = true) {
    const list = Array.from(this.announcements.values());
    if (publicOnly) return list.filter((a) => a.isPublished);
    return list;
  }

  createAnnouncement(data) {
    const ann = {
      ...data,
      id: `ann_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString()
    };
    this.announcements.set(ann.id, ann);
    this._saveToFile();
    return ann;
  }

  deleteAnnouncement(id) {
    const deleted = this.announcements.delete(id);
    if (deleted) this._saveToFile();
    return deleted;
  }

  toggleAnnouncement(id) {
    const ann = this.announcements.get(id);
    if (!ann) return null;
    ann.isPublished = !ann.isPublished;
    ann.updatedAt = new Date().toISOString();
    this._saveToFile();
    return ann;
  }

  
  getMemberActivities(memberId) {
    return Array.from(this.activities.values()).
      filter((a) => a.memberId === memberId).
      slice(-10).
      reverse();
  }

  
  getSocialLinks() {
    return Array.from(this.socialLinks.values()).sort((a, b) => a.order - b.order);
  }

  getPublicSocialLinks() {
    return Array.from(this.socialLinks.values()).
      filter((s) => s.isEnabled).
      sort((a, b) => a.order - b.order);
  }

  createSocialLink(data) {
    const now = new Date().toISOString();
    const id = `soc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const link = {
      ...data,
      id,
      order: data.order ?? this.socialLinks.size + 1,
      isEnabled: data.isEnabled ?? true,
      createdAt: now,
      updatedAt: now
    };
    this.socialLinks.set(id, link);
    return link;
  }

  updateSocialLink(id, updates) {
    const link = this.socialLinks.get(id);
    if (!link) return null;
    Object.assign(link, updates, { updatedAt: new Date().toISOString() });
    return link;
  }

  deleteSocialLink(id) {
    return this.socialLinks.delete(id);
  }

  
  // ─── TEAM & GOVERNANCE MANAGEMENT ──────────────────────────────────────────
  isUniqueExecutiveRole(roleTitle) {
    if (!roleTitle) return false;
    const normalized = roleTitle.trim().toLowerCase();
    const uniqueTitles = [
      'president',
      'vice president',
      'chief marketing officer',
      'cmo',
      'chief operating officer',
      'coo',
      'chief technology officer',
      'cto',
      'board of director'
    ];
    return uniqueTitles.includes(normalized);
  }

  getGovernanceRoles(publicOnly = false, category = null) {
    let list = Array.from(this.governance.values());
    if (publicOnly) {
      list = list.filter((g) => g.isPublished !== false);
    }
    if (category && category !== 'all') {
      const catNorm = category.trim().toLowerCase();
      list = list.filter((g) => (g.category || 'instructor').toLowerCase() === catNorm);
    }
    return list.sort((a, b) => (a.order || 99) - (b.order || 99));
  }

  getGovernanceRoleById(id) {
    return this.governance.get(id) || null;
  }

  findGovernanceRoleByExactTitle(roleTitle, excludeId = null) {
    if (!roleTitle) return null;
    const target = roleTitle.trim().toLowerCase();
    for (const [id, item] of this.governance.entries()) {
      if (excludeId && id === excludeId) continue;
      if (item.role && item.role.trim().toLowerCase() === target) {
        return item;
      }
    }
    return null;
  }

  createGovernanceRole(data, adminUser = null) {
    const now = new Date().toISOString();
    const id = data.id || `gov_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const isUnique = data.isUniqueRole !== undefined 
      ? Boolean(data.isUniqueRole) 
      : this.isUniqueExecutiveRole(data.role);

    // Enforce uniqueness for single-holder executive roles
    if (isUnique && data.role) {
      const existing = this.findGovernanceRoleByExactTitle(data.role);
      if (existing) {
        throw new Error(`The role "${data.role}" is currently held by ${existing.name}. Duplicate assignment of unique leadership positions is prohibited. Please use the Role Transfer function.`);
      }
    }

    const role = {
      id,
      name: data.name?.trim() || 'Team Member',
      role: data.role?.trim() || 'Instructor',
      specialty: data.specialty?.trim() || data.department?.trim() || 'Technical Instructor',
      department: data.department?.trim() || data.specialty?.trim() || 'Computer Science',
      category: data.category?.trim() || (isUnique ? 'leadership' : 'instructor'),
      description: (data.description || '').trim(),
      photoUrl: data.photoUrl?.trim() || '/uploads/student-leadership.svg',
      positionOffset: data.positionOffset?.trim() || 'center 20%',
      socialLinks: data.socialLinks && typeof data.socialLinks === 'object' ? data.socialLinks : {},
      order: typeof data.order === 'number' ? data.order : this.governance.size + 1,
      isUniqueRole: isUnique,
      isPublished: data.isPublished !== false,
      createdAt: now,
      updatedAt: now
    };

    this.governance.set(id, role);

    // Audit logging
    if (Array.isArray(this.auditLogs)) {
      this.auditLogs.unshift({
        id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        action: 'CREATE_TEAM_MEMBER',
        targetId: id,
        targetName: role.name,
        details: `Added new team member ${role.name} (${role.role}) in category ${role.category}`,
        performedBy: adminUser?.memberId || adminUser?.studentName || 'Club Admin',
        timestamp: now
      });
    }

    this._saveToFile();
    return role;
  }

  updateGovernanceRole(id, updates, adminUser = null) {
    const item = this.governance.get(id);
    if (!item) return null;

    const now = new Date().toISOString();

    // Check unique role conflict if role is changing
    if (updates.role && updates.role.trim().toLowerCase() !== item.role.trim().toLowerCase()) {
      const isUnique = updates.isUniqueRole !== undefined 
        ? Boolean(updates.isUniqueRole) 
        : this.isUniqueExecutiveRole(updates.role);

      if (isUnique) {
        const existing = this.findGovernanceRoleByExactTitle(updates.role, id);
        if (existing) {
          throw new Error(`The role "${updates.role}" is already assigned to ${existing.name}. Cannot assign duplicate executive position.`);
        }
      }
    }

    const isUnique = updates.isUniqueRole !== undefined
      ? Boolean(updates.isUniqueRole)
      : (updates.role ? this.isUniqueExecutiveRole(updates.role) : item.isUniqueRole);

    Object.assign(item, updates, {
      isUniqueRole: isUnique,
      updatedAt: now
    });

    if (Array.isArray(this.auditLogs)) {
      this.auditLogs.unshift({
        id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        action: 'UPDATE_TEAM_MEMBER',
        targetId: id,
        targetName: item.name,
        details: `Updated team profile for ${item.name} (${item.role})`,
        performedBy: adminUser?.memberId || adminUser?.studentName || 'Club Admin',
        timestamp: now
      });
    }

    this._saveToFile();
    return item;
  }

  transferGovernanceRole({ sourceMemberId, targetMemberId, roleTitle, newSourceRole }, adminUser = null) {
    const source = this.governance.get(sourceMemberId);
    const target = this.governance.get(targetMemberId);
    if (!source || !target) {
      throw new Error('Source or target team member record was not found.');
    }

    const titleToTransfer = (roleTitle || source.role).trim();
    const sourceReplacement = (newSourceRole || source.specialty || `${source.department || 'Technical'} Instructor`).trim();
    const now = new Date().toISOString();

    const previousTargetRole = target.role;

    // Apply transfer
    source.role = sourceReplacement;
    source.isUniqueRole = this.isUniqueExecutiveRole(sourceReplacement);
    source.category = source.isUniqueRole ? 'leadership' : (source.category === 'leadership' ? 'instructor' : source.category);
    source.updatedAt = now;

    target.role = titleToTransfer;
    target.isUniqueRole = true;
    target.category = 'leadership';
    target.updatedAt = now;

    // Adjust display order if necessary so new leadership member appears in executive order
    if (titleToTransfer.toLowerCase().includes('marketing') || titleToTransfer.toLowerCase() === 'chief marketing officer') {
      target.order = 3;
      if (source.order <= 3) {
        source.order = 5;
      }
    }

    if (Array.isArray(this.auditLogs)) {
      this.auditLogs.unshift({
        id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        action: 'TRANSFER_LEADERSHIP_ROLE',
        targetId: target.id,
        targetName: target.name,
        details: `Transferred "${titleToTransfer}" from ${source.name} to ${target.name}. ${source.name}'s role updated to "${sourceReplacement}".`,
        performedBy: adminUser?.memberId || adminUser?.studentName || 'Club Admin',
        timestamp: now
      });
    }

    this._saveToFile();
    return {
      success: true,
      sourceMember: source,
      targetMember: target,
      message: `Successfully transferred ${titleToTransfer} to ${target.name}.`
    };
  }

  deleteGovernanceRole(id, adminUser = null) {
    const item = this.governance.get(id);
    if (!item) return false;

    const deleted = this.governance.delete(id);
    if (deleted) {
      if (Array.isArray(this.auditLogs)) {
        this.auditLogs.unshift({
          id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          action: 'DELETE_TEAM_MEMBER',
          targetId: id,
          targetName: item.name,
          details: `Removed team member ${item.name} (${item.role})`,
          performedBy: adminUser?.memberId || adminUser?.studentName || 'Club Admin',
          timestamp: new Date().toISOString()
        });
      }
      this._saveToFile();
    }
    return deleted;
  }

  reorderGovernanceRoles(ids, adminUser = null) {
    if (!Array.isArray(ids)) return this.getGovernanceRoles();
    ids.forEach((id, index) => {
      const item = this.governance.get(id);
      if (item) {
        item.order = index + 1;
        item.updatedAt = new Date().toISOString();
      }
    });

    if (Array.isArray(this.auditLogs)) {
      this.auditLogs.unshift({
        id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        action: 'REORDER_TEAM_MEMBERS',
        details: `Reordered team display hierarchy (${ids.length} members updated)`,
        performedBy: adminUser?.memberId || adminUser?.studentName || 'Club Admin',
        timestamp: new Date().toISOString()
      });
    }

    this._saveToFile();
    return this.getGovernanceRoles();
  }


  
  getClubStats() {
    
    const studentMembersCount = Array.from(this.members.values()).filter(
      (m) => m.role === 'member' && m.status === 'active'
    ).length;
    const publishedCourses = Array.from(this.courses.values()).filter((c) => c.isPublished).length;
    const publishedProjects = Array.from(this.projects.values()).filter((p) => p.isPublished).length;
    const upcomingEvents = Array.from(this.events.values()).filter(
      (e) => e.isPublished && e.status === 'Upcoming'
    ).length;

    return {
      activeMembers: studentMembersCount,
      coursesCount: publishedCourses,
      projectsCount: publishedProjects,
      eventsCount: upcomingEvents
    };
  }

  getAdminOverviewStats() {
    const studentMembers = Array.from(this.members.values()).filter((m) => m.role === 'member');
    const totalMembersCount = studentMembers.length;
    const pendingApplicationsCount = studentMembers.filter((m) => m.status === 'pending').length;
    const approvedMembersCount = studentMembers.filter((m) => m.status === 'approved' || m.status === 'active').length;
    const rejectedApplicationsCount = studentMembers.filter((m) => m.status === 'rejected').length;
    const totalCourses = this.courses.size;
    const completedEnrollments = Array.from(this.enrollments.values()).filter(
      (e) => e.progress === 100 || e.status === 'Completed'
    ).length;
    const certificatesIssued = this.certificates.size;
    const awardsCount = this.awards.size;
    const projectsCount = this.projects.size;
    const upcomingEvents = Array.from(this.events.values()).filter((e) => e.status === 'Upcoming').length;

    return {
      totalMembers: totalMembersCount,
      activeMembers: approvedMembersCount,
      pendingApplications: pendingApplicationsCount,
      rejectedApplications: rejectedApplicationsCount,
      totalCourses,
      completedCourses: completedEnrollments,
      certificatesIssued,
      awards: awardsCount,
      projects: projectsCount,
      upcomingEvents
    };
  }

  
  getTelegramBroadcasts() {
    return Array.from(this.telegramBroadcasts.values()).reverse();
  }

  reactToBroadcast(id, emoji) {
    const post = this.telegramBroadcasts.get(id);
    if (!post) {
      return { success: false, reactions: [] };
    }

    const existingReaction = post.reactions.find((r) => r.emoji === emoji);
    if (existingReaction) {
      existingReaction.count += 1;
    } else {
      post.reactions.push({ emoji, count: 1 });
    }

    return { success: true, reactions: post.reactions };
  }

  createTelegramBroadcast(content, tags = ['#announcements']) {
    const id = `tb_${Date.now()}`;
    const date = 'Just now';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const channelHandle = this.settings.telegramChannelName || CONFIG.TELEGRAM_CHANNEL_HANDLE || '@arxitclub';
    const post = {
      id,
      postId: 100 + this.telegramBroadcasts.size + 1,
      author: 'ARX IT CLUB OF SJS Admin',
      channelName: 'ARX IT CLUB OF SJS Official',
      channelHandle,
      date,
      time,
      content: content.trim(),
      tags: tags.length ? tags : ['#announcements'],
      views: 1,
      reactions: [{ emoji: '🚀', count: 1 }]
    };

    this.telegramBroadcasts.set(id, post);
    return post;
  }

  
  getExistingTelegramUsernames() {
    const set = new Set();
    for (const member of this.members.values()) {
      if (member.telegramUsername) {
        const clean = member.telegramUsername.replace(/^@/, '').trim().toLowerCase();
        if (clean) set.add(clean);
      }
    }
    return set;
  }

  getExistingEmails() {
    const set = new Set();
    for (const member of this.members.values()) {
      if (member.email) {
        const clean = member.email.trim().toLowerCase();
        if (clean) set.add(clean);
      }
    }
    return set;
  }

  findMemberByTelegramUsername(username) {
    if (!username) return undefined;
    const clean = String(username).replace(/^@/, '').trim().toLowerCase();
    if (!clean) return undefined;
    for (const member of this.members.values()) {
      if (member.telegramUsername) {
        const mClean = member.telegramUsername.replace(/^@/, '').trim().toLowerCase();
        if (mClean === clean) {
          return member;
        }
      }
    }
    return undefined;
  }

  createActivationSession(
    userId,
    memberId,
    studentName,
    telegramUsername) {
    const token = `act_${Date.now()}_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); 

    const session = {
      id: `ses_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      token,
      activationCode: undefined, 
      shortCode: undefined,
      activationCodeExpiresAt: undefined,
      codeUsed: false,
      failedAttempts: 0,
      memberId,
      userId,
      studentName,
      telegramUsername: telegramUsername || undefined,
      status: 'pending',
      channelVerified: false, 
      createdAt: now.toISOString(),
      expiresAt
    };

    
    this.activationSessions.set(token, session);
    this._saveToFile();
    return session;
  }

  generateActivationCodeForSession(
    sessionToken,
    telegramUserId,
    verifiedUsername) {
    const session = this.getActivationSession(sessionToken);
    if (!session) {
      return { success: false, error: 'Activation session not found.' };
    }

    if (session.status !== 'pending') {
      return { success: false, error: 'Activation session is no longer active.' };
    }

    if (new Date(session.expiresAt) < new Date()) {
      session.status = 'expired';
      return { success: false, error: 'Activation session has expired.' };
    }

    if (!session.channelVerified) {
      return { success: false, error: 'Telegram channel membership must be verified first before receiving an activation code.' };
    }

    
    const randDigits = Math.floor(1000 + Math.random() * 9000).toString();
    const code = `ARX-ACT-${randDigits}`;

    session.activationCode = code;
    session.shortCode = randDigits;
    
    session.activationCodeExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    session.codeUsed = false;
    session.telegramUserId = telegramUserId;
    if (verifiedUsername) {
      session.verifiedTelegramUsername = verifiedUsername.startsWith('@') ? verifiedUsername : `@${verifiedUsername}`;
    }

    return { success: true, code };
  }

  getActivationSession(codeOrToken) {
    if (!codeOrToken || typeof codeOrToken !== 'string') return undefined;
    const clean = codeOrToken.trim();

    
    const direct = this.activationSessions.get(clean);
    if (direct) return direct;

    const upper = clean.toUpperCase();
    const cleanWithoutHyphens = upper.replace(/[^A-Z0-9]/g, '');

    for (const session of this.activationSessions.values()) {
      if (session.token === clean) return session;
      if (session.activationCode && session.activationCode.toUpperCase() === upper) return session;
      if (session.shortCode && session.shortCode === clean) return session;
      if (session.activationCode && session.activationCode.replace(/[^A-Z0-9]/g, '') === cleanWithoutHyphens) return session;
    }
    return undefined;
  }

  getPendingSessionForMember(memberId) {
    for (const session of this.activationSessions.values()) {
      if (
        session.memberId === memberId &&
        session.status === 'pending' &&
        new Date(session.expiresAt) > new Date()) {
        return session;
      }
    }
    return undefined;
  }

  activateAccountByCode(rawCode, expectedMemberId) {
    if (!rawCode || typeof rawCode !== 'string' || !rawCode.trim()) {
      return {
        success: false,
        code: 'INVALID_CODE',
        message: 'Activation code is required. Please enter the ARX-ACT-XXXX code received from the Telegram bot.'
      };
    }

    
    let clean = rawCode.trim().toUpperCase().replace(/\s+/g, '');
    let canonicalCode = clean;

    if (/^\d{4}$/.test(clean)) {
      canonicalCode = `ARX-ACT-${clean}`;
    } else if (/^ARXACT\d{4}$/.test(clean)) {
      canonicalCode = `ARX-ACT-${clean.slice(6)}`;
    } else if (/^ACT-?\d{4}$/.test(clean)) {
      const digits = clean.replace(/\D/g, '');
      if (digits.length === 4) canonicalCode = `ARX-ACT-${digits}`;
    }

    
    if (!/^ARX-ACT-\d{4}$/.test(canonicalCode)) {
      return {
        success: false,
        code: 'INVALID_CODE',
        message: 'Invalid activation code format. Code must be in the format ARX-ACT-XXXX (e.g. ARX-ACT-4827).'
      };
    }

    
    let session;
    for (const s of this.activationSessions.values()) {
      if (s.activationCode && s.activationCode.toUpperCase() === canonicalCode) {
        session = s;
        break;
      }
    }

    if (!session) {
      if (expectedMemberId) {
        const pendingSess = this.getPendingSessionForMember(expectedMemberId);
        if (pendingSess) {
          pendingSess.failedAttempts = (pendingSess.failedAttempts || 0) + 1;
          if (pendingSess.failedAttempts >= 5) {
            pendingSess.status = 'revoked';
            return {
              success: false,
              code: 'REVOKED_CODE',
              message: 'This activation session has been revoked due to too many failed attempts.'
            };
          }
        }
      }
      return {
        success: false,
        code: 'INVALID_CODE',
        message: 'Invalid activation code. Please check the code received from the ARX IT CLUB OF SJS Telegram bot.'
      };
    }

    
    if (expectedMemberId) {
      const cleanExpected = expectedMemberId.trim().toUpperCase();
      if (session.memberId.toUpperCase() !== cleanExpected) {
        session.failedAttempts = (session.failedAttempts || 0) + 1;
        return {
          success: false,
          code: 'MEMBER_MISMATCH',
          message: 'This activation code belongs to a different member account.'
        };
      }
    }

    
    if ((session.failedAttempts || 0) >= 5) {
      session.status = 'revoked';
      return {
        success: false,
        code: 'REVOKED_CODE',
        message: 'This activation session has been revoked due to too many failed attempts.'
      };
    }

    
    if (session.status === 'completed' || session.codeUsed) {
      return {
        success: false,
        alreadyActive: true,
        code: 'ALREADY_ACTIVATED',
        message: 'This activation code has already been used. Each activation code is single-use only.'
      };
    }

    if (session.status === 'revoked') {
      return {
        success: false,
        code: 'REVOKED_CODE',
        message: 'This activation session has been revoked.'
      };
    }

    
    if (session.status === 'expired' || new Date(session.expiresAt) < new Date()) {
      session.status = 'expired';
      return {
        success: false,
        code: 'EXPIRED_CODE',
        message: 'This activation session has expired. Please request a new code from the Telegram bot.'
      };
    }

    
    if (session.activationCodeExpiresAt && new Date(session.activationCodeExpiresAt) < new Date()) {
      return {
        success: false,
        code: 'EXPIRED_CODE',
        message: 'This activation code has expired. Activation codes expire after 5 minutes. Please request a new code from the Telegram bot.'
      };
    }

    
    if (!session.channelVerified) {
      return {
        success: false,
        code: 'CHANNEL_NOT_VERIFIED',
        message: 'Channel membership has not been verified. Please join the official Telegram channel and complete bot verification.'
      };
    }

    
    if (!session.telegramUserId) {
      return {
        success: false,
        code: 'INVALID_CODE',
        message: 'Telegram bot verification has not been completed for this session.'
      };
    }

    const member = this.findMemberById(session.userId) || this.findMemberByMemberId(session.memberId);
    if (!member) {
      return {
        success: false,
        code: 'MEMBER_NOT_FOUND',
        message: 'Associated member record not found.'
      };
    }

    if (member.telegramActivated) {
      return {
        success: false,
        alreadyActive: true,
        code: 'ALREADY_ACTIVATED',
        message: 'This member account is already active.',
        member,
        session
      };
    }

    
    const existingMemberWithTg = this.findMemberByTelegramUserId(session.telegramUserId);
    if (existingMemberWithTg && existingMemberWithTg.id !== member.id) {
      return {
        success: false,
        code: 'TELEGRAM_ALREADY_LINKED',
        message: `The Telegram account associated with this session is already linked to another member (${existingMemberWithTg.studentName}).`
      };
    }

    
    session.status = 'completed';
    session.completedAt = new Date().toISOString();
    session.activatedVia = 'website';
    session.codeUsed = true;

    member.telegramActivated = true;
    member.channelVerified = true;
    if (member.isApproved) {
      member.status = 'approved';
    }
    member.telegramUserId = session.telegramUserId;
    member.telegramLinkedAt = new Date().toISOString();
    if (session.verifiedTelegramUsername) {
      member.telegramUsername = session.verifiedTelegramUsername;
    }
    member.channelVerifiedAt = session.channelVerifiedAt || new Date().toISOString();
    member.updatedAt = new Date().toISOString();

    
    const numId = typeof session.telegramUserId === 'string' ? parseInt(session.telegramUserId, 10) : session.telegramUserId;
    if (!isNaN(numId)) {
      this.clearUserTelegramState(numId);
    }

    
    const activity = {
      id: `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      memberId: member.id,
      title: 'Account Activated via Verified Telegram Code',
      date: new Date().toISOString(),
      timeAgo: 'Just now',
      type: 'course'
    };
    this.activities.set(activity.id, activity);

    return {
      success: true,
      code: 'ACTIVATED',
      message: 'Account activated successfully. Welcome to ARX IT CLUB OF SJS!',
      member,
      session
    };
  }

  completeActivationSession(
    token,
    telegramUserId,
    verifiedUsername) {
    
    const session = this.activationSessions.get(token);
    if (!session) {
      return { success: false, message: 'Invalid or expired activation session token. Please generate a new activation link in the portal.' };
    }

    const member = this.findMemberById(session.userId);
    if (!member) {
      return { success: false, message: 'Member record associated with this activation session was not found.' };
    }

    
    if (session.status === 'completed' && member.telegramActivated && String(member.telegramUserId) === String(telegramUserId)) {
      return {
        success: true,
        alreadyActive: true,
        message: `Your Telegram account is already linked to ${member.studentName} (${member.memberId}).`,
        member,
        session
      };
    }

    
    if (member.telegramUserId && String(member.telegramUserId) !== String(telegramUserId)) {
      return {
        success: false,
        message: `This student member account is already securely linked to another Telegram profile. Please contact an administrator if you need to re-link devices.`
      };
    }

    
    const existingMemberWithTg = this.findMemberByTelegramUserId(telegramUserId);
    if (existingMemberWithTg && existingMemberWithTg.id !== member.id) {
      return {
        success: false,
        message: `Your Telegram account is already linked to member ${existingMemberWithTg.studentName} (${existingMemberWithTg.memberId}). One Telegram account cannot be linked to multiple memberships.`
      };
    }

    if (new Date(session.expiresAt) < new Date()) {
      session.status = 'expired';
      return {
        success: false,
        message: 'This activation session has expired (validity is 24 hours). Please log into the portal to generate a new activation link.'
      };
    }

    
    member.telegramUserId = telegramUserId;
    member.telegramActivated = true;
    member.telegramLinkedAt = new Date().toISOString();
    if (verifiedUsername) {
      member.telegramUsername = verifiedUsername.startsWith('@') ? verifiedUsername : `@${verifiedUsername}`;
    }
    if (member.channelVerified) {
      session.channelVerified = true;
      session.channelVerifiedAt = member.channelVerifiedAt || new Date().toISOString();
    }

    session.status = 'completed';
    session.telegramUserId = telegramUserId;
    session.verifiedTelegramUsername = verifiedUsername;
    session.completedAt = new Date().toISOString();

    const numId = typeof telegramUserId === 'string' ? parseInt(telegramUserId, 10) : telegramUserId;
    if (!isNaN(numId)) {
      this.clearUserTelegramState(numId);
    }

    return {
      success: true,
      message: `Account activated! Telegram User ID ${telegramUserId} is now securely linked to ${member.studentName} (${member.memberId}).`,
      member,
      session
    };
  }

  verifyChannelMembershipForSession(
    token) {
    const session = this.activationSessions.get(token);
    if (!session) {
      return { success: false, verified: false, message: 'Activation session not found.' };
    }

    session.channelVerified = true;
    session.channelVerifiedAt = new Date().toISOString();

    const member = this.findMemberById(session.userId);
    if (member) {
      member.channelVerified = true;
      member.channelVerifiedAt = session.channelVerifiedAt;
    }

    const channelHandle = this.settings.telegramChannelName || CONFIG.TELEGRAM_CHANNEL_HANDLE || '@arxitclub';
    return {
      success: true,
      verified: true,
      message: `Channel membership confirmed for ${channelHandle}! You are verified.`,
      session
    };
  }

  markMemberChannelVerified(telegramUserId) {
    const member = this.findMemberByTelegramUserId(telegramUserId);
    if (member) {
      member.channelVerified = true;
      member.channelVerifiedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  
  createPasswordResetSession(memberIdOrIdentifier) {
    const clean = memberIdOrIdentifier.trim();
    const member =
      this.findMemberByMemberId(clean) ||
      this.findMemberById(clean) ||
      this.findMemberByEmail(clean) ||
      this.findMemberByPhone(clean);

    if (!member) {
      return {
        success: false,
        message: 'No member found matching this ID, email, or phone number.'
      };
    }

    if (!member.telegramUserId && !member.telegramUsername) {
      return {
        success: false,
        message: `Your account (${member.memberId}) is not yet linked to Telegram. Please contact an officer or visit Computer Lab 3 to reset your password.`
      };
    }

    
    for (const [id, s] of this.passwordResetSessions.entries()) {
      if (s.memberId === member.memberId && !s.isUsed) {
        this.passwordResetSessions.delete(id);
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString(); 
    const resetToken = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); 

    const session = {
      id: `prs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      memberId: member.memberId,
      userId: member.id,
      telegramUserId: member.telegramUserId,
      code,
      resetToken,
      expiresAt,
      isUsed: false,
      createdAt: new Date().toISOString()
    };

    this.passwordResetSessions.set(session.id, session);

    return {
      success: true,
      session,
      member,
      message: 'A 6-digit password reset code has been sent through the official ARX Telegram bot.'
    };
  }

  verifyPasswordResetCode(memberIdOrIdentifier, code) {
    const cleanId = memberIdOrIdentifier.trim();
    const cleanCode = code.trim();

    const member =
      this.findMemberByMemberId(cleanId) ||
      this.findMemberById(cleanId) ||
      this.findMemberByEmail(cleanId) ||
      this.findMemberByPhone(cleanId);

    if (!member) {
      return { success: false, message: 'Member not found. Please verify your Member ID.' };
    }

    const now = new Date();
    for (const session of this.passwordResetSessions.values()) {
      if (
        session.memberId === member.memberId &&
        session.code === cleanCode &&
        !session.isUsed &&
        new Date(session.expiresAt) > now) {
        return {
          success: true,
          resetToken: session.resetToken,
          member,
          message: 'Code verified successfully. Please enter your new password.'
        };
      }
    }

    return {
      success: false,
      message: 'Invalid or expired password reset code. Please request a new code.'
    };
  }

  completePasswordReset(resetToken, newPassword) {
    const cleanToken = resetToken.trim();
    const now = new Date();

    for (const session of this.passwordResetSessions.values()) {
      if (session.resetToken === cleanToken && !session.isUsed && new Date(session.expiresAt) > now) {
        const member = this.findMemberById(session.userId) || this.findMemberByMemberId(session.memberId);
        if (!member) {
          return { success: false, message: 'Member record not found.' };
        }

        member.passwordHash = hashPassword(newPassword);
        session.isUsed = true;
        this.passwordResetSessions.set(session.id, session);
        this.members.set(member.id, member);

        return {
          success: true,
          member,
          message: 'Password updated successfully. You can now sign in with your new credentials.'
        };
      }
    }

    return {
      success: false,
      message: 'Invalid or expired reset session. Please request a new reset code.'
    };
  }

  isRegistrationOpen() {
    return this.settings.registrationStatus !== 'CLOSED';
  }

  setRegistrationStatus(status, closedMessage) {
    this.settings.registrationStatus = status;
    if (closedMessage) {
      this.settings.registrationClosedMessage = closedMessage;
    }
    this.settings.updatedAt = new Date().toISOString();
    return { ...this.settings };
  }

  findMemberByTelegramUserId(telegramUserId) {
    const target = String(telegramUserId);
    for (const member of this.members.values()) {
      if (member.telegramUserId && String(member.telegramUserId) === target) {
        return member;
      }
    }
    return undefined;
  }

  getAllActivationSessions() {
    return Array.from(this.activationSessions.values());
  }

  
  getBotCommands() {
    return Array.from(this.botCommands.values());
  }

  getBotCommand(cmd) {
    return this.botCommands.get(cmd.toLowerCase());
  }

  updateBotCommand(cmd, updates) {
    const existing = this.botCommands.get(cmd.toLowerCase());
    if (!existing) return null;
    Object.assign(existing, updates);
    this.botStatus.commandsSynced = false;
    return existing;
  }

  getBotContent() {
    return { ...this.botContent };
  }

  updateBotContent(updates) {
    this.botContent = { ...this.botContent, ...updates };
    return { ...this.botContent };
  }

  setBotCommandsSynced(synced) {
    this.botStatus.commandsSynced = synced;
  }

  getTelegramBotStatus() {
    const hasToken = Boolean(CONFIG.TELEGRAM_BOT_TOKEN);
    let connStatus = 'NOT_CONFIGURED';
    if (!hasToken) {
      connStatus = 'NOT_CONFIGURED';
    } else if (this.botStatus.lastError) {
      connStatus = 'ERROR';
    } else {
      connStatus = 'CONNECTED';
    }

    const isPublicHttps = Boolean(
      CONFIG.APP_URL &&
      CONFIG.APP_URL.startsWith('https://') &&
      !CONFIG.APP_URL.includes('localhost') &&
      !CONFIG.APP_URL.includes('127.0.0.1')
    );

    return {
      configured: hasToken,
      maskedToken: hasToken ? '••••••••••••••••••••' : null,
      botUsername: CONFIG.TELEGRAM_BOT_USERNAME,
      botDisplayName: this.botStatus.botDisplayName || CONFIG.TELEGRAM_BOT_DISPLAY_NAME || 'ARX IT CLUB OF SJS Official Bot',
      botId: this.botStatus.botId,
      connectionStatus: connStatus,
      updateMode: hasToken ? isPublicHttps ? 'webhook' : 'polling' : 'none',
      webhookUrl: isPublicHttps ? `${CONFIG.APP_URL}/api/telegram/webhook` : undefined,
      lastConnectedAt: this.botStatus.lastConnectedAt,
      lastUpdateReceivedAt: this.botStatus.lastUpdateReceivedAt,
      commandsSynced: this.botStatus.commandsSynced,
      error: this.botStatus.lastError,
      setupMessage: hasToken ?
        undefined :
        'Telegram Bot API token is required to connect the ARX IT CLUB OF SJS bot. Please provide the token obtained from @BotFather.'
    };
  }

  recordTelegramApiConnection(botInfo) {
    this.botStatus.lastConnectedAt = new Date().toISOString();
    this.botStatus.lastError = null;
    if (botInfo?.id) this.botStatus.botId = botInfo.id;
    if (botInfo?.firstName) this.botStatus.botDisplayName = botInfo.firstName;
    if (botInfo?.username) {
      this.settings.telegramBotUsername = botInfo.username;
      this.settings.telegramBotUrl = `https://t.me/${botInfo.username}`;
    }
  }

  recordTelegramApiError(err) {
    this.botStatus.lastError = err;
  }

  recordTelegramUpdateReceived() {
    this.botStatus.lastUpdateReceivedAt = new Date().toISOString();
  }

  getUserTelegramState(userId) {
    return this.telegramUserStates.get(userId);
  }

  setUserTelegramState(userId, stateData) {
    this.telegramUserStates.set(userId, {
      ...stateData,
      updatedAt: Date.now()
    });
  }

  clearUserTelegramState(userId) {
    this.telegramUserStates.delete(userId);
  }

  
  handleBotCommand(
    command,
    memberId,
    fromInfo) {
    const rawCmd = (command || '').trim();
    const parts = rawCmd.split(/\s+/);
    const cmd = (parts[0]?.toLowerCase() || '/help').split('@')[0];
    const payload = parts.slice(1).join(' ').trim();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const settings = this.getSettings();
    const channelHandle = settings.telegramChannelName || CONFIG.TELEGRAM_CHANNEL_HANDLE || '@arxitclub';
    const channelUrl = settings.telegramChannelUrl || CONFIG.TELEGRAM_CHANNEL_LINK || 'https://t.me/arxitclub';
    const botHandle = settings.telegramBotUsername ? `@${settings.telegramBotUsername}` : `@${CONFIG.TELEGRAM_BOT_USERNAME}`;
    const websiteBaseUrl = (settings.websiteUrl || CONFIG.APP_URL || 'https://arx-website-sjs.vercel.app').replace(/\/$/, '');

    
    let member = memberId ? this.findMemberById(memberId) || this.findMemberByMemberId(memberId) : undefined;
    const numericUserId = fromInfo?.id ? typeof fromInfo.id === 'string' ? parseInt(fromInfo.id, 10) : fromInfo.id : undefined;
    if (!member && numericUserId && !isNaN(numericUserId)) {
      member = this.findMemberByTelegramUserId(numericUserId);
    }

    
    if (cmd === '/cancel' || cmd === 'cancel') {
      if (numericUserId) {
        this.clearUserTelegramState(numericUserId);
      }
      return {
        reply: `The ongoing operation has been cancelled. You are back in the main menu.\n\nUse /menu or /help to view available commands.`,
        timestamp: time,
        actions: [
          { label: 'Main Menu', action: '/menu' },
          { label: 'View Help', action: '/help' }]

      };
    }

    
    if (member && member.status === 'suspended') {
      return {
        reply: `Account Notice — Membership Suspended\n\nYour ARX IT CLUB OF SJS membership account (${member.studentName}) is currently suspended. Access to active member features is restricted.\n\nTo appeal or resolve account status, please contact the IT Club faculty coordinators at Computer Lab 3 during regular workshop hours, or use /support.`,
        timestamp: time,
        actions: [
          { label: 'Contact Support', action: '/support' },
          { label: 'Lab Hours', action: '/lab' }]

      };
    }

    
    if (numericUserId && !isNaN(numericUserId) && !rawCmd.startsWith('/')) {
      const userState = this.getUserTelegramState(numericUserId);

      if (userState && userState.state === 'AWAITING_CHANNEL_JOIN') {
        const session = userState.sessionToken ? this.getActivationSession(userState.sessionToken) : undefined;
        return {
          reply: `To complete your registration, joining our official announcement channel (${channelHandle}) is required first.\n\nPlease join the channel and tap "I Joined the Channel" to continue.`,
          timestamp: time,
          actions: [
            { label: `Join ${channelHandle}`, action: `navigate:${channelUrl}` },
            { label: 'I Joined the Channel', action: `/verify_channel ${session?.token || userState.sessionToken || ''}` }]

        };
      }

      if (userState && userState.state === 'AWAITING_MEMBER_ID') {
        const enteredId = rawCmd.trim().toUpperCase();
        const expectedId = (userState.memberId || '').trim().toUpperCase();
        const session = userState.sessionToken ? this.getActivationSession(userState.sessionToken) : undefined;

        if (session && (enteredId === expectedId || enteredId === session.memberId.toUpperCase())) {
          
          const existingWithTg = this.findMemberByTelegramUserId(numericUserId);
          if (existingWithTg && existingWithTg.id !== session.userId) {
            return {
              reply: `This Telegram account is already linked to another member (${existingWithTg.studentName}). One Telegram account cannot be linked to multiple memberships.`,
              timestamp: time
            };
          }

          
          const genResult = this.generateActivationCodeForSession(
            session.token,
            numericUserId,
            fromInfo?.username
          );

          if (!genResult.success || !genResult.code) {
            return {
              reply: genResult.error || 'Failed to generate activation code. Please try again.',
              timestamp: time
            };
          }

          this.setUserTelegramState(numericUserId, {
            state: 'MEMBER_ID_VERIFIED',
            sessionToken: session.token,
            memberId: session.memberId,
            studentName: session.studentName
          });

          return {
            reply: `✅ Member ID Verified!\n\nYour Temporary Website Activation Code is:\n\n${genResult.code}\n\nEnter this code on the ARX IT CLUB OF SJS website to complete your activation.\n\nThis code expires in 5 minutes and can only be used once.`,
            timestamp: time,
            actions: [
              { label: 'Enter Code on Website', action: `navigate:${websiteBaseUrl}/#activate?code=${encodeURIComponent(genResult.code)}` },
              { label: 'Return to Website', action: `navigate:${websiteBaseUrl}/` }]

          };
        } else {
          return {
            reply: `Member ID Verification Failed:\nThe ID you entered (${rawCmd}) does not match this registration record.\n\nPlease check the Member ID assigned during registration (e.g. ${expectedId || 'ARX-2026-001'}) and reply with your correct ID, or send /cancel to restart.`,
            timestamp: time,
            actions: [
              { label: 'Member Portal Login', action: `navigate:${websiteBaseUrl}/#login` },
              { label: 'Help Desk', action: '/support' }]

          };
        }
      }
    }

    
    if (!rawCmd.startsWith('/') && rawCmd.length >= 4) {
      const searchKey = rawCmd.trim().toUpperCase();
      const cert = this.getCertificateById(searchKey);
      if (cert) {
        return {
          reply: `✅ **Verified ARX Certificate Found**:\n• **Certificate ID:** \`${cert.certificateId}\`\n• **Student:** ${cert.studentName}\n• **Course:** ${cert.courseTitle || cert.courseName}\n• **Issue Date:** ${cert.issueDate}\n• **Status:** VERIFIED ✅\n• **Authority:** ${cert.authorizedSignatures?.[0]?.name || 'Academic Director'}`,
          timestamp: time,
          actions: [{ label: 'Verify Online', action: `navigate:${websiteBaseUrl}/#certificates?id=${cert.certificateId}` }]
        };
      }

      const foundMember = this.findMemberByMemberId(searchKey);
      if (foundMember) {
        if (foundMember.status === 'suspended') {
          return {
            reply: `⚠️ **Member Record Found — Suspended:**\n• **Member ID:** \`${foundMember.memberId}\`\n• **Student:** ${foundMember.studentName}\nThis account is currently suspended. Please contact club administration.`,
            timestamp: time
          };
        }

        return {
          reply: `✅ **Active Member Record Found**:\n• **Member ID:** \`${foundMember.memberId}\`\n• **Student:** ${foundMember.studentName}\n• **Class:** ${foundMember.class}\n• **Status:** ACTIVE ✅\n• **Telegram Linked:** ${foundMember.telegramActivated ? 'Yes ✅' : 'Pending Link'}`,
          timestamp: time,
          actions: [
            { label: '📋 My Status', action: '/status' },
            { label: '📚 Explore Courses', action: '/courses' }]

        };
      }
    }

    
    const configuredCmd = this.getBotCommand(cmd);
    if (configuredCmd && configuredCmd.isEnabled === false) {
      return {
        reply: `⚠️ The command \`${cmd}\` is temporarily disabled by club administrators. Please use /help to see active options.`,
        timestamp: time,
        actions: [{ label: '❓ View Help', action: '/help' }]
      };
    }
    if (configuredCmd && configuredCmd.customReply) {
      return {
        reply: configuredCmd.customReply,
        timestamp: time,
        actions: [{ label: '📋 Menu', action: '/menu' }]
      };
    }

    
    if (cmd === '/start' && payload || cmd === '/activate' && payload || cmd === '/link' && payload) {
      const token = payload;
      const session = this.getActivationSession(token);

      if (!session) {
        return {
          reply: `⚠️ **ARX IT CLUB OF SJS Activation Alert**\n\nInvalid or expired activation session token. Please log into your Member Portal account on the website to generate a fresh activation link.`,
          timestamp: time,
          actions: [
            { label: '💻 Member Portal Login', action: `navigate:${websiteBaseUrl}/#login` },
            { label: `📢 Official Channel: ${channelHandle}`, action: `navigate:${channelUrl}` }]

        };
      }

      if (session.status === 'expired' || new Date(session.expiresAt) < new Date()) {
        session.status = 'expired';
        return {
          reply: `⚠️ **ARX IT CLUB OF SJS Activation Alert**\n\nThis activation session has expired (sessions are valid for 24 hours). Please log into your portal account to generate a new activation link.`,
          timestamp: time,
          actions: [
            { label: '💻 Member Portal Login', action: `navigate:${websiteBaseUrl}/#login` },
            { label: '📞 Contact Support', action: '/support' }]

        };
      }

      const activeMember = this.findMemberById(session.userId);
      if (!activeMember) {
        return {
          reply: `⚠️ **ARX IT CLUB OF SJS Activation Alert**\n\nNo student member record is associated with this activation request.`,
          timestamp: time
        };
      }

      
      if (session.status === 'completed' || activeMember.telegramActivated) {
        if (numericUserId && !activeMember.telegramUserId) {
          activeMember.telegramUserId = numericUserId;
          if (fromInfo?.username) activeMember.telegramUsername = `@${fromInfo.username.replace(/^@/, '')}`;
          activeMember.telegramActivated = true;
        }

        return {
          reply: `👋 **Welcome back, ${activeMember.studentName}!**\n\nYour Telegram profile (ID: \`${numericUserId || 'Linked'}\`) is already securely linked to your ARX IT CLUB OF SJS membership.\n\n• **Member ID:** \`${activeMember.memberId}\`\n• **Class:** ${activeMember.class}\n• **Channel:** ${channelHandle}\n\nUse the quick commands below to navigate:`,
          timestamp: time,
          actions: [
            { label: '📋 My Status', action: '/status' },
            { label: '📚 Courses', action: '/courses' },
            { label: '📅 Workshops', action: '/events' },
            { label: '💻 Member Portal', action: `navigate:${websiteBaseUrl}/#portal` }]

        };
      }

      
      if (numericUserId) {
        this.setUserTelegramState(numericUserId, {
          state: 'AWAITING_MEMBER_ID',
          sessionToken: token,
          memberId: session.memberId,
          studentName: session.studentName
        });
      }

      return {
        reply: `👋 **Welcome to ARX IT CLUB OF SJS, ${session.studentName}!**\n\nWe detected a pending activation request for your student membership.\n\nTo confirm your identity and link your account, please reply with your assigned **Member ID** (e.g. \`${session.memberId}\`).\n\n📢 **Official Channel:** ${channelHandle}`,
        timestamp: time,
        actions: [
          { label: `📢 Join ${channelHandle}`, action: `navigate:${channelUrl}` },
          { label: '💻 Member Login', action: `navigate:${websiteBaseUrl}/#login` }]

      };
    }

    
    if (cmd === '/verify_channel' || cmd === 'verify_channel') {
      const token = payload;
      if (token) {
        const vResult = this.verifyChannelMembershipForSession(token);
        if (vResult.success) {
          return {
            reply: `✅ **Channel Membership Confirmed!**\n\nThank you for following **${channelHandle}**! Your ARX IT CLUB OF SJS membership credentials and notifications are now fully synchronized.`,
            timestamp: time,
            actions: [
              { label: '📋 My Status', action: '/status' },
              { label: '📚 Explore Courses', action: '/courses' },
              { label: '💻 Member Portal', action: `navigate:${websiteBaseUrl}/#portal` }]

          };
        }
      }

      if (member) {
        member.channelVerified = true;
        member.channelVerifiedAt = new Date().toISOString();
      }

      return {
        reply: `✅ **Channel Verification:**\n\nYou are verified on official channel **${channelHandle}**.\nStay tuned for campus workshop and hackathon updates!`,
        timestamp: time,
        actions: [
          { label: '📋 My Status', action: '/status' },
          { label: '📚 Browse Courses', action: '/courses' }]

      };
    }

    
    if (cmd === '/start' || cmd === 'start') {
      if (member) {
        const welcomeTemplate = this.botContent.welcomeMessageMember ||
          `👋 **Welcome back, ${member.studentName}!**\n\nYour ARX IT CLUB OF SJS membership is active and verified.\n• **Member ID:** \`${member.memberId}\`\n• **Class:** ${member.class}\n• **Role:** ${member.role.toUpperCase()}\n• **Official Channel:** ${channelHandle}\n\n**Quick Commands:**\n• \`/status\` — View membership credentials\n• \`/courses\` — Curriculum tracks & progress\n• \`/events\` — Upcoming Lab 3 workshops\n• \`/certificates\` — Verifiable credentials\n• \`/attendance\` — Session attendance\n• \`/announcements\` — Club announcements\n• \`/support\` — Help desk & coordinator contacts`;

        return {
          reply: welcomeTemplate,
          timestamp: time,
          actions: [
            { label: '📋 My Account', action: '/account' },
            { label: '📚 Courses', action: '/courses' },
            { label: '📅 Workshops', action: '/events' },
            { label: '🛡️ Certificates', action: '/certificates' },
            { label: '📊 Attendance', action: '/attendance' },
            { label: '💻 Member Portal', action: `navigate:${websiteBaseUrl}/#portal` }]

        };
      }

      const isRegistrationOpen = this.isRegistrationOpen();
      if (!isRegistrationOpen) {
        const closedTemplate = this.botContent.closedNotice || this.settings.registrationClosedMessage ||
          `⚠️ **ARX IT CLUB OF SJS Registration Currently Closed**\n\nPublic registration for new club members is currently closed for this term.\n\n• If you are already an enrolled student member, please log into the Member Portal to generate your personal activation deep link.\n• To receive notifications when admissions open for the next term, subscribe to our official announcement channel: **${channelHandle}**.`;

        return {
          reply: closedTemplate,
          timestamp: time,
          actions: [
            { label: `📢 Join ${channelHandle}`, action: `navigate:${channelUrl}` },
            { label: '💻 Member Portal Login', action: `navigate:${websiteBaseUrl}/#login` },
            { label: '🌐 Official Website', action: `navigate:${websiteBaseUrl}/` }]

        };
      }

      const openTemplate = this.botContent.welcomeMessageNew ||
        `👋 **Welcome to ARX IT CLUB OF SJS!** (${botHandle})\n\nTo link your student membership and receive verified credentials, please register through our official website first.\n\nUpon completing registration, you will receive your official Member ID and a personalized activation link to connect this Telegram account.\n\n📢 **Official Channel:** **${channelHandle}**`;

      return {
        reply: openTemplate,
        timestamp: time,
        actions: [
          { label: '🌐 Register on Website', action: `navigate:${websiteBaseUrl}/#register` },
          { label: `📢 Join ${channelHandle}`, action: `navigate:${channelUrl}` },
          { label: '💻 Member Login', action: `navigate:${websiteBaseUrl}/#login` },
          { label: '❓ Help & Commands', action: '/help' }]

      };
    }

    
    if (cmd === '/help' || cmd === 'help') {
      const helpText = this.botContent.helpMessage ||
        `🤖 **ARX IT CLUB OF SJS Official Bot Guide** (${botHandle})\n\nOfficial communication & member services layer for ARX IT CLUB OF SJS.\n\n**Available Commands:**\n• \`/start\` — Welcome screen & onboarding\n• \`/menu\` — Interactive quick buttons\n• \`/account\` (or \`/profile\`, \`/status\`) — Membership credentials & enrollments\n• \`/courses\` — Curriculum tracks & learning progress\n• \`/certificates\` — Verifiable certificates & credential IDs\n• \`/attendance\` — Attendance rate & certificate qualification\n• \`/announcements\` — Official club news & channel broadcasts\n• \`/events\` — Hands-on workshops in Computer Lab 3\n• \`/lab\` — Lab location, opening hours & rules\n• \`/support\` (or \`/contact\`) — Help desk & advisor contacts\n• \`/verify <ID>\` — Verify any certificate or member ID\n\n📢 **Announcement Channel:** ${channelHandle}\n🌐 **Website:** ${websiteBaseUrl}`;

      return {
        reply: helpText,
        timestamp: time,
        actions: [
          { label: '📋 Main Menu', action: '/menu' },
          { label: '📚 Courses', action: '/courses' },
          { label: '📅 Workshops', action: '/events' },
          { label: '🛡️ Certificates', action: '/certificates' },
          { label: '📞 Support', action: '/support' }]

      };
    }

    
    if (cmd === '/menu' || cmd === 'menu') {
      return {
        reply: `📋 **ARX IT CLUB OF SJS — Main Navigation Menu**\n\nSelect any option below to access official club services:`,
        timestamp: time,
        actions: [
          { label: '👤 My Account', action: '/account' },
          { label: '📚 Courses', action: '/courses' },
          { label: '📅 Workshops', action: '/events' },
          { label: '🛡️ Certificates', action: '/certificates' },
          { label: '📊 Attendance', action: '/attendance' },
          { label: '📢 Announcements', action: '/announcements' },
          { label: '💻 Lab Guidelines', action: '/lab' },
          { label: '📞 Contact Support', action: '/support' }]

      };
    }

    
    if (cmd === '/dashboard' || cmd === 'dashboard') {
      if (!member) {
        return {
          reply: `ℹ️ Active ARX IT CLUB OF SJS member session not found. Please log in through the portal or link your account using your personalized activation link to access your learning dashboard.`,
          timestamp: time,
          actions: [
            { label: '🌐 Register on Website', action: `navigate:${websiteBaseUrl}/#register` },
            { label: '💻 Member Login', action: `navigate:${websiteBaseUrl}/#login` }]

        };
      }

      const enrollments = this.getMemberEnrollments(member.id);
      const certificates = this.getMemberCertificates(member.id);
      const attendance = this.getMemberAttendance(member.id);
      const presentAtt = attendance.filter((a) => a.status === 'Present').length;
      const attRate = attendance.length > 0 ? Math.round(presentAtt / attendance.length * 100) : 100;
      const completedCourses = enrollments.filter((e) => e.progress === 100 || e.status === 'Completed').length;

      return {
        reply: `📊 **ARX IT CLUB OF SJS — Member Dashboard**\n\n👤 **Student:** ${member.studentName} (\`${member.memberId}\`)\n🏫 **Class:** ${member.class} | **Status:** ${member.status.toUpperCase()} ✅\n\n• 📚 **Active Courses:** ${enrollments.length} enrolled (${completedCourses} completed)\n• 🛡️ **Verified Certificates:** ${certificates.length} issued\n• 📊 **Lab Attendance:** ${attRate}% (${attendance.length} sessions logged)\n• 📢 **Official Channel:** ${channelHandle}\n\n*Tap below to open your interactive web portal or browse course tracks:*`,
        timestamp: time,
        actions: [
          { label: '💻 Open Member Portal', action: `navigate:${websiteBaseUrl}/#portal` },
          { label: '📚 My Courses', action: '/courses' },
          { label: '🛡️ Certificates', action: '/certificates' },
          { label: '📊 Attendance Record', action: '/attendance' }]

      };
    }

    
    if (cmd === '/account' || cmd === '/profile' || cmd === '/status' || cmd === 'status' || cmd === 'account' || cmd === 'profile') {
      if (!member) {
        return {
          reply: `ℹ️ Active ARX IT CLUB OF SJS session not linked. Please register on the website or link your account via \`/start <token>\` to view your personal credentials.`,
          timestamp: time,
          actions: [
            { label: '🌐 Register on Website', action: `navigate:${websiteBaseUrl}/#register` },
            { label: '💻 Member Login', action: `navigate:${websiteBaseUrl}/#login` }]

        };
      }

      const enrollments = this.getMemberEnrollments(member.id);
      const certificates = this.getMemberCertificates(member.id);
      const attendance = this.getMemberAttendance(member.id);
      const totalAtt = attendance.length;
      const presentAtt = attendance.filter((a) => a.status === 'Present').length;
      const attRate = totalAtt > 0 ? Math.round(presentAtt / totalAtt * 100) : 100;

      return {
        reply: `📋 **ARX IT CLUB OF SJS Member Profile**:\n• **Student:** ${member.studentName}\n• **Member ID:** \`${member.memberId}\`\n• **Class:** ${member.class}\n• **Membership Status:** ${member.status.toUpperCase()} ✅\n• **Telegram Handle:** ${member.telegramUsername || 'Not set'}\n• **Telegram User ID:** \`${member.telegramUserId || 'Pending Link'}\`\n• **Official Channel:** ${channelHandle}\n• **Active Enrollments:** ${enrollments.length}\n• **Verified Certificates:** ${certificates.length}\n• **Attendance Rate:** ${attRate}% (${totalAtt} sessions logged)`,
        timestamp: time,
        actions: [
          { label: '📚 My Courses', action: '/courses' },
          { label: '🛡️ My Certificates', action: '/certificates' },
          { label: '📊 Attendance Record', action: '/attendance' },
          { label: '💻 Open Member Portal', action: `navigate:${websiteBaseUrl}/#portal` }]

      };
    }

    
    if (cmd === '/courses' || cmd === 'courses') {
      const courses = this.getCourses(true);
      if (courses.length === 0) {
        return {
          reply: `📚 **ARX Learning Tracks**\nNo technical courses have been published yet by administrators.`,
          timestamp: time
        };
      }

      if (member) {
        const enrollments = this.getMemberEnrollments(member.id);
        const enrolledMap = new Map(enrollments.map((e) => [e.courseId, e]));

        const list = courses.map((c) => {
          const enr = enrolledMap.get(c.id);
          if (enr) {
            return `• **${c.title}** (${c.difficulty}) — Enrolled [${enr.progress}% Completed] ✅`;
          }
          return `• **${c.title}** (${c.difficulty}) — ${c.duration}`;
        }).join('\n');

        return {
          reply: `📚 **ARX Curriculum Tracks** (${courses.length} Available):\n\n${list}\n\n*Log into the Member Portal to access course materials and project submissions.*`,
          timestamp: time,
          actions: [
            { label: '💻 Open Course Portal', action: `navigate:${websiteBaseUrl}/#portal/courses` },
            { label: '📅 Upcoming Workshops', action: '/events' }]

        };
      }

      const list = courses.slice(0, 5).map((c) => `• **${c.title}** (${c.difficulty}) — ${c.duration}`).join('\n');
      return {
        reply: `📚 **Active ARX Curriculum Tracks**:\n${list}`,
        timestamp: time,
        actions: [{ label: 'Explore All Courses', action: `navigate:${websiteBaseUrl}/#courses` }]
      };
    }

    
    if (cmd === '/certificates' || cmd === '/certs' || cmd === 'certificates') {
      if (!member) {
        return {
          reply: `🛡️ **ARX IT CLUB OF SJS Verifiable Certificates**:\nAll students completing an official curriculum track with >=80% attendance receive an academic landscape certificate stamped with a cryptographic verification QR code.\n\nPlease link your member account via \`/start <token>\` to view issued credentials.`,
          timestamp: time,
          actions: [{ label: 'Member Login', action: `navigate:${websiteBaseUrl}/#login` }]
        };
      }

      const certificates = this.getMemberCertificates(member.id);
      if (certificates.length === 0) {
        return {
          reply: `🛡️ **ARX IT CLUB OF SJS Certificates**:\nNo certificates have been issued to your account yet. Complete an enrolled course with full attendance to receive an official verifiable credential!`,
          timestamp: time,
          actions: [{ label: 'Browse Courses', action: '/courses' }]
        };
      }

      const certsList = certificates.map((c) =>
        `• **${c.courseTitle || c.courseName}**\n  ID: \`${c.certificateId}\` (Issued: ${c.issueDate})\n  Verify: /verify ${c.certificateId}`
      ).join('\n\n');

      return {
        reply: `🛡️ **Your Verified ARX Certificates** (${certificates.length}):\n\n${certsList}`,
        timestamp: time,
        actions: [
          { label: 'View in Portal', action: `navigate:${websiteBaseUrl}/#portal/certificates` },
          { label: 'Public Verifier', action: `navigate:${websiteBaseUrl}/#certificates` }]

      };
    }

    
    if (cmd === '/attendance' || cmd === 'attendance') {
      if (!member) {
        return {
          reply: `ℹ️ Please link your member account to inspect your session attendance.`,
          timestamp: time,
          actions: [{ label: 'Member Login', action: `navigate:${websiteBaseUrl}/#login` }]
        };
      }

      const records = this.getMemberAttendance(member.id);
      const total = records.length;
      const present = records.filter((r) => r.status === 'Present').length;
      const rate = total > 0 ? Math.round(present / total * 100) : 100;

      return {
        reply: `📊 **ARX Attendance Record** (${member.studentName}):\n• **Sessions Logged:** ${total}\n• **Present:** ${present}\n• **Attendance Rate:** ${rate}%\n• **Status:** ${rate >= 75 ? 'Good Standing ✅' : 'Warning ⚠️'}\n\n*Note: 80% attendance is required for certificate eligibility.*`,
        timestamp: time,
        actions: [
          { label: 'Portal Dashboard', action: `navigate:${websiteBaseUrl}/#portal/dashboard` },
          { label: 'Lab Guidelines', action: '/lab' }]

      };
    }

    
    if (cmd === '/assignments' || cmd === 'assignments' || cmd === '/homework' || cmd === 'homework') {
      if (!member) {
        return {
          reply: `ℹ️ Please link your member account via /start to inspect course assignments and homework.`,
          timestamp: time,
          actions: [{ label: 'Member Login', action: `navigate:${websiteBaseUrl}/#login` }]
        };
      }

      const enrollments = this.getMemberEnrollments(member.id);
      const courseIds = enrollments.map((e) => e.courseId);
      const memberAssignments = Array.from(this.assignments.values()).filter(
        (a) => a.isPublished && (courseIds.length === 0 || courseIds.includes(a.courseId))
      );
      const submissions = this.getMemberSubmissions(member.id);

      if (memberAssignments.length === 0) {
        return {
          reply: `📝 **Course Assignments** (${member.studentName}):\nNo active homework assignments for your enrolled courses right now. Check back after your next lab session!`,
          timestamp: time,
          actions: [{ label: 'Member Portal', action: `navigate:${websiteBaseUrl}/#portal` }]
        };
      }

      const list = memberAssignments.slice(0, 4).map((a) => {
        const sub = submissions.find((s) => s.assignmentId === a.id);
        const subStatus = sub ? `[${sub.status}${sub.score !== undefined ? ` — ${sub.score}/100` : ''}] ✅` : '[Pending Submission] ⏳';
        return `• **${a.title}** (${a.courseTitle})\n  Deadline: ${new Date(a.deadline).toLocaleDateString()}\n  Status: ${subStatus}`;
      }).join('\n\n');

      return {
        reply: `📝 **Course Assignments & Homework** (${member.studentName}):\n\n${list}\n\n*Submit assignment files through your Member Portal dashboard.*`,
        timestamp: time,
        actions: [
          { label: '💻 Open Member Portal', action: `navigate:${websiteBaseUrl}/#portal` },
          { label: '📚 My Courses', action: '/courses' }]

      };
    }

    if (cmd === '/submitproject' || cmd === '/submit' || cmd === '/project') {
      return {
        reply: `🚀 **ARX Student Project Submission**\n\nYou can submit your software, robotics, web, Python, or IT projects directly to club instructors and the President for review!\n\n**How to submit via Telegram:**\n1️⃣ Send your project file (**ZIP**, **PDF**, **code file**, or **document**) to this chat.\n2️⃣ Include a caption with your **Project Title** and a brief description.\n\nThe bot will automatically transfer your submission to the **Student Project Review Panel** on the Admin page!`,
        timestamp: time,
        actions: [
          { label: '📂 View My Submissions', action: '/myprojects' },
          { label: '📋 Main Menu', action: '/menu' }
        ]
      };
    }

    if (cmd === '/myprojects' || cmd === 'myprojects') {
      const allSubmissions = this.getStudentProjectSubmissions();
      const mySubmissions = allSubmissions.filter(s =>
        (numericUserId && s.telegramUserId === numericUserId) ||
        (member && (s.memberId === member.id || s.memberId === member.memberId))
      );

      if (mySubmissions.length === 0) {
        return {
          reply: `📂 **Your Project Submissions**\n\nYou have not submitted any projects yet.\n\nTo submit a project for admin review, simply send your project file (ZIP, PDF, document) with a caption or type \`/submitproject\`.`,
          timestamp: time,
          actions: [
            { label: '🚀 Submit Project', action: '/submitproject' },
            { label: '📋 Main Menu', action: '/menu' }
          ]
        };
      }

      let projectsText = `📂 **Your Submitted Projects (${mySubmissions.length})**:\n\n`;
      mySubmissions.slice(0, 5).forEach((p, idx) => {
        const statusEmojis = {
          approved: '✅ Approved',
          needs_revision: '✏️ Needs Revision',
          rejected: '❌ Not Accepted',
          pending: '⏳ Pending Review'
        };
        const statusLabel = statusEmojis[p.status] || p.status;
        projectsText += `${idx + 1}. **${p.title}**\n• **File:** \`${p.fileName}\`\n• **Status:** ${statusLabel}\n` +
          (p.reviewNotes ? `• **Feedback:** _${p.reviewNotes}_\n` : '') +
          `• **Submitted:** ${new Date(p.submittedAt).toLocaleDateString()}\n\n`;
      });

      return {
        reply: projectsText,
        timestamp: time,
        actions: [
          { label: '🚀 Submit Another Project', action: '/submitproject' },
          { label: '📋 Main Menu', action: '/menu' }
        ]
      };
    }

    
    if (cmd === '/announcements' || cmd === 'announcements' || cmd === '/broadcasts') {
      const broadcasts = this.getTelegramBroadcasts().slice(0, 3);
      if (broadcasts.length === 0) {
        return {
          reply: `📢 **Official Announcements**:\nNo active announcements. Follow ${channelHandle} for updates!`,
          timestamp: time
        };
      }
      const list = broadcasts.map((b) => `📢 **${b.tags.join(' ')}** (${b.date}):\n${b.content}`).join('\n\n---\n\n');
      return {
        reply: `📢 **Latest Announcements from ${channelHandle}**:\n\n${list}`,
        timestamp: time,
        actions: [{ label: `Join ${channelHandle}`, action: `navigate:${channelUrl}` }]
      };
    }

    
    if (cmd === '/events' || cmd === 'events' || cmd === 'workshops' || cmd === '/workshops') {
      const events = this.getEvents(true).filter((e) => e.status === 'Upcoming');
      if (events.length === 0) {
        return {
          reply: `📅 **ARX Events Calendar**\nNo upcoming workshops are currently scheduled. Stay tuned to **${channelHandle}** for the next announcement!`,
          timestamp: time
        };
      }

      const list = events.slice(0, 3).map((e) => `• **${e.title}** (${e.formattedDate.month} ${e.formattedDate.day}) — ${e.location}`).join('\n');
      return {
        reply: `📅 **Upcoming ARX Workshops**:\n${list}\n\n*Workstations in Computer Lab 3 are allocated on a first-come basis.*`,
        timestamp: time,
        actions: [{ label: 'Register for Events', action: `navigate:${websiteBaseUrl}/#events` }]
      };
    }

    
    if (cmd === '/resources' || cmd === 'resources') {
      const resList = this.getClubResources();
      const list = resList.map((r) => `• **${r.title}** (${r.format}, ${r.fileSize})`).join('\n');
      return {
        reply: `📁 **ARX Technical Resources**:\n${list}\n\nAll files can be accessed directly in the portal resources section.`,
        timestamp: time,
        actions: [{ label: 'View Resources Section', action: `navigate:${websiteBaseUrl}/#resources` }]
      };
    }

    
    if (cmd === '/lab' || cmd === 'lab' || cmd === 'hours' || cmd === '/hours') {
      return {
        reply: `💻 **ARX Computer Lab 3 Guidelines**:\n• **Location:** Computer Lab 3, Highschool (Second Floor)\n• **Hours:** Monday to Tuesday: 3:30 PM – 5:30 PM\n• **Network:** ARX-Secure-WLAN (WPA2-Enterprise)\n• **Channel Feed:** ${channelHandle}\n• **Policies:** Workstations must be cleared after sessions; commit work to club repositories responsibly.`,
        timestamp: time
      };
    }

    
    if (cmd === '/contact' || cmd === '/support' || cmd === 'contact' || cmd === 'support') {
      const supportTemplate = this.botContent.supportMessage ||
        `📞 **ARX IT CLUB OF SJS Contact & Support**:\n• **Email:** ${settings.contactEmail || 'contact@arx-website-sjs.vercel.app'}\n• **Phone:** ${settings.contactPhone || '+1 (555) 234-5678'}\n• **Lab Location:** ${settings.meetingLocation || 'Computer Lab 3, Highschool'}\n• **Schedule:** ${settings.meetingSchedule || 'Monday to Tuesday: 3:30 PM – 5:30 PM'}\n• **Official Channel:** ${channelHandle}\n• **Bot:** ${botHandle}`;

      return {
        reply: supportTemplate,
        timestamp: time,
        actions: [
          { label: 'Contact Page', action: `navigate:${websiteBaseUrl}/#contact` },
          { label: `Join ${channelHandle}`, action: `navigate:${channelUrl}` }]

      };
    }

    
    if (cmd === '/verify') {
      if (!payload) {
        return {
          reply: `🔍 **ARX Verification Service**:\nPlease provide an ID to verify, e.g. \`/verify ITC-PY-2026-00001\` or \`/verify ARX-2026-1042\`.`,
          timestamp: time
        };
      }

      const searchId = payload.toUpperCase();
      const cert = this.getCertificateById(searchId);
      if (cert) {
        return {
          reply: `✅ **Verified ARX Certificate Found**:\n• **Certificate ID:** \`${cert.certificateId}\`\n• **Student:** ${cert.studentName}\n• **Course:** ${cert.courseTitle || cert.courseName}\n• **Issue Date:** ${cert.issueDate}\n• **Authority:** ${cert.authorizedSignatures?.[0]?.name || 'Academic Director'}`,
          timestamp: time,
          actions: [{ label: 'Verify Online', action: `navigate:${websiteBaseUrl}/#certificates?id=${cert.certificateId}` }]
        };
      }

      const foundMember = this.findMemberByMemberId(searchId);
      if (foundMember) {
        return {
          reply: `✅ **Active Member Record Found**:\n• **Member ID:** \`${foundMember.memberId}\`\n• **Student:** ${foundMember.studentName}\n• **Class:** ${foundMember.class}\n• **Status:** ${foundMember.status.toUpperCase()} ✅\n• **Telegram Linked:** ${foundMember.telegramActivated ? 'Yes ✅' : 'Pending Link'}`,
          timestamp: time
        };
      }

      return {
        reply: `🔍 No certificate or member ID matching \`${payload}\` was found in the official registry.`,
        timestamp: time
      };
    }

    
    if (cmd === '/tickets' || cmd === 'tickets') {
      return {
        reply: `🎫 **ARX IT CLUB OF SJS — Support & Help Desk**\n\nNeed technical assistance, equipment access, or advisor guidance?\n\n• **Email:** ${settings.contactEmail || 'contact@arx-website-sjs.vercel.app'}\n• **Lab Advisory:** ${settings.meetingLocation || 'Computer Lab 3, Highschool'}\n• **Hours:** ${settings.meetingSchedule || 'Monday to Tuesday: 3:30 PM – 5:30 PM'}\n• **Faculty Lead:** St. Joseph School Dept. of Computer Science\n• **Official Channel:** ${channelHandle}\n\nOur student coordinators and faculty advisors are available during regular lab hours.`,
        timestamp: time,
        actions: [
          { label: '📞 Contact Page', action: `navigate:${websiteBaseUrl}/#contact` },
          { label: `Join ${channelHandle}`, action: `navigate:${channelUrl}` }]

      };
    }

    
    if (cmd === '/settings' || cmd === 'settings') {
      if (!member) {
        return {
          reply: `⚙️ **ARX Bot Settings**\n\n• Official Bot: ${botHandle}\n• Official Channel: ${channelHandle}\n• Website: ${websiteBaseUrl}\n\nPlease log in or link your membership to manage account-specific preferences.`,
          timestamp: time,
          actions: [{ label: 'Member Login', action: `navigate:${websiteBaseUrl}/#login` }]
        };
      }

      return {
        reply: `⚙️ **ARX IT CLUB OF SJS Member Settings**\n\n• **Student:** ${member.studentName} (\`${member.memberId}\`)\n• **Class:** ${member.class}\n• **Telegram User ID:** \`${member.telegramUserId || 'Pending Link'}\`\n• **Telegram Handle:** ${member.telegramUsername || 'Not set'}\n• **Channel Sync:** ${member.channelVerified ? 'Verified ✅' : 'Pending ⏳'}\n\nTo update your profile or change your password, visit the Member Portal:`,
        timestamp: time,
        actions: [
          { label: '🔐 Change Password', action: `navigate:${websiteBaseUrl}/#portal/change-password` },
          { label: '👤 Edit Profile', action: `navigate:${websiteBaseUrl}/#portal/profile` },
          { label: '💻 Portal Home', action: `navigate:${websiteBaseUrl}/#portal` }]

      };
    }

    
    if (cmd === '/website' || cmd === 'website') {
      return {
        reply: `🌐 **ARX IT CLUB OF SJS Official Website**\n\nVisit our official school IT Club portal to explore courses, student projects, workshop schedules, and verify certificates:\n${websiteBaseUrl}`,
        timestamp: time,
        actions: [
          { label: '🌐 Open Website', action: `navigate:${websiteBaseUrl}/` },
          { label: '💻 Member Portal', action: `navigate:${websiteBaseUrl}/#portal` }]

      };
    }

    
    if (cmd === '/channel' || cmd === 'channel') {
      return {
        reply: `📢 **Official ARX IT CLUB OF SJS Channel**\n\nJoin our official Telegram announcement channel to receive schedules, workshop invites, and technical notices:\n*${channelHandle}* (${channelUrl})`,
        timestamp: time,
        actions: [
          { label: `📢 Join ${channelHandle}`, action: `navigate:${channelUrl}` },
          { label: '✅ Verify Membership', action: '/verify_channel' }]

      };
    }

    
    const cleanPossibleId = cmd.replace(/^\//, '').trim();
    if (cleanPossibleId.startsWith('arx') || /^arx[-_\s][a-z0-9]{4}[-_\s][a-z0-9]{4}$/i.test(cleanPossibleId)) {
      const found = this.findMemberByMemberId(cleanPossibleId);
      if (found) {
        if (found.status === 'pending') {
          return {
            reply: `👋 Hello, **${found.studentName}**!\n\n• **Member ID:** \`${found.memberId}\`\n• **Class:** ${found.class}\n• **Status:** ⏳ **Pending Admin Approval**\n\nYour application has been received and is waiting for administrator approval. Once approved, you will be able to activate your student credentials.\n\n📢 In the meantime, join our official announcement channel: ${channelHandle}`,
            timestamp: time,
            actions: [
              { label: `📢 Join ${channelHandle}`, action: `navigate:${channelUrl}` },
              { label: '📋 Main Menu', action: '/menu' }
            ]
          };
        }
        return {
          reply: `👋 Hello, **${found.studentName}**!\n\n• **Member ID:** \`${found.memberId}\`\n• **Class:** ${found.class}\n• **Status:** ${found.status.toUpperCase()}\n\nYou can log in to the Member Portal with your Member ID and password:`,
          timestamp: time,
          actions: [
            { label: '💻 Member Portal', action: `navigate:${websiteBaseUrl}/#login` },
            { label: '📋 Main Menu', action: '/menu' }
          ]
        };
      } else {
        return {
          reply: `⚠️ **Member ID Not Recognized**\n\nWe could not find any membership matching ID: \`${cleanPossibleId.toUpperCase()}\`.\n\nPlease check your registration confirmation for your assigned Member ID (e.g. \`ARX-XXXX_XXXX\`).`,
          timestamp: time,
          actions: [
            { label: '🌐 Register Online', action: `navigate:${websiteBaseUrl}/#register` },
            { label: '❓ Help & Commands', action: '/help' }
          ]
        };
      }
    }

    
    return {
      reply: `I don't recognize that command. Use /help to see the available options.`,
      timestamp: time,
      actions: [
        { label: '❓ Help & Commands', action: '/help' },
        { label: '📋 Main Menu', action: '/menu' },
        { label: '📋 My Status', action: '/status' }]

    };
  }

  
  getClubResources() {
    return Array.from(this.clubResources.values());
  }

  
  getAllMedia(params) {
    let list = Array.from(this.media.values());

    if (params?.category && params.category !== 'All') {
      const cat = params.category.toLowerCase();
      list = list.filter((m) => m.category.toLowerCase() === cat);
    }

    if (params?.q && params.q.trim()) {
      const query = params.q.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.filename.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query) ||
          m.altText.toLowerCase().includes(query) ||
          m.tags && m.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getMediaById(id) {
    return this.media.get(id);
  }

  createMedia(data) {
    const now = new Date().toISOString();
    const id = data.id || `med_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const item = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.media.set(item.id, item);
    return item;
  }

  updateMedia(id, updates) {
    const item = this.media.get(id);
    if (!item) return null;
    Object.assign(item, updates, { updatedAt: new Date().toISOString() });
    return item;
  }

  replaceMediaFile(
    mediaId,
    updates) {
    const item = this.media.get(mediaId);
    if (!item) return null;

    const oldUrl = item.url;
    Object.assign(item, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    
    this.replaceMediaEverywhere(oldUrl, updates.url, item.id);
    return item;
  }

  getImageUsage(mediaIdOrUrl) {
    const locations = [];
    const media =
      this.media.get(mediaIdOrUrl) ||
      Array.from(this.media.values()).find((m) => m.url === mediaIdOrUrl || m.filename === mediaIdOrUrl);
    const targetUrl = media ? media.url : mediaIdOrUrl;
    const targetId = media ? media.id : mediaIdOrUrl;

    
    for (const c of this.courses.values()) {
      if (c.thumbnailUrl === targetUrl || c.thumbnailMediaId === targetId) {
        locations.push({ type: 'Course', id: c.id, name: c.title, field: 'Course Thumbnail' });
      }
      if (c.bannerUrl === targetUrl || c.bannerMediaId === targetId) {
        locations.push({ type: 'Course', id: c.id, name: c.title, field: 'Course Banner' });
      }
    }

    
    for (const p of this.projects.values()) {
      if (p.imageUrl === targetUrl || p.mediaId === targetId) {
        locations.push({ type: 'Project', id: p.id, name: p.title, field: 'Project Thumbnail' });
      }
      if (p.galleryImages && Array.isArray(p.galleryImages) && p.galleryImages.includes(targetUrl)) {
        locations.push({ type: 'Project', id: p.id, name: p.title, field: 'Project Gallery' });
      }
    }

    
    for (const e of this.events.values()) {
      if (e.coverImageUrl === targetUrl || e.imageUrl === targetUrl || e.mediaId === targetId) {
        locations.push({ type: 'Event', id: e.id, name: e.title, field: 'Event Cover Image' });
      }
      if (e.galleryImages && Array.isArray(e.galleryImages) && e.galleryImages.includes(targetUrl)) {
        locations.push({ type: 'Event', id: e.id, name: e.title, field: 'Event Gallery' });
      }
    }

    
    for (const a of this.achievements.values()) {
      if (a.imageUrl === targetUrl || a.mediaId === targetId) {
        locations.push({ type: 'Achievement', id: a.id, name: a.title, field: 'Achievement Image' });
      }
    }

    
    for (const cert of this.certificates.values()) {
      if (cert.templateImageUrl === targetUrl || cert.stampImageUrl === targetUrl) {
        locations.push({
          type: 'Certificate',
          id: cert.id,
          name: `Certificate: ${cert.courseName}`,
          field: 'Certificate Stamp/Template'
        });
      }
    }

    
    if (this.settings.logoUrl === targetUrl) {
      locations.push({ type: 'Settings', id: 'branding', name: 'Website Settings', field: 'ARX Official Logo' });
    }
    if (this.settings.compactLogoUrl === targetUrl) {
      locations.push({ type: 'Settings', id: 'branding', name: 'Website Settings', field: 'Compact Logo Badge' });
    }
    if (this.settings.symbolMarkUrl === targetUrl) {
      locations.push({ type: 'Settings', id: 'branding', name: 'Website Settings', field: 'Symbol Mark' });
    }
    if (this.settings.heroBannerUrl === targetUrl) {
      locations.push({ type: 'Settings', id: 'branding', name: 'Website Settings', field: 'Hero Banner' });
    }
    if (this.settings.aboutHeroImageUrl === targetUrl) {
      locations.push({ type: 'Settings', id: 'branding', name: 'Website Settings', field: 'About Lab Facility Photo' });
    }
    if (this.settings.aboutTeamImageUrl === targetUrl) {
      locations.push({ type: 'Settings', id: 'branding', name: 'Website Settings', field: 'About Team Photo' });
    }
    if (this.settings.certificateStampUrl === targetUrl) {
      locations.push({ type: 'Settings', id: 'branding', name: 'Website Settings', field: 'Certificate Official Seal' });
    }

    return {
      isUsed: locations.length > 0,
      inUse: locations.length > 0,
      count: locations.length,
      locations
    };
  }

  replaceMediaEverywhere(oldMediaIdOrUrl, newUrl, newMediaId) {
    const media =
      this.media.get(oldMediaIdOrUrl) ||
      Array.from(this.media.values()).find((m) => m.url === oldMediaIdOrUrl || m.filename === oldMediaIdOrUrl);
    const targetUrl = media ? media.url : oldMediaIdOrUrl;
    const targetId = media ? media.id : oldMediaIdOrUrl;
    let count = 0;

    
    for (const c of this.courses.values()) {
      if (c.thumbnailUrl === targetUrl || c.thumbnailMediaId === targetId) {
        c.thumbnailUrl = newUrl;
        if (newMediaId) c.thumbnailMediaId = newMediaId;
        count++;
      }
      if (c.bannerUrl === targetUrl || c.bannerMediaId === targetId) {
        c.bannerUrl = newUrl;
        if (newMediaId) c.bannerMediaId = newMediaId;
        count++;
      }
    }

    
    for (const p of this.projects.values()) {
      if (p.imageUrl === targetUrl || p.mediaId === targetId) {
        p.imageUrl = newUrl;
        if (newMediaId) p.mediaId = newMediaId;
        count++;
      }
      if (p.galleryImages && Array.isArray(p.galleryImages) && p.galleryImages.includes(targetUrl)) {
        p.galleryImages = p.galleryImages.map((img) => img === targetUrl ? newUrl : img);
        count++;
      }
    }

    
    for (const e of this.events.values()) {
      if (e.coverImageUrl === targetUrl || e.imageUrl === targetUrl || e.mediaId === targetId) {
        e.coverImageUrl = newUrl;
        e.imageUrl = newUrl;
        if (newMediaId) e.mediaId = newMediaId;
        count++;
      }
      if (e.galleryImages && Array.isArray(e.galleryImages) && e.galleryImages.includes(targetUrl)) {
        e.galleryImages = e.galleryImages.map((img) => img === targetUrl ? newUrl : img);
        count++;
      }
    }

    
    for (const a of this.achievements.values()) {
      if (a.imageUrl === targetUrl || a.mediaId === targetId) {
        a.imageUrl = newUrl;
        if (newMediaId) a.mediaId = newMediaId;
        count++;
      }
    }

    
    for (const cert of this.certificates.values()) {
      if (cert.templateImageUrl === targetUrl) {
        cert.templateImageUrl = newUrl;
        count++;
      }
      if (cert.stampImageUrl === targetUrl) {
        cert.stampImageUrl = newUrl;
        count++;
      }
    }

    
    if (this.settings.logoUrl === targetUrl) {
      this.settings.logoUrl = newUrl;
      count++;
    }
    if (this.settings.compactLogoUrl === targetUrl) {
      this.settings.compactLogoUrl = newUrl;
      count++;
    }
    if (this.settings.symbolMarkUrl === targetUrl) {
      this.settings.symbolMarkUrl = newUrl;
      count++;
    }
    if (this.settings.heroBannerUrl === targetUrl) {
      this.settings.heroBannerUrl = newUrl;
      count++;
    }
    if (this.settings.aboutHeroImageUrl === targetUrl) {
      this.settings.aboutHeroImageUrl = newUrl;
      count++;
    }
    if (this.settings.aboutTeamImageUrl === targetUrl) {
      this.settings.aboutTeamImageUrl = newUrl;
      count++;
    }
    if (this.settings.certificateStampUrl === targetUrl) {
      this.settings.certificateStampUrl = newUrl;
      count++;
    }

    return count;
  }

  deleteMedia(
    id,
    force = false) {
    const item = this.media.get(id);
    if (!item) {
      return { success: false, message: 'Image not found.', inUse: false };
    }

    const usage = this.getImageUsage(id);
    if (usage.isUsed && !force) {
      return {
        success: false,
        inUse: true,
        message: `This image is currently used by ${usage.count} items. Please replace or remove those references first before deleting.`,
        locations: usage.locations
      };
    }

    this.media.delete(id);
    return { success: true, message: 'Image deleted successfully.', inUse: false };
  }
}

export const db = new DatabaseStore();
