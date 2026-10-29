import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const AppContext = createContext();

const DEFAULT_SERVER_IP = Platform.OS === 'web' ? 'localhost' : '192.168.1.104';
const SERVER_PORT = 4000;

export const INITIAL_MECHANICS = [
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
];

export const EMERGENCY_SERVICES = [
  {
    id: 'aki',
    title: 'Aki Soak / Baterai',
    desc: 'Jumper aki portable & tes voltase alternator',
    price: 85000,
    iconName: 'battery-charging',
    eta: '10-15 mnt',
    badge: 'Paling Sering',
  },
  {
    id: 'ban',
    title: 'Ban Bocor / Kempes',
    desc: 'Tambal tubeless darurat & ganti ban serep',
    price: 65000,
    iconName: 'disc-outline',
    eta: '12-18 mnt',
  },
  {
    id: 'mesin',
    title: 'Mesin Mati Mendadak',
    desc: 'Diagnostik pengapian, sekring & fuel pump',
    price: 120000,
    iconName: 'warning-outline',
    eta: '15-20 mnt',
  },
  {
    id: 'overheat',
    title: 'Mesin Overheat',
    desc: 'Pengecekan radiator, kebocoran & coolant',
    price: 95000,
    iconName: 'thermometer-outline',
    eta: '15-20 mnt',
  },
  {
    id: 'bbm',
    title: 'Kehabisan BBM',
    desc: 'Pengantaran bensin / solar jerigen 5 Liter',
    price: 55000,
    iconName: 'water-outline',
    eta: '12-15 mnt',
  },
  {
    id: 'derek',
    title: 'Truk Towing / Derek',
    desc: 'Gendong mobil mogok ke bengkel resmi terdekat',
    price: 350000,
    iconName: 'car-sport-outline',
    eta: '25-35 mnt',
    badge: 'Truk Siaga',
  },
];

