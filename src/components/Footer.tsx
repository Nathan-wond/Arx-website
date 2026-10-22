import React, { useEffect, useState } from 'react';
import { useRouter } from '../context/RouterContext.tsx';
import { api } from '../services/api.js';
import Icon from './Icon.tsx';
import { ADMIN_LOGIN_PATH, PRESIDENT_LOGIN_PATH } from '../config/adminRoute.js';

interface FooterSettings {
  clubName: string;
  tagline: string;
  description: string;
  footerText: string;
  telegramBotUsername: string;
  telegramBotUrl: string;
  telegramChannelUrl: string;
  telegramChannelName: string;
  meetingLocation: string;
  meetingSchedule: string;
}

interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
}

export const Footer: React.FC = () => {
  const { navigate } = useRouter();
  const [settings, setSettings] = useState<FooterSettings>({
    clubName: 'ARX IT CLUB',
    tagline: 'Learn. Build. Grow.',
    description: 'Empowering students with practical coding workshops, project mentorship, and verifiable technical credentials.',
    footerText: 'Official ARX IT CLUB. Empowering the next generation of builders.',
    telegramBotUsername: 'ARXITCLUB_bot',
    telegramBotUrl: 'https://t.me/ARXITCLUB_bot',
    telegramChannelUrl: 'https://t.me/arxitclub',
    telegramChannelName: '@arxitclub',
    meetingLocation: 'Computer Lab 3, Highschool',
    meetingSchedule: 'Monday to Tuesday · 3:30 PM – 5:30 PM'
  });
  const [socials, setSocials] = useState<SocialLink[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.getPublicSettings().catch(() => ({ settings: null })),
      api.getPublicSocialLinks().catch(() => ({ socialLinks: [] }))
    ]).then(([settingsRes, socialRes]: [any, any]) => {
      if (!mounted) return;
      if (settingsRes?.settings) {
        setSettings(prev => ({
          ...prev,
          ...settingsRes.settings,
          clubName: settingsRes.settings.clubName === 'ARX IT CLUB OF SJS' ? 'ARX IT CLUB' : (settingsRes.settings.clubName || prev.clubName)
        }));
      }
      if (socialRes?.socialLinks) {
        const filtered = socialRes.socialLinks.filter((l: any) => {
          const plat = (l.platform || '').toLowerCase();
          const url = (l.url || '').toLowerCase();
          return !plat.includes('github') && !plat.includes('youtube') && !url.includes('itclub.school.edu') && !url.includes('github.com') && !url.includes('youtube.com');
        });
        setSocials(filtered);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const getPlatformIcon = (platform: string) => {
    const key = (platform || '').toLowerCase();
    if (key.includes('telegram') || key === 'send') return <Icon name="Send" className="w-3.5 h-3.5" />;
    if (key.includes('instagram')) return <Icon name="Instagram" className="w-3.5 h-3.5 text-pink-500" />;
    if (key.includes('facebook')) return <Icon name="Facebook" className="w-3.5 h-3.5 text-blue-600" />;
    if (key.includes('linkedin')) return <Icon name="Linkedin" className="w-3.5 h-3.5 text-blue-500" />;
    if (key.includes('twitter') || key === 'x') return <Icon name="Twitter" className="w-3.5 h-3.5 text-cyan-500" />;
    if (key.includes('globe') || key.includes('web')) return <Icon name="Globe" className="w-3.5 h-3.5 text-emerald-500" />;
    return <Icon name="Share2" className="w-3.5 h-3.5" />;
  };

  const displayName = settings.clubName === 'ARX IT CLUB OF SJS' ? 'ARX IT CLUB' : (settings.clubName || 'ARX IT CLUB');

  return (
    <footer className="bg-[#EFE6DE]/70 dark:bg-[#0A211A] text-[#282828]/75 dark:text-white border-t border-[#282828]/10 dark:border-[#25473C] mt-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Col 1: Official Logo, Brand & About */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              {/* Official ARX IT Club Logo */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] p-0.5 shadow-xs">
                <img
                  src="/assets/arx-logo-light.jpg"
                  alt="ARX IT CLUB Official Logo"
                  className="w-full h-full object-cover rounded-lg dark:hidden"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/arx-primary-logo.png';
                  }}
                />
                <img
                  src="/assets/arx-logo-dark.jpg"
                  alt="ARX IT CLUB Official Logo"
                  className="w-full h-full object-cover rounded-lg hidden dark:block"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/arx-primary-logo.png';
                  }}
                />
              </div>
              <div>
                <span className="font-bold text-base sm:text-lg text-[#282828] dark:text-white font-sans tracking-tight block">
                  {displayName}
                </span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#FC6454] dark:text-[#82CBB2] font-semibold">
                  {settings.tagline}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#282828]/70 dark:text-white leading-relaxed max-w-sm">
              {settings.description}
            </p>

            <div className="p-3.5 rounded-lg bg-white/70 dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] text-xs space-y-1.5 max-w-sm transition-colors">
              <div className="flex items-center gap-2 text-[#282828] dark:text-white font-medium">
                <Icon name="MapPin" className="w-3.5 h-3.5 text-[#FC6454] dark:text-[#6BB89E]" />
                <span>{settings.meetingLocation}</span>
              </div>
              <div className="flex items-center gap-2 text-[#282828]/60 dark:text-white text-[11px] font-mono">
                <Icon name="Clock" className="w-3.5 h-3.5" />
                <span>{settings.meetingSchedule}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Navigation Directory (No achievements) */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#282828] dark:text-white font-mono">
              Directory
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigate('/')} className="text-[#282828]/70 dark:text-white hover:text-[#FC6454] dark:hover:text-[#82CBB2] transition-colors cursor-pointer border-0 bg-transparent p-0">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/about')} className="text-[#282828]/70 dark:text-white hover:text-[#FC6454] dark:hover:text-[#82CBB2] transition-colors cursor-pointer border-0 bg-transparent p-0">
                  About ARX
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/courses')} className="text-[#282828]/70 dark:text-white hover:text-[#FC6454] dark:hover:text-[#82CBB2] transition-colors cursor-pointer border-0 bg-transparent p-0">
                  Curriculum Tracks
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/projects')} className="text-[#282828]/70 dark:text-white hover:text-[#FC6454] dark:hover:text-[#82CBB2] transition-colors cursor-pointer border-0 bg-transparent p-0">
                  Student Repositories
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/events')} className="text-[#282828]/70 dark:text-white hover:text-[#FC6454] dark:hover:text-[#82CBB2] transition-colors cursor-pointer border-0 bg-transparent p-0">
                  Events &amp; Workshops
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/contact')} className="text-[#282828]/70 dark:text-white hover:text-[#FC6454] dark:hover:text-[#82CBB2] transition-colors cursor-pointer border-0 bg-transparent p-0">
                  Contact &amp; Location
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Student Portal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#282828] dark:text-white font-mono">
              Student Desk
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigate('/login')} className="text-[#282828]/70 dark:text-white hover:text-[#FC6454] dark:hover:text-[#82CBB2] transition-colors cursor-pointer border-0 bg-transparent p-0">
                  Member Login
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/register')} className="text-[#282828]/70 dark:text-white hover:text-[#FC6454] dark:hover:text-[#82CBB2] transition-colors cursor-pointer border-0 bg-transparent p-0">
                  Apply for Membership
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/activate')} className="text-[#282828]/70 dark:text-white hover:text-[#FC6454] dark:hover:text-[#82CBB2] transition-colors cursor-pointer border-0 bg-transparent p-0">
                  Account Activation
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/certificates')} className="text-[#282828]/70 dark:text-white hover:text-[#FC6454] dark:hover:text-[#82CBB2] transition-colors cursor-pointer border-0 bg-transparent p-0">
                  Verify Certificate
                </button>
              </li>
              <li className="pt-2 border-t border-[#282828]/10 dark:border-[#25473C]">
                <button onClick={() => navigate(ADMIN_LOGIN_PATH)} className="text-[#282828]/50 hover:text-[#282828] dark:text-white dark:hover:text-[#F1F7F4] font-mono text-[11px] transition-colors cursor-pointer border-0 bg-transparent p-0">
                  Staff Desk
                </button>
              </li>
              <li>
                <button onClick={() => navigate(PRESIDENT_LOGIN_PATH)} className="text-amber-700/80 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200 font-mono text-[11px] transition-colors cursor-pointer border-0 bg-transparent p-0">
                  President Clearance
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Community & Telegram Hub */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#282828] dark:text-white font-mono">
              Telegram Network
            </h4>
            <div className="space-y-2 text-xs">
              <a
                href={settings.telegramBotUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-lg bg-white/70 dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] hover:border-[#FC6454]/40 dark:hover:border-[#366656] transition-colors"
              >
                <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-[#15362B] text-blue-600 dark:text-[#58B889] flex items-center justify-center shrink-0">
                  <Icon name="Bot" className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-[11px] text-[#282828] dark:text-white block truncate">
                    @{settings.telegramBotUsername}
                  </span>
                  <span className="text-[10px] text-[#282828]/60 dark:text-white">
                    Instant bot check-in &amp; ID
                  </span>
                </div>
              </a>

              <a
                href={settings.telegramChannelUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-lg bg-white/70 dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] hover:border-[#FC6454]/40 dark:hover:border-[#366656] transition-colors"
              >
                <div className="w-7 h-7 rounded-md bg-cyan-50 dark:bg-[#15362B] text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <Icon name="Send" className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-[11px] text-[#282828] dark:text-white block truncate">
                    {settings.telegramChannelName}
                  </span>
                  <span className="text-[10px] text-[#282828]/60 dark:text-white">
                    Club announcements stream
                  </span>
                </div>
              </a>

              {socials.length > 0 && (
                <div className="pt-2 flex items-center gap-2 flex-wrap">
                  {socials.map((s, idx) => (
                    <a
                      key={idx}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-md bg-white/80 dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] hover:text-[#FC6454] dark:hover:text-[#6BB89E] transition-colors"
                      title={s.platform}
                    >
                      {getPlatformIcon(s.platform)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[#282828]/10 dark:border-[#25473C] flex flex-col sm:flex-row items-center justify-between text-xs text-[#282828]/60 dark:text-white gap-3">
          <p>&copy; {new Date().getFullYear()} {displayName}. All rights reserved.</p>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>School IT Club Organization</span>
            <span>&bull;</span>
            <button onClick={() => navigate('/certificates')} className="hover:underline cursor-pointer border-0 bg-transparent p-0 text-inherit">
              Public Verification
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
