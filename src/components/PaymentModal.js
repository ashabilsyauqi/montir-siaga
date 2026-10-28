import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';

export default function PaymentModal({ visible, onClose }) {
  const { activeOrder, completePayment } = useApp();
  const [selectedMethod, setSelectedMethod] = useState('qris'); // 'qris' | 'cash' | 'ewallet'
  const [isProcessing, setIsProcessing] = useState(false);

  if (!activeOrder) return null;

  const formatRupiah = (val) => {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
  };

  const handlePayNow = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      completePayment(selectedMethod);
      onClose();
      Alert.alert(
        'Pembayaran Berhasil! 🎉',
        `Pembayaran ${formatRupiah(activeOrder.price)} via ${selectedMethod.toUpperCase()} telah diverifikasi oleh sistem.`,
        [{ text: 'OK' }]
      );
    }, 1200);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.sheetTitle}>Pembayaran Standar</Text>
              <Text style={styles.sheetSub}>Order #{activeOrder.id} • {activeOrder.service?.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ fontSize: 16, color: '#94a3b8' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Total Due Banner */}
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>TOTAL TAGIHAN</Text>
              <Text style={styles.totalValue}>{formatRupiah(activeOrder.price)}</Text>
              <View style={styles.feeBreakdown}>
                <Text style={styles.feeText}>Jasa Mekanik: {formatRupiah(activeOrder.mechanicNet)}</Text>
                <Text style={styles.feeText}>Biaya Platform (15%): {formatRupiah(activeOrder.platformFee)}</Text>
              </View>
            </View>

            {/* Payment Method Selector */}
            <Text style={styles.sectionTitle}>PILIH METODE PEMBAYARAN</Text>

            {/* Option 1: QRIS */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedMethod('qris')}
              style={[styles.methodCard, selectedMethod === 'qris' && styles.methodSelected]}
            >
              <View style={styles.methodLeft}>
                <View style={styles.methodIconBox}>
                  <Text style={{ fontSize: 20 }}>📲</Text>
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.methodName}>QRIS (Standar Nasional)</Text>
                    <View style={styles.qrisBadge}>
                      <Text style={styles.qrisBadgeText}>INSTAN</Text>
                    </View>
                  </View>
                  <Text style={styles.methodDesc}>BCA, Mandiri, BRI, GoPay, OVO, ShopeePay</Text>
                </View>
              </View>
              <View style={[styles.radioCircle, selectedMethod === 'qris' && styles.radioActive]} />
            </TouchableOpacity>

            {/* QRIS Code Preview when selected */}
            {selectedMethod === 'qris' && (
              <View style={styles.qrisBox}>
                <Text style={styles.qrisPrompt}>Scan QRIS Menggunakan M-Banking / E-Wallet</Text>
                {/* Simulated QR Pattern */}
                <View style={styles.qrCodeSimulated}>
                  <View style={styles.qrInner}>
                    <Text style={{ fontSize: 44 }}>⬛</Text>
                    <Text style={{ fontSize: 10, color: '#64748b', fontWeight: 'bold' }}>NMID: ID102030405</Text>
                  </View>
                </View>
                <Text style={styles.qrisTimer}>⏱️ Menunggu pembayaran (Otomatis terverifikasi)</Text>
              </View>
            )}

            {/* Option 2: Tunai / Cash */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedMethod('cash')}
              style={[styles.methodCard, selectedMethod === 'cash' && styles.methodSelected]}
            >
              <View style={styles.methodLeft}>
                <View style={styles.methodIconBox}>
                  <Text style={{ fontSize: 20 }}>💵</Text>
                </View>
                <View>
                  <Text style={styles.methodName}>Tunai (Cash ke Montir)</Text>
                  <Text style={styles.methodDesc}>Bayar langsung ke Pak Agus di lokasi mobil</Text>
                </View>
              </View>
              <View style={[styles.radioCircle, selectedMethod === 'cash' && styles.radioActive]} />
            </TouchableOpacity>

            {/* Option 3: E-Wallet */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedMethod('ewallet')}
              style={[styles.methodCard, selectedMethod === 'ewallet' && styles.methodSelected]}
            >
              <View style={styles.methodLeft}>
                <View style={styles.methodIconBox}>
                  <Text style={{ fontSize: 20 }}>👛</Text>
                </View>
                <View>
                  <Text style={styles.methodName}>E-Wallet Langsung</Text>
                  <Text style={styles.methodDesc}>GoPay, DANA, LinkAja (Potong Saldo)</Text>
                </View>
              </View>
              <View style={[styles.radioCircle, selectedMethod === 'ewallet' && styles.radioActive]} />
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Action CTA */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.payBtn}
              onPress={handlePayNow}
              disabled={isProcessing}
            >
              <Text style={styles.payBtnText}>
                {isProcessing
                  ? 'MEMPROSES PEMBAYARAN...'
                  : selectedMethod === 'qris'
                  ? 'BAYAR SEKARANG VIA QRIS'
                  : selectedMethod === 'cash'
                  ? 'KONFIRMASI BAYAR TUNAI'
                  : 'KONFIRMASI E-WALLET'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  sheetTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  sheetSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  totalBox: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  totalLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  totalValue: {
    color: '#f59e0b',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  feeBreakdown: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feeText: {
    color: '#64748b',
    fontSize: 10,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
    marginBottom: 10,
  },
  methodSelected: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  methodDesc: {
    color: '#94a3b8',
    fontSize: 10.5,
    marginTop: 2,
  },
  qrisBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  qrisBadgeText: {
    color: '#34d399',
    fontSize: 9,
    fontWeight: '800',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#64748b',
  },
  radioActive: {
    borderColor: '#ef4444',
    backgroundColor: '#ef4444',
  },
  qrisBox: {
    backgroundColor: '#131d2e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  qrisPrompt: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
  },
  qrCodeSimulated: {
    width: 140,
    height: 140,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  qrInner: {
    alignItems: 'center',
  },
  qrisTimer: {
    color: '#10b981',
    fontSize: 10,
    marginTop: 10,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  payBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  payBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
