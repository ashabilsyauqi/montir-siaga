import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

// Default Local IP of Mac on Wi-Fi (Automatically connects both phones)
const DEFAULT_SERVER_IP = '192.168.1.106';
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
];

export const EMERGENCY_SERVICES = [
  {
    id: 'aki',
    title: 'Aki Soak / Baterai',
    desc: 'Jumper aki portable & tes voltase alternator',
    price: 85000,
    icon: '🔋',
    eta: '10-15 mnt',
    badge: 'Paling Sering',
  },
  {
    id: 'ban',
    title: 'Ban Bocor / Kempes',
    desc: 'Tambal tubeless darurat & ganti ban serep',
    price: 65000,
    icon: '🛞',
    eta: '12-18 mnt',
  },
  {
    id: 'mesin',
    title: 'Mesin Mati Mendadak',
    desc: 'Diagnostik pengapian, sekring & fuel pump',
    price: 120000,
    icon: '⚙️',
    eta: '15-20 mnt',
  },
  {
    id: 'overheat',
    title: 'Mesin Overheat',
    desc: 'Pengecekan radiator, kebocoran selang & coolant',
    price: 95000,
    icon: '🌡️',
    eta: '15-20 mnt',
  },
  {
    id: 'bbm',
    title: 'Kehabisan BBM',
    desc: 'Pengantaran bensin / solar jerigen 5 Liter',
    price: 55000,
    icon: '🛢️',
    eta: '12-15 mnt',
  },
  {
    id: 'derek',
    title: 'Truk Towing / Derek',
    desc: 'Gendong mobil mogok ke bengkel resmi terdekat',
    price: 350000,
    icon: '🪝',
    eta: '25-35 mnt',
    badge: 'Truk Siaga',
  },
];

