import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';

export default function OwnerView() {
  const {
    platformStats,
    activeOrder,
    mechanics,
    toggleMechanicVerification,
  } = useApp();

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'mechanics' | 'orders'

  const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

  return (
    <View style={styles.container}>
      {/* Owner Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.logoBox}>
            <Text style={{ fontSize: 20 }}>👑</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.headerTitle}>OWNER DASHBOARD</Text>
              <View style={styles.adminTag}>
                <Text style={styles.adminTagText}>SUPER ADMIN</Text>
              </View>
            </View>
            <Text style={styles.headerSub}>Montir Siaga Platform Management</Text>
          </View>
        </View>

        {/* Tab Sub-navigation */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.subTab, activeTab === 'analytics' && styles.subTabActive]}
            onPress={() => setActiveTab('analytics')}
          >
            <Text style={[styles.subTabText, activeTab === 'analytics' && styles.subTabTextActive]}>
              📊 Omzet & Finansial
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subTab, activeTab === 'mechanics' && styles.subTabActive]}
            onPress={() => setActiveTab('mechanics')}
          >
            <Text style={[styles.subTabText, activeTab === 'mechanics' && styles.subTabTextActive]}>
              🔧 Mitra Montir ({mechanics.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ================= TAB 1: ANALYTICS & REVENUE ================= */}
        {activeTab === 'analytics' && (
          <View>
            {/* Net Revenue for Owner */}
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>KEUNTUNGAN BERSIH OWNER (KOMISI 15%)</Text>
              <Text style={styles.revenueValue}>{formatRupiah(platformStats.platformNetRevenue)}</Text>
              <Text style={styles.revenueMeta}>
                Otomatis dipotong 15% dari setiap pesanan yang selesai
              </Text>
            </View>

            {/* Platform Metrics Grid */}
            <View style={styles.metricGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Perputaran Jasa (GMV)</Text>
                <Text style={styles.metricVal}>{formatRupiah(platformStats.totalGrossRevenue)}</Text>
                <Text style={styles.metricSub}>Gross transaksi pengguna</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Pesanan Darurat</Text>
                <Text style={styles.metricVal}>{platformStats.totalOrders} Order</Text>
                <Text style={styles.metricSub}>98.4% Tingkat Sukses</Text>
              </View>
            </View>

            {/* Live Order Monitor */}
            <View style={styles.liveMonitorCard}>
              <View style={styles.monitorHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.monitorTitle}>MONITOR PESANAN AKTIF SAAT INI</Text>
                </View>
                <Text style={styles.monitorStatusBadge}>
                  {activeOrder ? activeOrder.status.toUpperCase() : 'STANDBY'}
                </Text>
              </View>

              {activeOrder ? (
                <View style={styles.activeOrderBox}>
                  <View style={styles.orderInfoRow}>
                    <Text style={styles.orderInfoLabel}>ID Pesanan:</Text>
                    <Text style={styles.orderInfoVal}>#{activeOrder.id}</Text>
                  </View>
                  <View style={styles.orderInfoRow}>
                    <Text style={styles.orderInfoLabel}>Kendala:</Text>
                    <Text style={styles.orderInfoVal}>{activeOrder.service?.title}</Text>
                  </View>
                  <View style={styles.orderInfoRow}>
                    <Text style={styles.orderInfoLabel}>Lokasi:</Text>
                    <Text style={[styles.orderInfoVal, { flex: 1, textAlign: 'right' }]} numberOfLines={1}>
                      {activeOrder.userAddress}
                    </Text>
                  </View>
                  <View style={styles.orderInfoRow}>
                    <Text style={styles.orderInfoLabel}>Montir Bertugas:</Text>
                    <Text style={[styles.orderInfoVal, { color: '#38bdf8' }]}>
                      {activeOrder.mechanic?.name || 'Sedang Mencari...'}
                    </Text>
                  </View>
                  <View style={styles.orderFeeRow}>
                    <View>
                      <Text style={styles.feeSubLabel}>Total Tagihan</Text>
                      <Text style={styles.feeVal}>{formatRupiah(activeOrder.price)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.feeSubLabel}>Komisi Owner (15%)</Text>
                      <Text style={[styles.feeVal, { color: '#10b981' }]}>
                        +{formatRupiah(activeOrder.platformFee)}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyMonitorBox}>
                  <Text style={{ fontSize: 24 }}>🛰️</Text>
                  <Text style={styles.emptyMonitorText}>Belum ada panggilan darurat aktif saat ini.</Text>
                </View>
              )}
            </View>

            {/* Platform Settings Quick Access */}
            <View style={styles.settingsCard}>
              <Text style={styles.settingsTitle}>KONFIGURASI SISTEM BISNIS</Text>
              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingName}>Bagi Hasil Platform</Text>
                  <Text style={styles.settingDesc}>15% Owner, 85% Montir Mitra</Text>
                </View>
                <TouchableOpacity
                  style={styles.settingBtn}
                  onPress={() => Alert.alert('Komisi Platform', 'Persentase komisi saat ini dikunci 15% untuk fase promo MVP.')}
                >
                  <Text style={styles.settingBtnText}>Atur</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingName}>Radius Broadcast Sinyal Darurat</Text>
                  <Text style={styles.settingDesc}>Maksimal 5 km dari titik GPS mobil</Text>
                </View>
                <TouchableOpacity
                  style={styles.settingBtn}
                  onPress={() => Alert.alert('Radius GPS', 'Radius broadcast montir disetel ke 5 km.')}
                >
                  <Text style={styles.settingBtnText}>Ubah</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ================= TAB 2: MECHANIC VERIFICATION ================= */}
        {activeTab === 'mechanics' && (
          <View>
            <Text style={styles.sectionTitle}>VERIFIKASI & APPROVAL MITRA MEKANIK</Text>
            <Text style={styles.sectionDesc}>
              Hanya montir terverifikasi dengan sertifikasi resmi yang dapat menerima pesanan darurat.
            </Text>

            {mechanics.map((m) => (
              <View key={m.id} style={styles.mechanicItemCard}>
                <View style={styles.mechanicTop}>
                  <View style={styles.mechanicAvatar}>
                    <Text style={{ fontSize: 22 }}>👨🏻‍🔧</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.mechanicNameText}>{m.name}</Text>
                      {m.verified ? (
                        <View style={styles.verifiedPill}>
                          <Text style={styles.verifiedPillText}>TERVERIFIKASI</Text>
                        </View>
                      ) : (
                        <View style={styles.unverifiedPill}>
                          <Text style={styles.unverifiedPillText}>PENDING</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.mechanicSpecialty}>{m.specialty}</Text>
                    <Text style={styles.mechanicVehicleText}>🛵 {m.vehicle}</Text>
                  </View>
                </View>

                <View style={styles.mechanicStatsRow}>
                  <Text style={styles.mechStatText}>Rating: ⭐ {m.rating}</Text>
                  <Text style={styles.mechStatText}>Pekerjaan: {m.jobsCompleted}x</Text>
                  <Text style={styles.mechStatText}>Saldo: {formatRupiah(m.walletBalance)}</Text>
                </View>

                {/* Verification Action */}
                <View style={styles.mechanicActionRow}>
                  <TouchableOpacity
                    style={[
                      styles.toggleVerifBtn,
                      m.verified ? styles.revokeBtn : styles.approveBtn,
                    ]}
                    onPress={() => {
                      toggleMechanicVerification(m.id);
                      Alert.alert(
                        'Status Diperbarui',
                        `${m.name} sekarang berstatus: ${!m.verified ? 'TERVERIFIKASI ✅' : 'PENDING APPROVAL ⚠️'}`
                      );
                    }}
                  >
                    <Text style={styles.toggleVerifText}>
                      {m.verified ? 'Cabut Akses Verifikasi' : 'Setujui & Verifikasi Montir'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#eab308',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  adminTag: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  adminTagText: {
    color: '#facc15',
    fontSize: 8.5,
    fontWeight: '900',
  },
  headerSub: {
    color: '#94a3b8',
    fontSize: 10.5,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabActive: {
    borderBottomColor: '#eab308',
  },
  subTabText: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontWeight: '600',
  },
  subTabTextActive: {
    color: '#facc15',
    fontWeight: '800',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  revenueCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#eab308',
    marginBottom: 12,
  },
  revenueLabel: {
    color: '#facc15',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  revenueValue: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 4,
  },
  revenueMeta: {
    color: '#94a3b8',
    fontSize: 10.5,
    marginTop: 4,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 9.5,
    fontWeight: '600',
  },
  metricVal: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  metricSub: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 2,
  },
  liveMonitorCard: {
    backgroundColor: '#131d2e',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 14,
  },
  monitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  monitorTitle: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  monitorStatusBadge: {
    backgroundColor: '#334155',
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeOrderBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  orderInfoLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  orderInfoVal: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
  },
  orderFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  feeSubLabel: {
    color: '#94a3b8',
    fontSize: 9.5,
  },
  feeVal: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyMonitorBox: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  emptyMonitorText: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 6,
  },
  settingsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  settingsTitle: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  settingName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  settingDesc: {
    color: '#64748b',
    fontSize: 10,
  },
  settingBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  settingBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  // Mechanics Tab
  sectionTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionDesc: {
    color: '#94a3b8',
    fontSize: 10.5,
    marginBottom: 12,
  },
  mechanicItemCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  mechanicTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mechanicAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mechanicNameText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  verifiedPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedPillText: {
    color: '#34d399',
    fontSize: 8,
    fontWeight: '800',
  },
  unverifiedPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  unverifiedPillText: {
    color: '#f87171',
    fontSize: 8,
    fontWeight: '800',
  },
  mechanicSpecialty: {
    color: '#f59e0b',
    fontSize: 10.5,
    marginTop: 2,
  },
  mechanicVehicleText: {
    color: '#94a3b8',
    fontSize: 10.5,
  },
  mechanicStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 8,
    marginVertical: 10,
  },
  mechStatText: {
    color: '#cbd5e1',
    fontSize: 10,
  },
  mechanicActionRow: {
    marginTop: 2,
  },
  toggleVerifBtn: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: '#10b981',
  },
  revokeBtn: {
    backgroundColor: '#334155',
  },
  toggleVerifText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
