import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';

export default function OwnerView() {
  const {
    platformStats,
    activeOrder,
    mechanics,
  } = useApp();

  const [activeTab, setActiveTab] = useState('analytics');

  const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

  return (
    <View style={styles.container}>
      {/* Header Light Theme Red Gradient */}
      <LinearGradient
        colors={['#DC2626', '#E11D48']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerBrand}>
            <View style={styles.crownWrap}>
              <Ionicons name="shield-checkmark" size={22} color="#DC2626" />
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.headerTitle}>OWNER PANEL</Text>
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>SUPER ADMIN</Text>
                </View>
              </View>
              <Text style={styles.headerSub}>Montir Siaga Platform Management</Text>
            </View>
          </View>
        </View>

        {/* Tab Row */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'analytics' && styles.tabBtnActive]}
            onPress={() => setActiveTab('analytics')}
          >
            <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>
              📊 Omzet & Finansial
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'mechanics' && styles.tabBtnActive]}
            onPress={() => setActiveTab('mechanics')}
          >
            <Text style={[styles.tabText, activeTab === 'mechanics' && styles.tabTextActive]}>
              🔧 Mitra Montir ({mechanics.length})
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ================= TAB 1: ANALYTICS ================= */}
        {activeTab === 'analytics' && (
          <View>
            {/* Pure Admin Revenue for Owner */}
            <View style={styles.revenueCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="cash" size={20} color="#16A34A" />
                <Text style={styles.revenueLabel}>PENDAPATAN MURNI OWNER (ADMIN PEMANGGILAN)</Text>
              </View>
              <Text style={styles.revenueVal}>{formatRupiah(platformStats.platformNetRevenue)}</Text>
              <Text style={styles.revenueSub}>
                Pure Rp 10.000 / order dari MontirPay. Selebihnya uang jasa 100% milik montir via QRIS.
              </Text>
            </View>

            {/* Metrics Grid */}
            <View style={styles.metricGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Pesanan Masuk</Text>
                <Text style={styles.metricVal}>{platformStats.totalOrders} Order</Text>
                <Text style={styles.metricSub}>99.4% Tingkat Keberhasilan</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Biaya Admin Per Order</Text>
                <Text style={[styles.metricVal, { color: '#DC2626' }]}>Rp 10.000</Text>
                <Text style={styles.metricSub}>Pure Masuk Kas Owner</Text>
              </View>
            </View>

            {/* Live Order Monitor */}
            <View style={styles.monitorCard}>
              <View style={styles.monitorHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.pulseDot, { backgroundColor: activeOrder ? '#10B981' : '#CBD5E1' }]} />
                  <Text style={styles.monitorTitle}>MONITOR PESANAN AKTIF</Text>
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
                    <Text style={styles.orderLabel}>ID Pesanan:</Text>
                    <Text style={styles.orderValBold}>#{activeOrder.id}</Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Kendala:</Text>
                    <Text style={styles.orderVal}>{activeOrder.service?.title}</Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Mobil:</Text>
                    <Text style={styles.orderVal}>{activeOrder.vehicle}</Text>
                  </View>
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>Admin Owner APK:</Text>
                    <Text style={[styles.orderVal, { color: '#10B981', fontWeight: 'bold' }]}>
                      Rp 10.000 (LUNAS via MontirPay)
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
                  <Text style={styles.emptyText}>Tidak ada pesanan darurat yang sedang berjalan saat ini.</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ================= TAB 2: MECHANICS ================= */}
        {activeTab === 'mechanics' && (
          <View style={{ gap: 12 }}>
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
                    <Text style={styles.mechVehicle}>🛵 {m.vehicle}</Text>
                    <Text style={styles.mechStats}>⭐ {m.rating} • {m.jobsCompleted} Servis</Text>
                  </View>
                </View>

                <View style={styles.mechCardBottom}>
                  <View>
                    <Text style={styles.walletLabel}>Saldo Dompet Montir (Hasil QRIS 100%):</Text>
                    <Text style={styles.walletAmount}>{formatRupiah(m.walletBalance)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.detailBtn}
                    onPress={() => Alert.alert('Mitra Montir', `Profil ${m.name}\nNo HP: ${m.phone}\nSpesialis: ${m.specialty}`)}
                  >
                    <Text style={styles.detailBtnText}>Lihat Detail</Text>
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  crownWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  adminBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
  headerSub: {
    color: '#FEE2E2',
    fontSize: 11,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    padding: 3,
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
    color: '#FEE2E2',
    fontSize: 11.5,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#DC2626',
    fontWeight: '800',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  revenueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  revenueLabel: {
    color: '#16A34A',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  revenueVal: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 6,
  },
  revenueSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  metricVal: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  metricSub: {
    color: '#94A3B8',
    fontSize: 9.5,
    marginTop: 2,
  },
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
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  orderLabel: {
    color: '#64748B',
    fontSize: 11,
  },
  orderVal: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '600',
  },
  orderValBold: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyMonitor: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
  },
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
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  mechAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mechName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedText: {
    color: '#16A34A',
    fontSize: 8,
    fontWeight: '800',
  },
  mechVehicle: {
    color: '#64748B',
    fontSize: 10.5,
    marginTop: 2,
  },
  mechStats: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 1,
  },
  mechCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  walletLabel: {
    color: '#64748B',
    fontSize: 9.5,
  },
  walletAmount: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  detailBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  detailBtnText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
});
