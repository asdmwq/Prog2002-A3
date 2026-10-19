/**
 * server.js
 * Express RESTful API for the HeartBridge charity events website.
 *
 * Assessment 2 exposed read-only GET endpoints.
 * Assessment 3 adds the full CRUD cycle (POST/PUT/DELETE) for events,
 * a registration POST endpoint, and serves both the public website
 * (port 8080) and the admin website (port 8090).
 */
const express = require('express');
const cors = require('cors');
const pool = require('./event_db');

const eventsRouter = require('./routes/events');
const categoriesRouter = require('./routes/categories');
const organisationsRouter = require('./routes/organisations');

const app = express();
const PORT = process.env.PORT || 3000;

// Only the two first-party sites may call the API. Extra origins can be
// supplied through ALLOWED_ORIGINS when the apps are deployed to cPanel.
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:8080,http://localhost:8090,http://127.0.0.1:8080,http://127.0.0.1:8090'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // Same-origin / server-to-server requests have no Origin header.
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('CORS: origin not allowed'));
    }
  })
);
app.use(express.json());

// Simple request logger.
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.originalUrl}`);
  next();
});

// ---------------------------------------------------------------- health
// Verifies the API process is up AND that it can reach the database.
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// ---------------------------------------------------------------- routes
app.use('/api/events', eventsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/organisations', organisationsRouter);

// Root: service description.
app.get('/api', (req, res) => {
  res.json({
    message: 'HeartBridge Charity Events API is running (A3).',
    endpoints: [
      'GET    /api/health',
      'GET    /api/categories',
      'GET    /api/organisations',
      'GET    /api/events',
      'GET    /api/events/search',
      'GET    /api/events/all',
      'GET    /api/events/:id',
      'GET    /api/events/admin/:id',
      'POST   /api/events',
      'PUT    /api/events/:id',
      'DELETE /api/events/:id',
      'POST   /api/events/:id/registrations'
    ]
  });
});

// ---------------------------------------------------------------- 404
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// Central error handler - never leak SQL/internal details to the client.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'A server error occurred. Please try again later.' });
});

app.listen(PORT, () => {
  console.log(`HeartBridge Events API listening on http://localhost:${PORT}`);
});
