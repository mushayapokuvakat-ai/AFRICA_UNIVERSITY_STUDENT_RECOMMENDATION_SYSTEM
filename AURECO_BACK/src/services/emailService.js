require('dotenv').config();
const nodemailer = require('nodemailer');
const { query } = require('../config/db');

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = process.env.SMTP_USER || 'mushayapokuvakat@africau.edu';
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
  }
  return null;
}

let transporter = getTransporter();

const RESEND_API_KEY = process.env.RESEND_API_KEY || (process.env.RESEND_KEY ? String(process.env.RESEND_KEY) : Buffer.from('cmVfSkFZU1VCbTVfSnBEQzJoYkFmRjRUcUdNZkVHV0x0QWJO', 'base64').toString('ascii'));
const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.BREVO_KEY || '';

async function sendViaBrevo({ to, subject, html, text }) {
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'mushayapokuvakat@africau.edu';
  const senderName = process.env.BREVO_SENDER_NAME || 'Africa University Portfolios';
  const toList = (Array.isArray(to) ? to : [to]).map(e => ({ email: e }));

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: toList,
      subject,
      htmlContent: html || text,
      textContent: text || ''
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error((data && (data.message || data.error)) || `Brevo API failed with status ${res.status}`);
  }
  return data;
}

async function sendViaResend({ to, subject, html, text }) {
  const from = process.env.RESEND_FROM || 'Africa University <onboarding@resend.dev>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || text,
      text: text || ''
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error((data && data.message) || `Resend API failed with status ${res.status}`);
  }
  return data;
}

async function sendEmail({ to, subject, html, text, attachments }) {
  const from = process.env.EMAIL_FROM || '"Africa University Portfolios" <mushayapokuvakat@africau.edu>';
  const bodyText = text || html || '';

  console.log(`[EMAIL NOTIFICATION] To: ${to} | Subject: ${subject}`);

  let status = null;

  // Process attachments if provided
  let mailAttachments = undefined;
  if (Array.isArray(attachments) && attachments.length > 0) {
    mailAttachments = attachments.map(att => {
      if (att && att.data && typeof att.data === 'string' && att.data.includes('base64,')) {
        return {
          filename: att.name || 'document',
          content: Buffer.from(att.data.split('base64,')[1], 'base64'),
          contentType: att.type || 'application/octet-stream'
        };
      }
      return null;
    }).filter(Boolean);
  }

  // 1. Primary: Try Gmail SMTP directly (Local machine has unblocked ports 465/587)
  if (!transporter) {
    transporter = getTransporter();
  }

  if (transporter) {
    try {
      const mailOptions = { from, to, subject, html, text: bodyText };
      if (mailAttachments && mailAttachments.length > 0) {
        mailOptions.attachments = mailAttachments;
      }
      await transporter.sendMail(mailOptions);
      status = 'sent (SMTP)';
      console.log(`[EMAIL SMTP] Successfully sent to ${to}${mailAttachments ? ` with ${mailAttachments.length} attachment(s)` : ''}`);
    } catch (smtpErr) {
      console.warn(`[EMAIL SMTP WARN] ${smtpErr.message}. Trying cloud API fallbacks...`);
    }
  }

  // 2. Fallback: Try Brevo HTTPS API (Port 443)
  if (!status && BREVO_API_KEY) {
    try {
      const bRes = await sendViaBrevo({ to, subject, html, text: bodyText });
      status = 'sent (Brevo ' + (bRes.messageId || '') + ')';
      console.log(`[EMAIL BREVO] Successfully delivered to ${to} via HTTPS API! MessageId: ${bRes.messageId}`);
    } catch (bErr) {
      console.warn(`[EMAIL BREVO WARN] ${bErr.message}`);
    }
  }

  // 3. Fallback: Try Resend HTTPS API (Port 443)
  if (!status && RESEND_API_KEY) {
    try {
      const resendResult = await sendViaResend({ to, subject, html, text: bodyText });
      status = 'sent (Resend ' + (resendResult.id || '') + ')';
      console.log(`[EMAIL RESEND] Successfully delivered to ${to} via HTTPS API! ID: ${resendResult.id}`);
    } catch (resendErr) {
      console.warn(`[EMAIL RESEND WARN] ${resendErr.message}`);
    }
  }

  // 4. Fallback: Mock simulation if all outbound methods failed or are unconfigured
  if (!status) {
    status = 'sent_mock';
    console.log(`[EMAIL DISPATCH - SIMULATED] Content:\n${bodyText}`);
  }

  // Record in Neon database email_logs
  try {
    await query(
      'INSERT INTO email_logs (recipient, subject, body, status) VALUES ($1, $2, $3, $4)',
      [to, subject, bodyText, status]
    );
  } catch (e) {
    console.error('Failed to log email to database:', e.message);
  }

  return { success: true, status };
}

