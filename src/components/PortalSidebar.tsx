import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useRouter } from '../context/RouterContext.tsx';
import Icon from './Icon.tsx';

interface NavItem {
  label: string;
  path: string;
  iconName: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/portal/dashboard', iconName: 'LayoutDashboard' },
  { label: 'My Courses', path: '/portal/courses', iconName: 'BookOpen' },
  { label: 'Lab Attendance', path: '/portal/attendance', iconName: 'Clock' },
  { label: 'My Certificates', path: '/portal/certificates', iconName: 'Award' },
  { label: 'My Awards', path: '/portal/awards', iconName: 'Trophy' },
  { label: 'My Projects', path: '/portal/projects', iconName: 'FolderGit2' },
  { label: 'Events', path: '/events', iconName: 'Calendar' },
  { label: 'My Profile', path: '/portal/profile', iconName: 'User' },
  { label: 'Change Password', path: '/portal/change-password', iconName: 'KeyRound' }
];

export const PortalSidebar: React.FC = () => {
  const { member, logout } = useAuth();
  const { currentPath, navigate } = useRouter();
  const [mobileExpanded, setMobileExpanded] = React.useState(false);

  const handleExit = () => {
    logout();
    navigate('/');
  };

  const currentClean = currentPath.split('?')[0];

  return (
    <aside className="w-full lg:w-64 bg-[#EFE6DE]/60 dark:bg-[#102B22] border border-[#282828]/10 dark:border-[#25473C] rounded-lg text-[#282828] dark:text-white flex flex-col shrink-0 overflow-hidden shadow-xs transition-colors duration-200">
      {/* Member Identity Header */}
      <div className="p-3.5 sm:p-4 border-b border-[#282828]/10 dark:border-[#25473C] bg-white/40 dark:bg-[#0A211A]/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#FC6454]/15 dark:bg-[#2F8068]/30 border border-[#FC6454]/30 dark:border-[#2F8068] text-[#FC6454] dark:text-[#6BB89E] flex items-center justify-center font-mono font-bold text-xs shrink-0">
              {member?.studentName ? member.studentName.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-[#282828] dark:text-white truncate font-sans">
                {member?.studentName || 'Member'}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-[10px] text-[#FC6454] dark:text-[#6BB89E] bg-[#FC6454]/10 dark:bg-[#071A14] px-1.5 py-0.5 rounded-sm border border-[#FC6454]/25 dark:border-[#25473C]">
                  {member?.memberId || 'TI------'}
                </span>
                <span className="text-[10px] text-[#282828]/60 dark:text-white">
                  Class {member?.class || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Toggle Button */}
          <button
            onClick={() => setMobileExpanded(prev => !prev)}
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-[#282828]/15 dark:border-[#25473C] bg-white dark:bg-[#15362B] text-[#282828] dark:text-white cursor-pointer active:scale-95"
            aria-label="Toggle portal navigation options"
          >
            <Icon name={mobileExpanded ? 'X' : 'Menu'} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Quick-Tab Strip */}
      <div className="lg:hidden overflow-x-auto flex items-center gap-1.5 p-2 bg-white/70 dark:bg-[#0A211A]/70 border-b border-[#282828]/10 dark:border-[#25473C] no-scrollbar">
        {navItems.map((item) => {
          const active = currentClean === item.path || (item.path === '/portal/dashboard' && currentClean === '/portal');
          return (
            <button
              key={item.path}
              onClick={() => {
                setMobileExpanded(false);
                navigate(item.path);
              }}
              className={`shrink-0 min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                active
                  ? 'bg-[#FC6454] text-white dark:bg-[#2F8068] dark:text-white border-[#FC6454] dark:border-[#2F8068] font-semibold shadow-xs'
                  : 'bg-white dark:bg-[#15362B] border-[#282828]/10 dark:border-[#25473C] text-[#282828]/80 dark:text-white hover:bg-[#FC6454]/10 dark:hover:bg-[#102B22]'
              }`}
            >
              <Icon name={item.iconName} className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Nav Items (Collapsible on mobile) */}
      <nav className={`p-2 space-y-1 flex-1 ${mobileExpanded ? 'block' : 'hidden lg:block'}`}>
        {navItems.map((item) => {
          const active = currentClean === item.path || (item.path === '/portal/dashboard' && currentClean === '/portal');
          return (
            <button
              key={item.path}
              onClick={() => {
                setMobileExpanded(false);
                navigate(item.path);
              }}
              className={`w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-0 active:scale-[0.99] ${
                active
                  ? 'bg-[#FC6454] text-white dark:bg-[#2F8068] dark:text-white font-semibold shadow-xs'
                  : 'text-[#282828]/70 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] hover:bg-[#FC6454]/10 dark:hover:bg-[#15362B]'
              }`}
            >
              <Icon
                name={item.iconName}
                className={`w-4 h-4 ${active ? 'text-white dark:text-white' : 'text-[#282828]/40 dark:text-white'}`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Telegram Status */}
      <div className={`p-3 mx-2.5 mb-3 rounded-lg bg-white dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] text-xs ${mobileExpanded ? 'block' : 'hidden lg:block'}`}>
        <div className="flex items-center justify-between text-[#FC6454] dark:text-[#6BB89E] font-medium mb-1">
          <span className="flex items-center gap-1.5 text-[11px] font-mono">
            <Icon name="Send" className="w-3.5 h-3.5 text-[#FC6454] dark:text-[#6BB89E]" /> Telegram Hub
          </span>
          <span className="text-[9px] font-mono text-emerald-700 dark:text-[#58B889] bg-emerald-50 dark:bg-[#102B22] px-1 py-0.5 rounded-sm border border-emerald-200 dark:border-[#25473C]">
            ACTIVE
          </span>
        </div>
        <p className="text-[11px] text-[#282828]/60 dark:text-white leading-relaxed">
          Official channel announcements and bot notifications connected.
        </p>
      </div>

      {/* Exit Session */}
      <div className={`p-2 border-t border-[#282828]/10 dark:border-[#25473C] bg-white/40 dark:bg-transparent ${mobileExpanded ? 'block' : 'hidden lg:block'}`}>
        <button
          onClick={handleExit}
          className="w-full min-h-[44px] flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium text-red-600 dark:text-rose-400 hover:bg-red-500/10 dark:hover:bg-rose-950/30 transition-colors cursor-pointer border-0 bg-transparent active:scale-95"
        >
          <Icon name="LogOut" className="w-4 h-4" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
};

export default PortalSidebar;
