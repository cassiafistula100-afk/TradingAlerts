# TradingAlerts

Complete Android app (Kotlin) + Node.js webhook relay for TradingView alerts.

## What this repo contains
- `app/` — Android app source (Kotlin). Receives FCM notifications and shows alerts.
- `server/` — Small Node.js webhook relay that verifies an `auth-token` and forwards alerts to Firebase Cloud Messaging (topic: `trading-alerts`).
- `.github/workflows/android-build.yml` — GitHub Actions workflow to build and upload APKs.

## Before you build
1. **Firebase setup (console):**
   - Create a Firebase project.
   - Add an Android app with package `com.example.tradingalerts`.
   - Download `google-services.json` and place it at `app/google-services.json`.
   - In Firebase → Project Settings → Service accounts → Generate new private key. Download and place as `server/serviceAccountKey.json` (do not commit to public repo).

2. **Android Studio:**
   - Open the root directory in Android Studio.
   - Sync Gradle. Install any missing SDK components.

3. **Optional: subscribe to topic**
   - The app subscribes to `trading-alerts` topic automatically if you enable it in code.

## Running locally
### Run server
```bash
cd server
npm install
# Place serviceAccountKey.json in server/
node index.js
```
Server listens on port 3000 by default. Expose via ngrok or host on a public server (HTTPS recommended).

### Run Android app
- Plug in device (enable USB debugging) or use emulator.
- Build & run from Android Studio.
- Copy/paste the FCM token (or subscribe to topic) to ensure you can receive messages.

## TradingView alerts
- In TradingView Create Alert dialog, set **Webhook URL** to `https://<your-server-host>/webhook`.
- The Pine script already emits JSON identical to the messages in the original script (contains `auth-token`). The relay verifies this token.

## CI: GitHub Actions
- Push to GitHub and the workflow will build the project and upload APKs as artifacts.
- To create a signed release via CI, add the keystore as a base64 secret and extend `signingConfigs` in `app/build.gradle` (instructions below).

## Security notes
- Do NOT commit `serviceAccountKey.json` or `google-services.json` to a public repo.
- Keep your exchange API keys on a secure server — do not place keys in the mobile app.

## Helpful commands
- Build release locally:
  ```bash
  ./gradlew assembleRelease
  ```

## Support
If you want, I can add: Docker Compose ready hosting, or the Delta Exchange order-sending module on the server (you must provide API key/permissions). 