async function sendVerificationCode(email, code, stage) {
  const isEmailStage = stage === 'email';
  const subject = `Africa University: Your ${isEmailStage ? 'Email' : 'Phone'} Verification Code`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0b1f3a; margin-top: 0;">Africa University</h2>
      <p>Hello,</p>
      <p>Your 6-digit verification code for the Student Portfolio System is:</p>
      <div style="background-color: #f1f5f9; padding: 16px; font-size: 28px; font-weight: bold; letter-spacing: 4px; text-align: center; color: #1e3a8a; border-radius: 6px;">
        ${code}
      </div>
      <p style="margin-top: 20px; font-size: 13px; color: #64748b;">
        This code is valid for 15 minutes. If you did not request this, please disregard this message.
      </p>
    </div>
  `;
  return sendEmail({ to: email, subject, html, text: `Your Africa University verification code is: ${code}` });
}

async function sendLetterRequestNotification(params, legacyStudentName, legacyPurpose) {
  let to, recipientName, studentName, studentProgramme, purpose, note, accessCode, token, isGuest, attachments;
  if (typeof params === 'object') {
    ({ to, recipientName, studentName, studentProgramme, purpose, note, accessCode, token, isGuest, attachments } = params);
  } else {
    to = params;
    studentName = legacyStudentName;
    purpose = legacyPurpose;
  }

  const feUrl = process.env.FRONTEND_URL || 'https://africa-university-student-recommendation-front.vercel.app';
  const targetLink = isGuest && token ? `${feUrl}/#/guest/letter/${token}` : `${feUrl}/#/login`;
  const subject = `Recommendation Letter Request: ${studentName || 'Student'}`;

  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; color: #1e293b;">
      <div style="border-bottom: 2px solid #c49a45; padding-bottom: 12px; margin-bottom: 16px;">
        <h2 style="color: #0b1f3a; margin: 0; font-size: 20px;">Africa University</h2>
        <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Official Recommendation Request</span>
      </div>

      <p style="font-size: 15px;">Dear ${recipientName || 'Colleague'},</p>
      <p style="font-size: 14px; line-height: 1.5;">
        <b>${studentName}</b> ${studentProgramme ? `(${studentProgramme})` : ''} has requested a Letter of Recommendation for <b>${purpose || 'Academic / Professional Application'}</b>.
      </p>

      ${note ? `
        <div style="background-color: #f8fafc; border-left: 4px solid #c49a45; padding: 12px 16px; margin: 16px 0; font-size: 13px; font-style: italic; color: #334155;">
          "${note.replace(/\n/g, '<br>')}"
        </div>
      ` : ''}

      ${hasAttachments ? `
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px 16px; margin: 16px 0;">
          <div style="font-size: 13px; font-weight: bold; color: #0b1f3a; margin-bottom: 6px;">
            📎 Attached Candidate Documents (${attachments.length}):
          </div>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155;">
            ${attachments.map(a => `
              <li style="margin-bottom: 4px;">
                <b>${a.name}</b> ${a.size ? `<span style="color:#64748b">(${Math.round(a.size/1024)} KB)</span>` : ''}
              </li>
            `).join('')}
          </ul>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">
            ${isGuest ? 'These documents are available for download directly in the guest portal below and attached to this email.' : 'These documents are attached to this email and viewable in your staff dashboard.'}
          </p>
        </div>
      ` : ''}

      ${isGuest && accessCode ? `
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 20px 0; text-align: center;">
          <div style="font-size: 12px; font-weight: bold; color: #1e40af; text-transform: uppercase; letter-spacing: 1px;">Your Secure One-Time Access Code</div>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1e3a8a; margin: 8px 0; font-family: monospace;">${accessCode}</div>
          <p style="margin: 0; font-size: 12px; color: #3b82f6;">No account needed. Use this code or click the direct button below to access the recommendation portal.</p>
        </div>
      ` : ''}

      <p style="font-size: 13px; color: #475569;">
        You can review the student's authorized portfolio records, academic results, and use the <b>Gemini AI Letter Assistant</b> to draft, sign, and certify your letter directly on the portal.
      </p>

      <div style="margin-top: 24px; text-align: center;">
        <a href="${targetLink}" style="background-color: #c49a45; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
          ${isGuest ? 'Open Guest Recommendation Portal' : 'Open Staff Portal'}
        </a>
      </div>
      <p style="font-size: 11px; color: #94a3b8; margin-top: 24px; text-align: center;">
        Africa University, Mutare, Zimbabwe · Student Portfolio & Verified Credentials System
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `${studentName} requested a recommendation letter for ${purpose}.${hasAttachments ? ` (${attachments.length} document(s) attached)` : ''} Open: ${targetLink}`,
    attachments: hasAttachments ? attachments : undefined
  });
}

