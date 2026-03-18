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
import { splitBillByPercentage, splitBillByItemWise } from '../../api';
import { getErrorMessage } from '../../utils/errorHandling';
import type { BillPreviewData } from '../../api/types';

type Tab = 'percentage' | 'items';

interface SplitBillModalProps {
  visible: boolean;
  onClose: () => void;
  bill: BillPreviewData;
  staffId: string;
  onSuccess: () => void;
}

export default function SplitBillModal({
  visible,
  onClose,
  bill,
  staffId,
  onSuccess,
}: SplitBillModalProps) {
  const [tab, setTab] = useState<Tab>('percentage');
  const [variantCount, setVariantCount] = useState(2);
  const [percentages, setPercentages] = useState<number[]>([50, 50]);
  const [itemAssignments, setItemAssignments] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const billId = bill.id ?? '';
  const items = bill.items ?? [];

  useEffect(() => {
    if (visible && items.length) {
      setItemAssignments(items.map(() => 0));
    }
  }, [visible, items.length]);

  const totalPct = percentages.reduce((a, b) => a + b, 0);
  const validPct = Math.abs(totalPct - 100) < 0.01;
  const byItemsValid = () => {
    const counts = new Array(variantCount).fill(0);
    itemAssignments.forEach(s => {
      if (s >= 0 && s < variantCount) counts[s]++;
    });
    return counts.every(c => c > 0) && itemAssignments.length === items.length;
  };

  const handleSplitByPercentage = async () => {
    if (!validPct || variantCount !== percentages.length) return;
    setLoading(true);
    try {
      await splitBillByPercentage({
        billId,
        variantCount,
        variants: percentages.map(p => ({ percentage: p })),
      });
      onSuccess();
      onClose();
    } catch (err) {
      Alert.alert('Split failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSplitByItems = async () => {
    if (!byItemsValid()) {
      Alert.alert('Invalid split', 'Each split must have at least one item.');
      return;
    }
    const variants: { billItemIds: string[] }[] = Array.from({ length: variantCount }, () => ({ billItemIds: [] }));
    itemAssignments.forEach((splitIdx, i) => {
      const itemId = items[i]?.id;
      if (itemId && splitIdx >= 0 && splitIdx < variantCount) {
        variants[splitIdx].billItemIds.push(itemId);
      }
    });
    setLoading(true);
    try {
      await splitBillByItemWise({ billId, variantCount, variants });
      onSuccess();
      onClose();
    } catch (err) {
      Alert.alert('Split failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const setVariantCountAndReset = (n: number) => {
    const clamped = Math.max(2, Math.min(50, n));
    setVariantCount(clamped);
    setPercentages(Array(clamped).fill(0).map(() => Math.round(100 / clamped)));
    setItemAssignments(items.map(() => 0));
  };

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Split bill</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>

          <View style={styles.tabRow}>
            <Pressable
              style={({ pressed }) => [
                styles.tabBtn,
                tab === 'percentage' && styles.tabBtnActive,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => setTab('percentage')}
            >
              <Text style={styles.tabBtnText}>By percentage</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.tabBtn,
                tab === 'items' && styles.tabBtnActive,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => setTab('items')}
            >
              <Text style={styles.tabBtnText}>By items</Text>
            </Pressable>
          </View>

          {tab === 'percentage' && (
            <>
              <Text style={styles.label}>Number of splits (2–50)</Text>
              <TextInput
                style={styles.input}
                value={String(variantCount)}
                onChangeText={t => setVariantCountAndReset(parseInt(t, 10) || 2)}
                keyboardType="number-pad"
              />
              <Text style={styles.label}>Percentages (must total 100)</Text>
              <ScrollView style={styles.percentList}>
                {percentages.map((p, i) => (
                  <View key={i} style={styles.percentRow}>
                    <Text style={styles.percentLabel}>Split {i + 1}</Text>
                    <TextInput
                      style={styles.percentInput}
                      value={String(p)}
                      onChangeText={t => {
                        const v = parseFloat(t) || 0;
                        setPercentages(prev => {
                          const next = [...prev];
                          next[i] = Math.max(0, Math.min(100, v));
                          return next;
                        });
                      }}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.percentUnit}>%</Text>
                  </View>
                ))}
              </ScrollView>
              <Text style={[styles.hint, !validPct && styles.hintError]}>
                Total: {totalPct.toFixed(1)}%
              </Text>
               <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  (!validPct || loading) && styles.btnDisabled,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleSplitByPercentage}
                disabled={!validPct || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#0F172A" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Split by percentage</Text>
                )}
              </Pressable>
            </>
          )}

          {tab === 'items' && (
            <>
              <Text style={styles.label}>Number of splits (2–50)</Text>
              <TextInput
                style={styles.input}
                value={String(variantCount)}
                onChangeText={t => setVariantCountAndReset(parseInt(t, 10) || 2)}
                keyboardType="number-pad"
              />
              <Text style={styles.label}>Assign each item to a split</Text>
              <ScrollView style={styles.itemList}>
                {items.map((item, i) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.itemName} × {item.quantity}</Text>
                    <View style={styles.splitPicker}>
                      {Array.from({ length: variantCount }, (_, s) => (
                        <Pressable
                          key={s}
                          style={({ pressed }) => [
                            styles.splitOpt,
                            (itemAssignments[i] ?? 0) === s && styles.splitOptActive,
                            { opacity: pressed ? 0.7 : 1 },
                          ]}
                          onPress={() => {
                            setItemAssignments(prev => {
                              const next = [...prev];
                              next[i] = s;
                              return next;
                            });
                          }}
                        >
                          <Text style={styles.splitOptText}>{s + 1}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  (!byItemsValid() || loading) && styles.btnDisabled,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleSplitByItems}
                disabled={!byItemsValid() || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#0F172A" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Split by items</Text>
                )}
              </Pressable>
            </>
          )}

          <Pressable
            style={({ pressed }) => [styles.cancelBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={onClose}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#F8FAFC' },
  closeText: { color: '#FFD700', fontWeight: '600' },
  tabRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  tabBtn: { flex: 1, backgroundColor: '#334155', padding: 12, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#FFD700' },
  tabBtnText: { color: '#F8FAFC', fontWeight: '600' },
  label: { fontSize: 12, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#334155', borderRadius: 10, padding: 14, fontSize: 16, color: '#F8FAFC', marginBottom: 12 },
  percentList: { maxHeight: 180, marginBottom: 8 },
  percentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  percentLabel: { width: 70, color: '#F8FAFC', fontSize: 14 },
  percentInput: { width: 60, backgroundColor: '#334155', borderRadius: 8, padding: 8, fontSize: 14, color: '#F8FAFC' },
  percentUnit: { marginLeft: 4, color: '#94A3B8' },
  hint: { fontSize: 12, color: '#94A3B8', marginBottom: 12 },
  hintError: { color: '#F87171' },
  itemList: { maxHeight: 220, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  itemName: { flex: 1, color: '#F8FAFC', fontSize: 14 },
  splitPicker: { flexDirection: 'row', gap: 6 },
  splitOpt: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  splitOptActive: { backgroundColor: '#FFD700' },
  splitOptText: { color: '#F8FAFC', fontWeight: '700', fontSize: 12 },
  primaryBtn: { backgroundColor: '#FFD700', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { color: '#0F172A', fontWeight: '700' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#94A3B8' },
  btnDisabled: { opacity: 0.6 },
});
