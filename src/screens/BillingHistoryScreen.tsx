import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBillingHistory } from '../hooks/useBillingHistory';
import type { BillingRow, DatePreset } from '../hooks/useBillingHistory';
import BillingHistoryFilterPanel from '../components/billing/BillingHistoryFilters';
import BillingHistoryRow from '../components/billing/BillingHistoryRow';
import BillingHistoryDetailModal from '../components/billing/BillingHistoryDetailModal';
import { printBill } from '../api/billApi';
import { colors, neoCard, borderBrutal, neoButtonTertiary } from '../theme/neoBrutalism';

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'thisMonth', label: 'This Month' },
];

export default function BillingHistoryScreen() {
  const {
    rows,
    isLoading,
    error,
    page,
    totalPages,
    nextPage,
    prevPage,
    datePreset,
    setDatePreset,
    filters,
    setFilters,
    refetch,
    detailBill,
    detailLoading,
    fetchDetail,
    closeDetail,
  } = useBillingHistory();

  const [directPrinting, setDirectPrinting] = useState<string | null>(null);

  const handleDirectPrint = async (billId: string) => {
    setDirectPrinting(billId);
    try {
      await printBill(billId);
      Alert.alert('Print', 'Print request sent.');
    } catch (err) {
      Alert.alert('Print failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDirectPrinting(null);
    }
  };

  const renderRow = ({ item }: { item: BillingRow }) => {
    if (item.type === 'single') {
      return (
        <BillingHistoryRow
          bill={item.bill}
          onView={() => item.bill.id && fetchDetail(item.bill.id)}
          onPrint={() => item.bill.id && handleDirectPrint(item.bill.id)}
        />
      );
    }

    // Split bill group
    return (
      <View style={styles.splitGroup}>
        {item.variants.map((variant, idx) => (
          <BillingHistoryRow
            key={variant.id ?? idx}
            bill={variant}
            onView={() => variant.id && fetchDetail(variant.id)}
            onPrint={() => variant.id && handleDirectPrint(variant.id)}
            isSplitPart
            isFirstSplitPart={idx === 0}
          />
        ))}
        <View style={styles.splitTotalRow}>
          <Text style={styles.splitTotalLabel}>Total (split)</Text>
          <Text style={styles.splitTotalValue}>₹{item.totalPayable.toFixed(0)}</Text>
        </View>
      </View>
    );
  };

  const keyExtractor = (item: BillingRow, index: number) => {
    if (item.type === 'single') return item.bill.id ?? `s-${index}`;
    return `split-${item.invoiceNumber}-${index}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>BILLING HISTORY</Text>
      </View>

      {/* Date presets */}
      <View style={styles.dateRow}>
        {DATE_PRESETS.map(({ key, label }) => (
          <Pressable
            key={key}
            style={({ pressed }) => [
              styles.dateChip,
              datePreset === key && styles.dateChipActive,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => setDatePreset(key)}
          >
            <Text
              style={[
                styles.dateChipText,
                datePreset === key && styles.dateChipTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Filters */}
      <View style={styles.filterWrap}>
        <BillingHistoryFilterPanel filters={filters} onChange={setFilters} />
      </View>

      {/* Error */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* List */}
      {isLoading && rows.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.tertiary} />
          <Text style={styles.loadingText}>Loading bills…</Text>
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyText}>No bills found</Text>
          <Text style={styles.emptySubtext}>
            Try changing the date range or adjusting filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={keyExtractor}
          renderItem={renderRow}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.tertiary}
            />
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.paginationRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.pageBtn,
                    page <= 1 && styles.pageBtnDisabled,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={prevPage}
                  disabled={page <= 1}
                >
                  <Text style={styles.pageBtnText}>← Prev</Text>
                </Pressable>
                <Text style={styles.pageInfo}>
                  Page {page} of {totalPages}
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.pageBtn,
                    page >= totalPages && styles.pageBtnDisabled,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={nextPage}
                  disabled={page >= totalPages}
                >
                  <Text style={styles.pageBtnText}>Next →</Text>
                </Pressable>
              </View>
            ) : null
          }
        />
      )}

      {/* Detail modal */}
      <BillingHistoryDetailModal
        visible={Boolean(detailBill)}
        bill={detailBill}
        isLoading={detailLoading}
        onClose={closeDetail}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.foreground,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  dateRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  dateChip: {
    backgroundColor: colors.base200,
    borderWidth: 3,
    borderColor: colors.brutalBorder,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  dateChipActive: {
    backgroundColor: colors.tertiary,
    borderColor: colors.tertiary,
  },
  dateChipText: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateChipTextActive: {
    color: colors.background,
  },
  filterWrap: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  errorText: {
    color: colors.error,
    paddingHorizontal: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.mutedForeground,
    marginTop: 12,
    fontSize: 14,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtext: {
    color: colors.mutedForeground,
    fontSize: 13,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  splitGroup: {
    marginBottom: 12,
    borderWidth: 3,
    borderColor: colors.tertiary,
    borderRadius: 14,
    padding: 6,
    backgroundColor: colors.base100,
  },
  splitTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: colors.brutalBorder,
    marginTop: 4,
  },
  splitTotalLabel: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  splitTotalValue: {
    color: colors.tertiary,
    fontSize: 18,
    fontWeight: '900',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  pageBtn: {
    backgroundColor: colors.base200,
    borderWidth: 3,
    borderColor: colors.brutalBorder,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    color: colors.foreground,
    fontWeight: '700',
    fontSize: 13,
  },
  pageInfo: {
    color: colors.mutedForeground,
    fontWeight: '600',
    fontSize: 13,
  },
});
