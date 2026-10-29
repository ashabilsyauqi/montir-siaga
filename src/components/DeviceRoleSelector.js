import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../context/AppContext';

export default function DeviceRoleSelector({ onClose }) {
  const { setCurrentRoleAndSave, serverIP } = useApp();

  const handleSelect = (role) => {
    setCurrentRoleAndSave(role);
    if (onClose) onClose();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* App Logo */}
        <View style={styles.logoBox}>
          <Ionicons name="construct" size={36} color="#DC2626" />
        </View>

        <Text style={styles.title}>MONTIR SIAGA</Text>
        <Text style={styles.subtitle}>
          Pilih Peran Aplikasi untuk Smartphone Ini:
        </Text>

        <View style={styles.serverPill}>
          <View style={styles.serverDot} />
          <Text style={styles.serverText}>Tersambung ke Server: {serverIP}:4000</Text>
        </View>

        {/* Option 1: Driver */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.roleCard, { borderColor: '#DC2626' }]}
          onPress={() => handleSelect('driver')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="car-sport" size={26} color="#DC2626" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.roleName}>Aplikasi Driver Mobil</Text>
              <View style={[styles.badge, { backgroundColor: '#DC2626' }]}>
                <Text style={styles.badgeText}>CUSTOMER</Text>
              </View>
            </View>
            <Text style={styles.roleDesc}>
              Pengemudi mobil mogok. Dilengkapi dompet MontirPay, deteksi GPS satelit nyata, dan radar pemindai montir terdekat.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Option 2: Mechanic */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.roleCard, { borderColor: '#10B981' }]}
          onPress={() => handleSelect('mechanic')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="construct" size={26} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.roleName}>Aplikasi Mitra Mekanik</Text>
              <View style={[styles.badge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.badgeText}>PARTNER</Text>
              </View>
            </View>
            <Text style={styles.roleDesc}>
              Mitra montir panggilan. Radar siaga menerima panggilan darurat radius 5 km dan alur pengerjaan lapangan (Job Stepper).
            </Text>
          </View>
        </TouchableOpacity>

        {/* Option 3: Owner */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.roleCard, { borderColor: '#6366F1' }]}
          onPress={() => handleSelect('owner')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="shield-checkmark" size={26} color="#6366F1" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.roleName}>Owner / Super Admin</Text>
              <View style={[styles.badge, { backgroundColor: '#6366F1' }]}>
                <Text style={styles.badgeText}>OWNER</Text>
              </View>
            </View>
            <Text style={styles.roleDesc}>
              Pemilik platform. Memantau keuntungan bersih biaya admin Rp 10.000/order dari MontirPay dan live monitor pesanan.
            </Text>
          </View>
        </TouchableOpacity>

        {onClose && (
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Tutup Pengaturan Peran</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    padding: 24,
    alignItems: 'center',
    paddingTop: 40,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    marginTop: 14,
    marginBottom: 24,
  },
  serverDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  serverText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  roleCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
  roleDesc: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  closeBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  closeBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
});
