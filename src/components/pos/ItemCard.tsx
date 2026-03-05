import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Item, AttributeValueType } from '../../api/types';

const ATTR_COLORS: Record<AttributeValueType, { border: string; fill: string }> = {
  1: { border: '#22C55E', fill: '#22C55E' },   // VEG
  2: { border: '#EF4444', fill: '#EF4444' },   // NON_VEG
  3: { border: '#EAB308', fill: '#EAB308' },   // EGG
};

interface ItemCardProps {
  item: Item;
  /** Total quantity in cart for this item (sum across all lines) */
  quantityInCart: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  /** When true, card uses full width (single-column list layout) */
  fullWidth?: boolean;
}

export default function ItemCard({
  item,
  quantityInCart,
  onAdd,
  onIncrement,
  onDecrement,
  fullWidth,
}: ItemCardProps) {
  const attrStyle = item.attribute ? ATTR_COLORS[item.attribute] : null;

  return (
    <View style={[styles.card, fullWidth && styles.cardFullWidth]}>
      <View style={styles.topRow}>
        <View style={[styles.attrDot, attrStyle && { borderColor: attrStyle.border }]}>
          {attrStyle ? <View style={[styles.attrInner, { backgroundColor: attrStyle.fill }]} /> : null}
        </View>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
      </View>
      <View style={styles.bottomRow}>
        <Text style={styles.price}>₹{item.price}</Text>
        {quantityInCart === 0 ? (
          <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={onDecrement} accessibilityLabel="Decrease quantity">
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantityInCart}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={onIncrement} accessibilityLabel="Increase quantity">
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    width: '48%',
  },
  cardFullWidth: { width: '100%' },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  attrDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#64748B',
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attrInner: { width: 8, height: 8, borderRadius: 4 },
  name: { flex: 1, fontSize: 14, fontWeight: '700', color: '#F8FAFC' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 15, fontWeight: '800', color: '#FFD700' },
  addBtn: { backgroundColor: '#FFD700', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  addBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 14 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { color: '#F8FAFC', fontWeight: '700', fontSize: 16 },
  qtyValue: { fontSize: 14, fontWeight: '700', color: '#F8FAFC', minWidth: 20, textAlign: 'center' },
});
