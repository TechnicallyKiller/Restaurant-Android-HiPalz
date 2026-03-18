import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { transferKot } from '../../api';
import { getErrorMessage } from '../../utils/errorHandling';
import type { Kot, KotItem } from '../../api/types';
import type { Table } from '../../api/types';

type Step = 'items' | 'table' | 'confirm';

interface KotTransferModalProps {
  visible: boolean;
  onClose: () => void;
  kots: Kot[];
  fromTableId: string;
  tables: Table[];
  staffId: string;
  outletId: string;
  onSuccess: () => void;
}

export default function KotTransferModal({
  visible,
  onClose,
  kots,
  fromTableId,
  tables,
  staffId,
  outletId,
  onSuccess,
}: KotTransferModalProps) {
  const [step, setStep] = useState<Step>('items');
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [toTableId, setToTableId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const flatItems: { item: KotItem; orderId: string }[] = [];
  kots.forEach(kot => {
    kot.items.forEach(item => {
      flatItems.push({ item, orderId: kot.orderId });
    });
  });

  const selectedEntries = flatItems
    .filter(({ item }) => selected[item.id] > 0)
    .map(({ item }) => ({ kotItemId: item.id, quantity: selected[item.id] ?? 0 }));

  const canGoToTable = selectedEntries.length > 0;
  const canConfirm = toTableId && canGoToTable;

  const setQty = (kotItemId: string, max: number, delta: number) => {
    setSelected(prev => {
      const cur = prev[kotItemId] ?? 0;
      const next = Math.max(0, Math.min(max, cur + delta));
      if (next === 0) {
        const u = { ...prev };
        delete u[kotItemId];
        return u;
      }
      return { ...prev, [kotItemId]: next };
    });
  };

  const handleConfirm = async () => {
    if (!toTableId || selectedEntries.length === 0) return;
    setLoading(true);
    try {
      await transferKot({
        outletId,
        fromTableId,
        toTableId,
        staffId,
        items: selectedEntries,
        reason: reason.trim() || undefined,
      });
      onSuccess();
      handleClose();
    } catch (err) {
      Alert.alert('Transfer failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setStep('items');
    setSelected({});
    setToTableId(null);
    setReason('');
  };

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 'items' && 'Select items to transfer'}
              {step === 'table' && 'Select destination table'}
              {step === 'confirm' && 'Confirm transfer'}
            </Text>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>

          {step === 'items' && (
            <>
              <ScrollView style={styles.scroll}>
                {flatItems.map(({ item }) => {
                  const qty = selected[item.id] ?? 0;
                  return (
                    <View key={item.id} style={styles.itemRow}>
                      <Text style={styles.itemName}>{item.name} (max {item.quantity})</Text>
                      <View style={styles.qtyRow}>
                        <Pressable
                          style={({ pressed }) => [styles.qtyBtn, { opacity: pressed ? 0.7 : 1 }]}
                          onPress={() => setQty(item.id, item.quantity, -1)}
                        >
                          <Text style={styles.qtyBtnText}>−</Text>
                        </Pressable>
                        <Text style={styles.qtyNum}>{qty}</Text>
                        <Pressable
                          style={({ pressed }) => [styles.qtyBtn, { opacity: pressed ? 0.7 : 1 }]}
                          onPress={() => setQty(item.id, item.quantity, 1)}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
              <Pressable
                style={({ pressed }) => [
                  styles.nextBtn,
                  !canGoToTable && styles.nextBtnDisabled,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => setStep('table')}
                disabled={!canGoToTable}
              >
                <Text style={styles.nextBtnText}>Next: Select table</Text>
              </Pressable>
            </>
          )}

          {step === 'table' && (
            <>
              <ScrollView style={styles.scroll}>
                {tables.map(t => (
                  <Pressable
                    key={t.id}
                    style={({ pressed }) => [
                      styles.tableBtn,
                      toTableId === t.id && styles.tableBtnActive,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={() => setToTableId(t.id)}
                  >
                    <Text style={styles.tableBtnText}>{t.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.row}>
                <Pressable
                  style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => setStep('items')}
                >
                  <Text style={styles.backBtnText}>Back</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.nextBtn,
                    !toTableId && styles.nextBtnDisabled,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => setStep('confirm')}
                  disabled={!toTableId}
                >
                  <Text style={styles.nextBtnText}>Next</Text>
                </Pressable>
              </View>
            </>
          )}

          {step === 'confirm' && (
            <>
              <Text style={styles.summary}>
                Transfer {selectedEntries.reduce((s, i) => s + i.quantity, 0)} item(s) to selected table.
              </Text>
              <Text style={styles.label}>Reason (optional)</Text>
              <TextInput
                style={styles.input}
                value={reason}
                onChangeText={setReason}
                placeholder="Reason"
                placeholderTextColor="#64748B"
              />
              <View style={styles.row}>
                <Pressable
                  style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => setStep('table')}
                >
                  <Text style={styles.backBtnText}>Back</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.confirmBtn,
                    loading && styles.confirmBtnDisabled,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={handleConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#0F172A" size="small" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Confirm transfer</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: '#F8FAFC', flex: 1 },
  closeText: { color: '#FFD700', fontWeight: '600' },
  scroll: { maxHeight: 280, marginBottom: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  itemName: { fontSize: 14, color: '#F8FAFC', flex: 1 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { color: '#F8FAFC', fontWeight: '700' },
  qtyNum: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', minWidth: 24, textAlign: 'center' },
  tableBtn: { backgroundColor: '#334155', padding: 14, borderRadius: 10, marginBottom: 8 },
  tableBtnActive: { backgroundColor: '#FFD700' },
  tableBtnText: { fontSize: 16, fontWeight: '600', color: '#F8FAFC' },
  summary: { color: '#94A3B8', marginBottom: 12 },
  label: { fontSize: 12, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#334155', borderRadius: 10, padding: 14, fontSize: 16, color: '#F8FAFC', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12 },
  backBtn: { flex: 1, backgroundColor: '#334155', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  backBtnText: { color: '#F8FAFC', fontWeight: '600' },
  nextBtn: { flex: 1, backgroundColor: '#FFD700', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  nextBtnDisabled: { opacity: 0.6 },
  nextBtnText: { color: '#0F172A', fontWeight: '700' },
  confirmBtn: { flex: 1, backgroundColor: '#FFD700', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#0F172A', fontWeight: '700' },
});
