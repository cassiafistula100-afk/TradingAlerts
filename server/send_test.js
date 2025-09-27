// send_test.js
const admin = require("firebase-admin");
const path = require("path");

// path to your service account JSON (server/serviceAccountKey.json)
const keyPath = path.join(__dirname, "serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(require(keyPath))
});

// Replace with the token you copied from the app
const token = "dw2gc8D8RFK_Ar_pEQ1DJO:APA91bHo1Mpg9YhVngD_YUh1G0g8mAzrSyzLaUWxoj32Y5pYFJ3LrZ7agSUjQamJVKoMkAAJqnd8QLC79m9xPmZNCFeUGlnHNonG9j97d8OfkzhgyUjXSI4";

const message = {
  topic: "trading-alerts",
  notification: {
    title: "Topic Test",
    body: "Hello everyone on trading-alerts!"
  },
  data: { value: "TOPIC_PAYLOAD" }
};

admin.messaging().send(message)
  .then((resp) => {
    console.log("Sent message:", resp);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error sending message:", err);
    process.exit(1);
  });
