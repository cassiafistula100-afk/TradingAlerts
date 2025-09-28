// server/index.js
// Express + Firebase Admin server for Render
// Replace your existing file completely with this one.

const express = require('express');
const admin = require('firebase-admin');

// ---------- App setup ----------
const app = express();
app.use(express.json());             // parse JSON bodies
app.disable('x-powered-by');

// (optional) simple CORS for testing from anywhere; you can tighten later
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ---------- Firebase Admin init ----------
(function initFirebase() {
  try {
    if (admin.apps.length) return;

    const jsonEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (!jsonEnv) {
      console.warn('[WARN] GOOGLE_APPLICATION_CREDENTIALS_JSON is not set. Firebase Admin will fail to send messages.');
    }

    admin.initializeApp({
      // Prefer JSON from env; if not present, this will throw on first use
      credential: jsonEnv
        ? admin.credential.cert(JSON.parse(jsonEnv))
        : admin.credential.applicationDefault(),
    });

    console.log('[OK] Firebase Admin initialized.');
  } catch (err) {
    console.error('[ERROR] Failed to initialize Firebase Admin:', err.message);
  }
})();

// ---------- Health / version endpoints ----------
app.get('/', (_req, res) => res.json({ ok: true }));
app.get('/version', (_req, res) => {
  // bump this number when you redeploy to confirm new code is live
  res.json({ version: '4', hasMode: true });
});

// ---------- Send notification handler ----------
const sendHandler = async (req, res) => {
  try {
    const body = req.body || {};

    const authToken = body['auth-token'];
    const requiredToken = process.env.AUTH_TOKEN || 'my-super-secret';
    if (authToken !== requiredToken) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const title = body.title;
    const message = body.message;
    const token = body.token;          // FCM device token (optional)
    const topic = body.topic || 'all'; // fallback topic

    if (!title || !message) {
      return res.status(400).json({ ok: false, error: 'title and message required' });
    }

    const notification = { title, body: message };
    const data = {
      title: String(title),
      message: String(message),
    };

    if (!admin.apps.length) {
      return res.status(500).json({ ok: false, error: 'Firebase not initialized' });
    }

    let responseId;

    if (token) {
      // send to a specific device
      responseId = await admin.messaging().send({
        token,
        notification,
        data,
      });
    } else {
      // send to a topic
      responseId = await admin.messaging().send({
        topic,
        notification,
        data,
      });
    }

    res.json({ ok: true, id: responseId });
  } catch (err) {
    console.error('[ERROR] /send failed:', err);
    res.status(500).json({ ok: false, error: err.message || 'internal error' });
  }
};

// Wire the same handler to multiple routes so any of these work
app.post('/send', sendHandler);
app.post('/notify', sendHandler);
app.post('/api/send', sendHandler);

// ---------- Optional: list routes at startup for debugging ----------
function listRoutes() {
  const routes = [];
  app._router.stack.forEach((m) => {
    if (m.route && m.route.path) {
      const methods = Object.keys(m.route.methods).map((k) => k.toUpperCase()).join(',');
      routes.push(`${methods.padEnd(6)} ${m.route.path}`);
    }
  });
  console.log('Routes:\n' + routes.map((r) => '  ' + r).join('\n'));
}

// ---------- Start server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  listRoutes();
});
