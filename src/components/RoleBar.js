import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { useApp } from '../context/AppContext';
import DeviceRoleSelector from './DeviceRoleSelector';

export default function RoleBar() {
  const { currentRole, setCurrentRoleAndSave, activeOrder, isConnectedToServer, serverIP } = useApp();
  const [selectorVisible, setSelectorVisible] = useState(false);

  const roles = [
    { id: 'driver', label: 'Driver', icon: '🚗', badge: activeOrder && activeOrder.status !== 'idle' ? '1' : null },
    { id: 'mechanic', label: 'Montir', icon: '🔧', badge: activeOrder && activeOrder.status === 'searching' ? '🚨' : null },
    { id: 'owner', label: 'Owner', icon: '👑', badge: null },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topInfoRow}>
        <View style={styles.syncStatus}>
          <View style={[styles.statusDot, { backgroundColor: isConnectedToServer ? '#10B981' : '#F59E0B' }]} />
          <Text style={styles.syncText}>
            {isConnectedToServer ? `Live Sync: ${serverIP}` : 'Menghubungkan Server...'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setSelectorVisible(true)} style={styles.changeRoleBtn}>
          <Text style={styles.changeRoleText}>⚙️ Atur Peran</Text>
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
                <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncText: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  changeRoleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  changeRoleText: {
    color: '#E11D48',
    fontSize: 11,
    fontWeight: '700',
  },
  roleTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  tabActive: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIcon: {
    fontSize: 13,
  },
  tabLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 2,
  },
  badgeActive: {
    backgroundColor: '#FFFFFF',
  },
  badgeInactive: {
    backgroundColor: '#EF4444',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#DC2626',
  },
});