export function AppProvider({ children }) {
  // Device Role: 'driver' | 'mechanic' | 'owner' | null (null shows Role Selector)
  const [currentRole, setCurrentRole] = useState(null);
  const [roleLoaded, setRoleLoaded] = useState(false);

  // Network & Server
  const [serverIP, setServerIP] = useState(DEFAULT_SERVER_IP);
  const [isConnectedToServer, setIsConnectedToServer] = useState(false);
  const wsRef = useRef(null);

  // Shared state (synchronized across all devices)
  const [activeOrder, setActiveOrder] = useState(null);
  const [mechanics, setMechanics] = useState(INITIAL_MECHANICS);
  const [mechanicOnline, setMechanicOnline] = useState(true);
  const [platformStats, setPlatformStats] = useState({
    totalOrders: 148,
    totalGrossRevenue: 15420000,
    platformCutPercent: 15,
    platformNetRevenue: 2313000,
  });
  const [chatMessages, setChatMessages] = useState([
    { id: '1', sender: 'mechanic', text: 'Halo, saya sudah siap meluncur ke lokasi mobil Anda. Mohon nyalakan lampu hazard ya.' },
  ]);

  const API_URL = `http://${serverIP}:${SERVER_PORT}`;
  const WS_URL = `ws://${serverIP}:${SERVER_PORT}`;

  // 1. Load saved device role on app startup
  useEffect(() => {
    async function loadRole() {
      try {
        const savedRole = await AsyncStorage.getItem('@montir_siaga_device_role');
        if (savedRole) {
          setCurrentRole(savedRole);
        }
      } catch (e) {
        console.warn('Error reading role from storage:', e);
      } finally {
        setRoleLoaded(true);
      }
    }
    loadRole();
  }, []);

  // Set & persist device role
  const setCurrentRoleAndSave = async (role) => {
    setCurrentRole(role);
    try {
      await AsyncStorage.setItem('@montir_siaga_device_role', role);
    } catch (e) {}
  };

  // 2. Connect to Realtime WebSocket Hub on Mac
  useEffect(() => {
    let ws;
    let reconnectTimer;

    function connectWS() {
      try {
        ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('✅ Connected to Montir Siaga Realtime Server on Mac');
          setIsConnectedToServer(true);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📩 Realtime event received:', message.type);

            if (message.state) {
              if (message.state.activeOrder !== undefined) setActiveOrder(message.state.activeOrder);
              if (message.state.mechanics) setMechanics(message.state.mechanics);
              if (message.state.mechanicOnline !== undefined) setMechanicOnline(message.state.mechanicOnline);
              if (message.state.platformStats) setPlatformStats(message.state.platformStats);
              if (message.state.chatMessages) setChatMessages(message.state.chatMessages);
            } else if (message.type === 'SYNC_STATE' && message.data) {
              setActiveOrder(message.data.activeOrder);
              setMechanics(message.data.mechanics);
              setMechanicOnline(message.data.mechanicOnline);
              setPlatformStats(message.data.platformStats);
              setChatMessages(message.data.chatMessages);
            }
          } catch (err) {
            console.warn('Error parsing WS message:', err);
          }
        };

        ws.onerror = (e) => {
          setIsConnectedToServer(false);
        };

        ws.onclose = () => {
          setIsConnectedToServer(false);
          // Auto reconnect after 3 seconds
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

  // Actions that trigger Realtime Server API:

  // Driver creates order on HP 1
  const createOrder = async (service, locationText, coords, vehicleName, note) => {
    try {
      const res = await fetch(`${API_URL}/api/order/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, locationText, coords, vehicleName, note }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setActiveOrder(data.order);
      }
    } catch (e) {
      // Offline fallback
      const fallbackOrder = {
        id: 'MS-' + Math.floor(1000 + Math.random() * 9000),
        service,
        userAddress: locationText,
        vehicle: vehicleName,
        note: note || '',
        mechanic: null,
        status: 'searching',
        price: service.price,
        platformFee: Math.round(service.price * 0.15),
        mechanicNet: Math.round(service.price * 0.85),
      };
      setActiveOrder(fallbackOrder);
    }
  };

  // Mechanic accepts order on HP 2
  const acceptOrder = async (mechanicId) => {
    try {
      const res = await fetch(`${API_URL}/api/order/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mechanicId }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setActiveOrder(data.order);
      }
    } catch (e) {
      setActiveOrder((prev) => ({
        ...prev,
        mechanic: mechanics[0],
        status: 'assigned',
      }));
    }
  };

  // Update order status (arrived / repairing / completed)
  const updateOrderStatus = async (status) => {
    try {
      const res = await fetch(`${API_URL}/api/order/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setActiveOrder(data.order);
      }
    } catch (e) {
      setActiveOrder((prev) => (prev ? { ...prev, status } : null));
    }
  };

  // Driver pays (QRIS / Cash / E-Wallet)
  const completePayment = async (method) => {
    try {
      const res = await fetch(`${API_URL}/api/order/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setActiveOrder(data.order);
      }
    } catch (e) {
      setActiveOrder((prev) => (prev ? { ...prev, status: 'paid', paymentMethod: method } : null));
    }
  };

  // Reset order
  const resetOrder = async () => {
    try {
      await fetch(`${API_URL}/api/order/reset`, { method: 'POST' });
    } catch (e) {}
    setActiveOrder(null);
  };

  // Chat message
  const addChatMessage = async (sender, text) => {
    try {
      await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, text }),
      });
    } catch (e) {
      setChatMessages((prev) => [...prev, { id: Date.now().toString(), sender, text }]);
    }
  };

  // Toggle mechanic online
  const toggleMechanicOnline = async (online) => {
    setMechanicOnline(online);
    try {
      await fetch(`${API_URL}/api/mechanic/toggle-online`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ online }),
      });
    } catch (e) {}
  };

  // Owner toggle verification
  const toggleMechanicVerification = async (mechanicId) => {
    try {
      await fetch(`${API_URL}/api/mechanic/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mechanicId }),
      });
    } catch (e) {
      setMechanics((prev) =>
        prev.map((m) => (m.id === mechanicId ? { ...m, verified: !m.verified } : m))
      );
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        setCurrentRoleAndSave,
        roleLoaded,
        serverIP,
        setServerIP,
        isConnectedToServer,
        activeOrder,
        createOrder,
        acceptOrder,
        updateOrderStatus,
        completePayment,
        resetOrder,
        mechanics,
        mechanicOnline,
        setMechanicOnline: toggleMechanicOnline,
        platformStats,
        toggleMechanicVerification,
        chatMessages,
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
