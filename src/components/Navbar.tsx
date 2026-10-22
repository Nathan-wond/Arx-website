import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { useRouter } from '../context/RouterContext.tsx';
import { api } from '../services/api.js';
import Icon from './Icon.tsx';
import { ADMIN_DASHBOARD_PATH, PRESIDENT_DASHBOARD_PATH } from '../config/adminRoute.js';

interface BrandSettings {
  logoUrl: string;
  logoDarkUrl: string;
  clubName: string;
  registrationStatus: string;
}

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Courses', path: '/courses' },
  { label: 'Projects', path: '/projects' },
  { label: 'Event', path: '/events' },
  { label: 'Contact', path: '/contact' }
];

export const Navbar: React.FC = () => {
  const { member, isAuthenticated, isAdmin, isPresident, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currentPath, navigate } = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [brand, setBrand] = useState<BrandSettings>({
    logoUrl: '/assets/arx-logo-light.jpg',
    logoDarkUrl: '/assets/arx-logo-dark.jpg',
    clubName: 'ARX IT CLUB',
    registrationStatus: 'OPEN'
  });

  useEffect(() => {
    let mounted = true;
    api.getPublicSettings()
      .then((res: any) => {
        if (!mounted || !res?.settings) return;
        setBrand(prev => ({
          ...prev,
          logoUrl: res.settings.compactLogoUrl || res.settings.logoUrl || prev.logoUrl,
          logoDarkUrl: res.settings.compactLogoDarkUrl || res.settings.logoDarkUrl || res.settings.compactLogoUrl || res.settings.logoUrl || prev.logoDarkUrl,
          clubName: res.settings.clubName || prev.clubName,
          registrationStatus: res.settings.registrationStatus || prev.registrationStatus
        }));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const isActive = (path: string) => {
    const cleanCurrent = currentPath.split('?')[0];
    if (path === '/' && cleanCurrent === '/') return true;
    if (path !== '/' && (cleanCurrent === path || cleanCurrent.startsWith(`${path}/`))) return true;
    return false;
  };

  const handleNav = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const isRegistrationClosed = brand.registrationStatus === 'CLOSED';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F7EFE8]/95 dark:bg-[#071A14]/95 backdrop-blur-md border-b border-[#282828]/10 dark:border-[#25473C] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <button
            onClick={() => handleNav('/')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FC6454] dark:focus-visible:ring-[#6BB89E] rounded-sm bg-transparent border-0 p-0"
            aria-label="ARX IT CLUB Home"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden flex items-center justify-center bg-transparent shrink-0">
              <img
                src={brand.logoUrl}
                alt={`${brand.clubName} Logo Light`}
                className="w-full h-full object-cover rounded-full dark:hidden"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/arx-logo-light.jpg';
                }}
              />
              <img
                src={brand.logoDarkUrl}
                alt={`${brand.clubName} Logo Dark`}
                className="w-full h-full object-cover rounded-full hidden dark:block"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/arx-logo-dark.jpg';
                }}
              />
            </div>
            <span className="font-semibold text-sm sm:text-base tracking-tight text-[#282828] dark:text-white font-sans">
              {(brand.clubName || 'ARX IT CLUB').replace(/\s+OF\s+SJS/gi, '')}
            </span>
          </button>

          {/* Desktop Navigation — Exactly the 6 primary items */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path)}
                  className={`px-3 py-1.5 text-xs font-medium tracking-tight transition-colors duration-150 cursor-pointer rounded-md border-0 ${
                    active
                      ? 'text-[#FC6454] dark:text-[#6BB89E] font-semibold bg-[#FC6454]/15 dark:bg-[#2F8068]/20'
                      : 'text-[#282828]/80 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] hover:bg-[#FC6454]/10 dark:hover:bg-[#102B22]'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Auth Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#282828]/70 hover:text-[#282828] dark:text-white dark:hover:text-[#F1F7F4] hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer border-0 bg-transparent active:scale-95"
              title={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
              aria-label="Toggle color theme"
            >
              {theme === 'dark' ? (
                <Icon name="Sun" className="w-4 h-4 text-[#6BB89E]" />
              ) : (
                <Icon name="Moon" className="w-4 h-4 text-[#282828]" />
              )}
            </button>

            {/* Authenticated Controls */}
            {isAuthenticated && member ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {isPresident ? (
                  <button
                    onClick={() => handleNav(PRESIDENT_DASHBOARD_PATH)}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-md text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 cursor-pointer active:scale-95"
                  >
                    <Icon name="Crown" className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Clearance</span>
                  </button>
                ) : isAdmin ? (
                  <button
                    onClick={() => handleNav(ADMIN_DASHBOARD_PATH)}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-md text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 cursor-pointer active:scale-95"
                  >
                    <Icon name="ShieldCheck" className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Admin Desk</span>
                  </button>
                ) : null}

                <button
                  onClick={() => handleNav('/portal/dashboard')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-md text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-colors cursor-pointer border-0 shadow-xs active:scale-95"
                >
                  <Icon name="LayoutDashboard" className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Workspace</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#282828]/60 hover:text-rose-600 dark:text-white dark:hover:text-rose-400 hover:bg-[#282828]/5 dark:hover:bg-[#15362B] transition-colors cursor-pointer border-0 bg-transparent active:scale-95"
                  title="Log out of account"
                  aria-label="Log out"
                >
                  <Icon name="LogOut" className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => handleNav('/login')}
                  className="min-h-[40px] px-3 py-2 text-xs font-medium text-[#282828] dark:text-white hover:bg-[#282828]/5 dark:hover:bg-[#15362B] rounded-md transition-colors cursor-pointer border-0 bg-transparent active:scale-95"
                >
                  Login
                </button>

                {!isRegistrationClosed ? (
                  <button
                    onClick={() => handleNav('/register')}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-md text-xs font-semibold bg-[#FC6454] text-white hover:bg-[#E04D3E] dark:bg-[#2F8068] dark:hover:bg-[#3A9277] transition-colors cursor-pointer border-0 shadow-xs active:scale-95"
                  >
                    <Icon name="UserPlus" className="w-3.5 h-3.5" />
                    <span>Join Club</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-mono font-medium bg-[#282828]/5 dark:bg-[#102B22] text-[#282828]/60 dark:text-white border border-[#282828]/10 dark:border-[#25473C]">
                    Registration Closed
                  </span>
                )}
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#282828]/80 dark:text-white hover:bg-[#282828]/5 dark:hover:bg-[#15362B] cursor-pointer border-0 bg-transparent active:scale-95"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <Icon name="X" className="w-5 h-5" />
              ) : (
                <Icon name="Menu" className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu — Contains all 6 primary items plus secondary portal links */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#282828]/10 dark:border-[#25473C] bg-[#F7EFE8] dark:bg-[#071A14] px-4 pt-3 pb-6 space-y-1.5 shadow-lg">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={`w-full min-h-[44px] flex items-center text-left px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0 active:scale-[0.99] ${
                  active
                    ? 'text-[#FC6454] dark:text-[#6BB89E] font-semibold bg-[#FC6454]/15 dark:bg-[#2F8068]/20'
                    : 'text-[#282828]/80 dark:text-white hover:bg-[#282828]/5 dark:hover:bg-[#102B22]'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {link.label}
              </button>
            );
          })}

          <div className="pt-2 border-t border-[#282828]/10 dark:border-[#25473C] space-y-1.5">
            <button
              onClick={() => handleNav('/certificates')}
              className="w-full min-h-[44px] text-left px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#282828]/80 dark:text-white hover:bg-[#282828]/5 dark:hover:bg-[#102B22] flex items-center justify-between cursor-pointer border-0 bg-transparent active:scale-[0.99]"
            >
              <span>Verify Certificate</span>
              <Icon name="ShieldCheck" className="w-4 h-4 text-emerald-600 dark:text-[#58B889]" />
            </button>
            <button
              onClick={() => handleNav('/activate')}
              className="w-full min-h-[44px] text-left px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#282828]/80 dark:text-white hover:bg-[#282828]/5 dark:hover:bg-[#102B22] flex items-center justify-between cursor-pointer border-0 bg-transparent active:scale-[0.99]"
            >
              <span>Activate Account</span>
              <Icon name="KeyRound" className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
