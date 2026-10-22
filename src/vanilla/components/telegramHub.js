import { api } from '../../services/api.js';
import { icon } from '../icons.js';

let hubState = {
  activeTab: 'channel',
  broadcasts: [],
  channelInfo: {
    name: 'ARX IT CLUB OF SJS Official Channel',
    handle: '@arxitclub',
    url: 'https://t.me/arxitclub',
    verified: true,
    subscribersCount: 260
  },
  loading: true,
  filterTag: 'all',
  searchQuery: '',
  copiedToken: false,
  activationUrl: 'https://t.me/ARXITCLUB_bot',
  activationToken: '',
  botConfig: {
    botUsername: 'ARXITCLUB_bot',
    botUrl: 'https://t.me/ARXITCLUB_bot',
    configured: true
  }
};

let currentMember = null;

export async function fetchTelegramData(member) {
  currentMember = member;
  hubState.loading = true;

  try {
    const [bRes, cRes] = await Promise.all([
      api.getTelegramBroadcasts().catch(() => ({ broadcasts: [], channelInfo: null })),
      api.getTelegramConfig().catch(() => null)
    ]);

    if (bRes.broadcasts) hubState.broadcasts = bRes.broadcasts;
    if (bRes.channelInfo) hubState.channelInfo = bRes.channelInfo;

    if (cRes) {
      hubState.botConfig = {
        botUsername: cRes.telegramBotUsername || 'ARXITCLUB_bot',
        botUrl: cRes.telegramBotUrl || 'https://t.me/ARXITCLUB_bot',
        configured: Boolean(cRes.botConfigured)
      };
      if (cRes.telegramChannelName) {
        hubState.channelInfo = {
          ...hubState.channelInfo,
          handle: cRes.telegramChannelName,
          url: cRes.telegramChannelUrl || hubState.channelInfo.url
        };
      }
    }

    if (member && !member.telegramActivated) {
      try {
        const actRes = await api.createActivationToken();
        if (actRes.activationUrl) hubState.activationUrl = actRes.activationUrl;
        if (actRes.activationToken) hubState.activationToken = actRes.activationToken;
      } catch (err) {
        console.warn('Could not load activation token', err);
      }
    }
  } catch (err) {
    console.error('Failed to fetch telegram data', err);
  } finally {
    hubState.loading = false;
    updateHubUI();
  }
}

export function renderTelegramHub(member) {
  currentMember = member;
  return `<div id="telegram-hub-container" class="border border-[#282828]/10 dark:border-[#25473C] bg-white dark:bg-[#102B22] text-[#282828] dark:text-white overflow-hidden rounded-xl shadow-xs transition-colors duration-200">
    ${renderHubContent()}
  </div>`;
}

