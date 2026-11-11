const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const emailService = require('../services/emailService');

/**
 * POST /api/letters/request
 * Dispatches a recommendation letter request and generates guest access code if external
 */
router.post('/request', requireAuth, async (req, res) => {
  try {
    const studentUser = req.user;
    const studentId = studentUser.id || studentUser.userId;
    const { recipientEmail, recipientName, staffId, purpose, due, note, share, attachments } = req.body;

    if (!recipientEmail || !/^\S+@\S+\.\S+$/.test(recipientEmail)) {
      return res.status(400).json({ message: 'A valid recommender email address is required.' });
    }

    // Fetch full student record to get actual name and programme
    const studentDbRes = await query('SELECT id, name, programme, email FROM users WHERE id = $1 LIMIT 1', [studentId]);
    const student = studentDbRes.rows[0] || { id: studentId, name: studentUser.name || 'Student', programme: 'Africa University' };

    // Check if recipient is an existing registered staff/supervisor user
    const userRes = await query(
      `SELECT id, name, email, role FROM users WHERE LOWER(email) = LOWER($1) AND status = 'active' LIMIT 1`,
      [recipientEmail.trim()]
    );
    const existingStaff = userRes.rows[0];

    const isGuest = !existingStaff;
    const finalStaffId = existingStaff ? existingStaff.id : (staffId || null);
    const finalRecipientName = recipientName || (existingStaff ? existingStaff.name : recipientEmail.split('@')[0]);

    const letterId = 'l_' + Math.random().toString(36).slice(2, 9);
    const accessCode = String(Math.floor(100000 + Math.random() * 900000));
    const token = 'tok_' + crypto.randomBytes(20).toString('hex');

    // 1. Record guest access token in guest_access table (valid for 60 days)
    await query(`
      INSERT INTO guest_access (
        token, access_code, type, reference_id, student_id, recipient_email, recipient_name, expires_at
      ) VALUES ($1, $2, 'letter', $3, $4, $5, $6, NOW() + INTERVAL '60 days')
    `, [
      token,
      accessCode,
      letterId,
      student.id,
      recipientEmail.trim(),
      finalRecipientName
    ]);

    // 2. Add letter to portfolio_state.letters
    const psRes = await query(`SELECT * FROM portfolio_state WHERE id = 'current' LIMIT 1`);
    const ps = psRes.rows[0] || {};
    const letters = ps.letters || [];

    const newLetter = {
      id: letterId,
      sid: student.id,
      staffId: finalStaffId,
      recipientEmail: recipientEmail.trim(),
      recipientName: finalRecipientName,
      purpose: purpose || 'Job application',
      due: due ? new Date(due).getTime() : Date.now() + 14 * 86400000,
      note: (note || '').trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      share: share || { grades: true, ach: true, lead: true, extra: true },
      status: 'waiting',
      reply: '',
      versions: [],
      changeRequests: [],
      changesUsed: 0,
      draft: '',
      accessCode,
      accessToken: token,
      isGuest,
      created: Date.now()
    };

    letters.unshift(newLetter);

    await query(`UPDATE portfolio_state SET letters = $1, updated_at = CURRENT_TIMESTAMP WHERE id = 'current'`, [
      JSON.stringify(letters)
    ]);

    // 3. Dispatch real email notification directly to recommender
    try {
      await emailService.sendLetterRequestNotification({
        to: recipientEmail.trim(),
        recipientName: finalRecipientName,
        studentName: student.name,
        studentProgramme: student.programme,
        purpose: newLetter.purpose,
        note: newLetter.note,
        attachments: newLetter.attachments,
        accessCode,
        token,
        isGuest
      });
    } catch (mailErr) {
      console.error('Failed to dispatch recommendation request email:', mailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `Recommendation request sent directly to ${recipientEmail}.`,
      letter: newLetter
    });
  } catch (err) {
    console.error('Error creating letter request:', err);
    return res.status(500).json({ message: 'Failed to process recommendation request.' });
  }
});

/**
 * POST /api/letters/verify-activity
 * Saves/updates the activity (eliminating race conditions), links internal staff if registered,
 * generates a 6-digit guest verification code & token, and dispatches the verification email with evidence attached.
 */
