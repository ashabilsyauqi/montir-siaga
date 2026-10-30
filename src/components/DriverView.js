import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../context/AppContext';
import { useGPSLocation } from '../hooks/useGPSLocation';
import GojekMapView from './GojekMapView';

const { width, height: screenHeight } = Dimensions.get('window');

// Gojek vehicle tiers matching uploaded screenshot
const GOJEK_TIERS = [
  {
    id: 'goride',
    name: 'GoRide',
    serviceTitle: 'Montir Motor (Express)',
    subtext: '15 mins • 👤 1 Montir',
    price: 20000,
    originalPrice: 25000,
    icon: 'bicycle',
    badge: 'Cepat & Gesit',
    desc: 'Montir motor sigap tembus macet bawa peralatan darurat ringan',
  },
  {
    id: 'gocar',
    name: 'GoCar',
    serviceTitle: 'Mobil Derek & Bengkel',
    subtext: '30 mins • 👥 2-4 Montir',
    price: 70000,
    originalPrice: 125000,
    icon: 'car-sport',
    badge: 'Paling Lengkap',
    desc: 'Armada mobil bengkel lengkap dengan hidrolik & alat berat',
  },
  {
    id: 'gobluebird',
    name: 'GoBluebird',
    serviceTitle: 'Bengkel Darurat Lengkap',
    subtext: '20 mins • 👤 1-2 Montir',
    price: 45000,
    originalPrice: 60000,
    icon: 'construct',
    badge: 'Siaga 24 Jam',
    desc: 'Layanan teknisi bersertifikasi dengan suku cadang original',
  },
  {
    id: 'aki',
    name: 'GoBattery',
    serviceTitle: 'Jumper Aki / Baterai Soak',
    subtext: '10 mins • 👤 1 Montir',
    price: 35000,
    originalPrice: 50000,
    icon: 'battery-charging',
    badge: 'Jumper Cepat',
    desc: 'Powerbank aki portable 12V/24V langsung starter di tempat',
  },
  {
    id: 'ban',
    name: 'GoTire',
    serviceTitle: 'Tambal Ban & Ganti Serep',
    subtext: '12 mins • 👤 1 Montir',
    price: 30000,
    originalPrice: 45000,
    icon: 'disc',
    badge: 'Tubeless & Serep',
    desc: 'Tambal cacing/payung cepat & dongkrak pasang ban serep',
  },
];

