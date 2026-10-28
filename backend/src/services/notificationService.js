import { sendTelegramMessage } from '../controllers/telegramController.js';
import {
  sendApplicationApprovalEmail,
  sendApplicationRejectionEmail,
  sendAccountSuspensionEmail
} from './emailService.js';
import { db } from './db.js';
import { CONFIG } from '../config/index.js';

function getAppUrl() {
  const settings = typeof db.getSettings === 'function' ? db.getSettings() : {};
  return (settings?.websiteUrl || CONFIG.APP_URL || 'https://arx-website-sjs.vercel.app').replace(/\/+$/, '');
}

/**
 * Dispatch automated notification when a student application is approved.
 * Sends both Telegram message (if linked) and transactional email (if email present).
 */
export async function notifyApplicationApproved(member) {
  if (!member) return { telegram: false, email: false };
  const appUrl = getAppUrl();
  const results = { telegram: false, email: false };

  // 1. Telegram
  if (member.telegramUserId) {
    try {
      const msg =
        `🎉 *Congratulations, ${member.studentName}!*\n\n` +
        `Your student application for *ARX IT CLUB OF SJS* has been **APPROVED**!\n\n` +
        `• *Login ID (Member ID):* \`${member.memberId}\`\n` +
        `• *Class:* ${member.class || 'N/A'}\n` +
        `• *Status:* ✅ Active / Approved\n\n` +
        `You can now access your course tracks and the member portal using your Login ID and password.\n\n` +
        `🌐 [Log in to Student Portal](${appUrl}/#login)`;

      const tgRes = await sendTelegramMessage(member.telegramUserId, msg);
      results.telegram = Boolean(tgRes?.success);
    } catch (err) {
      console.warn(`[Notification] Telegram approval message failed for ${member.memberId}:`, err.message);
    }
  }

  // 2. Email (ALWAYS send, includes Telegram bot link)
  if (member.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email.trim())) {
    try {
      await sendApplicationApprovalEmail({
        to: member.email.trim(),
        recipientName: member.studentName,
        memberId: member.memberId,
        studentClass: member.class,
        appUrl,
        telegramBotUrl: `https://t.me/${CONFIG.TELEGRAM_BOT_USERNAME}`,
        telegramBotUsername: `@${CONFIG.TELEGRAM_BOT_USERNAME}`
      });
      results.email = true;
      console.log(`[Notification] ✅ Approval email sent to ${member.email} with Telegram bot link`);
    } catch (err) {
      console.warn(`[Notification] Email approval notification failed for ${member.memberId} (${member.email}):`, err.message);
    }
  } else {
    console.warn(`[Notification] ⚠️ Cannot send approval notification - no valid email for ${member.memberId}`);
  }

  return results;
}

/**
 * Dispatch automated notification when a student application is declined / rejected.
 * Sends both Telegram message (if linked) and transactional email (if email present).
 */
export async function notifyApplicationRejected(member, reason = '') {
  if (!member) return { telegram: false, email: false };
  const results = { telegram: false, email: false };
  const effectiveReason = reason || member.rejectionReason || '';

  // 1. Telegram
  if (member.telegramUserId) {
    try {
      const msg =
        `ℹ️ *Application Status Update*\n\n` +
        `Dear ${member.studentName}, your membership application for *ARX IT CLUB OF SJS* was evaluated.\n\n` +
        `• *Status:* ❌ *Application Declined*\n` +
        (effectiveReason ? `• *Reason:* _${effectiveReason}_\n\n` : '\n') +
        `Admissions are evaluated based on laboratory seat capacity and cohort prerequisites. If you have questions or wish to apply in future cycles, please consult club coordinators.`;

      const tgRes = await sendTelegramMessage(member.telegramUserId, msg);
      results.telegram = Boolean(tgRes?.success);
    } catch (err) {
      console.warn(`[Notification] Telegram rejection message failed for ${member.memberId}:`, err.message);
    }
  }

  // 2. Email
  if (member.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email.trim())) {
    try {
      await sendApplicationRejectionEmail({
        to: member.email.trim(),
        recipientName: member.studentName,
        memberId: member.memberId,
        reason: effectiveReason
      });
      results.email = true;
    } catch (err) {
      console.warn(`[Notification] Email rejection notification failed for ${member.memberId} (${member.email}):`, err.message);
    }
  }

  return results;
}

/**
 * Dispatch automated notification when a member account is suspended.
 * Sends both Telegram message (if linked) and transactional email (if email present).
 */
export async function notifyMemberSuspended(member, reason = '') {
  if (!member) return { telegram: false, email: false };
  const results = { telegram: false, email: false };

  // 1. Telegram
  if (member.telegramUserId) {
    try {
      const msg =
        `⚠️ *Account Notice — Membership Suspended*\n\n` +
        `Dear ${member.studentName}, your ARX IT CLUB OF SJS membership account (\`${member.memberId}\`) has been **SUSPENDED** by administration.\n\n` +
        `• *Status:* 🚫 *Account Suspended*\n` +
        (reason ? `• *Details:* _${reason}_\n\n` : '\n') +
        `Access to member portal features, attendance tracking, and certificate issuance is currently paused.\n\n` +
        `To appeal or discuss your account status, please contact club leadership or faculty coordinators at Computer Lab 3.`;

      const tgRes = await sendTelegramMessage(member.telegramUserId, msg);
      results.telegram = Boolean(tgRes?.success);
    } catch (err) {
      console.warn(`[Notification] Telegram suspension message failed for ${member.memberId}:`, err.message);
    }
  }

  // 2. Email
  if (member.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email.trim())) {
    try {
      await sendAccountSuspensionEmail({
        to: member.email.trim(),
        recipientName: member.studentName,
        memberId: member.memberId,
        reason
      });
      results.email = true;
    } catch (err) {
      console.warn(`[Notification] Email suspension notification failed for ${member.memberId} (${member.email}):`, err.message);
    }
  }

  return results;
}
