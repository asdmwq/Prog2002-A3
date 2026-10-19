/**
 * server.js
 * HeartBridge public website (Angular v22 + TypeScript production build).
 *
 * This tiny Express server serves the static browser bundle built by
 * `ng build` (see dist/clientside/browser) and falls back to index.html for
 * any client-side route so deep links such as /search or /event/1 work.
 *
 * The data API is a separate Node.js app (see the "api" project).
 *
 * Run:   npm install && npm run build && npm start
 * Port:  8080 by default (or process.env.PORT)
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const DIST = path.join(__dirname, 'dist', 'clientside', 'browser');

// Serve the compiled Angular app (JS/CSS/images).
app.use(express.static(DIST));

// API request that arrived here by mistake -> a clear hint.
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'This is the public website server. The data API runs in the separate "api" project.',
  });
});

// SPA fallback: every other path returns the app shell.
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log('============================================================');
  console.log('  HeartBridge public website (Angular v22) is running');
  console.log('  Open: http://localhost:' + PORT);
  console.log('  Data API: http://localhost:3000/api (run the "api" project)');
  console.log('============================================================');
});
