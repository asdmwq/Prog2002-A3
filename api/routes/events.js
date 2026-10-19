/**
 * routes/events.js
 * Assessment 3 event + registration endpoints.
 *
 * Public read endpoints (active, non-suspended events only):
 *   GET    /api/events                      - active upcoming events (?category_id=)
 *   GET    /api/events/search               - filtered active events
 *   GET    /api/events/:id                  - one active event + its registrations
 *   POST   /api/events/:id/registrations    - register a web user for an event
 *
 * Admin endpoints (any status, full CRUD):
 *   GET    /api/events/all                  - every event with registration counts
 *   GET    /api/events/admin/:id            - one event (any status) + registrations
 *   POST   /api/events                      - create a new event
 *   PUT    /api/events/:id                  - update an event
 *   DELETE /api/events/:id                  - delete (blocked if it has registrations)
 *
 * Static paths (/search, /all) are declared before the parameterised /:id.
 */
const express = require('express');
const router = express.Router();
const pool = require('../event_db');

// Columns shared by the public event queries.
const EVENT_SELECT = `
  SELECT e.event_id, e.event_name, e.event_description, e.purpose,
         DATE_FORMAT(e.event_date, '%Y-%m-%d') AS event_date,
         DATE_FORMAT(e.start_time, '%H:%i')    AS start_time,
         DATE_FORMAT(e.end_time,   '%H:%i')    AS end_time,
         e.location, e.city,
         e.ticket_price, e.goal_amount, e.current_amount, e.image_url,
         e.latitude, e.longitude, e.is_suspended,
         e.category_id, c.category_name,
         e.organisation_id, o.name AS organisation_name,
         CASE WHEN e.is_suspended = 1 THEN 'Suspended'
              WHEN e.event_date < CURDATE() THEN 'Past'
              ELSE 'Upcoming' END AS event_status,
         ROUND(e.current_amount / NULLIF(e.goal_amount, 0) * 100, 1) AS progress_percent
  FROM events e
  JOIN categories c     ON c.category_id = e.category_id
  JOIN organisations o  ON o.organisation_id = e.organisation_id
`;

// Only active, non-suspended events are visible to the public.
const ACTIVE_WHERE = ` WHERE e.is_suspended = 0 AND e.event_date >= CURDATE() `;

// Registration summary columns (LEFT JOIN, safe for events without regs).
const REG_COUNTS = `
  LEFT JOIN (
    SELECT event_id,
           COUNT(*) AS registration_count,
           COALESCE(SUM(ticket_count), 0) AS total_tickets
      FROM registrations
     GROUP BY event_id
  ) rc ON rc.event_id = e.event_id
`;

