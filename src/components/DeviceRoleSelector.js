import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
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
          <Text style={{ fontSize: 36 }}>🚗⚡🔧</Text>
        </View>

        <Text style={styles.title}>MONTIR SIAGA</Text>
        <Text style={styles.subtitle}>
          Pilih Peran Aplikasi untuk Smartphone Ini:
        </Text>

        <View style={styles.serverPill}>
          <View style={styles.serverDot} />
          <Text style={styles.serverText}>Tersambung ke Server Mac: {serverIP}:4000</Text>
        </View>

        {/* Option 1: Driver */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.roleCard, { borderColor: '#ef4444' }]}
          onPress={() => handleSelect('driver')}
        >
          <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
            <Text style={{ fontSize: 28 }}>🚗</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.roleName}>HP 1: Aplikasi Driver Mobil</Text>
              <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
                <Text style={styles.badgeText}>CUSTOMER</Text>
              </View>
            </View>
            <Text style={styles.roleDesc}>
              Untuk pengemudi mobil mogok. Deteksi GPS nyata, pilih kendala (Aki/Ban/Overheat), dan panggil montir.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Option 2: Mechanic */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.roleCard, { borderColor: '#38bdf8' }]}
          onPress={() => handleSelect('mechanic')}
        >
          <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
            <Text style={{ fontSize: 28 }}>🔧</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.roleName}>HP 2: Aplikasi Mitra Montir</Text>
              <View style={[styles.badge, { backgroundColor: '#0284c7' }]}>
                <Text style={styles.badgeText}>MITRA KERJA</Text>
              </View>
            </View>
            <Text style={styles.roleDesc}>
              Untuk mekanik di lapangan. Terima notifikasi order darurat masuk dari HP 1, navigasi rute, dan perbaikan.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Option 3: Owner */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.roleCard, { borderColor: '#eab308' }]}
          onPress={() => handleSelect('owner')}
        >
          <View style={[styles.iconBox, { backgroundColor: 'rgba(234, 179, 8, 0.2)' }]}>
            <Text style={{ fontSize: 28 }}>👑</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.roleName}>Aplikasi Owner / Admin</Text>
              <View style={[styles.badge, { backgroundColor: '#ca8a04' }]}>
                <Text style={styles.badgeText}>SUPER ADMIN</Text>
              </View>
            </View>
            <Text style={styles.roleDesc}>
              Dashboard pantau omzet, potongan komisi platform 15%, live order GPS, dan verifikasi mitra baru.
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          💡 Catatan: Pilihan ini akan disimpan di memori HP Anda. Anda dapat mengganti peran kapan saja melalui tombol di pojok atas.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  scroll: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131d2e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
    gap: 6,
  },
  serverDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  serverText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  roleCard: {
    width: '100%',
    backgroundColor: '#131d2e',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 14,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8.5,
    fontWeight: '900',
  },
  roleDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  footerNote: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});
