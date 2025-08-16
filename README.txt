TB Medication Reminder - การใช้งาน

1. อัปโหลดไฟล์ทั้งหมด (index.html, style.css, firebase-messaging-sw.js) ไปยังเว็บเซิร์ฟเวอร์
2. เปิด Firebase Console:
   - ตรวจสอบ Firestore
   - เปิด Cloud Messaging (Sender ID: 658947281549)
   - ใช้ VAPID Key: BEW_OlIcEMACqhY8gvQJnED9MHFIT5e0Iyp6cOmVdu8LGQn6XwSplZJ-a2FsHJWJvwr5ouW2LdyYJ6P0yCviT3Y
3. ผู้ใช้เปิดเว็บ → ตกลงอนุญาต Notification → รับ token → บันทึกลง Firebase
4. ระบบจะแจ้งเตือนตามเวลายาที่ตั้งไว้ทุกคนที่เข้ามาใช้เว็บ
5. ตรวจสอบ Firestore เพื่อดูประวัติการกินยาและ token ของผู้ใช้
