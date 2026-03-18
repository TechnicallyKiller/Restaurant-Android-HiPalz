import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, neoModal, neoCard, borderBrutal } from '../../theme/neoBrutalism';
import { printBill } from '../../api/billApi';
import type { BillPreviewData } from '../../api/types';

interface Props {
  visible: boolean;
  bill: BillPreviewData | null;
  isLoading: boolean;
  onClose: () => void;
}

const PRINT_PASSWORD = '2701';

export default function BillingHistoryDetailModal({
  visible,
  bill,
  isLoading,
  onClose,
}: Props) {
  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [printing, setPrinting] = useState(false);
  const [pwError, setPwError] = useState('');

  const handlePrintRequest = () => {
    setPassword('');
    setPwError('');
    setPwModalVisible(true);
  };

  const handlePrintConfirm = async () => {
    if (password !== PRINT_PASSWORD) {
      setPwError('Incorrect password');
      return;
    }
    if (!bill?.id) return;
    setPwModalVisible(false);
    setPrinting(true);
    try {
      await printBill(bill.id);
      Alert.alert('Print', 'Print request sent successfully.');
    } catch (err) {
      Alert.alert('Print failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Bill Details</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.tertiary} />
            </View>
          ) : !bill ? (
            <View style={styles.loading}>
              <Text style={styles.emptyText}>No bill data</Text>
            </View>
          ) : (
            <>
              <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                {/* Line items */}
                <View style={styles.section}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.thText, { flex: 2 }]}>Item</Text>
                    <Text style={[styles.thText, { flex: 0.5, textAlign: 'center' }]}>Qty</Text>
                    <Text style={[styles.thText, { flex: 1, textAlign: 'right' }]}>Rate</Text>
                    <Text style={[styles.thText, { flex: 1, textAlign: 'right' }]}>Amount</Text>
                  </View>
                  {(bill.items ?? []).map((item, i) => (
                    <View key={item.id ?? i} style={styles.itemRow}>
                      <Text style={[styles.cellText, { flex: 2 }]} numberOfLines={2}>
                        {item.itemName}
                        {item.variantName ? ` (${item.variantName})` : ''}
                      </Text>
                      <Text style={[styles.cellText, { flex: 0.5, textAlign: 'center' }]}>
                        {item.quantity}
                      </Text>
                      <Text style={[styles.cellText, { flex: 1, textAlign: 'right' }]}>
                        ₹{item.itemPrice.toFixed(0)}
                      </Text>
                      <Text style={[styles.cellText, { flex: 1, textAlign: 'right' }]}>
                        ₹{(item.itemPrice * item.quantity + (item.containerCharge ?? 0)).toFixed(0)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Summary */}
                <View style={styles.summarySection}>
                  <SummaryLine label="Subtotal" value={bill.subtotal} />
                  {bill.discountTotal > 0 && (
                    <SummaryLine label="Discount" value={-bill.discountTotal} negative />
                  )}
                  {bill.serviceCharge > 0 && (
                    <SummaryLine label="Service Charge" value={bill.serviceCharge} />
                  )}
                  {bill.containerCharge > 0 && (
                    <SummaryLine label="Container Charge" value={bill.containerCharge} />
                  )}
                  {bill.deliveryCharge > 0 && (
                    <SummaryLine label="Delivery Charge" value={bill.deliveryCharge} />
                  )}
                  <SummaryLine label="CGST" value={bill.cgstTotal} />
                  <SummaryLine label="SGST" value={bill.sgstTotal} />
                  {bill.tipTotal > 0 && (
                    <SummaryLine label="Tip" value={bill.tipTotal} />
                  )}
                  {bill.roundOff !== 0 && (
                    <SummaryLine label="Round Off" value={bill.roundOff} />
                  )}
                  <View style={styles.totalLine}>
                    <Text style={styles.totalLabel}>TOTAL</Text>
                    <Text style={styles.totalValue}>₹{bill.payable.toFixed(0)}</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.printBtn,
                    printing && styles.disabledBtn,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={handlePrintRequest}
                  disabled={printing}
                >
                  {printing ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Text style={styles.printBtnText}>🖨 Print</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Password modal */}
      <Modal visible={pwModalVisible} transparent animationType="fade">
        <View style={styles.pwOverlay}>
          <View style={styles.pwModal}>
            <Text style={styles.pwTitle}>Enter Password to Print</Text>
            <TextInput
              style={styles.pwInput}
              placeholder="Password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              value={password}
              onChangeText={v => { setPassword(v); setPwError(''); }}
              autoFocus
            />
            {pwError ? <Text style={styles.pwError}>{pwError}</Text> : null}
            <View style={styles.pwActions}>
              <Pressable
                style={({ pressed }) => [styles.pwCancelBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => setPwModalVisible(false)}
              >
                <Text style={styles.pwCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.pwConfirmBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={handlePrintConfirm}
              >
                <Text style={styles.pwConfirmText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

function SummaryLine({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, negative && { color: colors.error }]}>
        {negative ? '-' : ''}₹{Math.abs(value).toFixed(0)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    ...neoModal,
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 3,
    borderBottomColor: colors.brutalBorder,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.foreground,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  closeBtn: { padding: 8 },
  closeBtnText: { fontSize: 20, color: colors.mutedForeground, fontWeight: '800' },
  loading: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.mutedForeground },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  section: { marginBottom: 20 },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.brutalBorder,
    marginBottom: 8,
  },
  thText: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.base300,
  },
  cellText: {
    color: colors.foreground,
    fontSize: 13,
  },
  summarySection: {
    padding: 12,
    backgroundColor: colors.base200,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.brutalBorder,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    color: colors.mutedForeground,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '600',
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: colors.brutalBorder,
  },
  totalLabel: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  totalValue: {
    color: colors.tertiary,
    fontSize: 20,
    fontWeight: '900',
  },
  footer: {
    padding: 16,
    borderTopWidth: 3,
    borderTopColor: colors.brutalBorder,
  },
  printBtn: {
    backgroundColor: colors.tertiary,
    ...borderBrutal,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  printBtnText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  disabledBtn: { opacity: 0.6 },

  // Password modal
  pwOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pwModal: {
    ...neoModal,
    width: '80%',
    padding: 24,
  },
  pwTitle: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  pwInput: {
    backgroundColor: colors.base200,
    ...borderBrutal,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.foreground,
    fontSize: 16,
    marginBottom: 8,
  },
  pwError: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  pwActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  pwCancelBtn: {
    flex: 1,
    backgroundColor: colors.base300,
    ...borderBrutal,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pwCancelText: {
    color: colors.foreground,
    fontWeight: '700',
  },
  pwConfirmBtn: {
    flex: 1,
    backgroundColor: colors.tertiary,
    ...borderBrutal,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pwConfirmText: {
    color: colors.background,
    fontWeight: '700',
  },
});
