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
  SafeAreaView,
} from 'react-native';
import { transferTable } from '../../api';
import { getErrorMessage } from '../../utils/errorHandling';
import type { Table } from '../../api/types';
import { colors, borderBrutal, shadowBrutal } from '../../theme/neoBrutalism';

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

  if (visible && !visible) { /* dummy */ }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.modalTitle}>Transfer Table</Text>
        </View>

        <ScrollView 
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {visible && (
            <View style={styles.section}>
              <View style={styles.sourceCard}>
                <Text style={styles.sourceLabel}>Transferring from</Text>
                <Text style={styles.sourceName}>{fromTable.name}</Text>
              </View>

              <Text style={styles.label}>Select Destination Table</Text>
              <View style={styles.tablesGrid}>
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
                    <Text style={[styles.tableBtnText, toTableId === t.id && styles.tableBtnTextActive]}>
                      {t.name}
                    </Text>
                    {t.tableStatus ? (
                      <Text style={[styles.tableBtnStatus, toTableId === t.id && styles.tableBtnStatusActive]}>
                        {t.tableStatus}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 24 }]}>Reason (Optional)</Text>
              <TextInput
                style={styles.reasonInput}
                value={reason}
                onChangeText={setReason}
                placeholder="Enter reason for transfer"
                placeholderTextColor="#64748B"
                multiline
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                (!toTableId || loading) && styles.btnDisabled,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleConfirm}
              disabled={!toTableId || loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm Transfer</Text>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.background },
  headerRow: { 
    padding: 20, 
    borderBottomWidth: 3, 
    borderBottomColor: colors.brutalBorder,
    backgroundColor: colors.base100,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.foreground, textTransform: 'uppercase', letterSpacing: 1 },
  scrollContent: { flex: 1 },
  scrollContentContainer: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sourceCard: {
    ...borderBrutal,
    backgroundColor: colors.base200,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  sourceLabel: { fontSize: 12, fontWeight: '800', color: colors.mutedForeground, textTransform: 'uppercase', marginBottom: 4 },
  sourceName: { fontSize: 22, fontWeight: '900', color: colors.tertiary },
  label: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: colors.mutedForeground, 
    marginBottom: 12, 
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tablesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tableBtn: {
    ...borderBrutal,
    backgroundColor: colors.base200,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: '30%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableBtnActive: { backgroundColor: colors.tertiary, borderBottomWidth: 4, borderRightWidth: 4 },
  tableBtnText: { fontSize: 16, fontWeight: '700', color: colors.foreground },
  tableBtnTextActive: { color: colors.background },
  tableBtnStatus: { fontSize: 11, color: colors.mutedForeground, marginTop: 4, fontWeight: '600' },
  tableBtnStatusActive: { color: colors.background, opacity: 0.8 },
  reasonInput: {
    ...borderBrutal,
    backgroundColor: colors.base200,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.foreground,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 3,
    borderTopColor: colors.brutalBorder,
    backgroundColor: colors.base100,
    ...shadowBrutal,
  },
  footerRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.base200,
    ...borderBrutal,
  },
  cancelBtnText: { fontSize: 16, fontWeight: '700', color: colors.foreground },
  confirmBtn: {
    flex: 2,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tertiary,
    ...borderBrutal,
    ...shadowBrutal,
  },
  confirmBtnText: { fontSize: 16, fontWeight: '800', color: colors.background, textTransform: 'uppercase' },
  btnDisabled: { opacity: 0.5 },
});
