const express = require("express");
const admin = require("firebase-admin");
const path = require("path");

const app = express();
app.use(express.json());

// 1) service account (keep this file secret!)
const KEY_PATH = path.join(__dirname, "serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(require(KEY_PATH)) });

// 2) simple shared secret – match this with TradingView alert JSON
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "my-super-secret";

// 3) main webhook
app.post("/webhook", async (req, res) => {
  try {
    if (req.body["auth-token"] !== WEBHOOK_SECRET) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    // choose where to deliver
    const sendToTopic = true; // set false if you want per-device tokens

    const title = req.body.title || "TradingView Alert";
    const body  = req.body.message || req.body.value || JSON.stringify(req.body);

    const message = {
      notification: { title, body },
      data: { value: body }
    };

    if (sendToTopic) {
      message.topic = "trading-alerts";
    } else {
      if (!req.body.token) return res.status(400).json({ ok:false, error:"missing token" });
      message.token = req.body.token;
    }

    const id = await admin.messaging().send(message);
    return res.json({ ok:true, id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok:false, error:e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook listening on http://localhost:${PORT}`));