export function AppProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(null);
  const [roleLoaded, setRoleLoaded] = useState(false);

  const [serverIP, setServerIP] = useState(DEFAULT_SERVER_IP);
  const [isConnectedToServer, setIsConnectedToServer] = useState(false);
  const wsRef = useRef(null);

  // Driver MontirPay Wallet (Default Rp 50.000)
  const [driverWallet, setDriverWallet] = useState(50000);

  // Shared state synchronized across devices
  const [activeOrder, setActiveOrder] = useState(null);
  const [mechanics, setMechanics] = useState(INITIAL_MECHANICS);
  const [mechanicOnline, setMechanicOnline] = useState(true);
  const [platformStats, setPlatformStats] = useState({
    totalOrders: 152,
    totalGrossRevenue: 15820000,
    adminFeePerOrder: 10000,
    platformNetRevenue: 1520000, // Pure Rp 10.000 x totalOrders
  });
  const [chatMessages, setChatMessages] = useState([
    { id: '1', sender: 'system', text: 'Montir Siaga 24 Jam siap membantu mobil mogok Anda.' },
  ]);

  const API_URL = `http://${serverIP}:${SERVER_PORT}`;
  const WS_URL = `ws://${serverIP}:${SERVER_PORT}`;

  useEffect(() => {
    async function loadData() {
      try {
        const savedRole = await AsyncStorage.getItem('@montir_siaga_device_role');
        if (savedRole) setCurrentRole(savedRole);
        const savedWallet = await AsyncStorage.getItem('@montir_siaga_driver_wallet');
        if (savedWallet) setDriverWallet(Number(savedWallet));
      } catch (e) {
      } finally {
        setRoleLoaded(true);
      }
    }
    loadData();
  }, []);

  const setCurrentRoleAndSave = async (role) => {
    setCurrentRole(role);
    try {
      await AsyncStorage.setItem('@montir_siaga_device_role', role);
    } catch (e) {}
  };

  const topUpDriverWallet = async (amount) => {
    const updated = driverWallet + amount;
    setDriverWallet(updated);
    try {
      await AsyncStorage.setItem('@montir_siaga_driver_wallet', updated.toString());
    } catch (e) {}
  };

  // WebSocket Connection
  useEffect(() => {
    let ws;
    let reconnectTimer;

    function connectWS() {
      try {
        ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnectedToServer(true);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.state) {
              if (message.state.activeOrder !== undefined) setActiveOrder(message.state.activeOrder);
              if (message.state.mechanics) setMechanics(message.state.mechanics);
              if (message.state.mechanicOnline !== undefined) setMechanicOnline(message.state.mechanicOnline);
              if (message.state.platformStats) setPlatformStats(message.state.platformStats);
              if (message.state.chatMessages) setChatMessages(message.state.chatMessages);
            }
          } catch (err) {}
        };

        ws.onerror = () => setIsConnectedToServer(false);
        ws.onclose = () => {
          setIsConnectedToServer(false);
          reconnectTimer = setTimeout(connectWS, 3000);
        };
      } catch (err) {
        setIsConnectedToServer(false);
        reconnectTimer = setTimeout(connectWS, 4000);
      }
    }

    connectWS();
    return () => {
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [serverIP]);

  // 1. Driver creates order with MontirPay (Admin Fee Rp 10.000 to Owner)
  const createOrder = async (service, locationText, coords, vehicleName, note) => {
    if (driverWallet < 10000) {
      return { success: false, error: 'SALDO_KURANG' };
    }

    const newWallet = driverWallet - 10000;
    setDriverWallet(newWallet);
    try {
      await AsyncStorage.setItem('@montir_siaga_driver_wallet', newWallet.toString());
    } catch (e) {}

    try {
      const res = await fetch(`${API_URL}/api/order/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, locationText, coords, vehicleName, note }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setActiveOrder(data.order);
        if (data.platformStats) setPlatformStats(data.platformStats);
      }
      return { success: true };
    } catch (e) {
      const fallbackOrder = {
        id: 'MS-' + Math.floor(1000 + Math.random() * 9000),
        service,
        userAddress: locationText || 'Jl. Jend. Sudirman Kav 52',
        userCoords: coords || { latitude: -6.2225, longitude: 106.8115 },
        vehicle: vehicleName,
        note: note || '',
        mechanic: null,
        status: 'searching',
        adminFee: 10000,
        adminFeePaid: true,
        paymentMethod: 'montirpay',
        mechanicEstimatedFee: service.price,
        mechanicBillAmount: service.price,
        mechanicBillNote: 'Jasa perbaikan standar darurat',
        qrisGenerated: false,
        qrisPaid: false,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setActiveOrder(fallbackOrder);
      setPlatformStats((prev) => ({
        ...prev,
        totalOrders: prev.totalOrders + 1,
        platformNetRevenue: prev.platformNetRevenue + 10000,
      }));
      return { success: true };
    }
  };

  const acceptOrder = async (mechanicId) => {
    try {
      const res = await fetch(`${API_URL}/api/order/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mechanicId: mechanicId || 'm1' }),
      });
      const data = await res.json();
      if (data.success) setActiveOrder(data.order);
    } catch (e) {
      if (activeOrder) {
        setActiveOrder({
          ...activeOrder,
          status: 'assigned',
          mechanic: mechanics[0],
        });
      }
    }
  };

  const updateOrderStatus = async (status) => {
    try {
      const res = await fetch(`${API_URL}/api/order/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) setActiveOrder(data.order);
    } catch (e) {
      if (activeOrder) setActiveOrder({ ...activeOrder, status });
    }
  };

  // 2. Mechanic generates bill & dynamic QRIS for driver
  const generateMechanicBill = async (billAmount, billNote) => {
    try {
      const res = await fetch(`${API_URL}/api/order/generate-bill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billAmount, billNote }),
      });
      const data = await res.json();
      if (data.success) setActiveOrder(data.order);
    } catch (e) {
      if (activeOrder) {
        setActiveOrder({
          ...activeOrder,
          mechanicBillAmount: Number(billAmount) || activeOrder.mechanicEstimatedFee,
          mechanicBillNote: billNote || 'Jasa servis montir',
          qrisGenerated: true,
          qrisCodeId: 'QRIS-' + Date.now(),
          status: 'billing',
        });
      }
    }
  };

  // 3. Driver pays QRIS bill (100% to mechanic wallet)
  const payQrisBill = async () => {
    try {
      const res = await fetch(`${API_URL}/api/order/pay-qris`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) setActiveOrder(data.order);
    } catch (e) {
      if (activeOrder) {
        const amount = activeOrder.mechanicBillAmount || activeOrder.mechanicEstimatedFee;
        setActiveOrder({
          ...activeOrder,
          qrisPaid: true,
          status: 'completed',
        });
        // Update local mechanic balance
        setMechanics((prev) =>
          prev.map((m) =>
            m.id === (activeOrder.mechanic?.id || 'm1')
              ? { ...m, walletBalance: m.walletBalance + amount, jobsCompleted: m.jobsCompleted + 1 }
              : m
          )
        );
      }
    }
  };

  const cancelOrder = async () => {
    const refunded = driverWallet + 10000;
    setDriverWallet(refunded);
    try {
      await AsyncStorage.setItem('@montir_siaga_driver_wallet', refunded.toString());
    } catch (e) {}

    try {
      await fetch(`${API_URL}/api/order/cancel`, { method: 'POST' });
    } catch (e) {}
    setActiveOrder(null);
  };

  const resetOrder = async () => {
    try {
      await fetch(`${API_URL}/api/order/reset`, { method: 'POST' });
    } catch (e) {}
    setActiveOrder(null);
  };

  const toggleMechanicOnline = async (val) => {
    setMechanicOnline(val);
    try {
      await fetch(`${API_URL}/api/mechanic/toggle-online`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ online: val }),
      });
    } catch (e) {}
  };

  const addChatMessage = async (sender, text) => {
    const newMsg = {
      id: Date.now().toString(),
      sender,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);

    try {
      await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, text }),
      });
    } catch (e) {}
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRoleAndSave,
        roleLoaded,
        serverIP,
        setServerIP,
        isConnectedToServer,
        driverWallet,
        topUpDriverWallet,
        activeOrder,
        mechanics,
        mechanicOnline,
        setMechanicOnline: toggleMechanicOnline,
        platformStats,
        chatMessages,
        createOrder,
        acceptOrder,
        updateOrderStatus,
        generateMechanicBill,
        payQrisBill,
        cancelOrder,
        resetOrder,
        addChatMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
