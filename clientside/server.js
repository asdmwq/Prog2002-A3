/**
 * server.js (client application)
 * Serves the static HTML/CSS/JS website on port 8080.
 * Express is used only as a static file host - no templating, no EJS.
 */
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.static(PUBLIC_DIR));

// Any unknown path returns the custom 404 page.
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
});

app.listen(PORT, () => {
  console.log(`HeartBridge website running at http://localhost:${PORT}`);
});