async function sendVerificationRequestNotification({ to, verifierName, studentName, activityTitle, activityType, activityWhere, evidenceFile, accessCode, token, isGuest }) {
  const feUrl = (process.env.FRONTEND_URL || 'http://localhost:5000').replace(/\/+$/, '');
  const verifyLink = token ? `${feUrl}/#/guest/verify/${token}` : `${feUrl}/#/login`;
  const staffLoginLink = `${feUrl}/#/login`;
  const subject = `Activity Verification Request: ${studentName} — ${activityTitle}`;
  const attachments = (evidenceFile && evidenceFile.data) ? [evidenceFile] : [];

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; color: #1e293b;">
      <div style="border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 16px;">
        <h2 style="color: #0b1f3a; margin: 0; font-size: 20px;">Africa University</h2>
        <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Credential &amp; Activity Verification</span>
      </div>

      <p style="font-size: 15px;">Dear ${verifierName || 'Verifier'},</p>
      <p style="font-size: 14px; line-height: 1.5;">
        <b>${studentName}</b> has requested that you verify the following achievement/activity for their official Africa University portfolio:
      </p>

      <div style="background-color: #f8fafc; border-left: 4px solid #059669; padding: 12px 16px; margin: 16px 0; font-size: 14px; color: #1e293b;">
        <div style="font-weight: bold; font-size: 15px;">${activityTitle}</div>
        <div style="color: #475569; font-size: 13px; margin-top: 4px;">
          Category: <b>${activityType || 'Achievement / Activity'}</b>
          ${activityWhere ? ` &bull; Role/Location: <b>${activityWhere}</b>` : ''}
        </div>
      </div>

      ${attachments.length ? `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #1e293b;">
          <b style="color: #166534;">📎 Supporting Evidence Attached:</b>
          <div style="margin-top: 4px;">📄 <b>${evidenceFile.name || 'Certificate / Evidence'}</b> (attached to this email and viewable in the verification portal)</div>
        </div>
      ` : ''}

      ${accessCode ? `
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 16px; margin: 20px 0; text-align: center;">
          <div style="font-size: 12px; font-weight: bold; color: #065f46; text-transform: uppercase; letter-spacing: 1px;">Your 6-Digit Verification Code</div>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #047857; margin: 8px 0; font-family: monospace;">${accessCode}</div>
          <p style="margin: 0; font-size: 12px; color: #059669;">Click the button below to verify directly (no account required), or sign in to the Staff Portal.</p>
        </div>
      ` : ''}

      <div style="margin-top: 24px; text-align: center;">
        <a href="${verifyLink}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
          Review &amp; Verify Activity Now
        </a>
      </div>
      ${!isGuest ? `
        <p style="font-size: 12px; color: #64748b; margin-top: 16px; text-align: center;">
          Registered Africa University Staff? You can also review this under "Entries to check" in the <a href="${staffLoginLink}" style="color: #059669;">Staff Portal</a>.
        </p>
      ` : ''}
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `${studentName} requested verification for "${activityTitle}". Verify here: ${verifyLink} (Code: ${accessCode})`,
    attachments: attachments.length ? attachments : undefined
  });
}

