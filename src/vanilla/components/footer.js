import { api } from '../../services/api.js';
import { icon } from '../icons.js';

let footerSettings = {
  clubName: 'ARX IT CLUB',
  tagline: 'Learn. Build. Grow.',
  footerText: 'Official ARX IT CLUB. Empowering the next generation of builders.',
  telegramBotUsername: 'ARXITCLUB_bot',
  telegramBotUrl: 'https://t.me/ARXITCLUB_bot',
  telegramChannelUrl: 'https://t.me/arxitclub',
  telegramChannelName: '@arxitclub',
  logoUrl: '/assets/arx-logo-light.jpg',
  logoDarkUrl: '/assets/arx-logo-dark.jpg',
  description: 'Empowering students with practical coding workshops, project mentorship, and verifiable technical skills.'
};

let socialLinksList = [];
let footerLoaded = false;

async function ensureFooterData() {
  if (footerLoaded) return;
  try {
    const [settingsRes, socialRes] = await Promise.all([
      api.getPublicSettings().catch(() => ({ settings: null })),
      api.getPublicSocialLinks().catch(() => ({ socialLinks: [] }))
    ]);
    if (settingsRes?.settings) {
      footerSettings = { 
        ...footerSettings, 
        ...settingsRes.settings,
        clubName: settingsRes.settings.clubName === 'ARX IT CLUB OF SJS' ? 'ARX IT CLUB' : (settingsRes.settings.clubName || 'ARX IT CLUB')
      };
    }
    if (socialRes?.socialLinks && socialRes.socialLinks.length > 0) {
      socialLinksList = socialRes.socialLinks.filter(l => {
        const plat = (l.platform || '').toLowerCase();
        const url = (l.url || '').toLowerCase();
        return !plat.includes('github') && !plat.includes('youtube') && !url.includes('itclub.school.edu') && !url.includes('github.com') && !url.includes('youtube.com');
      });
    }
    footerLoaded = true;
  } catch {}
}

function getPlatformIcon(platform, iconKey) {
  const key = (iconKey || platform || '').toLowerCase();
  if (key.includes('telegram') || key === 'send') return icon('Send', 'w-3.5 h-3.5');
  if (key.includes('instagram')) return icon('Instagram', 'w-3.5 h-3.5 text-pink-500');
  if (key.includes('facebook')) return icon('Facebook', 'w-3.5 h-3.5 text-blue-600');
  if (key.includes('linkedin')) return icon('Linkedin', 'w-3.5 h-3.5 text-blue-500');
  if (key.includes('twitter') || key === 'x') return icon('Twitter', 'w-3.5 h-3.5 text-cyan-500');
  if (key.includes('web') || key.includes('site') || key === 'globe') return icon('Globe', 'w-3.5 h-3.5 text-emerald-500');
  return icon('Share2', 'w-3.5 h-3.5');
}

