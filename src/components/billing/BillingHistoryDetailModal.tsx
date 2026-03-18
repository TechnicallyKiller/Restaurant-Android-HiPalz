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
import {
  colors,
  neoModal,
  neoCard,
  borderBrutal,
} from '../../theme/neoBrutalism';
import { printBill } from '../../api/billApi';
import type { BillPreviewData } from '../../api/types';

interface Props {
  visible: boolean;
  bill: BillPreviewData | null;
  isLoading: boolean;
  onClose: () => void;
}

const PRINT_PASSWORD = 'admin2701';

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
      Alert.alert(
        'Print failed',
        err instanceof Error ? err.message : 'Unknown error',
      );
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
              style={({ pressed }) => [
                styles.closeBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
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
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Outlet Header */}
                <View style={styles.outletHeader}>
                  <Text style={styles.businessName}>
                    {bill.businessName || bill.outletName || 'Hipalz Cafe'}
                  </Text>
                  <Text style={styles.outletAddress}>
                    {bill.outletAddress || '—'}
                  </Text>
                  <View style={styles.badgeRow}>
                    {bill.outletGstNumber && (
                      <View style={styles.miniBadge}>
                        <Text style={styles.miniBadgeText}>
                          GST: {bill.outletGstNumber}
                        </Text>
                      </View>
                    )}
                    {bill.outletFssaiNumber && (
                      <View style={styles.miniBadge}>
                        <Text style={styles.miniBadgeText}>
                          FSSAI: {bill.outletFssaiNumber}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Section 1: Staff & Table */}
                <View style={styles.infoSection}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoRowLabel}>Table</Text>
                    <Text style={styles.infoRowValue}>
                      {bill.tableName || '—'}
                    </Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoRowLabel}>Captain</Text>
                    <Text style={styles.infoRowValue}>
                      {bill.captainName || '—'}
                    </Text>
                    {bill.captainPhone && (
                      <Text style={styles.infoSubValue}>
                        {bill.captainPhone}
                      </Text>
                    )}
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoRowLabel}>User</Text>
                    <Text style={styles.infoRowValue}>
                      {bill.userName || '—'}
                    </Text>
                    {bill.userPhone && (
                      <Text style={styles.infoSubValue}>{bill.userPhone}</Text>
                    )}
                  </View>
                </View>

                {/* Section 2: Bill Context */}
                <View style={styles.infoSection}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoRowLabel}>Date</Text>
                    <Text style={styles.infoRowValue}>
                      {new Date(bill.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.infoSubValue}>
                      {new Date(bill.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoRowLabel}>Payment / Status</Text>
                    <Text style={styles.infoRowValue}>
                      {bill.paymentMethod || '—'}
                    </Text>
                    <Text
                      style={[
                        styles.infoSubValue,
                        {
                          color:
                            bill.status === 'PAID'
                              ? colors.success
                              : colors.warning,
                        },
                      ]}
                    >
                      {bill.status}
                    </Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoRowLabel}>PAX</Text>
                    <Text style={styles.infoRowValue}>
                      {bill.paxCount || 1}
                    </Text>
                  </View>
                </View>

                {/* IDs Section */}
                <View style={styles.idsSection}>
                  <Text style={styles.idText}>
                    Invoice: #{bill.billInvoiceNumber} ({bill.invoiceNumber})
                  </Text>
                  <Text style={styles.idText}>Order ID: {bill.orderId}</Text>
                </View>

                {/* Line items */}
                <View style={[styles.section, { marginTop: 16 }]}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.thText, { flex: 2 }]}>Item</Text>
                    <Text
                      style={[
                        styles.thText,
                        { flex: 0.5, textAlign: 'center' },
                      ]}
                    >
                      Qty
                    </Text>
                    <Text
                      style={[styles.thText, { flex: 1, textAlign: 'right' }]}
                    >
                      Amount
                    </Text>
                  </View>
                  {(bill.items ?? []).map((item, i) => (
                    <View key={item.id ?? i} style={styles.itemRow}>
                      <View style={{ flex: 2 }}>
                        <Text style={styles.cellText}>
                          {item.itemName || item.name}
                          {item.variantName ? ` (${item.variantName})` : ''}
                        </Text>
                        {item.itemDiscountsTotal !== undefined &&
                          item.itemDiscountsTotal > 0 && (
                            <Text style={styles.itemDiscount}>
                              Disc: -₹{item.itemDiscountsTotal}
                            </Text>
                          )}
                      </View>
                      <Text
                        style={[
                          styles.cellText,
                          { flex: 0.5, textAlign: 'center' },
                        ]}
                      >
                        {item.quantity}
                      </Text>
                      <Text
                        style={[
                          styles.cellText,
                          { flex: 1, textAlign: 'right' },
                        ]}
                      >
                        ₹
                        {(
                          item.itemPrice * item.quantity +
                          (item.containerCharge ?? 0)
                        ).toFixed(0)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Financial Summary */}
                <View style={styles.summarySection}>
                  <SummaryLine
                    label="Subtotal (Taxable)"
                    value={bill.subtotal}
                  />

                  {(bill.totalDiscount || 0) > 0 && (
                    <SummaryLine
                      label="Total Discount"
                      value={-(bill.totalDiscount || 0)}
                      negative
                    />
                  )}

                  <View style={styles.divider} />

                  {bill.categoryTaxMap &&
                    Object.entries(bill.categoryTaxMap).map(
                      ([taxName, amount]) => (
                        <SummaryLine
                          key={taxName}
                          label={taxName}
                          value={amount}
                        />
                      ),
                    )}

                  <SummaryLine label="Total Tax" value={bill.totalTax} />

                  <View style={styles.divider} />

                  {bill.serviceCharge > 0 && (
                    <SummaryLine
                      label="Service Charge"
                      value={bill.serviceCharge}
                    />
                  )}
                  {bill.containerCharge > 0 && (
                    <SummaryLine
                      label="Container Charge"
                      value={bill.containerCharge}
                    />
                  )}
                  {bill.deliveryCharge > 0 && (
                    <SummaryLine
                      label="Delivery Charge"
                      value={bill.deliveryCharge}
                    />
                  )}
                  {bill.tipTotal > 0 && (
                    <SummaryLine label="Tip" value={bill.tipTotal} />
                  )}
                  {bill.roundOff !== 0 && (
                    <SummaryLine label="Round Off" value={bill.roundOff} />
                  )}

                  <View style={styles.totalLine}>
                    <Text style={styles.totalLabel}>Grand Total</Text>
                    <Text style={styles.totalValue}>
                      ₹{bill.payable.toFixed(0)}
                    </Text>
                  </View>
                </View>

                {bill.syncStatus && (
                  <Text style={styles.syncStatus}>
                    Sync Status: {bill.syncStatus}
                  </Text>
                )}
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
              onChangeText={v => {
                setPassword(v);
                setPwError('');
              }}
              autoFocus
            />
            {pwError ? <Text style={styles.pwError}>{pwError}</Text> : null}
            <View style={styles.pwActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.pwCancelBtn,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => setPwModalVisible(false)}
              >
                <Text style={styles.pwCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.pwConfirmBtn,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
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

function SummaryLine({
  label,
  value,
  negative,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
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
    height: '100%',
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
  closeBtnText: {
    fontSize: 20,
    color: colors.mutedForeground,
    fontWeight: '800',
  },
  loading: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.mutedForeground },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoRowLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRowValue: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  taxTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.mutedForeground,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.brutalBorder,
    opacity: 0.3,
    marginVertical: 4,
  },
  section: { marginBottom: 20 },
  outletHeader: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: colors.base200,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.brutalBorder,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.foreground,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  outletAddress: {
    fontSize: 11,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 15,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  miniBadge: {
    backgroundColor: colors.base300,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.mutedForeground,
  },
  infoSubValue: {
    fontSize: 10,
    color: colors.mutedForeground,
    fontWeight: '600',
  },
  idsSection: {
    backgroundColor: colors.base100,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.tertiary,
    marginBottom: 8,
  },
  idText: {
    fontSize: 10,
    color: colors.mutedForeground,
    fontFamily: 'space-mono',
  },
  itemDiscount: {
    fontSize: 10,
    color: colors.error,
    fontWeight: '600',
  },
  syncStatus: {
    fontSize: 9,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
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
