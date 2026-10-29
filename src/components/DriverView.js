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
import { LinearGradient } from 'expo-linear-gradient';
import { useApp, EMERGENCY_SERVICES } from '../context/AppContext';
import { useGPSLocation } from '../hooks/useGPSLocation';
import GojekMapView from './GojekMapView';

const { width, height: screenHeight } = Dimensions.get('window');

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

  const [selectedService, setSelectedService] = useState(EMERGENCY_SERVICES[0]);
  const [vehicle, setVehicle] = useState('Toyota Avanza 1.3 G (B 1234 SKA)');
  const [problemNote, setProblemNote] = useState('');
  const [topUpModalVisible, setTopUpModalVisible] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [qrisModalVisible, setQrisModalVisible] = useState(false);

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

  const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

  const handlePayAndCall = async () => {
    if (driverWallet < 10000) {
      Alert.alert(
        'Saldo MontirPay Kurang',
        `Saldo MontirPay Anda saat ini ${formatRupiah(driverWallet)}. Diperlukan Rp 10.000 (biaya admin platform pemanggilan) untuk memanggil montir. Lakukan isi saldo sekarang?`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Isi Saldo', onPress: () => setTopUpModalVisible(true) },
        ]
      );
      return;
    }

    Alert.alert(
      'Konfirmasi MontirPay',
      `Potong saldo MontirPay Rp 10.000 untuk biaya admin platform?\n\n(Biaya jasa perbaikan nantinya ditagihkan montir via QRIS di tempat setelah selesai)`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Bayar & Panggil',
          onPress: async () => {
            const userCoords = location || { latitude: -6.2255, longitude: 106.8120 };
            const res = await createOrder(selectedService, address, userCoords, vehicle, problemNote);
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

  // ================= SCENARIO 1: HOME ORDER SCREEN (ALA GOJEK) =================
  if (!activeOrder) {
    const mapHeight = screenHeight * 0.46;

    return (
      <View style={styles.container}>
        {/* Top Real Street Map (Gojek Styled) */}
        <View style={{ height: mapHeight, width: '100%', position: 'relative' }}>
          <GojekMapView
            userCoords={location || { latitude: -6.2255, longitude: 106.8120 }}
            mechanics={mechanics}
            orderStatus="idle"
            showRadar={false}
            height="100%"
          />

          {/* Floating Gojek Top Header */}
          <View style={styles.floatingTopBar}>
            {/* MontirPay Balance Pill */}
            <TouchableOpacity
              style={styles.montirPayPill}
              activeOpacity={0.85}
              onPress={() => setTopUpModalVisible(true)}
            >
              <View style={styles.montirPayIcon}>
                <Ionicons name="wallet" size={14} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.montirPayLabel}>MontirPay</Text>
                <Text style={styles.montirPayValue}>{formatRupiah(driverWallet)}</Text>
              </View>
              <View style={styles.topUpBadge}>
                <Text style={styles.topUpBadgeText}>+ Top Up</Text>
              </View>
            </TouchableOpacity>

            {/* 24 Jam SOS Badge */}
            <View style={styles.sosBadge}>
              <View style={styles.greenLiveDot} />
              <Text style={styles.sosBadgeText}>MONTIR SIAGA 24 JAM</Text>
            </View>
          </View>

          {/* Floating Pickup Location Card */}
          <View style={styles.floatingPickupCard}>
            <View style={styles.pickupPinBox}>
              <Ionicons name="location" size={18} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pickupLabel}>LOKASI MOBIL MOGOK (GPS)</Text>
              <Text style={styles.pickupAddress} numberOfLines={1}>
                {address}
              </Text>
            </View>
            <TouchableOpacity onPress={refreshLocation} style={styles.refreshLocBtn}>
              <Ionicons name="sync" size={14} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Gojek Bottom Sheet (White Card with Drag Indicator) */}
        <View style={styles.bottomSheet}>
          <View style={styles.dragHandle} />

          <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            {/* Vehicle Selector Pill */}
            <View style={styles.vehiclePill}>
              <Ionicons name="car-sport" size={16} color="#DC2626" />
              <Text style={styles.vehicleName} numberOfLines={1}>
                {vehicle}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setVehicle((prev) =>
                    prev.includes('Avanza')
                      ? 'Honda HR-V 1.5 RS (B 9999 VIP)'
                      : 'Toyota Avanza 1.3 G (B 1234 SKA)'
                  );
                }}
              >
                <Text style={styles.changeLink}>Ganti</Text>
              </TouchableOpacity>
            </View>

            {/* Emergency Services Title */}
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitleText}>PILIH LAYANAN DARURAT</Text>
              <Text style={styles.sectionSubtitleText}>Estimasi Jasa</Text>
            </View>

            {/* Services Grid (Gojek Style) */}
            <View style={styles.servicesGrid}>
              {EMERGENCY_SERVICES.map((s) => {
                const isSelected = selectedService.id === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    activeOpacity={0.85}
                    onPress={() => setSelectedService(s)}
                    style={[styles.serviceBox, isSelected && styles.serviceBoxSelected]}
                  >
                    <View style={[styles.serviceIconWrap, isSelected && styles.serviceIconSelected]}>
                      <Ionicons
                        name={s.iconName || 'construct-outline'}
                        size={20}
                        color={isSelected ? '#FFFFFF' : '#DC2626'}
                      />
                    </View>
                    <Text style={styles.serviceBoxTitle} numberOfLines={1}>
                      {s.title}
                    </Text>
                    <Text style={styles.serviceBoxPrice}>~{formatRupiah(s.price)}</Text>
                    <Text style={styles.serviceBoxEta}>~{s.eta}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Problem Note */}
            <View style={styles.noteInputWrap}>
              <Ionicons name="create-outline" size={16} color="#64748B" />
              <TextInput
                style={styles.noteInput}
                placeholder="Catatan kendala: Aki drop, baut ban macet, radiator ngebul..."
                placeholderTextColor="#94A3B8"
                value={problemNote}
                onChangeText={setProblemNote}
              />
            </View>

            {/* Transparent Pricing Notice */}
            <View style={styles.pricingNotice}>
              <Ionicons name="shield-checkmark" size={16} color="#16A34A" />
              <Text style={styles.pricingNoticeText}>
                Biaya admin pemanggilan <Text style={{ fontWeight: 'bold' }}>Rp 10.000</Text> dipotong dari MontirPay. Jasa montir dibayar via QRIS setelah perbaikan selesai.
              </Text>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Gojek Big Red CTA Button */}
          <View style={styles.ctaBottomBar}>
            <View style={styles.ctaPriceRow}>
              <View>
                <Text style={styles.ctaFeeLabel}>Biaya Admin Pemanggilan:</Text>
                <Text style={styles.ctaFeeAmount}>Rp 10.000 (MontirPay)</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.ctaFeeLabel}>Estimasi Jasa Montir:</Text>
                <Text style={styles.ctaMechAmount}>~{formatRupiah(selectedService.price)}</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.gojekButton}
              onPress={handlePayAndCall}
            >
              <LinearGradient
                colors={['#DC2626', '#E11D48']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gojekButtonGradient}
              >
                <Ionicons name="radio-outline" size={20} color="#FFFFFF" />
                <Text style={styles.gojekButtonText}>PANGGIL MONTIR SEKARANG</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal Top Up MontirPay */}
        <Modal visible={topUpModalVisible} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="wallet" size={22} color="#DC2626" />
                  <Text style={styles.modalTitle}>Top Up Saldo MontirPay</Text>
                </View>
                <TouchableOpacity onPress={() => setTopUpModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSub}>
                Saldo saat ini: <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>{formatRupiah(driverWallet)}</Text>
              </Text>

              <Text style={styles.topUpChoiceLabel}>PILIH NOMINAL TOP UP INSTAN:</Text>
              <View style={styles.topUpGrid}>
                {[20000, 50000, 100000].map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={styles.topUpOption}
                    onPress={() => {
                      topUpDriverWallet(amt);
                      Alert.alert('Top Up Berhasil', `Saldo MontirPay bertambah ${formatRupiah(amt)}!`);
                      setTopUpModalVisible(false);
                    }}
                  >
                    <Text style={styles.topUpOptionText}>{formatRupiah(amt)}</Text>
                    <Text style={styles.topUpOptionSub}>Instan QRIS</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.qrisSimCard}>
                <Ionicons name="qr-code" size={28} color="#475569" />
                <Text style={styles.qrisSimText}>Mendukung QRIS Semua Bank & E-Wallet</Text>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ================= SCENARIO 2: SEARCHING ON REAL MAPS WITH RADAR =================
  if (activeOrder.status === 'searching') {
    return (
      <View style={styles.container}>
        {/* Full Interactive Map with Pulsing Radar on Streets */}
        <View style={{ flex: 1, width: '100%', position: 'relative' }}>
          <GojekMapView
            userCoords={activeOrder.userCoords || location || { latitude: -6.2255, longitude: 106.8120 }}
            mechanics={mechanics}
            orderStatus="searching"
            showRadar={true}
            height="100%"
          />

          {/* Floating Top Search Status Bar */}
          <View style={styles.searchingTopPill}>
            <View style={styles.searchSpinnerDot} />
            <Text style={styles.searchingTopText}>Mencari Montir Terdekat...</Text>
          </View>
        </View>

        {/* Bottom Searching Sheet */}
        <View style={styles.searchingBottomSheet}>
          <View style={styles.dragHandle} />

          <View style={styles.searchingContent}>
            <View style={styles.searchingRadarIconBox}>
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
              <Ionicons name="radio" size={32} color="#DC2626" />
            </View>

            <Text style={styles.searchingTitle}>Menghubungkan ke Montir Siaga</Text>
            <Text style={styles.searchingDesc}>
              Memindai montir terdekat di radius 3 km dari lokasi mobil Anda ({address}).
            </Text>

            <View style={styles.orderSummaryCard}>
              <View style={styles.orderSummaryRow}>
                <Text style={styles.orderSummaryLabel}>Layanan:</Text>
                <Text style={styles.orderSummaryVal}>{activeOrder.service?.title}</Text>
              </View>
              <View style={styles.orderSummaryRow}>
                <Text style={styles.orderSummaryLabel}>Biaya Admin Terbayar:</Text>
                <Text style={styles.orderSummaryValGreen}>Rp 10.000 (Lunas)</Text>
              </View>
              <View style={styles.orderSummaryRow}>
                <Text style={styles.orderSummaryLabel}>Estimasi Jasa Montir:</Text>
                <Text style={styles.orderSummaryVal}>~{formatRupiah(activeOrder.service?.price)} (QRIS)</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.cancelSearchBtn}
              onPress={() => {
                Alert.alert('Batalkan Pencarian', 'Batalkan pemanggilan montir?', [
                  { text: 'Tidak', style: 'cancel' },
                  { text: 'Batalkan', style: 'destructive', onPress: cancelOrder },
                ]);
              }}
            >
              <Text style={styles.cancelSearchBtnText}>Batalkan Pencarian</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ================= SCENARIO 3: MECHANIC ASSIGNED & TRACKING ON MAP =================
  const mech = activeOrder.mechanic || mechanics[0];
  const isBilled = !!activeOrder.mechanicBillAmount && activeOrder.mechanicBillAmount > 0;
  const isPaid = activeOrder.status === 'completed';

  return (
    <View style={styles.container}>
      {/* Real Map Showing Route Polyline & Moving Mechanic */}
      <View style={{ height: screenHeight * 0.48, width: '100%', position: 'relative' }}>
        <GojekMapView
          userCoords={activeOrder.userCoords || location || { latitude: -6.2255, longitude: 106.8120 }}
          mechanics={[mech]}
          assignedMechanic={mech}
          orderStatus={activeOrder.status}
          height="100%"
        />

        {/* Floating ETA Pill */}
        <View style={styles.etaFloatingPill}>
          <Ionicons name="time" size={16} color="#DC2626" />
          <Text style={styles.etaFloatingText}>
            {activeOrder.status === 'arrived'
              ? 'Montir Telah Tiba di Lokasi!'
              : activeOrder.status === 'repairing'
              ? 'Sedang Dalam Proses Perbaikan'
              : 'Montir Menuju Lokasi Anda • ~6 mnt'}
          </Text>
        </View>
      </View>

      {/* Tracking Bottom Sheet */}
      <View style={[styles.bottomSheet, { flex: 1 }]}>
        <View style={styles.dragHandle} />

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, paddingHorizontal: 16 }}>
          {/* Mechanic Profile Card */}
          <View style={styles.mechanicCard}>
            <View style={styles.mechAvatar}>
              <Ionicons name="person" size={24} color="#DC2626" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.mechName}>{mech.name}</Text>
                <View style={styles.officialBadge}>
                  <Text style={styles.officialBadgeText}>MITRA RESMI</Text>
                </View>
              </View>
              <Text style={styles.mechVehicle}>{mech.vehicle || 'Honda Vario 160 (B 4921 TZX)'}</Text>
              <Text style={styles.mechRating}>⭐ {mech.rating} • 342 Servis Selesai</Text>
            </View>

            {/* Quick Call & Chat Buttons */}
            <View style={styles.actionButtonsCol}>
              <TouchableOpacity
                style={styles.circleBtnGreen}
                onPress={() => Alert.alert('Hubungi Montir', `Menelepon ${mech.name} (${mech.phone || '0812-3456-7890'})...`)}
              >
                <Ionicons name="call" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.circleBtnBlue}
                onPress={() => setChatVisible(true)}
              >
                <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Status Timeline Progress */}
          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>STATUS PENANGANAN MOBIL</Text>
            <View style={styles.timelineRow}>
              <View style={[styles.timelineStep, { backgroundColor: '#16A34A' }]}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
              <View style={[styles.timelineLine, { backgroundColor: '#16A34A' }]} />
              <View
                style={[
                  styles.timelineStep,
                  { backgroundColor: activeOrder.status === 'assigned' ? '#CBD5E1' : '#16A34A' },
                ]}
              >
                <Ionicons
                  name={activeOrder.status === 'assigned' ? 'ellipse' : 'checkmark'}
                  size={12}
                  color="#FFFFFF"
                />
              </View>
              <View
                style={[
                  styles.timelineLine,
                  { backgroundColor: ['repairing', 'billing', 'completed'].includes(activeOrder.status) ? '#16A34A' : '#CBD5E1' },
                ]}
              />
              <View
                style={[
                  styles.timelineStep,
                  { backgroundColor: isPaid ? '#16A34A' : '#CBD5E1' },
                ]}
              >
                <Ionicons name={isPaid ? 'checkmark' : 'wallet'} size={12} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.timelineLabels}>
              <Text style={styles.timelineLabelActive}>Menuju Lokasi</Text>
              <Text style={['arrived', 'repairing', 'billing', 'completed'].includes(activeOrder.status) ? styles.timelineLabelActive : styles.timelineLabelMuted}>
                Di Tempat
              </Text>
              <Text style={isPaid ? styles.timelineLabelActive : styles.timelineLabelMuted}>
                Selesai QRIS
              </Text>
            </View>
          </View>

          {/* QRIS BILL NOTIFICATION (JIKA SUDAH DITERBITKAN MONTIR) */}
          {isBilled && !isPaid && (
            <View style={styles.qrisAlertCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.qrisIconWrap}>
                  <Ionicons name="qr-code" size={24} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.qrisAlertTitle}>Tagihan Jasa Perbaikan Montir</Text>
                  <Text style={styles.qrisAlertAmount}>{formatRupiah(activeOrder.mechanicBillAmount)}</Text>
                  <Text style={styles.qrisAlertNote}>
                    {activeOrder.mechanicBillNote || 'Jasa perbaikan & penggantian suku cadang'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.payQrisBtn}
                activeOpacity={0.88}
                onPress={() => setQrisModalVisible(true)}
              >
                <Ionicons name="scan" size={18} color="#FFFFFF" />
                <Text style={styles.payQrisBtnText}>BAYAR SEKARANG VIA QRIS</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* COMPLETED STATUS */}
          {isPaid && (
            <View style={styles.completedCard}>
              <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
              <Text style={styles.completedTitle}>Perbaikan Selesai & Lunas!</Text>
              <Text style={styles.completedDesc}>
                Terima kasih telah mempercayakan mobil Anda pada Montir Siaga. Seluruh tagihan jasa telah terbayar lunas via QRIS.
              </Text>
              <TouchableOpacity style={styles.resetBtn} onPress={resetOrder}>
                <Text style={styles.resetBtnText}>Pesan Layanan Baru</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* MODAL QRIS PEMBAYARAN JASA */}
      <Modal visible={qrisModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.qrisModalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="qr-code" size={24} color="#DC2626" />
                <Text style={styles.modalTitle}>Pembayaran QRIS Montir</Text>
              </View>
              <TouchableOpacity onPress={() => setQrisModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrisTotalBox}>
              <Text style={styles.qrisTotalLabel}>TOTAL TAGIHAN JASA</Text>
              <Text style={styles.qrisTotalAmount}>{formatRupiah(activeOrder?.mechanicBillAmount)}</Text>
              <Text style={styles.qrisDest}>Penerima: {mech.name} (Mitra Montir)</Text>
            </View>

            <View style={styles.qrisCodeContainer}>
              <View style={styles.qrisLogoRow}>
                <Text style={styles.qrisHeaderTitle}>QRIS</Text>
                <Text style={styles.qrisHeaderSub}>PEMBAYARAN DIGITAL NASIONAL</Text>
              </View>
              {/* Simulated QR Code Graphic */}
              <View style={styles.qrGraphic}>
                <Ionicons name="qr-code-outline" size={160} color="#0F172A" />
              </View>
              <Text style={styles.qrisNmid}>NMID: ID1029384756201</Text>
            </View>

            <TouchableOpacity
              style={styles.confirmQrisBtn}
              activeOpacity={0.88}
              onPress={handleConfirmPayQris}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.confirmQrisBtnText}>KONFIRMASI BAYAR ({formatRupiah(activeOrder?.mechanicBillAmount)})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CHAT MODAL */}
      <Modal visible={chatVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { height: screenHeight * 0.75 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chat dengan {mech.name}</Text>
              <TouchableOpacity onPress={() => setChatVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1, padding: 12 }}>
              {chatMessages.map((m, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.chatBubble,
                    m.sender === 'user' ? styles.chatBubbleUser : styles.chatBubbleMech,
                  ]}
                >
                  <Text style={m.sender === 'user' ? styles.chatTextUser : styles.chatTextMech}>
                    {m.text}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Tulis pesan..."
                value={chatInput}
                onChangeText={setChatInput}
              />
              <TouchableOpacity style={styles.chatSendBtn} onPress={handleSendMessage}>
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  floatingTopBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 36,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 200,
  },
  montirPayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    gap: 8,
  },
  montirPayIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  montirPayLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  montirPayValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  topUpBadge: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 12,
  },
  topUpBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  sosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  greenLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  sosBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  floatingPickupCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    gap: 10,
    zIndex: 200,
  },
  pickupPinBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  pickupAddress: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  refreshLocBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginVertical: 10,
  },
  sheetScroll: {
    paddingHorizontal: 16,
  },
  vehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 8,
    marginBottom: 12,
  },
  vehicleName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  changeLink: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitleText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceBox: {
    width: (width - 48) / 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
  },
  serviceBoxSelected: {
    borderColor: '#DC2626',
    backgroundColor: '#FFF1F2',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  serviceIconSelected: {
    backgroundColor: '#DC2626',
  },
  serviceBoxTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 2,
  },
  serviceBoxPrice: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  serviceBoxEta: {
    fontSize: 9,
    color: '#64748B',
  },
  noteInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginTop: 12,
    gap: 8,
  },
  noteInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    paddingVertical: 9,
  },
  pricingNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    marginTop: 10,
  },
  pricingNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
  },
  ctaBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  ctaPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ctaFeeLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  ctaFeeAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#DC2626',
  },
  ctaMechAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  gojekButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gojekButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  gojekButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  // Searching State Styles
  searchingTopPill: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 36,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  searchSpinnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  searchingTopText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  searchingBottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  searchingContent: {
    alignItems: 'center',
    paddingTop: 10,
  },
  searchingRadarIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 14,
  },
  radarPulseRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#DC2626',
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
  },
  searchingTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  searchingDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  orderSummaryCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 6,
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderSummaryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  orderSummaryVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderSummaryValGreen: {
    fontSize: 12,
    fontWeight: '900',
    color: '#16A34A',
  },
  cancelSearchBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  cancelSearchBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  // Tracking State Styles
  etaFloatingPill: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 36,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  etaFloatingText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  mechanicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 10,
  },
  mechAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mechName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  officialBadge: {
    backgroundColor: '#DC2626',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  officialBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  mechVehicle: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  mechRating: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 2,
  },
  actionButtonsCol: {
    flexDirection: 'row',
    gap: 8,
  },
  circleBtnGreen: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  circleBtnBlue: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  timelineTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  timelineStep: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    flex: 1,
    height: 3,
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timelineLabelActive: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
  },
  timelineLabelMuted: {
    fontSize: 10,
    color: '#94A3B8',
  },
  qrisAlertCard: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1.5,
    borderColor: '#FDA4AF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  qrisIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  qrisAlertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9F1239',
  },
  qrisAlertAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#BE123C',
    marginTop: 2,
  },
  qrisAlertNote: {
    fontSize: 10,
    color: '#881337',
    marginTop: 2,
  },
  payQrisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
    marginTop: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  payQrisBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  completedCard: {
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
    marginTop: 8,
  },
  completedDesc: {
    fontSize: 11,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 14,
  },
  resetBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  qrisModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  topUpChoiceLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  topUpGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  topUpOption: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  topUpOptionText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  topUpOptionSub: {
    fontSize: 9,
    color: '#16A34A',
    fontWeight: '700',
    marginTop: 2,
  },
  qrisSimCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    justifyContent: 'center',
  },
  qrisSimText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  qrisTotalBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  qrisTotalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  qrisTotalAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#DC2626',
    marginVertical: 2,
  },
  qrisDest: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  qrisCodeContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
  },
  qrisLogoRow: {
    alignItems: 'center',
    marginBottom: 6,
  },
  qrisHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 1,
  },
  qrisHeaderSub: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  qrGraphic: {
    padding: 4,
    backgroundColor: '#FFFFFF',
  },
  qrisNmid: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 4,
  },
  confirmQrisBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmQrisBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  chatBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 14,
    marginBottom: 8,
  },
  chatBubbleUser: {
    backgroundColor: '#DC2626',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  chatBubbleMech: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
  },
  chatTextUser: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  chatTextMech: {
    color: '#0F172A',
    fontSize: 12,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  chatSendBtn: {
    backgroundColor: '#DC2626',
    padding: 10,
    borderRadius: 12,
  },
});
