# 💖 Deepika Special Real-time Chat App (MERN Stack)

Ek khoobsurat aur powerful realtime chating application jo specially **Deepika** ke liye design ki gayi hai!

---

## ✨ Features Included

1. **🌟 Grand Tribute Header Banner:**
   - Bade bade letters me prominent title: **"THIS APP HAS BEEN DESIGNED FOR DEEPIKA"**
   - Ek behad pyari si romantic line: *“Jahan har lafz me sirf tum ho, aur har paigaam dil se nikal kar dil tak pahunche... Har pal, har baat sirf tumhare liye.” ✨💖*
   - Interactive **Love Sparkle** (Confetti & Hearts shower) button!

2. **📱 "Use as Mobile App" (PWA / Add to Home Screen):**
   - Home page banner par prominent **"Use as Mobile App"** button.
   - Click karne par native Chrome/Android install prompt open hota hai ya iOS Safari "Add to Home Screen" instructions milti hain.
   - `manifest.json` aur `sw.js` (Service Worker) configured hain.

3. **🔔 Real-time Audio Notification Chime:**
   - Jaise hi receiver ke paas message aata hai, ek **sweet melodic bell chime** bajta hai!
   - Browser notification support (desktop/mobile push alert).
   - Banner par "🔔 Enable Notification Chime" / Test button.

4. **👉 Swipe Reply:**
   - Mobile par kisi bhi message par right-swipe karne se reply mode active ho jata hai.
   - Desktop par hover karke quick reply icon click kar sakte hain.
   - Input box ke upar replied message ka preview show hota hai.

5. **📎 File & Photo Sharing:**
   - Photos, Images, Documents, Voice Notes / Audio files share kar sakte hain.
   - Image lightbox preview (zoom & download).
   - In-app audio player for voice notes.

6. **🟢 Last Seen & Online Status:**
   - Real-time online indicator (green glowing pulse).
   - Offline users ke liye dynamic last seen: *"Today at 5:45 PM"*, *"15m ago"*, etc.

7. **✔️✔️ Message Status Ticks:**
   - Single check (`✓`): Sent to server.
   - Double grey check (`✓✓`): Delivered to receiver.
   - Double glowing cyan/rose check (`✓✓`): Read by receiver.

8. **⚡ 1-Click Fast Demo Testing:**
   - Login modal me **1-Click Fast Access**:
     - 👑 **Login as Deepika ✨**
     - 💕 **Login as Admirer 💕**
   - Custom registration and avatar selection bhi available hai.

---

## 🚀 How to Run Locally

### Terminal 1 (Backend Server):
```bash
cd server
npm start
# Runs on http://localhost:5000
```

### Terminal 2 (Frontend Client):
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

> **Note:** Backend MongoDB ke saath naturally connect karta hai (`mongodb://127.0.0.1:27017/deepika_chat`), aur agar local MongoDB daemon start na ho toh automatic local persistent store par seamlessly chalta hai bina kisi rukawat ke!