router.post('/verify-activity', requireAuth, async (req, res) => {
  try {
    const studentUser = req.user;
    const studentId = studentUser.id || studentUser.userId;
    const { activityId, activity, verifierEmail, verifierName } = req.body;

    if (!verifierEmail || !/^\S+@\S+\.\S+$/.test(verifierEmail)) {
      return res.status(400).json({ message: 'A valid verifier email is required.' });
    }

    const cleanEmail = verifierEmail.trim();

    // Fetch student record for actual name
    const studentDbRes = await query('SELECT id, name FROM users WHERE id = $1 LIMIT 1', [studentId]);
    const student = studentDbRes.rows[0] || { id: studentId, name: studentUser.name || 'Student' };

    // Check if verifierEmail belongs to a registered staff/supervisor in the system
    const staffRes = await query(
      `SELECT id, name, email, role, teaches FROM users WHERE LOWER(email) = LOWER($1) AND status = 'active' LIMIT 1`,
      [cleanEmail]
    );
    const existingStaff = staffRes.rows[0];
    const isGuest = !existingStaff;
    const finalVerifierName = verifierName || (existingStaff ? existingStaff.name : cleanEmail.split('@')[0]);

    // If verifier is a registered staff member, ensure studentId is linked in their teaches list so they see the student!
    if (existingStaff && existingStaff.role === 'staff') {
      const currentTeaches = Array.isArray(existingStaff.teaches) ? existingStaff.teaches : [];
      if (!currentTeaches.includes(student.id)) {
        currentTeaches.push(student.id);
        await query(`UPDATE users SET teaches = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
          JSON.stringify(currentTeaches),
          existingStaff.id
        ]);
      }
    }

    const psRes = await query(`SELECT * FROM portfolio_state WHERE id = 'current' LIMIT 1`);
    const ps = psRes.rows[0] || {};
    const acts = ps.acts || [];
    const targetId = activityId || (activity && activity.id) || ('a_' + Math.random().toString(36).slice(2, 9));
    let idx = acts.findIndex(a => a.id === targetId);
    let act;

    if (idx === -1) {
      // Activity wasn't flushed yet by debounce timer — create/insert it right now!
      act = Object.assign({
        id: targetId,
        sid: student.id,
        type: 'achievement',
        year: 1,
        title: 'Student Achievement',
        where: '',
        status: 'waiting',
        created: Date.now(),
        evidence: '',
        comments: []
      }, activity || {});
      act.id = targetId;
      act.sid = student.id;
      act.verifierEmail = cleanEmail;
      act.verifierName = finalVerifierName;
      if (existingStaff) act.verifierId = existingStaff.id;
      acts.push(act);
    } else {
      act = Object.assign({}, acts[idx], activity || {});
      act.verifierEmail = cleanEmail;
      act.verifierName = finalVerifierName;
      if (existingStaff) act.verifierId = existingStaff.id;
      acts[idx] = act;
    }

    const accessCode = String(Math.floor(100000 + Math.random() * 900000));
    const token = 'tok_' + crypto.randomBytes(20).toString('hex');
    act.accessCode = accessCode;
    act.accessToken = token;

    // Persist updated acts array to portfolio_state immediately
    await query(`UPDATE portfolio_state SET acts = $1, updated_at = CURRENT_TIMESTAMP WHERE id = 'current'`, [
      JSON.stringify(acts)
    ]);

    // Record guest access token in guest_access table
    await query(`
      INSERT INTO guest_access (
        token, access_code, type, reference_id, student_id, recipient_email, recipient_name, expires_at
      ) VALUES ($1, $2, 'verify', $3, $4, $5, $6, NOW() + INTERVAL '60 days')
    `, [
      token,
      accessCode,
      targetId,
      student.id,
      cleanEmail,
      finalVerifierName
    ]);

    // Prepare evidence attachment if present
    const rawEvData = act.evidenceData || (act.evidenceFile && act.evidenceFile.data) || '';
    const rawEvName = (act.evidenceFile && act.evidenceFile.name) || act.evidence || '';
    const evidenceFile = (rawEvData || rawEvName) ? {
      name: rawEvName || 'evidence_document',
      type: (act.evidenceFile && act.evidenceFile.type) || 'application/octet-stream',
      size: (act.evidenceFile && act.evidenceFile.size) || 0,
      data: rawEvData
    } : null;

    // Dispatch real email notification to verifier (works for both unregistered external verifiers and internal staff)
    try {
      await emailService.sendVerificationRequestNotification({
        to: cleanEmail,
        verifierName: finalVerifierName,
        studentName: student.name,
        activityTitle: act.title,
        activityType: act.type,
        activityWhere: act.where,
        evidenceFile,
        accessCode,
        token,
        isGuest
      });
    } catch (mailErr) {
      console.error('Failed to dispatch activity verification email:', mailErr.message);
    }

    return res.json({
      success: true,
      message: `Verification request sent to ${cleanEmail}.`,
      activity: act,
      accessCode,
      token
    });
  } catch (err) {
    console.error('Error dispatching activity verification:', err);
    return res.status(500).json({ message: 'Failed to send verification request.' });
  }
});

module.exports = router;
