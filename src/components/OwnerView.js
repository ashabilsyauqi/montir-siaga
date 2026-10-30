import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';

export default function OwnerView() {
  const {
    platformStats,
    activeOrder,
    orderHistory,
    mechanics,
    sweepPettyCash,
  } = useApp();

  const [activeTab, setActiveTab] = useState('pettycash'); // 'pettycash', 'orders', 'mechanics'
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');

  const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

  const handleSweepCashClick = () => {
    if (!platformStats.platformNetRevenue || platformStats.platformNetRevenue <= 0) {
      Alert.alert('Peti Kas Kosong', 'Saldo kas admin saat ini Rp 0. Belum ada pemasukan yang bisa ditarik.');
      return;
    }
    setEnteredPin('');
    setPinModalVisible(true);
  };

  const handleConfirmSweep = async () => {
    if (!enteredPin) {
      Alert.alert('Perhatian', 'Masukkan 4 digit PIN keamanan Owner.');
      return;
    }

    const res = await sweepPettyCash(enteredPin);
    setPinModalVisible(false);
    setEnteredPin('');

    if (res.success) {
      Alert.alert(
        'Penarikan Berhasil! 💸',
        `Seluruh saldo peti kas sebesar ${formatRupiah(res.amountWithdrawn)} telah berhasil ditarik dan ditransfer ke rekening Owner.`
      );
    } else {
      Alert.alert('Gagal Menarik Kas', res.error || 'PIN Keamanan salah atau terjadi kesalahan.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Gradient */}
      <LinearGradient
        colors={['#DC2626', '#E11D48']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerBrand}>
            <View style={styles.crownWrap}>
              <Ionicons name="shield-checkmark" size={24} color="#DC2626" />
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.headerTitle}>OWNER & MANAGEMENT</Text>
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>SUPER ADMIN</Text>
                </View>
              </View>
              <Text style={styles.headerSub}>Montir Siaga Pusat Kontrol & Kas</Text>
            </View>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'pettycash' && styles.tabBtnActive]}
            onPress={() => setActiveTab('pettycash')}
          >
            <Text style={[styles.tabText, activeTab === 'pettycash' && styles.tabTextActive]}>
              🏦 Peti Kas ({formatRupiah(platformStats.platformNetRevenue)})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]}
            onPress={() => setActiveTab('orders')}
          >
            <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
              📋 Master Order ({orderHistory.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'mechanics' && styles.tabBtnActive]}
            onPress={() => setActiveTab('mechanics')}
          >
            <Text style={[styles.tabText, activeTab === 'mechanics' && styles.tabTextActive]}>
              🔧 Master Mitra ({mechanics.length})
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ================= TAB 1: PETI KAS & FINANSIAL ================= */}
        {activeTab === 'pettycash' && (
          <View style={{ gap: 14 }}>
            {/* WIDGET PETI KAS & SALDO ADMIN DENGAN TOMBOL AMBIL SEMUA CASH */}
            <View style={styles.pettyCashWidget}>
              <View style={styles.pettyCashHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.safeIconCircle}>
                    <Ionicons name="wallet" size={22} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.pettyCashTitle}>WIDGET PETI KAS OWNER</Text>
                    <Text style={styles.pettyCashSub}>Akumulasi Admin Pemanggilan Rp 10.000 / Order</Text>
                  </View>
                </View>

                {/* TOMBOL AMBIL SEMUA CASH */}
                <TouchableOpacity
                  style={styles.sweepCashBtn}
                  activeOpacity={0.85}
                  onPress={handleSweepCashClick}
                >
                  <Ionicons name="cash-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.sweepCashBtnText}>Ambil Semua Cash</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pettyCashCardBody}>
                <View style={styles.pettyCashRow}>
                  <View>
                    <Text style={styles.cashAvailableLabel}>SALDO KAS TERSEDIA (SIAP DITARIK):</Text>
                    <Text style={styles.cashAvailableValue}>
                      {formatRupiah(platformStats.platformNetRevenue)}
                    </Text>
                  </View>
                  <View style={styles.secureBadge}>
                    <Ionicons name="lock-closed" size={13} color="#15803D" />
                    <Text style={styles.secureBadgeText}>Kas Terkunci PIN</Text>
                  </View>
                </View>

                <View style={styles.cashDetailsSplit}>
                  <View style={styles.cashDetailCol}>
                    <Text style={styles.cashDetailTitle}>Total Order Selesai:</Text>
                    <Text style={styles.cashDetailVal}>{platformStats.totalOrders} Order</Text>
                  </View>
                  <View style={styles.cashDetailCol}>
                    <Text style={styles.cashDetailTitle}>Hak Murni Owner:</Text>
                    <Text style={[styles.cashDetailVal, { color: '#DC2626' }]}>Rp 10.000 / Order</Text>
                  </View>
                  <View style={styles.cashDetailCol}>
                    <Text style={styles.cashDetailTitle}>Jasa Montir QRIS:</Text>
                    <Text style={[styles.cashDetailVal, { color: '#00AA13' }]}>100% Hak Montir</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Live Active Order Monitor */}
            <View style={styles.monitorCard}>
              <View style={styles.monitorHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.pulseDot, { backgroundColor: activeOrder ? '#10B981' : '#CBD5E1' }]} />
                  <Text style={styles.monitorTitle}>MONITOR ORDER BERJALAN SAAT INI</Text>
                </View>
                <View style={[styles.statusTag, { backgroundColor: activeOrder ? '#FEE2E2' : '#F1F5F9' }]}>
                  <Text style={[styles.statusTagText, { color: activeOrder ? '#DC2626' : '#64748B' }]}>
                    {activeOrder ? activeOrder.status.toUpperCase() : 'STANDBY'}
                  </Text>
                </View>
              </View>

              {activeOrder ? (
                <View style={styles.orderDetailsBox}>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>ID Panggilan:</Text>
                    <Text style={styles.orderValBold}>#{activeOrder.id}</Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Kendala Kerusakan:</Text>
                    <Text style={styles.orderVal}>{activeOrder.note || activeOrder.service?.title}</Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Mobil Mogok:</Text>
                    <Text style={styles.orderVal}>{activeOrder.vehicle}</Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Alamat:</Text>
                    <Text style={styles.orderVal} numberOfLines={1}>{activeOrder.userAddress}</Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Admin Owner APK:</Text>
                    <Text style={[styles.orderVal, { color: '#10B981', fontWeight: 'bold' }]}>
                      Rp 10.000 (Lunas dari MontirPay)
                    </Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Tagihan QRIS Montir:</Text>
                    <Text style={[styles.orderVal, { color: '#DC2626', fontWeight: 'bold' }]}>
                      {formatRupiah(activeOrder.mechanicBillAmount || activeOrder.mechanicEstimatedFee)} ({activeOrder.qrisPaid ? 'LUNAS' : 'MENUNGGU BAYAR'})
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyMonitor}>
                  <Ionicons name="checkmark-circle-outline" size={32} color="#CBD5E1" />
                  <Text style={styles.emptyText}>Tidak ada panggilan darurat aktif saat ini.</Text>
                </View>
              )}
            </View>

            {/* Riwayat Penarikan Kas Terakhir */}
            <View style={styles.payoutCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="receipt-outline" size={18} color="#475569" />
                <Text style={styles.payoutTitle}>INFORMASI PENCAIRAN PETI KAS KE REKENING</Text>
              </View>
              <Text style={styles.payoutSub}>
                Setiap kali tombol "Ambil Semua Cash" ditekan, saldo kas admin akan ditransfer ke rekening bank Owner (BCA 8820-192-881 a/n PT Montir Siaga Indonesia).
              </Text>
            </View>
          </View>
        )}

        {/* ================= TAB 2: MASTER RIWAYAT ORDER ================= */}
        {activeTab === 'orders' && (
          <View style={{ gap: 12 }}>
            <View style={styles.sectionHeaderCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="document-text" size={20} color="#DC2626" />
                <div>
                  <Text style={styles.sectionHeading}>MASTER SEMUA RIWAYAT ORDER</Text>
                  <Text style={styles.sectionSubHeading}>Daftar arsip panggilan emergency & alokasi biaya</Text>
                </div>
              </View>
            </View>

            {orderHistory.map((item) => (
              <View key={item.id} style={styles.orderHistoryCard}>
                <View style={styles.orderHistoryTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.orderIdBadge}>#{item.id}</Text>
                    <Text style={styles.orderDateText}>{item.date}</Text>
                  </View>
                  <View style={styles.orderStatusBadge}>
                    <Text style={styles.orderStatusText}>{item.status}</Text>
                  </View>
                </View>

                <View style={{ marginTop: 6 }}>
                  <Text style={styles.historyVehicleText}>🚘 {item.driver}</Text>
                  <Text style={styles.historyDamageText}>⚠️ {item.damage}</Text>
                  <Text style={styles.historyMechanicText}>👨‍🔧 Ditangani oleh: {item.mechanic}</Text>
                </View>

                <View style={styles.historyDivider} />

                <View style={styles.historyMoneyRow}>
                  <View>
                    <Text style={styles.moneyLabel}>Admin Owner:</Text>
                    <Text style={styles.moneyValOwner}>+{formatRupiah(item.adminFee)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.moneyLabel}>Jasa Montir (QRIS):</Text>
                    <Text style={styles.moneyValMech}>{formatRupiah(item.mechanicBill)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================= TAB 3: MASTER DATA MITRA MONTIR & BENGKEL ================= */}
        {activeTab === 'mechanics' && (
          <View style={{ gap: 12 }}>
            <View style={styles.sectionHeaderCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="construct" size={20} color="#DC2626" />
                <div>
                  <Text style={styles.sectionHeading}>MASTER DATA MITRA MONTIR & BENGKEL</Text>
                  <Text style={styles.sectionSubHeading}>Montir perorangan dan bengkel rekanan terverifikasi</Text>
                </div>
              </View>
            </View>

            {mechanics.map((m) => (
              <View key={m.id} style={styles.mechCard}>
                <View style={styles.mechCardTop}>
                  <View style={styles.mechAvatarCircle}>
                    <Ionicons name="construct" size={20} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.mechName}>{m.name}</Text>
                      {m.verified && (
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedText}>TERVERIFIKASI</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.mechVehicle}>🛵 {m.vehicle} • 📞 {m.phone}</Text>
                    <Text style={styles.mechStats}>
                      Spesialis: {m.specialty} • ⭐ {m.rating} ({m.jobsCompleted} Servis)
                    </Text>
                  </View>
                </View>

                <View style={styles.mechCardBottom}>
                  <View>
                    <Text style={styles.walletLabel}>Saldo Dompet Jasa Montir (Hasil QRIS 100%):</Text>
                    <Text style={styles.walletAmount}>{formatRupiah(m.walletBalance)}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: m.status === 'online' ? '#DCFCE7' : '#F1F5F9' }]}>
                    <Text style={[styles.statusPillText, { color: m.status === 'online' ? '#16A34A' : '#64748B' }]}>
                      {m.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL PIN KEAMANAN OWNER UNTUK AMBIL SEMUA CASH */}
      <Modal visible={pinModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.pinSheet}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View style={styles.pinIconCircle}>
                <Ionicons name="key" size={26} color="#DC2626" />
              </View>
              <Text style={styles.pinSheetTitle}>Verifikasi PIN Owner</Text>
              <Text style={styles.pinSheetSub}>
                Masukkan 4 Digit PIN Keamanan untuk menarik seluruh dana kas {formatRupiah(platformStats.platformNetRevenue)}
              </Text>
            </View>

            <TextInput
              style={styles.pinInputField}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              autoFocus
              placeholder="••••"
              placeholderTextColor="#94A3B8"
              value={enteredPin}
              onChangeText={setEnteredPin}
            />
            <Text style={styles.pinHintText}>* Default PIN pengujian: 1234</Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={[styles.pinActionBtn, { backgroundColor: '#F1F5F9' }]}
                onPress={() => setPinModalVisible(false)}
              >
                <Text style={{ color: '#475569', fontWeight: 'bold' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pinActionBtn, { backgroundColor: '#16A34A' }]}
                onPress={handleConfirmSweep}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Tarik Kas Sekarang</Text>
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
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 6,
    shadowColor: '#DC2626',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
  },
  headerTop: {
    marginBottom: 12,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  crownWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  adminBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 12,
    color: '#FEE2E2',
    marginTop: 1,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    padding: 3,
    borderRadius: 12,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FEE2E2',
  },
  tabTextActive: {
    color: '#DC2626',
    fontWeight: '900',
  },
  content: {
    flex: 1,
    padding: 16,
  },

  /* Petty Cash Widget */
  pettyCashWidget: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    elevation: 3,
    shadowColor: '#16A34A',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  pettyCashHeader: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  safeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pettyCashTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  pettyCashSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  sweepCashBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 2,
    shadowColor: '#16A34A',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  sweepCashBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
  },
  pettyCashCardBody: {
    paddingTop: 12,
  },
  pettyCashRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cashAvailableLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  cashAvailableValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#16A34A',
    marginTop: 2,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  secureBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  cashDetailsSplit: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
  },
  cashDetailCol: {
    flex: 1,
  },
  cashDetailTitle: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  cashDetailVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },

  /* Monitor Card */
  monitorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  monitorTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  orderDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  orderVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  orderValBold: {
    fontSize: 11,
    fontWeight: '900',
    color: '#DC2626',
  },
  emptyMonitor: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },

  /* Payout info */
  payoutCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  payoutTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  payoutSub: {
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 15,
  },

  /* Master Orders Tab */
  sectionHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionSubHeading: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  orderHistoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  orderHistoryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdBadge: {
    fontSize: 12,
    fontWeight: '900',
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  orderDateText: {
    fontSize: 11,
    color: '#64748B',
  },
  orderStatusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  historyVehicleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  historyDamageText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  historyMechanicText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  historyDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  historyMoneyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moneyLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  moneyValOwner: {
    fontSize: 13,
    fontWeight: '900',
    color: '#16A34A',
    marginTop: 1,
  },
  moneyValMech: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0284C7',
    marginTop: 1,
  },

  /* Master Mechanics Tab */
  mechCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mechCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mechAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mechName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16A34A',
  },
  mechVehicle: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 2,
  },
  mechStats: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  mechCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  walletLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  walletAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0284C7',
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '900',
  },

  /* Pin Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pinSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    elevation: 8,
  },
  pinIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pinSheetTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  pinSheetSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
  },
  pinInputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 10,
    color: '#0F172A',
    marginTop: 8,
  },
  pinHintText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  pinActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
});
