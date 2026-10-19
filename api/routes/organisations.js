/**
 * routes/organisations.js
 * Provides the organisation list used to populate the admin "New / Edit
 * event" form. Read-only.
 */
const express = require('express');
const router = express.Router();
const pool = require('../event_db');

router.get('/', async (req, res, next) => {
  try {
    const sql = `
      SELECT o.organisation_id, o.name, o.email, o.phone, o.city,
             (SELECT COUNT(*) FROM events e WHERE e.organisation_id = o.organisation_id) AS event_count
        FROM organisations o
       ORDER BY o.name
    `;
    const [rows] = await pool.execute(sql);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
