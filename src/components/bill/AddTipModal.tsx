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
import { addTip, removeTip } from '../../api';
import { getErrorMessage } from '../../utils/errorHandling';

const PREDEFINED_REASONS = ['Customer request', 'Service issue', 'Other'];

interface AddTipModalProps {
  visible: boolean;
  onClose: () => void;
  billId: string;
  staffId: string;
  currentTipTotal: number;
  onSuccess: () => void;
}

export default function AddTipModal({
  visible,
  onClose,
  billId,
  staffId,
  currentTipTotal,
  onSuccess,
}: AddTipModalProps) {
  const [amount, setAmount] = useState('');
  const [removeReason, setRemoveReason] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleAdd = async () => {
    const num = parseFloat(amount.replace(/,/g, '.'));
    if (isNaN(num) || num < 0) {
      Alert.alert('Invalid amount', 'Enter a valid tip amount (≥ 0).');
      return;
    }
    setAdding(true);
    try {
      await addTip({ billId, amount: num, staffId });
      onSuccess();
      onClose();
      setAmount('');
    } catch (err) {
      Alert.alert('Failed', getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async () => {
    const reason = removeReason.trim();
    if (!reason) {
      Alert.alert('Reason required', 'Enter or select a reason to remove tip.');
      return;
    }
    setRemoving(true);
    try {
      await removeTip({ billId, staffId, reason });
      onSuccess();
      onClose();
      setRemoveReason('');
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
            <Text style={styles.title}>Add tip</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>

          {currentTipTotal > 0 && (
            <Text style={styles.currentTip}>Current tip: ₹{currentTipTotal.toFixed(2)}</Text>
          )}

          <Text style={styles.label}>Tip amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#64748B"
          />

          {currentTipTotal > 0 && (
            <>
              <Text style={styles.label}>Remove tip — reason</Text>
              <View style={styles.reasonChips}>
                {PREDEFINED_REASONS.map(r => (
                  <Pressable
                    key={r}
                    style={({ pressed }) => [
                      styles.chip,
                      removeReason === r && styles.chipActive,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={() => setRemoveReason(r)}
                  >
                    <Text style={styles.chipText}>{r}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.input}
                value={removeReason}
                onChangeText={setRemoveReason}
                placeholder="Or type custom reason"
                placeholderTextColor="#64748B"
              />
            </>
          )}

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, { opacity: pressed ? 0.7 : 1 }]}
              onPress={onClose}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            {currentTipTotal > 0 && (
              <Pressable
                style={({ pressed }) => [
                  styles.removeBtn,
                  (!removeReason.trim() || removing) && styles.btnDisabled,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleRemove}
                disabled={!removeReason.trim() || removing}
              >
                {removing ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.removeBtnText}>Remove tip</Text>
                )}
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.addBtn,
                adding && styles.btnDisabled,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleAdd}
              disabled={adding}
            >
              {adding ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <Text style={styles.addBtnText}>Add</Text>
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
  currentTip: { fontSize: 14, color: '#94A3B8', marginBottom: 12 },
  label: { fontSize: 12, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#334155', borderRadius: 10, padding: 14, fontSize: 16, color: '#F8FAFC', marginBottom: 12 },
  reasonChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { backgroundColor: '#334155', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  chipActive: { backgroundColor: '#FFD700' },
  chipText: { color: '#F8FAFC', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, backgroundColor: '#334155', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#F8FAFC', fontWeight: '600' },
  removeBtn: { flex: 1, backgroundColor: '#64748B', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  removeBtnText: { color: '#FFF', fontWeight: '600' },
  addBtn: { flex: 1, backgroundColor: '#FFD700', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  addBtnText: { color: '#0F172A', fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
