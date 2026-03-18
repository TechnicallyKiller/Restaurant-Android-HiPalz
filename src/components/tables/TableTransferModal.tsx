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
import { transferTable } from '../../api';
import { getErrorMessage } from '../../utils/errorHandling';
import type { Table } from '../../api/types';

interface TableTransferModalProps {
  visible: boolean;
  onClose: () => void;
  fromTable: Table;
  tables: Table[];
  staffId: string;
  outletId: string;
  onSuccess: () => void;
}

export default function TableTransferModal({
  visible,
  onClose,
  fromTable,
  tables,
  staffId,
  onSuccess,
}: TableTransferModalProps) {
  const [toTableId, setToTableId] = useState<string | null>(null);
  const [reason, setReason] = useState('Table transfer');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!toTableId) {
      Alert.alert('Select table', 'Please select a destination table.');
      return;
    }
    setLoading(true);
    try {
      await transferTable({
        fromTableId: fromTable.id,
        toTableId,
        reason: reason.trim() || 'Table transfer',
        staffId,
      });
      onSuccess();
      onClose();
      setToTableId(null);
      setReason('Table transfer');
    } catch (err) {
      Alert.alert('Transfer failed', getErrorMessage(err));
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
            <Text style={styles.title}>Transfer table</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          <Text style={styles.fromLabel}>From: {fromTable.name}</Text>
          <Text style={styles.label}>Destination table</Text>
          <ScrollView style={styles.tableList} keyboardShouldPersistTaps="handled">
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
                <Text style={[styles.tableBtnText, toTableId === t.id && styles.tableBtnTextActive]}>{t.name}</Text>
                {t.tableStatus ? (
                  <Text style={styles.tableBtnStatus}>{t.tableStatus}</Text>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.label}>Reason (optional)</Text>
          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={setReason}
            placeholder="Reason"
            placeholderTextColor="#64748B"
          />
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, { opacity: pressed ? 0.7 : 1 }]}
              onPress={onClose}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                (!toTableId || loading) && styles.confirmBtnDisabled,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleConfirm}
              disabled={!toTableId || loading}
            >
              {loading ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm transfer</Text>
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
  sheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#F8FAFC' },
  closeText: { color: '#FFD700', fontWeight: '600' },
  fromLabel: { fontSize: 14, color: '#94A3B8', marginBottom: 12 },
  label: { fontSize: 12, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase' },
  tableList: { maxHeight: 200, marginBottom: 16 },
  tableBtn: {
    backgroundColor: '#334155',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  tableBtnActive: { backgroundColor: '#FFD700' },
  tableBtnText: { fontSize: 16, fontWeight: '600', color: '#F8FAFC' },
  tableBtnStatus: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  tableBtnTextActive: { color: '#0F172A' },
  input: {
    backgroundColor: '#334155',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#F8FAFC',
    marginBottom: 20,
  },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#334155', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#F8FAFC', fontWeight: '600' },
  confirmBtn: { flex: 1, backgroundColor: '#FFD700', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#0F172A', fontWeight: '700' },
});
