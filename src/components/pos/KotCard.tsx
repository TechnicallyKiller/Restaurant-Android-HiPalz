import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Kot, KotItem, KotItemVariant, KotAddonGroup, KotAddonChoice } from '../../api/types';

interface KotCardProps {
  kot: Kot;
  onReprint: () => void;
}

function normalizeVariants(item: KotItem): KotItemVariant[] {
  const v = item.variants ?? (item as Record<string, unknown>).item_variants;
  return Array.isArray(v) ? v : [];
}

function normalizeAddonGroups(item: KotItem): KotAddonGroup[] {
  const a = item.addonGroups ?? (item as Record<string, unknown>).addon_groups;
  return Array.isArray(a) ? a : [];
}

function variantLabel(v: KotItemVariant | Record<string, unknown>): string {
  const name = (v as KotItemVariant).variantName ?? (v as Record<string, unknown>).variant_name ?? '';
  const price = (v as KotItemVariant).variantPrice ?? (v as Record<string, unknown>).variant_price ?? 0;
  return `Portion: ${name} (₹${Number(price)})`;
}

function addonChoiceLabel(g: KotAddonGroup | Record<string, unknown>, c: KotAddonChoice | Record<string, unknown>): string {
  const addonName = (g as KotAddonGroup).addonName ?? (g as Record<string, unknown>).addon_name ?? '';
  const choiceName = (c as KotAddonChoice).addonChoiceName ?? (c as Record<string, unknown>).addon_choice_name ?? '';
  const qty = (c as KotAddonChoice).quantity ?? (c as Record<string, unknown>).quantity ?? 0;
  const price = (c as KotAddonChoice).price ?? (c as Record<string, unknown>).price ?? 0;
  const total = Number(price) * Number(qty);
  return `${addonName}: ${choiceName} x${qty} (₹${total})`;
}

function KotLineRow({ item }: { item: KotItem }) {
  const lineTotal = item.itemPrice * item.quantity + (item.containerCharge ?? 0);
  const variants = normalizeVariants(item);
  const variantLine = variants.length
    ? variants.map(v => variantLabel(v)).join(', ')
    : null;
  const addonGroups = normalizeAddonGroups(item);
  const addonLines = addonGroups.flatMap(g => {
    const choices = (g as KotAddonGroup).choices ?? (g as Record<string, unknown>).choices ?? [];
    return Array.isArray(choices) ? choices.map((c: KotAddonChoice | Record<string, unknown>) => addonChoiceLabel(g, c)) : [];
  });

  return (
    <View style={styles.line}>
      <View style={styles.lineLeft}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.notes?.trim() ? <Text style={styles.note}>Note: {item.notes.trim()}</Text> : null}
        {variantLine ? <Text style={styles.lineMeta}>{variantLine}</Text> : null}
        {addonLines.map((t, i) => (
          <Text key={i} style={styles.lineMeta}>{t}</Text>
        ))}
      </View>
      <View style={styles.lineRight}>
        <Text style={styles.qtyPrice}>{item.quantity} × ₹{item.itemPrice}</Text>
        <Text style={styles.lineTotal}>₹{lineTotal.toFixed(0)}</Text>
      </View>
    </View>
  );
}

export default function KotCard({ kot, onReprint }: KotCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.kotTitle}>KOT #{kot.kotInvoiceNumber}</Text>
          <Text style={styles.meta}>Table: {kot.tableName}</Text>
          <Text style={styles.meta}>{kot.userName} · {kot.userPhone}</Text>
        </View>
        <TouchableOpacity style={styles.reprintBtn} onPress={onReprint}>
          <Text style={styles.reprintBtnText}>Reprint</Text>
        </TouchableOpacity>
      </View>
      {kot.items.map(item => (
        <KotLineRow key={item.id} item={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerLeft: {},
  kotTitle: { fontSize: 16, fontWeight: '700', color: '#FFD700' },
  meta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  reprintBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#334155', borderRadius: 8 },
  reprintBtnText: { color: '#FFD700', fontWeight: '600', fontSize: 13 },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  lineLeft: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#F8FAFC' },
  note: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', marginTop: 2 },
  lineMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  lineRight: { alignItems: 'flex-end' },
  qtyPrice: { fontSize: 12, color: '#94A3B8' },
  lineTotal: { fontSize: 14, fontWeight: '700', color: '#FFD700' },
});
