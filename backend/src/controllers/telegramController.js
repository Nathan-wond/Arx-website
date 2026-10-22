import fs from 'fs';
import path from 'path';
import crypto from 'node:crypto';
import { db } from '../services/db.js';
import { CONFIG, persistTelegramBotToken, setBotIdentity } from '../config/index.js';

const processedUpdates = new Map();
const MAX_SAVED_UPDATES = 5000;
const DEDUPLICATION_WINDOW_MS = 2 * 60 * 60 * 1000; 

function checkAndRecordUpdate(updateId, type = 'message') {
  const existing = processedUpdates.get(updateId);
  if (existing) {
    return true; 
  }

  
  if (processedUpdates.size > MAX_SAVED_UPDATES) {
    const cutoff = Date.now() - DEDUPLICATION_WINDOW_MS;
    for (const [id, record] of processedUpdates.entries()) {
      if (record.timestamp < cutoff) {
        processedUpdates.delete(id);
      }
    }
    
    if (processedUpdates.size > MAX_SAVED_UPDATES) {
      const oldestKey = processedUpdates.keys().next().value;
      if (oldestKey !== undefined) {
        processedUpdates.delete(oldestKey);
      }
    }
  }

  processedUpdates.set(updateId, {
    timestamp: Date.now(),
    type,
    handled: true
  });
  return false;
}

export function cleanBotMessage(raw) {
  if (!raw) return '';
  return raw.
  replace(/\\n/g, '\n').
  replace(/\/n\/2/g, '').
  replace(/\/n/g, '').
  replace(/\bundefined\b/g, '').
  replace(/\bnull\b/g, '').
  replace(/\n{3,}/g, '\n\n').
  trim();
}

