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
  SafeAreaView,
} from 'react-native';
import { payBill, settleSplit } from '../../api';
import { getErrorMessage } from '../../utils/errorHandling';
import type { BillPayModeBackend, PaymentModeItem } from '../../api/types';
import { colors, borderBrutal, shadowBrutal } from '../../theme/neoBrutalism';

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

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.itemName}>Settle Bill</Text>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {visible && step === 'select' && (
            <View style={styles.section}>
              <Text style={styles.payableDisplay}>₹{payable.toFixed(2)}</Text>
              
              <Pressable
                style={({ pressed }) => [styles.splitPaymentBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => setStep('split')}
              >
                <Text style={styles.splitPaymentBtnText}>Split Payment</Text>
              </Pressable>

              <Text style={styles.label}>Select Payment Mode</Text>
              <View style={styles.modesContainer}>
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
                    <Text style={[styles.modeBtnText, selectedMode === m.name && styles.modeBtnTextActive]}>
                      {m.name}
                    </Text>
                    {selectedMode === m.name && <View style={styles.checkIcon} />}
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {visible && step === 'confirm' && selectedMode && (
            <View style={styles.section}>
              <Text style={styles.label}>Confirm Payment</Text>
              <View style={styles.confirmCard}>
                <Text style={styles.confirmAmount}>₹{payable.toFixed(2)}</Text>
                <Text style={styles.confirmDetail}>Will be paid via {selectedMode}</Text>
              </View>
            </View>
          )}

          {visible && step === 'split' && (
            <View style={styles.section}>
              <View style={styles.splitHeader}>
                <Text style={styles.label}>Split Allocation</Text>
                <Text style={styles.payableSub}>Payable: ₹{payable.toFixed(2)}</Text>
              </View>
              
              {splitError ? <View style={styles.errorBox}><Text style={styles.errorText}>{splitError}</Text></View> : null}
              
              <View style={styles.splitList}>
                {splitRows.map((row, i) => (
                  <View key={i} style={styles.splitRowCard}>
                    <View style={styles.splitRowHeader}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modePicker}>
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
                            <Text style={[styles.modeChipText, row.mode === m.name && styles.modeChipTextActive]}>
                              {m.name}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                      {splitRows.length > 1 && (
                        <Pressable
                          style={styles.removeRowBtn}
                          onPress={() => removeSplitRow(i)}
                          hitSlop={10}
                        >
                          <Text style={styles.removeRowText}>✕</Text>
                        </Pressable>
                      )}
                    </View>
                    <View style={styles.amountInputRow}>
                      <Text style={styles.currencyPrefix}>₹</Text>
                      <TextInput
                        style={styles.amountInput}
                        value={row.amount > 0 ? String(row.amount) : ''}
                        onChangeText={t => {
                          const v = parseFloat(t.replace(/,/g, '.')) || 0;
                          updateSplitRow(i, { amount: Math.max(0, v) });
                        }}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor="#64748B"
                      />
                    </View>
                  </View>
                ))}
              </View>

              <Pressable
                style={({ pressed }) => [styles.addRowBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={addSplitRow}
              >
                <Text style={styles.addRowText}>+ Add Mode</Text>
              </Pressable>

              <View style={[styles.totalCard, !splitTotalValid && styles.totalCardError]}>
                <Text style={styles.totalCardLabel}>Total Allocated</Text>
                <Text style={[styles.totalCardValue, !splitTotalValid && styles.totalCardValueError]}>
                  ₹{splitTotal.toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step === 'select' && (
            <View style={styles.footerRow}>
              <Pressable style={styles.cancelBtn} onPress={onClose}>
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
          )}

          {step === 'confirm' && (
            <View style={styles.footerRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setStep('select')}>
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
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm Settle</Text>
                )}
              </Pressable>
            </View>
          )}

          {step === 'split' && (
            <View style={styles.footerRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setStep('select')}>
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
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm Split</Text>
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
  sheet: {
    backgroundColor: '#0F172A',
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  itemName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  payableDisplay: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.tertiary,
    textAlign: 'center',
    marginVertical: 30,
  },
  splitPaymentBtn: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#334155',
  },
  splitPaymentBtnText: {
    color: colors.tertiary,
    fontWeight: '800',
    fontSize: 16,
  },
  label: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modeBtn: {
    width: '47%',
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#2A3A4A',
    borderColor: '#475569',
    borderWidth: 2,
  },
  modeBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  modeBtnTextActive: {
    color: colors.tertiary,
  },
  checkIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tertiary,
  },
  confirmCard: {
    backgroundColor: '#1E293B',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    ...shadowBrutal,
  },
  confirmAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.tertiary,
    marginBottom: 8,
  },
  confirmDetail: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  payableSub: {
    fontSize: 14,
    color: colors.tertiary,
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
  },
  splitList: {
    marginBottom: 10,
  },
  splitRowCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  splitRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  modePicker: {
    flex: 1,
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#334155',
    borderRadius: 8,
    marginRight: 8,
  },
  modeChipActive: {
    backgroundColor: colors.tertiary,
  },
  modeChipText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modeChipTextActive: {
    color: '#000',
  },
  removeRowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeRowText: {
    color: '#FFF',
    fontWeight: '900',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  currencyPrefix: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '800',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    height: 54,
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  addRowBtn: {
    padding: 16,
    alignItems: 'center',
  },
  addRowText: {
    color: colors.tertiary,
    fontSize: 15,
    fontWeight: '800',
  },
  totalCard: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  totalCardError: {
    borderColor: '#F87171',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  totalCardLabel: {
    color: '#94A3B8',
    fontWeight: '800',
    textTransform: 'uppercase',
    fontSize: 12,
  },
  totalCardValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
  },
  totalCardValueError: {
    color: '#F87171',
  },
  footer: {
    padding: 20,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 18,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontWeight: '800',
    fontSize: 16,
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 18,
    backgroundColor: colors.tertiary,
    borderRadius: 14,
    alignItems: 'center',
    ...shadowBrutal,
  },
  confirmBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
    textTransform: 'uppercase',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
