import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, neoCard } from '../../theme/neoBrutalism';
import type { SettledBill } from '../../api/types';

interface Props {
  bill: SettledBill;
  onView: () => void;
  onPrint: () => void;
  isSplitPart?: boolean;
  isFirstSplitPart?: boolean;
}

function statusColor(status?: string) {
  switch (status?.toUpperCase()) {
    case 'PAID': return colors.success;
    case 'CANCELLED': return colors.error;
    default: return colors.warning;
  }
}

export default function BillingHistoryRow({
  bill,
  onView,
  onPrint,
  isSplitPart,
  isFirstSplitPart,
}: Props) {
  const areaLabel = bill.areaType
    ? bill.areaType.replace(/_/g, ' ')
    : '—';
  const tableLabel = bill.tableName ? ` (${bill.tableName})` : '';
  const paymentLabel = bill.paymentMethod ?? '—';
  const isSplitPayment = paymentLabel === 'SPLIT';

  return (
    <View
      style={[
        styles.row,
        isSplitPart && styles.splitRow,
        isSplitPart && !isFirstSplitPart && styles.splitChildRow,
      ]}
    >
      {isFirstSplitPart && (
        <View style={styles.splitBadge}>
          <Text style={styles.splitBadgeText}>SPLIT</Text>
        </View>
      )}

      <View style={styles.topLine}>
        <Text style={styles.invoiceText}>
          #{bill.billInvoiceNumber ?? bill.invoiceNumber ?? '—'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor(bill.status) }]}>
          <Text style={styles.statusText}>{bill.status ?? 'UNKNOWN'}</Text>
        </View>
      </View>

      <View style={styles.infoLine}>
        <Text style={styles.infoLabel} numberOfLines={1}>
          {areaLabel}{tableLabel}
        </Text>
        <Text style={styles.infoLabel} numberOfLines={1}>
          {bill.paidByName || 'System Admin'}
        </Text>
      </View>

      <View style={styles.bottomLine}>
        <View style={styles.paymentWrap}>
          <Text style={styles.paymentText}>{paymentLabel}</Text>
          {isSplitPayment && Array.isArray(bill.splitModes) && (
            <Text style={styles.splitDetail}>
              {bill.splitModes.map(m => `${m.mode} ₹${m.amount}`).join(', ')}
            </Text>
          )}
        </View>
        <Text style={styles.totalText}>
          ₹{(bill.payable ?? bill.grandTotal ?? 0).toFixed(0)}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={onView}
        >
          <Text style={styles.actionIcon}>👁</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={onPrint}
        >
          <Text style={styles.actionIcon}>🖨</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    ...neoCard,
    padding: 14,
    marginBottom: 10,
  },
  splitRow: {
    borderLeftWidth: 5,
    borderLeftColor: colors.tertiary,
  },
  splitChildRow: {
    marginTop: -6,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  splitBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.tertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  splitBadgeText: {
    color: colors.background,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  invoiceText: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    maxWidth: '48%',
  },
  bottomLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  paymentWrap: {
    flexDirection: 'column',
  },
  paymentText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '600',
  },
  splitDetail: {
    color: colors.mutedForeground,
    fontSize: 10,
    marginTop: 2,
  },
  totalText: {
    color: colors.tertiary,
    fontSize: 18,
    fontWeight: '900',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.brutalBorder,
  },
  actionBtn: {
    padding: 6,
    backgroundColor: colors.base200,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.brutalBorder,
  },
  actionIcon: {
    fontSize: 18,
  },
});