export function renderFooter() {
  ensureFooterData();

  const displayName = footerSettings.clubName === 'ARX IT CLUB OF SJS' ? 'ARX IT CLUB' : (footerSettings.clubName || 'ARX IT CLUB');

  return `
    <footer class="bg-[#EFE6DE]/70 dark:bg-[#0A211A] text-[#282828]/75 dark:text-white border-t border-[#282828]/10 dark:border-[#25473C] mt-auto transition-colors duration-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          <!-- Col 1: Brand & Official Logo -->
          <div class="lg:col-span-2 space-y-4">
            <div data-nav="/" class="flex items-center gap-3 cursor-pointer inline-flex group">
              <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex items-center justify-center bg-white dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] p-0.5 shadow-xs shrink-0">
                <img
                  src="/assets/arx-logo-light.jpg"
                  alt="ARX IT CLUB Official Logo"
                  class="w-full h-full object-cover rounded-lg dark:hidden"
                  onerror="this.src='/arx-primary-logo.png'" />
                <img
                  src="/assets/arx-logo-dark.jpg"
                  alt="ARX IT CLUB Official Logo"
                  class="w-full h-full object-cover rounded-lg hidden dark:block"
                  onerror="this.src='/arx-primary-logo.png'" />
              </div>
              <div>
                <span class="font-bold text-base sm:text-lg tracking-tight text-[#282828] dark:text-white font-sans block group-hover:text-[#FC6454] dark:group-hover:text-[#82CBB2] transition-colors">
                  ${displayName}
                </span>
                <span class="text-[11px] font-mono uppercase tracking-wider text-[#FC6454] dark:text-[#82CBB2] font-semibold">
                  &ldquo;${footerSettings.tagline || 'Learn. Build. Grow.'}&rdquo;
                </span>
              </div>
            </div>
            
            <p class="text-xs text-[#282828]/70 dark:text-white max-w-sm leading-relaxed">
              ${footerSettings.description || 'Empowering students with practical coding workshops, project mentorship, and verifiable technical skills.'}
            </p>

            <!-- Social Links -->
            <div class="flex flex-wrap items-center gap-2 pt-2">
              ${socialLinksList.length > 0 ? socialLinksList.map(link => `
                <a
                  href="${link.url}"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="${link.name || link.platform}"
                  class="w-8 h-8 rounded-md bg-white dark:bg-[#102B22] hover:bg-[#FC6454]/15 dark:hover:bg-[#2F8068]/25 hover:text-[#FC6454] dark:hover:text-[#82CBB2] text-[#282828]/70 dark:text-white flex items-center justify-center border border-[#282828]/15 dark:border-[#25473C] transition-colors"
                  aria-label="${link.name || link.platform}">
                  ${getPlatformIcon(link.platform, link.icon)}
                </a>
              `).join('') : `
                <a
                  href="${footerSettings.telegramChannelUrl || 'https://t.me/arxitclub'}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-8 h-8 rounded-md bg-white dark:bg-[#102B22] hover:bg-[#FC6454]/15 dark:hover:bg-[#2F8068]/25 hover:text-[#FC6454] dark:hover:text-[#82CBB2] text-[#282828]/70 dark:text-white flex items-center justify-center border border-[#282828]/15 dark:border-[#25473C] transition-colors"
                  aria-label="Official Telegram Channel (@arxitclub)"
                  title="Official Telegram Channel (@arxitclub)">
                  ${icon('Send', 'w-3.5 h-3.5')}
                </a>
                <a
                  href="${footerSettings.telegramBotUrl || 'https://t.me/ARXITCLUB_bot'}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-8 h-8 rounded-md bg-white dark:bg-[#102B22] hover:bg-[#FC6454]/15 dark:hover:bg-[#2F8068]/25 hover:text-[#FC6454] dark:hover:text-[#82CBB2] text-[#282828]/70 dark:text-white flex items-center justify-center border border-[#282828]/15 dark:border-[#25473C] transition-colors"
                  aria-label="Official Telegram Bot (@ARXITCLUB_bot)"
                  title="Official Telegram Bot (@ARXITCLUB_bot)">
                  ${icon('Bot', 'w-3.5 h-3.5')}
                </a>
              `}
            </div>
          </div>

          <!-- Col 2: Navigation -->
          <div class="space-y-3">
            <h4 class="text-xs font-semibold uppercase tracking-wider text-[#282828] dark:text-white">
              Navigation
            </h4>
            <ul class="space-y-2 text-xs">
              ${['Home', 'About', 'Courses', 'Projects', 'Events', 'Contact'].map(item => `
                <li>
                  <button
                    data-nav="${item === 'Home' ? '/' : `/${item.toLowerCase()}`}"
                    class="text-[#282828]/70 dark:text-white hover:text-[#FC6454] dark:hover:text-[#82CBB2] transition-colors cursor-pointer border-0 bg-transparent p-0">
                    ${item}
                  </button>
                </li>
              `).join('')}
            </ul>
          </div>

          <!-- Col 3: Portal Access -->
          <div class="space-y-3">
            <h4 class="text-xs font-semibold uppercase tracking-wider text-[#282828] dark:text-white">
              Portal Access
            </h4>
            <ul class="space-y-2 text-xs">
              <li>
                <button
                  data-nav="/login"
                  class="text-[#282828]/70 dark:text-white hover:text-[#FC6454] dark:hover:text-[#82CBB2] transition-colors cursor-pointer border-0 bg-transparent p-0">
                  Student Login
                </button>
              </li>
              <li>
                <button
                  data-nav="/register"
                  class="text-[#282828]/70 dark:text-white hover:text-[#FC6454] dark:hover:text-[#82CBB2] transition-colors cursor-pointer border-0 bg-transparent p-0">
                  Join ARX
                </button>
              </li>
              <li>
                <button
                  data-nav="/certificates"
                  class="text-[#282828]/70 dark:text-white hover:text-[#FC6454] dark:hover:text-[#82CBB2] transition-colors cursor-pointer border-0 bg-transparent p-0">
                  Verify Certificate
                </button>
              </li>
            </ul>
          </div>

          <!-- Col 4: Lab & Schedule -->
          <div class="space-y-3">
            <h4 class="text-xs font-semibold uppercase tracking-wider text-[#282828] dark:text-white">
              Lab Location
            </h4>
            <p class="text-xs text-[#282828]/70 dark:text-white leading-relaxed">
              Computer Lab 3, Highschool<br />
              Monday to Tuesday: 3:30 PM &ndash; 5:30 PM
            </p>
          </div>

          <!-- Col 5: Security & Verification -->
          <div class="space-y-3">
            <h4 class="text-xs font-semibold uppercase tracking-wider text-[#282828] dark:text-white">
              Verification
            </h4>
            <p class="text-xs text-[#282828]/70 dark:text-white leading-relaxed">
              Official student certifications are cryptographically stamped and registered.
            </p>
          </div>
        </div>

        <!-- Bottom Line -->
        <div class="mt-12 pt-6 border-t border-[#282828]/10 dark:border-[#25473C] flex flex-col sm:flex-row items-center justify-between text-xs text-[#282828]/60 dark:text-white gap-3">
          <p>&copy; ${new Date().getFullYear()} ${displayName}. All rights reserved.</p>
          <p class="text-[11px] font-mono text-[#282828]/50 dark:text-[#A2C0B6]">
            Official School IT Club Organization
          </p>
        </div>
      </div>
    </footer>
  `;
}
