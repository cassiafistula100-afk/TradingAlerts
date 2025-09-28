// server/index.js
const express = require("express");
const admin = require("firebase-admin");

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const app = express();
app.use(express.json());

// Webhook endpoint
app.post("/webhook", async (req, res) => {
  try {
    if (req.body["auth-token"] !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const title = req.body.title || "TradingView Alert";
    const body =
      req.body.message || req.body.value || JSON.stringify(req.body);

    // Send to token if provided, else to topic
    const msg = req.body.token
      ? { token: req.body.token, notification: { title, body }, data: { value: body } }
      : { topic: "trading-alerts", notification: { title, body }, data: { value: body } };

    const id = await admin.messaging().send(msg);

    res.json({ ok: true, id, mode: req.body.token ? "token" : "topic" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Debug endpoint to confirm deployed version
app.get("/version", (req, res) => {
  res.json({ version: "3", hasMode: true });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
