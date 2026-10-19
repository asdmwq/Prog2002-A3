/**
 * server.js (admin application)
 * Serves the static admin dashboard (HTML/CSS/JS) on port 8090.
 * Express is only a static file host - the dashboard talks to the REST API
 * directly from the browser. No templating engine is used.
 */
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8090;
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.static(PUBLIC_DIR));

app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`HeartBridge admin dashboard running at http://localhost:${PORT}`);
});
