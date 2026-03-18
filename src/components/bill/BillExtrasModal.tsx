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
import {
  addContainerCharge,
  removeContainerCharge,
  addDeliveryCharge,
  removeDeliveryCharge,
} from '../../api';
import { getErrorMessage } from '../../utils/errorHandling';

interface BillExtrasModalProps {
  visible: boolean;
  onClose: () => void;
  billId: string;
  staffId: string;
  onSuccess: () => void;
}

export default function BillExtrasModal({
  visible,
  onClose,
  billId,
  staffId,
  onSuccess,
}: BillExtrasModalProps) {
  const [containerAmount, setContainerAmount] = useState('');
  const [deliveryAmount, setDeliveryAmount] = useState('');
  const [removeReason, setRemoveReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddContainer = async () => {
    const amt = parseFloat(containerAmount);
    if (isNaN(amt) || amt < 0) {
      Alert.alert('Invalid value', 'Enter a valid amount.');
      return;
    }
    setLoading(true);
    try {
      await addContainerCharge({ billId, amount: amt, staffId });
      onSuccess();
      setContainerAmount('');
    } catch (err) {
      Alert.alert('Failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAddDelivery = async () => {
    const amt = parseFloat(deliveryAmount);
    if (isNaN(amt) || amt < 0) {
      Alert.alert('Invalid value', 'Enter a valid amount.');
      return;
    }
    setLoading(true);
    try {
      await addDeliveryCharge({ billId, amount: amt, staffId });
      onSuccess();
      setDeliveryAmount('');
    } catch (err) {
      Alert.alert('Failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveContainer = async () => {
    if (!removeReason.trim()) {
      Alert.alert('Reason required', 'Enter a reason to remove container charge.');
      return;
    }
    setLoading(true);
    try {
      await removeContainerCharge({ billId, staffId, reason: removeReason.trim() });
      onSuccess();
    } catch (err) {
      Alert.alert('Failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDelivery = async () => {
    if (!removeReason.trim()) {
      Alert.alert('Reason required', 'Enter a reason to remove delivery charge.');
      return;
    }
    setLoading(true);
    try {
      await removeDeliveryCharge({ billId, staffId, reason: removeReason.trim() });
      onSuccess();
    } catch (err) {
      Alert.alert('Failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Extras</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          <Text style={styles.sectionTitle}>Container charge</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={containerAmount}
              onChangeText={setContainerAmount}
              keyboardType="decimal-pad"
              placeholder="Amount ₹"
              placeholderTextColor="#64748B"
            />
            <Pressable
              style={({ pressed }) => [
                styles.addBtn,
                loading && styles.btnDisabled,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleAddContainer}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <Text style={styles.addBtnText}>Add</Text>
              )}
            </Pressable>
          </View>
          <Pressable
            style={({ pressed }) => [styles.removeLink, { opacity: pressed ? 0.7 : 1 }]}
            onPress={handleRemoveContainer}
            disabled={loading}
          >
            <Text style={styles.removeLinkText}>Remove container charge</Text>
          </Pressable>

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Delivery charge</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={deliveryAmount}
              onChangeText={setDeliveryAmount}
              keyboardType="decimal-pad"
              placeholder="Amount ₹"
              placeholderTextColor="#64748B"
            />
            <Pressable
              style={({ pressed }) => [
                styles.addBtn,
                loading && styles.btnDisabled,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleAddDelivery}
              disabled={loading}
            >
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          </View>
          <Pressable
            style={({ pressed }) => [styles.removeLink, { opacity: pressed ? 0.7 : 1 }]}
            onPress={handleRemoveDelivery}
            disabled={loading}
          >
            <Text style={styles.removeLinkText}>Remove delivery charge</Text>
          </Pressable>

          <Text style={styles.label}>Reason (for remove)</Text>
          <TextInput
            style={styles.input}
            value={removeReason}
            onChangeText={setRemoveReason}
            placeholder="Required to remove"
            placeholderTextColor="#64748B"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800', color: '#F8FAFC' },
  closeText: { color: '#FFD700', fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 12, color: '#94A3B8', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#334155', borderRadius: 10, padding: 14, fontSize: 16, color: '#F8FAFC' },
  addBtn: { backgroundColor: '#FFD700', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12 },
  addBtnText: { color: '#0F172A', fontWeight: '700' },
  removeLink: { marginBottom: 8 },
  removeLinkText: { color: '#F87171', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },
});
