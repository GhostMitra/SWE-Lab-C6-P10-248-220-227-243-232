/**
 * IEM ADMISSION PORTAL — FIREBASE CLOUD FUNCTIONS ENTRYPOINT
 * Deploys the entire Express REST backend into Firebase Serverless Cloud Functions (v2).
 */

const { onRequest } = require('firebase-functions/v2/https');
const { app, startServer } = require('./server');

/**
 * Firebase Cloud Functions v2 (Production Serverless Function)
 * Handles all /api/* requests routed through Firebase Hosting rewrites
 */
exports.api = onRequest({
  cors: true,
  maxInstances: 10,
  memory: '512MiB',
  timeoutSeconds: 60,
  region: 'us-central1'
}, app);

// Export app and server for local runtime & testing
exports.app = app;
exports.startServer = startServer;

// If executed directly (e.g. node backend/index.js), run standalone server
if (require.main === module) {
  startServer();
}
