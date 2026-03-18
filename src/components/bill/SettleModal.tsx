import React, { useState, useEffect } from 'react';
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
import { payBill, settleSplit } from '../../api';
import { getErrorMessage } from '../../utils/errorHandling';
import type { BillPayModeBackend } from '../../api/types';
import type { PaymentModeItem } from '../../api/types';

type Step = 'select' | 'split' | 'confirm';

type SplitSettleMode = 'CASH' | 'CARD' | 'UPI' | 'WALLET' | 'OTHER';

interface SplitRow {
  mode: string;
  amount: number;
}

interface SettleModalProps {
  visible: boolean;
  onClose: () => void;
  billId: string;
  payableAmount: number;
  staffId: string;
  modes: PaymentModeItem[];
  /** When true, single payment uses POST /r/dine-in/bill/split/settle and onSettled(allPaid) */
  isSplitVariant?: boolean;
  onSettled?: (allPaid?: boolean) => void;
}

const SPLIT_MODES_EXCLUDE = ['SPLIT', 'COMPLEMENTARY', 'DUES', 'NPC'];

const UI_MODE_TO_SPLIT_SETTLE: Record<string, SplitSettleMode> = {
  CASH: 'CASH',
  CARD: 'CARD',
  CARD_MACHINE: 'CARD',
  UPI: 'UPI',
  UPI_MACHINE: 'UPI',
  WALLET: 'WALLET',
  OTHER: 'OTHER',
};

