import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { BillPreviewItem, BillPreviewItemAddonGroup } from '../../api/types';

export interface BillItemGridProps {
  items: BillPreviewItem[];
}

function lineTotal(item: BillPreviewItem): number {
  if (item.subtotal != null && item.subtotal > 0) return item.subtotal;
  let total = item.itemPrice * item.quantity + (item.containerCharge ?? 0);
  for (const group of item.addonGroups ?? []) {
    for (const choice of group.choices ?? []) {
      total += (choice.price ?? 0) * (choice.quantity ?? 0);
    }
  }
  return total;
}

function variantDisplay(item: BillPreviewItem): string | null {
  const r = item as unknown as Record<string, unknown>;
  const v = item.variantName ?? r.variant_name ?? r.itemVariantName;
  return v ? String(v) : null;
}

function addonLines(item: BillPreviewItem): { line: string }[] {
  const itemR = item as unknown as Record<string, unknown>;
  const groups = item.addonGroups ?? itemR.addon_groups ?? [];
  const out: { line: string }[] = [];
  for (const group of groups as BillPreviewItemAddonGroup[]) {
    const groupR = group as unknown as Record<string, unknown>;
    const name = group.addonName ?? groupR.addon_name ?? '';
    for (const c of group.choices ?? []) {
      const choiceR = c as unknown as Record<string, unknown>;
      const choiceName = c.addonChoiceName ?? choiceR.addon_choice_name ?? '';
      const qty = c.quantity ?? 0;
      const price = c.price ?? 0;
      const choiceTotal = price * qty;
      out.push({
        line: `${name}: ${choiceName}${qty > 1 ? ` ×${qty}` : ''}${choiceTotal > 0 ? ` (₹${choiceTotal.toFixed(0)})` : ''}`,
      });
    }
  }
  return out;
}

export default function BillItemGrid({ items }: BillItemGridProps) {
  if (!items?.length) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.nameCol]}>Name</Text>
        <Text style={[styles.headerCell, styles.qtyCol]}>Qty</Text>
        <Text style={[styles.headerCell, styles.priceCol]}>Price</Text>
        <Text style={[styles.headerCell, styles.amountCol]}>Amount</Text>
      </View>
      {items.map(item => {
        const amount = lineTotal(item);
        const portion = variantDisplay(item);
        const addons = addonLines(item);
        return (
          <View key={item.id} style={styles.dataRow}>
            <View style={styles.nameCol}>
              <Text style={styles.itemName}>{item.itemName}</Text>
              {portion ? <Text style={styles.meta}>Portion: {portion}</Text> : null}
              {addons.map((a, i) => (
                <Text key={i} style={styles.meta}>{a.line}</Text>
              ))}
            </View>
            <Text style={[styles.cell, styles.qtyCol]}>{item.quantity}</Text>
            <Text style={[styles.cell, styles.priceCol]}>₹{(item.itemPrice ?? 0).toFixed(0)}</Text>
            <Text style={[styles.cell, styles.amountCol]}>₹{amount.toFixed(0)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: 8 },
  headerRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155', marginBottom: 4 },
  headerCell: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  dataRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  nameCol: { flex: 2, paddingRight: 8 },
  qtyCol: { width: 36, textAlign: 'right' },
  priceCol: { width: 56, textAlign: 'right', paddingRight: 8 },
  amountCol: { width: 64, textAlign: 'right' },
  cell: { fontSize: 14, color: '#F8FAFC' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#F8FAFC' },
  meta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
});
