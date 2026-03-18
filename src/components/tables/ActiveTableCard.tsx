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

  const content = (
    <>
      <View style={styles.titleRow}>
        {isMerged ? <Text style={styles.mergeIcon}>🔗</Text> : null}
        <Text style={[styles.name, isMerged && styles.nameMerged]} numberOfLines={1}>{table.name}</Text>
      </View>
      {table.hiCode ? (
        <Text style={[styles.code, isMerged && styles.textMerged]}>Code: {table.hiCode}</Text>
      ) : null}
      {table.mergedTableDisplay || (table.mergedTableNames && table.mergedTableNames.length > 0) ? (
        <Text style={[styles.merged, isMerged && styles.textMerged]} numberOfLines={1}>
          {table.mergedTableDisplay ?? table.mergedTableNames!.join(', ')}
        </Text>
      ) : null}
      <View style={styles.row}>
        <Text style={[styles.capacity, isMerged && styles.textMerged]}>{table.capacity} seats</Text>
        {table.tableCurrentAmount != null && table.tableCurrentAmount > 0 && (
          <Text style={[styles.amount, isBillPrinted && styles.amountMuted, isMerged && styles.amountMerged]}>
            ₹{table.tableCurrentAmount.toFixed(0)}
          </Text>
        )}
      </View>
    </>
  );

  const cardStyle = [styles.card, isBillPrinted && styles.cardMuted, isMerged && styles.cardMerged];

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

const mergedBg = '#2e1065';
const mergedBorder = '#7c3aed';

const styles = StyleSheet.create({
  card: {
    ...neoCard,
    width: '47%',
    minHeight: 88,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.tertiary,
  },
  cardMuted: {
    borderLeftColor: colors.base300,
    opacity: 0.9,
  },
  cardMerged: {
    backgroundColor: mergedBg,
    borderLeftColor: mergedBorder,
    borderColor: mergedBorder,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mergeIcon: { fontSize: 14 },
  name: { fontSize: 16, fontWeight: '700', color: colors.foreground, flex: 1 },
  nameMerged: { color: '#e9d5ff' },
  code: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  merged: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  capacity: { fontSize: 12, color: colors.mutedForeground },
  textMerged: { color: '#c4b5fd' },
  amount: { fontSize: 14, fontWeight: '700', color: colors.tertiary },
  amountMuted: { color: colors.mutedForeground },
  amountMerged: { color: '#ddd6fe' },
});
