import React from 'react';

export function getModuleMaterialMeta(course: any = {}) {
  const text = `${course.id || ''} ${course.slug || ''} ${course.title || ''} ${course.category || ''}`.toLowerCase();

  if (text.includes('ai') || text.includes('machine learning') || text.includes('intelligence') || text.includes('deep learning')) {
    return {
      iconName: 'psychology',
      badge: 'AI & MACHINE LEARNING',
      gradient: 'from-[#1A102F] via-[#261545] to-[#3A1B60]',
      glowColor: 'rgba(167, 139, 250, 0.35)',
      accentColor: '#A78BFA'
    };
  }

  if (text.includes('python')) {
    return {
      iconName: 'terminal',
      badge: 'PYTHON',
      gradient: 'from-[#0B132B] via-[#0E1B38] to-[#1C2541]',
      glowColor: 'rgba(56, 189, 248, 0.25)',
      accentColor: '#38BDF8'
    };
  }

  if (text.includes('cyber') || text.includes('security')) {
    return {
      iconName: 'security',
      badge: 'CYBERSECURITY',
      gradient: 'from-[#051A14] via-[#07241C] to-[#0E3529]',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      accentColor: '#10B981'
    };
  }

  if (text.includes('robot')) {
    return {
      iconName: 'smart_toy',
      badge: 'ROBOTICS',
      gradient: 'from-[#190F2E] via-[#241344] to-[#341857]',
      glowColor: 'rgba(168, 85, 247, 0.25)',
      accentColor: '#A855F7'
    };
  }

  return {
    iconName: 'devices',
    badge: 'WEB DESIGN & DEV',
    gradient: 'from-[#0F172A] via-[#161F38] to-[#1E1B4B]',
    glowColor: 'rgba(252, 100, 84, 0.25)',
    accentColor: '#FC6454'
  };
}

interface CourseVisualProps {
  course?: any;
  variant?: 'card' | 'banner';
  className?: string;
}

export const CourseVisual: React.FC<CourseVisualProps> = ({ course = {}, variant = 'card', className = '' }) => {
  const meta = getModuleMaterialMeta(course);

  if (variant === 'banner') {
    return (
      <div className={`w-full h-56 sm:h-72 bg-gradient-to-br ${meta.gradient} relative overflow-hidden flex items-center justify-center select-none border-b border-[#282828]/10 dark:border-[#25473C] ${className}`}>
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', backgroundSize: '24px 24px' }}
        />
        <div
          className="absolute w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700"
          style={{ background: meta.glowColor }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
            <span className="material-symbols-outlined text-4xl sm:text-5xl">{meta.iconName}</span>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-widest uppercase font-semibold text-white/90 bg-white/10 border border-white/20">
            {meta.badge}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-44 bg-gradient-to-br ${meta.gradient} relative overflow-hidden flex items-center justify-center select-none border-b border-[#282828]/10 dark:border-[#25473C] group-hover:brightness-105 transition-all duration-300 ${className}`}>
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', backgroundSize: '20px 20px' }}
      />
      <div
        className="absolute w-44 h-44 rounded-full blur-2xl pointer-events-none transition-all duration-500"
        style={{ background: meta.glowColor }}
      />
      <div className="relative z-10 flex flex-col items-center justify-center text-center p-4 space-y-2">
        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-105">
          <span className="material-symbols-outlined text-3xl">{meta.iconName}</span>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase font-medium text-white/90 bg-white/10 border border-white/15">
          {meta.badge}
        </span>
      </div>
    </div>
  );
};

export default CourseVisual;
