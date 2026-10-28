const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Helper to get local Wi-Fi IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
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
      status: 'online', // 'online' | 'offline' | 'busy'
      specialty: 'Aki & Kelistrikan',
      walletBalance: 485000,
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
    },
    {
      id: 'm3',
      name: 'Dedi Kurniawan',
      phone: '0878-1122-3344',
      vehicle: 'Towing Truk Isuzu Elf (B 9090 TGG)',
      rating: 4.9,
      jobsCompleted: 88,
      verified: false,
      status: 'offline',
      specialty: 'Derek / Towing Gendong',
      walletBalance: 150000,
    },
  ],
  mechanicOnline: true,
  platformStats: {
    totalOrders: 148,
    totalGrossRevenue: 15420000,
    platformCutPercent: 15,
    platformNetRevenue: 2313000,
  },
  chatMessages: [
    { id: '1', sender: 'mechanic', text: 'Halo, saya sudah siap meluncur ke lokasi mobil Anda. Mohon nyalakan lampu hazard ya.' },
  ],
};

// Broadcast to all connected devices (HP 1, HP 2, Laptop Owner)
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

// 1. Driver creates an order on HP 1
app.post('/api/order/create', (req, res) => {
  const { service, locationText, coords, vehicleName, note } = req.body;
  const price = service.price;
  const platformFee = Math.round(price * (state.platformStats.platformCutPercent / 100));
  const mechanicNet = price - platformFee;

  const newOrder = {
    id: 'MS-' + Math.floor(1000 + Math.random() * 9000),
    service,
    userAddress: locationText || 'Jl. Jend. Sudirman Kav 52',
    userCoords: coords || null,
    vehicle: vehicleName || 'Toyota Avanza 1.3 G (B 1234 SKA)',
    note: note || '',
    mechanic: null,
    status: 'searching', // searching -> assigned -> arrived -> repairing -> completed -> paid
    price,
    platformFee,
    mechanicNet,
    paymentMethod: null,
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  state.activeOrder = newOrder;
  state.chatMessages = [
    { id: '1', sender: 'system', text: `Panggilan darurat dibuat untuk kendala ${service.title}. Mencari montir terdekat...` },
  ];

  console.log(`[ORDER] Created #${newOrder.id} - ${service.title} by Driver`);
  broadcast('ORDER_CREATED', newOrder);
  res.json({ success: true, order: newOrder });
});

// 2. Mechanic accepts order on HP 2
app.post('/api/order/accept', (req, res) => {
  if (!state.activeOrder) {
    return res.status(400).json({ error: 'Tidak ada order aktif' });
  }

  const mechanicId = req.body.mechanicId || 'm1';
  const assignedMech = state.mechanics.find((m) => m.id === mechanicId) || state.mechanics[0];

  state.activeOrder.mechanic = assignedMech;
  state.activeOrder.status = 'assigned';
  state.chatMessages.push({
    id: Date.now().toString(),
    sender: 'mechanic',
    text: `Halo Pak, saya ${assignedMech.name} dari Montir Siaga. Saya sedang menuju ke lokasi mobil Anda membawa perlengkapan!`,
  });

  console.log(`[ORDER] Accepted #${state.activeOrder.id} by ${assignedMech.name}`);
  broadcast('ORDER_ACCEPTED', state.activeOrder);
  res.json({ success: true, order: state.activeOrder });
});

// 3. Mechanic updates status (arrived / repairing / completed)
app.post('/api/order/status', (req, res) => {
  if (!state.activeOrder) {
    return res.status(400).json({ error: 'Tidak ada order aktif' });
  }

  const { status } = req.body;
  state.activeOrder.status = status;

  if (status === 'arrived') {
    state.chatMessages.push({
      id: Date.now().toString(),
      sender: 'mechanic',
      text: 'Pak, saya sudah sampai di samping mobil bapak ya.',
    });
  } else if (status === 'completed') {
    state.chatMessages.push({
      id: Date.now().toString(),
      sender: 'system',
      text: 'Perbaikan selesai! Nota tagihan telah dikirimkan ke pengemudi.',
    });
  }

  console.log(`[ORDER] Status changed to ${status}`);
  broadcast('ORDER_STATUS_CHANGED', { status, order: state.activeOrder });
  res.json({ success: true, order: state.activeOrder });
});

// 4. Driver completes payment on HP 1
app.post('/api/order/pay', (req, res) => {
  if (!state.activeOrder) {
    return res.status(400).json({ error: 'Tidak ada order aktif' });
  }

  const { method } = req.body;
  const order = state.activeOrder;

  order.status = 'paid';
  order.paymentMethod = method || 'qris';

  // Update Owner finances (+15%)
  state.platformStats.totalOrders += 1;
  state.platformStats.totalGrossRevenue += order.price;
  state.platformStats.platformNetRevenue += order.platformFee;

  // Update Mechanic wallet balance (+85%)
  if (order.mechanic) {
    const mech = state.mechanics.find((m) => m.id === order.mechanic.id);
    if (mech) {
      mech.walletBalance += order.mechanicNet;
      mech.jobsCompleted += 1;
    }
  }

  console.log(`[ORDER] Paid #${order.id} via ${order.paymentMethod}. Owner fee +${order.platformFee}`);
  broadcast('ORDER_PAID', { order, platformStats: state.platformStats });
  res.json({ success: true, order });
});

// 5. Reset order
app.post('/api/order/reset', (req, res) => {
  state.activeOrder = null;
  console.log('[ORDER] Reset to idle');
  broadcast('ORDER_RESET', null);
  res.json({ success: true });
});

// 6. Chat messages
app.post('/api/chat', (req, res) => {
  const { sender, text } = req.body;
  const msg = { id: Date.now().toString(), sender, text };
  state.chatMessages.push(msg);

  broadcast('CHAT_MESSAGE', msg);
  res.json({ success: true, message: msg });
});

// 7. Toggle mechanic online/offline
app.post('/api/mechanic/toggle-online', (req, res) => {
  const { online } = req.body;
  state.mechanicOnline = online;
  if (state.mechanics[0]) {
    state.mechanics[0].status = online ? 'online' : 'offline';
  }
  broadcast('MECHANIC_ONLINE_CHANGED', { online });
  res.json({ success: true, online });
});

// 8. Owner toggles mechanic verification
app.post('/api/mechanic/verify', (req, res) => {
  const { mechanicId } = req.body;
  const mech = state.mechanics.find((m) => m.id === mechanicId);
  if (mech) {
    mech.verified = !mech.verified;
    broadcast('MECHANIC_VERIFIED', mech);
  }
  res.json({ success: true, mechanic: mech });
});

// WebSocket Connection Handler
wss.on('connection', (ws) => {
  console.log('📱 New Device Connected to Realtime WebSocket Hub');
  // Send initial full state immediately upon connect
  ws.send(JSON.stringify({ type: 'SYNC_STATE', data: state }));

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      console.log('WS Received:', parsed.type);
    } catch (e) {}
  });

  ws.on('close', () => {
    console.log('Device disconnected');
  });
});

