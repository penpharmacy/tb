import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, doc, addDoc, getDocs, setDoc, onSnapshot, serverTimestamp, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyBcINCCqaoBBbV4egcbQ2W422ttwFl-dhE",
  authDomain: "tbmedicationreminder.firebaseapp.com",
  projectId: "tbmedicationreminder",
  storageBucket: "tbmedicationreminder.firebasestorage.app",
  messagingSenderId: "658947281549",
  appId: "1:658947281549:web:cb41c127f8b3174e83c8c4",
  measurementId: "G-Z27P0C9192"
};

const VAPID_KEY = "PASTE_YOUR_PUBLIC_VAPID_KEY_HERE";

// PWA: register service worker (FCM SW is sufficient for installability)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .catch(console.warn);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Username memory
const inputUser = document.getElementById('username');
window.addEventListener('DOMContentLoaded', async () => {
  const saved = localStorage.getItem('username') || '';
  if(saved) inputUser.value = saved;
  await initMessagingToken();
  subscribeMedications();
  loadHistory();
});
inputUser.addEventListener('change', async (e)=>{
  const name = e.target.value.trim();
  localStorage.setItem('username', name);
  await initMessagingToken();
  subscribeMedications();
  loadHistory();
});

async function initMessagingToken(){
  const name = (inputUser.value || '').trim();
  if(!name) return;
  try{
    if(!(await isSupported())) return;
    if(Notification.permission !== "granted") await Notification.requestPermission();
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if(token){
      await setDoc(doc(db, "users", name, "tokens", token), {
        token, createdAt: serverTimestamp(), platform: navigator.userAgent
      });
      onMessage(messaging, (payload)=>{
        try{
          new Notification(payload.notification?.title || "แจ้งเตือน", {
            body: payload.notification?.body || "",
            icon: payload.notification?.icon || "/icons/icon-192.png"
          });
        }catch(e){ console.warn(e); }
      });
    }
  }catch(err){ console.error(err); }
}

// CRUD Medications + UI (กินแล้ว / แก้ไข / ลบ)
let unsubscribeMeds = null;
function subscribeMedications(){
  const name = (inputUser.value || '').trim();
  const medList = document.getElementById('medList');
  if(unsubscribeMeds){ unsubscribeMeds(); unsubscribeMeds = null; }
  if(!name){ medList.innerHTML = ""; return; }

  const medsRef = collection(db, "users", name, "medications");
  unsubscribeMeds = onSnapshot(medsRef, (snap)=>{
    medList.innerHTML = "";
    const meds = [];
    snap.forEach(d => meds.push({ id: d.id, ...d.data() }));
    meds.sort((a,b)=> (a.time||"").localeCompare(b.time||""));
    meds.forEach(med => {
      const li = document.createElement('li');
      li.innerHTML = `<div class="left">
          <div><strong>${med.name}</strong> <span class="badge">${med.time || ""}</span></div>
          <div class="small">สถานะ: ${med.takenToday ? "✅ กินแล้ว" : "⏰ รอเตือน"} • แจ้งซ้ำ: ${med.repeatCount || 0}/5</div>
        </div>`;

      const btns = document.createElement('div');
      btns.className = 'btns';

      const btnTaken = document.createElement('button');
      btnTaken.textContent = "กินแล้ว";
      btnTaken.onclick = async ()=>{
        await updateDoc(doc(db, "users", name, "medications", med.id), {
          takenToday: true, repeatCount: 0, lastNotifyAt: serverTimestamp()
        });
        await addDoc(collection(db, "users", name, "history"), {
          name: med.name, time: med.time, takenAt: serverTimestamp()
        });
        loadHistory();
      };
      btns.appendChild(btnTaken);

      const btnEdit = document.createElement('button');
      btnEdit.textContent = "แก้ไข";
      btnEdit.className = "btn-warning";
      btnEdit.onclick = async ()=>{
        const newName = prompt("ชื่อยาใหม่", med.name) ?? med.name;
        const newTime = prompt("เวลาใหม่ (HH:MM 24ชม.)", med.time) ?? med.time;
        if(!newName || !newTime) return;
        await updateDoc(doc(db, "users", name, "medications", med.id), { name: newName, time: newTime });
      };
      btns.appendChild(btnEdit);

      const btnDelete = document.createElement('button');
      btnDelete.textContent = "ลบ";
      btnDelete.className = "btn-danger";
      btnDelete.onclick = async ()=>{
        if(confirm(`ลบยา: ${med.name}?`)){
          await deleteDoc(doc(db, "users", name, "medications", med.id));
        }
      };
      btns.appendChild(btnDelete);

      li.appendChild(btns);
      medList.appendChild(li);
    });
  });
}

document.getElementById('btnAdd').addEventListener('click', async ()=>{
  const name = (inputUser.value || '').trim();
  const medName = document.getElementById('medName').value.trim();
  const medTime = document.getElementById('medTime').value;
  if(!name || !medName || !medTime){ alert("กรอกข้อมูลให้ครบ"); return; }
  await addDoc(collection(db, "users", name, "medications"), {
    name: medName, time: medTime, takenToday: false, repeatCount: 0, lastNotifyAt: null, createdAt: serverTimestamp()
  });
  document.getElementById('medName').value = "";
});

async function loadHistory(){
  const name = (inputUser.value || '').trim();
  const ul = document.getElementById('historyList');
  ul.innerHTML = "";
  if(!name) return;
  const qy = query(collection(db, "users", name, "history"), orderBy("takenAt", "desc"));
  const snap = await getDocs(qy);
  snap.forEach(d => {
    const h = d.data();
    let when = ''; try{ when = h.takenAt.toDate().toLocaleString('th-TH'); }catch(e){}
    const li = document.createElement('li');
    li.innerHTML = `<div class="left"><div><strong>${h.name}</strong></div>
      <div class="small">${h.time || ""} • ${when}</div></div>`;
    ul.appendChild(li);
  });
}

// Local repeat while tab open (2 mins, max 5)
const MAX_REPEAT = 5;
const REPEAT_MS = 2*60*1000;
function hhmm(d){ return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
let pendingLocal = JSON.parse(localStorage.getItem('pendingLocal') || '{}');
function savePending(){ localStorage.setItem('pendingLocal', JSON.stringify(pendingLocal)); }

setInterval(async () => {
  const name = (inputUser.value || '').trim();
  if(!name) return;
  const medsSnap = await getDocs(collection(db, "users", name, "medications"));
  const meds = medsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const now = new Date();
  const t = hhmm(now);

  for(const med of meds){
    const key = `${name}|${med.name}|${med.time}`;
    if(med.time === t){
      const entry = pendingLocal[key] || { last: 0, count: 0 };
      const canRepeat = (!med.takenToday) && (entry.count < MAX_REPEAT);
      if(canRepeat && (Date.now() - entry.last >= REPEAT_MS)){
        entry.last = Date.now();
        entry.count += 1;
        pendingLocal[key] = entry;
        savePending();
        try{ document.getElementById('alarmSound').play(); }catch(e){}
        if(Notification.permission === "granted"){
          try{ new Notification("ถึงเวลาแล้ว!", { body: `กรุณากินยา: ${med.name}`, icon: "/icons/icon-192.png" }); }catch(e){}
        }
      }
    } else {
      if(pendingLocal[key]){ delete pendingLocal[key]; savePending(); }
    }
  }
}, 15000);