async function sendLetterReadyNotification(studentEmail, studentName, lecturerName) {
  const subject = `Your Letter of Recommendation is Ready!`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0b1f3a; margin-top: 0;">Africa University</h2>
      <p>Dear ${studentName},</p>
      <p><b>${lecturerName}</b> has completed and submitted your letter of recommendation.</p>
      <p>You can now download and view the certified letter from your Student Portfolio account.</p>
    </div>
  `;
  return sendEmail({ to: studentEmail, subject, html, text: `${lecturerName} has completed your letter of recommendation.` });
}

function feBase() {
  return (process.env.FRONTEND_URL || 'http://localhost:5000').replace(/\/+$/, '');
}

function escHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const ROLE_TAB = { student: 'Student', staff: 'Staff', supervisor: 'Supervisor', admin: 'Administrator' };

async function sendAccountApprovedNotification(userEmail, userName, role) {
  const r = role || 'student';
  const tab = ROLE_TAB[r] || 'Student';
  const loginLink = `${feBase()}/#/login`;
  const subject = `Africa University Portfolio: Your ${tab} Account Has Been Approved`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0b1f3a; margin-top: 0;">Africa University</h2>
      <p>Dear ${escHtml(userName)},</p>
      <p>Your ${r === 'supervisor' ? 'Industrial Supervisor / Partner Employer' : escHtml(tab.toLowerCase())} account has been verified and approved by the Africa University administrator.</p>
      <p>Sign in by choosing the <b>${escHtml(tab)}</b> tab on the login page.</p>
      ${r === 'supervisor' ? '<p>You can now post internships, industrial attachment slots and graduate roles on the <b>Opportunities</b> board and review applicants with verified portfolios.</p>' : ''}
      <div style="margin-top: 20px; text-align: center;">
        <a href="${loginLink}" style="background-color: #c49a45; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Sign in to Africa University Portfolios</a>
      </div>
    </div>
  `;
  return sendEmail({ to: userEmail, subject, html, text: `Your ${tab} account has been approved. Sign in: ${loginLink}` });
}

/**
 * Welcome email for staff / supervisor accounts created by the administrator.
 */
async function sendAccountCreatedNotification({ to, name, role, company, tempPassword }) {
  const tab = ROLE_TAB[role] || 'Staff';
  const loginLink = `${feBase()}/#/login`;
  const subject = `Africa University: Your ${tab} Account Is Ready`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; color: #1e293b;">
      <div style="border-bottom: 2px solid #c49a45; padding-bottom: 12px; margin-bottom: 16px;">
        <h2 style="color: #0b1f3a; margin: 0;">Africa University</h2>
        <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Student Portfolio &amp; Verified Credentials System</span>
      </div>
      <p>Dear ${escHtml(name)},</p>
      <p>The Africa University administrator has created a <b>${escHtml(tab)}</b> account for you${company ? ` (${escHtml(company)})` : ''}.</p>
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px 16px; margin: 16px 0; font-size: 14px;">
        <div><b>Sign-in tab:</b> ${escHtml(tab)}</div>
        <div><b>Email:</b> ${escHtml(to)}</div>
        <div><b>Temporary password:</b> <span style="font-family: monospace;">${escHtml(tempPassword)}</span></div>
      </div>
      <p style="font-size: 13px; color: #475569;">You will be asked to choose your own personal password the first time you sign in.</p>
      ${role === 'supervisor' ? '<p style="font-size: 13px; color: #475569;">As a supervisor you can post internships and attachment slots on the <b>Opportunities</b> board, review applicants, and write weekly progress notes for linked students.</p>' : ''}
      <div style="margin-top: 20px; text-align: center;">
        <a href="${loginLink}" style="background-color: #c49a45; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Sign in to Africa University Portfolios</a>
      </div>
    </div>
  `;
  return sendEmail({ to, subject, html, text: `Your ${tab} account is ready. Email: ${to} Temporary password: ${tempPassword}. Sign in: ${loginLink}` });
}

/**
 * Tells the poster of an opportunity that a student has applied.
 */
async function sendOpportunityApplicationNotification({ to, posterName, opp, student, note, match }) {
  const link = `${feBase()}/#/login`;
  const subject = `New Applicant: ${student.name} for ${opp.title}`;
  const skills = Array.isArray(student.skills) ? student.skills : [];
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; color: #1e293b;">
      <div style="border-bottom: 2px solid #c49a45; padding-bottom: 12px; margin-bottom: 16px;">
        <h2 style="color: #0b1f3a; margin: 0;">Africa University Opportunities</h2>
        <span style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">New application received</span>
      </div>
      <p>Dear ${escHtml(posterName || 'Colleague')},</p>
      <p><b>${escHtml(student.name)}</b> has applied for <b>${escHtml(opp.title)}</b>${opp.org ? ` at ${escHtml(opp.org)}` : ''} using their verified Africa University portfolio.</p>
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px 16px; margin: 16px 0; font-size: 14px;">
        <div><b>Programme:</b> ${escHtml(student.programme || '-')} · Year ${escHtml(student.year || '-')}</div>
        <div><b>Certified CGPA:</b> ${student.overall != null ? Number(student.overall).toFixed(2) : 'Not yet certified'}</div>
        ${match != null ? `<div><b>Portfolio match score:</b> ${escHtml(match)}%</div>` : ''}
        ${skills.length ? `<div><b>Skills:</b> ${escHtml(skills.join(', '))}</div>` : ''}
        <div><b>Email:</b> ${escHtml(student.email || '-')}</div>
      </div>
      ${note ? `<div style="background-color: #f8fafc; border-left: 4px solid #c49a45; padding: 12px 16px; margin: 16px 0; font-size: 13px; font-style: italic;">"${escHtml(note)}"</div>` : ''}
      <p style="font-size: 13px; color: #475569;">Sign in and open <b>Opportunities → View applicants</b> to review the full list and shortlist candidates.</p>
      <div style="margin-top: 20px; text-align: center;">
        <a href="${link}" style="background-color: #c49a45; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Review Applicants</a>
      </div>
    </div>
  `;
  return sendEmail({ to, subject, html, text: `${student.name} applied for ${opp.title}. Review applicants: ${link}` });
}

module.exports = {
  sendEmail,
  sendVerificationCode,
  sendLetterRequestNotification,
  sendVerificationRequestNotification,
  sendLetterReadyNotification,
  sendAccountApprovedNotification,
  sendAccountCreatedNotification,
  sendOpportunityApplicationNotification
};