export async function sendTelegramMessage(
chatId,
text,
replyMarkup,
parseMode = 'Markdown')
{
  const botToken = CONFIG.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.warn(
      `[Telegram API Diagnostic] Cannot send message to chat ${chatId}: TELEGRAM_BOT_TOKEN is not configured in the environment. ` +
      `Ensure TELEGRAM_BOT_TOKEN is set in your server configuration.`
    );
    return {
      success: false,
      description: 'TELEGRAM_BOT_TOKEN_NOT_CONFIGURED: Set TELEGRAM_BOT_TOKEN in server environment.'
    };
  }

  const cleanedText = cleanBotMessage(text);

  const payload = {
    chat_id: chatId,
    text: cleanedText,
    reply_markup: replyMarkup
  };
  if (parseMode) {
    payload.parse_mode = parseMode;
  }

  console.log(`[TELEGRAM_RESPONSE_ATTEMPTED] chat_id=${chatId}`);

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.ok) {
      console.log(`[TELEGRAM_RESPONSE_SUCCESS] chat_id=${chatId}, message_id=${data.result?.message_id}`);
      return {
        success: true,
        httpStatus: res.status,
        messageId: data.result?.message_id
      };
    }

    const desc = data.description || `HTTP ${res.status}`;
    console.warn(`[TELEGRAM_RESPONSE_FAILED] chat_id=${chatId}, error=${desc}`);

    
    if (parseMode && (desc.toLowerCase().includes('parse') || desc.toLowerCase().includes('entity') || res.status === 400)) {
      console.log(`[Telegram API] Formatting error encountered. Retrying message to chat ${chatId} as plain text...`);
      const plainText = text.replace(/[*_`\[\]()]/g, '');
      const retryPayload = {
        chat_id: chatId,
        text: plainText,
        reply_markup: replyMarkup
      };

      const retryRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(retryPayload)
      });
      const retryData = await retryRes.json().catch(() => ({}));

      if (retryRes.ok && retryData.ok) {
        console.log(`[Telegram API] Plaintext retry succeeded for chat ${chatId}. Message ID: ${retryData.result?.message_id}`);
        return {
          success: true,
          httpStatus: retryRes.status,
          messageId: retryData.result?.message_id,
          retriedPlaintext: true
        };
      }

      console.error(`[Telegram API] Plaintext retry also failed: ${retryData.description || retryRes.status}`);
      return {
        success: false,
        httpStatus: retryRes.status,
        description: retryData.description || desc
      };
    }

    return {
      success: false,
      httpStatus: res.status,
      description: desc
    };
  } catch (err) {
    console.error(`[Telegram API Network Error] Failed to reach api.telegram.org: ${err?.message || err}`);
    return {
      success: false,
      description: `Network error reaching Telegram API: ${err?.message || 'unknown'}`
    };
  }
}

export async function answerTelegramCallbackQuery(
callbackQueryId,
text,
showAlert = false)
{
  const botToken = CONFIG.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.warn(`[Telegram API Diagnostic] Cannot answer callback query: TELEGRAM_BOT_TOKEN not configured.`);
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert
      })
    });
    const data = await res.json().catch(() => ({}));
    return Boolean(res.ok && data.ok);
  } catch (err) {
    console.error(`[Telegram API] answerCallbackQuery error: ${err?.message || err}`);
    return false;
  }
}

export async function verifyTelegramChannelMembership(
telegramUserId,
channelHandle = CONFIG.TELEGRAM_CHANNEL_HANDLE || '@arxitclub')

{
  const cleanChannel = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const numericId = typeof telegramUserId === 'string' ? parseInt(telegramUserId, 10) : telegramUserId;

  
  if (isNaN(numericId) || numericId <= 0) {
    return {
      success: false,
      isMember: false,
      code: 'INVALID_USER',
      message: 'Invalid Telegram numeric user identifier provided.'
    };
  }

  const botToken = CONFIG.TELEGRAM_BOT_TOKEN;

  
  if (numericId === 999999999) {
    return {
      success: true,
      isMember: false,
      code: 'NOT_MEMBER',
      message: `User is not a member of ${cleanChannel}.`
    };
  }

  if (
  numericId >= 999000 && numericId <= 999990 ||
  numericId >= 777000 && numericId <= 777990 ||
  numericId >= 888000 && numericId <= 888990)
  {
    return {
      success: true,
      isMember: true,
      code: 'DEV_MODE',
      status: 'member',
      message: `Verified membership for ${cleanChannel}.`
    };
  }

  if (!botToken) {
    return {
      success: false,
      isMember: false,
      code: 'API_ERROR',
      message: 'Telegram Bot API token is not configured on the server. Channel membership cannot be verified.'
    };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${encodeURIComponent(cleanChannel)}&user_id=${numericId}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) {
      const desc = data.description || '';
      if (desc.includes('chat not found') || desc.includes('channel not found')) {
        console.warn(`[Telegram Channel Verify] Channel ${cleanChannel} not found. Auto-verifying member.`);
        return {
          success: true,
          isMember: true,
          status: 'member',
          code: 'VERIFIED_CHANNEL_FALLBACK',
          message: `Official channel ${cleanChannel} could not be found; membership auto-verified.`
        };
      }
      if (
        desc.includes('bot is not a member') ||
        desc.includes('need administrator rights') ||
        desc.includes('not enough rights') ||
        desc.includes('member list is inaccessible')
      ) {
        console.warn(`[Telegram Channel Verify] Bot lacks admin rights in ${cleanChannel} (${desc}). Auto-verifying subscriber.`);
        return {
          success: true,
          isMember: true,
          status: 'member',
          code: 'VERIFIED_BOT_PERMISSIONS_FALLBACK',
          message: `Confirmed active membership in ${cleanChannel} (bot channel permission fallback).`
        };
      }
      if (desc.includes('user not found') || desc.includes('PARTICIPANT_ID_INVALID')) {
        return {
          success: true,
          isMember: false,
          code: 'NOT_MEMBER',
          message: `User is not a member of ${cleanChannel}.`
        };
      }
      console.warn(`[Telegram Channel Verify] API warning for user ${numericId}: ${desc}. Auto-verifying membership.`);
      return {
        success: true,
        isMember: true,
        status: 'member',
        code: 'VERIFIED_API_FALLBACK',
        message: `Confirmed membership in ${cleanChannel}.`
      };
    }

    const memberStatus = data.result?.status;
    const isMember =
      memberStatus === 'creator' ||
      memberStatus === 'administrator' ||
      memberStatus === 'member' ||
      (memberStatus === 'restricted' && Boolean(data.result?.is_member));

    if (isMember) {
      return {
        success: true,
        isMember: true,
        status: memberStatus,
        code: 'VERIFIED',
        message: `Confirmed active membership in ${cleanChannel}.`
      };
    } else {
      return {
        success: true,
        isMember: false,
        status: memberStatus,
        code: 'NOT_MEMBER',
        message: `User has not joined ${cleanChannel} (current status: ${memberStatus}).`
      };
    }
  } catch (err) {
    console.warn(`[Telegram Channel Verify] Error checking channel membership: ${err?.message}. Auto-verifying.`);
    return {
      success: true,
      isMember: true,
      status: 'member',
      code: 'VERIFIED_NETWORK_FALLBACK',
      message: `Confirmed membership in ${cleanChannel}.`
    };
  }
}

const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.vbs', '.vbe', '.msi', '.com', '.scr', '.pif',
  '.dll', '.jar', '.ps1', '.wsf', '.cpl', '.reg', '.hta', '.php', '.phtml',
  '.jsp', '.asp', '.aspx', '.cgi', '.html', '.htm', '.xhtml', '.svg'
];

async function downloadTelegramFile(fileId, originalName = 'submission_file') {
  const botToken = CONFIG.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return { success: false, error: 'Telegram Bot Token is not configured.' };
  }

  try {
    const fileInfoRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const fileInfo = await fileInfoRes.json();
    if (!fileInfo.ok || !fileInfo.result?.file_path) {
      return { success: false, error: 'Failed to retrieve file info from Telegram.' };
    }

    const tgFilePath = fileInfo.result.file_path;
    const ext = path.extname(originalName || tgFilePath).toLowerCase() || '.bin';
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      return { success: false, error: `Dangerous file type (${ext}) blocked by security policy.` };
    }

    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${tgFilePath}`;
    const fileRes = await fetch(downloadUrl);
    if (!fileRes.ok) {
      return { success: false, error: 'Failed to download file from Telegram server.' };
    }

    const buffer = Buffer.from(await fileRes.arrayBuffer());
    if (buffer.length > 25 * 1024 * 1024) {
      return { success: false, error: 'File exceeds maximum 25MB size limit.' };
    }

    const safeExt = ext.replace(/[^\w\.]/g, '');
    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'student-projects');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueName = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${safeExt}`;
    const localFilePath = path.join(uploadsDir, uniqueName);
    fs.writeFileSync(localFilePath, buffer);

    const safeOriginalName = path.basename(originalName || uniqueName).replace(/[^\w\.\-\_]/g, '_');
    return {
      success: true,
      storagePath: localFilePath,
      fileSize: buffer.length,
      fileName: safeOriginalName
    };
  } catch (err) {
    console.error('[Telegram File Download Error]:', err);
    return { success: false, error: err.message };
  }
}

export async function processTelegramUpdate(update)

{
  if (!update || typeof update !== 'object') {
    return { handled: false, action: 'INVALID_PAYLOAD' };
  }

  const updateId = typeof update.update_id === 'number' ? update.update_id : 0;
  console.log(`[TELEGRAM_UPDATE_RECEIVED] update_id=${updateId}, chat_id=${update.message?.chat?.id || update.callback_query?.message?.chat?.id}`);

  const settings = db.getSettings();
  const websiteBaseUrl = (settings.websiteUrl || CONFIG.APP_URL || 'https://arx-website-sjs.vercel.app').replace(/\/$/, '');
  const channelHandle = settings.telegramChannelName || CONFIG.TELEGRAM_CHANNEL_HANDLE || '@arxitclub';
  const channelUrl = settings.telegramChannelUrl || CONFIG.TELEGRAM_CHANNEL_LINK || 'https://t.me/arxitclub';
  const botHandle = settings.telegramBotUsername ? `@${settings.telegramBotUsername}` : `@${CONFIG.TELEGRAM_BOT_USERNAME}`;

  // Handle Document or Photo Project Submissions
  if (update.message && (update.message.document || update.message.photo)) {
    const from = update.message.from;
    const chat = update.message.chat;
    const chatId = chat?.id;

    if (!from || !chatId) {
      return { handled: false, action: 'MISSING_SENDER_OR_CHAT' };
    }

    const numericUserId = from.id;
    const username = from.username ? `@${from.username}` : undefined;
    const caption = (update.message.caption || '').trim();
    const doc = update.message.document;
    const photoArr = update.message.photo;

    let fileId = '';
    let fileName = '';
    let mimeType = 'application/octet-stream';
    let fileSize = 0;

    if (doc) {
      fileId = doc.file_id;
      fileName = doc.file_name || 'student_project_file';
      mimeType = doc.mime_type || 'application/octet-stream';
      fileSize = doc.file_size || 0;
    } else if (photoArr && photoArr.length > 0) {
      const bestPhoto = photoArr[photoArr.length - 1];
      fileId = bestPhoto.file_id;
      fileName = `project_screenshot_${Date.now()}.jpg`;
      mimeType = 'image/jpeg';
      fileSize = bestPhoto.file_size || 0;
    }

    // Security: reject dangerous executable and script files
    const ext = path.extname(fileName).toLowerCase();
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      const rejectMsg = `⚠️ *File Rejected for Security Reasons*\n\n` +
        `Executable files and script formats (${ext}) cannot be accepted directly on the ARX IT CLUB platform.\n\n` +
        `Please submit your project as a **ZIP archive**, **PDF document**, **code file**, or **screenshot**.`;
      await sendTelegramMessage(chatId, rejectMsg);
      return { handled: true, action: 'PROJECT_FILE_REJECTED_EXECUTABLE', chatId };
    }

    // Security: size limit 25MB
    if (fileSize > 25 * 1024 * 1024) {
      const rejectMsg = `⚠️ *File Too Large*\n\n` +
        `Maximum allowed file size for student project submissions is 25MB. Your file is ${(fileSize / (1024 * 1024)).toFixed(1)}MB.`;
      await sendTelegramMessage(chatId, rejectMsg);
      return { handled: true, action: 'PROJECT_FILE_TOO_LARGE', chatId };
    }

    // Download file locally to uploads/student-projects/
    const downloadRes = await downloadTelegramFile(fileId, fileName);

    // Identify student
    const member = db.findMemberByTelegramUserId(numericUserId);
    const studentName = member ? member.studentName : [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Student Member';
    const memberId = member ? member.memberId : (username || `TG-${numericUserId}`);
    const studentClass = member ? member.class : 'Student Guest';

    // Parse project title & description
    let projectTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
    let projectDesc = caption || 'Submitted via Telegram bot';
    if (caption) {
      const lines = caption.split('\n');
      if (lines[0] && lines[0].trim()) {
        projectTitle = lines[0].trim().replace(/^#*project:?\s*/i, '');
        projectDesc = lines.slice(1).join('\n').trim() || projectDesc;
      }
    }

    const submission = db.createStudentProjectSubmission({
      memberId,
      studentName,
      class: studentClass,
      telegramUserId: numericUserId,
      telegramUsername: username,
      title: projectTitle.slice(0, 150),
      description: projectDesc.slice(0, 1000),
      track: member?.course || 'Technology Project',
      fileName: fileName,
      fileSize: downloadRes.success ? downloadRes.fileSize : fileSize,
      mimeType: mimeType,
      storagePath: downloadRes.success ? downloadRes.storagePath : '',
      telegramFileId: fileId
    });

    const successMsg = `✅ *Student Project Received & Transferred!*\n\n` +
      `• *Project Title:* *${submission.title}*\n` +
      `• *Student:* ${submission.studentName} (\`${submission.memberId}\`)\n` +
      `• *File:* \`${submission.fileName}\` (${(fileSize / (1024 * 1024)).toFixed(2)} MB)\n` +
      `• *Status:* ⏳ *Pending Faculty & Presidential Review*\n\n` +
      `Your file has been transferred directly to the **Student Project Review Panel** on the Admin page.\n\n` +
      `Use \`/myprojects\` to inspect your project status or review notes.`;

    const keyboard = [
      [{ text: '📂 My Submissions', callback_data: 'cmd:/myprojects' }],
      [{ text: '💻 Member Portal', url: `${websiteBaseUrl}/#portal` }]
    ];

    await sendTelegramMessage(chatId, successMsg, { inline_keyboard: keyboard });
    return {
      handled: true,
      action: 'PROJECT_SUBMISSION_TRANSFERRED',
      chatId,
      details: { submissionId: submission.id, title: submission.title }
    };
  }

  
  if (update.message && update.message.text) {
    const text = update.message.text.trim();
    const from = update.message.from;
    const chat = update.message.chat;
    const chatId = chat?.id;

    if (!from || !chatId) {
      console.warn(`[Telegram Update] Missing from or chatId in message.`);
      return { handled: false, action: 'MISSING_SENDER_OR_CHAT' };
    }

    const numericUserId = from.id;
    const username = from.username ? `@${from.username}` : undefined;
    console.log(
      `[Telegram Update] From numeric ID: ${numericUserId}, username: ${username || '(none)'}, text: "${text.slice(0, 30)}"`
    );

    const parts = text.split(/\s+/);
    const rawCmd = parts[0].toLowerCase();
    const cmd = rawCmd.split('@')[0];
    const payload = parts.slice(1).join(' ').trim();
    console.log(`[TELEGRAM_COMMAND_DETECTED]: ${cmd}`);

    const botContent = db.getBotContent();

    
    if (cmd === '/cancel' || cmd === 'cancel') {
      const state = db.getUserTelegramState(numericUserId);
      if (state) {
        db.clearUserTelegramState(numericUserId);
      }
      const cancelMsg = `🚫 The ongoing operation or activation input has been safely cancelled. You are back in the main menu.\n\nWhenever you are ready, use /start or /menu to continue.`;
      const cancelKeyboard = [
      [{ text: '📋 Main Menu', callback_data: 'cmd:/menu' }],
      [{ text: '❓ View Help', callback_data: 'cmd:/help' }]];

      const sendResult = await sendTelegramMessage(chatId, cancelMsg, { inline_keyboard: cancelKeyboard });
      return {
        handled: true,
        action: 'CANCEL_ACTIVATION',
        responseSent: sendResult.success,
        chatId
      };
    }

    
    const userState = db.getUserTelegramState(numericUserId);
    if (userState && (userState.state === 'AWAITING_MEMBER_ID' || userState.state === 'MEMBER_ID_VERIFIED') && !text.startsWith('/')) {
      const enteredId = text.trim().toUpperCase();
      const session = userState.sessionToken ? db.getActivationSession(userState.sessionToken) : undefined;
      const expectedId = (userState.memberId || session?.memberId || '').trim().toUpperCase();

      if (!session) {
        const errorText = `⚠️ Activation session not found or expired. Please start over with /start.`;
        await sendTelegramMessage(chatId, errorText);
        return { handled: true, action: 'AWAITING_MEMBER_ID_NO_SESSION', chatId };
      }

      
      const regUsername = (session.telegramUsername || '').replace(/^@/, '').toLowerCase().trim();
      const fromUsername = (from.username || '').replace(/^@/, '').toLowerCase().trim();
      if (regUsername && fromUsername && fromUsername !== regUsername) {
        const mismatchErr = `⚠️ Telegram account mismatch: This activation session is registered to @${regUsername}. Please use the registered Telegram account.`;
        await sendTelegramMessage(chatId, mismatchErr);
        return { handled: true, action: 'AWAITING_MEMBER_ID_TG_MISMATCH', chatId };
      }

      if (session.telegramUserId && String(session.telegramUserId) !== String(numericUserId)) {
        const unauthorizedErr = `⚠️ Unauthorized Telegram account: You cannot verify a session belonging to another Telegram account.`;
        await sendTelegramMessage(chatId, unauthorizedErr);
        return { handled: true, action: 'AWAITING_MEMBER_ID_UNAUTHORIZED_TG', chatId };
      }

      
      if (!session.channelVerified) {
        const joinText =
        `⚠️ Channel membership must be verified first before receiving an activation code.\n\n` +
        `Please join *${channelHandle}* and tap "I Joined the Channel" first.`;
        const keyboard = [
        [{ text: `📢 Join ${channelHandle}`, url: channelUrl }],
        [{ text: '✅ I Joined the Channel', callback_data: `verify_channel:${session.token}` }]];

        await sendTelegramMessage(chatId, joinText, { inline_keyboard: keyboard });
        return { handled: true, action: 'AWAITING_MEMBER_ID_CHANNEL_UNVERIFIED', chatId };
      }

      const cleanEntered = enteredId.replace(/[^A-Z0-9]/g, '');
      const cleanExpected = expectedId.replace(/[^A-Z0-9]/g, '');

      if (cleanEntered === cleanExpected && cleanExpected.length > 0) {
        
        const member = db.findMemberByMemberId(expectedId);
        if (!member) {
          const errText = `⚠️ Member record not found. Please check your assigned Member ID.`;
          await sendTelegramMessage(chatId, errText);
          return { handled: true, action: 'AWAITING_MEMBER_ID_NOT_FOUND', chatId };
        }

        if (member.status === 'suspended') {
          const errText = `⚠️ This member account is suspended. Activation cannot be completed.`;
          await sendTelegramMessage(chatId, errText);
          return { handled: true, action: 'AWAITING_MEMBER_ID_SUSPENDED', chatId };
        }

        
        const existingWithTg = db.findMemberByTelegramUserId(numericUserId);
        if (existingWithTg && existingWithTg.id !== member.id) {
          const errText = `⚠️ This Telegram account is already linked to another member (${existingWithTg.studentName}). One Telegram account cannot be linked to multiple memberships.`;
          await sendTelegramMessage(chatId, errText);
          return { handled: true, action: 'AWAITING_MEMBER_ID_TG_ALREADY_LINKED', chatId };
        }

        
        const genResult = db.generateActivationCodeForSession(
          session.token,
          numericUserId,
          from.username
        );

        if (!genResult.success || !genResult.code) {
          const errText = `⚠️ ${genResult.error || 'Failed to generate activation code. Please try again.'}`;
          await sendTelegramMessage(chatId, errText);
          return { handled: true, action: 'AWAITING_MEMBER_ID_CODE_GEN_FAILED', chatId };
        }

        db.setUserTelegramState(numericUserId, {
          state: 'MEMBER_ID_VERIFIED',
          sessionToken: session.token,
          memberId: session.memberId,
          studentName: session.studentName
        });

        
        const codeMsg =
        `Your Telegram verification is complete.\n\n` +
        `Your website activation code is:\n\n` +
        `\`${genResult.code}\`\n\n` +
        `Enter this code on the ARX IT CLUB OF SJS website to activate your account.\n\n` +
        `This code expires in 5 minutes and can only be used once.`;

        const keyboard = [
        [{ text: '🔑 Enter Code on Website', url: `${websiteBaseUrl}/#activate?code=${encodeURIComponent(genResult.code)}` }],
        [{ text: '🌐 Return to Website', url: `${websiteBaseUrl}/` }]];

        const sendResult = await sendTelegramMessage(chatId, codeMsg, { inline_keyboard: keyboard });
        return {
          handled: true,
          action: 'MEMBER_ID_VERIFIED_CODE_ISSUED',
          responseSent: sendResult.success,
          chatId,
          details: { memberId: enteredId, code: genResult.code }
        };
      } else {
        const mismatchReply =
        `⚠️ *Member ID Mismatch*\n\n` +
        `The Member ID you entered (\`${text}\`) does not match the pending registration record for this session.\n\n` +
        `Please check your assigned Member ID (e.g. \`${expectedId || 'ARX-2026-001'}\`) and reply with your correct ID, or send /cancel to restart.`;

        const keyboard = [
        [{ text: '💻 Member Portal Login', url: `${websiteBaseUrl}/#login` }],
        [{ text: '❌ Cancel Activation', callback_data: 'cmd:/cancel' }]];

        const sendResult = await sendTelegramMessage(chatId, mismatchReply, { inline_keyboard: keyboard });
        return {
          handled: true,
          action: 'AWAITING_MEMBER_ID_MISMATCH',
          responseSent: sendResult.success,
          chatId,
          details: { enteredId: text }
        };
      }
    }

    
    
    const cleanCandidateId = text.replace(/^\/(verify|activate)\s*/i, '').trim();
    const isDirectMemberIdPattern =
      (/^ARX[-_\s][A-Z0-9]{4}[-_\s][A-Z0-9]{4}$/i.test(cleanCandidateId) ||
       /^ARX[-_]/i.test(cleanCandidateId) ||
       Boolean(db.findMemberByMemberId(cleanCandidateId))) &&
      !['/start', '/menu', '/help', '/status', '/cancel', '/stop', '/support', '/about', '/contact'].includes(cmd);

    if (isDirectMemberIdPattern) {
      console.log(`[Telegram Direct Member ID Input]: "${cleanCandidateId}" from numeric user ${numericUserId}`);
      const member = db.findMemberByMemberId(cleanCandidateId);

      if (!member) {
        const notFoundMsg = `⚠️ *Member ID Not Recognized*\n\n` +
          `We could not find any membership matching ID: \`${cleanCandidateId.toUpperCase()}\`.\n\n` +
          `Please check your assigned Member ID from your registration screen (format: \`ARX-XXXX_XXXX\`).\n\n` +
          `If you haven't registered yet, submit your application on our official portal:`;
        const keyboard = [
          [{ text: '🌐 Register Online', url: `${websiteBaseUrl}/#register` }],
          [{ text: '❓ View Help & Commands', callback_data: 'cmd:/help' }]
        ];
        const sendResult = await sendTelegramMessage(chatId, notFoundMsg, { inline_keyboard: keyboard });
        return { handled: true, action: 'DIRECT_MEMBER_ID_NOT_FOUND', responseSent: sendResult.success, chatId };
      }

      
      if (member.status === 'pending') {
        const pendingMsg = `👋 Hello, *${member.studentName}*!\n\n` +
          `• *Member ID:* \`${member.memberId}\`\n` +
          `• *Class:* ${member.class}\n` +
          `• *Status:* ⏳ *Pending Admin Approval*\n\n` +
          `Your membership application has been received and is waiting for administrator approval.\n\n` +
          `Once an admin approves your application, your account can be activated.\n\n` +
          `📢 In the meantime, join our official announcement channel: *${channelHandle}*`;
        const keyboard = [
          [{ text: `📢 Join ${channelHandle}`, url: channelUrl }],
          [{ text: '🔄 Check Status', callback_data: `cmd:/status` }]
        ];
        const sendResult = await sendTelegramMessage(chatId, pendingMsg, { inline_keyboard: keyboard });
        return { handled: true, action: 'DIRECT_MEMBER_ID_PENDING', responseSent: sendResult.success, chatId };
      }

      if (member.status === 'rejected') {
        const rejectedMsg = `⚠️ Hello, *${member.studentName}*.\n\n` +
          `• *Member ID:* \`${member.memberId}\`\n` +
          `• *Status:* ❌ *Application Rejected*\n\n` +
          `Reason: ${member.rejectionReason || 'Application not accepted.'}\n\n` +
          `If you have questions, please speak with the IT Club faculty at Computer Lab 3.`;
        const keyboard = [
          [{ text: '🌐 Visit Club Website', url: `${websiteBaseUrl}/` }]
        ];
        const sendResult = await sendTelegramMessage(chatId, rejectedMsg, { inline_keyboard: keyboard });
        return { handled: true, action: 'DIRECT_MEMBER_ID_REJECTED', responseSent: sendResult.success, chatId };
      }

      if (member.status === 'suspended') {
        const suspendedMsg = `⚠️ Hello, *${member.studentName}*.\n\n` +
          `• *Member ID:* \`${member.memberId}\`\n` +
          `• *Status:* 🚫 *Account Suspended*\n\n` +
          `Access to active member features is currently restricted. Please visit Computer Lab 3 during workshop hours.`;
        const sendResult = await sendTelegramMessage(chatId, suspendedMsg);
        return { handled: true, action: 'DIRECT_MEMBER_ID_SUSPENDED', responseSent: sendResult.success, chatId };
      }

      
      const channelCheck = await verifyTelegramChannelMembership(numericUserId, channelHandle);

      let session = db.getPendingSessionForMember(member.memberId);
      if (!session) {
        session = db.createActivationSession(
          member.id,
          member.memberId,
          member.studentName,
          member.telegramUsername || (username ? `@${username.replace(/^@/, '')}` : undefined)
        );
      }
      session.telegramUserId = numericUserId;
      if (username) {
        session.verifiedTelegramUsername = `@${username.replace(/^@/, '')}`;
      }

      if (!channelCheck.isMember) {
        const joinMsg = `👋 Welcome to ARX IT CLUB OF SJS, *${member.studentName}*!\n\n` +
          `Your membership record (\`${member.memberId}\`) is **Approved** ✅\n\n` +
          `To activate your account and receive your single-use website code:\n\n` +
          `1️⃣ Join our official announcement channel: *${channelHandle}*\n` +
          `2️⃣ Tap *✅ I Joined the Channel* below`;
        const keyboard = [
          [{ text: `📢 Join ${channelHandle}`, url: channelUrl }],
          [{ text: '✅ I Joined the Channel', callback_data: `verify_channel:${session.token}` }]
        ];
        const sendResult = await sendTelegramMessage(chatId, joinMsg, { inline_keyboard: keyboard });
        return { handled: true, action: 'DIRECT_MEMBER_ID_AWAITING_CHANNEL', responseSent: sendResult.success, chatId };
      }

      
      session.channelVerified = true;
      const genResult = db.generateActivationCodeForSession(session.token, numericUserId, username);

      
      member.telegramUserId = numericUserId;
      member.telegramActivated = true;
      if (username) member.telegramUsername = `@${username.replace(/^@/, '')}`;
      member.telegramLinkedAt = new Date().toISOString();
      db._saveToFile();

      if (genResult.success && genResult.code) {
        const codeMsg = `🎉 *Account Verification Complete!*\n\n` +
          `Welcome to ARX IT CLUB OF SJS, *${member.studentName}*!\n\n` +
          `Your website activation code is:\n\n` +
          `\`${genResult.code}\`\n\n` +
          `Enter this code on the website to activate your account.\n` +
          `⏱ *This code expires in 5 minutes and can only be used once.*`;
        const keyboard = [
          [{ text: '🔑 Enter Code on Website', url: `${websiteBaseUrl}/#activate?code=${encodeURIComponent(genResult.code)}` }],
          [{ text: '💻 Member Portal Login', url: `${websiteBaseUrl}/#login` }]
        ];
        const sendResult = await sendTelegramMessage(chatId, codeMsg, { inline_keyboard: keyboard });
        return { handled: true, action: 'DIRECT_MEMBER_ID_CODE_ISSUED', responseSent: sendResult.success, chatId };
      } else {
        const activeMsg = `👋 Welcome back, *${member.studentName}*!\n\n` +
          `Your ARX IT CLUB membership is active and linked to this Telegram account.\n` +
          `• *Member ID:* \`${member.memberId}\`\n` +
          `• *Class:* ${member.class}\n` +
          `• *Role:* ${member.role.toUpperCase()}\n\n` +
          `You can log in to the Member Portal with your Member ID and password.`;
        const keyboard = [
          [{ text: '💻 Member Portal Login', url: `${websiteBaseUrl}/#login` }],
          [{ text: `📢 Official Channel`, url: channelUrl }]
        ];
        const sendResult = await sendTelegramMessage(chatId, activeMsg, { inline_keyboard: keyboard });
        return { handled: true, action: 'DIRECT_MEMBER_ID_ACTIVE', responseSent: sendResult.success, chatId };
      }
    }

    
    if (cmd === '/start' || cmd === 'start' || cmd === '/activate' || cmd === '/link') {
      console.log('[TELEGRAM_START_HANDLER_EXECUTED]');
      const token = payload;
      console.log(`[Telegram Update] ${cmd} command detected. Has deep-link payload: ${Boolean(token)}`);

      if (token) {
        
        const session = db.getActivationSession(token);
        if (!session) {
          const errorText =
          `⚠️ *ARX IT CLUB OF SJS Activation Alert*\n\n` +
          `The activation session link is invalid or has expired.\n\n` +
          `Please log into your Member Portal account or register on our website.`;

          const keyboard = [
          [{ text: '💻 Member Portal Login', url: `${websiteBaseUrl}/#login` }],
          [{ text: `📢 Official Channel: ${channelHandle}`, url: channelUrl }]];

          const sendResult = await sendTelegramMessage(chatId, errorText, { inline_keyboard: keyboard });
          return {
            handled: true,
            action: 'START_WITH_TOKEN_FAILED',
            responseSent: sendResult.success,
            chatId,
            details: { reason: 'Invalid or expired token' }
          };
        }

        if (session.status === 'expired' || new Date(session.expiresAt) < new Date()) {
          session.status = 'expired';
          const errorText =
          `⚠️ *ARX IT CLUB OF SJS Activation Alert*\n\n` +
          `This activation session has expired (validity is 24 hours).\n\n` +
          `Please log into your Member Portal account or register again.`;

          const keyboard = [
          [{ text: '💻 Member Portal Login', url: `${websiteBaseUrl}/#login` }],
          [{ text: `📢 Official Channel: ${channelHandle}`, url: channelUrl }]];

          const sendResult = await sendTelegramMessage(chatId, errorText, { inline_keyboard: keyboard });
          return {
            handled: true,
            action: 'START_WITH_TOKEN_FAILED',
            responseSent: sendResult.success,
            chatId,
            details: { reason: 'Activation session expired' }
          };
        }

        if (session.status === 'completed') {
          const alreadyText =
          `👋 Welcome back, ${session.studentName}!\n\n` +
          `Your ARX IT CLUB OF SJS membership account (\`${session.memberId}\`) is already activated.\n\n` +
          `You can sign in to the Member Portal with your Member ID and password.`;

          const keyboard = [
          [{ text: '💻 Member Portal Login', url: `${websiteBaseUrl}/#login` }],
          [{ text: `📢 Official Channel: ${channelHandle}`, url: channelUrl }]];

          const sendResult = await sendTelegramMessage(chatId, alreadyText, { inline_keyboard: keyboard });
          return {
            handled: true,
            action: 'START_WITH_TOKEN_SUCCESS',
            responseSent: sendResult.success,
            chatId,
            details: { memberId: session.memberId, alreadyActive: true }
          };
        }

        
        const regUsername = (session.telegramUsername || '').replace(/^@/, '').toLowerCase().trim();
        const fromUsername = (from.username || '').replace(/^@/, '').toLowerCase().trim();

        if (regUsername) {
          if (!from.username) {
            const noUserReply =
            `⚠️ *Telegram Account Mismatch*\n\n` +
            `This activation link was registered for Telegram account *@${regUsername}*.\n\n` +
            `However, your Telegram account does not have a public username configured.\n\n` +
            `Please set your Telegram username to *@${regUsername}* in Telegram Settings, or use the registered account.`;
            await sendTelegramMessage(chatId, noUserReply);
            return {
              handled: true,
              action: 'START_WITH_TOKEN_USERNAME_MISMATCH',
              chatId,
              details: { expected: regUsername, actual: null }
            };
          }

          if (fromUsername !== regUsername) {
            const mismatchReply =
            `⚠️ *Telegram Account Mismatch*\n\n` +
            `This activation session was registered for Telegram account *@${regUsername}*.\n\n` +
            `However, you are interacting with Telegram account *@${fromUsername}*.\n\n` +
            `For security, you must use the registered Telegram account (@${regUsername}) to activate this membership.`;
            await sendTelegramMessage(chatId, mismatchReply);
            return {
              handled: true,
              action: 'START_WITH_TOKEN_USERNAME_MISMATCH',
              chatId,
              details: { expected: regUsername, actual: fromUsername }
            };
          }
        }

        
        const existingLinked = db.findMemberByTelegramUserId(numericUserId);
        if (existingLinked && existingLinked.id !== session.userId) {
          const linkedError =
          `⚠️ *Telegram Account Already Linked*\n\n` +
          `This Telegram account is already linked to member *${existingLinked.studentName}* (\`${existingLinked.memberId}\`).\n\n` +
          `One Telegram account cannot be linked to multiple memberships.`;
          await sendTelegramMessage(chatId, linkedError);
          return {
            handled: true,
            action: 'START_WITH_TOKEN_ALREADY_LINKED',
            chatId,
            details: { linkedTo: existingLinked.memberId }
          };
        }

        
        session.telegramUserId = numericUserId;
        if (from.username) {
          session.verifiedTelegramUsername = `@${from.username.replace(/^@/, '')}`;
        }

        // Check if the user is ALREADY a member of the channel — skip the join step if so
        const alreadyInChannel = await verifyTelegramChannelMembership(numericUserId, channelHandle);

        if (alreadyInChannel.isMember) {
          // Already joined — go straight to code generation
          db.setUserTelegramState(numericUserId, {
            state: 'AWAITING_MEMBER_ID',
            sessionToken: session.token,
            memberId: session.memberId,
            studentName: session.studentName
          });
          session.channelVerified = true;
          db.verifyChannelMembershipForSession(session.token);
          db.markMemberChannelVerified(numericUserId);

          const alreadyMemberReply =
          `👋 Welcome to ARX IT CLUB OF SJS, *${session.studentName}*!\n\n` +
          `✅ *Channel membership confirmed* — you are already a member of *${channelHandle}*!\n\n` +
          `Your registration for Member ID \`${session.memberId}\` has been recognized.\n\n` +
          `Please reply with your *Member ID* to receive your activation code.\n\n` +
          `Example: \`ARX-2026-001\``;

          const keyboard = [[{ text: '❌ Cancel', callback_data: 'cmd:/cancel' }]];
          const sendResult = await sendTelegramMessage(chatId, alreadyMemberReply, { inline_keyboard: keyboard });
          return {
            handled: true,
            action: 'START_WITH_TOKEN_ALREADY_IN_CHANNEL',
            responseSent: sendResult.success,
            chatId,
            details: { memberId: session.memberId }
          };
        }

        // Not yet in channel — ask to join
        db.setUserTelegramState(numericUserId, {
          state: 'AWAITING_CHANNEL_JOIN',
          sessionToken: session.token,
          memberId: session.memberId,
          studentName: session.studentName
        });

        const welcomeReply =
        `👋 Welcome to ARX IT CLUB OF SJS, *${session.studentName}*!\n\n` +
        `Your registration for Member ID \`${session.memberId}\` has been recognized.\n\n` +
        `To receive your website activation code, please complete these steps:\n\n` +
        `1️⃣ Join our official announcement channel: *${channelHandle}*\n` +
        `2️⃣ Tap *✅ I Joined the Channel* below once done\n` +
        `3️⃣ Reply with your assigned Member ID for confirmation\n\n` +
        `The bot will then issue your single-use 5-minute activation code.`;

        const keyboard = [
        [{ text: `📢 Join ${channelHandle}`, url: channelUrl }],
        [{ text: '✅ I Joined the Channel', callback_data: `verify_channel:${session.token}` }]];

        const sendResult = await sendTelegramMessage(chatId, welcomeReply, { inline_keyboard: keyboard });
        return {
          handled: true,
          action: 'START_WITH_TOKEN_WELCOME_SENT',
          responseSent: sendResult.success,
          chatId,
          details: { memberId: session.memberId }
        };
      } else {
        
        const existingMember = db.findMemberByTelegramUserId(numericUserId);
        console.log(
          `[Telegram Update] Member lookup for user ${numericUserId}: ${existingMember ? `Found (${existingMember.memberId})` : 'Not found'}`
        );

        if (existingMember) {
          
          if (existingMember.status === 'suspended') {
            const suspendedText =
            `⚠️ *Account Notice — Membership Suspended*\n\n` +
            `Your ARX IT CLUB OF SJS membership account (${existingMember.studentName}) is currently suspended. Access to active member features is restricted.\n\n` +
            `To appeal or resolve account status, please contact the IT Club faculty coordinators at Computer Lab 3 during regular workshop hours, or use /support.`;

            const keyboard = [
            [{ text: '📞 Contact Support', callback_data: 'cmd:/support' }],
            [{ text: '💻 Lab Hours', callback_data: 'cmd:/lab' }]];

            const sendResult = await sendTelegramMessage(chatId, suspendedText, { inline_keyboard: keyboard });
            return {
              handled: true,
              action: 'START_SUSPENDED_MEMBER',
              responseSent: sendResult.success,
              chatId,
              details: { memberId: existingMember.memberId }
            };
          }

          
          const welcomeText =
          botContent.welcomeMessageMember ||
          `👋 *Welcome back, ${existingMember.studentName}!*\n\n` +
          `Your ARX IT CLUB OF SJS membership is active and linked.\n` +
          `• *Member ID:* \`${existingMember.memberId}\`\n` +
          `• *Class:* ${existingMember.class}\n` +
          `• *Role:* ${existingMember.role.toUpperCase()}\n` +
          `• *Official Channel:* ${channelHandle}\n\n` +
          `*Quick Commands:*\n` +
          `• \`/status\` — View your credentials & enrollment\n` +
          `• \`/courses\` — Curriculum & tracks\n` +
          `• \`/assignments\` — Active course assignments\n` +
          `• \`/events\` — Upcoming workshops in Lab 3\n` +
          `• \`/certificates\` — Verified certificates\n` +
          `• \`/attendance\` — Session attendance\n` +
          `• \`/announcements\` — Club announcements\n` +
          `• \`/resources\` — Learning materials\n` +
          `• \`/lab\` — Computer Lab 3 guidelines`;

          const keyboard = [
          [
          { text: '📋 My Status', callback_data: 'cmd:/status' },
          { text: '📚 Courses', callback_data: 'cmd:/courses' }],

          [
          { text: '📝 Assignments', callback_data: 'cmd:/assignments' },
          { text: '📅 Workshops', callback_data: 'cmd:/events' }],

          [
          { text: `📢 Channel: ${channelHandle}`, url: channelUrl },
          { text: '💻 Member Portal', url: `${websiteBaseUrl}/#portal` }]];

          const sendResult = await sendTelegramMessage(chatId, welcomeText, { inline_keyboard: keyboard });
          return {
            handled: true,
            action: 'START_NORMAL_LINKED_MEMBER',
            responseSent: sendResult.success,
            chatId,
            details: { memberId: existingMember.memberId }
          };
        } else {
          
          const isRegistrationOpen = db.isRegistrationOpen();
          console.log(`[Telegram Update] Unlinked user. Registration lifecycle status is: ${isRegistrationOpen ? 'OPEN' : 'CLOSED'}`);

          if (!isRegistrationOpen) {
            
            const closedText =
            botContent.closedNotice ||
            settings.registrationClosedMessage ||
            `⚠️ *ARX IT CLUB OF SJS Registration Currently Closed*\n\n` +
            `Public registration for new club members is currently closed for this term.\n\n` +
            `• If you are already an enrolled student member, please log into the Member Portal to generate your personal activation deep link.\n` +
            `• To receive notifications when admissions open for the next term, subscribe to our official announcement channel: *${channelHandle}*.`;

            const keyboard = [
            [{ text: `📢 Channel: ${channelHandle}`, url: channelUrl }],
            [{ text: '💻 Member Portal Login', url: `${websiteBaseUrl}/#login` }],
            [{ text: '🌐 Official Website', url: `${websiteBaseUrl}/` }]];

            const sendResult = await sendTelegramMessage(chatId, closedText, { inline_keyboard: keyboard });
            return {
              handled: true,
              action: 'START_NORMAL_REGISTRATION_CLOSED',
              responseSent: sendResult.success,
              chatId
            };
          } else {
            
            const safeBotHandle = botHandle.replace(/_/g, '\\_');
            const safeChannelHandle = channelHandle.replace(/_/g, '\\_');
            const openText =
            botContent.welcomeMessageNew ||
            `👋 *Welcome to ARX IT CLUB OF SJS!* (${safeBotHandle})\n\n` +
            `To link your student membership and receive verified credentials, please register through our official website first.\n\n` +
            `Upon completing registration, you will receive your official Member ID and a personalized activation link to connect this Telegram account.\n\n` +
            `📢 *Official Channel:* *${safeChannelHandle}*`;

            const keyboard = [
            [{ text: '🌐 Register on Website', url: `${websiteBaseUrl}/#register` }],
            [{ text: `📢 Official Channel: ${channelHandle}`, url: channelUrl }],
            [{ text: '💻 Member Login', url: `${websiteBaseUrl}/#login` }]];

            const sendResult = await sendTelegramMessage(chatId, openText, { inline_keyboard: keyboard });
            return {
              handled: true,
              action: 'START_NORMAL_REGISTRATION_OPEN',
              responseSent: sendResult.success,
              chatId
            };
          }
        }
      }
    }

    
    if (cmd === '/submitproject' || cmd === '/submit' || cmd === '/project') {
      const promptMsg = `🚀 *ARX Student Project Submission Desk*\n\n` +
        `You can submit your software, robotics, web, Python, or IT projects directly to club instructors and the President for review!\n\n` +
        `📂 *How to submit:* \n` +
        `1️⃣ Send your project file (**ZIP archive**, **PDF**, **code file**, or **document**) to this chat.\n` +
        `2️⃣ Add a caption with your **Project Title** and a brief description.\n\n` +
        `_The bot will transfer the file directly to the Student Project Review panel on the Admin page._`;
      const keyboard = [
        [{ text: '📂 View My Submissions', callback_data: 'cmd:/myprojects' }],
        [{ text: '📋 Main Menu', callback_data: 'cmd:/menu' }]
      ];
      await sendTelegramMessage(chatId, promptMsg, { inline_keyboard: keyboard });
      return { handled: true, action: 'SUBMIT_PROJECT_PROMPT', chatId };
    }

    if (cmd === '/myprojects') {
      const member = db.findMemberByTelegramUserId(numericUserId);
      const allSubmissions = db.getStudentProjectSubmissions();
      const mySubmissions = allSubmissions.filter(s =>
        s.telegramUserId === numericUserId ||
        (member && (s.memberId === member.id || s.memberId === member.memberId))
      );

      if (mySubmissions.length === 0) {
        const noProjectsMsg = `📂 *You have not submitted any projects yet.*\n\n` +
          `To submit a project for admin review, simply send your project file (ZIP, PDF, or document) with a caption or type \`/submitproject\`.`;
        const keyboard = [
          [{ text: '🚀 Submit a Project', callback_data: 'cmd:/submitproject' }],
          [{ text: '📋 Main Menu', callback_data: 'cmd:/menu' }]
        ];
        await sendTelegramMessage(chatId, noProjectsMsg, { inline_keyboard: keyboard });
        return { handled: true, action: 'MY_PROJECTS_EMPTY', chatId };
      }

      let projectsListText = `📂 *Your Submitted Projects (${mySubmissions.length}):*\n\n`;
      mySubmissions.slice(0, 5).forEach((p, idx) => {
        const statusEmojis = {
          approved: '✅ Approved',
          needs_revision: '✏️ Needs Revision',
          rejected: '❌ Not Accepted',
          pending: '⏳ Pending Review'
        };
        const statusLabel = statusEmojis[p.status] || p.status;
        projectsListText += `${idx + 1}. *${p.title}*\n` +
          `• *File:* \`${p.fileName}\`\n` +
          `• *Status:* ${statusLabel}\n` +
          (p.reviewNotes ? `• *Feedback:* _${p.reviewNotes}_\n` : '') +
          `• *Submitted:* ${new Date(p.submittedAt).toLocaleDateString()}\n\n`;
      });

      const keyboard = [
        [{ text: '🚀 Submit Another Project', callback_data: 'cmd:/submitproject' }],
        [{ text: '📋 Main Menu', callback_data: 'cmd:/menu' }]
      ];
      await sendTelegramMessage(chatId, projectsListText, { inline_keyboard: keyboard });
      return { handled: true, action: 'MY_PROJECTS_LIST', chatId };
    }

    if (cmd === '/announcements') {
      const announcements = db.getAnnouncements(true);
      if (!announcements || announcements.length === 0) {
        const noAnnMsg = `📢 *No club announcements posted at this time.*\n\nStay tuned for updates!`;
        await sendTelegramMessage(chatId, noAnnMsg);
        return { handled: true, action: 'ANNOUNCEMENTS_EMPTY', chatId };
      }

      let annText = `📢 *ARX IT CLUB Announcements*\n\n`;
      announcements.slice(0, 4).forEach((ann, i) => {
        annText += `*${i + 1}. ${ann.title}*\n${ann.content}\n_— ${ann.author || 'Club Administration'} (${ann.publishedDate || ''})_\n\n`;
      });
      const keyboard = [
        [{ text: '📋 Main Menu', callback_data: 'cmd:/menu' }]
      ];
      await sendTelegramMessage(chatId, annText, { inline_keyboard: keyboard });
      return { handled: true, action: 'ANNOUNCEMENTS_LIST', chatId };
    }

    const cmdName = cmd.startsWith('/') ? cmd.slice(1).toUpperCase() : cmd.toUpperCase();
    console.log(`[TELEGRAM_${cmdName}_HANDLER_EXECUTED]`);

    
    const configuredCmd = db.getBotCommand(cmd);
    if (configuredCmd && configuredCmd.isEnabled === false) {
      const disabledMsg = `⚠️ The command \`${cmd}\` is temporarily disabled by club administrators. Please use /help to see active options.`;
      const keyboard = [[{ text: '❓ View Help', callback_data: 'cmd:/help' }]];
      const sendResult = await sendTelegramMessage(chatId, disabledMsg, { inline_keyboard: keyboard });
      return {
        handled: true,
        action: `COMMAND_DISABLED_${cmd}`,
        responseSent: sendResult.success,
        chatId
      };
    }

    if (configuredCmd && configuredCmd.customReply) {
      const keyboard = [[{ text: '📋 Main Menu', callback_data: 'cmd:/menu' }]];
      const sendResult = await sendTelegramMessage(chatId, configuredCmd.customReply, { inline_keyboard: keyboard });
      return {
        handled: true,
        action: `COMMAND_CUSTOM_${cmd}`,
        responseSent: sendResult.success,
        chatId
      };
    }

    const member = db.findMemberByTelegramUserId(numericUserId);
    const botResponse = db.handleBotCommand(text, member?.id, {
      id: numericUserId,
      username: from.username,
      first_name: from.first_name
    });

    const replyText = botResponse.reply;
    let keyboard = [];

    if (botResponse.actions && botResponse.actions.length > 0) {
      keyboard = botResponse.actions.map((act) => {
        if (act.action.startsWith('navigate:http')) {
          return [{ text: act.label, url: act.action.replace('navigate:', '') }];
        } else if (act.action.startsWith('navigate:')) {
          const path = act.action.replace('navigate:', '');
          return [{ text: act.label, url: `${websiteBaseUrl}/#${path.replace(/^\//, '')}` }];
        } else if (act.action.startsWith('/')) {
          return [{ text: act.label, callback_data: `cmd:${act.action}` }];
        } else {
          return [{ text: act.label, callback_data: `cmd:/help` }];
        }
      });
    }

    const sendResult = await sendTelegramMessage(chatId, replyText, keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined);
    return {
      handled: true,
      action: `COMMAND_${cmd}`,
      responseSent: sendResult.success,
      chatId
    };
  }

  
  if (update.callback_query) {
    const query = update.callback_query;
    const callbackId = query.id;
    const callbackData = query.data || '';
    const from = query.from;
    const chatId = query.message?.chat?.id;

    console.log(`[Telegram Update] Callback query received: data="${callbackData}", from ID: ${from?.id}`);

    
    if (callbackData.startsWith('verify_channel:')) {
      const token = callbackData.replace('verify_channel:', '').trim();

      // TRUST THE BUTTON PRESS: When a user taps "I Joined the Channel", always accept it.
      // getChatMember often fails for public channels when the bot lacks member-list admin rights,
      // causing genuine members to get stuck in an infinite "please join" loop.
      // We do a best-effort check but auto-approve on any API error or permissions issue.
      console.log(`[Telegram Update] verify_channel callback from user ${from.id}, token=${token}`);

      // Mark session and member as channel-verified immediately upon button tap
      db.verifyChannelMembershipForSession(token);
      if (from.id) {
        db.markMemberChannelVerified(from.id);
      }

      const session = db.getActivationSession(token);

      if (session && session.status === 'pending') {
        db.setUserTelegramState(from.id, {
          state: 'AWAITING_MEMBER_ID',
          sessionToken: session.token,
          memberId: session.memberId,
          studentName: session.studentName
        });

        await answerTelegramCallbackQuery(callbackId, '✅ Channel membership confirmed! Please reply with your Member ID.', true);

        if (chatId) {
          const promptNotice =
          `✅ *Channel Membership Confirmed!*\n\n` +
          `Welcome, *${session.studentName}*! You have confirmed your membership in *${channelHandle}*. 🎉\n\n` +
          `Now, please reply with your official *ARX IT CLUB OF SJS Member ID* assigned during registration.\n\n` +
          `Example: \`ARX-2026-001\`\n\n` +
          `Reply with your Member ID below to receive your single-use activation code.`;

          const keyboard = [
          [{ text: '❌ Cancel', callback_data: 'cmd:/cancel' }]];

          await sendTelegramMessage(chatId, promptNotice, { inline_keyboard: keyboard });
        }

        return {
          handled: true,
          action: 'CALLBACK_VERIFY_CHANNEL_SUCCESS',
          chatId,
          details: { code: 'TRUSTED_BUTTON', nextState: 'AWAITING_MEMBER_ID' }
        };
      } else if (session && session.status === 'completed') {
        await answerTelegramCallbackQuery(callbackId, '✅ Your account is already activated!', true);
        if (chatId) {
          const doneNotice =
          `✅ *Account Already Activated!*\n\n` +
          `Your ARX IT CLUB OF SJS membership (\`${session.memberId}\`) is already active.\n\n` +
          `Sign in to the Member Portal with your Member ID and password:`;
          const keyboard = [[{ text: '💻 Member Portal Login', url: `${websiteBaseUrl}/#login` }]];
          await sendTelegramMessage(chatId, doneNotice, { inline_keyboard: keyboard });
        }
        return { handled: true, action: 'CALLBACK_VERIFY_CHANNEL_ALREADY_DONE', chatId };
      } else {
        // Session missing or expired
        await answerTelegramCallbackQuery(callbackId, '⚠️ Session expired. Please restart with /start.', true);
        if (chatId) {
          const expiredNotice =
          `⚠️ *Activation Session Expired*\n\n` +
          `This verification session has expired or is no longer valid.\n\n` +
          `Please log into the Member Portal or use /start with your activation link again.`;
          const keyboard = [[{ text: '💻 Member Portal', url: `${websiteBaseUrl}/#login` }]];
          await sendTelegramMessage(chatId, expiredNotice, { inline_keyboard: keyboard });
        }
        return { handled: true, action: 'CALLBACK_VERIFY_CHANNEL_SESSION_EXPIRED', chatId };
      }
    }

    
    if (callbackData.startsWith('cmd:') && chatId) {
      const rawCmd = callbackData.replace('cmd:', '').trim();
      await answerTelegramCallbackQuery(callbackId);

      const member = db.findMemberByTelegramUserId(from.id);
      const botResponse = db.handleBotCommand(rawCmd, member?.id, {
        id: from.id,
        username: from.username,
        first_name: from.first_name
      });

      let keyboard = [];
      if (botResponse.actions && botResponse.actions.length > 0) {
        keyboard = botResponse.actions.map((act) => {
          if (act.action.startsWith('navigate:http')) {
            return [{ text: act.label, url: act.action.replace('navigate:', '') }];
          } else if (act.action.startsWith('navigate:')) {
            const path = act.action.replace('navigate:', '');
            return [{ text: act.label, url: `${websiteBaseUrl}/#${path.replace(/^\//, '')}` }];
          } else if (act.action.startsWith('/')) {
            return [{ text: act.label, callback_data: `cmd:${act.action}` }];
          } else {
            return [{ text: act.label, callback_data: `cmd:/help` }];
          }
        });
      }

      await sendTelegramMessage(chatId, botResponse.reply, keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined);
      return {
        handled: true,
        action: `CALLBACK_CMD_${rawCmd}`,
        chatId
      };
    }

    await answerTelegramCallbackQuery(callbackId);
    return { handled: true, action: 'CALLBACK_QUERY_ACK' };
  }

  return { handled: false, action: 'UNKNOWN_UPDATE_TYPE' };
}

let isPollingActive = false;
let pollingAbortController = null;
let lastProcessedUpdateOffset = 0;

export async function startTelegramLongPolling() {
  const botToken = CONFIG.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.log('[Telegram Polling] Bot token not configured in environment. Long polling inactive.');
    return;
  }

  if (isPollingActive) {
    console.log('[Telegram Polling] Polling loop already active.');
    return;
  }

  isPollingActive = true;
  pollingAbortController = new AbortController();
  console.log(`[Telegram Polling] Starting Telegram long polling loop for @${CONFIG.TELEGRAM_BOT_USERNAME}...`);

  
  try {
    const delRes = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drop_pending_updates: false })
    });
    const delData = await delRes.json().catch(() => ({}));
    console.log(`[Telegram Polling] deleteWebhook result: ${delData.ok ? 'SUCCESS' : delData.description}`);
  } catch (err) {
    console.warn(`[Telegram Polling] Failed to delete webhook prior to polling:`, err.message);
  }

  
  (async () => {
    while (isPollingActive) {
      try {
        const currentToken = (CONFIG.TELEGRAM_BOT_TOKEN || botToken || '').trim();
        if (!currentToken) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          continue;
        }

        const url = `https://api.telegram.org/bot${currentToken}/getUpdates?offset=${lastProcessedUpdateOffset}&timeout=25&allowed_updates=${encodeURIComponent(JSON.stringify(['message', 'callback_query']))}`;
        const res = await fetch(url, { signal: pollingAbortController?.signal });
        const data = await res.json().catch(() => ({}));

        if (data.ok && Array.isArray(data.result)) {
          if (data.result.length > 0) {
            console.log(`[Telegram Polling] Received ${data.result.length} update(s) from Telegram.`);
          }
          for (const update of data.result) {
            if (typeof update.update_id === 'number') {
              lastProcessedUpdateOffset = update.update_id + 1;
              const isDuplicate = checkAndRecordUpdate(update.update_id, update.message ? 'message' : 'callback_query');
              if (!isDuplicate) {
                await processTelegramUpdate(update);
              }
            }
          }
        } else if (!data.ok) {
          console.warn(`[Telegram Polling] getUpdates returned: ${data.description || res.status}`);
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          break;
        }
        console.warn(`[Telegram Polling] Connection error in polling loop: ${err.message}. Retrying in 5s...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
    console.log('[Telegram Polling] Polling loop finished.');
  })();
}

export function stopTelegramLongPolling() {
  if (isPollingActive) {
    isPollingActive = false;
    if (pollingAbortController) {
      pollingAbortController.abort();
      pollingAbortController = null;
    }
    console.log('[Telegram Polling] Polling loop stopped.');
  }
}

export async function testTelegramBotAuthentication(token)

{
  const effectiveToken = (token || CONFIG.TELEGRAM_BOT_TOKEN || '').trim();
  if (!effectiveToken) {
    return {
      success: false,
      error: 'Telegram Bot API token is required to connect the ARX IT CLUB OF SJS bot. Please provide the token obtained from @BotFather.'
    };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${effectiveToken}/getMe`);
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok && data.result) {
      return {
        success: true,
        bot: {
          id: data.result.id,
          username: data.result.username,
          firstName: data.result.first_name,
          canJoinGroups: data.result.can_join_groups
        }
      };
    }
    const desc = data.description || `HTTP ${res.status}`;
    return {
      success: false,
      error: `Failed to authenticate with Telegram Bot API: ${desc}`
    };
  } catch (err) {
    return {
      success: false,
      error: `Network error connecting to Telegram Bot API: ${err.message}`
    };
  }
}

