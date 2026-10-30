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

const QUICK_SYMPTOMS = [
  { id: 'aki', label: '🔋 Aki Soak', text: 'Aki soak tidak bisa starter' },
  { id: 'ban', label: '🛞 Ban Bocor', text: 'Ban bocor kena paku butuh tambal / ganti serep' },
  { id: 'overheat', label: '💨 Overheat', text: 'Mesin overheat radiator mendidih berasap' },
  { id: 'mogok', label: '⚠️ Mesin Mati', text: 'Mesin mati mendadak mogok di jalan' },
  { id: 'derek', label: '⛓️ Derek / Towing', text: 'Butuh truk derek / towing gendong' },
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

  const [damageNote, setDamageNote] = useState('Aki soak tidak bisa starter');
  const [vehicle, setVehicle] = useState('Toyota Avanza 1.3 G (B 1234 SKA)');
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

  const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

  const displayAddress = customAddress || address || 'Jl. Sudirman No. 45, Jakarta Selatan';
  const displayDest = 'Montir Terdekat (Pak Agus Santoso - 1.2 km)';

  const handlePanggilMontir = async () => {
    if (!damageNote.trim()) {
      Alert.alert('Perhatian', 'Silakan ketik atau pilih kendala mobil Anda terlebih dahulu.');
      return;
    }

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
      'Konfirmasi Panggil Montir',
      `Potong saldo MontirPay Rp 10.000 untuk biaya admin platform?\n\nKendala: ${damageNote}\n\n(Biaya jasa perbaikan nantinya ditagihkan montir via QRIS di tempat setelah selesai)`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Panggil Sekarang ➔',
          onPress: async () => {
            const userCoords = location || { latitude: -6.2255, longitude: 106.8120 };
            const servicePayload = {
              id: 'emergency_call',
              title: 'Panggilan Montir Siaga',
              desc: damageNote,
              price: 85000,
              iconName: 'construct',
              eta: '10-15 mnt',
            };
            const res = await createOrder(servicePayload, displayAddress, userCoords, vehicle, damageNote);
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

  // ================= SCENARIO 1: HOME (HANYA INPUT KERUSAKAN & TOMBOL PANGGIL) =================
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

          {/* Floating Address Card */}
          <View style={styles.gojekAddressCard}>
            <View style={styles.addressLeftCol}>
              <View style={styles.addressRow}>
                <View style={styles.greenDot} />
                <Text style={styles.addressText} numberOfLines={1}>
                  {displayAddress}
                </Text>
              </View>
              <View style={styles.addressDivider} />
              <View style={styles.addressRow}>
                <View style={styles.orangeDot} />
                <Text style={styles.addressText} numberOfLines={1}>
                  {displayDest}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editPillBtn}
              activeOpacity={0.8}
              onPress={() => setEditAddressModal(true)}
            >
              <Text style={styles.editPillText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Floating Round Buttons */}
          <TouchableOpacity style={styles.floatingRoundBtnLeft} activeOpacity={0.85} onPress={refreshLocation}>
            <Ionicons name="arrow-back" size={20} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.floatingRoundBtnRight} activeOpacity={0.85} onPress={refreshLocation}>
            <Ionicons name="locate" size={20} color="#00AA13" />
          </TouchableOpacity>
        </View>

        {/* Gojek Bottom Sheet: POV Pemilik Mobil */}
        <View style={styles.gojekBottomSheet}>
          <View style={styles.dragHandleBar} />

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
            {/* Vehicle Card */}
            <View style={styles.vehicleInfoBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Text style={{ fontSize: 16 }}>🚘</Text>
                <Text style={styles.vehicleNameText} numberOfLines={1}>{vehicle}</Text>
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
                <Text style={styles.changeVehLink}>Ganti Mobil</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Symptom Chips */}
            <View style={{ marginTop: 4 }}>
              <Text style={styles.sectionHeaderTitle}>PILIH CEPAT KENDALA (KLIK):</Text>
              <View style={styles.chipsContainer}>
                {QUICK_SYMPTOMS.map((chip) => {
                  const isSelected = damageNote.includes(chip.id) || damageNote === chip.text;
                  return (
                    <TouchableOpacity
                      key={chip.id}
                      style={[styles.chipButton, isSelected && styles.chipButtonSelected]}
                      onPress={() => setDamageNote(chip.text)}
                    >
                      <Text style={[styles.chipButtonText, isSelected && styles.chipButtonTextSelected]}>
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Damage Description Input Area */}
            <View style={styles.damageInputCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="create-outline" size={16} color="#00AA13" />
                <Text style={styles.damageInputLabel}>Jelaskan Kerusakan / Kendala Mobil:</Text>
              </View>
              <TextInput
                style={styles.damageTextInput}
                multiline
                numberOfLines={3}
                placeholder="Contoh: Aki soak tidak bisa starter, ban depan kanan bocor kena baut, atau mesin overheat mendadak..."
                placeholderTextColor="#94A3B8"
                value={damageNote}
                onChangeText={setDamageNote}
              />
            </View>

            {/* Platform Transparency Notice */}
            <View style={styles.feeNoticeBox}>
              <Ionicons name="shield-checkmark" size={18} color="#16A34A" />
              <Text style={styles.feeNoticeText}>
                Biaya admin pemanggilan <Text style={{ fontWeight: 'bold' }}>Rp 10.000</Text> masuk ke Owner via MontirPay. Jasa montir & sparepart dibayar langsung ke montir via QRIS di tempat.
              </Text>
            </View>
          </ScrollView>

          {/* Fixed Pinned Bottom Bar (MontirPay + Tombol Panggil) */}
          <View style={styles.fixedBottomContainer}>
            <View style={styles.paymentMethodBar}>
              <View style={styles.paymentLeft}>
                <View style={styles.goPayIconCircle}>
                  <Ionicons name="wallet" size={14} color="#FFFFFF" />
                </View>
                <Text style={styles.goPayTitle}>MontirPay:</Text>
                <Text style={styles.goPayBalance}>{formatRupiah(driverWallet)}</Text>
                <TouchableOpacity onPress={() => setTopUpModalVisible(true)} style={styles.topUpSmallPill}>
                  <Text style={styles.topUpSmallText}>+ Isi Saldo</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.adminFeeSmallText}>Admin: <Text style={{ fontWeight: 'bold' }}>Rp 10.000</Text></Text>
            </View>

            {/* Big Green Order Button */}
            <TouchableOpacity
              style={styles.bigGreenOrderBtn}
              activeOpacity={0.9}
              onPress={handlePanggilMontir}
            >
              <View style={styles.orderBtnLeftCol}>
                <Text style={styles.orderBtnTitle}>🚨 PANGGIL MONTIR SEKARANG</Text>
                <Text style={styles.orderBtnSubtitle}>
                  Admin Rp 10.000 (Owner) • Montir Terdekat Langsung Meluncur
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

          <View style={styles.searchingTopPill}>
            <View style={styles.greenPulseDot} />
            <Text style={styles.searchingTopText}>Mencari Montir Terdekat...</Text>
          </View>
        </View>

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
              Memindai montir standby terdekat di sekitar lokasi Anda...
            </Text>

            <View style={styles.orderSummaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Kendala:</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>{damageNote}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Admin Terbayar:</Text>
                <Text style={[styles.summaryValue, { color: '#00AA13' }]}>Rp 10.000 (Owner)</Text>
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

  // ================= SCENARIO 3: TRACKING & QRIS BILLING =================
  const isBilling = activeOrder.status === 'billing' || activeOrder.mechanicBilled;

  return (
    <View style={styles.container}>
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

      <View style={styles.assignedBottomSheet}>
        <View style={styles.dragHandleBar} />

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

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.circleActionBtn} onPress={() => setChatVisible(true)}>
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
            <TouchableOpacity style={styles.payQrisBtn} onPress={() => setQrisModalVisible(true)}>
              <Ionicons name="qr-code" size={18} color="#FFFFFF" />
              <Text style={styles.payQrisBtnText}>Bayar Sekarang (QRIS Montir)</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeOrder.status === 'completed' && (
          <TouchableOpacity style={styles.doneBtn} onPress={resetOrder}>
            <Text style={styles.doneBtnText}>Selesai & Kembali ke Beranda</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* QRIS Modal */}
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
                style={[styles.chatBubble, m.sender === 'user' ? styles.chatBubbleUser : styles.chatBubbleOther]}
              >
                <Text style={m.sender === 'user' ? styles.chatTextUser : styles.chatTextOther}>{m.text}</Text>
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Floating Address Card
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
  addressLeftCol: { flex: 1, paddingRight: 10 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greenDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#00AA13' },
  orangeDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FA541C' },
  addressText: { fontSize: 13, fontWeight: '700', color: '#1E293B', flex: 1 },
  addressDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 6, marginLeft: 22 },
  editPillBtn: {
    borderWidth: 1.5,
    borderColor: '#00AA13',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  editPillText: { color: '#00AA13', fontWeight: '800', fontSize: 13 },

  // Floating Round Buttons
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

  // Bottom Sheet
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

  formScroll: { flex: 1, paddingHorizontal: 16 },

  // Vehicle info
  vehicleInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  vehicleNameText: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  changeVehLink: { fontSize: 12, fontWeight: '800', color: '#DC2626' },

  // Quick Chips
  sectionHeaderTitle: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 6 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chipButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipButtonSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  chipButtonText: { fontSize: 11.5, fontWeight: '700', color: '#334155' },
  chipButtonTextSelected: { color: '#DC2626', fontWeight: '800' },

  // Damage Input
  damageInputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#00AA13',
    padding: 12,
    marginBottom: 10,
  },
  damageInputLabel: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  damageTextInput: {
    fontSize: 13,
    color: '#0F172A',
    minHeight: 50,
    textAlignVertical: 'top',
    marginTop: 4,
  },

  // Fee notice
  feeNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  feeNoticeText: { fontSize: 11.5, color: '#166534', flex: 1, lineHeight: 16 },

  // Pinned Bottom Bar
  fixedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
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
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goPayIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goPayTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  goPayBalance: { fontSize: 13, fontWeight: '800', color: '#0284C7' },
  topUpSmallPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  topUpSmallText: { fontSize: 10, fontWeight: '800', color: '#0284C7' },
  adminFeeSmallText: { fontSize: 11, color: '#64748B' },

  // Big Green Order Button
  bigGreenOrderBtn: {
    backgroundColor: '#00AA13',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#00AA13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  orderBtnLeftCol: { flex: 1 },
  orderBtnTitle: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
  orderBtnSubtitle: { fontSize: 10.5, color: '#DCFCE7', marginTop: 1, fontWeight: '500' },
  orderBtnArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  greenPulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00AA13' },
  searchingTopText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
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
  searchingContent: { alignItems: 'center', paddingTop: 8 },
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
  searchingTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  searchingDesc: { fontSize: 12.5, color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 12 },
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
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 12, color: '#64748B' },
  summaryValue: { fontSize: 12.5, fontWeight: '700', color: '#0F172A' },
  cancelBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  cancelBtnText: { color: '#DC2626', fontWeight: '800', fontSize: 13 },

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
  etaFloatingText: { fontSize: 13, fontWeight: '800', color: '#00AA13' },
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
  mechanicProfileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
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
  mechanicNameText: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  starText: { fontSize: 11, fontWeight: '800', color: '#B45309' },
  mechanicVehicleText: { fontSize: 12, color: '#475569', marginTop: 2 },
  mechanicPhoneText: { fontSize: 11, color: '#94A3B8' },
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
  billingHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billingTitle: { fontSize: 14, fontWeight: '800', color: '#00AA13' },
  billingAmount: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  billingDesc: { fontSize: 12, color: '#475569', marginTop: 4, marginBottom: 10 },
  payQrisBtn: {
    backgroundColor: '#00AA13',
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  payQrisBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  doneBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  doneBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

  // Modals
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  editAddressSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalSheetTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
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
  modalActionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },

  topUpSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 14 },
  topUpChoiceLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 10 },
  topUpGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  topUpOptionCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topUpAmountText: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  topUpSubLabel: { fontSize: 10, color: '#00AA13', fontWeight: '700', marginTop: 2 },

  // QRIS Payment Modal
  qrisModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  qrisModalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  qrisBarcodeBox: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrisMerchantName: { fontSize: 11, color: '#64748B', marginTop: 6, fontWeight: '600' },
  qrisOwnerName: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  qrisTotalCard: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  qrisTotalLabel: { fontSize: 12, color: '#64748B' },
  qrisTotalVal: { fontSize: 20, fontWeight: '900', color: '#00AA13', marginVertical: 2 },
  qrisSplitNote: { fontSize: 10.5, color: '#15803D', fontWeight: '600' },
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
  confirmQrisBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },

  // Chat Container
  chatContainer: { flex: 1, backgroundColor: '#F8FAFC' },
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
  chatTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  chatScroll: { flex: 1, padding: 16 },
  chatBubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, marginBottom: 8 },
  chatBubbleUser: { alignSelf: 'flex-end', backgroundColor: '#00AA13' },
  chatBubbleOther: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  chatTextUser: { color: '#FFFFFF', fontSize: 13 },
  chatTextOther: { color: '#0F172A', fontSize: 13 },
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
