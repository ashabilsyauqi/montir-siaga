import React, { useState } from 'react';
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
} from 'react-native';
import { useApp } from '../context/AppContext';

export default function MechanicView() {
  const {
    activeOrder,
    acceptOrder,
    updateOrderStatus,
    mechanicOnline,
    setMechanicOnline,
    mechanics,
    chatMessages,
    addChatMessage,
  } = useApp();

  const [chatVisible, setChatVisible] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Default active logged-in mechanic profile
  const me = mechanics[0]; // Pak Agus Santoso

  const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    addChatMessage('mechanic', chatInput.trim());
    setChatInput('');
  };

  const handleWithdraw = () => {
    Alert.alert(
      'Tarik Saldo Dompet',
      `Tarik ${formatRupiah(me.walletBalance)} ke rekening BCA ${me.name} (Rekening Terverifikasi)?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Tarik Sekarang', onPress: () => Alert.alert('Berhasil', 'Dana diproses dalam 1-5 menit.') },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Mechanic Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 24 }}>👨🏻‍🔧</Text>
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.name}>{me.name}</Text>
                <View style={styles.verifiedTag}>
                  <Text style={styles.verifiedText}>MITRA RESMI</Text>
                </View>
              </View>
              <Text style={styles.rating}>⭐ {me.rating} • {me.jobsCompleted} Servis Selesai</Text>
              <Text style={styles.vehicleInfo}>🛵 {me.vehicle}</Text>
            </View>
          </View>
        </View>

        {/* Online Status Toggle */}
        <View style={styles.onlineCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.statusDot, { backgroundColor: mechanicOnline ? '#10b981' : '#ef4444' }]} />
            <View>
              <Text style={styles.onlineTitle}>
                {mechanicOnline ? 'STATUS: SIAGA TERIMA ORDER' : 'STATUS: OFFLINE / ISTIRAHAT'}
              </Text>
              <Text style={styles.onlineSub}>
                {mechanicOnline ? 'GPS aktif & siap menerima panggilan darurat' : 'Anda tidak akan menerima pesanan baru'}
              </Text>
            </View>
          </View>
          <Switch
            value={mechanicOnline}
            onValueChange={setMechanicOnline}
            trackColor={{ false: '#475569', true: '#10b981' }}
            thumbColor={mechanicOnline ? '#ffffff' : '#94a3b8'}
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Earnings & Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletTop}>
            <View>
              <Text style={styles.walletMeta}>SALDO DOMPET MITRA (85% KOMISI)</Text>
              <Text style={styles.walletBalance}>{formatRupiah(me.walletBalance)}</Text>
            </View>
            <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}>
              <Text style={styles.withdrawText}>Tarik Dana</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.walletDivider} />
          <View style={styles.walletStats}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Order Hari Ini</Text>
              <Text style={styles.statVal}>3 Selesai</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Pendapatan Hari Ini</Text>
              <Text style={styles.statVal}>Rp 245.000</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Performa Siaga</Text>
              <Text style={[styles.statVal, { color: '#10b981' }]}>100%</Text>
            </View>
          </View>
        </View>

        {/* ================= CONDITION 1: INCOMING EMERGENCY ORDER POPUP ================= */}
        {mechanicOnline && activeOrder && activeOrder.status === 'searching' && (
          <View style={styles.incomingOrderCard}>
            <View style={styles.emergencyPill}>
              <Text style={styles.emergencyPillText}>🚨 ORDER DARURAT BARU TERDETEKSI!</Text>
            </View>

            <View style={styles.orderMainBox}>
              <View style={styles.serviceRow}>
                <Text style={{ fontSize: 28 }}>{activeOrder.service?.icon || '🔋'}</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.serviceName}>{activeOrder.service?.title}</Text>
                  <Text style={styles.carName}>{activeOrder.vehicle}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.feeLabel}>Pendapatan Bersih</Text>
                  <Text style={styles.netFee}>{formatRupiah(activeOrder.mechanicNet)}</Text>
                </View>
              </View>

              <View style={styles.locBox}>
                <Text style={{ fontSize: 13, marginRight: 6 }}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.locLabel}>TITIK JEMPUT MOBIL MOGOK:</Text>
                  <Text style={styles.locText}>{activeOrder.userAddress}</Text>
                </View>
                <Text style={styles.distBadge}>~1.8 km</Text>
              </View>

              {activeOrder.note ? (
                <View style={styles.customerNoteBox}>
                  <Text style={styles.customerNoteLabel}>Keluhan Driver:</Text>
                  <Text style={styles.customerNoteText}>"{activeOrder.note}"</Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.decisionRow}>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  activeOpacity={0.85}
                  onPress={() => acceptOrder(me.id)}
                >
                  <Text style={styles.acceptBtnText}>⚡ TERIMA ORDER SEKARANG</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ================= CONDITION 2: CURRENT ACTIVE WORK / JOB IN PROGRESS ================= */}
        {activeOrder && ['assigned', 'arrived', 'repairing'].includes(activeOrder.status) && (
          <View style={styles.jobActiveCard}>
            <View style={styles.jobHeader}>
              <View>
                <Text style={styles.jobTitle}>Tugas Darurat Berjalan #{activeOrder.id}</Text>
                <Text style={styles.jobSub}>Driver: Avanza B 1234 SKA</Text>
              </View>
              <View style={styles.inProgressBadge}>
                <Text style={styles.inProgressText}>SEDANG BERTUGAS</Text>
              </View>
            </View>

            {/* Target Address Card */}
            <View style={styles.addressBox}>
              <Text style={{ fontSize: 14, marginRight: 8 }}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressLabel}>LOKASI TUJUAN MOBIL:</Text>
                <Text style={styles.addressVal}>{activeOrder.userAddress}</Text>
              </View>
            </View>

            {/* Quick Actions (Chat / Call Driver) */}
            <View style={styles.commActions}>
              <TouchableOpacity style={styles.commChatBtn} onPress={() => setChatVisible(true)}>
                <Text style={styles.commChatText}>💬 Hubungi Driver ({chatMessages.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.commNavBtn}
                onPress={() => Alert.alert('Navigasi GPS', 'Membuka Google Maps / Waze mengarahkan ke koordinat mobil...')}
              >
                <Text style={styles.commNavText}>🧭 Buka Navigasi</Text>
              </TouchableOpacity>
            </View>

            {/* Job Stepper Controls for Mechanic */}
            <View style={styles.jobControlsBox}>
              <Text style={styles.controlsTitle}>UPDATE STATUS PENANGANAN:</Text>

              {activeOrder.status === 'assigned' && (
                <TouchableOpacity
                  style={styles.arrivedStepBtn}
                  onPress={() => {
                    updateOrderStatus('arrived');
                    Alert.alert('Status Terupdate', 'Driver telah diberitahu bahwa Anda telah tiba di lokasi mobil.');
                  }}
                >
                  <Text style={styles.stepBtnText}>📍 1. Saya Sudah Tiba di Lokasi Mobil</Text>
                </TouchableOpacity>
              )}

              {activeOrder.status === 'arrived' && (
                <TouchableOpacity
                  style={styles.repairingStepBtn}
                  onPress={() => {
                    updateOrderStatus('repairing');
                    Alert.alert('Mulai Servis', 'Status: Anda sedang melakukan perbaikan / jumper aki.');
                  }}
                >
                  <Text style={styles.stepBtnText}>⚙️ 2. Mulai Diagnostik & Perbaikan Mobil</Text>
                </TouchableOpacity>
              )}

              {activeOrder.status === 'repairing' && (
                <TouchableOpacity
                  style={styles.completeStepBtn}
                  onPress={() => {
                    updateOrderStatus('completed');
                    Alert.alert(
                      'Pekerjaan Selesai!',
                      'Nota tagihan telah dikirim ke layar driver untuk diselesaikan via QRIS atau Cash.'
                    );
                  }}
                >
                  <Text style={styles.stepBtnText}>✅ 3. Perbaikan Selesai (Kirim Nota ke Driver)</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ================= CONDITION 3: JOB COMPLETED / PAID ================= */}
        {activeOrder && activeOrder.status === 'paid' && (
          <View style={styles.successCard}>
            <Text style={{ fontSize: 32 }}>🎉</Text>
            <Text style={styles.successTitle}>Pekerjaan Selesai & Terbayar!</Text>
            <Text style={styles.successSub}>
              Pendapatan {formatRupiah(activeOrder.mechanicNet)} otomatis masuk ke Saldo Dompet Anda.
            </Text>
          </View>
        )}

        {/* Empty State when no order */}
        {!activeOrder && (
          <View style={styles.idleCard}>
            <Text style={{ fontSize: 38 }}>📡</Text>
            <Text style={styles.idleTitle}>Menunggu Panggilan Darurat...</Text>
            <Text style={styles.idleSub}>
              Posisi GPS Anda aktif dipantau oleh server Montir Siaga di radius terdekat.
            </Text>
            <Text style={styles.idleHint}>
              💡 Tips Testing: Buka tab <Text style={{ color: '#60a5fa', fontWeight: 'bold' }}>"Driver Mobil"</Text> di atas lalu tekan "PANGGIL MONTIR" untuk melihat order masuk ke layar ini!
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Chat with Driver Modal */}
      <Modal visible={chatVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.chatBox}>
            <View style={styles.chatHeader}>
              <View>
                <Text style={styles.chatTitle}>Driver: {activeOrder?.vehicle || 'Pelanggan'}</Text>
                <Text style={styles.chatSub}>Chat Dua Arah Mitra - Pengemudi</Text>
              </View>
              <TouchableOpacity onPress={() => setChatVisible(false)}>
                <Text style={{ fontSize: 18, color: '#94a3b8' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.chatList}>
              {chatMessages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.chatBubble,
                    m.sender === 'mechanic' ? styles.myBubble : styles.driverBubble,
                  ]}
                >
                  <Text style={m.sender === 'mechanic' ? styles.myText : styles.driverText}>
                    {m.text}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Balas pesan driver..."
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d',
  },
  header: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  name: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  verifiedTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedText: {
    color: '#34d399',
    fontSize: 8,
    fontWeight: '800',
  },
  rating: {
    color: '#f59e0b',
    fontSize: 10.5,
    fontWeight: '600',
  },
  vehicleInfo: {
    color: '#94a3b8',
    fontSize: 10.5,
  },
  onlineCard: {
    marginTop: 12,
    backgroundColor: '#131d2e',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  onlineTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  onlineSub: {
    color: '#94a3b8',
    fontSize: 9.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  walletCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  walletTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletMeta: {
    color: '#94a3b8',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  walletBalance: {
    color: '#f59e0b',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  withdrawBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  withdrawText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  walletDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 10,
  },
  walletStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 9.5,
  },
  statVal: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  // Incoming order popup card
  incomingOrderCard: {
    backgroundColor: '#131d2e',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ef4444',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#ef4444',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  emergencyPill: {
    backgroundColor: '#ef4444',
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  emergencyPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  orderMainBox: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  carName: {
    color: '#94a3b8',
    fontSize: 11,
  },
  feeLabel: {
    color: '#94a3b8',
    fontSize: 9,
  },
  netFee: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: '900',
  },
  locBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  locLabel: {
    color: '#f59e0b',
    fontSize: 9,
    fontWeight: '800',
  },
  locText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
  },
  distBadge: {
    backgroundColor: '#334155',
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  customerNoteBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  customerNoteLabel: {
    color: '#f59e0b',
    fontSize: 9,
    fontWeight: 'bold',
  },
  customerNoteText: {
    color: '#fde68a',
    fontSize: 11,
    fontStyle: 'italic',
  },
  decisionRow: {
    marginTop: 4,
  },
  acceptBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  // Job Active
  jobActiveCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    marginBottom: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  jobTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  jobSub: {
    color: '#94a3b8',
    fontSize: 11,
  },
  inProgressBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inProgressText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '800',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
  },
  addressLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: 'bold',
  },
  addressVal: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
  },
  commActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  commChatBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  commChatText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: 'bold',
  },
  commNavBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  commNavText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  jobControlsBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 10,
  },
  controlsTitle: {
    color: '#94a3b8',
    fontSize: 9.5,
    fontWeight: '800',
    marginBottom: 8,
  },
  arrivedStepBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  repairingStepBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  completeStepBtn: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  stepBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Success Card
  successCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  successTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  successSub: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  // Idle Card
  idleCard: {
    backgroundColor: '#131d2e',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 10,
  },
  idleTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10,
  },
  idleSub: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  idleHint: {
    color: '#cbd5e1',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    padding: 10,
    borderRadius: 10,
  },
  // Modal Chat
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  chatBox: {
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
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  chatSub: {
    color: '#38bdf8',
    fontSize: 10,
  },
  chatList: {
    flex: 1,
    marginVertical: 10,
  },
  chatBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  myBubble: {
    backgroundColor: '#2563eb',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  driverBubble: {
    backgroundColor: '#1e293b',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  myText: {
    color: '#ffffff',
    fontSize: 11.5,
  },
  driverText: {
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
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
