import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { BillPreviewData } from '../../api/types';

export interface BillSummaryProps {
  /** Bill data; uses discountTotal ?? totalDiscount for discount */
  data: BillPreviewData;
  /** When set, bill is modifiable and remove buttons are shown when callbacks are provided */
  billId?: string;
  onRemoveDiscountClick?: () => void;
  onRemoveServiceChargeClick?: () => void;
  onRemoveTipClick?: () => void;
  onRemoveContainerChargeClick?: () => void;
  onRemoveDeliveryChargeClick?: () => void;
  /** Show "Add tip" button below summary when no tip and modifiable */
  onAddTipClick?: () => void;
  showAddTipButton?: boolean;
}

function formatRupee(value: number): string {
  return `₹${value.toFixed(2)}`;
}

export default function BillSummary({
  data,
  billId,
  onRemoveDiscountClick,
  onRemoveServiceChargeClick,
  onRemoveTipClick,
  onRemoveContainerChargeClick,
  onRemoveDeliveryChargeClick,
  onAddTipClick,
  showAddTipButton = true,
}: BillSummaryProps) {
  const modifiable = Boolean(billId ?? data.id);
  const discountValue = data.discountTotal ?? data.totalDiscount ?? 0;
  const showTaxRow = data.totalTax > 0 && !(data.cgstTotal !== 0 || data.sgstTotal !== 0);

  const renderRow = (
    label: string,
    value: string,
    options?: { removable?: boolean; onRemove?: () => void; valueStyle?: object }
  ) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, options?.valueStyle]}>{value}</Text>
        {options?.removable && modifiable && options?.onRemove && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={options.onRemove}
            accessibilityLabel={`Remove ${label.toLowerCase()}`}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {data.subtotal !== 0 && renderRow('Subtotal', formatRupee(data.subtotal))}
      {data.cgstTotal !== 0 && renderRow('CGST', formatRupee(data.cgstTotal))}
      {data.sgstTotal !== 0 && renderRow('SGST', formatRupee(data.sgstTotal))}
      {showTaxRow && renderRow('Tax', formatRupee(data.totalTax))}
      {data.serviceCharge > 0 &&
        renderRow('Service charge', formatRupee(data.serviceCharge), {
          removable: true,
          onRemove: onRemoveServiceChargeClick,
        })}
      {data.containerCharge > 0 &&
        renderRow('Container charge', formatRupee(data.containerCharge), {
          removable: true,
          onRemove: onRemoveContainerChargeClick,
        })}
      {data.deliveryCharge > 0 &&
        renderRow('Delivery charge', formatRupee(data.deliveryCharge), {
          removable: true,
          onRemove: onRemoveDeliveryChargeClick,
        })}
      {data.tipTotal > 0 &&
        renderRow('Tip', formatRupee(data.tipTotal), {
          removable: true,
          onRemove: onRemoveTipClick,
        })}
      {discountValue > 0 &&
        renderRow('Discount', `-${formatRupee(discountValue)}`, {
          removable: true,
          onRemove: onRemoveDiscountClick,
          valueStyle: styles.discountValue,
        })}
      {data.roundOff !== 0 &&
        renderRow(
          'Round off',
          data.roundOff >= 0 ? formatRupee(data.roundOff) : `-${formatRupee(Math.abs(data.roundOff))}`
        )}
      <View style={[styles.row, styles.payableRow]}>
        <Text style={styles.payableLabel}>Payable</Text>
        <Text style={styles.payableValue}>{formatRupee(data.payable)}</Text>
      </View>
      {showAddTipButton && modifiable && (data.tipTotal ?? 0) === 0 && onAddTipClick && (
        <TouchableOpacity style={styles.addTipBtn} onPress={onAddTipClick}>
          <Text style={styles.addTipBtnText}>Add tip</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: { fontSize: 14, color: '#94A3B8' },
  value: { fontSize: 14, color: '#F8FAFC', fontWeight: '600' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: { color: '#F8FAFC', fontSize: 12, fontWeight: '700' },
  discountValue: { color: '#86EFAC' },
  payableRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' },
  payableLabel: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  payableValue: { fontSize: 20, fontWeight: '800', color: '#FFD700' },
  addTipBtn: { marginTop: 12, paddingVertical: 10 },
  addTipBtnText: { color: '#FFD700', fontSize: 14, fontWeight: '600' },
});
