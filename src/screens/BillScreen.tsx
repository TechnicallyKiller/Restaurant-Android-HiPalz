import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useTableStore } from '../store/tableStore';
import { useBillStore } from '../store/billStore';
import { useAuthStore } from '../store/authStore';
import {
  useBillPreview,
  useBillGenerate,
  useBillByTable,
  usePayBill,
  usePaymentModes,
} from '../hooks';
import { createTableInstance } from '../api';
import { getErrorMessage } from '../utils/errorHandling';
import BillDiscountModal from '../components/bill/BillDiscountModal';
import BillServiceChargeModal from '../components/bill/BillServiceChargeModal';
import BillExtrasModal from '../components/bill/BillExtrasModal';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { BillPayModeBackend } from '../api/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Bill'>;

const BillScreen = ({ navigation }: Props) => {
  const currentTable = useTableStore(s => s.currentTable);
  const bill = useBillStore(s =>
    currentTable ? s.getBillForTable(currentTable.id) : null,
  );
  const setBillForTable = useBillStore(s => s.setBillForTable);
  const hasBill = Boolean(bill?.id);

  const { fetchPreview, isLoading: previewLoading } = useBillPreview();
  const { generate, isGenerating } = useBillGenerate();
  const { refresh, isRefreshing } = useBillByTable(currentTable?.id);
  const { pay, isPaying } = usePayBill();
  const { modes, refetch: refetchModes } = usePaymentModes();

  const staffId = useAuthStore(s => s.user?.id ?? '');
  const [settleVisible, setSettleVisible] = useState(false);
  const [selectedMode, setSelectedMode] = useState<BillPayModeBackend | null>(null);
  const [discountVisible, setDiscountVisible] = useState(false);
  const [serviceChargeVisible, setServiceChargeVisible] = useState(false);
  const [extrasVisible, setExtrasVisible] = useState(false);
  const [creatingInstance, setCreatingInstance] = useState(false);

  useEffect(() => {
    if (currentTable && !bill) fetchPreview();
  }, [currentTable?.id]);

  useEffect(() => {
    refetchModes();
  }, [refetchModes]);

  const handleGenerate = async () => {
    const data = await generate();
    if (data) setSettleVisible(false);
  };

  const refetchBill = () => {
    if (currentTable?.id) refresh();
  };

  const handleCreateInstance = () => {
    if (!bill?.id) return;
    Alert.alert(
      'Create table instance',
      'You are partially settling the table. The table will be freed for a new order. Only billing actions will be allowed for this bill.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create instance',
          onPress: async () => {
            setCreatingInstance(true);
            try {
              await createTableInstance({ billId: bill.id, staffId });
              setBillForTable(currentTable!.id, null);
              navigation.navigate('Tables');
            } catch (err) {
              Alert.alert('Failed', getErrorMessage(err));
            } finally {
              setCreatingInstance(false);
            }
          },
        },
      ],
    );
  };

  const handlePay = async () => {
    if (!bill?.id || !selectedMode) return;
    const result = await pay({ billId: bill.id, mode: selectedMode });
    if (result.success) {
      setSettleVisible(false);
      setBillForTable(currentTable!.id, null);
      navigation.navigate('Tables');
    } else {
      Alert.alert('Payment failed', result.error);
    }
  };

  if (!currentTable) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noTable}>No table selected</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const loading = previewLoading || isRefreshing;
  const displayBill = bill;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bill — {currentTable.name}</Text>
      </View>

      {loading && !displayBill ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      ) : !displayBill ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No bill data. Try generating bill from POS.</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {displayBill.items.map(item => (
            <View key={item.id} style={styles.billRow}>
              <Text style={styles.billItemName}>
                {item.itemName} × {item.quantity}
              </Text>
              <Text style={styles.billItemPrice}>
                ₹{((item.itemPrice * item.quantity) + (item.containerCharge ?? 0)).toFixed(0)}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{displayBill.subtotal.toFixed(0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>₹{displayBill.totalTax.toFixed(0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service / charges</Text>
            <Text style={styles.summaryValue}>
              ₹{(displayBill.serviceCharge + displayBill.containerCharge).toFixed(0)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.payableRow]}>
            <Text style={styles.payableLabel}>Payable</Text>
            <Text style={styles.payableValue}>₹{displayBill.payable.toFixed(0)}</Text>
          </View>

          {hasBill && (
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
          )}

          {!hasBill ? (
            <TouchableOpacity
              style={[styles.primaryBtn, isGenerating && styles.btnDisabled]}
              onPress={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Generate bill</Text>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.payBtn]}
                onPress={() => setSettleVisible(true)}
              >
                <Text style={styles.primaryBtnText}>Pay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.instanceBtn, creatingInstance && styles.btnDisabled]}
                onPress={handleCreateInstance}
                disabled={creatingInstance}
              >
                {creatingInstance ? (
                  <ActivityIndicator color="#0F172A" size="small" />
                ) : (
                  <Text style={styles.instanceBtnText}>Create table instance</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => refresh()}>
            <Text style={styles.secondaryBtnText}>Refresh</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <BillDiscountModal
        visible={discountVisible}
        onClose={() => setDiscountVisible(false)}
        billId={bill?.id ?? ''}
        staffId={staffId}
        onSuccess={refetchBill}
      />
      <BillServiceChargeModal
        visible={serviceChargeVisible}
        onClose={() => setServiceChargeVisible(false)}
        billId={bill?.id ?? ''}
        staffId={staffId}
        onSuccess={refetchBill}
      />
      <BillExtrasModal
        visible={extrasVisible}
        onClose={() => setExtrasVisible(false)}
        billId={bill?.id ?? ''}
        staffId={staffId}
        onSuccess={refetchBill}
      />

      <Modal visible={settleVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Settle — ₹{displayBill?.payable.toFixed(0) ?? '0'}</Text>
            <Text style={styles.modeLabel}>Payment mode</Text>
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
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSettleVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, (!selectedMode || isPaying) && styles.btnDisabled]}
                onPress={handlePay}
                disabled={!selectedMode || isPaying}
              >
                {isPaying ? (
                  <ActivityIndicator color="#0F172A" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm pay</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noTable: { color: '#94A3B8', marginBottom: 16 },
  backBtn: { padding: 16 },
  backBtnText: { color: '#FFD700', fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  backButton: { marginRight: 12 },
  backText: { color: '#FFD700', fontSize: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  loading: { flex: 1, justifyContent: 'center' },
  empty: { flex: 1, justifyContent: 'center', padding: 24 },
  emptyText: { color: '#64748B', textAlign: 'center' },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 32 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  billItemName: { color: '#F8FAFC', fontSize: 14 },
  billItemPrice: { color: '#FFD700', fontWeight: '600' },
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
  primaryBtn: { backgroundColor: '#FFD700', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  payBtn: { marginTop: 16 },
  instanceBtn: { backgroundColor: '#334155', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  instanceBtnText: { color: '#FFD700', fontWeight: '700', fontSize: 14 },
  primaryBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 16 },
  secondaryBtn: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  secondaryBtnText: { color: '#94A3B8' },
  btnDisabled: { opacity: 0.6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 32, maxHeight: '70%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#F8FAFC', marginBottom: 16 },
  modeLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase' },
  modesList: { maxHeight: 200, marginBottom: 16 },
  modeBtn: { backgroundColor: '#334155', padding: 16, borderRadius: 12, marginBottom: 8 },
  modeBtnActive: { backgroundColor: '#FFD700' },
  modeBtnText: { color: '#F8FAFC', fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#334155', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#F8FAFC', fontWeight: '600' },
  confirmBtn: { flex: 1, backgroundColor: '#FFD700', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#0F172A', fontWeight: '700' },
});

export default BillScreen;
