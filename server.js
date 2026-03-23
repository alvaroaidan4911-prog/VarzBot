/**
 * ╔══════════════════════════════════════════════════════╗
 * ║        WA BOT SERVER — Baileys + Pairing Code        ║
 * ║        Jalankan: node server.js                      ║
 * ╚══════════════════════════════════════════════════════╝
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  Browsers,
} = require("@whiskeysockets/baileys");

const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const path       = require("path");
const pino       = require("pino");
const fs         = require("fs");

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT       = process.env.PORT || 3000;
const AUTH_DIR   = "./auth_sessions";

// Pastikan folder auth ada
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

// ══════════════════════════════════════════════
//  STORE sesi aktif per nomor
// ══════════════════════════════════════════════
const activeSessions = {}; // { "628xxx": { sock, store, status } }

// ══════════════════════════════════════════════
//  MENU & BOT LOGIC
// ══════════════════════════════════════════════
const userState = {}; // state per pengguna

const JOKES = [
  "Kenapa buku matematika selalu sedih?\nKarena punya banyak *masalah* 😂",
  "Apa bedanya dokter sama tukang parkir?\nDokter nyembuhin, tukang parkir ngepusingin 🤣",
  "Kenapa programmer suka pakai kacamata?\nKarena tidak bisa *C#* 😄",
  "Suami: 'Sayang, kamu mirip bintang!'\nIstri: 'Wah indah?'\nSuami: 'Jauh... dan susah diraih.' 💀",
];

const QUOTES = [
  "💡 *Kesuksesan bukan kebetulan. Itu kerja keras, ketekunan, dan cinta pada apa yang kamu lakukan.*\n— Pelé",
  "🔥 *Jangan takut gagal. Takutlah jika kamu tidak pernah mencoba.*\n— Michael Jordan",
  "🌱 *Satu langkah kecil setiap hari lebih baik dari satu lompatan besar yang tidak pernah dilakukan.*",
];

const FAKTA = [
  "🐙 Gurita memiliki *3 jantung* dan darahnya berwarna biru!",
  "🍯 Madu tidak pernah basi. Madu berusia *3000 tahun* masih bisa dimakan!",
  "🐘 Gajah adalah satu-satunya hewan yang tidak bisa melompat.",
  "🧠 Otak manusia menghasilkan listrik cukup untuk menyalakan *bola lampu kecil*.",
];

const RESEP = [
  { judul: "🍳 Nasi Goreng", cara: "Bahan: nasi, kecap, bawang, telur, garam.\nCara: Tumis bawang → masukkan nasi → kecap + garam → telur → aduk rata. Siap!" },
  { judul: "🍜 Mie Sultan", cara: "Bahan: mie instan, telur, kornet, keju.\nCara: Masak mie, tiriskan. Oseng kornet + telur. Campur + keju parut. Mantap!" },
];

const DOA = {
  makan:      "*Doa Sebelum Makan*\n\nبِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ\n\n_Bismillahirrahmanirrahim_\n\nArtinya: Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang.",
  tidur:      "*Doa Sebelum Tidur*\n\nبِسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا\n\n_Bismikallaahumma amuutu wa-ahyaa_\n\nArtinya: Dengan nama-Mu ya Allah, aku mati dan hidup.",
  belajar:    "*Doa Sebelum Belajar*\n\nرَبِّ زِدْنِي عِلْمًا\n\n_Rabbi zidnii 'ilman_\n\nArtinya: Ya Tuhan, tambahkanlah ilmuku.",
  perjalanan: "*Doa Bepergian*\n\nسُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا\n\n_Subhanalladzi sakhkhara lanaa haadzaa_\n\nArtinya: Maha Suci Allah yang telah menundukkan ini untuk kami.",
};

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function menuUtama() {
  return (
    "🤖 *MENU BOT WA*\n\n" +
    "Pilih dengan ketik nomornya:\n\n" +
    "1️⃣  🎲 Mini Game Tebak Angka\n" +
    "2️⃣  😂 Jokes Lucu\n" +
    "3️⃣  💬 Kata Motivasi\n" +
    "4️⃣  ⭐ Ramalan Zodiak\n" +
    "5️⃣  🧮 Kalkulator\n" +
    "6️⃣  📐 Konversi Satuan\n" +
    "7️⃣  🔬 Fakta Unik\n" +
    "8️⃣  🍳 Resep Masakan\n" +
    "9️⃣  🕌 Doa Harian\n" +
    "0️⃣  ❓ Bantuan\n\n" +
    "Ketik *#menu* kapan saja untuk kembali ke sini."
  );
}

async function handleMessage(sock, from, text) {
  const t = text.trim().toLowerCase();

  // Global reset
  if (["#menu", "menu", "halo", "hi", "hello", "hai", "start", "0"].includes(t)) {
    userState[from] = { menu: "main" };
    await sock.sendMessage(from, { text: menuUtama() });
    return;
  }

  const state = userState[from] || { menu: "main" };

  // ── ROUTING ──────────────────────────────────
  if (state.menu === "main") {
    switch (t) {
      case "1": userState[from] = { menu: "game", angka: Math.floor(Math.random()*10)+1, coba: 3 };
                await sock.sendMessage(from, { text: "🎲 *TEBAK ANGKA!*\n\nAku menyimpan angka 1–10.\nKamu punya *3 kesempatan* menebak!\n\nKetik angkamu:" });
                break;
      case "2": await sock.sendMessage(from, { text: `😂 *JOKES*\n\n${rand(JOKES)}\n\n_Ketik *2* lagi untuk jokes lain, atau *#menu* untuk kembali._` });
                break;
      case "3": await sock.sendMessage(from, { text: `${rand(QUOTES)}\n\n_Ketik *3* lagi untuk motivasi lain, atau *#menu* untuk kembali._` });
                break;
      case "4": userState[from] = { menu: "zodiak" };
                await sock.sendMessage(from, { text: "⭐ *RAMALAN ZODIAK*\n\nKetik nama zodiakmu:\nAries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagitarius, Capricorn, Aquarius, Pisces" });
                break;
      case "5": userState[from] = { menu: "kalkulator" };
                await sock.sendMessage(from, { text: "🧮 *KALKULATOR*\n\nKetik ekspresi matematika:\nContoh: `25 * 4` atau `(100+50)/3`\n\nKetik *#menu* untuk keluar." });
                break;
      case "6": userState[from] = { menu: "konversi" };
                await sock.sendMessage(from, { text: "📐 *KONVERSI SATUAN*\n\nFormat: `[dari] ke [tujuan] [nilai]`\nContoh:\n`km ke m 5`\n`c ke f 30`\n`kg ke g 2.5`\n`usd ke idr 100`\n\nKetik *#menu* untuk keluar." });
                break;
      case "7": await sock.sendMessage(from, { text: `🔬 *FAKTA UNIK!*\n\n${rand(FAKTA)}\n\n_Ketik *7* lagi untuk fakta lain._` });
                break;
      case "8": { const r = rand(RESEP); await sock.sendMessage(from, { text: `🍳 *RESEP: ${r.judul}*\n\n${r.cara}\n\n_Ketik *8* lagi untuk resep lain._` }); break; }
      case "9": userState[from] = { menu: "doa" };
                await sock.sendMessage(from, { text: "🕌 *DOA HARIAN*\n\nKetik salah satu:\n• makan\n• tidur\n• belajar\n• perjalanan" });
                break;
      default:  await sock.sendMessage(from, { text: "❓ Ketik *#menu* untuk melihat daftar menu." });
    }
    return;
  }

  // ── GAME ──────────────────────────────────────
  if (state.menu === "game") {
    const tebak = parseInt(t);
    if (isNaN(tebak)) { await sock.sendMessage(from, { text: "⚠️ Masukkan angka saja! (1–10)" }); return; }
    state.coba--;
    if (tebak === state.angka) {
      await sock.sendMessage(from, { text: `🎉 *BENAR!* Angkanya memang ${state.angka}!\n\nKetik *#menu* untuk kembali.` });
      userState[from] = { menu: "main" };
    } else if (state.coba === 0) {
      await sock.sendMessage(from, { text: `😢 Kesempatan habis! Angkanya *${state.angka}*.\n\nKetik *#menu* untuk kembali.` });
      userState[from] = { menu: "main" };
    } else {
      const hint = tebak < state.angka ? "lebih besar ⬆️" : "lebih kecil ⬇️";
      await sock.sendMessage(from, { text: `❌ Salah! Angkanya *${hint}* dari ${tebak}.\nSisa kesempatan: ${state.coba}` });
    }
    return;
  }

  // ── ZODIAK ────────────────────────────────────
  if (state.menu === "zodiak") {
    const zodiakMap = {
      aries:"♈ Aries", taurus:"♉ Taurus", gemini:"♊ Gemini", cancer:"♋ Cancer",
      leo:"♌ Leo", virgo:"♍ Virgo", libra:"♎ Libra", scorpio:"♏ Scorpio",
      sagitarius:"♐ Sagitarius", capricorn:"♑ Capricorn", aquarius:"♒ Aquarius", pisces:"♓ Pisces"
    };
    const ramalanList = [
      "Hari ini penuh peluang! Jangan lewatkan kesempatan. 🌟",
      "Hati-hati dalam mengambil keputusan hari ini. 🤔",
      "Rezekimu sedang dalam perjalanan. Sabar! 💰",
      "Kesehatan adalah segalanya. Istirahat cukup ya! 🛌",
    ];
    const z = zodiakMap[t];
    if (z) {
      const angka = Math.floor(Math.random()*99)+1;
      const warna = rand(["Merah 🔴","Biru 💙","Hijau 💚","Kuning 💛","Ungu 💜"]);
      await sock.sendMessage(from, {
        text: `${z}\n\n🔮 *Ramalan:* ${rand(ramalanList)}\n🍀 *Angka Hoki:* ${angka}\n🎨 *Warna Hoki:* ${warna}\n\nKetik *#menu* untuk kembali.`
      });
      userState[from] = { menu: "main" };
    } else {
      await sock.sendMessage(from, { text: "⚠️ Zodiak tidak dikenal. Coba lagi, misal: *leo*" });
    }
    return;
  }

  // ── KALKULATOR ────────────────────────────────
  if (state.menu === "kalkulator") {
    try {
      if (/[^0-9\s\+\-\*\/\.\(\)\%]/.test(t)) throw new Error();
      const hasil = Function('"use strict"; return (' + t + ')')();
      await sock.sendMessage(from, { text: `🧮 *Hasil:*\n${t} = *${hasil}*\n\nKetik ekspresi lain atau *#menu* untuk keluar.` });
    } catch { await sock.sendMessage(from, { text: "⚠️ Ekspresi tidak valid. Contoh: `50 + 30 * 2`" }); }
    return;
  }

  // ── KONVERSI ──────────────────────────────────
  if (state.menu === "konversi") {
    const parts = t.split(/\s+/);
    try {
      if (parts.length !== 4 || parts[1] !== "ke") throw new Error();
      const [asal,,tujuan,nilaiStr] = parts;
      const nilai = parseFloat(nilaiStr);
      const map = {
        "km-m": v=>v*1000, "m-km": v=>v/1000, "cm-m": v=>v/100, "m-cm": v=>v*100,
        "kg-g": v=>v*1000, "g-kg": v=>v/1000,
        "c-f":  v=>v*9/5+32, "f-c": v=>(v-32)*5/9,
        "usd-idr": v=>v*15800, "idr-usd": v=>v/15800,
        "menit-jam": v=>v/60, "jam-menit": v=>v*60,
      };
      const fn = map[`${asal}-${tujuan}`];
      if (!fn) throw new Error();
      const hasil = fn(nilai);
      await sock.sendMessage(from, { text: `📐 *Hasil:*\n${nilai} ${asal.toUpperCase()} = *${hasil.toFixed(4)} ${tujuan.toUpperCase()}*\n\nKetik lagi atau *#menu* untuk keluar.` });
    } catch { await sock.sendMessage(from, { text: "⚠️ Format salah. Contoh: `km ke m 5`" }); }
    return;
  }

  // ── DOA ───────────────────────────────────────
  if (state.menu === "doa") {
    const d = DOA[t];
    if (d) {
      await sock.sendMessage(from, { text: `🕌 ${d}\n\nKetik *#menu* untuk kembali.` });
      userState[from] = { menu: "main" };
    } else {
      await sock.sendMessage(from, { text: "⚠️ Tidak ditemukan. Coba: makan / tidur / belajar / perjalanan" });
    }
    return;
  }

  await sock.sendMessage(from, { text: menuUtama() });
}

// ══════════════════════════════════════════════
//  FUNGSI BUAT / HUBUNGKAN SESI
// ══════════════════════════════════════════════
async function createSession(phoneNumber, socketId) {
  const authFolder = path.join(AUTH_DIR, phoneNumber);
  if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true });

  const { state: authState, saveCreds } = await useMultiFileAuthState(authFolder);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: authState,
    browser: Browsers.ubuntu("Chrome"),
    printQRInTerminal: false,
  });

  activeSessions[phoneNumber] = { sock, status: "connecting" };

  // ── REQUEST PAIRING CODE ──────────────────────
  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        const formatted = code.match(/.{1,4}/g).join("-"); // XXXX-XXXX
        console.log(`[${phoneNumber}] Pairing code: ${formatted}`);
        io.to(socketId).emit("pairing_code", { code: formatted });
        activeSessions[phoneNumber].status = "waiting_pair";
        io.to(socketId).emit("status", { status: "waiting_pair", message: "Masukkan kode di WhatsApp kamu" });
      } catch (err) {
        console.error("Pairing code error:", err);
        io.to(socketId).emit("error", { message: "Gagal mendapatkan kode. Pastikan nomor valid dan belum terhubung ke WA Web lain." });
      }
    }, 3000);
  }

  // ── CONNECTION UPDATE ─────────────────────────
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log(`[${phoneNumber}] ✅ Terhubung!`);
      activeSessions[phoneNumber].status = "connected";
      io.to(socketId).emit("status", { status: "connected", message: "Bot berhasil terhubung! 🎉" });

      // Kirim pesan selamat datang ke diri sendiri
      const jid = phoneNumber + "@s.whatsapp.net";
      await sock.sendMessage(jid, {
        text: "🤖 *Bot WhatsApp aktif!*\n\nHalo! Bot kamu sudah berhasil terhubung.\n\nKetik *#menu* untuk melihat semua fitur. Selamat menikmati! 🚀"
      });
    }

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log(`[${phoneNumber}] Koneksi terputus (${code}). Reconnect: ${shouldReconnect}`);

      if (shouldReconnect) {
        io.to(socketId).emit("status", { status: "reconnecting", message: "Menghubungkan ulang..." });
        setTimeout(() => createSession(phoneNumber, socketId), 5000);
      } else {
        io.to(socketId).emit("status", { status: "logged_out", message: "Sesi telah logout." });
        delete activeSessions[phoneNumber];
        // Hapus auth
        fs.rmSync(path.join(AUTH_DIR, phoneNumber), { recursive: true, force: true });
      }
    }
  });

  // ── SIMPAN CREDENTIALS ────────────────────────
  sock.ev.on("creds.update", saveCreds);

  // ── TERIMA PESAN ──────────────────────────────
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (msg.key.fromMe) continue;            // Abaikan pesan dari diri sendiri
      if (!msg.message) continue;

      const from = msg.key.remoteJid;
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        "";

      if (!text) continue;
      console.log(`[${phoneNumber}] Pesan dari ${from}: ${text}`);
      await handleMessage(sock, from, text);
    }
  });
}

// ══════════════════════════════════════════════
//  SOCKET.IO — koneksi dari browser
// ══════════════════════════════════════════════
io.on("connection", (socket) => {
  console.log(`[WS] Client terhubung: ${socket.id}`);

  socket.on("start_session", async ({ phone }) => {
    // Bersihkan nomor: hilangkan +, spasi, strip
    const clean = phone.replace(/[^0-9]/g, "");
    // Pastikan format 62xxx
    const phoneNumber = clean.startsWith("62") ? clean : "62" + clean.replace(/^0/, "");

    console.log(`[WS] Request sesi untuk: ${phoneNumber}`);

    // Cek apakah sudah ada sesi aktif
    if (activeSessions[phoneNumber]?.status === "connected") {
      socket.emit("status", { status: "connected", message: "Sesi sudah aktif!" });
      return;
    }

    socket.emit("status", { status: "connecting", message: "Menghubungkan ke WhatsApp..." });
    await createSession(phoneNumber, socket.id);
  });

  socket.on("disconnect", () => {
    console.log(`[WS] Client disconnect: ${socket.id}`);
  });
});

// ══════════════════════════════════════════════
//  ROUTE — serve frontend
// ══════════════════════════════════════════════
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Status API
app.get("/api/status", (req, res) => {
  const sessions = Object.entries(activeSessions).map(([num, s]) => ({
    phone: num, status: s.status
  }));
  res.json({ sessions });
});

// ══════════════════════════════════════════════
//  START SERVER
// ══════════════════════════════════════════════
server.listen(PORT, () => {
  console.log(`\n🤖 WA Bot Server berjalan di http://localhost:${PORT}\n`);
});
