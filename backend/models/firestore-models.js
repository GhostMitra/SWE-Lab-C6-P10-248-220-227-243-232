/**
 * Firebase Cloud Firestore - NoSQL Document Storage Layer
 * Replaces MongoDB with native Firebase Firestore NoSQL collections:
 * - application_drafts: Document per applicant (userId) for form auto-save
 * - audit_logs: Unstructured document events for real-time telemetry
 * - notification_queue: Asynchronous dispatch buffer
 * 
 * Synchronizes with live Cloud Firestore when configured, and provides
 * a persistent local Firestore emulator store (firestore_store.json) for zero-setup execution.
 */

const fs = require('fs');
const path = require('path');
const { getFirestore } = require('../config/firebase');

const LOCAL_STORE_PATH = path.join(__dirname, '..', 'database', 'firestore_store.json');

// Local in-memory & file-backed store for offline / dev emulator mode
let localCollections = {
  application_drafts: {},
  audit_logs: [],
  notification_queue: []
};

try {
  if (fs.existsSync(LOCAL_STORE_PATH)) {
    const raw = fs.readFileSync(LOCAL_STORE_PATH, 'utf8');
    localCollections = JSON.parse(raw);
    console.log('[Firebase Firestore] Loaded local Firestore collections store.');
  }
} catch (e) {
  console.warn('[Firebase Firestore] Initialized fresh local Firestore collections store.');
}

function persistLocal() {
  try {
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(localCollections, null, 2), 'utf8');
  } catch (e) {
    console.error('[Firebase Firestore] Failed to persist local collection:', e.message);
  }
}

// 1. Application Drafts Model (Cloud Firestore Collection: "application_drafts")
const FirestoreDraftModel = {
  async saveDraft(userId, data) {
    const draft = {
      userId: Number(userId),
      ...data,
      updatedAt: new Date().toISOString()
    };

    // 1. Update local Firestore store
    localCollections.application_drafts[String(userId)] = draft;
    persistLocal();

    // 2. Sync to live Cloud Firestore if SDK connected
    const firestore = getFirestore();
    if (firestore) {
      try {
        await firestore.collection('application_drafts').doc(String(userId)).set(draft, { merge: true });
        console.log(`[Firebase Firestore] Synced draft doc: application_drafts/${userId}`);
      } catch (err) {
        console.warn('[Firebase Firestore] Cloud sync notice:', err.message);
      }
    }

    return draft;
  },

  async getDraft(userId) {
    const firestore = getFirestore();
    if (firestore) {
      try {
        const snap = await firestore.collection('application_drafts').doc(String(userId)).get();
        if (snap.exists) {
          return snap.data();
        }
      } catch (err) {}
    }
    return localCollections.application_drafts[String(userId)] || null;
  },

  async deleteDraft(userId) {
    delete localCollections.application_drafts[String(userId)];
    persistLocal();

    const firestore = getFirestore();
    if (firestore) {
      try {
        await firestore.collection('application_drafts').doc(String(userId)).delete();
      } catch (err) {}
    }
    return true;
  }
};

// 2. Audit Logs Model (Cloud Firestore Collection: "audit_logs")
const FirestoreAuditModel = {
  async log(entry) {
    const logDoc = {
      id: 'FS-AUD-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      ...entry
    };

    localCollections.audit_logs.unshift(logDoc);
    if (localCollections.audit_logs.length > 500) {
      localCollections.audit_logs.pop();
    }
    persistLocal();

    const firestore = getFirestore();
    if (firestore) {
      try {
        await firestore.collection('audit_logs').add(logDoc);
      } catch (err) {}
    }

    return logDoc;
  },

  async getRecent(limit = 50) {
    const firestore = getFirestore();
    if (firestore) {
      try {
        const snap = await firestore.collection('audit_logs').orderBy('timestamp', 'desc').limit(limit).get();
        if (!snap.empty) {
          return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (err) {}
    }
    return localCollections.audit_logs.slice(0, limit);
  }
};

// 3. Notification Queue Model (Cloud Firestore Collection: "notification_queue")
const FirestoreQueueModel = {
  async enqueue(notification) {
    const item = {
      queueId: 'FS-QUEUE-' + Date.now(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      ...notification
    };

    localCollections.notification_queue.push(item);
    persistLocal();

    const firestore = getFirestore();
    if (firestore) {
      try {
        await firestore.collection('notification_queue').add(item);
      } catch (err) {}
    }

    return item;
  },

  async getAll() {
    return localCollections.notification_queue;
  }
};

module.exports = {
  FirestoreDraftModel,
  FirestoreAuditModel,
  FirestoreQueueModel
};
