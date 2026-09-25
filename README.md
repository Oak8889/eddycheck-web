# EddyCheck — เว็บแอปพลิเคชัน (ต้นแบบ UI)

เว็บนี้เป็น React + Vite + Tailwind ใช้ **ข้อมูลจำลอง (Mock data)** ทั้งหมด
(เก็บไว้ใน `src/services/mockData.js`) ยังไม่เชื่อมกับฮาร์ดแวร์ Hantek 6022BE จริง
แต่โครงสร้างออกแบบให้สลับไปใช้ API จริงได้ง่ายภายหลัง (ดูหัวข้อ "ต่อกับฮาร์ดแวร์จริง" ด้านล่าง)

## วิธีรันบน Windows (PowerShell)

**สิ่งที่ต้องมีก่อน:** ติดตั้ง [Node.js](https://nodejs.org/) เวอร์ชัน 18 ขึ้นไป (แนะนำ LTS)
ตรวจสอบว่าติดตั้งแล้วโดยเปิด PowerShell แล้วพิมพ์:

```powershell
node -v
npm -v
```

ถ้าขึ้นเลขเวอร์ชัน แปลว่าพร้อมแล้ว

**ขั้นตอนรันเว็บ:**

1. แตกไฟล์ zip นี้ไปยังโฟลเดอร์ที่ต้องการ เช่น `C:\Projects\eddycheck-web`
2. เปิด PowerShell แล้ว `cd` เข้าไปในโฟลเดอร์นั้น:
   ```powershell
   cd C:\Projects\eddycheck-web
   ```
3. ติดตั้ง dependencies (ทำครั้งแรกครั้งเดียว):
   ```powershell
   npm install
   ```
4. รันเว็บแบบ dev server:
   ```powershell
   npm run dev
   ```
5. เปิดเบราว์เซอร์ไปที่ลิงก์ที่ขึ้นในเทอร์มินัล ปกติคือ `http://localhost:5173`

กด `Ctrl + C` ในหน้าต่าง PowerShell เพื่อหยุดเซิร์ฟเวอร์

## โครงสร้างไฟล์

```
src/
  pages/
    Dashboard.jsx    หน้าหลัก — แผนผังรถ + สรุปผล + สแกนจุด
    Monitor.jsx       มอนิเตอร์สด — กราฟ Vrms แบบ real-time
    History.jsx       ประวัติการตรวจ — ตาราง + filter + export CSV
    Settings.jsx      ตั้งค่าเกณฑ์การจำแนก
  components/
    Layout.jsx         โครงหน้าเว็บ + เมนูนำทาง
    CarMap.jsx          แผนผังรถ SVG พร้อมจุดตรวจสอบ
    ResultBadge.jsx     ป้ายแสดงผล (มาตรฐาน/ดัดแปลง/ไม่ชัดเจน)
    Panel.jsx            การ์ด/กล่องเนื้อหาที่ใช้ซ้ำทั่วเว็บ
  services/
    mockData.js          ★ จุดเดียวที่รู้ว่าข้อมูลเป็นของจำลองหรือจริง
```

## ต่อกับฮาร์ดแวร์จริง (ตอน Hantek + Python พร้อม)

แก้ไขเฉพาะไฟล์ `src/services/mockData.js` เท่านั้น — หน้าเว็บอื่นไม่ต้องแตะเลย
เพราะทุกหน้าเรียกใช้ฟังก์ชันจากไฟล์นี้เท่านั้น ไม่มีการสุ่มข้อมูลเองในหน้าอื่น

ฟังก์ชันที่ต้องเปลี่ยนจาก mock เป็นของจริง:

| ฟังก์ชัน | ปัจจุบัน (mock) | ควรเปลี่ยนเป็น |
|---|---|---|
| `getPoints()` | array คงที่ในไฟล์ | `fetch('/api/points')` |
| `runScan(pointId)` | สุ่มค่า | `fetch('/api/scan', { method: 'POST', body: JSON.stringify({ pointId }) })` |
| `getHistory()` | อ่านจาก localStorage | `fetch('/api/history')` |
| `getCriteria()` / `saveCriteria()` | localStorage | `fetch('/api/criteria')` (GET/PUT) |
| `subscribeLiveVrms()` | `setInterval` จำลองสัญญาณ | เปิด WebSocket ไปยัง Python backend ที่อ่านค่าจาก `Hantek6022API` แล้ว `onmessage` เรียก callback เดิม |

โครงสร้างข้อมูล (shape) ของแต่ละฟังก์ชันถูกออกแบบไว้แล้วในไฟล์นี้ — แค่ทำให้ backend
ส่งข้อมูลรูปแบบเดียวกันออกมา หน้าเว็บจะทำงานได้ทันทีโดยไม่ต้องแก้โค้ด UI

## Dark / Light mode

กดปุ่มสวิตช์มุมขวาบน (ข้างเมนู) เพื่อสลับโหมด ระบบจะจำค่าที่เลือกไว้ใน
`localStorage` ให้อัตโนมัติ (เปิดเว็บครั้งต่อไปยังคงธีมเดิม)

สีและพื้นผิวกระจก (glassmorphism) ทั้งหมดกำหนดเป็น **CSS variables** ไว้ที่
`src/index.css` ไม่ได้ผูกกับ Tailwind color config โดยตรง เพื่อให้สลับสีได้
ทันทีทั้งเว็บโดยไม่ต้องแก้ไฟล์อื่น:

```css
:root { /* ค่าตอนโหมดสว่าง */
  --panel-bg: 255 255 255;
  --signal-teal: 13 148 136;
  ...
}
.dark { /* ค่าตอนโหมดมืด */
  --panel-bg: 22 27 31;
  --signal-teal: 45 212 191;
  ...
}
```

อยากปรับความโปร่งใส/ความเบลอของกรอบกระจก แก้ที่ `--panel-bg-alpha` และ
`--panel-blur` ในไฟล์เดียวกัน ส่วนกราฟใน `Monitor.jsx` และแผนผังรถใน
`CarMap.jsx` ใช้จานสี (`PALETTE` / `CAR_PALETTE`) แยกต่างหากเพราะ Recharts
และ SVG ต้องการค่าสีเป็น string ตรงๆ — ถ้าปรับสีหลักใน `index.css` ควรแก้ค่า
ในจานสีสองจุดนี้ให้ตรงกันด้วย

## หมายเหตุ

- ข้อมูลตอนนี้เก็บใน `localStorage` ของเบราว์เซอร์ ล้างแคชแล้วข้อมูลจะหาย (ตั้งใจไว้ เพราะเป็นแค่ข้อมูลสาธิต)
- จุดตรวจสอบบนแผนผังรถ (เสา A/B/C) แก้ไขได้ที่ `CAR_POINTS` ใน `mockData.js`
