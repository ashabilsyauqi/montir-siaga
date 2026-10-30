const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const os = require('os');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let fallback = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
          return iface.address;
        }
        if (fallback === 'localhost') fallback = iface.address;
      }
    }
  }
  return fallback;
}

const LOCAL_IP = getLocalIP();
const PORT = 4000;

// Central Realtime State
let state = {
  activeOrder: null,
  mechanics: [
    {
      id: 'm1',
      name: 'Pak Agus Santoso',
      phone: '0812-3456-7890',
      vehicle: 'Honda Vario 160 (B 4921 TZX)',
      rating: 4.9,
      jobsCompleted: 342,
      verified: true,
      status: 'online',
      specialty: 'Aki & Kelistrikan',
      walletBalance: 485000,
      coords: { latitude: -6.2255, longitude: 106.8120 },
    },
    {
      id: 'm2',
      name: 'Bambang Irawan',
      phone: '0857-9876-5432',
      vehicle: 'Yamaha NMAX (B 3310 PQR)',
      rating: 4.8,
      jobsCompleted: 198,
      verified: true,
      status: 'online',
      specialty: 'Ban & Mesin Overheat',
      walletBalance: 320000,
      coords: { latitude: -6.2290, longitude: 106.8090 },
    },
  ],
  mechanicOnline: true,
  platformStats: {
    totalOrders: 152,
    totalGrossRevenue: 15820000,
    adminFeePerOrder: 10000,
    platformNetRevenue: 1520000, // PURE Rp 10.000 x 152 order lunas
  },
  chatMessages: [
    { id: '1', sender: 'system', text: 'Sistem Montir Siaga aktif. Biaya admin platform Rp 10.000 per pemanggilan.' },
  ],
};

