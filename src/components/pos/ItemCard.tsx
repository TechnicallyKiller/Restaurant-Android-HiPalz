import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Item, AttributeValueType } from '../../api/types';

const attrIcon: Record<AttributeValueType, string> = {
  1: '🟢',
  2: '🔴',
  3: '🟡',
};

interface ItemCardProps {
  item: Item;
  onPress: () => void;
}

export default function ItemCard({ item, onPress }: ItemCardProps) {
  const icon = item.attribute ? attrIcon[item.attribute] ?? '⚪' : '⚪';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.price}>₹{item.price}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    width: '48%',
  },
  icon: { fontSize: 16, marginBottom: 4 },
  name: { fontSize: 14, fontWeight: '600', color: '#F8FAFC' },
  price: { fontSize: 14, fontWeight: '700', color: '#FFD700', marginTop: 4 },
});
