export function getModuleMaterialMeta(course = {}) {
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

export function renderCourseVisual(course, variant = 'card', className = '') {
  const meta = getModuleMaterialMeta(course);

  if (variant === 'banner') {
    return `
      <div class="w-full h-56 sm:h-72 bg-gradient-to-br ${meta.gradient} relative overflow-hidden flex items-center justify-center select-none border-b border-[#282828]/10 dark:border-[#25473C] ${className}">
        <div class="absolute inset-0 opacity-[0.07] pointer-events-none" style="background-image: radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0); background-size: 24px 24px;"></div>
        <div class="absolute w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700" style="background: ${meta.glowColor};"></div>
        <div class="relative z-10 flex flex-col items-center text-center p-6 space-y-3">
          <div class="px-3.5 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wider uppercase border shadow-xs" style="background-color: ${meta.accentColor}18; border-color: ${meta.accentColor}40; color: ${meta.accentColor};">
            ${meta.badge}
          </div>
          <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center shadow-2xl relative border" style="background-color: rgba(255, 255, 255, 0.05); border-color: ${meta.accentColor}50;">
            <span class="material-symbols-outlined text-6xl sm:text-7xl leading-none" style="color: ${meta.accentColor};" aria-hidden="true">${meta.iconName}</span>
          </div>
          <p class="text-xs font-mono text-white/60 tracking-wider">OFFICIAL CURRICULUM MODULE</p>
        </div>
      </div>
    `;
  }

  if (variant === 'compact') {
    return `
      <div class="w-12 h-12 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center shrink-0 border border-white/10 ${className}">
        <span class="material-symbols-outlined text-2xl" style="color: ${meta.accentColor};" aria-hidden="true">${meta.iconName}</span>
      </div>
    `;
  }

  return `
    <div class="w-full h-44 bg-gradient-to-br ${meta.gradient} relative overflow-hidden flex items-center justify-center select-none border-b border-[#282828]/10 dark:border-[#25473C] group-hover:brightness-105 transition-all duration-300 ${className}">
      <div class="absolute inset-0 opacity-[0.08] pointer-events-none" style="background-image: radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0); background-size: 20px 20px;"></div>
      <div class="absolute w-48 h-48 rounded-full blur-2xl pointer-events-none transition-all duration-500" style="background: ${meta.glowColor};"></div>
      <div class="relative z-10 flex flex-col items-center justify-center space-y-2">
        <span class="text-[10px] font-mono font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border shadow-xs" style="background-color: ${meta.accentColor}18; border-color: ${meta.accentColor}35; color: ${meta.accentColor};">
          ${meta.badge}
        </span>
        <div class="w-18 h-18 rounded-xl flex items-center justify-center shadow-lg border relative transition-transform duration-300 group-hover:scale-105" style="background-color: rgba(255, 255, 255, 0.05); border-color: ${meta.accentColor}40;">
          <span class="material-symbols-outlined text-4xl sm:text-5xl leading-none" style="color: ${meta.accentColor};" aria-hidden="true">${meta.iconName}</span>
        </div>
      </div>
    </div>
  `;
}
