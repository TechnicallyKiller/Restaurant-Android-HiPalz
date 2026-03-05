import React, { useState } from 'react';
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
import { mergeTables } from '../../api';
import { getErrorMessage } from '../../utils/errorHandling';
import type { Table } from '../../api/types';

interface MergeTableModalProps {
  visible: boolean;
  onClose: () => void;
  destinationTable: Table;
  tablesSameArea: Table[];
  staffId: string;
  onSuccess: () => void;
}

export default function MergeTableModal({
  visible,
  onClose,
  destinationTable,
  tablesSameArea,
  staffId,
  onSuccess,
}: MergeTableModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) {
      Alert.alert('Select tables', 'Select at least one source table to merge.');
      return;
    }
    setLoading(true);
    try {
      await mergeTables({
        destinationTableId: destinationTable.id,
        sourceTableIds: Array.from(selectedIds),
        staffId,
      });
      onSuccess();
      onClose();
      setSelectedIds(new Set());
    } catch (err) {
      Alert.alert('Merge failed', getErrorMessage(err));
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
            <Text style={styles.title}>Merge table</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.destLabel}>Into: {destinationTable.name}</Text>
          <Text style={styles.label}>Select source tables (same area)</Text>
          <ScrollView style={styles.tableList}>
            {tablesSameArea.length === 0 ? (
              <Text style={styles.empty}>No other tables in this area.</Text>
            ) : (
              tablesSameArea.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tableBtn, selectedIds.has(t.id) && styles.tableBtnActive]}
                  onPress={() => toggle(t.id)}
                >
                  <Text style={[styles.tableBtnText, selectedIds.has(t.id) && styles.tableBtnTextActive]}>{t.name}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (selectedIds.size === 0 || loading) && styles.confirmBtnDisabled,
              ]}
              onPress={handleConfirm}
              disabled={selectedIds.size === 0 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>Merge</Text>
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
  destLabel: { fontSize: 14, color: '#94A3B8', marginBottom: 12 },
  label: { fontSize: 12, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase' },
  tableList: { maxHeight: 220, marginBottom: 20 },
  empty: { color: '#64748B', padding: 16, textAlign: 'center' },
  tableBtn: {
    backgroundColor: '#334155',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  tableBtnActive: { backgroundColor: '#FFD700' },
  tableBtnText: { fontSize: 16, fontWeight: '600', color: '#F8FAFC' },
  tableBtnTextActive: { color: '#0F172A' },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#334155', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#F8FAFC', fontWeight: '600' },
  confirmBtn: { flex: 1, backgroundColor: '#FFD700', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#0F172A', fontWeight: '700' },
});
