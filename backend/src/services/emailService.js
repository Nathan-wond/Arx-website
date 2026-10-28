/**
 * Gmail SMTP Email Transport — Nodemailer
 *
 * Configuration (from .env):
 *   SMTP_HOST    = smtp.gmail.com
 *   SMTP_PORT    = 465
 *   SMTP_SECURE  = true          (SSL on port 465)
 *   SMTP_USER    = your-account@gmail.com
 *   SMTP_PASS    = 16-char Gmail App Password
 *   EMAIL_FROM   = "ARX IT Club" <arxitclub.sjs@gmail.com>
 *
 * Generates an App Password at: https://myaccount.google.com/apppasswords
 */
import nodemailer from 'nodemailer';
import { CONFIG } from '../config/index.js';

let _transporter = null;

/**
 * Lazily build (and cache) the Nodemailer transporter from env vars.
 * Uses explicit host/port/secure so the transport works with any SMTP
 * provider, not just Gmail's internal service alias.
 */
function getTransporter() {
  if (_transporter) return _transporter;

  const host   = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port   = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = (process.env.SMTP_SECURE || 'true').trim().toLowerCase() !== 'false'; // true = SSL
  const user   = (process.env.SMTP_USER || '').trim();
  const pass   = (process.env.SMTP_PASS || '').trim();

  if (!user || !pass) {
    throw new Error(
      '[EmailService] SMTP_USER and SMTP_PASS must be set in .env.\n' +
      '  SMTP_USER = your Gmail address\n' +
      '  SMTP_PASS = 16-char App Password from https://myaccount.google.com/apppasswords'
    );
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,          // true → SSL/TLS on port 465; false → STARTTLS on port 587
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    tls: {
      // Enforce valid certificates in production
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });

  return _transporter;
}

/**
 * Resolve the "from" address.
 * Priority: EMAIL_FROM env var → fallback constructed from SMTP_USER.
 */
function resolveFrom() {
  const envFrom = (process.env.EMAIL_FROM || '').trim();
  if (envFrom) return envFrom;

  const user     = (process.env.SMTP_USER || '').trim();
  const clubName = (process.env.CLUB_NAME || 'ARX IT CLUB').trim();
  return `"${clubName}" <${user}>`;
}

// ---------------------------------------------------------------------------
// sendOtpEmail
// ---------------------------------------------------------------------------
/**
 * Send a 2FA OTP email.
 *
 * @param {object} opts
 * @param {string} opts.to            - Recipient email address
 * @param {string} opts.recipientName - Display name shown in the email body
 * @param {string} opts.otpCode       - 6-digit OTP code (plain text)
 * @param {string} [opts.role]        - Role label shown in email body (optional)
 * @returns {Promise<void>}
 */
