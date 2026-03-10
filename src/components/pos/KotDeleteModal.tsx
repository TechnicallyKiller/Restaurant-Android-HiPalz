import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { deleteKotItems } from '../../api';
import { getErrorMessage } from '../../utils/errorHandling';
import type { Kot, KotItem } from '../../api/types';

interface KotDeleteModalProps {
  visible: boolean;
  onClose: () => void;
  kots: Kot[];
  tableId: string;
  outletId: string;
  staffId: string;
  onSuccess?: () => void | Promise<void>;
}

export default function KotDeleteModal({
  visible,
  onClose,
  kots,
  tableId,
  outletId,
  staffId,
  onSuccess,
}: KotDeleteModalProps) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const flatItems: { item: KotItem; orderId: string }[] = [];
  kots.forEach(kot => {
    kot.items.forEach(item => {
      flatItems.push({ item, orderId: kot.orderId });
    });
  });

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
    const trimmed = reason.trim();
    if (!trimmed) {
      Alert.alert('Reason required', 'Please enter a reason for deleting items.');
      return;
    }
    const byOrder = new Map<string, { kotItemId: string; quantity: number }[]>();
    flatItems.forEach(({ item, orderId }) => {
      const qty = selected[item.id] ?? 0;
      if (qty > 0) {
        const list = byOrder.get(orderId) ?? [];
        list.push({ kotItemId: item.id, quantity: qty });
        byOrder.set(orderId, list);
      }
    });
    if (byOrder.size === 0) {
      Alert.alert('Select items', 'Select at least one item to delete.');
      return;
    }
    setLoading(true);
    try {
      for (const [orderId, items] of byOrder) {
        await deleteKotItems({
          outletId,
          tableId,
          orderId,
          reason: trimmed,
          deletedBy: staffId,
          items,
        });
      }
      await Promise.resolve(onSuccess?.());
      handleClose();
    } catch (err) {
      Alert.alert('Delete failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSelected({});
    setReason('');
  };

  const totalSelected = Object.values(selected).reduce((a, b) => a + b, 0);

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Delete KOT items</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Select items and quantity to remove. Reason is required.</Text>
          <ScrollView style={styles.scroll}>
            {flatItems.map(({ item }) => {
              const qty = selected[item.id] ?? 0;
              return (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name} (max {item.quantity})</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setQty(item.id, item.quantity, -1)}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyNum}>{qty}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setQty(item.id, item.quantity, 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
          <Text style={styles.label}>Reason *</Text>
          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Wrong order, guest cancelled"
            placeholderTextColor="#64748B"
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (totalSelected === 0 || !reason.trim() || loading) && styles.confirmBtnDisabled,
              ]}
              onPress={handleConfirm}
              disabled={totalSelected === 0 || !reason.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>Delete items</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800', color: '#F8FAFC', flex: 1 },
  closeText: { color: '#FFD700', fontWeight: '600' },
  hint: { fontSize: 12, color: '#94A3B8', marginBottom: 12 },
  scroll: { maxHeight: 240, marginBottom: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155' },
  itemName: { fontSize: 14, color: '#F8FAFC', flex: 1 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { color: '#F8FAFC', fontWeight: '700' },
  qtyNum: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', minWidth: 24, textAlign: 'center' },
  label: { fontSize: 12, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#334155', borderRadius: 10, padding: 14, fontSize: 16, color: '#F8FAFC', marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#334155', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#F8FAFC', fontWeight: '600' },
  confirmBtn: { flex: 1, backgroundColor: '#F87171', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#FFF', fontWeight: '700' },
});
