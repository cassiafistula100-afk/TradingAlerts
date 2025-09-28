import express from "express";
import admin from "firebase-admin";

// load Firebase credentials from env var
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(express.json());

app.post("/webhook", (req, res) => {
  const authToken = req.body["auth-token"];
  if (authToken !== process.env.WEBHOOK_SECRET) {
    return res.status(401).send({ ok: false, error: "Unauthorized" });
  }

  const title = req.body.title || "Trading Alert";
  const message = req.body.message || "";

  admin.messaging().send({
    topic: "all",
    notification: { title, body: message },
    data: req.body
  })
  .then((response) => {
    res.send({ ok: true, id: response });
  })
  .catch((err) => {
    console.error("FCM send error", err);
    res.status(500).send({ ok: false, error: err.message });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook listening on port ${PORT}`);
});
