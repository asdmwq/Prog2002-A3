/**
 * server.js
 * HeartBridge Admin Dashboard (Angular v22 + TypeScript production build).
 *
 * Serves the static browser bundle built by `ng build`
 * (see dist/adminside/browser) and falls back to index.html.
 *
 * The data API is a separate Node.js app (see the "api" project).
 *
 * Run:   npm install && npm run build && npm start
 * Port:  8090 by default (or process.env.PORT)
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8090;
const DIST = path.join(__dirname, 'dist', 'adminside', 'browser');

app.use(express.static(DIST));

app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'This is the admin dashboard server. The data API runs in the separate "api" project.',
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log('============================================================');
  console.log('  HeartBridge admin dashboard (Angular v22) is running');
  console.log('  Open: http://localhost:' + PORT);
  console.log('  Data API: http://localhost:3000/api (run the "api" project)');
  console.log('============================================================');
});
