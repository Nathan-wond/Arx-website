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