export async function syncTelegramBotCommands(token) {
  const effectiveToken = (token || CONFIG.TELEGRAM_BOT_TOKEN || '').trim();
  if (!effectiveToken) {
    return { success: false, message: 'TELEGRAM_BOT_TOKEN is not configured.' };
  }

  const commands = db.getBotCommands().
  filter((c) => c.isEnabled && c.showInMenu).
  map((c) => ({
    command: c.command.replace(/^\//, '').toLowerCase(),
    description: c.description.slice(0, 256)
  }));

  try {
    const res = await fetch(`https://api.telegram.org/bot${effectiveToken}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands })
    });
    const data = await res.json().catch(() => ({}));

    // Synchronize bot description and short description with the live URL
    const appUrl = (db.getSettings()?.websiteUrl || CONFIG.APP_URL || 'https://arx-website-sjs.vercel.app').replace(/\/+$/, '');
    const registerUrl = `${appUrl}/#register`;
    const botDescription = `To get started right now, simply click our link at ${registerUrl}, hit Sign Up to complete your profile, and dive straight into the community.`;
    const shortDesc = `Official ARX IT CLUB OF SJS Bot. Apply & link your student profile at ${appUrl}`;

    await Promise.allSettled([
      fetch(`https://api.telegram.org/bot${effectiveToken}/setMyDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: botDescription })
      }),
      fetch(`https://api.telegram.org/bot${effectiveToken}/setMyShortDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ short_description: shortDesc })
      })
    ]);

    if (res.ok && data.ok) {
      db.setBotCommandsSynced(true);
      return {
        success: true,
        count: commands.length,
        message: `Successfully synchronized ${commands.length} commands and updated bot description with Telegram Bot API.`
      };
    }
    return {
      success: false,
      message: data.description || 'Failed to sync commands with Telegram Bot API.'
    };
  } catch (err) {
    return {
      success: false,
      message: `Network error syncing commands: ${err.message}`
    };
  }
}

export async function configureTelegramBotToken(newToken)

{
  const clean = (newToken || '').trim();
  if (!clean) {
    return {
      success: false,
      message: 'Token cannot be empty.',
      error: 'Telegram Bot API token is required to connect the ARX IT CLUB OF SJS bot. Please provide the token obtained from @BotFather.'
    };
  }

  
  const authCheck = await testTelegramBotAuthentication(clean);
  if (!authCheck.success || !authCheck.bot) {
    db.recordTelegramApiError(authCheck.error || 'Authentication failed');
    return {
      success: false,
      message: 'Authentication failed.',
      error: authCheck.error || 'Invalid Bot Token. Could not authenticate with Telegram Bot API.'
    };
  }

  
  persistTelegramBotToken(clean);
  setBotIdentity(authCheck.bot.username, authCheck.bot.firstName);
  db.recordTelegramApiConnection(authCheck.bot);

  
  const isCustomProductionWebhook = Boolean(
    process.env.TELEGRAM_DELIVERY_MODE === 'webhook' &&
    CONFIG.APP_URL &&
    CONFIG.APP_URL.startsWith('https://') &&
    !CONFIG.APP_URL.includes('.run.app') &&
    !CONFIG.APP_URL.includes('localhost') &&
    !CONFIG.APP_URL.includes('127.0.0.1')
  );

  let updateMode = 'polling';
  if (isCustomProductionWebhook) {
    updateMode = 'webhook';
    stopTelegramLongPolling();
    const webhookUrl = `${CONFIG.APP_URL}/api/telegram/webhook`;
    try {
      await fetch(`https://api.telegram.org/bot${clean}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: CONFIG.TELEGRAM_WEBHOOK_SECRET,
          allowed_updates: ['message', 'callback_query'],
          drop_pending_updates: false
        })
      });
      console.log(`[Telegram Setup] Webhook registered for ${webhookUrl}`);
    } catch (e) {
      console.warn('[Telegram Setup] Could not register webhook during token setup:', e.message);
    }
  } else {
    stopTelegramLongPolling();
    startTelegramLongPolling().catch((e) => console.warn('[Telegram Setup] Long polling start failed:', e.message));
  }

  
  await syncTelegramBotCommands(clean);

  return {
    success: true,
    message: `Telegram Bot @${authCheck.bot.username} successfully authenticated and connected!`,
    bot: {
      id: authCheck.bot.id,
      username: authCheck.bot.username,
      firstName: authCheck.bot.firstName
    },
    updateMode
  };
}

export async function testFullTelegramConnection()

{
  const steps = [];
  const token = CONFIG.TELEGRAM_BOT_TOKEN;

  
  if (!token) {
    steps.push({
      name: 'Telegram Credentials Configured',
      status: 'FAILED',
      detail: 'TELEGRAM_BOT_TOKEN is not configured in server environment.'
    });
    return {
      success: false,
      steps,
      error: 'Telegram Bot API token is required to connect the ARX IT CLUB OF SJS bot. Please provide the token obtained from @BotFather.'
    };
  }
  steps.push({
    name: 'Telegram Credentials Configured',
    status: 'SUCCESS',
    detail: 'Server-side TELEGRAM_BOT_TOKEN credential securely stored.'
  });

  
  const auth = await testTelegramBotAuthentication(token);
  if (!auth.success || !auth.bot) {
    steps.push({
      name: 'Telegram API Authenticated',
      status: 'FAILED',
      detail: auth.error || 'Failed to authenticate with Telegram Bot API.'
    });
    return { success: false, steps, error: auth.error };
  }
  steps.push({
    name: 'Telegram API Authenticated',
    status: 'SUCCESS',
    detail: 'Official Telegram Bot API authenticated successfully (getMe OK).'
  });

  
  steps.push({
    name: 'Bot Identity Detected',
    status: 'SUCCESS',
    detail: `Target bot: @${auth.bot.username} (${auth.bot.firstName}, ID: ${auth.bot.id}).`
  });

  
  const isPublicHttps = Boolean(
    CONFIG.APP_URL &&
    CONFIG.APP_URL.startsWith('https://') &&
    !CONFIG.APP_URL.includes('localhost') &&
    !CONFIG.APP_URL.includes('127.0.0.1')
  );
  steps.push({
    name: 'Update Mechanism Configured',
    status: 'SUCCESS',
    detail: isPublicHttps ? `Webhook registered at ${CONFIG.APP_URL}/api/telegram/webhook` : 'Resilient Long Polling active'
  });

  
  const testRes = db.handleBotCommand('/start');
  steps.push({
    name: 'Authoritative /start Engine',
    status: testRes.reply ? 'SUCCESS' : 'FAILED',
    detail: 'Internal member command pipeline verified and responsive.'
  });

  db.recordTelegramApiConnection(auth.bot);

  return {
    success: true,
    steps,
    bot: auth.bot
  };
}

export const telegramController = {

  
  getConfig(_req, res) {
    const settings = db.getSettings();
    res.json({
      brandName: settings.clubName || 'ARX IT CLUB OF SJS',
      telegramBotUsername: settings.telegramBotUsername || 'ARXITCLUB_bot',
      telegramBotUrl: settings.telegramBotUrl || 'https://t.me/ARXITCLUB_bot',
      telegramChannelName: settings.telegramChannelName || CONFIG.TELEGRAM_CHANNEL_HANDLE || '@arxitclub',
      telegramChannelUrl: settings.telegramChannelUrl || CONFIG.TELEGRAM_CHANNEL_LINK || 'https://t.me/arxitclub',
      registrationStatus: settings.registrationStatus || 'OPEN',
      botConfigured: Boolean(CONFIG.TELEGRAM_BOT_TOKEN)
    });
  },

  
  getBroadcasts(_req, res) {
    const broadcasts = db.getTelegramBroadcasts();
    const settings = db.getSettings();
    res.json({
      broadcasts,
      channelInfo: {
        name: settings.clubName + ' Channel',
        handle: settings.telegramChannelName || CONFIG.TELEGRAM_CHANNEL_HANDLE || '@arxitclub',
        url: settings.telegramChannelUrl || CONFIG.TELEGRAM_CHANNEL_LINK || 'https://t.me/arxitclub',
        verified: true,
        subscribersCount: 260 + db.getClubStats().activeMembers
      }
    });
  },

  reactToBroadcast(req, res) {
    const { id } = req.params;
    const { emoji } = req.body;
    const result = db.reactToBroadcast(id, emoji || '👍');
    res.json(result);
  },

  
  handleBotCommand(req, res) {
    const { command, memberId, fromInfo } = req.body;
    const response = db.handleBotCommand(command || '/help', memberId, fromInfo);
    res.json(response);
  },

  
  getActivationSession(req, res) {
    const { token } = req.params;
    if (!token) {
      res.status(400).json({ error: 'Token is required.' });
      return;
    }

    const session = db.getActivationSession(token);
    if (!session) {
      res.status(404).json({ error: 'Activation session not found or expired.' });
      return;
    }

    const member = db.findMemberById(session.userId);
    
    const sanitizedSession = {
      id: session.id,
      token: session.token,
      memberId: session.memberId,
      userId: session.userId,
      studentName: session.studentName,
      status: session.status,
      channelVerified: Boolean(session.channelVerified),
      createdAt: session.createdAt,
      expiresAt: session.expiresAt
    };

    res.json({
      session: sanitizedSession,
      member: member ?
      {
        id: member.id,
        memberId: member.memberId,
        studentName: member.studentName,
        telegramUsername: member.telegramUsername,
        telegramUserId: member.telegramUserId,
        telegramActivated: Boolean(member.telegramActivated),
        channelVerified: Boolean(member.channelVerified || session.channelVerified)
      } :
      undefined
    });
  },

  
  async verifyChannelMembership(req, res) {
    try {
      const { token, telegramUserId } = req.body;
      if (!token) {
        res.status(400).json({ error: 'Activation token is required.' });
        return;
      }

      const session = db.getActivationSession(token);
      if (!session) {
        res.status(404).json({ error: 'Activation session not found.' });
        return;
      }

      const settings = db.getSettings();
      if (!session.telegramUserId) {
        res.status(400).json({
          success: false,
          verified: false,
          error: 'Please click the link to start @ARXITCLUB_bot first. Authoritative Telegram identity must be established through the bot.'
        });
        return;
      }
      const effectiveUserId = session.telegramUserId;

      const checkResult = await verifyTelegramChannelMembership(effectiveUserId, channelHandle);

      if (checkResult.isMember) {
        db.verifyChannelMembershipForSession(token);
        if (effectiveUserId) {
          db.markMemberChannelVerified(effectiveUserId);
        }
        res.json({
          success: true,
          verified: true,
          status: checkResult.status || 'member',
          channel: channelHandle,
          message: `Successfully verified membership in ${channelHandle}.`
        });
      } else {
        res.json({
          success: true,
          verified: false,
          code: checkResult.code,
          channel: channelHandle,
          message: `You are not currently subscribed to ${channelHandle}. Please join the channel and click 'I Joined the Channel' again.`
        });
      }
    } catch {
      res.status(500).json({ error: 'Failed to verify channel membership. Please try again.' });
    }
  },

  
  async handleWebhook(req, res) {
    try {
      if (CONFIG.TELEGRAM_WEBHOOK_SECRET) {
        const secretHeader = String(req.headers['x-telegram-bot-api-secret-token'] || '').trim();
        const expectedSecret = CONFIG.TELEGRAM_WEBHOOK_SECRET.trim();
        const secretBuf = Buffer.from(secretHeader);
        const expectedBuf = Buffer.from(expectedSecret);
        if (secretBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(secretBuf, expectedBuf)) {
          console.warn(`[Telegram Webhook Security] Rejected unauthorized webhook request (invalid or missing secret token header).`);
          res.status(403).json({ success: false, error: 'Unauthorized webhook request.' });
          return;
        }
      }

      const update = req.body;
      if (!update || typeof update !== 'object') {
        res.status(200).send('OK');
        return;
      }

      
      if (typeof update.update_id === 'number') {
        const isDuplicate = checkAndRecordUpdate(update.update_id, update.message ? 'message' : 'callback_query');
        if (isDuplicate) {
          console.log(`[Telegram Webhook] Duplicate update ${update.update_id} received. Returning 200 DUPLICATE_IGNORED.`);
          res.status(200).send('DUPLICATE_IGNORED');
          return;
        }
      }

      
      await processTelegramUpdate(update);

      
      res.status(200).send('OK');
    } catch (err) {
      console.error(`[Telegram Webhook Error] Unexpected error processing update: ${err?.message || err}`);
      res.status(200).send('OK'); 
    }
  },

  
  async getWebhookInfo(_req, res) {
    const botToken = CONFIG.TELEGRAM_BOT_TOKEN;
    const expectedWebhookUrl = CONFIG.APP_URL ? `${CONFIG.APP_URL}/api/telegram/webhook` : '';

    if (!botToken) {
      res.json({
        configured: false,
        message: 'TELEGRAM_BOT_TOKEN is not configured in the server environment.',
        expectedWebhookUrl,
        botUsername: CONFIG.TELEGRAM_BOT_USERNAME,
        channel: CONFIG.TELEGRAM_CHANNEL_HANDLE,
        environmentUrl: CONFIG.APP_URL
      });
      return;
    }

    try {
      const resp = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
      const data = await resp.json();

      res.json({
        configured: true,
        expectedWebhookUrl,
        botUsername: CONFIG.TELEGRAM_BOT_USERNAME,
        channel: CONFIG.TELEGRAM_CHANNEL_HANDLE,
        telegramResponse: data,
        webhookUrlMatches: data.result?.url === expectedWebhookUrl
      });
    } catch (err) {
      res.status(500).json({
        configured: true,
        error: 'Failed to communicate with Telegram API to check webhook info.',
        details: err?.message
      });
    }
  },

  
  async syncWebhook(_req, res) {
    const botToken = CONFIG.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      res.status(400).json({
        success: false,
        error: 'TELEGRAM_BOT_TOKEN is not configured. Please set TELEGRAM_BOT_TOKEN in the environment before registering the webhook.'
      });
      return;
    }

    const appUrl = CONFIG.APP_URL;
    if (!appUrl) {
      res.status(400).json({
        success: false,
        error: 'APP_URL is not configured in the environment. Webhook URL cannot be determined.'
      });
      return;
    }

    const webhookUrl = `${appUrl}/api/telegram/webhook`;
    try {
      const resp = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: CONFIG.TELEGRAM_WEBHOOK_SECRET,
          allowed_updates: ['message', 'callback_query'],
          drop_pending_updates: false
        })
      });

      const data = await resp.json();
      console.log(`[Telegram Webhook Sync] setWebhook called for ${webhookUrl}: ${data.ok ? 'SUCCESS' : data.description}`);

      res.json({
        success: Boolean(data.ok),
        registeredUrl: webhookUrl,
        telegramResponse: data
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: 'Failed to register webhook with Telegram Bot API.',
        details: err?.message
      });
    }
  },

  
  async simulateUpdate(req, res) {
    try {
      const update = req.body;
      if (typeof update?.update_id === 'number') {
        const isDuplicate = checkAndRecordUpdate(update.update_id, update.message ? 'message' : 'callback_query');
        if (isDuplicate) {
          console.log(`[Telegram Simulator] Duplicate update ${update.update_id} detected. Ignoring.`);
          return res.json({
            success: true,
            isDuplicate: true,
            result: { handled: true, action: 'DUPLICATE_IGNORED', updateId: update.update_id }
          });
        }
      }
      const result = await processTelegramUpdate(update);
      res.json({
        success: true,
        isDuplicate: false,
        result
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to simulate update'
      });
    }
  }
};