export default function SettleModal({
  visible,
  onClose,
  billId,
  payableAmount,
  staffId,
  modes,
  isSplitVariant = false,
  onSettled,
}: SettleModalProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedMode, setSelectedMode] = useState<BillPayModeBackend | null>(null);
  const [splitRows, setSplitRows] = useState<SplitRow[]>([]);
  const [paying, setPaying] = useState(false);
  const [splitError, setSplitError] = useState<string | null>(null);

  const payable = Math.round(payableAmount * 100) / 100;
  const selectableModes = modes.filter(m => !SPLIT_MODES_EXCLUDE.includes(m.name));

  useEffect(() => {
    if (visible) {
      setStep('select');
      setSelectedMode(null);
      const half = Math.round((payable / 2) * 100) / 100;
      const second = Math.round((payable - half) * 100) / 100;
      const firstMode = selectableModes[0]?.name ?? 'CASH';
      const secondMode = selectableModes[1]?.name ?? selectableModes[0]?.name ?? 'UPI';
      setSplitRows([
        { mode: firstMode, amount: half },
        { mode: secondMode, amount: second },
      ]);
      setSplitError(null);
    }
  }, [visible, payable]);

  const splitTotal = splitRows.reduce((s, r) => s + r.amount, 0);
  const splitTotalValid = Math.abs(splitTotal - payable) < 0.02;
  const splitPayload = splitRows
    .filter(r => r.amount > 0)
    .map(r => ({ mode: r.mode, amount: Math.round(r.amount * 100) / 100 }));

  const handleSinglePay = async () => {
    if (!selectedMode) return;
    setPaying(true);
    try {
      if (isSplitVariant) {
        const settleMode = UI_MODE_TO_SPLIT_SETTLE[selectedMode] ?? 'CASH';
        const result = await settleSplit({
          splitBillId: billId,
          staffId,
          mode: settleMode,
        });
        onClose();
        onSettled?.(result.allPaid);
      } else {
        await payBill({ billId, mode: selectedMode, staffId });
        onClose();
        onSettled?.();
      }
    } catch (err) {
      Alert.alert('Payment failed', getErrorMessage(err));
    } finally {
      setPaying(false);
    }
  };

  const handleSplitPay = async () => {
    if (splitPayload.length === 0 || !splitTotalValid) return;
    setSplitError(null);
    setPaying(true);
    try {
      await payBill({
        billId,
        mode: 'SPLIT',
        staffId,
        splitModes: splitPayload,
      });
      onClose();
      onSettled?.();
    } catch (err) {
      setSplitError(getErrorMessage(err));
    } finally {
      setPaying(false);
    }
  };

  const updateSplitRow = (index: number, updates: Partial<SplitRow>) => {
    setSplitRows(prev => {
      const next = prev.map((r, i) => (i === index ? { ...r, ...updates } : r));
      if (prev.length === 2 && typeof updates.amount === 'number') {
        const other = index === 0 ? 1 : 0;
        const otherAmount = Math.round((payable - updates.amount) * 100) / 100;
        next[other] = { ...next[other], amount: Math.max(0, otherAmount) };
      }
      return next;
    });
  };

  const addSplitRow = () => {
    const firstAvailable = selectableModes.find(m => !splitRows.some(r => r.mode === m.name))?.name ?? selectableModes[0]?.name ?? 'CASH';
    setSplitRows(prev => [...prev, { mode: firstAvailable, amount: 0 }]);
  };

  const removeSplitRow = (index: number) => {
    if (splitRows.length <= 1) return;
    setSplitRows(prev => prev.filter((_, i) => i !== index));
  };

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {step === 'select' && (
            <>
              <Text style={styles.title}>Settle — ₹{payable.toFixed(2)}</Text>
              <Pressable
                style={({ pressed }) => [styles.splitPaymentBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => setStep('split')}
              >
                <Text style={styles.splitPaymentBtnText}>Split payment</Text>
              </Pressable>
              <Text style={styles.orLabel}>Or select a single mode</Text>
              <ScrollView style={styles.modesList}>
                {selectableModes.map(m => (
                  <Pressable
                    key={m.id}
                    style={({ pressed }) => [
                      styles.modeBtn,
                      selectedMode === m.name && styles.modeBtnActive,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={() => setSelectedMode(m.name as BillPayModeBackend)}
                  >
                    <Text style={styles.modeBtnText}>{m.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
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
                    (!selectedMode || paying) && styles.btnDisabled,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => selectedMode && setStep('confirm')}
                  disabled={!selectedMode || paying}
                >
                  <Text style={styles.confirmBtnText}>Next</Text>
                </Pressable>
              </View>
            </>
          )}

          {step === 'confirm' && selectedMode && (
            <>
              <Text style={styles.title}>Confirm pay</Text>
              <Text style={styles.confirmText}>
                Pay ₹{payable.toFixed(2)} with {selectedMode}?
              </Text>
              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [styles.cancelBtn, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => setStep('select')}
                >
                  <Text style={styles.cancelBtnText}>Back</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.confirmBtn,
                    paying && styles.btnDisabled,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={handleSinglePay}
                  disabled={paying}
                >
                  {paying ? (
                    <ActivityIndicator color="#0F172A" size="small" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Confirm pay</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}

          {step === 'split' && (
            <>
              <Text style={styles.title}>Split payment — ₹{payable.toFixed(2)}</Text>
              <Text style={styles.hint}>Allocate amounts per mode. Total must equal payable.</Text>
              {splitError ? <Text style={styles.errorText}>{splitError}</Text> : null}
              <ScrollView style={styles.splitList}>
                {splitRows.map((row, i) => (
                  <View key={i} style={styles.splitRow}>
                    <ScrollView horizontal style={styles.modePicker} showsHorizontalScrollIndicator={false}>
                      {selectableModes.map(m => (
                        <Pressable
                          key={m.id}
                          style={({ pressed }) => [
                            styles.modeChip,
                            row.mode === m.name && styles.modeChipActive,
                            { opacity: pressed ? 0.7 : 1 },
                          ]}
                          onPress={() => updateSplitRow(i, { mode: m.name })}
                        >
                          <Text style={styles.modeChipText}>{m.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                    <TextInput
                      style={styles.amountInput}
                      value={row.amount > 0 ? String(row.amount) : ''}
                      onChangeText={t => {
                        const v = parseFloat(t.replace(/,/g, '.')) || 0;
                        updateSplitRow(i, { amount: Math.max(0, v) });
                      }}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#64748B"
                    />
                    {splitRows.length > 1 && (
                      <Pressable
                        style={({ pressed }) => [styles.removeRowBtn, { opacity: pressed ? 0.7 : 1 }]}
                        onPress={() => removeSplitRow(i)}
                      >
                        <Text style={styles.removeRowText}>−</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </ScrollView>
              <Pressable
                style={({ pressed }) => [styles.addRowBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={addSplitRow}
              >
                <Text style={styles.addRowText}>+ Add allocation</Text>
              </Pressable>
              <Text style={[styles.totalLine, !splitTotalValid && styles.totalLineError]}>
                Total: ₹{splitTotal.toFixed(2)} {!splitTotalValid && `(must be ₹${payable.toFixed(2)})`}
              </Text>
              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [styles.cancelBtn, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => setStep('select')}
                >
                  <Text style={styles.cancelBtnText}>Back</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.confirmBtn,
                    (!splitTotalValid || splitPayload.length === 0 || paying) && styles.btnDisabled,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={handleSplitPay}
                  disabled={!splitTotalValid || splitPayload.length === 0 || paying}
                >
                  {paying ? (
                    <Text style={styles.confirmBtnText}>Settling…</Text>
                  ) : (
                    <Text style={styles.confirmBtnText}>Confirm split</Text>
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
  sheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    height: '92%',
    maxHeight: '92%',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#F8FAFC', marginBottom: 16 },
  splitPaymentBtn: { backgroundColor: '#334155', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  splitPaymentBtnText: { color: '#FFD700', fontWeight: '700' },
  orLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 8 },
  modesList: { maxHeight: 180, marginBottom: 16 },
  modeBtn: { backgroundColor: '#334155', padding: 16, borderRadius: 12, marginBottom: 8 },
  modeBtnActive: { backgroundColor: '#FFD700' },
  modeBtnText: { color: '#F8FAFC', fontWeight: '600' },
  confirmText: { color: '#94A3B8', marginBottom: 20 },
  hint: { fontSize: 12, color: '#94A3B8', marginBottom: 12 },
  errorText: { fontSize: 12, color: '#F87171', marginBottom: 8 },
  splitList: { maxHeight: 220, marginBottom: 8 },
  splitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  modePicker: { maxWidth: 160, marginRight: 8 },
  modeChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#334155', marginRight: 6 },
  modeChipActive: { backgroundColor: '#FFD700' },
  modeChipText: { color: '#F8FAFC', fontSize: 12, fontWeight: '600' },
  amountInput: { width: 90, backgroundColor: '#334155', borderRadius: 8, padding: 10, fontSize: 14, color: '#F8FAFC' },
  removeRowBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#475569', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  removeRowText: { color: '#FFF', fontWeight: '700', fontSize: 18 },
  addRowBtn: { paddingVertical: 10, marginBottom: 8 },
  addRowText: { color: '#FFD700', fontSize: 14, fontWeight: '600' },
  totalLine: { fontSize: 14, color: '#94A3B8', marginBottom: 16 },
  totalLineError: { color: '#F87171' },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#334155', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#F8FAFC', fontWeight: '600' },
  confirmBtn: { flex: 1, backgroundColor: '#FFD700', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#0F172A', fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
