/**
 * routes/categories.js
 * GET /api/categories - all categories plus a count of their active events,
 * used to populate the search-page dropdown and the home-page filter.
 */
const express = require('express');
const router = express.Router();
const pool = require('../event_db');

router.get('/', async (req, res, next) => {
  try {
    const sql = `
      SELECT c.category_id, c.category_name, c.description,
             (SELECT COUNT(*)
                FROM events e
               WHERE e.category_id = c.category_id
                 AND e.is_suspended = 0
                 AND e.event_date >= CURDATE()) AS active_event_count
        FROM categories c
       ORDER BY c.category_name
    `;
    const [rows] = await pool.execute(sql);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
