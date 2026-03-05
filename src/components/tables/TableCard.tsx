import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Table, TableStatusType } from '../../api/types';

const statusColor: Record<TableStatusType, string> = {
  EMPTY: '#22C55E',
  ACTIVE: '#F59E0B',
  BILL_PRINTED: '#64748B',
};

type StatusProp = 'available' | 'occupied' | 'billing';

interface TableCardProps {
  table: Table;
  onClick: (table: Table) => void;
  status?: StatusProp;
}

const statusToColor: Record<StatusProp, string> = {
  available: '#22C55E',
  occupied: '#EF4444',
  billing: '#EAB308',
};

export default function TableCard({ table, onClick, status = 'available' }: TableCardProps) {
  const color = statusToColor[status];

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: color }]}
      onPress={() => onClick(table)}
      activeOpacity={0.8}
    >
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={styles.name}>{table.name}</Text>
      <Text style={styles.capacity}>Capacity: {table.capacity}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    minHeight: 80,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
  },
  statusDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginTop: 4 },
  capacity: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
});
