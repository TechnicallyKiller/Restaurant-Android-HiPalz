import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { Table, TableStatusType } from '../../api/types';
import { colors, neoCard } from '../../theme/neoBrutalism';

interface ActiveTableCardProps {
  table: Table;
  onClick?: (table: Table) => void;
}

export default function ActiveTableCard({ table, onClick }: ActiveTableCardProps) {
  const status = (table.tableStatus ?? 'ACTIVE') as TableStatusType;
  const isBillPrinted = status === 'BILL_PRINTED';
  const isMerged = table.isMergedParent === true || (table.mergedTableNames?.length ?? 0) > 0;

  // Determine color based on status
  const statusConfig = {
    ACTIVE: { label: 'Occupied', color: colors.secondary, icon: '🍽️' },
    BILL_PRINTED: { label: 'Billing', color: colors.tertiary, icon: '🧾' },
    EMPTY: { label: 'Available', color: colors.success, icon: '✅' },
  }[status] || { label: status, color: colors.mutedForeground, icon: '📍' };

  const content = (
    <View style={styles.cardInner}>
      {/* Top Row: Status Badge & Merged Indicator */}
      <View style={styles.topRow}>
        <View style={[styles.statusBadge, { backgroundColor: isMerged ? '#7c3aed' : statusConfig.color }]}>
          <Text style={styles.statusLabel}>
            {isMerged ? '🔗 Merged' : statusConfig.label}
          </Text>
        </View>
        <Text style={styles.capacityBadge}>👥 {table.capacity}</Text>
      </View>

      {/* Center: Table Visual */}
      <View style={styles.visualContainer}>
        <View style={[
          styles.tableVisual,
          isMerged && styles.tableVisualMerged,
          { borderColor: isMerged ? '#7c3aed' : statusConfig.color }
        ]}>
          <Text style={[styles.name, isMerged && styles.nameMerged]} numberOfLines={1}>
            {table.name}
          </Text>
        </View>
        
        {/* Decorative seats based on capacity (max 4 for visual) */}
        {[...Array(Math.max(0, Math.min(table.capacity || 0, 4)))].map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.seat, 
              (styles as any)[`seat${i}`],
              { backgroundColor: isMerged ? '#a78bfa' : statusConfig.color }
            ]} 
          />
        ))}
      </View>

      {/* Bottom Row: Code & Amount */}
      <View style={styles.bottomRow}>
        <Text style={styles.code} numberOfLines={1}>
          {table.hiCode || `T-${table.id.slice(-3)}`}
        </Text>
        {table.tableCurrentAmount != null && table.tableCurrentAmount > 0 && (
          <View style={styles.amountContainer}>
            <Text style={[styles.amount, isBillPrinted && styles.amountBilling]}>
              ₹{table.tableCurrentAmount.toFixed(0)}
            </Text>
          </View>
        )}
      </View>

      {/* Merged Names Overlay or Subtext */}
      {isMerged && (table.mergedTableDisplay || table.mergedTableNames?.length) && (
        <Text style={styles.mergedList} numberOfLines={1}>
          {table.mergedTableDisplay ?? table.mergedTableNames?.join(', ')}
        </Text>
      )}
    </View>
  );

  const cardStyle = [
    styles.card,
    isBillPrinted && styles.cardBilling,
    isMerged && styles.cardMerged
  ];

  if (onClick) {
    return (
      <Pressable
        style={({ pressed }) => [...cardStyle, { opacity: pressed ? 0.7 : 1 }]}
        onPress={() => onClick(table)}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    ...neoCard,
    width: '47%',
    minHeight: 120,
    padding: 8,
    borderWidth: 3,
  },
  cardInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardBilling: {
    borderColor: colors.tertiary,
  },
  cardMerged: {
    backgroundColor: '#1e1b4b',
    borderColor: '#7c3aed',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.background,
    textTransform: 'uppercase',
  },
  capacityBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  visualContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tableVisual: {
    width: 50,
    height: 50,
    borderRadius: 25, // Circular table
    borderWidth: 3,
    backgroundColor: colors.base200,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  tableVisualMerged: {
    backgroundColor: '#312e81',
    borderRadius: 8, // Square for merged?
  },
  name: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.foreground,
    textAlign: 'center',
  },
  nameMerged: {
    color: '#e9d5ff',
  },
  seat: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 1,
  },
  seat0: { top: 0, left: '40%' },
  seat1: { bottom: 0, left: '40%' },
  seat2: { left: 0, top: '40%' },
  seat3: { right: 0, top: '40%' },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  code: {
    fontSize: 10,
    color: colors.mutedForeground,
    fontWeight: '600',
    flex: 1,
  },
  amountContainer: {
    backgroundColor: colors.base200,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.brutalBorder,
  },
  amount: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
  },
  amountBilling: {
    color: colors.tertiary,
  },
  mergedList: {
    fontSize: 9,
    color: '#a78bfa',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});
