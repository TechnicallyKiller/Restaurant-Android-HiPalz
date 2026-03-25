import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAreasAndTables, useInstancedBills } from '../hooks';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../navigation/types';
import type { Table } from '../api/types';
import type { AreaWithTables } from '../hooks/useAreasAndTables';
import { naturalCompare } from '../utils/naturalSort';
import SearchInput from '../components/SearchInput';
import ErrorFallback from '../components/ErrorFallback';
import { colors, neoCard, neoButtonTertiary } from '../theme/neoBrutalism';
import EmptyTablesModal from '../components/tables/EmptyTablesModal';
import ActiveTableCard from '../components/tables/ActiveTableCard';
import InstanceBillModal from '../components/tables/InstanceBillModal';

/** Main list: only active (non-EMPTY) tables. */
function filterActiveTables(grouped: AreaWithTables[]): AreaWithTables[] {
  return grouped
    .map(({ area, tables }) => ({
      area,
      tables: tables.filter(t => (t.tableStatus ?? 'EMPTY') !== 'EMPTY'),
    }))
    .filter(g => g.tables.length > 0);
}

function filterGroupedBySearch(
  grouped: AreaWithTables[],
  query: string,
): AreaWithTables[] {
  const q = query.trim().toLowerCase();
  if (!q) return grouped;
  return grouped
    .map(({ area, tables }) => ({
      area,
      tables: tables.filter(
        t =>
          t.name.toLowerCase().includes(q) ||
          (t.hiCode?.toLowerCase().includes(q) ?? false),
      ),
    }))
    .filter(g => g.tables.length > 0);
}

const TablesScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const outletId = useAuthStore(s => s.user?.outletId ?? '');
  const { grouped, isLoading, error, refetch } = useAreasAndTables({
    refetchIntervalMs: 9000,
  });
  const { instances = [], refetch: refetchInstances } = useInstancedBills(
    outletId,
    {
      refetchIntervalMs: 10000,
    },
  );
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startTableModalOpen, setStartTableModalOpen] = useState(false);
  const [instanceBillId, setInstanceBillId] = useState<string | null>(null);

  const activeGrouped = useMemo(() => filterActiveTables(grouped), [grouped]);
  const filteredGrouped = useMemo(
    () => filterGroupedBySearch(activeGrouped, searchQuery),
    [activeGrouped, searchQuery],
  );

  // Natural-sort instances by tableName
  const sortedInstances = useMemo(
    () =>
      [...(instances ?? [])].sort((a, b) =>
        naturalCompare(a.tableName ?? '', b.tableName ?? ''),
      ),
    [instances],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchInstances()]);
    setRefreshing(false);
  };

  const onTablePress = (table: Table) => {
    navigation.navigate('POS', { tableId: table.id });
  };

  const onStartTableSelect = (table: Table) => {
    setStartTableModalOpen(false);
    navigation.navigate('POS', { tableId: table.id });
  };

  if (isLoading && grouped.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.tertiary} />
      </View>
    );
  }

  if (error && grouped.length === 0) {
    return (
      <ErrorFallback
        message={error}
        onRetry={() => {
          refetch();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Tables</Text>
        <Pressable
          style={({ pressed }) => [
            styles.refreshBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.tertiary} />
          ) : (
            <Text style={styles.refreshBtnText}>↻</Text>
          )}
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tertiary}
          />
        }
      >
        {sortedInstances.length > 0 && (
          <View style={styles.instancesSection}>
            <Text style={styles.instancesSectionTitle}>Table instances</Text>
            <Text style={styles.instancesSectionSubtitle}>
              Tables freed for new orders with an open bill. Click to continue
              billing.
            </Text>
            <View style={styles.instanceGrid}>
              {sortedInstances.map((inst, index) => {
                const billId = inst.id ?? inst.billId ?? '';
                return (
                  <Pressable
                    key={billId || `instance-${index}`}
                    style={({ pressed }) => [
                      styles.instanceCardGrid,
                      { opacity: pressed ? 0.7 : 1 },
                      {
                        borderColor:
                          (inst.payable ?? 0) > 0 ? colors.tertiary : '#22C55E',
                      },
                    ]}
                    onPress={() => billId && setInstanceBillId(billId)}
                  >
                    <View style={styles.instanceIconWrap}>
                      <Text style={styles.instanceIcon}>🕒</Text>
                    </View>

                    <Text style={styles.instanceCardTitle}>
                      {inst.tableName ?? 'Table'}
                    </Text>

                    <Text style={styles.instanceCardSub}>
                      {inst.captainName ? `${inst.captainName}` : 'System'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search tables…"
          style={styles.search}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {filteredGrouped.length === 0 ? (
          <Text style={styles.empty}>
            {activeGrouped.length === 0
              ? 'No active tables'
              : 'No tables match your search'}
          </Text>
        ) : (
          filteredGrouped.map(({ area, tables }) => (
            <View key={area.id} style={styles.section}>
              <View style={styles.areaHeader}>
                <Text style={styles.areaName}>{area.name}</Text>
                <View style={styles.areaLine} />
              </View>
              <View style={styles.tableGrid}>
                {tables.map(t => (
                  <ActiveTableCard
                    key={t.id}
                    table={t}
                    onClick={onTablePress}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.fixedBottom}>
        <Pressable
          style={({ pressed }) => [
            styles.startTableBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => setStartTableModalOpen(true)}
        >
          <Text style={styles.startTableBtnText}>Start table</Text>
        </Pressable>
      </View>

      <EmptyTablesModal
        isOpen={startTableModalOpen}
        onClose={() => setStartTableModalOpen(false)}
        groupedTables={grouped}
        onSelectTable={onStartTableSelect}
      />

      <InstanceBillModal
        visible={Boolean(instanceBillId)}
        onClose={() => setInstanceBillId(null)}
        billId={instanceBillId ?? ''}
        onSettled={() => {
          refetchInstances();
          refetch();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  fixedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: colors.background,
    borderTopWidth: 3,
    borderTopColor: colors.brutalBorder,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: { fontSize: 24, fontWeight: '800', color: colors.foreground },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.base200,
    borderWidth: 3,
    borderColor: colors.brutalBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshBtnText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.tertiary,
  },
  startTableBtn: {
    ...neoButtonTertiary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  startTableBtnText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 16,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  instancesSection: { marginBottom: 16 },
  instancesSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  instancesSectionSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 10,
  },
  search: { marginBottom: 16 },
  errorText: { color: colors.error, marginBottom: 12 },
  section: { marginBottom: 32 },
  areaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  areaName: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.foreground,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  areaLine: {
    flex: 1,
    height: 3,
    backgroundColor: colors.brutalBorder,
    borderRadius: 2,
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  empty: { color: colors.mutedForeground, textAlign: 'center', marginTop: 24 },

  instanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  instanceCardGrid: {
    ...neoCard,
    width: '48%',
    padding: 12,
    borderColor: colors.tertiary,
    alignItems: 'center',
    gap: 6,
  },
  instanceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.base200,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.brutalBorder,
    marginBottom: 6,
  },
  instanceIcon: { fontSize: 18 },
  instanceCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.foreground,
  },
  instanceCardSub: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  instanceAmountWrap: {
    marginTop: 6,
    backgroundColor: colors.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.brutalBorder,
  },
  instanceAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.background,
  },
});

export default TablesScreen;
