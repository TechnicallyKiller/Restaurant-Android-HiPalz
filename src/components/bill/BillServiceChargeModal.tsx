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
import { addServiceCharge, removeServiceCharge } from '../../api';
import { getErrorMessage } from '../../utils/errorHandling';

interface BillServiceChargeModalProps {
  visible: boolean;
  onClose: () => void;
  billId: string;
  staffId: string;
  onSuccess: () => void;
}

export default function BillServiceChargeModal({
  visible,
  onClose,
  billId,
  staffId,
  onSuccess,
}: BillServiceChargeModalProps) {
  const [amount, setAmount] = useState('');
  const [percentage, setPercentage] = useState('');
  const [usePercentage, setUsePercentage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleAdd = async () => {
    if (usePercentage) {
      const pct = parseFloat(percentage);
      if (isNaN(pct) || pct <= 0) {
        Alert.alert('Invalid value', 'Enter a valid percentage.');
        return;
      }
      setLoading(true);
      try {
        await addServiceCharge({ billId, percentage: pct, staffId });
        onSuccess();
        onClose();
        setPercentage('');
      } catch (err) {
        Alert.alert('Failed', getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    } else {
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt < 0) {
        Alert.alert('Invalid value', 'Enter a valid amount.');
        return;
      }
      setLoading(true);
      try {
        await addServiceCharge({ billId, amount: amt, staffId });
        onSuccess();
        onClose();
        setAmount('');
      } catch (err) {
        Alert.alert('Failed', getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await removeServiceCharge({ billId, staffId });
      onSuccess();
      onClose();
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
            <Text style={styles.title}>Service charge</Text>
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
                styles.tabBtn,
                !usePercentage && styles.tabBtnActive,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => setUsePercentage(false)}
            >
              <Text style={styles.tabBtnText}>Amount</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.tabBtn,
                usePercentage && styles.tabBtnActive,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => setUsePercentage(true)}
            >
              <Text style={styles.tabBtnText}>Percentage</Text>
            </Pressable>
          </View>
          {usePercentage ? (
            <>
              <Text style={styles.label}>Percentage</Text>
              <TextInput
                style={styles.input}
                value={percentage}
                onChangeText={setPercentage}
                keyboardType="decimal-pad"
                placeholder="e.g. 10"
                placeholderTextColor="#64748B"
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Amount (₹)</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="e.g. 100"
                placeholderTextColor="#64748B"
              />
            </>
          )}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.removeBtn, { opacity: pressed ? 0.7 : 1 }]}
              onPress={handleRemove}
              disabled={removing}
            >
              {removing ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.removeBtnText}>Remove</Text>
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
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  tabBtn: { flex: 1, backgroundColor: '#334155', padding: 12, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#FFD700' },
  tabBtnText: { color: '#F8FAFC', fontWeight: '600' },
  label: { fontSize: 12, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#334155', borderRadius: 10, padding: 14, fontSize: 16, color: '#F8FAFC', marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 12 },
  removeBtn: { flex: 1, backgroundColor: '#64748B', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  removeBtnText: { color: '#FFF', fontWeight: '600' },
  addBtn: { flex: 1, backgroundColor: '#FFD700', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  addBtnText: { color: '#0F172A', fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