function renderHubContent() {
  const member = currentMember;
  const { activeTab, broadcasts, channelInfo, loading, filterTag, searchQuery, copiedToken, activationUrl, activationToken, botConfig } = hubState;

  const allTags = ['all', '#announcements', '#workshops', '#lab', '#certificates'];

  const filteredBroadcasts = broadcasts.filter((b) => {
    if (filterTag !== 'all' && !(b.tags || []).includes(filterTag)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (b.content || '').toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q);
    }
    return true;
  });

  const botCommands = [
    { cmd: '/status', desc: 'Inspect your active membership ID, class, role, and course enrollments' },
    { cmd: '/courses', desc: 'Browse available technical curriculum and active workshop tracks' },
    { cmd: '/events', desc: 'View upcoming tech talks and hands-on lab sessions scheduled in Lab 3' },
    { cmd: '/certificates', desc: 'List your verified landscape certificates and credential IDs' },
    { cmd: '/attendance', desc: 'Check your total sessions attended and credential eligibility percentage' },
    { cmd: '/announcements', desc: 'Read latest club broadcasts and urgent campus notices' },
    { cmd: '/lab', desc: 'Get Computer Lab 3 opening hours, location details, and rules' },
    { cmd: '/contact', desc: 'Direct support contact information and academic leadership contacts' }
  ];

  return `
    <!-- Hub Header -->
    <div class="p-4 sm:p-5 bg-[#FAF4EE] dark:bg-[#0A211A] border-b border-[#282828]/10 dark:border-[#25473C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-md bg-white dark:bg-[#15362B] border border-[#282828]/15 dark:border-[#25473C] text-[#FC6454] dark:text-[#6BB89E] flex items-center justify-center">
          ${icon('Send', 'w-4 h-4')}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-sm sm:text-base font-bold text-[#282828] dark:text-white tracking-tight">
              ${channelInfo.name}
            </h3>
            <span class="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-sm bg-[#FC6454]/10 dark:bg-[#2F8068]/30 text-[#FC6454] dark:text-[#6BB89E] border border-[#FC6454]/25 dark:border-[#25473C] uppercase">
              ${icon('CheckCircle2', 'w-2.5 h-2.5')} VERIFIED
            </span>
          </div>
          <div class="flex items-center gap-2 text-xs font-mono text-[#282828]/60 dark:text-white mt-0.5">
            <a
              href="${channelInfo.url}"
              target="_blank"
              rel="noreferrer"
              class="text-[#FC6454] dark:text-[#6BB89E] font-medium hover:underline flex items-center gap-1">
              <span>${channelInfo.handle}</span>
              ${icon('ExternalLink', 'w-2.5 h-2.5')}
            </a>
            <span>·</span>
            <span>${channelInfo.subscribersCount} Connected</span>
          </div>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div class="flex items-center bg-[#EFE6DE]/70 dark:bg-[#071A14] p-1 rounded-lg border border-[#282828]/10 dark:border-[#25473C] self-start sm:self-auto gap-1">
        <button
          id="tg-tab-channel"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer border-0 ${
            activeTab === 'channel'
              ? 'bg-white dark:bg-[#15362B] text-[#282828] dark:text-white shadow-xs font-semibold'
              : 'text-[#282828]/70 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] bg-transparent'
          }">
          ${icon('MessageSquare', 'w-3.5 h-3.5')}
          <span>Channel Feed</span>
        </button>
        <button
          id="tg-tab-bot"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer border-0 ${
            activeTab === 'bot'
              ? 'bg-white dark:bg-[#15362B] text-[#282828] dark:text-white shadow-xs font-semibold'
              : 'text-[#282828]/70 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] bg-transparent'
          }">
          ${icon('Bot', 'w-3.5 h-3.5')}
          <span>Official Bot Hub</span>
        </button>
      </div>
    </div>

    <!-- Tab 1: Channel Feed -->
    ${activeTab === 'channel' ? `
      <div class="p-4 sm:p-5 space-y-4">
        <!-- Filter Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#282828]/10 dark:border-[#25473C]">
          <div class="flex flex-wrap items-center gap-1">
            ${allTags.map((tag) => `
              <button
                data-tg-tag="${tag}"
                class="px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer border ${
                  filterTag === tag
                    ? 'bg-[#FC6454] dark:bg-[#2F8068] text-white dark:text-white border-[#FC6454] dark:border-[#2F8068] font-bold'
                    : 'bg-[#FAF4EE] dark:bg-[#15362B] text-[#282828]/70 dark:text-white hover:text-[#282828] dark:hover:text-[#F1F7F4] border-[#282828]/15 dark:border-[#25473C]'
                }">
                ${tag === 'all' ? 'All Updates' : tag}
              </button>
            `).join('')}
          </div>

          <div class="relative w-full sm:w-60">
            ${icon('Search', 'w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#282828]/40 dark:text-white')}
            <input
              id="tg-search-input"
              type="text"
              placeholder="Filter broadcasts..."
              value="${searchQuery}"
              class="w-full pl-8 pr-3 py-1 rounded-md bg-white dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#294B40] text-xs text-[#282828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FC6454]/30 dark:focus:ring-[#6BB89E]/30" />
          </div>
        </div>

        ${loading ? `
          <div class="py-12 text-center text-xs font-mono text-[#282828]/40 dark:text-white">
            Loading Telegram broadcasts...
          </div>
        ` : filteredBroadcasts.length === 0 ? `
          <div class="py-12 text-center text-[#282828]/50 dark:text-white space-y-1">
            <p class="text-xs">No broadcasts matching filter</p>
          </div>
        ` : `
          <div class="space-y-3">
            ${filteredBroadcasts.map((post) => `
              <div
                class="p-4 rounded-lg bg-[#FAF4EE]/70 dark:bg-[#0A211A] border transition-all ${
                  post.pinned
                    ? 'border-[#FC6454]/50 dark:border-[#6BB89E]/50'
                    : 'border-[#282828]/10 dark:border-[#25473C] hover:border-[#FC6454]/40 dark:hover:border-[#366656]'
                }">
                <!-- Post Header -->
                <div class="flex items-center justify-between text-xs text-[#282828]/60 dark:text-white pb-2 mb-2 border-b border-[#282828]/10 dark:border-[#25473C]">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-[#282828] dark:text-white flex items-center gap-1.5 text-xs">
                      ${icon('Send', 'w-3 h-3 text-[#FC6454] dark:text-[#6BB89E]')}
                      ${post.author}
                    </span>
                    ${post.pinned ? `
                      <span class="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#FC6454] dark:text-[#6BB89E] bg-[#FC6454]/10 dark:bg-[#2F8068]/30 px-1.5 py-0.5 rounded-sm border border-[#FC6454]/30 dark:border-[#25473C] uppercase">
                        ${icon('Pin', 'w-2.5 h-2.5')} PINNED
                      </span>
                    ` : ''}
                  </div>

                  <div class="flex items-center gap-3 text-[11px] text-[#282828]/50 dark:text-white font-mono">
                    <span>${post.date}</span>
                    <span>${post.time}</span>
                  </div>
                </div>

                <!-- Post Content -->
                <div class="text-xs sm:text-sm text-[#282828]/80 dark:text-white/90 whitespace-pre-line leading-relaxed font-sans">
                  ${post.content}
                </div>

                <!-- Post Tags -->
                <div class="flex flex-wrap gap-1.5 pt-2.5">
                  ${(post.tags || []).map((t) => `
                    <span class="text-[11px] font-mono text-[#FC6454] dark:text-[#6BB89E] bg-white dark:bg-[#15362B] px-1.5 py-0.5 rounded-sm border border-[#282828]/10 dark:border-[#25473C]">
                      ${t}
                    </span>
                  `).join('')}
                </div>

                <!-- Post Footer / Reactions -->
                <div class="pt-2.5 mt-2.5 border-t border-[#282828]/10 dark:border-[#25473C] flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-1">
                    ${['🔥', '🚀', '💡', '❤️', '👍'].map((emoji) => {
                      const existing = (post.reactions || []).find((r) => r.emoji === emoji);
                      return `
                        <button
                          data-post-id="${post.id}"
                          data-emoji="${emoji}"
                          class="tg-reaction-btn inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-[#15362B] hover:bg-[#EFE6DE] dark:hover:bg-[#1e4839] border border-[#282828]/10 dark:border-[#25473C] text-xs transition-colors cursor-pointer"
                          title="React with ${emoji}">
                          <span>${emoji}</span>
                          <span class="text-[10px] font-mono text-[#282828]/70 dark:text-white">
                            ${existing ? existing.count : 0}
                          </span>
                        </button>
                      `;
                    }).join('')}
                  </div>

                  <div class="flex items-center gap-1 text-[11px] text-[#282828]/50 dark:text-white font-mono">
                    ${icon('Eye', 'w-3 h-3')}
                    <span>${post.views || 0} views</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    ` : `
      <!-- Tab 2: Bot Hub -->
      <div class="p-4 sm:p-5 space-y-5">
        <!-- Bot Hero Box -->
        <div class="p-4 rounded-xl bg-[#FAF4EE] dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#FC6454] to-[#f87f73] dark:from-[#2F8068] dark:to-[#4bb896] text-white flex items-center justify-center shrink-0 shadow-xs">
              ${icon('Bot', 'w-6 h-6')}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-sm sm:text-base text-[#282828] dark:text-white">
                  ARX Official Telegram Bot
                </h4>
                <span class="text-[10px] font-mono text-emerald-700 dark:text-[#58B889] bg-emerald-50 dark:bg-[#102B22] px-2 py-0.5 rounded-sm border border-emerald-200 dark:border-[#25473C] uppercase font-semibold">
                  ONLINE
                </span>
              </div>
              <p class="text-xs text-[#282828]/60 dark:text-white mt-0.5 font-mono">
                Official Handle: <strong class="text-[#FC6454] dark:text-[#6BB89E]">@${botConfig.botUsername}</strong>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <a
              href="${member?.telegramActivated ? botConfig.botUrl : activationUrl}"
              target="_blank"
              rel="noreferrer"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FC6454] hover:bg-[#e85444] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer">
              ${icon('Bot', 'w-4 h-4')}
              <span>${member?.telegramActivated ? 'Launch Bot in Telegram' : 'Activate in Telegram'}</span>
              ${icon('ExternalLink', 'w-3.5 h-3.5 ml-0.5')}
            </a>
            <a
              href="${channelInfo.url}"
              target="_blank"
              rel="noreferrer"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-[#15362B] border border-[#282828]/15 dark:border-[#25473C] text-[#282828] dark:text-white hover:bg-[#EFE6DE] dark:hover:bg-[#1e4839] text-xs font-medium transition-colors cursor-pointer">
              ${icon('Send', 'w-3.5 h-3.5 text-[#FC6454] dark:text-[#6BB89E]')}
              <span>Join Channel</span>
            </a>
          </div>
        </div>

        <!-- Connection Status -->
        <div class="p-4 rounded-xl bg-white dark:bg-[#15362B] border border-[#282828]/10 dark:border-[#25473C]">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#282828]/10 dark:border-[#25473C]">
            <div>
              <p class="text-[11px] font-mono uppercase tracking-wider text-[#282828]/50 dark:text-white">
                Your Telegram Account Status
              </p>
              <h5 class="text-sm font-bold text-[#282828] dark:text-white mt-0.5">
                ${member?.studentName || 'Member'} · <span class="font-mono text-xs">${member?.memberId || ''}</span>
              </h5>
            </div>

            ${member?.telegramActivated ? `
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-[#0A211A] border border-emerald-200 dark:border-[#25473C] text-emerald-800 dark:text-[#58B889] text-xs font-semibold">
                ${icon('ShieldCheck', 'w-4 h-4 text-emerald-600 dark:text-[#4ADE80]')}
                <span>Account Linked (${member.telegramUsername || `@user_${member.telegramUserId}`})</span>
              </div>
            ` : `
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-[#20180B] border border-amber-200 dark:border-[#4D3B1C] text-amber-800 dark:text-amber-300 text-xs font-semibold">
                ${icon('Clock', 'w-4 h-4 text-amber-600 dark:text-amber-400')}
                <span>Pending Telegram Connection</span>
              </div>
            `}
          </div>

          ${!member?.telegramActivated ? `
            <div class="mt-3.5 pt-1 space-y-3">
              <p class="text-xs text-[#282828]/75 dark:text-white leading-relaxed">
                To receive automated lab notifications, verified landscape credentials, and access to the interactive curriculum menu, activate your Telegram account using the secure one-click link below:
              </p>

              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div class="flex-1 px-3 py-2 rounded-lg bg-[#FAF4EE] dark:bg-[#0C241C] border border-[#282828]/15 dark:border-[#294B40] font-mono text-xs text-[#282828] dark:text-white truncate select-all">
                  ${activationUrl}
                </div>
                ${activationToken ? `
                  <button
                    id="tg-copy-token-btn"
                    class="px-3.5 py-2 rounded-lg bg-white dark:bg-[#102B22] border border-[#282828]/15 dark:border-[#25473C] text-xs font-medium text-[#282828] dark:text-white hover:bg-[#EFE6DE] dark:hover:bg-[#15362B] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0">
                    ${copiedToken ? `
                      ${icon('Check', 'w-3.5 h-3.5 text-emerald-600 dark:text-[#4ADE80]')}
                      <span class="text-emerald-700 dark:text-[#4ADE80]">Copied!</span>
                    ` : `
                      ${icon('Copy', 'w-3.5 h-3.5 text-[#FC6454] dark:text-[#6BB89E]')}
                      <span>Copy Token</span>
                    `}
                  </button>
                ` : ''}
                <a
                  href="${activationUrl}"
                  target="_blank"
                  rel="noreferrer"
                  class="px-4 py-2 rounded-lg bg-[#FC6454] hover:bg-[#e85444] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0">
                  <span>Connect in Telegram</span>
                  ${icon('ExternalLink', 'w-3.5 h-3.5')}
                </a>
              </div>

              <div class="p-3 rounded-lg bg-[#FAF4EE]/70 dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] text-xs space-y-1.5 text-[#282828]/70 dark:text-white">
                <p class="font-semibold text-[#282828] dark:text-white flex items-center gap-1.5">
                  ${icon('Zap', 'w-3.5 h-3.5 text-[#FC6454] dark:text-[#6BB89E]')} How connection works:
                </p>
                <ol class="list-decimal list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
                  <li>Click <strong>Connect in Telegram</strong> to open <strong>@${botConfig.botUsername}</strong> on your phone or desktop.</li>
                  <li>Press the <strong>Start</strong> button in the Telegram chat to complete authorization.</li>
                  <li>Join the official <strong>${channelInfo.handle}</strong> channel to receive broadcast notices.</li>
                </ol>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Bot Commands Directory -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <div>
              <h5 class="text-xs font-bold font-mono uppercase tracking-wider text-[#282828] dark:text-white">
                Official Telegram Commands Directory
              </h5>
              <p class="text-[11px] text-[#282828]/60 dark:text-white">
                These commands can be sent directly to @${botConfig.botUsername} inside Telegram:
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            ${botCommands.map((item) => `
              <div class="p-3 rounded-lg bg-[#FAF4EE]/60 dark:bg-[#0A211A] border border-[#282828]/10 dark:border-[#25473C] flex items-start justify-between gap-3 hover:border-[#FC6454]/40 dark:hover:border-[#366656] transition-colors">
                <div class="space-y-1">
                  <span class="font-mono text-xs font-bold text-[#FC6454] dark:text-[#6BB89E] bg-white dark:bg-[#15362B] px-1.5 py-0.5 rounded-sm border border-[#282828]/10 dark:border-[#25473C]">
                    ${item.cmd}
                  </span>
                  <p class="text-xs text-[#282828]/75 dark:text-white leading-relaxed">
                    ${item.desc}
                  </p>
                </div>
                <a
                  href="https://t.me/${botConfig.botUsername}?start=${item.cmd.replace('/', '')}"
                  target="_blank"
                  rel="noreferrer"
                  class="p-1.5 rounded-md bg-white dark:bg-[#15362B] border border-[#282828]/10 dark:border-[#25473C] text-[#282828]/60 dark:text-white hover:text-[#FC6454] dark:hover:text-[#6BB89E] transition-colors cursor-pointer shrink-0"
                  title="Send ${item.cmd} to bot in Telegram">
                  ${icon('ExternalLink', 'w-3.5 h-3.5')}
                </a>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `}
  `;
}

function updateHubUI() {
  const container = document.getElementById('telegram-hub-container');
  if (container) {
    container.innerHTML = renderHubContent();
    attachHubEventListeners();
  }
}

export function initTelegramHubEvents(member) {
  currentMember = member;
  attachHubEventListeners();
  fetchTelegramData(member);
}

function attachHubEventListeners() {
  // Tabs
  const tabChannel = document.getElementById('tg-tab-channel');
  if (tabChannel) {
    tabChannel.onclick = () => {
      hubState.activeTab = 'channel';
      updateHubUI();
    };
  }

  const tabBot = document.getElementById('tg-tab-bot');
  if (tabBot) {
    tabBot.onclick = () => {
      hubState.activeTab = 'bot';
      updateHubUI();
    };
  }

  // Tags
  document.querySelectorAll('[data-tg-tag]').forEach(btn => {
    btn.onclick = () => {
      hubState.filterTag = btn.getAttribute('data-tg-tag');
      updateHubUI();
    };
  });

  // Search
  const searchInput = document.getElementById('tg-search-input');
  if (searchInput) {
    searchInput.oninput = (e) => {
      hubState.searchQuery = e.target.value;
      updateHubUI();
    };
  }

  // Reactions
  document.querySelectorAll('.tg-reaction-btn').forEach(btn => {
    btn.onclick = async () => {
      const postId = btn.getAttribute('data-post-id');
      const emoji = btn.getAttribute('data-emoji');
      try {
        const res = await api.reactToTelegramBroadcast(postId, emoji);
        if (res.success && res.reactions) {
          hubState.broadcasts = hubState.broadcasts.map(b => b.id === postId ? { ...b, reactions: res.reactions } : b);
          updateHubUI();
        }
      } catch (err) {
        console.error('Failed to react', err);
      }
    };
  });

  // Copy token
  const copyBtn = document.getElementById('tg-copy-token-btn');
  if (copyBtn) {
    copyBtn.onclick = () => {
      if (hubState.activationToken) {
        navigator.clipboard.writeText(hubState.activationToken);
        hubState.copiedToken = true;
        updateHubUI();
        setTimeout(() => {
          hubState.copiedToken = false;
          updateHubUI();
        }, 2000);
      }
    };
  }
}