export default function DriverView() {
  const {
    activeOrder,
    createOrder,
    cancelOrder,
    payQrisBill,
    resetOrder,
    driverWallet,
    topUpDriverWallet,
    mechanics,
    chatMessages,
    addChatMessage,
  } = useApp();

  const { location, address, status: gpsStatus, refreshLocation } = useGPSLocation();

  const [selectedTier, setSelectedTier] = useState(GOJEK_TIERS[0]);
  const [vehicle, setVehicle] = useState('Toyota Avanza 1.3 G (B 1234 SKA)');
  const [problemNote, setProblemNote] = useState('');
  const [topUpModalVisible, setTopUpModalVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [qrisModalVisible, setQrisModalVisible] = useState(false);
  const [editAddressModal, setEditAddressModal] = useState(false);
  const [customAddress, setCustomAddress] = useState('');

  // Radar Pulse Animation for Searching State
  const pulse1 = useRef(new Animated.Value(0.5)).current;
  const pulse2 = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (activeOrder?.status === 'searching') {
      const createPulse = (anim, delay) => {
        return Animated.sequence([
          Animated.delay(delay),
          Animated.loop(
            Animated.sequence([
              Animated.timing(anim, { toValue: 2.4, duration: 2000, useNativeDriver: true }),
              Animated.timing(anim, { toValue: 0.5, duration: 0, useNativeDriver: true }),
            ])
          ),
        ]);
      };

      const p1 = createPulse(pulse1, 0);
      const p2 = createPulse(pulse2, 800);
      p1.start();
      p2.start();

      return () => {
        p1.stop();
        p2.stop();
      };
    }
  }, [activeOrder?.status]);

  const formatRupiah = (val) => 'Rp' + Number(val || 0).toLocaleString('id-ID');

  const displayAddress = customAddress || address || 'Gojek Headquarters, Jakarta Selatan';
  const displayDest = 'Montir Terdekat (Pak Agus Santoso - 1.2 km)';

  const handlePayAndCall = async () => {
    if (driverWallet < 10000) {
      Alert.alert(
        'Saldo MontirPay Kurang',
        `Saldo MontirPay Anda saat ini ${formatRupiah(driverWallet)}. Diperlukan Rp10.000 (biaya admin platform pemanggilan) untuk memanggil montir. Lakukan isi saldo sekarang?`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Isi Saldo', onPress: () => setTopUpModalVisible(true) },
        ]
      );
      return;
    }

    Alert.alert(
      'Konfirmasi Order ' + selectedTier.name,
      `Potong saldo MontirPay Rp10.000 untuk biaya admin platform?\n\n(Layanan: ${selectedTier.serviceTitle}\nEstimasi Jasa: ${formatRupiah(selectedTier.price)})`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Pesan Sekarang',
          onPress: async () => {
            const userCoords = location || { latitude: -6.2255, longitude: 106.8120 };
            const servicePayload = {
              id: selectedTier.id,
              title: selectedTier.serviceTitle,
              desc: selectedTier.desc,
              price: selectedTier.price,
              iconName: selectedTier.icon,
              eta: selectedTier.subtext.split('•')[0].trim(),
            };
            const res = await createOrder(servicePayload, displayAddress, userCoords, vehicle, problemNote);
            if (!res.success && res.error === 'SALDO_KURANG') {
              setTopUpModalVisible(true);
            }
          },
        },
      ]
    );
  };

  const handleConfirmPayQris = () => {
    payQrisBill();
    setQrisModalVisible(false);
    Alert.alert(
      'Pembayaran QRIS Berhasil! 🎉',
      `Pembayaran sebesar ${formatRupiah(activeOrder?.mechanicBillAmount)} telah diterima langsung oleh ${activeOrder?.mechanic?.name || 'Montir'}.`
    );
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    addChatMessage('user', chatInput.trim());
    setChatInput('');
  };

  // ================= SCENARIO 1: HOME ORDER SCREEN (IDENTICAL TO GOJEK SCREENSHOT) =================
  if (!activeOrder) {
    const mapHeight = screenHeight * 0.48;

    return (
      <View style={styles.container}>
        {/* Real Open-Source Map Area (No API Key Required) */}
        <View style={{ height: mapHeight, width: '100%', position: 'relative' }}>
          <GojekMapView
            userCoords={location || { latitude: -6.2255, longitude: 106.8120 }}
            mechanics={mechanics}
            orderStatus="idle"
            showRadar={false}
            height="100%"
          />

          {/* Floating Origin & Destination Card (Exact Gojek UI) */}
          <View style={styles.gojekAddressCard}>
            <View style={styles.addressLeftCol}>
              {/* Pickup / Origin Row */}
              <View style={styles.addressRow}>
                <View style={styles.greenDot} />
                <Text style={styles.addressText} numberOfLines={1}>
                  {displayAddress}
                </Text>
              </View>

              {/* Thin Divider Line */}
              <View style={styles.addressDivider} />

              {/* Destination / Mechanic Row */}
              <View style={styles.addressRow}>
                <View style={styles.orangeDot} />
                <Text style={styles.addressText} numberOfLines={1}>
                  {displayDest}
                </Text>
              </View>
            </View>

            {/* Edit Button */}
            <TouchableOpacity
              style={styles.editPillBtn}
              activeOpacity={0.8}
              onPress={() => setEditAddressModal(true)}
            >
              <Text style={styles.editPillText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Floating Round Back Button (Left) */}
          <TouchableOpacity
            style={styles.floatingRoundBtnLeft}
            activeOpacity={0.85}
            onPress={refreshLocation}
          >
            <Ionicons name="arrow-back" size={20} color="#1E293B" />
          </TouchableOpacity>

          {/* Floating Round GPS Recenter Button (Right) */}
          <TouchableOpacity
            style={styles.floatingRoundBtnRight}
            activeOpacity={0.85}
            onPress={refreshLocation}
          >
            <Ionicons name="locate" size={20} color="#00AA13" />
          </TouchableOpacity>
        </View>

        {/* Gojek Draggable Bottom Sheet */}
        <View style={styles.gojekBottomSheet}>
          {/* Subtle Top Drag Handle */}
          <View style={styles.dragHandleBar} />

          {/* Scrollable Vehicle & Service Tier Options */}
          <ScrollView
            style={styles.tierScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {GOJEK_TIERS.map((tier) => {
              const isSelected = selectedTier.id === tier.id;
              return (
                <TouchableOpacity
                  key={tier.id}
                  activeOpacity={0.88}
                  onPress={() => setSelectedTier(tier)}
                  style={[
                    styles.tierItemCard,
                    isSelected && styles.tierItemCardSelected,
                  ]}
                >
                  {/* Vehicle / Service Illustration */}
                  <View style={[styles.tierIconContainer, isSelected && styles.tierIconContainerSelected]}>
                    <Ionicons
                      name={tier.icon}
                      size={28}
                      color={isSelected ? '#00AA13' : '#475569'}
                    />
                  </View>

                  {/* Service Title & Subtext */}
                  <View style={styles.tierInfoCol}>
                    <Text style={[styles.tierName, isSelected && styles.tierNameSelected]}>
                      {tier.name}
                    </Text>
                    <Text style={styles.tierSubtext}>{tier.subtext}</Text>
                    <Text style={styles.tierServiceDetail} numberOfLines={1}>
                      {tier.serviceTitle}
                    </Text>
                  </View>

                  {/* Price on the Right */}
                  <View style={styles.tierPriceCol}>
                    <View style={styles.priceWithDot}>
                      <View style={styles.orangePriceDot} />
                      <Text style={[styles.tierPriceText, isSelected && styles.tierPriceTextSelected]}>
                        {formatRupiah(tier.price)}
                      </Text>
                    </View>
                    <Text style={styles.tierOriginalPrice}>
                      {formatRupiah(tier.originalPrice)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Note Input for Mechanic */}
            <View style={styles.noteInputCard}>
              <Ionicons name="chatbox-ellipses-outline" size={18} color="#64748B" />
              <TextInput
                style={styles.noteInput}
                placeholder="Catatan mobil (misal: Avanza Hitam, mogok dekat lampu merah)"
                placeholderTextColor="#94A3B8"
                value={problemNote}
                onChangeText={setProblemNote}
              />
            </View>
          </ScrollView>

          {/* Fixed Pinned Bottom Bar (Payment + Big Green Order Button) */}
          <View style={styles.fixedBottomContainer}>
            {/* Payment Method Pill Bar */}
            <TouchableOpacity
              style={styles.paymentMethodBar}
              activeOpacity={0.85}
              onPress={() => setTopUpModalVisible(true)}
            >
              <View style={styles.paymentLeft}>
                <View style={styles.goPayIconCircle}>
                  <Ionicons name="wallet" size={14} color="#FFFFFF" />
                </View>
                <Text style={styles.goPayTitle}>MontirPay</Text>
                <Text style={styles.goPayBalance}>{formatRupiah(driverWallet)}</Text>
                <View style={styles.topUpSmallPill}>
                  <Text style={styles.topUpSmallText}>+ Isi Saldo</Text>
                </View>
              </View>

              <View style={styles.paymentRight}>
                <Ionicons name="ellipsis-horizontal-circle" size={22} color="#64748B" />
              </View>
            </TouchableOpacity>

            {/* Big Green Pill Order Button (Exact Gojek Style) */}
            <TouchableOpacity
              style={styles.bigGreenOrderBtn}
              activeOpacity={0.9}
              onPress={handlePayAndCall}
            >
              <View style={styles.orderBtnLeftCol}>
                <Text style={styles.orderBtnTitle}>Order {selectedTier.name}</Text>
                <Text style={styles.orderBtnSubtitle}>
                  Biaya Admin Rp10.000 • Cashback {formatRupiah(selectedTier.originalPrice - selectedTier.price)}
                </Text>
              </View>

              <View style={styles.orderBtnArrowCircle}>
                <Ionicons name="arrow-forward" size={20} color="#00AA13" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal Edit Alamat */}
        <Modal visible={editAddressModal} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.editAddressSheet}>
              <Text style={styles.modalSheetTitle}>Ubah Lokasi Mobil Mogok</Text>
              <TextInput
                style={styles.addressInputField}
                value={customAddress}
                onChangeText={setCustomAddress}
                placeholder="Masukkan alamat atau nama gedung..."
                placeholderTextColor="#94A3B8"
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#F1F5F9' }]}
                  onPress={() => setEditAddressModal(false)}
                >
                  <Text style={{ color: '#475569', fontWeight: 'bold' }}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#00AA13' }]}
                  onPress={() => setEditAddressModal(false)}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Simpan Alamat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal Top Up MontirPay */}
        <Modal visible={topUpModalVisible} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.topUpSheet}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.goPayIconCircle}>
                    <Ionicons name="wallet" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.modalTitle}>Top Up Saldo MontirPay</Text>
                </View>
                <TouchableOpacity onPress={() => setTopUpModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Saldo Anda saat ini: <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>{formatRupiah(driverWallet)}</Text>
              </Text>

              <Text style={styles.topUpChoiceLabel}>PILIH NOMINAL TOP UP INSTAN:</Text>
              <View style={styles.topUpGrid}>
                {[20000, 50000, 100000].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={styles.topUpOptionCard}
                    onPress={() => {
                      topUpDriverWallet(amt);
                      Alert.alert('Top Up Berhasil! 🎉', `Saldo MontirPay bertambah ${formatRupiah(amt)}!`);
                      setTopUpModalVisible(false);
                    }}
                  >
                    <Text style={styles.topUpAmountText}>{formatRupiah(amt)}</Text>
                    <Text style={styles.topUpSubLabel}>Instan QRIS</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.qrisNoticeCard}>
                <Ionicons name="qr-code" size={24} color="#00AA13" />
                <Text style={styles.qrisNoticeText}>Mendukung QRIS Semua Bank, GoPay, OVO, Dana, & BCA</Text>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ================= SCENARIO 2: SEARCHING ON MAP WITH PULSING RADAR =================
  if (activeOrder.status === 'searching') {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, width: '100%', position: 'relative' }}>
          <GojekMapView
            userCoords={activeOrder.userCoords || location || { latitude: -6.2255, longitude: 106.8120 }}
            mechanics={mechanics}
            orderStatus="searching"
            showRadar={true}
            height="100%"
          />

          {/* Floating Top Pill Status */}
          <View style={styles.searchingTopPill}>
            <View style={styles.greenPulseDot} />
            <Text style={styles.searchingTopText}>Mencari Montir Terdekat...</Text>
          </View>
        </View>

        {/* Bottom Searching Status Sheet */}
        <View style={styles.searchingBottomSheet}>
          <View style={styles.dragHandleBar} />

          <View style={styles.searchingContent}>
            <View style={styles.radarIconWrapper}>
              <Animated.View
                style={[
                  styles.radarPulseRing,
                  {
                    transform: [{ scale: pulse1 }],
                    opacity: pulse1.interpolate({ inputRange: [0.5, 2.4], outputRange: [0.8, 0] }),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.radarPulseRing,
                  {
                    transform: [{ scale: pulse2 }],
                    opacity: pulse2.interpolate({ inputRange: [0.5, 2.4], outputRange: [0.8, 0] }),
                  },
                ]}
              />
              <Ionicons name="radio" size={32} color="#00AA13" />
            </View>

            <Text style={styles.searchingTitle}>Menghubungkan ke Montir Siaga</Text>
            <Text style={styles.searchingDesc}>
              Memindai armada montir terdekat di sekitar {displayAddress}.
            </Text>

            <View style={styles.orderSummaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Layanan:</Text>
                <Text style={styles.summaryValue}>{activeOrder.service?.title || 'Montir Motor'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Admin Terbayar:</Text>
                <Text style={[styles.summaryValue, { color: '#00AA13' }]}>Rp10.000 (Owner)</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Estimasi Jasa:</Text>
                <Text style={styles.summaryValue}>~{formatRupiah(activeOrder.service?.price)}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.cancelBtn} onPress={cancelOrder}>
              <Text style={styles.cancelBtnText}>Batalkan Pencarian</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ================= SCENARIO 3: TRACKING & REPAIRING (ASSIGNED) =================
  const isAssigned = ['assigned', 'arrived', 'repairing'].includes(activeOrder.status);
  const isBilling = activeOrder.status === 'billing' || activeOrder.mechanicBilled;

  return (
    <View style={styles.container}>
      {/* Map with Route and Moving Marker */}
      <View style={{ flex: 1, width: '100%', position: 'relative' }}>
        <GojekMapView
          userCoords={activeOrder.userCoords || location || { latitude: -6.2255, longitude: 106.8120 }}
          mechanics={mechanics}
          assignedMechanic={activeOrder.mechanic}
          orderStatus={activeOrder.status}
          showRadar={false}
          showRoute={true}
          height="100%"
        />

        {/* ETA Badge floating over map */}
        <View style={styles.etaFloatingBadge}>
          <Ionicons name="time" size={16} color="#00AA13" />
          <Text style={styles.etaFloatingText}>
            {activeOrder.status === 'assigned'
              ? 'Montir tiba dalam ~4 mnt'
              : activeOrder.status === 'arrived'
              ? 'Montir sudah tiba di lokasi!'
              : 'Perbaikan sedang berlangsung 🔧'}
          </Text>
        </View>
      </View>

      {/* Mechanic Profile & Actions Bottom Sheet */}
      <View style={styles.assignedBottomSheet}>
        <View style={styles.dragHandleBar} />

        {/* Mechanic Card */}
        <View style={styles.mechanicProfileRow}>
          <View style={styles.mechanicAvatarCircle}>
            <Text style={{ fontSize: 26 }}>👨‍🔧</Text>
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.mechanicNameText}>{activeOrder.mechanic?.name || 'Pak Agus Santoso'}</Text>
              <View style={styles.starBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.starText}>{activeOrder.mechanic?.rating || '4.9'}</Text>
              </View>
            </View>
            <Text style={styles.mechanicVehicleText}>
              {activeOrder.mechanic?.vehicle || 'Honda Vario B 4567 KAA'}
            </Text>
            <Text style={styles.mechanicPhoneText}>{activeOrder.mechanic?.phone || '0812-9988-7766'}</Text>
          </View>

          {/* Quick Chat & Call Buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={styles.circleActionBtn}
              onPress={() => setChatVisible(true)}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#00AA13" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.circleActionBtn, { backgroundColor: '#F0FDF4' }]}
              onPress={() => Alert.alert('Menghubungi...', `Memanggil telepon ke ${activeOrder.mechanic?.name || 'Montir'}`)}
            >
              <Ionicons name="call" size={20} color="#00AA13" />
            </TouchableOpacity>
          </View>
        </View>

        {/* QRIS Bill Card if Mechanic has billed */}
        {isBilling && (
          <View style={styles.billingCard}>
            <View style={styles.billingHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="receipt" size={18} color="#00AA13" />
                <Text style={styles.billingTitle}>Tagihan Perbaikan Selesai</Text>
              </View>
              <Text style={styles.billingAmount}>{formatRupiah(activeOrder.mechanicBillAmount)}</Text>
            </View>
            <Text style={styles.billingDesc}>
              {activeOrder.mechanicBillDesc || 'Jasa servis darurat & penggantian part'}
            </Text>
            <TouchableOpacity
              style={styles.payQrisBtn}
              onPress={() => setQrisModalVisible(true)}
            >
              <Ionicons name="qr-code" size={18} color="#FFFFFF" />
              <Text style={styles.payQrisBtnText}>Bayar Sekarang (QRIS Montir)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Completed status reset */}
        {activeOrder.status === 'completed' && (
          <TouchableOpacity style={styles.doneBtn} onPress={resetOrder}>
            <Text style={styles.doneBtnText}>Selesai & Kembali ke Beranda</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* QRIS Payment Modal */}
      <Modal visible={qrisModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.qrisModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.qrisModalTitle}>QRIS Pembayaran Montir</Text>
              <TouchableOpacity onPress={() => setQrisModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrisBarcodeBox}>
              <Ionicons name="qr-code" size={160} color="#0F172A" />
              <Text style={styles.qrisMerchantName}>NMID: ID102938475620</Text>
              <Text style={styles.qrisOwnerName}>{activeOrder.mechanic?.name || 'BENGKEL MONTIR SIAGA'}</Text>
            </View>

            <View style={styles.qrisTotalCard}>
              <Text style={styles.qrisTotalLabel}>Total yang harus dibayar:</Text>
              <Text style={styles.qrisTotalVal}>{formatRupiah(activeOrder.mechanicBillAmount)}</Text>
              <Text style={styles.qrisSplitNote}>100% uang pembayaran ini masuk langsung ke rekening montir</Text>
            </View>

            <TouchableOpacity style={styles.confirmQrisBtn} onPress={handleConfirmPayQris}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.confirmQrisBtnText}>Konfirmasi Telah Bayar QRIS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Chat Modal */}
      <Modal visible={chatVisible} animationType="slide">
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setChatVisible(false)}>
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.chatTitle}>Chat dengan {activeOrder.mechanic?.name || 'Montir'}</Text>
          </View>
          <ScrollView style={styles.chatScroll}>
            {chatMessages.map((m, idx) => (
              <View
                key={idx}
                style={[
                  styles.chatBubble,
                  m.sender === 'user' ? styles.chatBubbleUser : styles.chatBubbleOther,
                ]}
              >
                <Text style={m.sender === 'user' ? styles.chatTextUser : styles.chatTextOther}>
                  {m.text}
                </Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatField}
              placeholder="Tulis pesan ke montir..."
              value={chatInput}
              onChangeText={setChatInput}
            />
            <TouchableOpacity style={styles.chatSendBtn} onPress={handleSendMessage}>
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Floating Gojek Address Card
  gojekAddressCard: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    zIndex: 900,
  },
  addressLeftCol: {
    flex: 1,
    paddingRight: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00AA13',
  },
  orangeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FA541C',
  },
  addressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  addressDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
    marginLeft: 22,
  },
  editPillBtn: {
    borderWidth: 1.5,
    borderColor: '#00AA13',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  editPillText: {
    color: '#00AA13',
    fontWeight: '800',
    fontSize: 13,
  },

  // Floating Round Action Buttons
  floatingRoundBtnLeft: {
    position: 'absolute',
    left: 16,
    bottom: 24,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 900,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  floatingRoundBtnRight: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 900,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  // Gojek Bottom Sheet
  gojekBottomSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  dragHandleBar: {
    width: 38,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },

  // Tier List
  tierScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tierItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: '#FFFFFF',
  },
  tierItemCardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  tierIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tierIconContainerSelected: {
    backgroundColor: '#DCFCE7',
  },
  tierInfoCol: {
    flex: 1,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  tierNameSelected: {
    color: '#00AA13',
  },
  tierSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  tierServiceDetail: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  tierPriceCol: {
    alignItems: 'flex-end',
  },
  priceWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orangePriceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FA541C',
  },
  tierPriceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  tierPriceTextSelected: {
    color: '#0F172A',
  },
  tierOriginalPrice: {
    fontSize: 11.5,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },

  noteInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
    gap: 8,
  },
  noteInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
  },

  // Fixed Bottom Action Bar
  fixedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  paymentMethodBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goPayIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goPayTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  goPayBalance: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  topUpSmallPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  topUpSmallText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0284C7',
  },
  paymentRight: {},

  // Big Green Order Button
  bigGreenOrderBtn: {
    backgroundColor: '#00AA13',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#00AA13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  orderBtnLeftCol: {
    flex: 1,
  },
  orderBtnTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  orderBtnSubtitle: {
    fontSize: 11,
    color: '#DCFCE7',
    marginTop: 2,
    fontWeight: '500',
  },
  orderBtnArrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Searching State
  searchingTopPill: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  greenPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00AA13',
  },
  searchingTopText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchingBottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  searchingContent: {
    alignItems: 'center',
    paddingTop: 8,
  },
  radarIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  radarPulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#00AA13',
    backgroundColor: 'rgba(0, 170, 19, 0.15)',
  },
  searchingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  searchingDesc: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  orderSummaryCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    gap: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 13,
  },

  // Assigned Tracking State
  etaFloatingBadge: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  etaFloatingText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00AA13',
  },
  assignedBottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  mechanicProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  mechanicAvatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#86EFAC',
  },
  mechanicNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  starText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  mechanicVehicleText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  mechanicPhoneText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  circleActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },

  billingCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },
  billingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00AA13',
  },
  billingAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  billingDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    marginBottom: 10,
  },
  payQrisBtn: {
    backgroundColor: '#00AA13',
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  payQrisBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  doneBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  editAddressSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  addressInputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },

  topUpSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
  },
  topUpChoiceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 10,
  },
  topUpGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  topUpOptionCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topUpAmountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  topUpSubLabel: {
    fontSize: 10,
    color: '#00AA13',
    fontWeight: '700',
    marginTop: 2,
  },
  qrisNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 10,
  },
  qrisNoticeText: {
    fontSize: 11.5,
    color: '#15803D',
    flex: 1,
    fontWeight: '600',
  },

  // QRIS Payment Modal
  qrisModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  qrisModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  qrisBarcodeBox: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrisMerchantName: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '600',
  },
  qrisOwnerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  qrisTotalCard: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  qrisTotalLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  qrisTotalVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#00AA13',
    marginVertical: 2,
  },
  qrisSplitNote: {
    fontSize: 10.5,
    color: '#15803D',
    fontWeight: '600',
  },
  confirmQrisBtn: {
    width: '100%',
    backgroundColor: '#00AA13',
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmQrisBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },

  // Chat Container
  chatContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  chatScroll: {
    flex: 1,
    padding: 16,
  },
  chatBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#00AA13',
  },
  chatBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chatTextUser: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  chatTextOther: {
    color: '#0F172A',
    fontSize: 13,
  },
  chatInputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  chatField: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
  },
  chatSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00AA13',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
