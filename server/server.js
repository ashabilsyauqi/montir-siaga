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

// Central Realtime State (Sesuai Kurikulum Dewakoding: 3 Role, OSM Maps, FCM Notif, Rating)
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
      specialty: 'Aki & Kelistrikan Mobil',
      walletBalance: 485000,
      coords: { latitude: -6.2215, longitude: 106.8165 },
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
      specialty: 'Ban Bocor & Overheat Radiator',
      walletBalance: 320000,
      coords: { latitude: -6.2290, longitude: 106.8090 },
    },
  ],
  mechanicOnline: true,
  platformStats: {
    totalOrders: 152,
    totalGrossRevenue: 15820000,
    adminFeePerOrder: 10000,
    platformNetRevenue: 1520000, // Pure Rp 10.000 x totalOrders
  },
  chatMessages: [
    { id: '1', sender: 'system', text: 'Sistem Montir Siaga aktif. Biaya admin platform Rp 10.000 per pemanggilan.' },
  ],
  orderHistory: [
    {
      id: 'MS-8921',
      date: 'Hari ini, 14:20',
      driver: 'Toyota Avanza (B 1234 SKA)',
      damage: 'Aki soak tidak bisa starter',
      mechanic: 'Pak Agus Santoso',
      adminFee: 10000,
      mechanicBill: 85000,
      status: 'SELESAI (LUNAS)',
    },
    {
      id: 'MS-8919',
      date: 'Hari ini, 11:05',
      driver: 'Toyota Innova (B 8821 KLO)',
      damage: 'Ban bocor kena baut tajam',
      mechanic: 'Bambang Irawan',
      adminFee: 10000,
      mechanicBill: 65000,
      status: 'SELESAI (LUNAS)',
    },
    {
      id: 'MS-8915',
      date: 'Kemarin, 21:40',
      driver: 'Mitsubishi Xpander (B 4410 ZAQ)',
      damage: 'Mesin overheat di tol',
      mechanic: 'Pak Agus Santoso',
      adminFee: 10000,
      mechanicBill: 120000,
      status: 'SELESAI (LUNAS)',
    },
  ],
  // Dewakoding Modul 8: Fitur Rating & Komentar
  reviews: [
    {
      id: 'rev-1',
      orderId: 'MS-8921',
      driverName: 'Toyota Avanza (B 1234 SKA)',
      mechanicName: 'Pak Agus Santoso',
      rating: 5,
      comment: 'Cepat sekali sampai dalam 10 menit, akinya langsung di-jumper hidup kembali. Sangat profesional!',
      time: 'Hari ini, 14:35',
    },
    {
      id: 'rev-2',
      orderId: 'MS-8919',
      driverName: 'Toyota Innova (B 8821 KLO)',
      mechanicName: 'Bambang Irawan',
      rating: 5,
      comment: 'Tambal ban tubeless darurat cepat dan rapi. Alat-alatnya lengkap.',
      time: 'Hari ini, 11:25',
    },
    {
      id: 'rev-3',
      orderId: 'MS-8915',
      driverName: 'Mitsubishi Xpander (B 4410 ZAQ)',
      mechanicName: 'Pak Agus Santoso',
      rating: 4.8,
      comment: 'Radiator mendidih di bahu jalan tol, untung cepat datang bawa coolant cadangan. Mantap!',
      time: 'Kemarin, 22:15',
    },
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

// 1. Driver creates emergency order with MontirPay (Rp 10.000 to Owner)
app.post('/api/order/create', (req, res) => {
  const { service, locationText, coords, vehicleName, note } = req.body;

  const newOrder = {
    id: 'MS-' + Math.floor(1000 + Math.random() * 9000),
    service: service || { id: 'emergency_call', title: 'Panggilan Montir Siaga', price: 85000 },
    userAddress: locationText || 'Jl. Sudirman No. 45, Jakarta Selatan',
    userCoords: coords || { latitude: -6.2255, longitude: 106.8120 },
    vehicle: vehicleName || 'Toyota Avanza 1.3 G (B 1234 SKA)',
    note: note || 'Aki soak tidak bisa starter',
    mechanic: null,
    status: 'searching', // searching -> assigned -> arrived -> repairing -> billing -> completed
    adminFee: 10000,
    adminFeePaid: true,
    paymentMethod: 'montirpay',
    mechanicEstimatedFee: service?.price || 85000,
    mechanicBillAmount: service?.price || 85000,
    mechanicBillNote: 'Jasa servis darurat montir',
    qrisGenerated: false,
    qrisPaid: false,
    ratingSubmitted: false,
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  state.activeOrder = newOrder;
  state.platformStats.totalOrders += 1;
  state.platformStats.platformNetRevenue += 10000;

  state.chatMessages.push({
    id: Date.now().toString(),
    sender: 'system',
    text: `Panggilan darurat dibuat untuk ${newOrder.vehicle}. Biaya admin Rp 10.000 telah disetorkan ke kas Owner.`,
  });

  console.log(`[ORDER] Created #${newOrder.id} - Admin Rp 10k into Owner Cash!`);
  broadcast('ORDER_CREATED', { order: newOrder, platformStats: state.platformStats });
  res.json({ success: true, order: newOrder, platformStats: state.platformStats });
});

// 2. Mechanic accepts order
app.post('/api/order/accept', (req, res) => {
  if (!state.activeOrder) {
    return res.status(400).json({ error: 'No active order' });
  }

  const { mechanicId } = req.body;
  const mech = state.mechanics.find((m) => m.id === mechanicId) || state.mechanics[0];

  state.activeOrder.mechanic = mech;
  state.activeOrder.status = 'assigned';

  state.chatMessages.push({
    id: Date.now().toString(),
    sender: 'system',
    text: `${mech.name} telah menerima panggilan Anda dan sedang meluncur ke lokasi!`,
  });

  console.log(`[ORDER] Accepted by ${mech.name}`);
  broadcast('ORDER_ACCEPTED', { order: state.activeOrder });
  res.json({ success: true, order: state.activeOrder });
});

// 3. Update order status (arrived, repairing)
app.post('/api/order/status', (req, res) => {
  if (!state.activeOrder) {
    return res.status(400).json({ error: 'No active order' });
  }

  const { status } = req.body;
  state.activeOrder.status = status;

  let msgText = `Status pesanan: ${status}`;
  if (status === 'arrived') msgText = `${state.activeOrder.mechanic?.name || 'Montir'} telah tiba di lokasi mobil mogok!`;
  if (status === 'repairing') msgText = `Montir sedang melakukan perbaikan dan pengecekan kendaraan.`;

  state.chatMessages.push({
    id: Date.now().toString(),
    sender: 'system',
    text: msgText,
  });

  console.log(`[ORDER] Status changed to ${status}`);
  broadcast('ORDER_STATUS_CHANGED', { order: state.activeOrder });
  res.json({ success: true, order: state.activeOrder });
});

// 4. Mechanic generates bill & dynamic QRIS
app.post('/api/order/generate-bill', (req, res) => {
  if (!state.activeOrder) {
    return res.status(400).json({ error: 'No active order' });
  }

  const { billAmount, billNote } = req.body;
  const numBill = Number(billAmount) || state.activeOrder.mechanicEstimatedFee || 85000;

  state.activeOrder.mechanicBillAmount = numBill;
  state.activeOrder.mechanicBillNote = billNote || 'Jasa perbaikan & penggantian part darurat';
  state.activeOrder.qrisGenerated = true;
  state.activeOrder.qrisCodeId = 'QRIS-' + Date.now();
  state.activeOrder.status = 'billing';

  state.chatMessages.push({
    id: Date.now().toString(),
    sender: 'system',
    text: `Tagihan QRIS diterbitkan montir sebesar Rp ${numBill.toLocaleString('id-ID')}. Silakan scan & bayar langsung ke montir.`,
  });

  console.log(`[BILL] Mechanic generated bill Rp ${numBill} QRIS for order #${state.activeOrder.id}`);
  broadcast('BILL_GENERATED', { order: state.activeOrder });
  res.json({ success: true, order: state.activeOrder });
});

// 5. Driver pays QRIS bill (100% to mechanic wallet)
app.post('/api/order/pay-qris', (req, res) => {
  if (!state.activeOrder) {
    return res.status(400).json({ error: 'No active order' });
  }

  const billAmount = state.activeOrder.mechanicBillAmount || 85000;
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

  // Prepend to order history
  if (state.orderHistory) {
    state.orderHistory.unshift({
      id: state.activeOrder.id,
      date: 'Hari ini, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      driver: state.activeOrder.vehicle || 'Pengemudi Mobil',
      damage: state.activeOrder.note || state.activeOrder.service?.title || 'Perbaikan Darurat',
      mechanic: state.activeOrder.mechanic?.name || 'Pak Agus Santoso',
      adminFee: 10000,
      mechanicBill: billAmount,
      status: 'SELESAI (LUNAS)',
    });
  }

  console.log(`[QRIS] Driver paid Rp ${billAmount} via QRIS -> 100% to mechanic!`);
  broadcast('QRIS_PAID', { order: state.activeOrder, mechanics: state.mechanics, orderHistory: state.orderHistory });
  res.json({ success: true, order: state.activeOrder });
});

// 6. Dewakoding Modul 8: Submit Rating & Review
app.post('/api/order/rate', (req, res) => {
  const { orderId, rating, comment, mechanicId } = req.body;
  const numRating = Number(rating) || 5;

  const newReview = {
    id: 'rev-' + Date.now(),
    orderId: orderId || (state.activeOrder ? state.activeOrder.id : 'MS-LIVE'),
    driverName: state.activeOrder?.vehicle || 'Pengemudi Mobil',
    mechanicName: state.activeOrder?.mechanic?.name || 'Pak Agus Santoso',
    rating: numRating,
    comment: comment || 'Pelayanan cepat dan sangat profesional!',
    time: 'Baru saja',
  };

  state.reviews.unshift(newReview);

  // Recalculate average rating for mechanic
  const mech = state.mechanics.find((m) => m.id === (mechanicId || state.activeOrder?.mechanic?.id || 'm1'));
  if (mech) {
    const mechReviews = state.reviews.filter((r) => r.mechanicName === mech.name);
    const avg = (mechReviews.reduce((sum, r) => sum + r.rating, 0) / mechReviews.length).toFixed(1);
    mech.rating = parseFloat(avg);
  }

  if (state.activeOrder) {
    state.activeOrder.ratingSubmitted = true;
  }

  console.log(`[RATING] New review ⭐ ${numRating} for ${newReview.mechanicName}: "${newReview.comment}"`);
  broadcast('ORDER_RATED', { review: newReview, mechanics: state.mechanics, reviews: state.reviews });
  res.json({ success: true, review: newReview });
});

// 7. Dewakoding Modul 6: OSRM Route Proxy (OpenStreetMap Routing)
app.get('/api/route/osrm', async (req, res) => {
  const { startLon, startLat, endLon, endLat } = req.query;
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch OSRM route' });
  }
});

// 8. Sweep all petty cash (Owner Pin 1234)
app.post('/api/petty-cash/sweep', (req, res) => {
  const { pin } = req.body;
  if (pin !== '1234') {
    return res.status(403).json({ success: false, error: 'PIN Keamanan Salah! Akses ditolak.' });
  }
  const amount = state.platformStats.platformNetRevenue || 0;
  if (amount <= 0) {
    return res.status(400).json({ success: false, error: 'Saldo kas saat ini Rp 0. Tidak ada dana yang bisa ditarik.' });
  }
  state.platformStats.platformNetRevenue = 0;
  console.log('[PETTY CASH] Owner successfully swept all cash: Rp ' + amount.toLocaleString('id-ID'));
  broadcast('CASH_SWEPT', { platformStats: state.platformStats });
  res.json({ success: true, amountWithdrawn: amount });
});

// 9. Cancel & Reset order
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

app.post('/api/order/reset', (req, res) => {
  state.activeOrder = null;
  console.log('[ORDER] Reset to idle');
  broadcast('ORDER_RESET', null);
  res.json({ success: true });
});

// 10. Toggle mechanic online
app.post('/api/mechanic/toggle-online', (req, res) => {
  state.mechanicOnline = req.body.online !== undefined ? req.body.online : !state.mechanicOnline;
  broadcast('MECHANIC_STATUS_CHANGED', { mechanicOnline: state.mechanicOnline });
  res.json({ success: true, mechanicOnline: state.mechanicOnline });
});

// 11. Chat message
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
app.get('/scan', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Scan QR Code Expo Go — Montir Siaga</title>
  <style>
    body { background: #0b0f19; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #111827; border: 1.5px solid #1f2937; border-radius: 28px; padding: 32px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
    .badge { display: inline-block; background: rgba(0, 170, 19, 0.15); color: #00AA13; border: 1px solid rgba(0, 170, 19, 0.3); font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px; }
    h1 { font-size: 20px; font-weight: 900; margin-bottom: 6px; }
    p { font-size: 13px; color: #94a3b8; line-height: 18px; margin-bottom: 20px; }
    .qr-wrap { background: #ffffff; padding: 18px; border-radius: 20px; display: inline-block; margin-bottom: 20px; box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
    .qr-img { width: 280px; height: 280px; display: block; }
    .url-box { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 10px 14px; font-family: monospace; font-size: 13px; color: #38bdf8; word-break: break-all; margin-bottom: 20px; }
    .steps { text-align: left; background: #1f2937; border-radius: 14px; padding: 14px 16px; font-size: 12px; color: #cbd5e1; line-height: 20px; margin-bottom: 20px; }
    .btn { display: block; background: #00AA13; color: white; padding: 12px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">EXPO GO SCANNER</div>
    <h1>Scan untuk Uji di HP Anda</h1>
    <p>Arahkan kamera ponsel atau aplikasi Expo Go ke QR code di bawah ini.</p>
    
    <div class="qr-wrap">
      <img src="/mockup/expo_qr_code.png" alt="Expo Go QR Code" class="qr-img" />
    </div>

    <div class="url-box">
      exp://${LOCAL_IP}:8081
    </div>

    <div class="steps">
      <strong>📱 Panduan Buka di HP:</strong><br/>
      1. Pastikan HP dan PC terhubung ke Wi-Fi yang sama (<strong>192.168.1.xxx</strong>).<br/>
      2. <strong>Android:</strong> Buka aplikasi <strong>Expo Go</strong>, lalu pilih <em>"Scan QR code"</em>.<br/>
      3. <strong>iOS / iPhone:</strong> Buka aplikasi <strong>Kamera bawaan</strong> iPhone dan arahkan ke QR code.
    </div>

    <a href="/emulator" class="btn">Atau Buka Emulator PC ➔</a>
  </div>
</body>
</html>
  `);
});

app.get('/emulator', (req, res) => {
  res.sendFile(path.join(__dirname, '../mockup_web/emulator.html'));
});

// Web Owner: Laravel Filament 3 Admin Panel Interface (Dewakoding Module 2, 4, 7 & 8)
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="id" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Montir Siaga — Laravel Filament 3 Admin Panel</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #090d16; color: #f1f5f9; min-height: 100vh; display: flex; }
    
    /* Filament 3 Dark Sidebar */
    aside {
      width: 270px;
      background-color: #0f172a;
      border-right: 1px solid #1e293b;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .brand-header {
      padding: 18px 20px;
      border-bottom: 1px solid #1e293b;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 12px rgba(220,38,38,0.3);
    }
    .brand-title { font-size: 14px; font-weight: 900; color: #ffffff; letter-spacing: 0.3px; }
    .brand-sub { font-size: 10px; color: #f87171; font-weight: 800; text-transform: uppercase; }
    
    .sidebar-nav { padding: 16px 12px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
    .nav-group-title { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; padding: 12px 12px 6px 12px; }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 10px;
      color: #94a3b8;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }
    .nav-item:hover { background-color: #1e293b; color: #f8fafc; }
    .nav-item.active { background-color: #dc2626; color: #ffffff; box-shadow: 0 4px 14px rgba(220,38,38,0.3); }
    .nav-badge { margin-left: auto; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; }
    
    /* Top Bar */
    .main-wrap { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    header {
      height: 64px;
      background-color: #0f172a;
      border-bottom: 1px solid #1e293b;
      padding: 0 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .breadcrumb-row { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 700; color: #64748b; }
    .breadcrumb-active { color: #f8fafc; }
    .top-actions { display: flex; align-items: center; gap: 14px; }
    .emulator-btn {
      background: linear-gradient(135deg, #00aa13 0%, #15803d 100%);
      color: #ffffff;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 800;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 12px rgba(0,170,19,0.3);
      transition: all 0.2s;
    }
    .emulator-btn:hover { opacity: 0.95; transform: translateY(-1px); }
    .user-pill { display: flex; align-items: center; gap: 10px; background: #1e293b; padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: 800; }
    
    /* Page Content */
    main { flex: 1; padding: 24px 28px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
    
    /* Filament Stats Overview Widgets */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 16px; }
    .stat-card {
      background-color: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }
    .stat-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; }
    .stat-val { font-size: 26px; font-weight: 900; color: #ffffff; margin: 8px 0 4px 0; }
    .stat-sub { font-size: 11px; display: flex; align-items: center; gap: 6px; }
    .stat-badge-green { color: #34d399; font-weight: 800; }
    .stat-badge-red { color: #f87171; font-weight: 800; }
    
    /* Section Card */
    .card-panel {
      background-color: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 18px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    }
    .card-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .card-title-box { display: flex; align-items: center; gap: 10px; }
    .card-icon { font-size: 20px; }
    .card-title { font-size: 14px; font-weight: 900; color: #ffffff; }
    .card-desc { font-size: 11px; color: #64748b; margin-top: 1px; }
    
    /* OSM Live Map Widget (Dewakoding Module 7) */
    #adminMap { width: 100%; height: 320px; border-radius: 14px; z-index: 10; border: 1px solid #334155; }
    
    /* Filament Resource Tables */
    .filament-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .filament-table th { background: #1e293b; color: #94a3b8; font-weight: 800; text-transform: uppercase; font-size: 10.5px; padding: 12px 14px; text-align: left; }
    .filament-table td { padding: 14px; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
    .filament-table tr:hover td { background-color: rgba(30, 41, 59, 0.4); }
    
    .status-pill { font-size: 10.5px; font-weight: 800; padding: 3px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px; }
    .pill-green { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .pill-red { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .pill-blue { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
    
    /* Action Buttons */
    .btn-sweep {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      border: none;
      padding: 9px 18px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 900;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 12px rgba(16,185,129,0.3);
      transition: all 0.2s;
    }
    .btn-sweep:hover { opacity: 0.92; transform: translateY(-1px); }
  </style>
</head>
<body>

  <!-- Sidebar -->
  <aside>
    <div class="brand-header">
      <div class="brand-logo">🔧</div>
      <div>
        <div class="brand-title">MONTIR SIAGA</div>
        <div class="brand-sub">Filament 3 Superadmin</div>
      </div>
    </div>

    <div class="sidebar-nav">
      <div class="nav-group-title">Menu Utama</div>
      <a href="#overview" class="nav-item active">
        <span>📊</span> Dashboard Overview
      </a>
      <a href="#mapWidgetSection" class="nav-item">
        <span>🗺️</span> Peta Sebaran Armada
        <span class="nav-badge pill-green">LIVE</span>
      </a>

      <div class="nav-group-title">Master Resource (Dewakoding)</div>
      <a href="#mechanicsTable" class="nav-item">
        <span>👨‍🔧</span> Master Mitra Montir
        <span class="nav-badge pill-blue">${state.mechanics.length} Mitra</span>
      </a>
      <a href="#ordersTable" class="nav-item">
        <span>📋</span> Master Riwayat Order
        <span class="nav-badge pill-green">${state.orderHistory.length}</span>
      </a>
      <a href="#reviewsTable" class="nav-item">
        <span>⭐</span> Master Rating & Ulasan
        <span class="nav-badge pill-green">${state.reviews.length} Ulasan</span>
      </a>

      <div class="nav-group-title">Finansial & Keuangan</div>
      <a href="#pettyCashBox" class="nav-item">
        <span>🏦</span> Peti Kas & Penarikan
        <span class="nav-badge pill-green">Rp 10.000 / order</span>
      </a>
    </div>

    <div style="padding: 16px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b;">
      <div>Platform: <strong>Laravel 11 + Filament 3 Architecture</strong></div>
      <div style="margin-top: 2px;">Local IP: <span style="color:#38bdf8;">${LOCAL_IP}:${PORT}</span></div>
    </div>
  </aside>

  <!-- Main Wrap -->
  <div class="main-wrap">
    <!-- Header Topbar -->
    <header>
      <div class="breadcrumb-row">
        <span>Aplikasi</span>
        <span>/</span>
        <span class="breadcrumb-active">Dashboard Filament</span>
      </div>

      <div class="top-actions">
        <a href="/emulator" target="_blank" class="emulator-btn">
          <span>📱</span> Buka HP Emulator PC
        </a>
        <div class="user-pill">
          <span>👑</span> Super Admin (Owner)
        </div>
      </div>
    </header>

    <!-- Content -->
    <main>
      <!-- Stats Overview (Filament 3 Cards) -->
      <div class="stats-grid" id="overview">
        <div class="stat-card">
          <div class="stat-title">Peti Kas Owner (Admin 10K)</div>
          <div class="stat-val" style="color: #34d399;">Rp ${Number(state.platformStats.platformNetRevenue).toLocaleString('id-ID')}</div>
          <div class="stat-sub">
            <span class="stat-badge-green">🔒 100% Hak Owner</span>
            <span style="color: #64748b;">• Rp 10.000 / order</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-title">Total Transaksi Selesai</div>
          <div class="stat-val">${state.platformStats.totalOrders} Order</div>
          <div class="stat-sub">
            <span class="stat-badge-green">↑ 99.4%</span>
            <span style="color: #64748b;">Tingkat keberhasilan</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-title">Mitra Montir Siaga</div>
          <div class="stat-val" style="color: #38bdf8;">${state.mechanics.length} Bengkel & Montir</div>
          <div class="stat-sub">
            <span class="stat-badge-green">● Online Standby</span>
            <span style="color: #64748b;">di Jabodetabek</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-title">Rating Kepuasan (Dewakoding)</div>
          <div class="stat-val" style="color: #fbbf24;">⭐ 4.9 <span style="font-size:14px; color:#94a3b8; font-weight:normal;">/ 5.0</span></div>
          <div class="stat-sub">
            <span class="stat-badge-green">${state.reviews.length} Ulasan Masuk</span>
            <span style="color: #64748b;">Bintang 5</span>
          </div>
        </div>
      </div>

      <!-- Dewakoding Modul 7: Membuat Widget Maps pada Dashboard -->
      <div class="card-panel" id="mapWidgetSection">
        <div class="card-header-row">
          <div class="card-title-box">
            <span class="card-icon">🗺️</span>
            <div>
              <div class="card-title">WIDGET MAPS PADA DASHBOARD (OPENSTREETMAP LIVE RADAR)</div>
              <div class="card-desc">Memantau lokasi montir siaga dan armada darurat di jalan secara real-time tanpa biaya Google Maps API</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <span class="status-pill pill-green">🛰️ OSM Radar Aktif</span>
            <span class="status-pill pill-blue">Radius 5 KM</span>
          </div>
        </div>

        <div id="adminMap"></div>
      </div>

      <!-- Peti Kas & Quick Withdrawal Box -->
      <div class="card-panel" id="pettyCashBox" style="background: linear-gradient(135deg, #131d33 0%, #0f172a 100%); border-color: #10b981;">
        <div class="card-header-row">
          <div class="card-title-box">
            <span class="card-icon">🏦</span>
            <div>
              <div class="card-title" style="color: #34d399;">PETI KAS & SALDO ADMIN OWNER</div>
              <div class="card-desc">Seluruh potongan admin Rp 10.000 tersimpan aman dan siap ditarik kapan saja</div>
            </div>
          </div>

          <button onclick="handleSweepCash()" class="btn-sweep">
            <span>💸</span> Ambil Semua Cash
          </button>
        </div>

        <div style="display: flex; align-items: baseline; gap: 14px; margin-top: 4px;">
          <div style="font-size: 32px; font-weight: 900; color: #34d399;">
            Rp ${Number(state.platformStats.platformNetRevenue).toLocaleString('id-ID')}
          </div>
          <div style="font-size: 12px; color: #94a3b8;">
            * Memerlukan verifikasi PIN Keamanan Owner (<strong>PIN: 1234</strong>)
          </div>
        </div>
      </div>

      <!-- Master Data Resource: Mitra Montir (Dewakoding Module 2) -->
      <div class="card-panel" id="mechanicsTable">
        <div class="card-header-row">
          <div class="card-title-box">
            <span class="card-icon">👨‍🔧</span>
            <div>
              <div class="card-title">MASTER RESOURCE: MITRA MONTIR & BENGKEL</div>
              <div class="card-desc">Daftar mekanik resmi rekanan dengan rincian pendapatan jasa QRIS 100%</div>
            </div>
          </div>
          <span class="status-pill pill-blue">${state.mechanics.length} Mitra Terdaftar</span>
        </div>

        <div style="overflow-x: auto;">
          <table class="filament-table">
            <thead>
              <tr>
                <th>Nama Montir / Bengkel</th>
                <th>Kontak / HP</th>
                <th>Armada Kendaraan</th>
                <th>Spesialisasi</th>
                <th>Rating</th>
                <th>Total Servis</th>
                <th>Status</th>
                <th style="text-align: right;">Dompet Jasa QRIS</th>
              </tr>
            </thead>
            <tbody>
              ${state.mechanics.map(m => `
                <tr>
                  <td style="font-weight: 800; color: #ffffff;">👨‍🔧 ${m.name}</td>
                  <td style="font-family: monospace;">${m.phone}</td>
                  <td>🛵 ${m.vehicle}</td>
                  <td style="color: #94a3b8;">${m.specialty}</td>
                  <td style="color: #fbbf24; font-weight: 800;">⭐ ${m.rating}</td>
                  <td>${m.jobsCompleted} order</td>
                  <td>
                    <span class="status-pill ${m.status === 'online' ? 'pill-green' : 'pill-red'}">
                      ● ${m.status.toUpperCase()}
                    </span>
                  </td>
                  <td style="text-align: right; font-weight: 900; color: #38bdf8;">
                    Rp ${Number(m.walletBalance).toLocaleString('id-ID')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Master Data Resource: Riwayat Order Booking (Dewakoding Module 2) -->
      <div class="card-panel" id="ordersTable">
        <div class="card-header-row">
          <div class="card-title-box">
            <span class="card-icon">📋</span>
            <div>
              <div class="card-title">MASTER RESOURCE: RIWAYAT SEMUA ORDER PEMANGGILAN</div>
              <div class="card-desc">Pencatatan transparan biaya admin owner Rp 10.000 & pendapatan jasa montir</div>
            </div>
          </div>
          <span class="status-pill pill-green">${state.orderHistory.length} Riwayat</span>
        </div>

        <div style="overflow-x: auto;">
          <table class="filament-table">
            <thead>
              <tr>
                <th>ID Order</th>
                <th>Waktu</th>
                <th>Kendaraan Mobil</th>
                <th>Kendala / Kerusakan</th>
                <th>Montir Pelaksana</th>
                <th style="text-align: right;">Admin Owner</th>
                <th style="text-align: right;">Jasa Montir</th>
                <th style="text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${state.orderHistory.map(o => `
                <tr>
                  <td style="font-family: monospace; font-weight: 900; color: #fbbf24;">#${o.id}</td>
                  <td style="color: #94a3b8;">${o.date}</td>
                  <td style="font-weight: 800; color: #ffffff;">🚘 ${o.driver}</td>
                  <td>${o.damage}</td>
                  <td>👨‍🔧 ${o.mechanic}</td>
                  <td style="text-align: right; font-weight: 900; color: #34d399;">+Rp ${Number(o.adminFee).toLocaleString('id-ID')}</td>
                  <td style="text-align: right; font-weight: 800; color: #38bdf8;">Rp ${Number(o.mechanicBill).toLocaleString('id-ID')}</td>
                  <td style="text-align: center;">
                    <span class="status-pill pill-green">✓ ${o.status}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Dewakoding Modul 8: Master Rating & Comment Customer -->
      <div class="card-panel" id="reviewsTable">
        <div class="card-header-row">
          <div class="card-title-box">
            <span class="card-icon">⭐</span>
            <div>
              <div class="card-title">MASTER RESOURCE: RATING & ULASAN DRIVER (DEWAKODING MODUL 8)</div>
              <div class="card-desc">Ulasan bintang dan testimoni langsung dari pengemudi mobil setelah pekerjaan selesai</div>
            </div>
          </div>
          <span class="status-pill pill-green">${state.reviews.length} Testimoni</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${state.reviews.map(r => `
            <div style="background: #1e293b; border-radius: 12px; padding: 14px 16px; border: 1px solid #334155;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <strong style="color: #ffffff; font-size: 13px;">🚘 ${r.driverName}</strong>
                  <span style="font-size: 11px; color: #94a3b8;">➔ kepada 👨‍🔧 ${r.mechanicName}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="color: #fbbf24; font-weight: 900; font-size: 13px;">${'★'.repeat(Math.round(r.rating))}</span>
                  <span style="font-size: 11px; color: #64748b;">(${r.time})</span>
                </div>
              </div>
              <p style="font-size: 12px; color: #cbd5e1; font-style: italic;">"${r.comment}"</p>
            </div>
          `).join('')}
        </div>
      </div>

    </main>
  </div>

  <script>
    // 1. Initialize Filament Widget Maps (Dewakoding Module 7)
    const adminMap = L.map('adminMap', { zoomControl: true }).setView([-6.2235, 106.8140], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', { maxZoom: 19, subdomains: 'abc' }).addTo(adminMap);

    // Markers for Mechanics
    const mech1 = L.marker([-6.2215, 106.8165], {
      icon: L.divIcon({
        className: 'admin-marker-mech',
        html: '<div style="background:#dc2626; color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:16px; border:2px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.5);">👨‍🔧</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    }).addTo(adminMap).bindPopup('<strong>Pak Agus Santoso</strong><br>Vario B 4921 TZX<br><span style="color:#10b981;">Online Standby</span>');

    const mech2 = L.marker([-6.2290, 106.8090], {
      icon: L.divIcon({
        className: 'admin-marker-mech',
        html: '<div style="background:#0284c7; color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:16px; border:2px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.5);">👨‍🔧</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    }).addTo(adminMap).bindPopup('<strong>Bambang Irawan</strong><br>NMAX B 3310 PQR<br><span style="color:#10b981;">Online Standby</span>');

    // Marker for Broken Car
    const car = L.marker([-6.2255, 106.8120], {
      icon: L.divIcon({
        className: 'admin-marker-car',
        html: '<div style="background:#16a34a; color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:16px; border:2px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.5);">🚘</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    }).addTo(adminMap).bindPopup('<strong>Toyota Avanza (B 1234 SKA)</strong><br>Kendala: Aki soak<br>Biaya Admin: Rp 10.000 (Lunas)');

    // Real OSRM Route Line
    fetch('/api/route/osrm?startLon=106.8165&startLat=-6.2215&endLon=106.8120&endLat=-6.2255')
      .then(r => r.json())
      .then(data => {
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          L.polyline(coords, { color: '#00AA13', weight: 5, opacity: 0.85 }).addTo(adminMap);
        }
      })
      .catch(() => {
        L.polyline([[-6.2215, 106.8165], [-6.2255, 106.8120]], { color: '#00AA13', weight: 4, dashArray: '5, 10' }).addTo(adminMap);
      });

    // 2. WebSocket Auto-reload
    const ws = new WebSocket('ws://' + window.location.host);
    ws.onmessage = () => location.reload();

    // 3. Petty Cash Sweep PIN Verification
    function handleSweepCash() {
      const pin = prompt('Masukkan 4 Digit PIN Keamanan Owner untuk Menarik Seluruh Kas:');
      if (!pin) return;
      if (pin !== '1234') {
        alert('PIN Keamanan Salah! Akses ditolak.');
        return;
      }
      fetch('/api/petty-cash/sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin })
      })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          alert('Berhasil! Seluruh kas sebesar Rp ' + Number(d.amountWithdrawn).toLocaleString('id-ID') + ' telah ditarik ke rekening Owner.');
          location.reload();
        } else {
          alert(d.error || 'Gagal menarik kas');
        }
      })
      .catch(() => alert('Terjadi kesalahan jaringan'));
    }
  </script>
</body>
</html>
  `);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('================================================================');
  console.log('🚗 MONTIR SIAGA — LARAVEL FILAMENT 3 ARCHITECTURE SERVER 🚗');
  console.log('================================================================');
  console.log(`📡 Local Network Server: http://${LOCAL_IP}:${PORT}`);
  console.log(`👑 Filament Superadmin: http://${LOCAL_IP}:${PORT}`);
  console.log(`📱 Smartphone Emulator: http://${LOCAL_IP}:${PORT}/emulator`);
  console.log(`🔌 WebSocket Server:     ws://${LOCAL_IP}:${PORT}`);
  console.log('================================================================');
});
