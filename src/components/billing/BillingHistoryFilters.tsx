import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { colors, borderBrutal, neoInput } from '../../theme/neoBrutalism';
import type { BillingHistoryFilters } from '../../api/types';

interface Props {
  filters: BillingHistoryFilters;
  onChange: (filters: BillingHistoryFilters) => void;
}

const PAYMENT_METHODS = ['', 'CASH', 'UPI', 'CARD', 'SPLIT'];
const AREA_TYPES = ['', 'DINE_IN', 'TAKEAWAY', 'DELIVERY'];

export default function BillingHistoryFilterPanel({ filters, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  const update = (key: keyof BillingHistoryFilters, value: string) => {
    const next = { ...filters, [key]: value || undefined };
    onChange(next);
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.toggleBtn, { opacity: pressed ? 0.7 : 1 }]}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.toggleBtnText}>
          {expanded ? '▲ Hide Filters' : '▼ Show Filters'}
        </Text>
      </Pressable>

      {expanded && (
        <View style={styles.filterGrid}>
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>In.no</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Invoice #"
                placeholderTextColor={colors.mutedForeground}
                value={filters.invoiceNumber ?? ''}
                onChangeText={v => update('invoiceNumber', v)}
              />
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Table</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Table name"
                placeholderTextColor={colors.mutedForeground}
                value={filters.tableName ?? ''}
                onChangeText={v => update('tableName', v)}
              />
            </View>
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Customer</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Customer name"
                placeholderTextColor={colors.mutedForeground}
                value={filters.customerName ?? ''}
                onChangeText={v => update('customerName', v)}
              />
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Payment</Text>
            <View style={styles.chipRow}>
              {PAYMENT_METHODS.map(m => (
                <Pressable
                  key={m || 'all'}
                  style={({ pressed }) => [
                    styles.chip,
                    (filters.paymentMethod ?? '') === m && styles.chipActive,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => update('paymentMethod', m)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      (filters.paymentMethod ?? '') === m && styles.chipTextActive,
                    ]}
                  >
                    {m || 'All'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Area</Text>
            <View style={styles.chipRow}>
              {AREA_TYPES.map(a => (
                <Pressable
                  key={a || 'all'}
                  style={({ pressed }) => [
                    styles.chip,
                    (filters.areaType ?? '') === a && styles.chipActive,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => update('areaType', a)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      (filters.areaType ?? '') === a && styles.chipTextActive,
                    ]}
                  >
                    {a ? a.replace('_', ' ') : 'All'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Min ₹</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={filters.minAmount != null ? String(filters.minAmount) : ''}
                onChangeText={v => {
                  const num = parseFloat(v);
                  onChange({ ...filters, minAmount: isNaN(num) ? undefined : num });
                }}
              />
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Max ₹</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="∞"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={filters.maxAmount != null ? String(filters.maxAmount) : ''}
                onChangeText={v => {
                  const num = parseFloat(v);
                  onChange({ ...filters, maxAmount: isNaN(num) ? undefined : num });
                }}
              />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.clearBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => onChange({})}
          >
            <Text style={styles.clearBtnText}>Clear all filters</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  toggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.base200,
    borderWidth: 3,
    borderColor: colors.brutalBorder,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleBtnText: {
    color: colors.foreground,
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  filterGrid: {
    marginTop: 10,
    padding: 12,
    backgroundColor: colors.base100,
    borderWidth: 3,
    borderColor: colors.brutalBorder,
    borderRadius: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterItem: {
    flex: 1,
    minWidth: 120,
  },
  filterLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  filterInput: {
    ...neoInput,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.foreground,
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  chip: {
    backgroundColor: colors.base200,
    borderWidth: 2,
    borderColor: colors.brutalBorder,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipActive: {
    backgroundColor: colors.tertiary,
    borderColor: colors.tertiary,
  },
  chipText: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.background,
  },
  clearBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearBtnText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
