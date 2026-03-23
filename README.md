# 🤖 WA Bot Launcher — Pairing Code

Bot WhatsApp yang terhubung ke **nomor WA pribadimu** lewat Pairing Code (tanpa scan QR).  
Cukup buka website → masukkan nomor → dapat kode 8 digit → masukkan di WA. Selesai!

---

## 📁 Struktur Folder

```
wa-bot/
├── server.js          ← Server utama (Node.js + Baileys)
├── package.json       ← Dependensi
├── public/
│   └── index.html     ← Website frontend
└── auth_sessions/     ← Dibuat otomatis, simpan sesi WA
```

---

## ⚙️ Persyaratan

- **Node.js v18+** → https://nodejs.org
- Koneksi internet
- HP Android dengan WhatsApp

---

## 🚀 Cara Jalankan (Lokal di PC/Laptop)

```bash
# 1. Masuk ke folder proyek
cd wa-bot

# 2. Install dependensi
npm install

# 3. Jalankan server
npm start
```

Buka browser → `http://localhost:3000`

---

## 📱 Cara Pakai dari Android (tanpa PC)

Kamu butuh server yang bisa diakses dari HP. Pilih salah satu:

### Opsi A — Railway (gratis, paling mudah)
1. Buat akun di https://railway.app
2. Buat project baru → Deploy from GitHub
3. Upload semua file ke GitHub repo
4. Railway otomatis deploy dan beri URL publik
5. Buka URL tersebut dari HP

### Opsi B — Render (gratis)
1. Buat akun di https://render.com
2. New → Web Service → connect GitHub repo
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Buka URL yang diberikan Render

### Opsi C — Glitch (langsung online, gratis)
1. Buka https://glitch.com
2. New Project → Import from GitHub
3. Edit file langsung, otomatis live

---

## 🔐 Cara Pairing

Setelah server berjalan dan kamu buka websitenya:

1. Masukkan nomor WA kamu (format: `81234567890`)
2. Klik **"Hubungkan & Dapatkan Kode"**
3. Tunggu kode 8 digit muncul (contoh: `ABCD-EFGH`)
4. Buka WhatsApp di HP → **⋮ Menu → Perangkat Tertaut**
5. Ketuk **"Tautkan Perangkat"**
6. Pilih **"Tautkan dengan nomor telepon"**
7. Masukkan kode 8 digit → selesai! ✅

Bot langsung aktif dan mengirim pesan sambutan ke nomormu.

---

## 💬 Cara Pakai Bot

Kirim pesan **dari nomor lain** ke nomormu (atau minta temanmu kirim):

| Perintah | Fungsi |
|---|---|
| `#menu` | Tampilkan menu utama |
| `1` | Mini Game Tebak Angka |
| `2` | Jokes Lucu |
| `3` | Kata Motivasi |
| `4` | Ramalan Zodiak |
| `5` | Kalkulator |
| `6` | Konversi Satuan |
| `7` | Fakta Unik |
| `8` | Resep Masakan |
| `9` | Doa Harian |

---

## ⚠️ Catatan Penting

- Jangan gunakan nomor utama yang penting — ada risiko kecil di-banned WhatsApp
- Nomor yang sedang aktif di WA Web lain mungkin perlu dicabut dulu
- Sesi tersimpan di folder `auth_sessions/` — jangan dihapus agar tidak perlu pairing ulang
- Kode pairing berlaku **60 detik**, jika habis ulangi prosesnya

---

*Dibuat dengan ❤️ · Baileys + Express + Socket.IO*