// Built-in Owner Web Dashboard UI
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Montir Siaga - Owner Live Command Center</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes pulseGlow { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .pulse-glow { animation: pulseGlow 1.5s infinite; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 font-sans p-6">
  <div class="max-w-6xl mx-auto">
    <!-- Top Bar -->
    <div class="flex items-center justify-between pb-6 border-b border-slate-800">
      <div class="flex items-center space-x-3">
        <div class="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-2xl font-bold">
          👑
        </div>
        <div>
          <h1 class="text-xl font-extrabold tracking-wide flex items-center gap-2">
            MONTIR SIAGA — OWNER LIVE COMMAND CENTER
            <span class="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-mono pulse-glow">LIVE SERVER AKTIF</span>
          </h1>
          <p class="text-xs text-slate-400 mt-0.5">Memantau aktivitas real-time antara HP 1 (Driver) dan HP 2 (Mekanik)</p>
        </div>
      </div>
      <div class="text-right">
        <div class="text-xs text-slate-400">Server Local IP:</div>
        <div class="text-sm font-mono font-bold text-sky-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">http://${LOCAL_IP}:${PORT}</div>
      </div>
    </div>

    <!-- Revenue Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <div class="bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-lg">
        <div class="text-xs font-bold text-amber-400 uppercase tracking-wider">Keuntungan Bersih Owner (15%)</div>
        <div class="text-3xl font-extrabold text-white mt-2" id="netRevenue">Rp ${Number(state.platformStats.platformNetRevenue).toLocaleString('id-ID')}</div>
        <div class="text-xs text-slate-400 mt-1">Otomatis dipotong dari setiap pesanan sukses</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Gross Transaksi (GMV)</div>
        <div class="text-2xl font-bold text-white mt-2" id="grossRevenue">Rp ${Number(state.platformStats.totalGrossRevenue).toLocaleString('id-ID')}</div>
        <div class="text-xs text-slate-500 mt-1">Total perputaran uang jasa darurat</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pesanan Selesai</div>
        <div class="text-2xl font-bold text-emerald-400 mt-2" id="totalOrders">${state.platformStats.totalOrders} Order</div>
        <div class="text-xs text-slate-500 mt-1">Tingkat keberhasilan 99.2%</div>
      </div>
    </div>

    <!-- Live Order Card -->
    <div class="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div class="flex items-center justify-between pb-4 border-b border-slate-800">
        <div class="flex items-center space-x-2">
          <span class="w-3 h-3 rounded-full bg-emerald-400 pulse-glow"></span>
          <h2 class="font-bold text-sm uppercase tracking-wider text-slate-200">Live Pesanan Darurat Berjalan (HP 1 ➔ HP 2)</h2>
        </div>
        <span id="orderStatusBadge" class="bg-slate-800 text-sky-400 text-xs px-3 py-1 rounded-full font-bold border border-slate-700">
          ${state.activeOrder ? state.activeOrder.status.toUpperCase() : 'STANDBY'}
        </span>
      </div>

      <div id="orderContent" class="mt-4">
        ${
          state.activeOrder
            ? `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2 text-xs">
              <div class="text-slate-400">ID Order: <span class="text-white font-bold font-mono">#${state.activeOrder.id}</span></div>
              <div class="text-slate-400">Kendala: <span class="text-white font-bold">${state.activeOrder.service?.title}</span></div>
              <div class="text-slate-400">Mobil: <span class="text-white font-bold">${state.activeOrder.vehicle}</span></div>
              <div class="text-slate-400">Lokasi: <span class="text-white">${state.activeOrder.userAddress}</span></div>
            </div>
            <div class="space-y-2 text-xs">
              <div class="text-slate-400">Montir Bertugas: <span class="text-emerald-400 font-bold">${state.activeOrder.mechanic ? state.activeOrder.mechanic.name : 'Mencari Montir...'}</span></div>
              <div class="text-slate-400">Total Biaya: <span class="text-amber-400 font-bold text-sm">Rp ${Number(state.activeOrder.price).toLocaleString('id-ID')}</span></div>
              <div class="text-slate-400">Komisi Owner (15%): <span class="text-emerald-400 font-bold text-sm">+Rp ${Number(state.activeOrder.platformFee).toLocaleString('id-ID')}</span></div>
              <div class="text-slate-400">Bagian Montir (85%): <span class="text-sky-400 font-bold">Rp ${Number(state.activeOrder.mechanicNet).toLocaleString('id-ID')}</span></div>
            </div>
          </div>
        `
            : `
          <div class="text-center py-8 text-slate-500 text-xs">
            <div class="text-3xl mb-2">🚗 📡 🏍️</div>
            Tekan <strong class="text-slate-300">"PANGGIL MONTIR"</strong> di HP 1 untuk memicu pesanan masuk ke HP 2 secara real-time!
          </div>
        `
        }
      </div>
    </div>

    <!-- Live Instructions -->
    <div class="mt-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-xs text-slate-300">
      <h3 class="font-bold text-sm text-white mb-2">Cara Menguji Simulasi 2 HP:</h3>
      <ol class="list-decimal list-inside space-y-1.5 text-slate-400">
        <li>Buka aplikasi di <strong class="text-white">HP 1</strong>, pilih mode <span class="text-amber-400 font-bold">Driver Mobil</span>.</li>
        <li>Buka aplikasi di <strong class="text-white">HP 2</strong>, pilih mode <span class="text-sky-400 font-bold">Mitra Mekanik</span> (pastikan status Online).</li>
        <li>Di <strong class="text-white">HP 1</strong>, tekan tombol <strong class="text-red-400">"PANGGIL MONTIR SEKARANG"</strong>.</li>
        <li>Lihat di <strong class="text-white">HP 2</strong>: Layar otomatis bergetar dan muncul pop-up order darurat!</li>
        <li>Tekan <strong class="text-emerald-400">"TERIMA ORDER"</strong> di HP 2 ➔ HP 1 langsung melihat montir menuju lokasi!</li>
      </ol>
    </div>
  </div>

  <script>
    // Live WebSocket connection for browser dashboard
    const ws = new WebSocket('ws://' + window.location.host);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Realtime event received:', data);
      location.reload();
    };
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
  console.log(`👑 Owner Web Dashboard: http://${LOCAL_IP}:${PORT}`);
  console.log(`🔌 WebSocket Server:     ws://${LOCAL_IP}:${PORT}`);
  console.log('==================================================');
  console.log('Status: Menunggu koneksi dari HP 1 (Driver) & HP 2 (Mekanik)...');
});
