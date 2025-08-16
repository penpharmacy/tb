# TBPPH – TB Medication Reminder (Web + FCM + Cloud Functions)

Includes:
- Client (`index.html`, `style.css`, `app.js`)
- Service worker (`firebase-messaging-sw.js`)
- Firebase Functions (`functions/index.js`) – scheduled push every 2 minutes; daily reset at 00:00 Asia/Bangkok

## Required setup
1. In `app.js`, replace `VAPID_KEY` with your Web Push **Public VAPID key** (Firebase Console → Project Settings → Cloud Messaging → Web configuration).
2. Host files over **HTTPS** (Firebase Hosting or GitHub Pages). Place `firebase-messaging-sw.js` at the **root** next to `index.html`.
3. Cloud Scheduler-backed functions require Blaze plan.

## Firestore layout
```
users/{username}
  tokens/{token}                # docID = token
  medications/{medId}          # name, time(HH:MM), takenToday(bool), repeatCount(number), lastNotifyAt(timestamp), createdAt
  history/{autoId}             # name, time, takenAt(timestamp)
```

## Behavior
- **Every day (24h)**: `dailyReset` sets `takenToday=false` and `repeatCount=0` for all meds.
- **If not taken**: push repeat every **2 minutes** up to **5 times** (both server via FCM and client when tab is open).
- Press **"กินแล้ว"**: stops repeats and logs to history.

## Deploy Functions
```bash
firebase login
firebase init functions   # choose Node 20; this creates firebase.json etc.
# Replace functions/ with files from this package
cd functions
npm install
cd ..
firebase deploy --only functions
```

## Run client
- Upload the web files to hosting.
- Open the site (HTTPS), allow notifications. The FCM token will be saved under `users/{username}/tokens/{token}` automatically.