export async function sendOtpEmail({ to, recipientName, otpCode, role = 'Administrator' }) {
  const transporter = getTransporter();
  const clubName    = (process.env.CLUB_NAME || 'ARX IT CLUB').trim();
  const from        = resolveFrom();
  const subject     = `${clubName} — Your Secure Login Code`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Your 2FA Code — ${clubName}</title>
  <style>
    body { margin:0; padding:0; background:#0f172a; font-family:'Segoe UI',Arial,sans-serif; }
    .wrapper { max-width:520px; margin:40px auto; }
    .card { background:#1e293b; border-radius:16px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,.4); }
    .header { background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%); padding:32px 40px 24px; }
    .header h1 { margin:0; color:#fff; font-size:22px; font-weight:700; letter-spacing:-.3px; }
    .header p  { margin:6px 0 0; color:rgba(255,255,255,.75); font-size:13px; }
    .body { padding:32px 40px; }
    .greeting { color:#e2e8f0; font-size:15px; margin:0 0 24px; }
    .otp-block { background:#0f172a; border:1px solid #334155; border-radius:12px;
                 padding:24px; text-align:center; margin:0 0 24px; }
    .otp-label { color:#94a3b8; font-size:12px; text-transform:uppercase; letter-spacing:1.5px; margin:0 0 12px; }
    .otp-code  { font-size:42px; font-weight:800; letter-spacing:12px; color:#a78bfa;
                 font-family:'Courier New',monospace; margin:0; }
    .otp-expiry{ color:#64748b; font-size:12px; margin:12px 0 0; }
    .warning { background:#1e1a2e; border-left:3px solid #ef4444; border-radius:6px;
               padding:12px 16px; margin:0 0 24px; }
    .warning p { color:#f87171; font-size:12px; margin:0; }
    .footer { border-top:1px solid #334155; padding:20px 40px; background:#0f172a; }
    .footer p { color:#475569; font-size:11px; margin:0; line-height:1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>🔐 Two-Factor Authentication</h1>
        <p>${clubName} — Secure Access Portal</p>
      </div>
      <div class="body">
        <p class="greeting">Hello, <strong style="color:#c4b5fd">${recipientName}</strong>.<br/>
        A sign-in attempt was detected for your <strong style="color:#c4b5fd">${role}</strong> account.
        Use the code below to complete your login.</p>

        <div class="otp-block">
          <p class="otp-label">Your Verification Code</p>
          <p class="otp-code">${otpCode}</p>
          <p class="otp-expiry">⏱ Expires in <strong>5 minutes</strong></p>
        </div>

        <div class="warning">
          <p>⚠️ <strong>Never share this code.</strong> ${clubName} staff will never ask for it.
          If you did not request this login, change your password immediately.</p>
        </div>
      </div>
      <div class="footer">
        <p>This is an automated security message from <strong>${clubName}</strong>.<br/>
        Do not reply to this email. If you need help, contact your system administrator.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text =
    `${clubName} — 2FA Login Code\n\n` +
    `Hello ${recipientName},\n\n` +
    `Your verification code is: ${otpCode}\n\n` +
    `This code expires in 5 minutes. Do not share it with anyone.\n\n` +
    `If you did not attempt to log in, change your password immediately.`;

  await transporter.sendMail({ from, to, subject, html, text });
}

// ---------------------------------------------------------------------------
// sendApplicationApprovalEmail
// ---------------------------------------------------------------------------
/**
 * Send an automated email notifying the student that their membership application was approved.
 */
export async function sendApplicationApprovalEmail({ to, recipientName, memberId, studentClass, appUrl, telegramBotUrl, telegramBotUsername }) {
  const transporter = getTransporter();
  const clubName = (process.env.CLUB_NAME || 'ARX IT CLUB').trim();
  const from = resolveFrom();
  const subject = `🎉 Congratulations! Your ${clubName} Application is Approved`;
  const portalUrl = (appUrl || process.env.APP_URL || 'https://arx-website-sjs.vercel.app').replace(/\/+$/, '') + '/#login';
  const botUrl = telegramBotUrl || `https://t.me/${CONFIG.TELEGRAM_BOT_USERNAME}`;
  const botUsername = telegramBotUsername || `@${CONFIG.TELEGRAM_BOT_USERNAME}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Application Approved — ${clubName}</title>
  <style>
    body { margin:0; padding:0; background:#0f172a; font-family:'Segoe UI',Arial,sans-serif; color:#e2e8f0; }
    .wrapper { max-width:540px; margin:40px auto; padding:0 16px; }
    .card { background:#1e293b; border-radius:16px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,.4); border:1px solid #334155; }
    .header { background:linear-gradient(135deg,#059669 0%,#10b981 100%); padding:32px 36px 24px; text-align:center; }
    .header h1 { margin:0; color:#fff; font-size:22px; font-weight:800; letter-spacing:-.3px; }
    .header p { margin:6px 0 0; color:rgba(255,255,255,.9); font-size:13px; font-weight:500; }
    .body { padding:32px 36px; }
    .greeting { font-size:15px; margin:0 0 20px; line-height:1.6; color:#cbd5e1; }
    .id-block { background:#0f172a; border:1px solid #059669; border-radius:12px; padding:20px; text-align:center; margin:0 0 24px; }
    .id-label { color:#34d399; font-size:11px; text-transform:uppercase; letter-spacing:1.5px; margin:0 0 8px; font-weight:700; }
    .id-value { font-size:28px; font-weight:800; letter-spacing:3px; color:#6ee7b7; font-family:'Courier New',monospace; margin:0; }
    .info-list { background:rgba(15,23,42,0.6); border:1px solid #334155; border-radius:10px; padding:16px; margin:0 0 24px; font-size:13px; }
    .info-item { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #1e293b; }
    .info-item:last-child { border-bottom:none; }
    .btn { display:block; width:100%; text-align:center; background:#10b981; color:#ffffff !important; text-decoration:none; font-weight:700; font-size:14px; padding:14px 20px; border-radius:10px; margin:24px 0 16px; box-sizing:border-box; }
    .footer { border-top:1px solid #334155; padding:20px 36px; background:#0f172a; font-size:11px; color:#64748b; line-height:1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>🎉 Application Approved</h1>
        <p>${clubName} OF SJS — Student Admissions</p>
      </div>
      <div class="body">
        <p class="greeting">
          Hello <strong>${recipientName}</strong>,<br/><br/>
          Great news! Your student registration and membership application for <strong>${clubName}</strong> has been officially <strong>APPROVED</strong> by the administration team.
        </p>

        <div class="id-block">
          <p class="id-label">Your Official Login ID (Member ID)</p>
          <p class="id-value">${memberId}</p>
        </div>

        <div class="info-list">
          <div class="info-item"><span style="color:#94a3b8">Student Name:</span> <strong>${recipientName}</strong></div>
          <div class="info-item"><span style="color:#94a3b8">Class:</span> <strong>${studentClass || 'Enrolled Student'}</strong></div>
          <div class="info-item"><span style="color:#94a3b8">Membership Status:</span> <strong style="color:#34d399">ACTIVE / APPROVED ✅</strong></div>
        </div>

        <p style="font-size:13px; color:#94a3b8; line-height:1.6; margin:0 0 16px;">
          You can now log in to the Student Portal using your <strong>Login ID (${memberId})</strong> and the password you created during registration.
        </p>

        <a href="${portalUrl}" class="btn">Log in to Student Portal &rarr;</a>

        <div style="background:#1e3a8a; border:1px solid #3b82f6; border-radius:10px; padding:16px; margin:24px 0 0; text-align:center;">
          <p style="margin:0 0 8px; color:#93c5fd; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">📱 Get Instant Updates on Telegram</p>
          <p style="margin:0 0 12px; color:#bfdbfe; font-size:13px; line-height:1.5;">Connect with our official bot ${botUsername} to receive real-time notifications about events, assignments, and announcements.</p>
          <a href="${botUrl}" style="display:inline-block; background:#3b82f6; color:#ffffff !important; text-decoration:none; font-weight:700; font-size:13px; padding:10px 24px; border-radius:8px;">Start Bot Chat</a>
        </div>
      </div>
      <div class="footer">
        <p>This is an automated notification from <strong>${clubName}</strong>.<br/>
        Keep your Login ID safe. If you have questions, please contact your club coordinator.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text =
    `${clubName} — Application Approved!\n\n` +
    `Hello ${recipientName},\n\n` +
    `Congratulations! Your student application for ${clubName} has been officially APPROVED!\n\n` +
    `• Your Login ID (Member ID): ${memberId}\n` +
    `• Class: ${studentClass || 'Enrolled Student'}\n` +
    `• Status: ACTIVE / APPROVED\n\n` +
    `You can now access your course tracks and the member portal using your Login ID and password.\n\n` +
    `Log in here: ${portalUrl}\n\n` +
    `Best regards,\n${clubName} Admissions Team`;

  await transporter.sendMail({ from, to, subject, html, text });
}

// ---------------------------------------------------------------------------
// sendApplicationRejectionEmail
// ---------------------------------------------------------------------------
/**
 * Send an automated email notifying the student that their membership application was declined.
 */
export async function sendApplicationRejectionEmail({ to, recipientName, memberId, reason }) {
  const transporter = getTransporter();
  const clubName = (process.env.CLUB_NAME || 'ARX IT CLUB').trim();
  const from = resolveFrom();
  const subject = `${clubName} — Application Status Update`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Application Status — ${clubName}</title>
  <style>
    body { margin:0; padding:0; background:#0f172a; font-family:'Segoe UI',Arial,sans-serif; color:#e2e8f0; }
    .wrapper { max-width:540px; margin:40px auto; padding:0 16px; }
    .card { background:#1e293b; border-radius:16px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,.4); border:1px solid #334155; }
    .header { background:linear-gradient(135deg,#b91c1c 0%,#ef4444 100%); padding:32px 36px 24px; text-align:center; }
    .header h1 { margin:0; color:#fff; font-size:22px; font-weight:800; letter-spacing:-.3px; }
    .header p { margin:6px 0 0; color:rgba(255,255,255,.9); font-size:13px; font-weight:500; }
    .body { padding:32px 36px; }
    .greeting { font-size:15px; margin:0 0 20px; line-height:1.6; color:#cbd5e1; }
    .status-block { background:#0f172a; border-left:4px solid #ef4444; border-radius:8px; padding:16px 20px; margin:0 0 20px; }
    .status-title { color:#f87171; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin:0 0 6px; }
    .status-desc { color:#e2e8f0; font-size:14px; margin:0; line-height:1.5; }
    .footer { border-top:1px solid #334155; padding:20px 36px; background:#0f172a; font-size:11px; color:#64748b; line-height:1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>Application Status Notice</h1>
        <p>${clubName} OF SJS — Admissions Board</p>
      </div>
      <div class="body">
        <p class="greeting">
          Hello <strong>${recipientName}</strong>,<br/><br/>
          Thank you for applying to <strong>${clubName}</strong>. Following a comprehensive review of this cohort's admissions and track capacity, we regret to inform you that your application was <strong>declined</strong> at this time.
        </p>

        <div class="status-block">
          <p class="status-title">Status: Application Declined</p>
          <p class="status-desc">${reason ? `Reason: ${reason}` : 'Cohort capacity reached or track prerequisites not satisfied.'}</p>
        </div>

        <p style="font-size:13px; color:#94a3b8; line-height:1.6; margin:0 0 16px;">
          Admissions decisions are based on available laboratory seats and cohort enrollment limits. You are welcome to re-apply during our next intake cycle or reach out to club coordinators at Computer Lab 3 for future opportunities.
        </p>
      </div>
      <div class="footer">
        <p>This is an automated notification from <strong>${clubName}</strong>.<br/>
        Reference Member ID: <code>${memberId || 'N/A'}</code>.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text =
    `${clubName} — Application Status Update\n\n` +
    `Hello ${recipientName},\n\n` +
    `Thank you for applying to ${clubName}.\n` +
    `After evaluation by the admissions board, your application was declined for this cohort.\n\n` +
    (reason ? `Reason: ${reason}\n\n` : '') +
    `Admissions decisions are based on cohort capacity. You may apply again in the next admissions intake cycle.\n\n` +
    `Reference ID: ${memberId || 'N/A'}\n\n` +
    `Best regards,\n${clubName} Admissions Board`;

  await transporter.sendMail({ from, to, subject, html, text });
}

// ---------------------------------------------------------------------------
// sendAccountSuspensionEmail
// ---------------------------------------------------------------------------
/**
 * Send an automated email notifying the student that their membership has been suspended.
 */
export async function sendAccountSuspensionEmail({ to, recipientName, memberId, reason }) {
  const transporter = getTransporter();
  const clubName = (process.env.CLUB_NAME || 'ARX IT CLUB').trim();
  const from = resolveFrom();
  const subject = `⚠️ Notice: ${clubName} Account Suspended`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Account Suspended — ${clubName}</title>
  <style>
    body { margin:0; padding:0; background:#0f172a; font-family:'Segoe UI',Arial,sans-serif; color:#e2e8f0; }
    .wrapper { max-width:540px; margin:40px auto; padding:0 16px; }
    .card { background:#1e293b; border-radius:16px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,.4); border:1px solid #334155; }
    .header { background:linear-gradient(135deg,#d97706 0%,#f59e0b 100%); padding:32px 36px 24px; text-align:center; }
    .header h1 { margin:0; color:#fff; font-size:22px; font-weight:800; letter-spacing:-.3px; }
    .header p { margin:6px 0 0; color:rgba(255,255,255,.9); font-size:13px; font-weight:500; }
    .body { padding:32px 36px; }
    .greeting { font-size:15px; margin:0 0 20px; line-height:1.6; color:#cbd5e1; }
    .notice-block { background:#0f172a; border-left:4px solid #f59e0b; border-radius:8px; padding:16px 20px; margin:0 0 20px; }
    .notice-title { color:#fbbf24; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin:0 0 6px; }
    .notice-desc { color:#e2e8f0; font-size:14px; margin:0; line-height:1.5; }
    .footer { border-top:1px solid #334155; padding:20px 36px; background:#0f172a; font-size:11px; color:#64748b; line-height:1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>⚠️ Account Notice: Suspended</h1>
        <p>${clubName} OF SJS — Executive Administration</p>
      </div>
      <div class="body">
        <p class="greeting">
          Hello <strong>${recipientName}</strong>,<br/><br/>
          This is an official administrative notice that your <strong>${clubName}</strong> membership account (<strong>${memberId}</strong>) has been <strong>SUSPENDED</strong>.
        </p>

        <div class="notice-block">
          <p class="notice-title">Status: Membership Suspended 🚫</p>
          <p class="notice-desc">${reason ? `Reason / Notice: ${reason}` : 'Administrative review or policy compliance restriction.'}</p>
        </div>

        <p style="font-size:13px; color:#94a3b8; line-height:1.6; margin:0 0 16px;">
          While your membership is suspended, access to the student portal, course enrollment materials, workshop attendance logging, and certificates has been paused.
        </p>
        <p style="font-size:13px; color:#94a3b8; line-height:1.6; margin:0 0 16px;">
          To appeal or resolve your account status, please reach out directly to the club leadership or visit the faculty advisors at Computer Lab 3 during regular workshop hours.
        </p>
      </div>
      <div class="footer">
        <p>This is an automated administrative notice from <strong>${clubName}</strong>.<br/>
        Reference Member ID: <code>${memberId || 'N/A'}</code>.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text =
    `${clubName} — Notice: Account Suspended\n\n` +
    `Hello ${recipientName},\n\n` +
    `Your ${clubName} membership account (${memberId}) has been SUSPENDED by administration.\n\n` +
    `Status: Membership Suspended\n` +
    (reason ? `Details: ${reason}\n\n` : '\n') +
    `Access to the student portal, course materials, attendance logging, and certificates is currently restricted.\n\n` +
    `To resolve or appeal your account status, please contact club leadership or visit Computer Lab 3.\n\n` +
    `Best regards,\n${clubName} Administration`;

  await transporter.sendMail({ from, to, subject, html, text });
}

// ---------------------------------------------------------------------------
// verifySmtpConnection — startup health check
// ---------------------------------------------------------------------------
/**
 * Verify the SMTP transporter can reach the mail server.
 * Call once on server startup to catch misconfigured credentials early.
 * @returns {Promise<boolean>}
 */
export async function verifySmtpConnection() {
  try {
    const t = getTransporter();
    await t.verify();
    console.log('[EmailService] ✅ SMTP connection verified successfully.');
    return true;
  } catch (err) {
    console.warn('[EmailService] ⚠️  SMTP verification failed:', err.message);
    console.warn('[EmailService]    Check SMTP_USER, SMTP_PASS, SMTP_HOST, SMTP_PORT in .env');
    return false;
  }
}

/**
 * Force the cached transporter to be rebuilt on the next call.
 * Useful if SMTP credentials are updated at runtime.
 */
export function resetTransporter() {
  _transporter = null;
}