function broadcast(eventType, data) {
  const payload = JSON.stringify({ type: eventType, data, state });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// REST Endpoints
app.get('/api/state', (req, res) => {
  res.json({ success: true, state });
});

// 1. Driver creates an order with MontirPay (Admin fee Rp 10.000 paid to owner)
app.post('/api/order/create', (req, res) => {
  const { service, locationText, coords, vehicleName, note } = req.body;
  const adminFee = 10000;
  const mechanicEstimatedFee = service?.price || 85000;

  const newOrder = {
    id: 'MS-' + Math.floor(1000 + Math.random() * 9000),
    service: service || { id: 'aki', title: 'Aki Soak / Jumper', price: 85000 },
    userAddress: locationText || 'Jl. Jend. Sudirman Kav 52',
    userCoords: coords || { latitude: -6.2225, longitude: 106.8115 },
    vehicle: vehicleName || 'Toyota Avanza 1.3 G (B 1234 SKA)',
    note: note || '',
    mechanic: null,
    status: 'searching', // searching -> assigned -> arrived -> repairing -> billing -> completed
    adminFee,
    adminFeePaid: true,
    paymentMethod: 'montirpay',
    mechanicEstimatedFee,
    mechanicBillAmount: mechanicEstimatedFee,
    mechanicBillNote: 'Jasa perbaikan standar darurat',
    qrisGenerated: false,
    qrisPaid: false,
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  // Pure admin fee Rp 10.000 masuk ke owner
  state.platformStats.totalOrders += 1;
  state.platformStats.platformNetRevenue += adminFee;
  state.activeOrder = newOrder;
  state.chatMessages = [
    { id: '1', sender: 'system', text: 'Biaya admin Rp 10.000 lunas via MontirPay (ke Owner). Mencari montir terdekat...' },
  ];

  console.log(`[ORDER] Created #${newOrder.id} - Pure Admin Rp 10.000 masuk ke owner!`);
  broadcast('ORDER_CREATED', newOrder);
  res.json({ success: true, order: newOrder, platformStats: state.platformStats });
});

// 2. Mechanic accepts order
app.post('/api/order/accept', (req, res) => {
  if (!state.activeOrder) return res.status(400).json({ error: 'Tidak ada order aktif' });
  const mechanicId = req.body.mechanicId || 'm1';
  const assignedMech = state.mechanics.find((m) => m.id === mechanicId) || state.mechanics[0];

  state.activeOrder.mechanic = assignedMech;
  state.activeOrder.status = 'assigned';
  state.chatMessages.push({
    id: Date.now().toString(),
    sender: 'mechanic',
    text: `Halo Pak, saya ${assignedMech.name}. Pesanan sudah saya terima dan saya segera meluncur ke lokasi!`,
  });

  console.log(`[ORDER] Accepted #${state.activeOrder.id} by ${assignedMech.name}`);
  broadcast('ORDER_ACCEPTED', state.activeOrder);
  res.json({ success: true, order: state.activeOrder });
});

// 3. Mechanic updates status (arrived / repairing)
app.post('/api/order/status', (req, res) => {
  if (!state.activeOrder) return res.status(400).json({ error: 'Tidak ada order aktif' });
  const { status } = req.body;
  state.activeOrder.status = status;

  if (status === 'arrived') {
    state.chatMessages.push({
      id: Date.now().toString(),
      sender: 'mechanic',
      text: 'Pak, saya sudah tiba di samping mobil Anda.',
    });
  } else if (status === 'repairing') {
    state.chatMessages.push({
      id: Date.now().toString(),
      sender: 'mechanic',
      text: 'Pemeriksaan & pengerjaan perbaikan mobil sedang berlangsung.',
    });
  }

  console.log(`[ORDER] Status: ${status}`);
  broadcast('ORDER_STATUS_CHANGED', { status, order: state.activeOrder });
  res.json({ success: true, order: state.activeOrder });
});

// 4. Mechanic generates bill & dynamic QRIS for driver
app.post('/api/order/generate-bill', (req, res) => {
  if (!state.activeOrder) return res.status(400).json({ error: 'Tidak ada order aktif' });
  const { billAmount, billNote } = req.body;

  const amount = Number(billAmount) || state.activeOrder.mechanicEstimatedFee || 85000;
  state.activeOrder.mechanicBillAmount = amount;
  state.activeOrder.mechanicBillNote = billNote || 'Jasa perbaikan & servis';
  state.activeOrder.qrisGenerated = true;
  state.activeOrder.qrisCodeId = 'QRIS-' + Date.now();
  state.activeOrder.status = 'billing';

  state.chatMessages.push({
    id: Date.now().toString(),
    sender: 'mechanic',
    text: `Tagihan perbaikan diterbitkan sebesar Rp ${amount.toLocaleString('id-ID')} (${billNote || 'Jasa'}). Silakan scan atau klik Bayar QRIS di aplikasi.`,
  });

  console.log(`[BILL] Mechanic generated QRIS bill: Rp ${amount} for #${state.activeOrder.id}`);
  broadcast('BILL_GENERATED', state.activeOrder);
  res.json({ success: true, order: state.activeOrder });
});

// 5. Driver pays QRIS bill (100% of bill goes directly to mechanic wallet)
app.post('/api/order/pay-qris', (req, res) => {
  if (!state.activeOrder) return res.status(400).json({ error: 'Tidak ada order aktif' });

  const billAmount = state.activeOrder.mechanicBillAmount;
  state.activeOrder.qrisPaid = true;
  state.activeOrder.status = 'completed';

  // 100% dari tagihan QRIS masuk murni ke dompet montir!
  if (state.activeOrder.mechanic) {
    const mech = state.mechanics.find((m) => m.id === state.activeOrder.mechanic.id);
    if (mech) {
      mech.walletBalance += billAmount;
      mech.jobsCompleted += 1;
    }
  }

  state.chatMessages.push({
    id: Date.now().toString(),
    sender: 'system',
    text: `Pembayaran QRIS Rp ${billAmount.toLocaleString('id-ID')} BERHASIL! Dana 100% telah diteruskan ke dompet montir.`,
  });

  console.log(`[QRIS] Driver paid Rp ${billAmount} via QRIS -> 100% to mechanic!`);
  broadcast('QRIS_PAID', { order: state.activeOrder, mechanics: state.mechanics });
  res.json({ success: true, order: state.activeOrder });
});

// 6. Cancel order
app.post('/api/order/cancel', (req, res) => {
  if (state.activeOrder && state.activeOrder.status === 'searching') {
    state.platformStats.platformNetRevenue = Math.max(0, state.platformStats.platformNetRevenue - 10000);
    state.platformStats.totalOrders = Math.max(0, state.platformStats.totalOrders - 1);
  }
  state.activeOrder = null;
  console.log('[ORDER] Cancelled & refunded');
  broadcast('ORDER_CANCELLED', { platformStats: state.platformStats });
  res.json({ success: true });
});

// 7. Reset order
app.post('/api/order/reset', (req, res) => {
  state.activeOrder = null;
  console.log('[ORDER] Reset to idle');
  broadcast('ORDER_RESET', null);
  res.json({ success: true });
});

// 8. Toggle mechanic online
app.post('/api/mechanic/toggle-online', (req, res) => {
  state.mechanicOnline = req.body.online !== undefined ? req.body.online : !state.mechanicOnline;
  broadcast('MECHANIC_STATUS_CHANGED', { mechanicOnline: state.mechanicOnline });
  res.json({ success: true, mechanicOnline: state.mechanicOnline });
});

// 9. Chat message
app.post('/api/chat/send', (req, res) => {
  const { sender, text } = req.body;
  const msg = {
    id: Date.now().toString(),
    sender: sender || 'user',
    text: text || '',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  state.chatMessages.push(msg);
  broadcast('CHAT_MESSAGE', msg);
  res.json({ success: true, message: msg });
});


// Serve Smartphone PC Emulator (Driver, Montir, Dual HP)
app.use('/mockup', express.static(path.join(__dirname, '../mockup_web')));
app.get('/emulator', (req, res) => {
  res.sendFile(path.join(__dirname, '../mockup_web/emulator.html'));
});

// Web Owner Live Command Center (Clean Red & Dark/White, Pure Admin Fee Rp 10.000)
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Montir Siaga — Owner Live Command Center</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-6 font-sans">
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div class="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl">
          👑
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-extrabold tracking-wide text-white">MONTIR SIAGA — OWNER LIVE COMMAND CENTER</h1>
            <span class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
              LIVE SERVER AKTIF
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">Memantau pendapatan murni admin pemanggilan & aktivitas real-time</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <a href="/emulator" target="_blank" class="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-black px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 transition">
          <span>📱</span> Buka Smartphone Emulator PC
        </a>
      </div>
      <div class="text-right">
        <span class="text-[10px] text-slate-400 font-mono">Server Local IP:</span>
        <div class="text-xs font-mono bg-slate-950 px-2.5 py-1 rounded text-sky-400 border border-slate-700">http://${LOCAL_IP}:${PORT}</div>
      </div>
    </div>

    <!-- Revenue & Stats Grid (Pure Rp 10k per order) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-slate-800 border border-amber-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div class="absolute -right-4 -bottom-4 text-6xl opacity-10">💰</div>
        <div class="text-xs uppercase font-bold text-amber-400 tracking-wider">PENDAPATAN MURNI OWNER (ADMIN 10K)</div>
        <div class="text-3xl font-black text-amber-300 mt-2">Rp ${Number(state.platformStats.platformNetRevenue).toLocaleString('id-ID')}</div>
        <p class="text-[11px] text-slate-400 mt-1">Pure Rp 10.000 per pemanggilan via MontirPay. Selebihnya 100% milik montir.</p>
      </div>

      <div class="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
        <div class="text-xs uppercase font-bold text-slate-400 tracking-wider">TOTAL VOLUME PEMESANAN</div>
        <div class="text-3xl font-black text-white mt-2">${state.platformStats.totalOrders} Order</div>
        <p class="text-[11px] text-emerald-400 mt-1">Tingkat keberhasilan 99.4%</p>
      </div>

      <div class="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
        <div class="text-xs uppercase font-bold text-slate-400 tracking-wider">SISTEM QRIS MEKANIK</div>
        <div class="text-3xl font-black text-emerald-400 mt-2">Direct 100%</div>
        <p class="text-[11px] text-slate-400 mt-1">Tagihan diinput montir & dibayar driver via QRIS langsung ke montir.</p>
      </div>
    </div>

    <!-- Active Live Order Monitor -->
    <div class="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-bold text-sm text-slate-200 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full ${state.activeOrder ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}"></span>
          LIVE PESANAN DARURAT BERJALAN (HP 1 ➔ HP 2)
        </h2>
        <span class="text-xs font-bold px-3 py-1 rounded-full ${state.activeOrder ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-700 text-slate-400'}">
          ${state.activeOrder ? state.activeOrder.status.toUpperCase() : 'STANDBY'}
        </span>
      </div>

      ${state.activeOrder ? `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-700">
          <div>
            <div class="text-[10px] text-slate-400 uppercase font-semibold">Pesanan & Pelanggan</div>
            <div class="font-bold text-white text-sm mt-1">#${state.activeOrder.id} - ${state.activeOrder.service.title}</div>
            <div class="text-xs text-slate-300 mt-0.5">🚘 ${state.activeOrder.vehicle}</div>
            <div class="text-xs text-slate-400 mt-1">📍 ${state.activeOrder.userAddress}</div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400 uppercase font-semibold">Bagi Hasil & Keuangan</div>
            <div class="text-xs font-bold text-emerald-400 mt-1">✅ Admin Owner: Rp 10.000 (Lunas by MontirPay)</div>
            <div class="text-xs font-bold text-amber-400 mt-1.5">
              💳 Tagihan QRIS Montir: Rp ${Number(state.activeOrder.mechanicBillAmount || state.activeOrder.mechanicEstimatedFee).toLocaleString('id-ID')}
              <span class="text-[10px] text-slate-400">(${state.activeOrder.qrisPaid ? 'LUNAS' : 'MENUNGGU BAYAR'})</span>
            </div>
            <div class="text-[11px] text-slate-400 mt-1">Catatan: ${state.activeOrder.mechanicBillNote || '-'}</div>
          </div>
          <div>
            <div class="text-[10px] text-slate-400 uppercase font-semibold">Mitra Montir Bertugas</div>
            <div class="font-bold text-white text-sm mt-1">${state.activeOrder.mechanic ? state.activeOrder.mechanic.name : 'Mencari Montir...'}</div>
            <div class="text-xs text-slate-400 mt-0.5">${state.activeOrder.mechanic ? state.activeOrder.mechanic.vehicle : '-'}</div>
          </div>
        </div>
      ` : `
        <div class="text-center py-8 text-slate-500 text-xs italic">
          Belum ada panggilan darurat berjalan. Buat order di HP Driver untuk melihat alur real-time di sini.
        </div>
      `}
    </div>
  </div>

  <script>
    const ws = new WebSocket('ws://' + window.location.host);
    ws.onmessage = () => location.reload();
  </script>
</body>
</html>
  `);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('==================================================');
  console.log('🚗 MONTIR SIAGA — REALTIME SYNC BACKEND SERVER 🚗');
  console.log('==================================================');
  console.log(`📡 Local Network Server: http://${LOCAL_IP}:${PORT}`);
  console.log(`👑 Owner Command Center: http://${LOCAL_IP}:${PORT}`);
  console.log(`🔌 WebSocket Server:     ws://${LOCAL_IP}:${PORT}`);
  console.log('==================================================');
});
