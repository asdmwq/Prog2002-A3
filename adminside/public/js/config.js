/**
 * config.js (admin)
 * Base URL of the HeartBridge REST API.
 */
var API_BASE = (function () {
  var host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '') {
    return 'http://localhost:3000/api';
  }
  // Production: set to the deployed API base URL if not same-origin.
  var PROD_API_ORIGIN = '';
  return PROD_API_ORIGIN + '/api';
})();