// ---------------------------------------------------------------- helpers
function isPositiveInt(value) {
  return Number.isInteger(value) && value >= 1;
}
function isPositiveIntString(value) {
  return /^\d+$/.test(String(value)) && Number(value) >= 1;
}
function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
function isValidTimeString(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value));
}
function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
}
function isNonNegativeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
function trimOrNull(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

/** Load the registrations belonging to one event, latest purchase first. */
async function loadRegistrations(eventId) {
  const sql = `
    SELECT registration_id, event_id, first_name, last_name, email, phone,
           ticket_count, total_amount,
           DATE_FORMAT(registered_at, '%Y-%m-%d %H:%i') AS registered_at
      FROM registrations
     WHERE event_id = ?
     ORDER BY registered_at DESC, registration_id DESC
  `;
  const [rows] = await pool.execute(sql, [eventId]);
  return rows;
}

/** Attach a registrations array and summary counts to an event object. */
function attachRegistrations(event, registrations) {
  event.registrations = registrations;
  event.registration_count = registrations.length;
  event.total_tickets = registrations.reduce(
    (sum, r) => sum + Number(r.ticket_count || 0),
    0
  );
  return event;
}

// Validate the common set of fields used by both POST and PUT.
// Create (partial = false) enforces required fields; update (partial = true)
// only validates the fields that are actually supplied, so partial updates
// are accepted. Returns { errors, values }.
function validateEventBody(body, partial = false) {
  const errors = [];
  const v = {};

  function text(field, label, max, required, min) {
    const val = body[field];
    if (val === undefined || val === null || String(val).trim() === '') {
      if (required && !partial) errors.push(`${label} is required.`);
      return;
    }
    const s = String(val).trim();
    if (min && s.length < min) errors.push(`${label} must be at least ${min} characters.`);
    if (s.length > max) errors.push(`${label} must be ${max} characters or fewer.`);
    v[field] = s;
  }

  text('event_name', 'Event name', 200, true, 2);
  text('event_description', 'Event description', 2000, true, 10);
  text('purpose', 'Purpose', 2000, true, 10);
  text('location', 'Location', 200, true, 2);
  text('city', 'City', 80, false);
  text('image_url', 'Image URL', 500, false);

  if (body.event_date !== undefined && body.event_date !== '') {
    if (!isValidDateString(body.event_date)) errors.push('event_date must be a valid date (YYYY-MM-DD).');
    v.event_date = body.event_date;
  }
  if (body.start_time !== undefined && body.start_time !== '') {
    if (!isValidTimeString(body.start_time)) errors.push('start_time must be a valid time (HH:MM).');
    v.start_time = body.start_time;
  }
  if (body.end_time !== undefined && body.end_time !== '') {
    if (!isValidTimeString(body.end_time)) errors.push('end_time must be a valid time (HH:MM).');
    v.end_time = body.end_time;
  }
  if (v.start_time && v.end_time && v.end_time <= v.start_time) {
    errors.push('end_time must be later than start_time.');
  }

  if (body.category_id !== undefined && body.category_id !== '') {
    if (!isPositiveInt(Number(body.category_id))) errors.push('category_id must be a positive whole number.');
    v.category_id = Number(body.category_id);
  }
  if (body.organisation_id !== undefined && body.organisation_id !== '') {
    if (!isPositiveInt(Number(body.organisation_id))) errors.push('organisation_id must be a positive whole number.');
    v.organisation_id = Number(body.organisation_id);
  }

  ['ticket_price', 'goal_amount', 'current_amount'].forEach((f) => {
    if (body[f] !== undefined && body[f] !== '') {
      const n = Number(body[f]);
      if (!isNonNegativeNumber(n)) errors.push(`${f} must be a non-negative number.`);
      else v[f] = n;
    }
  });

  if (body.latitude !== undefined && body.latitude !== '') {
    const n = Number(body.latitude);
    if (Number.isFinite(n) && n >= -90 && n <= 90) v.latitude = n;
    else errors.push('latitude must be between -90 and 90.');
  }
  if (body.longitude !== undefined && body.longitude !== '') {
    const n = Number(body.longitude);
    if (Number.isFinite(n) && n >= -180 && n <= 180) v.longitude = n;
    else errors.push('longitude must be between -180 and 180.');
  }

  if (body.is_suspended !== undefined && body.is_suspended !== '') {
    const n = Number(body.is_suspended);
    if (n === 0 || n === 1) v.is_suspended = n;
    else errors.push('is_suspended must be 0 or 1.');
  }

  return { errors, values: v };
}

// Fields that an admin is allowed to insert/update (whitelist).
const WRITABLE_FIELDS = [
  'event_name', 'event_description', 'purpose', 'event_date', 'start_time',
  'end_time', 'location', 'city', 'ticket_price', 'goal_amount',
  'current_amount', 'image_url', 'latitude', 'longitude', 'is_suspended',
  'category_id', 'organisation_id'
];

// =========================================================== GET / (active)
router.get('/', async (req, res, next) => {
  try {
    let sql = EVENT_SELECT + ACTIVE_WHERE;
    const params = [];
    if (req.query.category_id !== undefined) {
      if (!isPositiveIntString(req.query.category_id)) {
        return res.status(400).json({ error: 'category_id must be a positive whole number.' });
      }
      sql += ' AND e.category_id = ? ';
      params.push(Number(req.query.category_id));
    }
    sql += ' ORDER BY e.event_date, e.start_time ';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// =========================================================== GET /search
router.get('/search', async (req, res, next) => {
  try {
    const { date, location, category_id } = req.query;
    let sql = EVENT_SELECT + ACTIVE_WHERE;
    const params = [];

    if (date !== undefined && date !== '') {
      if (!isValidDateString(date)) {
        return res.status(400).json({ error: 'date must be a valid date in YYYY-MM-DD format.' });
      }
      sql += ' AND e.event_date >= ? ';
      params.push(date);
    }
    if (location !== undefined && location.trim() !== '') {
      const term = location.trim();
      if (term.length > 100) {
        return res.status(400).json({ error: 'location must be 100 characters or fewer.' });
      }
      sql += ' AND (e.location LIKE ? OR e.city LIKE ?) ';
      params.push(`%${term}%`, `%${term}%`);
    }
    if (category_id !== undefined && category_id !== '') {
      if (!isPositiveIntString(category_id)) {
        return res.status(400).json({ error: 'category_id must be a positive whole number.' });
      }
      sql += ' AND e.category_id = ? ';
      params.push(Number(category_id));
    }
    sql += ' ORDER BY e.event_date, e.start_time ';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// =========================================================== GET /all (admin)
router.get('/all', async (req, res, next) => {
  try {
    const sql =
      EVENT_SELECT.replace(
        'ROUND(e.current_amount / NULLIF(e.goal_amount, 0) * 100, 1) AS progress_percent',
        'ROUND(e.current_amount / NULLIF(e.goal_amount, 0) * 100, 1) AS progress_percent,\n         COALESCE(rc.registration_count, 0) AS registration_count, COALESCE(rc.total_tickets, 0) AS total_tickets'
      ) +
      REG_COUNTS +
      ' ORDER BY e.event_date, e.start_time ';
    const [rows] = await pool.execute(sql);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// =========================================================== POST / (create)
router.post('/', async (req, res, next) => {
  try {
    const { errors, values } = validateEventBody(req.body);

    // Required fields for a brand-new event.
    ['event_name', 'event_description', 'purpose', 'event_date', 'start_time',
     'end_time', 'location', 'category_id', 'organisation_id', 'goal_amount']
      .forEach((f) => {
        if (values[f] === undefined) errors.push(`${f} is required.`);
      });

    if (errors.length) return res.status(400).json({ error: errors.join(' ') });

    // Confirm the foreign keys point to real rows (friendlier than an FK error).
    const [[cat]] = await pool.execute('SELECT category_id FROM categories WHERE category_id = ?', [values.category_id]);
    const [[org]] = await pool.execute('SELECT organisation_id FROM organisations WHERE organisation_id = ?', [values.organisation_id]);
    if (!cat) return res.status(400).json({ error: 'The chosen category does not exist.' });
    if (!org) return res.status(400).json({ error: 'The chosen organisation does not exist.' });

    const columns = WRITABLE_FIELDS.filter((f) => values[f] !== undefined);
    const sql = `INSERT INTO events (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
    const params = columns.map((c) => (c === 'image_url' ? trimOrNull(values[c]) : values[c]));
    const [result] = await pool.execute(sql, params);

    // Return the newly created event.
    const [rows] = await pool.execute(
      EVENT_SELECT + ' WHERE e.event_id = ? LIMIT 1',
      [result.insertId]
    );
    res.status(201).json({ message: 'Event created.', event: rows[0] });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Invalid category or organisation reference.' });
    }
    next(err);
  }
});

// =========================================================== GET /:id (public + registrations)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isPositiveIntString(id)) {
      return res.status(400).json({ error: 'Event id must be a positive whole number.' });
    }
    const [rows] = await pool.execute(
      EVENT_SELECT + ACTIVE_WHERE + ' AND e.event_id = ? LIMIT 1 ',
      [Number(id)]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    const registrations = await loadRegistrations(Number(id));
    res.json(attachRegistrations(rows[0], registrations));
  } catch (err) {
    next(err);
  }
});

// =========================================================== GET /admin/:id (any status + regs)
router.get('/admin/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isPositiveIntString(id)) {
      return res.status(400).json({ error: 'Event id must be a positive whole number.' });
    }
    const [rows] = await pool.execute(
      EVENT_SELECT + ' WHERE e.event_id = ? LIMIT 1 ',
      [Number(id)]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    const registrations = await loadRegistrations(Number(id));
    res.json(attachRegistrations(rows[0], registrations));
  } catch (err) {
    next(err);
  }
});

// =========================================================== POST /:id/registrations
router.post('/:id/registrations', async (req, res, next) => {
  let eventId;
  try {
    const { id } = req.params;
    if (!isPositiveIntString(id)) {
      return res.status(400).json({ error: 'Event id must be a positive whole number.' });
    }
    eventId = Number(id);

    // The event must exist and still be open for registration (active & future).
    const [eventRows] = await pool.execute(
      `SELECT event_id, event_name, ticket_price, is_suspended, event_date
         FROM events WHERE event_id = ?`,
      [eventId]
    );
    if (eventRows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    const event = eventRows[0];
    if (Number(event.is_suspended) === 1) {
      return res.status(400).json({ error: 'This event is suspended and cannot accept registrations.' });
    }
    const today = new Date().toISOString().slice(0, 10);
    if (event.event_date < today) {
      return res.status(400).json({ error: 'This event has already taken place and cannot be registered for.' });
    }

    const body = req.body || {};
    const errors = [];
    const first = trimOrNull(body.first_name);
    const last = trimOrNull(body.last_name);
    const email = trimOrNull(body.email);
    const phone = trimOrNull(body.phone);
    let tickets = body.ticket_count;

    if (!first || first.length < 2 || first.length > 80) errors.push('First name (2-80 characters) is required.');
    if (!last || last.length < 2 || last.length > 80) errors.push('Last name (2-80 characters) is required.');
    if (!email || !isEmail(email) || email.length > 150) errors.push('A valid contact email is required.');
    if (phone && phone.length > 30) errors.push('Phone number must be 30 characters or fewer.');
    tickets = Number(tickets);
    if (!Number.isInteger(tickets) || tickets < 1 || tickets > 20) {
      errors.push('Number of tickets must be a whole number between 1 and 20.');
    }
    if (errors.length) return res.status(400).json({ error: errors.join(' ') });

    // Enforce one registration per (event, email).
    const [dup] = await pool.execute(
      'SELECT registration_id FROM registrations WHERE event_id = ? AND email = ? LIMIT 1',
      [eventId, email.toLowerCase()]
    );
    if (dup.length) {
      return res.status(409).json({ error: 'This email has already registered for this event.' });
    }

    // Money is always computed on the server, never trusted from the client.
    const total = Number((Number(event.ticket_price) * tickets).toFixed(2));

    const sql = `
      INSERT INTO registrations
        (event_id, first_name, last_name, email, phone, ticket_count, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [
      eventId, first, last, email.toLowerCase(), phone, tickets, total
    ]);

    const [regRows] = await pool.execute(
      `SELECT registration_id, event_id, first_name, last_name, email, phone,
              ticket_count, total_amount,
              DATE_FORMAT(registered_at, '%Y-%m-%d %H:%i') AS registered_at
         FROM registrations WHERE registration_id = ?`,
      [result.insertId]
    );
    return res.status(201).json({
      message: `Registration confirmed for ${event.event_name}.`,
      registration: regRows[0]
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'This email has already registered for this event.' });
    }
    next(err);
  }
});

// =========================================================== PUT /:id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isPositiveIntString(id)) {
      return res.status(400).json({ error: 'Event id must be a positive whole number.' });
    }
    const eventId = Number(id);
    const [existing] = await pool.execute('SELECT event_id FROM events WHERE event_id = ?', [eventId]);
    if (!existing.length) return res.status(404).json({ error: 'Event not found.' });

    const { errors, values } = validateEventBody(req.body, true);
    if (errors.length) return res.status(400).json({ error: errors.join(' ') });

    if (values.category_id !== undefined) {
      const [[cat]] = await pool.execute('SELECT category_id FROM categories WHERE category_id = ?', [values.category_id]);
      if (!cat) return res.status(400).json({ error: 'The chosen category does not exist.' });
    }
    if (values.organisation_id !== undefined) {
      const [[org]] = await pool.execute('SELECT organisation_id FROM organisations WHERE organisation_id = ?', [values.organisation_id]);
      if (!org) return res.status(400).json({ error: 'The chosen organisation does not exist.' });
    }

    const columns = WRITABLE_FIELDS.filter((f) => values[f] !== undefined);
    if (columns.length === 0) {
      return res.status(400).json({ error: 'No valid fields were provided to update.' });
    }
    const setSql = columns.map((c) => `${c} = ?`).join(', ');
    const params = columns.map((c) => (c === 'image_url' ? trimOrNull(values[c]) : values[c]));
    params.push(eventId);
    await pool.execute(`UPDATE events SET ${setSql} WHERE event_id = ?`, params);

    const [rows] = await pool.execute(
      EVENT_SELECT + ' WHERE e.event_id = ? LIMIT 1 ',
      [eventId]
    );
    res.json({ message: 'Event updated.', event: rows[0] });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Invalid category or organisation reference.' });
    }
    next(err);
  }
});

// =========================================================== DELETE /:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isPositiveIntString(id)) {
      return res.status(400).json({ error: 'Event id must be a positive whole number.' });
    }
    const eventId = Number(id);
    const [existing] = await pool.execute('SELECT event_name FROM events WHERE event_id = ?', [eventId]);
    if (!existing.length) return res.status(404).json({ error: 'Event not found.' });

    // Data integrity: an event with registrations cannot be deleted.
    const [countRows] = await pool.execute(
      'SELECT COUNT(*) AS cnt, COALESCE(SUM(ticket_count),0) AS tickets FROM registrations WHERE event_id = ?',
      [eventId]
    );
    const regCount = Number(countRows[0].cnt);
    if (regCount > 0) {
      return res.status(409).json({
        error: `This event cannot be deleted because it already has ${regCount} registration(s). Remove the registrations first.`,
        registration_count: regCount,
        total_tickets: Number(countRows[0].tickets)
      });
    }

    await pool.execute('DELETE FROM events WHERE event_id = ?', [eventId]);
    res.json({ message: `Event "${existing[0].event_name}" was deleted.`, event_id: eventId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
