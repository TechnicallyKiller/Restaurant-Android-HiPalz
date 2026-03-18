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
import { transferKot } from '../../api';
import { getErrorMessage } from '../../utils/errorHandling';
import type { Kot, KotItem, Table } from '../../api/types';
import { colors, shadowBrutal, borderBrutal } from '../../theme/neoBrutalism';

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

  if (visible && !visible) { /* dummy */ }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.itemName}>
            {step === 'items' && 'Select Items'}
            {step === 'table' && 'Select Table'}
            {step === 'confirm' && 'Confirm Transfer'}
          </Text>
        </View>

        <ScrollView 
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {visible && step === 'items' && (
            <View style={styles.section}>
              <Text style={styles.label}>Items to Transfer</Text>
              <View style={styles.itemsList}>
                {flatItems.map(({ item }) => {
                  const qty = selected[item.id] ?? 0;
                  return (
                    <View key={item.id} style={styles.itemRowCard}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemRowName}>{item.name}</Text>
                        <Text style={styles.itemRowMax}>Max available: {item.quantity}</Text>
                      </View>
                      <View style={styles.qtyStepper}>
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
              </View>
            </View>
          )}

          {visible && step === 'table' && (
            <View style={styles.section}>
              <Text style={styles.label}>Destination Table</Text>
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
                    {toTableId === t.id && <View style={styles.checkIcon} />}
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {visible && step === 'confirm' && (
            <View style={styles.section}>
              <Text style={styles.label}>Transfer Summary</Text>
              <View style={styles.confirmCard}>
                <Text style={styles.confirmCount}>
                  {selectedEntries.reduce((s, i) => s + i.quantity, 0)} Items
                </Text>
                <Text style={styles.confirmTarget}>
                  Transferring to {tables.find(t => t.id === toTableId)?.name ?? 'selected table'}
                </Text>
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
          {step === 'items' && (
            <View style={styles.footerRow}>
              <Pressable style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmBtn,
                  !canGoToTable && styles.btnDisabled,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => setStep('table')}
                disabled={!canGoToTable}
              >
                <Text style={styles.confirmBtnText}>Next: Select Table</Text>
              </Pressable>
            </View>
          )}

          {step === 'table' && (
            <View style={styles.footerRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setStep('items')}>
                <Text style={styles.cancelBtnText}>Back</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmBtn,
                  !toTableId && styles.btnDisabled,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => setStep('confirm')}
                disabled={!toTableId}
              >
                <Text style={styles.confirmBtnText}>Next: Confirm</Text>
              </Pressable>
            </View>
          )}

          {step === 'confirm' && (
            <View style={styles.footerRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setStep('table')}>
                <Text style={styles.cancelBtnText}>Back</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmBtn,
                  loading && styles.btnDisabled,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm Transfer</Text>
                )}
              </Pressable>
            </View>
          )}
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
  itemName: { fontSize: 20, fontWeight: '800', color: colors.foreground, textTransform: 'uppercase', letterSpacing: 1 },
  scrollContent: { flex: 1 },
  scrollContentContainer: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  label: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: colors.mutedForeground, 
    marginBottom: 12, 
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemsList: { gap: 12 },
  itemRowCard: {
    ...borderBrutal,
    backgroundColor: colors.base200,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
  },
  itemInfo: { flex: 1, marginRight: 12 },
  itemRowName: { fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 4 },
  itemRowMax: { fontSize: 12, color: colors.mutedForeground },
  qtyStepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadowBrutal,
  },
  qtyBtnText: { fontSize: 24, fontWeight: '700', color: colors.background },
  qtyNum: { fontSize: 18, fontWeight: '800', color: colors.foreground, minWidth: 30, textAlign: 'center' },
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
    position: 'relative',
  },
  tableBtnActive: { backgroundColor: colors.tertiary, borderBottomWidth: 4, borderRightWidth: 4 },
  tableBtnText: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  tableBtnTextActive: { color: colors.background },
  checkIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.foreground,
    borderWidth: 2,
    borderColor: colors.background,
  },
  confirmCard: {
    ...borderBrutal,
    backgroundColor: colors.base200,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmCount: { fontSize: 24, fontWeight: '900', color: colors.tertiary, marginBottom: 8 },
  confirmTarget: { fontSize: 16, fontWeight: '600', color: colors.foreground },
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
