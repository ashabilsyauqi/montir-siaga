import React from 'react';
import { StyleSheet, Platform, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/context/AppContext';
import RoleBar from './src/components/RoleBar';
import DeviceRoleSelector from './src/components/DeviceRoleSelector';
import DriverView from './src/components/DriverView';
import MechanicView from './src/components/MechanicView';
import OwnerView from './src/components/OwnerView';

function MainApp() {
  const { currentRole, roleLoaded } = useApp();

  if (!roleLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  // If no role has been chosen yet on this device, show the First-Time Role Picker
  if (!currentRole) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <DeviceRoleSelector />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {/* Top Status Bar with Live Server Sync & Quick Switch */}
      <RoleBar />

      {/* Render Dedicated Role for this Smartphone */}
      {currentRole === 'driver' && <DriverView />}
      {currentRole === 'mechanic' && <MechanicView />}
      {currentRole === 'owner' && <OwnerView />}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#070a12',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#070a12',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
