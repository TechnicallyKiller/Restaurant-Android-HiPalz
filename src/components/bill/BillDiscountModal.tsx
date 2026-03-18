import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { addBillDiscount, removeBillDiscount } from '../../api';
import { getErrorMessage } from '../../utils/errorHandling';
import type { BillDiscountType } from '../../api/types';

interface BillDiscountModalProps {
  visible: boolean;
  onClose: () => void;
  billId: string;
  staffId: string;
  onSuccess: () => void;
}

export default function BillDiscountModal({
  visible,
  onClose,
  billId,
  staffId,
  onSuccess,
}: BillDiscountModalProps) {
  const [type, setType] = useState<BillDiscountType>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleAdd = async () => {
    const num = type === 'PERCENTAGE' ? parseFloat(value) : parseFloat(value);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid value', 'Enter a valid amount or percentage.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Reason required', 'Enter a reason for the discount.');
      return;
    }
    setLoading(true);
    try {
      const data = await addBillDiscount({
        billId,
        type,
        applyOn: 'ON_BILL',
        value: num,
        reason: reason.trim(),
        staffId,
      });
      onSuccess();
      onClose();
      setValue('');
      setReason('');
    } catch (err) {
      Alert.alert('Failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const data = await removeBillDiscount({ billId, staffId, reason: reason.trim() || undefined });
      onSuccess();
      onClose();
      setReason('');
    } catch (err) {
      Alert.alert('Failed', getErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Discount</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            <Pressable
              style={({ pressed }) => [
                styles.typeBtn,
                type === 'PERCENTAGE' && styles.typeBtnActive,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => setType('PERCENTAGE')}
            >
              <Text style={styles.typeBtnText}>Percentage</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.typeBtn,
                type === 'FLAT' && styles.typeBtnActive,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => setType('FLAT')}
            >
              <Text style={styles.typeBtnText}>Flat</Text>
            </Pressable>
          </View>
          <Text style={styles.label}>{type === 'PERCENTAGE' ? 'Percentage (0–100)' : 'Amount (₹)'}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            placeholder={type === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 50'}
            placeholderTextColor="#64748B"
          />
          <Text style={styles.label}>Reason *</Text>
          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={setReason}
            placeholder="Reason"
            placeholderTextColor="#64748B"
          />
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.removeBtn, { opacity: pressed ? 0.7 : 1 }]}
              onPress={handleRemove}
              disabled={removing}
            >
              {removing ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.removeBtnText}>Remove discount</Text>
              )}
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.addBtn,
                loading && styles.btnDisabled,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleAdd}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <Text style={styles.addBtnText}>Apply</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#F8FAFC' },
  closeText: { color: '#FFD700', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  typeBtn: { flex: 1, backgroundColor: '#334155', padding: 12, borderRadius: 10, alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#FFD700' },
  typeBtnText: { color: '#F8FAFC', fontWeight: '600' },
  label: { fontSize: 12, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#334155', borderRadius: 10, padding: 14, fontSize: 16, color: '#F8FAFC', marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 12 },
  removeBtn: { flex: 1, backgroundColor: '#64748B', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  removeBtnText: { color: '#FFF', fontWeight: '600' },
  addBtn: { flex: 1, backgroundColor: '#FFD700', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  addBtnText: { color: '#0F172A', fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
