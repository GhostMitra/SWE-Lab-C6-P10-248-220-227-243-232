/**
 * Database Model Proxy
 * Re-routes all entity queries to Pure Firebase Cloud Firestore (NoSQL Document Store).
 * SQL has been completely decommissioned per architecture mandate.
 */

module.exports = require('./firestore-models');
