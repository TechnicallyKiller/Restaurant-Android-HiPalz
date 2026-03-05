import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getBillById, payBill, getPaymentModes } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errorHandling';
import BillDiscountModal from '../bill/BillDiscountModal';
import BillServiceChargeModal from '../bill/BillServiceChargeModal';
import BillExtrasModal from '../bill/BillExtrasModal';
import type { BillPreviewData, BillPayModeBackend } from '../../api/types';

interface InstanceBillModalProps {
  visible: boolean;
  onClose: () => void;
  billId: string;
  onSettled?: () => void;
}

export default function InstanceBillModal({
  visible,
  onClose,
  billId,
  onSettled,
}: InstanceBillModalProps) {
  const staffId = useAuthStore(s => s.user?.id ?? '');
  const outletId = useAuthStore(s => s.user?.outletId ?? '');

  const [bill, setBill] = useState<BillPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [modes, setModes] = useState<{ id: string; name: string }[]>([]);
  const [settleVisible, setSettleVisible] = useState(false);
  const [selectedMode, setSelectedMode] = useState<BillPayModeBackend | null>(null);
  const [paying, setPaying] = useState(false);
  const [discountVisible, setDiscountVisible] = useState(false);
  const [serviceChargeVisible, setServiceChargeVisible] = useState(false);
  const [extrasVisible, setExtrasVisible] = useState(false);

  const refetchBill = async () => {
    if (!billId) return;
    setLoading(true);
    try {
      const data = await getBillById(billId);
      setBill(data);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && billId) {
      refetchBill();
      getPaymentModes(outletId).then(setModes);
    }
  }, [visible, billId]);

  const handlePay = async () => {
    if (!bill?.id || !selectedMode) return;
    setPaying(true);
    try {
      await payBill({ billId: bill.id, mode: selectedMode, staffId });
      setSettleVisible(false);
      onSettled?.();
      onClose();
    } catch (err) {
      Alert.alert('Payment failed', getErrorMessage(err));
    } finally {
      setPaying(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      <Modal visible animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>Instance bill</Text>
              <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
            </View>
            {loading && !bill ? (
              <ActivityIndicator color="#FFD700" style={styles.loader} />
            ) : !bill ? (
              <Text style={styles.empty}>Could not load bill.</Text>
            ) : (
              <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                {bill.items.map(item => (
                  <View key={item.id} style={styles.row}>
                    <Text style={styles.itemName}>{item.itemName} × {item.quantity}</Text>
                    <Text style={styles.itemPrice}>
                      ₹{((item.itemPrice * item.quantity) + (item.containerCharge ?? 0)).toFixed(0)}
                    </Text>
                  </View>
                ))}
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>₹{bill.subtotal.toFixed(0)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax</Text>
                  <Text style={styles.summaryValue}>₹{bill.totalTax.toFixed(0)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.payableRow]}>
                  <Text style={styles.payableLabel}>Payable</Text>
                  <Text style={styles.payableValue}>₹{bill.payable.toFixed(0)}</Text>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => setDiscountVisible(true)}>
                    <Text style={styles.smallBtnText}>Discount</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => setServiceChargeVisible(true)}>
                    <Text style={styles.smallBtnText}>Service charge</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => setExtrasVisible(true)}>
                    <Text style={styles.smallBtnText}>Extras</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.settleBtn}
                  onPress={() => setSettleVisible(true)}
                >
                  <Text style={styles.settleBtnText}>Settle</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={settleVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.modalTitle}>Settle — ₹{bill?.payable.toFixed(0) ?? '0'}</Text>
            <ScrollView style={styles.modesList}>
              {modes.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.modeBtn, selectedMode === m.name && styles.modeBtnActive]}
                  onPress={() => setSelectedMode(m.name as BillPayModeBackend)}
                >
                  <Text style={styles.modeBtnText}>{m.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSettleVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, (!selectedMode || paying) && styles.btnDisabled]}
                onPress={handlePay}
                disabled={!selectedMode || paying}
              >
                {paying ? <ActivityIndicator color="#0F172A" size="small" /> : <Text style={styles.confirmBtnText}>Confirm pay</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BillDiscountModal
        visible={discountVisible}
        onClose={() => setDiscountVisible(false)}
        billId={billId}
        staffId={staffId}
        onSuccess={refetchBill}
      />
      <BillServiceChargeModal
        visible={serviceChargeVisible}
        onClose={() => setServiceChargeVisible(false)}
        billId={billId}
        staffId={staffId}
        onSuccess={refetchBill}
      />
      <BillExtrasModal
        visible={extrasVisible}
        onClose={() => setExtrasVisible(false)}
        billId={billId}
        staffId={staffId}
        onSuccess={refetchBill}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#F8FAFC' },
  closeText: { color: '#FFD700', fontWeight: '600' },
  loader: { padding: 40 },
  empty: { color: '#64748B', padding: 24, textAlign: 'center' },
  scroll: { maxHeight: 400 },
  scrollContent: { paddingBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  itemName: { color: '#F8FAFC', fontSize: 14 },
  itemPrice: { color: '#FFD700', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { color: '#94A3B8', fontSize: 14 },
  summaryValue: { color: '#F8FAFC', fontSize: 14 },
  payableRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' },
  payableLabel: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  payableValue: { fontSize: 20, fontWeight: '800', color: '#FFD700' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  smallBtn: { backgroundColor: '#334155', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  smallBtnText: { color: '#F8FAFC', fontWeight: '600', fontSize: 14 },
  settleBtn: { backgroundColor: '#FFD700', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  settleBtnText: { color: '#0F172A', fontWeight: '700' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#F8FAFC', marginBottom: 16 },
  modesList: { maxHeight: 200, marginBottom: 16 },
  modeBtn: { backgroundColor: '#334155', padding: 16, borderRadius: 12, marginBottom: 8 },
  modeBtnActive: { backgroundColor: '#FFD700' },
  modeBtnText: { color: '#F8FAFC', fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#334155', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#F8FAFC', fontWeight: '600' },
  confirmBtn: { flex: 1, backgroundColor: '#FFD700', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#0F172A', fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
