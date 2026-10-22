import fs from 'fs';
import path from 'path';

export function ensureSeedImagesExist(uploadsDir) {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const assets = {
    'arx-logo.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 160" width="600" height="160">
  <defs>
    <linearGradient id="grad-logo-arx" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="16" fill="#0f172a" />
  <g transform="translate(30, 30)">
    <rect width="100" height="100" rx="20" fill="url(#grad-logo-arx)" />
    <path d="M35 50 L20 65 L35 80 M65 50 L80 65 L65 80 M55 35 L45 95" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  </g>
  <text x="150" y="75" font-family="'Space Grotesk', system-ui, sans-serif" font-weight="900" font-size="38" fill="#ffffff" letter-spacing="1.5">ARX IT CLUB OF SJS</text>
  <text x="152" y="112" font-family="'JetBrains Mono', monospace" font-weight="600" font-size="16" fill="#38bdf8" letter-spacing="3">LEARN. BUILD. GROW.</text>
</svg>`,

    'arx-compact.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="grad-compact-arx" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="32" fill="#020617" />
  <rect x="20" y="20" width="160" height="160" rx="24" fill="url(#grad-compact-arx)" />
  <path d="M60 80 L35 100 L60 120 M140 80 L165 100 L140 120 M115 65 L85 135" stroke="#ffffff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  <text x="100" y="172" font-family="'Space Grotesk', sans-serif" font-weight="800" font-size="15" fill="#ffffff" text-anchor="middle" letter-spacing="2">ARX</text>
</svg>`,

    'arx-symbol.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="grad-sym-arx" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#14b8a6" />
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="24" fill="url(#grad-sym-arx)" />
  <path d="M35 45 L20 60 L35 75 M85 45 L100 60 L85 75 M68 35 L52 85" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none" />
</svg>`,

    'arx-hero-banner.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" width="1200" height="600">
  <defs>
    <linearGradient id="bg-hero-arx" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>
  </defs>
  <rect width="1200" height="600" fill="url(#bg-hero-arx)" />
  <g stroke="#1e293b" stroke-width="1" opacity="0.6">
    <line x1="0" y1="100" x2="1200" y2="100" />
    <line x1="0" y1="200" x2="1200" y2="200" />
    <line x1="0" y1="300" x2="1200" y2="300" />
    <line x1="0" y1="400" x2="1200" y2="400" />
    <line x1="0" y1="500" x2="1200" y2="500" />
  </g>
  <rect x="250" y="90" width="700" height="420" rx="16" fill="#090d16" stroke="#334155" stroke-width="2" />
  <rect x="250" y="90" width="700" height="44" rx="16" fill="#0f172a" />
  <circle cx="280" cy="112" r="6" fill="#ef4444" />
  <circle cx="300" cy="112" r="6" fill="#f59e0b" />
  <circle cx="320" cy="112" r="6" fill="#10b981" />
  <text x="350" y="117" font-family="'JetBrains Mono', monospace" font-size="13" fill="#94a3b8">arx-workspace.tsx — Computer Lab 3</text>
  <text x="290" y="180" font-family="'JetBrains Mono', monospace" font-size="18" fill="#c084fc">import <tspan fill="#38bdf8">{ ARXClub }</tspan> from <tspan fill="#a7f3d0">'@arx/student-core'</tspan>;</text>
  <text x="290" y="225" font-family="'JetBrains Mono', monospace" font-size="18" fill="#94a3b8">// Connect, Build, Launch Verified Software</text>
  <text x="290" y="270" font-family="'JetBrains Mono', monospace" font-size="18" fill="#60a5fa">const <tspan fill="#facc15">futureEngineers</tspan> = <tspan fill="#38bdf8">new</tspan> ARXClub({</text>
  <text x="320" y="315" font-family="'JetBrains Mono', monospace" font-size="18" fill="#94a3b8">curriculum: [<tspan fill="#a7f3d0">'Web'</tspan>, <tspan fill="#a7f3d0">'Python'</tspan>, <tspan fill="#a7f3d0">'AI'</tspan>, <tspan fill="#a7f3d0">'Robotics'</tspan>, <tspan fill="#a7f3d0">'Security'</tspan>],</text>
  <text x="320" y="360" font-family="'JetBrains Mono', monospace" font-size="18" fill="#94a3b8">certification: <tspan fill="#34d399">'TAMPER_PROOF_LANDSCAPE_VERIFIED'</tspan>,</text>
  <text x="320" y="405" font-family="'JetBrains Mono', monospace" font-size="18" fill="#94a3b8">status: <tspan fill="#38bdf8">'LIVE_ON_PREMISE'</tspan></text>
  <text x="290" y="450" font-family="'JetBrains Mono', monospace" font-size="18" fill="#60a5fa">});</text>
</svg>`,

    'course-html-css.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="grad-html" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad-html)" />
  <rect x="60" y="50" width="680" height="400" rx="16" fill="#020617" stroke="#334155" stroke-width="2" />
  <circle cx="100" cy="85" r="7" fill="#ef4444" />
  <circle cx="125" cy="85" r="7" fill="#f59e0b" />
  <circle cx="150" cy="85" r="7" fill="#10b981" />
  <path d="M260 160 L280 340 L400 370 L520 340 L540 160 Z" fill="#e44d26" opacity="0.9" />
  <path d="M400 180 L400 345 L495 320 L510 180 Z" fill="#f16529" />
  <path d="M320 220 L480 220 L470 260 L400 260 L400 300 L445 285 L448 265 L475 265 L465 315 L400 335 L335 315 L328 240 L358 240 L363 285 L400 295 L400 260 L320 260 Z" fill="#ffffff" />
  <text x="400" y="420" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="24" fill="#ffffff" text-anchor="middle">HTML5 &amp; MODERN RESPONSIVE CSS</text>
</svg>`,

    'course-javascript.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="grad-js" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b" />
      <stop offset="100%" stop-color="#27272a" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad-js)" />
  <rect x="250" y="100" width="300" height="300" rx="20" fill="#f7df1e" />
  <text x="490" y="360" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="170" fill="#000000" text-anchor="end">JS</text>
  <text x="400" y="450" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="22" fill="#ffffff" text-anchor="middle">MODERN JAVASCRIPT &amp; DOM APPS</text>
</svg>`,

    'course-python.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="grad-py-blue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#2563eb" />
    </linearGradient>
    <linearGradient id="grad-py-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#facc15" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="#090d16" />
  <g transform="translate(250, 70) scale(1.2)">
    <path d="M125 10 C60 10 65 35 65 35 L65 65 L130 65 L130 75 L40 75 C40 75 10 70 10 135 C10 200 35 195 35 195 L60 195 L60 165 C60 165 58 130 95 130 L160 130 C160 130 190 130 190 100 L190 35 C190 35 195 10 125 10 Z" fill="url(#grad-py-blue)" />
    <circle cx="95" cy="40" r="10" fill="#ffffff" />
    <path d="M125 240 C190 240 185 215 185 215 L185 185 L120 185 L120 175 L210 175 C210 175 240 180 240 115 C240 50 215 55 215 55 L190 55 L190 85 C190 85 192 120 155 120 L90 120 C90 120 60 120 60 150 L60 215 C60 215 55 240 125 240 Z" fill="url(#grad-py-yellow)" />
    <circle cx="155" cy="210" r="10" fill="#ffffff" />
  </g>
  <text x="400" y="445" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="22" fill="#ffffff" text-anchor="middle">PYTHON &amp; ALGORITHMIC PROBLEM SOLVING</text>
</svg>`,

    'course-cybersecurity.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="100%" height="100%" fill="#020617" />
  <g transform="translate(250, 60)">
    <path d="M150 20 L270 70 L270 200 C270 290 150 340 150 340 C150 340 30 290 30 200 L30 70 Z" fill="#0f172a" stroke="#10b981" stroke-width="6" />
    <!-- Lock inside -->
    <rect x="100" y="160" width="100" height="80" rx="12" fill="#10b981" />
    <path d="M120 160 L120 125 C120 105 180 105 180 125 L180 160" stroke="#10b981" stroke-width="12" stroke-linecap="round" fill="none" />
    <circle cx="150" cy="195" r="8" fill="#020617" />
    <path d="M150 203 L150 220" stroke="#020617" stroke-width="4" stroke-linecap="round" />
  </g>
  <text x="400" y="445" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="22" fill="#ffffff" text-anchor="middle">CYBERSECURITY &amp; SYSTEM DEFENSE</text>
</svg>`,

    'course-ai.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="grad-ai" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad-ai)" />
  <!-- Neural graph -->
  <g stroke="#38bdf8" stroke-width="2" opacity="0.6">
    <line x1="200" y1="150" x2="350" y2="100" />
    <line x1="200" y1="250" x2="350" y2="100" />
    <line x1="200" y1="350" x2="350" y2="250" />
    <line x1="200" y1="150" x2="350" y2="250" />
    <line x1="350" y1="100" x2="500" y2="180" />
    <line x1="350" y1="250" x2="500" y2="180" />
    <line x1="350" y1="380" x2="500" y2="300" />
    <line x1="500" y1="180" x2="650" y2="250" />
    <line x1="500" y1="300" x2="650" y2="250" />
  </g>
  <!-- Nodes -->
  <circle cx="200" cy="150" r="16" fill="#818cf8" />
  <circle cx="200" cy="250" r="16" fill="#818cf8" />
  <circle cx="200" cy="350" r="16" fill="#818cf8" />
  <circle cx="350" cy="100" r="20" fill="#38bdf8" />
  <circle cx="350" cy="250" r="22" fill="#06b6d4" />
  <circle cx="350" cy="380" r="18" fill="#38bdf8" />
  <circle cx="500" cy="180" r="24" fill="#a855f7" />
  <circle cx="500" cy="300" r="22" fill="#ec4899" />
  <circle cx="650" cy="250" r="28" fill="#22c55e" />
  <text x="400" y="450" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="22" fill="#ffffff" text-anchor="middle">ARTIFICIAL INTELLIGENCE &amp; NEURAL NETWORKS</text>
</svg>`,

    'course-robotics.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="100%" height="100%" fill="#030712" />
  <g transform="translate(240, 70)">
    <rect x="40" y="40" width="240" height="240" rx="20" fill="#065f46" stroke="#10b981" stroke-width="4" />
    <!-- Chip -->
    <rect x="90" y="90" width="140" height="140" rx="8" fill="#111827" stroke="#34d399" stroke-width="2" />
    <text x="160" y="170" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="bold" fill="#34d399" text-anchor="middle">ARM-V8</text>
    <!-- Traces -->
    <circle cx="160" cy="65" r="5" fill="#f59e0b" />
    <circle cx="160" cy="255" r="5" fill="#f59e0b" />
    <circle cx="65" cy="160" r="5" fill="#f59e0b" />
    <circle cx="255" cy="160" r="5" fill="#f59e0b" />
  </g>
  <text x="400" y="445" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="22" fill="#ffffff" text-anchor="middle">ROBOTICS &amp; EMBEDDED AUTOMATION</text>
</svg>`,

    'project-portal.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="100%" height="100%" fill="#090d16" />
  <rect x="80" y="50" width="640" height="380" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="2" />
  <rect x="80" y="50" width="640" height="40" rx="16" fill="#0f172a" />
  <circle cx="110" cy="70" r="6" fill="#ef4444" />
  <circle cx="130" cy="70" r="6" fill="#f59e0b" />
  <circle cx="150" cy="70" r="6" fill="#10b981" />
  <text x="400" y="75" font-family="'Space Grotesk', sans-serif" font-size="14" font-weight="bold" fill="#94a3b8" text-anchor="middle">ARX Student Portal — Live Demo</text>
  <!-- Dashboard mockup -->
  <rect x="110" y="110" width="160" height="300" rx="8" fill="#0f172a" />
  <rect x="290" y="110" width="400" height="130" rx="8" fill="#0f172a" />
  <rect x="290" y="260" width="190" height="150" rx="8" fill="#0f172a" />
  <rect x="500" y="260" width="190" height="150" rx="8" fill="#0f172a" />
</svg>`,

    'project-bot.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="100%" height="100%" fill="#0c1322" />
  <g transform="translate(300, 80)">
    <circle cx="100" cy="100" r="90" fill="#229ed9" />
    <path d="M45 98 L155 55 C160 53 165 57 163 62 L140 145 C139 150 134 152 130 149 L98 125 L84 140 C82 142 78 141 78 138 L81 113 L135 73 L70 108 L47 98 Z" fill="#ffffff" />
  </g>
  <text x="400" y="340" font-family="'Space Grotesk', sans-serif" font-weight="800" font-size="28" fill="#ffffff" text-anchor="middle">Lab 3 Telegram Bot Assistant</text>
  <text x="400" y="375" font-family="'JetBrains Mono', monospace" font-size="16" fill="#38bdf8" text-anchor="middle">@ARXITCLUB_bot</text>
</svg>`,

    'event-hackathon.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="grad-hack" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4338ca" />
      <stop offset="100%" stop-color="#7e22ce" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad-hack)" />
  <text x="400" y="160" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="44" fill="#ffffff" text-anchor="middle" letter-spacing="2">ANNUAL HACKATHON 2026</text>
  <text x="400" y="210" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="20" fill="#38bdf8" text-anchor="middle">24 HOURS &bull; COMPUTER LAB 3 &bull; CASH PRIZES</text>
  <!-- Trophy graphic -->
  <g transform="translate(340, 240) scale(0.6)">
    <path d="M50 40 L150 40 L150 120 C150 170 50 170 50 120 Z" fill="#facc15" stroke="#ca8a04" stroke-width="6" />
    <path d="M50 60 C10 60 10 100 50 100" stroke="#facc15" stroke-width="8" fill="none" />
    <path d="M150 60 C190 60 190 100 150 100" stroke="#facc15" stroke-width="8" fill="none" />
    <rect x="85" y="160" width="30" height="40" fill="#ca8a04" />
    <rect x="60" y="200" width="80" height="30" rx="4" fill="#713f12" />
  </g>
</svg>`,

    'event-workshop.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="100%" height="100%" fill="#0f172a" />
  <rect x="50" y="50" width="700" height="400" rx="20" fill="#1e293b" stroke="#0ea5e9" stroke-width="2" />
  <text x="400" y="170" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="34" fill="#ffffff" text-anchor="middle">Full-Stack React &amp; Node.js Workshop</text>
  <text x="400" y="220" font-family="'JetBrains Mono', monospace" font-size="16" fill="#38bdf8" text-anchor="middle">Interactive Lab Session &bull; REST APIs &bull; Git Workflows</text>
  <rect x="250" y="260" width="300" height="110" rx="12" fill="#020617" stroke="#334155" />
  <text x="400" y="325" font-family="'Plus Jakarta Sans', sans-serif" font-weight="bold" font-size="20" fill="#22c55e" text-anchor="middle">Free for All Club Members</text>
</svg>`,

    'achievement-gold.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="100%" height="100%" rx="32" fill="#0f172a" />
  <circle cx="200" cy="180" r="110" fill="#ca8a04" opacity="0.2" />
  <g transform="translate(100, 80) scale(1)">
    <path d="M50 40 L150 40 L150 120 C150 180 50 180 50 120 Z" fill="#facc15" stroke="#eab308" stroke-width="6" />
    <path d="M50 60 C10 60 10 110 50 110" stroke="#facc15" stroke-width="10" stroke-linecap="round" fill="none" />
    <path d="M150 60 C190 60 190 110 150 110" stroke="#facc15" stroke-width="10" stroke-linecap="round" fill="none" />
    <rect x="85" y="160" width="30" height="40" fill="#ca8a04" />
    <rect x="50" y="200" width="100" height="36" rx="6" fill="#854d0e" />
  </g>
  <text x="200" y="350" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="20" fill="#facc15" text-anchor="middle">1st Place Hackathon Champions</text>
</svg>`,

    'achievement-robotics.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="100%" height="100%" rx="32" fill="#0f172a" />
  <circle cx="200" cy="180" r="110" fill="#0284c7" opacity="0.2" />
  <g transform="translate(100, 80) scale(1)">
    <path d="M50 40 L150 40 L150 120 C150 180 50 180 50 120 Z" fill="#93c5fd" stroke="#60a5fa" stroke-width="6" />
    <path d="M50 60 C10 60 10 110 50 110" stroke="#93c5fd" stroke-width="10" stroke-linecap="round" fill="none" />
    <path d="M150 60 C190 60 190 110 150 110" stroke="#93c5fd" stroke-width="10" stroke-linecap="round" fill="none" />
    <rect x="85" y="160" width="30" height="40" fill="#2563eb" />
    <rect x="50" y="200" width="100" height="36" rx="6" fill="#1e3a8a" />
  </g>
  <text x="200" y="350" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="20" fill="#38bdf8" text-anchor="middle">Robotics Autonomous Cup</text>
</svg>`,

    'academic-seal.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <defs>
    <radialGradient id="grad-seal" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="70%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#a16207" />
    </radialGradient>
  </defs>
  <!-- Outer sawtooth seal -->
  <circle cx="150" cy="150" r="140" fill="url(#grad-seal)" stroke="#854d0e" stroke-width="4" />
  <circle cx="150" cy="150" r="115" fill="none" stroke="#713f12" stroke-width="3" stroke-dasharray="6,4" />
  <circle cx="150" cy="150" r="95" fill="#fef9c3" stroke="#854d0e" stroke-width="3" />
  <!-- Center crest -->
  <text x="150" y="130" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="16" fill="#713f12" text-anchor="middle">OFFICIAL ACADEMIC</text>
  <text x="150" y="155" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="22" fill="#854d0e" text-anchor="middle">VERIFIED</text>
  <text x="150" y="180" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="14" fill="#713f12" text-anchor="middle">SEAL OF EXCELLENCE</text>
  <!-- Stars -->
  <text x="150" y="215" font-size="20" fill="#ca8a04" text-anchor="middle">★ ★ ★</text>
</svg>`,

    'computer-lab-3.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="100%" height="100%" fill="#0b132b" />
  <!-- Desks and workstations -->
  <rect x="50" y="180" width="700" height="260" rx="8" fill="#1c2541" />
  <!-- Multiple monitors -->
  <rect x="100" y="120" width="160" height="110" rx="6" fill="#3a506b" stroke="#5bc0be" stroke-width="2" />
  <rect x="160" y="230" width="40" height="25" fill="#3a506b" />
  <rect x="320" y="120" width="160" height="110" rx="6" fill="#3a506b" stroke="#5bc0be" stroke-width="2" />
  <rect x="380" y="230" width="40" height="25" fill="#3a506b" />
  <rect x="540" y="120" width="160" height="110" rx="6" fill="#3a506b" stroke="#5bc0be" stroke-width="2" />
  <rect x="600" y="230" width="40" height="25" fill="#3a506b" />
  <!-- Text banner -->
  <text x="400" y="70" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="26" fill="#ffffff" text-anchor="middle">Computer Lab 3 — Highschool Technology Wing</text>
  <text x="400" y="100" font-family="'JetBrains Mono', monospace" font-size="14" fill="#5bc0be" text-anchor="middle">High-Performance Workstations &bull; Linux &bull; Dual Monitors &bull; Robotics Bay</text>
</svg>`,

    'student-leadership.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <rect width="100%" height="100%" fill="#0f172a" />
  <!-- Four student officer avatar badges -->
  <g transform="translate(100, 120)">
    <circle cx="50" cy="50" r="50" fill="#2563eb" />
    <text x="50" y="60" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="28" fill="#ffffff" text-anchor="middle">PR</text>
    <text x="50" y="130" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="16" fill="#ffffff" text-anchor="middle">President</text>
  </g>
  <g transform="translate(260, 120)">
    <circle cx="50" cy="50" r="50" fill="#0891b2" />
    <text x="50" y="60" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="28" fill="#ffffff" text-anchor="middle">VP</text>
    <text x="50" y="130" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="16" fill="#ffffff" text-anchor="middle">Vice Pres.</text>
  </g>
  <g transform="translate(420, 120)">
    <circle cx="50" cy="50" r="50" fill="#059669" />
    <text x="50" y="60" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="28" fill="#ffffff" text-anchor="middle">TL</text>
    <text x="50" y="130" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="16" fill="#ffffff" text-anchor="middle">Tech Lead</text>
  </g>
  <g transform="translate(580, 120)">
    <circle cx="50" cy="50" r="50" fill="#7c3aed" />
    <text x="50" y="60" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="28" fill="#ffffff" text-anchor="middle">SEC</text>
    <text x="50" y="130" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700" font-size="16" fill="#ffffff" text-anchor="middle">Secretary</text>
  </g>
  <text x="400" y="360" font-family="'Space Grotesk', sans-serif" font-weight="800" font-size="24" fill="#ffffff" text-anchor="middle">ARX Student Executive Governance</text>
  <text x="400" y="395" font-family="'Space Grotesk', sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Elected Student Officers Working with School Faculty Mentors</text>
</svg>`
  };

  for (const [filename, content] of Object.entries(assets)) {
    const dest = path.join(uploadsDir, filename);
    fs.writeFileSync(dest, content.trim(), 'utf-8');
  }
}