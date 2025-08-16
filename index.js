import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();
const TZ = "Asia/Bangkok";

function tsNow(){ return admin.firestore.Timestamp.now(); }
function minutesSince(ts){
  if(!ts) return 9999;
  const t = ts.toDate().getTime();
  return (Date.now() - t) / 60000;
}

// Every 2 minutes: send push for meds due now (max 5 repeats if not taken)
export const pushEveryTwoMinutes = functions.pubsub
  .schedule("every 2 minutes").timeZone(TZ)
  .onRun(async () => {
    const now = new Date().toLocaleTimeString("th-TH", { timeZone: TZ, hour12: false, hour: "2-digit", minute: "2-digit" });
    const dueMeds = await db.collectionGroup("medications").where("time","==",now).get();

    const updates = [];
    for (const snap of dueMeds.docs) {
      const data = snap.data();
      const medRef = snap.ref;
      const pathSegments = medRef.path.split("/"); // users/{username}/medications/{id}
      const username = pathSegments[1];
      if (data.takenToday) continue;
      const repeatCount = data.repeatCount || 0;
      const lastNotifyAt = data.lastNotifyAt || null;
      if (repeatCount >= 5) continue;
      if (minutesSince(lastNotifyAt) < 2) continue;

      // get tokens
      const tokensSnap = await db.collection("users").doc(username).collection("tokens").get();
      const tokens = tokensSnap.docs.map(d => d.id).filter(Boolean);
      if (tokens.length) {
        try{
          await admin.messaging().sendEachForMulticast({
            notification: {
              title: "ถึงเวลากินยาแล้ว",
              body: `${username} กรุณากินยา: ${data.name}`
            },
            tokens
          });
        }catch(e){ console.error("FCM send error", e); }
      }
      updates.push(medRef.update({
        repeatCount: admin.firestore.FieldValue.increment(1),
        lastNotifyAt: tsNow()
      }));
    }
    await Promise.all(updates);
    return null;
  });

// Daily 00:00 reset
export const dailyReset = functions.pubsub
  .schedule("0 0 * * *").timeZone(TZ)
  .onRun(async () => {
    const all = await db.collectionGroup("medications").get();
    const batch = db.batch();
    all.docs.forEach(d => batch.update(d.ref, { takenToday: false, repeatCount: 0 }));
    await batch.commit();
    return null;
  });
