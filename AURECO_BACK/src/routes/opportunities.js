const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const emailService = require('../services/emailService');

/**
 * POST /api/opportunities/notify-application
 * Body: { opp: { id, title, org, postedBy, contactEmail }, note, match }
 * Emails the person who posted the opportunity that the signed-in student has applied.
 * The application itself is stored with the rest of the portfolio state (finals.__opps).
 */
router.post('/notify-application', requireAuth, async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can apply for opportunities.' });
    }
    const { opp, note, match } = req.body || {};
    if (!opp || !opp.title) {
      return res.status(400).json({ message: 'Opportunity details are required.' });
    }

    const sRes = await query(
      'SELECT id, name, email, programme, year, overall, skills FROM users WHERE id = $1 LIMIT 1',
      [studentId]
    );
    const student = sRes.rows[0];
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    let posterEmail = '';
    let posterName = '';
    if (opp.postedBy) {
      const pRes = await query('SELECT name, email FROM users WHERE id = $1 LIMIT 1', [opp.postedBy]);
      if (pRes.rows[0]) {
        posterEmail = pRes.rows[0].email;
        posterName = pRes.rows[0].name;
      }
    }
    const contact = String(opp.contactEmail || '').trim();
    const to = posterEmail || (/^\S+@\S+\.\S+$/.test(contact) ? contact : '');

    if (!to) {
      return res.json({ success: true, emailed: false, message: 'Application saved. No contact email on file for this opportunity.' });
    }

    try {
      await emailService.sendOpportunityApplicationNotification({
        to,
        posterName,
        opp,
        student,
        note: note ? String(note).slice(0, 1000) : '',
        match
      });
    } catch (mailErr) {
      console.error('Failed to send opportunity application email:', mailErr.message);
      return res.json({ success: true, emailed: false });
    }

    return res.json({ success: true, emailed: true, to });
  } catch (err) {
    console.error('Opportunity application notify error:', err);
    return res.status(500).json({ message: 'Could not notify the opportunity poster.' });
  }
});

module.exports = router;
