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
} from 'react-native';
import { useApp, EMERGENCY_SERVICES } from '../context/AppContext';
import { useGPSLocation } from '../hooks/useGPSLocation';
import PaymentModal from './PaymentModal';

const { width } = Dimensions.get('window');

export default function DriverView() {
  const {
    activeOrder,
    createOrder,
    updateOrderStatus,
    resetOrder,
    chatMessages,
    addChatMessage,
  } = useApp();

  const { address, status: gpsStatus, refreshLocation, setAddress } = useGPSLocation();

  const [selectedService, setSelectedService] = useState(EMERGENCY_SERVICES[0]);
  const [vehicle, setVehicle] = useState('Toyota Avanza 1.3 G (B 1234 SKA)');
  const [problemNote, setProblemNote] = useState('');
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Radar Animation for Searching
  const pulseAnim1 = useRef(new Animated.Value(0.6)).current;
  const pulseAnim2 = useRef(new Animated.Value(0.6)).current;

  // Mechanic Map Animation
  const mapMoveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeOrder?.status === 'searching') {
      const loop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim1, { toValue: 2.2, duration: 1800, useNativeDriver: true }),
            Animated.timing(pulseAnim1, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(600),
            Animated.timing(pulseAnim2, { toValue: 2.2, duration: 1800, useNativeDriver: true }),
            Animated.timing(pulseAnim2, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [activeOrder?.status]);

  useEffect(() => {
    if (activeOrder?.status === 'assigned') {
      Animated.timing(mapMoveAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: false,
      }).start();
    } else {
      mapMoveAnim.setValue(0);
    }
  }, [activeOrder?.status]);

  const handleOrderSubmit = () => {
    createOrder(selectedService, address, null, vehicle, problemNote);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    addChatMessage('user', chatInput.trim());
    setChatInput('');
  };

  const mechanicTranslateX = mapMoveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, width - 110],
  });

  const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

  // ================= SCENARIO 1: NO ACTIVE ORDER (HOME SCREEN) =================
  if (!activeOrder) {
    return (
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandGroup}>
              <View style={styles.brandIcon}>
                <Text style={{ fontSize: 18 }}>🚗</Text>
              </View>
              <View>
                <Text style={styles.brandTitle}>MONTIR SIAGA</Text>
                <Text style={styles.brandSubtitle}>Driver / Pengguna Mobil Mogok</Text>
              </View>
            </View>
            <View style={styles.driverTag}>
              <Text style={styles.driverTagText}>CUSTOMER</Text>
            </View>
          </View>

          {/* Real GPS Location Card */}
          <View style={styles.gpsCard}>
            <View style={styles.gpsIconBox}>
              <Text style={{ fontSize: 13 }}>📍</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={styles.gpsTitle}>LOKASI MOBIL ANDA (GPS REAL-TIME)</Text>
                {gpsStatus === 'ready' && <View style={styles.gpsActiveDot} />}
              </View>
              <Text style={styles.gpsAddress} numberOfLines={2}>
                {address}
              </Text>
            </View>
            <TouchableOpacity onPress={refreshLocation} style={styles.gpsRefreshBtn}>
              <Text style={styles.gpsRefreshText}>🔄 GPS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scroll Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Vehicle Selector */}
          <View style={styles.vehicleCard}>
            <Text style={{ fontSize: 22, marginRight: 10 }}>🚘</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleLabel}>KENDARAAN ANDA</Text>
              <Text style={styles.vehicleValue}>{vehicle}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setVehicle((prev) =>
                  prev.includes('Avanza')
                    ? 'Honda HR-V 1.5 RS (B 9999 VIP)'
                    : 'Toyota Avanza 1.3 G (B 1234 SKA)'
                );
              }}
            >
              <Text style={styles.vehicleChange}>Ganti</Text>
            </TouchableOpacity>
          </View>

          {/* Category Selector */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PILIH JENIS KENDALA MOBIL</Text>
            <Text style={styles.sectionMeta}>Tarif Tetap & Transparan</Text>
          </View>

          <View style={styles.grid}>
            {EMERGENCY_SERVICES.map((s) => {
              const isSelected = selectedService.id === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedService(s)}
                  style={[styles.serviceCard, isSelected && styles.serviceSelected]}
                >
                  <View style={styles.serviceTop}>
                    <View style={[styles.serviceIconBox, isSelected && styles.serviceIconSelected]}>
                      <Text style={{ fontSize: 18 }}>{s.icon}</Text>
                    </View>
                    {s.badge && (
                      <View style={styles.badgePill}>
                        <Text style={styles.badgePillText}>{s.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.serviceTitle}>{s.title}</Text>
                  <Text style={styles.serviceDesc} numberOfLines={2}>
                    {s.desc}
                  </Text>
                  <View style={styles.serviceBottom}>
                    <Text style={styles.servicePrice}>{formatRupiah(s.price)}</Text>
                    <Text style={styles.serviceEta}>~{s.eta}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Note input */}
          <View style={styles.noteBox}>
            <Text style={{ fontSize: 14, marginRight: 8 }}>📝</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Catatan kendala: Bau gosong, mogok saat nanjak, dll..."
              placeholderTextColor="#64748b"
              value={problemNote}
              onChangeText={setProblemNote}
            />
          </View>

          {/* Safety advice */}
          <View style={styles.safetyCard}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>⚠️</Text>
            <Text style={styles.safetyText}>
              <Text style={{ fontWeight: 'bold' }}>Protokol Aman: </Text>
              Nyalakan lampu hazard dan pasang segitiga pengaman 30 meter di belakang mobil.
            </Text>
          </View>

          <View style={{ height: 130 }} />
        </ScrollView>

        {/* Bottom CTA Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.bottomMeta}>Estimasi Tiba:</Text>
              <Text style={styles.bottomEta}>⚡ {selectedService.eta}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.bottomMeta}>Total Jasa:</Text>
              <Text style={styles.bottomPrice}>{formatRupiah(selectedService.price)}</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.ctaButton}
            onPress={handleOrderSubmit}
          >
            <Text style={styles.ctaButtonText}>🚨 PANGGIL MONTIR TERDEKAT</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ================= SCENARIO 2: SEARCHING FOR MECHANIC =================
  if (activeOrder.status === 'searching') {
    return (
      <View style={styles.searchingContainer}>
        <View style={styles.searchHeader}>
          <View style={styles.siagaBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.siagaBadgeText}>SIAGA DARURAT RADIUS 3 KM</Text>
          </View>
          <Text style={styles.searchTitle}>Mencari Montir Terdekat...</Text>
          <Text style={styles.searchSub}>
            Sistem menyiarkan panggilan darurat ke montir mitra di sekitar Anda.
          </Text>
          <Text style={styles.searchTip}>
            💡 Tips Testing: Buka tab <Text style={{ color: '#60a5fa', fontWeight: 'bold' }}>"Mekanik"</Text> di atas untuk menerima pesanan ini!
          </Text>
        </View>

        {/* Center Radar */}
        <View style={styles.radarCenter}>
          <Animated.View
            style={[
              styles.radarRing,
              {
                transform: [{ scale: pulseAnim1 }],
                opacity: pulseAnim1.interpolate({ inputRange: [0.6, 2.2], outputRange: [0.8, 0] }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.radarRing,
              {
                transform: [{ scale: pulseAnim2 }],
                opacity: pulseAnim2.interpolate({ inputRange: [0.6, 2.2], outputRange: [0.8, 0] }),
              },
            ]}
          />
          <View style={styles.radarCarBox}>
            <Text style={{ fontSize: 26 }}>🚗</Text>
          </View>
        </View>

        {/* Order Details Preview */}
        <View style={styles.searchDetailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Kendala:</Text>
            <Text style={styles.detailVal}>{activeOrder.service?.title}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Lokasi:</Text>
            <Text style={[styles.detailVal, { flex: 1, textAlign: 'right' }]} numberOfLines={1}>
              {activeOrder.userAddress}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimasi Biaya:</Text>
            <Text style={[styles.detailVal, { color: '#f59e0b', fontWeight: 'bold' }]}>
              {formatRupiah(activeOrder.price)}
            </Text>
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={resetOrder}>
            <Text style={styles.cancelBtnText}>Batalkan Panggilan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ================= SCENARIO 3: MECHANIC ASSIGNED / ON THE WAY / ARRIVED =================
  if (['assigned', 'arrived', 'repairing'].includes(activeOrder.status)) {
    const isArrived = activeOrder.status === 'arrived';
    const isRepairing = activeOrder.status === 'repairing';

    return (
      <View style={styles.container}>
        {/* Map Box */}
        <View style={styles.mapBox}>
          <View style={styles.mapStatusOverlay}>
            <View style={styles.greenDot} />
            <Text style={styles.mapStatusText}>
              {isRepairing
                ? 'Sedang Memperbaiki Mobil Anda'
                : isArrived
                ? 'Montir Telah Tiba di Lokasi!'
                : 'Montir Menuju Lokasi'}
            </Text>
            <View style={styles.mapEtaPill}>
              <Text style={styles.mapEtaText}>
                {isRepairing ? 'Proses Servis' : isArrived ? 'TIBA' : 'ETA: 6 Menit'}
              </Text>
            </View>
          </View>

          {/* Visual Moving Mechanic */}
          <Animated.View
            style={[
              styles.movingMarker,
              { transform: [{ translateX: isArrived || isRepairing ? width - 110 : mechanicTranslateX }] },
            ]}
          >
            <View style={styles.mechanicMarker}>
              <Text style={{ fontSize: 18 }}>🏍️</Text>
            </View>
            <Text style={styles.markerText}>{activeOrder.mechanic?.name.split(' ')[1] || 'Montir'}</Text>
          </Animated.View>

          {/* Stranded Car Marker */}
          <View style={styles.carMarker}>
            <View style={styles.carMarkerBox}>
              <Text style={{ fontSize: 18 }}>🚗</Text>
            </View>
            <Text style={styles.markerText}>Mobil Anda</Text>
          </View>

          <View style={styles.mapStreet} />
        </View>

        {/* Bottom Sheet */}
        <View style={styles.trackSheet}>
          <View style={styles.sheetPill} />

          {/* Mechanic Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={{ fontSize: 24 }}>👨🏻‍🔧</Text>
              <View style={styles.profileCheck}>
                <Text style={{ fontSize: 8, color: '#fff' }}>✓</Text>
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={styles.profileName}>{activeOrder.mechanic?.name || 'Pak Agus Santoso'}</Text>
                <View style={styles.verifBadge}>
                  <Text style={styles.verifText}>VERIFIED</Text>
                </View>
              </View>
              <Text style={styles.profileMeta}>⭐ {activeOrder.mechanic?.rating || '4.9'} • 340+ Servis Sukses</Text>
              <Text style={styles.profileVehicle}>🛵 {activeOrder.mechanic?.vehicle || 'Honda Vario'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.profileDistLabel}>Jarak</Text>
              <Text style={styles.profileDistVal}>{isArrived || isRepairing ? '0 m' : '1.8 km'}</Text>
            </View>
          </View>

          {/* Action Buttons: Chat & Phone */}
          <View style={styles.trackActions}>
            <TouchableOpacity style={styles.trackChatBtn} onPress={() => setChatVisible(true)}>
              <Text style={styles.trackChatText}>💬 Chat Montir ({chatMessages.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.trackCallBtn}
              onPress={() =>
                Alert.alert(
                  'Telepon VoIP',
                  `Menghubungi ${activeOrder.mechanic?.name} (${activeOrder.mechanic?.phone})...`
                )
              }
            >
              <Text style={styles.trackCallText}>📞 Telepon Montir</Text>
            </TouchableOpacity>
          </View>

          {/* Stepper Status */}
          <View style={styles.stepperBox}>
            <Text style={styles.stepperHeader}>STATUS PENANGANAN DARURAT</Text>
            <Text style={styles.stepDone}>✅ Pesanan diterima oleh montir</Text>
            <Text style={isArrived || isRepairing ? styles.stepDone : styles.stepCurrent}>
              {isArrived || isRepairing
                ? '✅ Montir telah tiba di lokasi'
                : '🏍️ Montir sedang menuju ke lokasi Anda'}
            </Text>
            <Text style={isRepairing ? styles.stepCurrent : styles.stepPending}>
              {isRepairing
                ? '⚙️ Sedang melakukan penanganan ' + activeOrder.service?.title
                : '⚪ Pemeriksaan kondisi fisik mobil'}
            </Text>
          </View>

          {/* Shortcut to pay if testing */}
          <TouchableOpacity
            style={styles.payShortcutBtn}
            onPress={() => setPaymentVisible(true)}
          >
            <Text style={styles.payShortcutText}>💳 Bayar Sekarang ({formatRupiah(activeOrder.price)})</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Modal */}
        <PaymentModal visible={paymentVisible} onClose={() => setPaymentVisible(false)} />

        {/* Chat Modal */}
        <Modal visible={chatVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.chatModalBox}>
              <View style={styles.chatHeader}>
                <View>
                  <Text style={styles.chatTitle}>{activeOrder.mechanic?.name || 'Montir'}</Text>
                  <Text style={styles.chatSub}>Koneksi Langsung Terenkripsi</Text>
                </View>
                <TouchableOpacity onPress={() => setChatVisible(false)}>
                  <Text style={{ fontSize: 18, color: '#94a3b8' }}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.chatMessagesList}>
                {chatMessages.map((m) => (
                  <View
                    key={m.id}
                    style={[
                      styles.chatBubble,
                      m.sender === 'user' ? styles.userBubble : styles.mechBubble,
                    ]}
                  >
                    <Text style={m.sender === 'user' ? styles.userText : styles.mechText}>
                      {m.text}
                    </Text>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.chatInputRow}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Ketik pesan patokan lokasi..."
                  placeholderTextColor="#64748b"
                  value={chatInput}
                  onChangeText={setChatInput}
                  onSubmitEditing={handleSendMessage}
                />
                <TouchableOpacity style={styles.chatSendBtn} onPress={handleSendMessage}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Kirim</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ================= SCENARIO 4: COMPLETED / PAID =================
  if (activeOrder.status === 'paid' || activeOrder.status === 'completed') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
        <View style={styles.paidIconBox}>
          <Text style={{ fontSize: 36 }}>🎉</Text>
        </View>
        <Text style={styles.paidTitle}>Mobil Berhasil Diperbaiki!</Text>
        <Text style={styles.paidSub}>
          Terima kasih telah menggunakan layanan Montir Siaga 24 Jam.
        </Text>

        <View style={styles.receiptCard}>
          <Text style={styles.receiptHeader}>BUKTI TRANSAKSI #{activeOrder.id}</Text>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Layanan:</Text>
            <Text style={styles.receiptVal}>{activeOrder.service?.title}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Montir:</Text>
            <Text style={styles.receiptVal}>{activeOrder.mechanic?.name || 'Pak Agus'}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Metode Bayar:</Text>
            <Text style={[styles.receiptVal, { color: '#38bdf8', textTransform: 'uppercase' }]}>
              {activeOrder.paymentMethod || 'QRIS'}
            </Text>
          </View>
          <View style={styles.receiptDivider} />
          <View style={styles.receiptRow}>
            <Text style={styles.totalReceiptLabel}>Total Biaya:</Text>
            <Text style={styles.totalReceiptVal}>{formatRupiah(activeOrder.price)}</Text>
          </View>
        </View>

        {/* Rating card */}
        <View style={styles.reviewCard}>
          <Text style={styles.reviewPrompt}>Beri Rating Pelayanan Montir:</Text>
          <Text style={{ fontSize: 26, marginVertical: 8 }}>⭐⭐⭐⭐⭐</Text>
          <Text style={styles.reviewSub}>Pelayanan ramah, cepat tiba, dan profesional.</Text>
        </View>

        <TouchableOpacity style={styles.finishResetBtn} onPress={resetOrder}>
          <Text style={styles.finishResetText}>Kembali ke Beranda Panggilan</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: '#fecaca',
    fontSize: 11,
    fontWeight: '500',
  },
  driverTag: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  driverTagText: {
    color: '#fef08a',
    fontSize: 9,
    fontWeight: '800',
  },
  gpsCard: {
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  gpsTitle: {
    color: '#fde047',
    fontSize: 9,
    fontWeight: '800',
  },
  gpsActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
  },
  gpsAddress: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  gpsRefreshBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 6,
  },
  gpsRefreshText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  vehicleCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  vehicleLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
  },
  vehicleValue: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vehicleChange: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionMeta: {
    color: '#94a3b8',
    fontSize: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  serviceCard: {
    width: (width - 40) / 2,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  serviceSelected: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  serviceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconSelected: {
    backgroundColor: '#ef4444',
  },
  badgePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgePillText: {
    color: '#34d399',
    fontSize: 8,
    fontWeight: '800',
  },
  serviceTitle: {
    color: '#f8fafc',
    fontSize: 11.5,
    fontWeight: 'bold',
    marginTop: 8,
  },
  serviceDesc: {
    color: '#94a3b8',
    fontSize: 9.5,
    marginTop: 2,
    lineHeight: 13,
  },
  serviceBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  servicePrice: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '800',
  },
  serviceEta: {
    color: '#64748b',
    fontSize: 9.5,
  },
  noteBox: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  noteInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 11,
  },
  safetyCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: 'rgba(120, 53, 15, 0.35)',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  safetyText: {
    color: '#fef3c7',
    fontSize: 10,
    flex: 1,
    lineHeight: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bottomMeta: {
    color: '#94a3b8',
    fontSize: 10,
  },
  bottomEta: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomPrice: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '900',
  },
  ctaButton: {
    backgroundColor: '#dc2626',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  // Searching Screen
  searchingContainer: {
    flex: 1,
    backgroundColor: '#0b1120',
    justifyContent: 'space-between',
    padding: 20,
  },
  searchHeader: {
    alignItems: 'center',
    marginTop: 14,
  },
  siagaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  siagaBadgeText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '800',
  },
  searchTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 10,
  },
  searchSub: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  searchTip: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  radarCenter: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  radarCarBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchDetailsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  detailVal: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 10,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  // Tracking
  mapBox: {
    height: 220,
    backgroundColor: '#1e293b',
    position: 'relative',
    overflow: 'hidden',
  },
  mapStreet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 100,
    height: 26,
    backgroundColor: '#334155',
  },
  mapStatusOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  mapStatusText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 6,
    flex: 1,
  },
  mapEtaPill: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mapEtaText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  movingMarker: {
    position: 'absolute',
    top: 85,
    alignItems: 'center',
  },
  mechanicMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  carMarker: {
    position: 'absolute',
    top: 85,
    right: 20,
    alignItems: 'center',
  },
  carMarkerBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerText: {
    color: '#f8fafc',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
  },
  trackSheet: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 14,
    justifyContent: 'space-between',
  },
  sheetPill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
    alignSelf: 'center',
    marginBottom: 6,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: 'bold',
  },
  verifBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  verifText: {
    color: '#34d399',
    fontSize: 8,
    fontWeight: '800',
  },
  profileMeta: {
    color: '#f59e0b',
    fontSize: 10.5,
    marginTop: 2,
  },
  profileVehicle: {
    color: '#94a3b8',
    fontSize: 10.5,
  },
  profileDistLabel: {
    color: '#94a3b8',
    fontSize: 9,
  },
  profileDistVal: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trackActions: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  trackChatBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  trackChatText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: 'bold',
  },
  trackCallBtn: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  trackCallText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  stepperBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stepperHeader: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 4,
  },
  stepDone: {
    color: '#10b981',
    fontSize: 10.5,
    marginBottom: 3,
  },
  stepCurrent: {
    color: '#f59e0b',
    fontSize: 10.5,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  stepPending: {
    color: '#64748b',
    fontSize: 10.5,
  },
  payShortcutBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  payShortcutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  // Paid / Completed Screen
  paidIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  paidTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  paidSub: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  receiptCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  receiptHeader: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  receiptLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  receiptVal: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 6,
  },
  totalReceiptLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  totalReceiptVal: {
    color: '#f59e0b',
    fontSize: 15,
    fontWeight: '900',
  },
  reviewCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  reviewPrompt: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reviewSub: {
    color: '#94a3b8',
    fontSize: 10,
    textAlign: 'center',
  },
  finishResetBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 30,
  },
  finishResetText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  // Modal Chat
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  chatModalBox: {
    height: '75%',
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  chatTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  chatSub: {
    color: '#10b981',
    fontSize: 10,
  },
  chatMessagesList: {
    flex: 1,
    marginVertical: 10,
  },
  chatBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  userBubble: {
    backgroundColor: '#dc2626',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  mechBubble: {
    backgroundColor: '#1e293b',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  userText: {
    color: '#ffffff',
    fontSize: 11.5,
  },
  mechText: {
    color: '#e2e8f0',
    fontSize: 11.5,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 6,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 11.5,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chatSendBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
