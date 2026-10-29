import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import GojekMapView from './GojekMapView';

export default function MechanicView() {
  const {
    activeOrder,
    acceptOrder,
    updateOrderStatus,
    generateMechanicBill,
    mechanicOnline,
    setMechanicOnline,
    mechanics,
    chatMessages,
    addChatMessage,
  } = useApp();

  const [chatVisible, setChatVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Bill input state for mechanic
  const [customBillAmount, setCustomBillAmount] = useState('');
  const [customBillNote, setCustomBillNote] = useState('');

  const me = mechanics[0];

  const alertScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (activeOrder?.mechanicEstimatedFee && !customBillAmount) {
      setCustomBillAmount(activeOrder.mechanicEstimatedFee.toString());
      setCustomBillNote(`Jasa ${activeOrder.service?.title || 'perbaikan darurat'}`);
    }
  }, [activeOrder?.mechanicEstimatedFee]);

  useEffect(() => {
    if (activeOrder?.status === 'searching' && mechanicOnline) {
      const alertLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(alertScale, { toValue: 1.04, duration: 400, useNativeDriver: true }),
          Animated.timing(alertScale, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      );
      alertLoop.start();
      return () => alertLoop.stop();
    }
  }, [activeOrder?.status, mechanicOnline]);

  const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    addChatMessage('mechanic', chatInput.trim());
    setChatInput('');
  };

  const handleSendBill = () => {
    const amount = Number(customBillAmount.replace(/[^0-9]/g, ''));
    if (!amount || amount <= 0) {
      Alert.alert('Nominal Tidak Valid', 'Masukkan nominal tagihan perbaikan yang sah.');
      return;
    }

    Alert.alert(
      'Terbitkan Tagihan QRIS',
      `Terbitkan tagihan sebesar ${formatRupiah(amount)} (${customBillNote || 'Jasa perbaikan'}) ke pengemudi mobil?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Terbitkan QRIS',
          onPress: () => generateMechanicBill(amount, customBillNote),
        },
      ]
    );
  };

  const handleWithdraw = () => {
    Alert.alert(
      'Tarik Saldo Dompet',
      `Tarik ${formatRupiah(me.walletBalance)} ke rekening BCA ${me.name}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Tarik Sekarang', onPress: () => Alert.alert('Berhasil', 'Dana diproses ke rekening Anda dalam 1-5 menit.') },
      ]
    );
  };

  const hasIncomingOrder = activeOrder?.status === 'searching' && mechanicOnline;
  const isMyOrder = activeOrder && ['assigned', 'arrived', 'repairing', 'billing', 'completed'].includes(activeOrder.status);

  return (
    <View style={styles.container}>
      {/* Top Header Light Theme */}
      <View style={styles.header}>
        <View style={styles.headerProfileRow}>
          <View style={styles.avatarWrap}>
            <Ionicons name="construct" size={22} color="#DC2626" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.nameText}>{me.name}</Text>
              <View style={styles.officialBadge}>
                <Text style={styles.officialBadgeText}>MITRA RESMI</Text>
              </View>
            </View>
            <Text style={styles.metaText}>
              ⭐ {me.rating} • {me.jobsCompleted} Servis • 🛵 {me.vehicle}
            </Text>
          </View>
        </View>

        {/* Online / Offline Status Toggle Bar */}
        <View style={styles.onlineBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.statusDot, { backgroundColor: mechanicOnline ? '#16A34A' : '#EF4444' }]} />
            <View>
              <Text style={styles.onlineTitle}>
                {mechanicOnline ? 'STATUS: SIAGA TERIMA ORDER' : 'STATUS: OFFLINE / ISTIRAHAT'}
              </Text>
              <Text style={styles.onlineSub}>
                {mechanicOnline ? 'GPS & radar aktif menerima panggilan darurat' : 'Anda tidak akan menerima order'}
              </Text>
            </View>
          </View>
          <Switch
            value={mechanicOnline}
            onValueChange={setMechanicOnline}
            trackColor={{ false: '#CBD5E1', true: '#DC2626' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ================= SCENARIO A: REAL MAP RADAR PEMINDAI ================= */}
        {!isMyOrder && (
          <View style={styles.radarCard}>
            <View style={styles.radarHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="radio" size={18} color="#DC2626" />
                <Text style={styles.radarTitle}>RADAR PEMINDAI PANGGILAN (MAPS)</Text>
              </View>
              <View style={styles.radiusPill}>
                <Text style={styles.radiusBadge}>Radius 5 Km</Text>
              </View>
            </View>

            {/* REAL STREET MAP EMBEDDED */}
            <View style={styles.mapFrame}>
              <GojekMapView
                userCoords={hasIncomingOrder ? activeOrder?.userCoords : me.coords}
                mechanics={[me]}
                orderStatus={mechanicOnline ? (hasIncomingOrder ? 'searching' : 'idle') : 'idle'}
                showRadar={mechanicOnline}
                height={230}
              />
            </View>

            <View style={styles.radarFooter}>
              <Text style={styles.radarFootText}>
                {mechanicOnline
                  ? hasIncomingOrder
                    ? '🚨 ORDER MASUK! Ada mobil mogok di peta, segera konfirmasi panggilan!'
                    : '🟢 Radar aktif memindai sinyal GPS mobil mogok di sekitar Anda.'
                  : '🔴 Status Offline. Aktifkan saklar di atas untuk mulai menerima order.'}
              </Text>
            </View>
          </View>
        )}

        {/* ================= INCOMING ORDER POPUP ALERT ================= */}
        {hasIncomingOrder && (
          <Animated.View style={[styles.incomingAlertCard, { transform: [{ scale: alertScale }] }]}>
            <LinearGradient
              colors={['#DC2626', '#E11D48']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.incomingHeaderGradient}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="warning" size={20} color="#FFFFFF" />
                <Text style={styles.incomingAlertTitle}>PANGGILAN DARURAT MASUK!</Text>
              </View>
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>~1.2 KM</Text>
              </View>
            </LinearGradient>

            <View style={styles.incomingBody}>
              <View style={styles.incomingRow}>
                <Ionicons name="location" size={18} color="#DC2626" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.incomingLabel}>LOKASI MOBIL MOGOK</Text>
                  <Text style={styles.incomingVal} numberOfLines={2}>
                    {activeOrder.userAddress}
                  </Text>
                </View>
              </View>

              <View style={styles.incomingRow}>
                <Ionicons name="car-sport" size={18} color="#475569" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.incomingLabel}>KENDARAAN & KENDALA</Text>
                  <Text style={styles.incomingVal}>
                    {activeOrder.vehicle} • <Text style={{ color: '#DC2626', fontWeight: 'bold' }}>{activeOrder.service?.title}</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.paymentBoxIncoming}>
                <View style={styles.paySplitRow}>
                  <Text style={styles.paySplitLabel}>Admin Aplikasi (MontirPay):</Text>
                  <Text style={styles.paySplitValGreen}>Rp 10.000 (Dibayar Driver ke Owner)</Text>
                </View>
                <View style={[styles.paySplitRow, { marginTop: 4 }]}>
                  <Text style={styles.paySplitLabelBold}>ESTIMASI JASA ANDA:</Text>
                  <Text style={styles.paySplitValCash}>{formatRupiah(activeOrder.mechanicEstimatedFee)}</Text>
                </View>
                <Text style={styles.cashNoticeText}>
                  💳 Biaya jasa 100% Anda terima via QRIS dari pengemudi setelah selesai servis.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.acceptOrderBtn}
                activeOpacity={0.88}
                onPress={() => acceptOrder(me.id)}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.acceptOrderBtnText}>TERIMA PANGGILAN DARURAT</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ================= SCENARIO B: ACTIVE ORDER & PAYMENT GATEWAY ================= */}
        {isMyOrder && (
          <View style={styles.activeJobCard}>
            <View style={styles.jobHeaderRow}>
              <View>
                <Text style={styles.jobBadge}>PESANAN AKTIF #{activeOrder.id}</Text>
                <Text style={styles.jobTitle}>{activeOrder.service?.title}</Text>
                <Text style={styles.jobVehicle}>🚘 {activeOrder.vehicle}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.jobTargetLabel}>Status:</Text>
                <Text style={styles.jobTargetStatus}>{activeOrder.status.toUpperCase()}</Text>
              </View>
            </View>

            {/* REAL MAP EMBEDDED SHOWING ROUTE TO DRIVER */}
            <View style={[styles.mapFrame, { marginVertical: 10 }]}>
              <GojekMapView
                userCoords={activeOrder.userCoords || { latitude: -6.2255, longitude: 106.8120 }}
                mechanics={[me]}
                assignedMechanic={me}
                orderStatus={activeOrder.status}
                height={200}
              />
            </View>

            <View style={styles.locationBox}>
              <Ionicons name="location" size={16} color="#DC2626" />
              <Text style={styles.locationText} numberOfLines={2}>
                {activeOrder.userAddress}
              </Text>
            </View>

            <TouchableOpacity style={styles.chatDriverBtn} onPress={() => setChatVisible(true)}>
              <Ionicons name="chatbubbles" size={18} color="#0F172A" />
              <Text style={styles.chatDriverBtnText}>Buka Chat Pengemudi ({chatMessages.length})</Text>
            </TouchableOpacity>

            {/* Stepper Steps */}
            <Text style={styles.stepperTitle}>PROGRES PENANGANAN:</Text>

            {activeOrder.status === 'assigned' && (
              <TouchableOpacity
                style={styles.stepBtnPrimary}
                onPress={() => updateOrderStatus('arrived')}
              >
                <Ionicons name="flag" size={18} color="#FFFFFF" />
                <Text style={styles.stepBtnText}>1. SAYA SUDAH TIBA DI LOKASI</Text>
              </TouchableOpacity>
            )}

            {activeOrder.status === 'arrived' && (
              <TouchableOpacity
                style={styles.stepBtnPrimary}
                onPress={() => updateOrderStatus('repairing')}
              >
                <Ionicons name="construct" size={18} color="#FFFFFF" />
                <Text style={styles.stepBtnText}>2. MULAI DIAGNOSTIK & PERBAIKAN</Text>
              </TouchableOpacity>
            )}

            {/* STEP 3: MECHANIC INPUT BILL & GENERATE QRIS */}
            {activeOrder.status === 'repairing' && (
              <View style={styles.billInputContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="qr-code" size={20} color="#DC2626" />
                  <Text style={styles.billInputHeader}>TERBITKAN TAGIHAN JASA QRIS:</Text>
                </View>

                <Text style={styles.inputFieldLabel}>Nominal Biaya Perbaikan (Rp):</Text>
                <TextInput
                  style={styles.billAmountInput}
                  keyboardType="numeric"
                  placeholder="Contoh: 85000"
                  placeholderTextColor="#94A3B8"
                  value={customBillAmount}
                  onChangeText={setCustomBillAmount}
                />

                <Text style={[styles.inputFieldLabel, { marginTop: 8 }]}>Rincian Pekerjaan / Sparepart:</Text>
                <TextInput
                  style={styles.billNoteInput}
                  placeholder="Contoh: Jumper aki + setel klep mesin"
                  placeholderTextColor="#94A3B8"
                  value={customBillNote}
                  onChangeText={setCustomBillNote}
                />

                <TouchableOpacity
                  style={styles.generateQrisBtn}
                  activeOpacity={0.88}
                  onPress={handleSendBill}
                >
                  <Ionicons name="qr-code" size={18} color="#FFFFFF" />
                  <Text style={styles.generateQrisBtnText}>BUAT QRIS & KIRIM KE DRIVER</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* WAITING FOR DRIVER TO PAY QRIS */}
            {activeOrder.status === 'billing' && (
              <View style={styles.waitingQrisBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.loadingPulseDot} />
                  <Text style={styles.waitingQrisTitle}>MENUNGGU DRIVER BAYAR QRIS</Text>
                </View>
                <Text style={styles.waitingQrisAmount}>{formatRupiah(activeOrder.mechanicBillAmount)}</Text>
                <Text style={styles.waitingQrisNote}>{activeOrder.mechanicBillNote}</Text>
                <Text style={styles.waitingQrisSub}>
                  Kode QRIS telah muncul di HP pengemudi. Begitu driver bayar, saldo 100% langsung masuk ke dompet Anda.
                </Text>
              </View>
            )}

            {/* COMPLETED SUCCESS NOTIFICATION */}
            {activeOrder.status === 'completed' && (
              <View style={styles.doneNoticeBox}>
                <Ionicons name="checkmark-circle" size={32} color="#16A34A" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.doneNoticeTitle}>PEMBAYARAN QRIS LUNAS!</Text>
                  <Text style={styles.doneNoticeVal}>
                    {formatRupiah(activeOrder.mechanicBillAmount)} telah masuk 100% ke dompet pendapatan Anda.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Mechanic Wallet Balance Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletTop}>
            <View>
              <Text style={styles.walletSub}>DOMPET PENDAPATAN MONTIR</Text>
              <Text style={styles.walletVal}>{formatRupiah(me.walletBalance)}</Text>
              <Text style={styles.walletHint}>100% dana dari tagihan QRIS driver masuk ke sini</Text>
            </View>
            <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}>
              <Ionicons name="arrow-up-circle" size={18} color="#FFFFFF" />
              <Text style={styles.withdrawBtnText}>Tarik Dana</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Chat Modal */}
      <Modal visible={chatVisible} animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { height: Dimensions.get('window').height * 0.75 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chat dengan Pengemudi Mobil</Text>
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
                    m.sender === 'mechanic' ? styles.chatBubbleMech : styles.chatBubbleUser,
                  ]}
                >
                  <Text style={m.sender === 'mechanic' ? styles.chatTextMech : styles.chatTextUser}>
                    {m.text}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Ketik pesan untuk pengemudi..."
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 48 : 36,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 15,
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
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  onlineBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  onlineTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
  },
  onlineSub: {
    fontSize: 10,
    color: '#64748B',
  },
  scrollContent: {
    padding: 16,
  },
  radarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  radarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  radarTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
  },
  radiusPill: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  radiusBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  mapFrame: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radarFooter: {
    marginTop: 10,
  },
  radarFootText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  incomingAlertCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#DC2626',
    marginBottom: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  incomingHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  incomingAlertTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  countdownBadge: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  countdownText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#DC2626',
  },
  incomingBody: {
    padding: 14,
  },
  incomingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  incomingLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  incomingVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  paymentBoxIncoming: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paySplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paySplitLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  paySplitValGreen: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
  },
  paySplitLabelBold: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F172A',
  },
  paySplitValCash: {
    fontSize: 15,
    fontWeight: '900',
    color: '#DC2626',
  },
  cashNoticeText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
  },
  acceptOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  acceptOrderBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  activeJobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  jobHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  jobVehicle: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  jobTargetLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
  },
  jobTargetStatus: {
    fontSize: 11,
    fontWeight: '900',
    color: '#16A34A',
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    marginBottom: 10,
  },
  locationText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  chatDriverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 14,
  },
  chatDriverBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepperTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  stepBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
  },
  stepBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  billInputContainer: {
    backgroundColor: '#FFF1F2',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FECDD3',
  },
  billInputHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: '#9F1239',
  },
  inputFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#881337',
    marginBottom: 4,
  },
  billAmountInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDA4AF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '900',
    color: '#BE123C',
  },
  billNoteInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDA4AF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
  },
  generateQrisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    marginTop: 12,
  },
  generateQrisBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  waitingQrisBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 14,
  },
  loadingPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D97706',
  },
  waitingQrisTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#92400E',
  },
  waitingQrisAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#B45309',
    marginTop: 4,
  },
  waitingQrisNote: {
    fontSize: 11,
    color: '#78350F',
    marginTop: 2,
  },
  waitingQrisSub: {
    fontSize: 10,
    color: '#92400E',
    marginTop: 6,
    lineHeight: 14,
  },
  doneNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 12,
  },
  doneNoticeTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#15803D',
  },
  doneNoticeVal: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
  },
  walletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  walletTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletSub: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  walletVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  walletHint: {
    fontSize: 10,
    color: '#16A34A',
    marginTop: 2,
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  withdrawBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  chatBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 14,
    marginBottom: 8,
  },
  chatBubbleMech: {
    backgroundColor: '#DC2626',
    alignSelf: 'flex-end',
  },
  chatBubbleUser: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
  },
  chatTextMech: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  chatTextUser: {
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
