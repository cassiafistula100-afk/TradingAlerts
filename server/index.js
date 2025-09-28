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

app.post("/webhook", async (req, res) => {
  try {
    if (req.body["auth-token"] !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    const title = req.body.title || "TradingView Alert";
    const body =
      req.body.message || req.body.value || JSON.stringify(req.body);

    // If "token" field is given, send direct to device token
    // Otherwise, send to the topic "trading-alerts"
    const msg = req.body.token
      ? {
          token: req.body.token,
          notification: { title, body },
          data: { value: body },
        }
      : {
          topic: "trading-alerts",
          notification: { title, body },
          data: { value: body },
        };

    const id = await admin.messaging().send(msg);

    res.json({
      ok: true,
      id,
      mode: req.body.token ? "token" : "topic", // ✅ debug info
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Render will run this automatically
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
