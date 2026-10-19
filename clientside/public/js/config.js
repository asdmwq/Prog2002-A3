/**
 * config.js
 * Single place that records the API base URL used by every page.
 *
 * Local development  -> the Express API runs on http://localhost:3000
 * Deployed on cPanel -> the API is reached through the same origin
 *                       (change PROD_API_ORIGIN below if the API is hosted
 *                        on a different subdomain).
 */
var API_BASE = (function () {
  var host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '') {
    return 'http://localhost:3000/api';
  }
  // Production: leave as '' for same-origin (e.g. https://my-domain/api),
  // or set to the full public API base URL, e.g. 'https://api.my-domain/api'.
  var PROD_API_ORIGIN = '';
  return PROD_API_ORIGIN + '/api';
})();
