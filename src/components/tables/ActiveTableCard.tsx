import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Table, TableStatusType } from '../../api/types';
import { colors, neoCard } from '../../theme/neoBrutalism';

interface ActiveTableCardProps {
  table: Table;
  onClick?: (table: Table) => void;
}

export default function ActiveTableCard({ table, onClick }: ActiveTableCardProps) {
  const status = (table.tableStatus ?? 'ACTIVE') as TableStatusType;
  const isBillPrinted = status === 'BILL_PRINTED';

  const content = (
    <>
      <Text style={styles.name}>{table.name}</Text>
      {table.hiCode ? (
        <Text style={styles.code}>Code: {table.hiCode}</Text>
      ) : null}
      {table.mergedTableDisplay || (table.mergedTableNames && table.mergedTableNames.length > 0) ? (
        <Text style={styles.merged} numberOfLines={1}>
          {table.mergedTableDisplay ?? table.mergedTableNames!.join(', ')}
        </Text>
      ) : null}
      <View style={styles.row}>
        <Text style={styles.capacity}>{table.capacity} seats</Text>
        {table.tableCurrentAmount != null && table.tableCurrentAmount > 0 && (
          <Text style={[styles.amount, isBillPrinted && styles.amountMuted]}>
            ₹{table.tableCurrentAmount.toFixed(0)}
          </Text>
        )}
      </View>
    </>
  );

  const cardStyle = [styles.card, isBillPrinted && styles.cardMuted];

  if (onClick) {
    return (
      <TouchableOpacity style={cardStyle} onPress={() => onClick(table)} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{content}</View>;
}

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
  name: { fontSize: 16, fontWeight: '700', color: colors.foreground },
  code: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  merged: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  capacity: { fontSize: 12, color: colors.mutedForeground },
  amount: { fontSize: 14, fontWeight: '700', color: colors.tertiary },
  amountMuted: { color: colors.mutedForeground },
});
