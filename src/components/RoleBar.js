import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { useApp } from '../context/AppContext';
import DeviceRoleSelector from './DeviceRoleSelector';

export default function RoleBar() {
  const { currentRole, setCurrentRoleAndSave, activeOrder, isConnectedToServer, serverIP } = useApp();
  const [selectorVisible, setSelectorVisible] = useState(false);

  const roles = [
    { id: 'driver', label: 'HP 1: Driver', icon: '🚗', badge: activeOrder && activeOrder.status !== 'idle' ? '1' : null },
    { id: 'mechanic', label: 'HP 2: Montir', icon: '🔧', badge: activeOrder && activeOrder.status === 'searching' ? '🚨' : null },
    { id: 'owner', label: 'Owner', icon: '👑', badge: null },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topInfoRow}>
        <View style={styles.syncStatus}>
          <View style={[styles.statusDot, { backgroundColor: isConnectedToServer ? '#10b981' : '#f59e0b' }]} />
          <Text style={styles.syncText}>
            {isConnectedToServer ? `Live Sync: ${serverIP}` : 'Menghubungkan ke Server...'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setSelectorVisible(true)} style={styles.changeRoleBtn}>
          <Text style={styles.changeRoleText}>⚙️ Atur Peran HP</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.roleTabs}>
        {roles.map((r) => {
          const isActive = currentRole === r.id;
          return (
            <TouchableOpacity
              key={r.id}
              activeOpacity={0.8}
              onPress={() => setCurrentRoleAndSave(r.id)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text style={styles.tabIcon}>{r.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{r.label}</Text>
              {r.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{r.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={selectorVisible} animationType="slide">
        <DeviceRoleSelector onClose={() => setSelectorVisible(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#070a12',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  syncText: {
    color: '#94a3b8',
    fontSize: 9.5,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  changeRoleBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
  },
  changeRoleText: {
    color: '#38bdf8',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  roleTabs: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 9,
    gap: 4,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  tabIcon: {
    fontSize: 13,
  },
  tabLabel: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: 4,
    backgroundColor: '#ef4444',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
});
