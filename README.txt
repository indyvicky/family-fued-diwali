
Family Feud — Diwali Party (Modern Minimal)
==========================================

Files:
- index.html
- styles.css
- app.js
- README.txt

How to use (quick):
1. Unzip and open index.html in any modern browser (Chrome/Edge/Firefox/Safari).
2. On the host device, use the Host button. Create teams (2-7), edit names and scores, add questions.
3. Click "Copy Player Link" and share that link with players (they should open it in their browser). The player view auto-opens if the URL contains ?room=ROOMID.
4. This app uses the BroadcastChannel API to sync the state across tabs on the same device and origin (works great if host and players open the same file locally in multiple tabs). For cross-device sync on different phones, follow the optional steps below.

Optional: Live sync across devices (advanced)
--------------------------------------------
To enable live sync across different devices, you can enable Firebase Realtime Database. This requires:

1. Create a Firebase project at https://console.firebase.google.com/
2. Add a web app and copy the config object.
3. Create a simple small Realtime DB path for your rooms (e.g. /rooms/ROOMID)
4. In app.js, replace the broadcastState() and initFromUrl() placeholders with realtime read/write to that path.
   - For safety and simplicity this demo does not ship with an API key. If you'd like, I can generate a version pre-wired to a disposable demo Firebase project, or guide you step-by-step to paste your own config into app.js.

Limitations & notes
-------------------
- The app is fully client-side and stores data in localStorage (so your questions persist on the host device).
- Sharing the exported JSON is a quick way to move question sets to another device.
- For robust, realtime multi-device play without any extra setup, you'd need a tiny backend or Firebase keys. I left the app offline-first for privacy and ease of use.

Enjoy your Diwali party! If you want, I can:
- Wire up a Firebase demo project so players' phones follow the host in real-time.
- Add sound effects (buzzer/clap).
- Produce a hosted version you can open from any phone without any setup.
