import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAreasAndTables, useInstancedBills } from '../hooks';
import { useAuthStore } from '../store/authStore';
import { useTableStore } from '../store/tableStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { Table, TableStatusType } from '../api/types';
import type { AreaWithTables } from '../hooks/useAreasAndTables';
import SearchInput from '../components/SearchInput';
import ErrorFallback from '../components/ErrorFallback';
import EmptyTablesModal from '../components/tables/EmptyTablesModal';
import TableCard from '../components/tables/TableCard';
import ActiveTableCard from '../components/tables/ActiveTableCard';
import InstanceBillModal from '../components/tables/InstanceBillModal';

type Props = NativeStackScreenProps<RootStackParamList, 'Tables'>;

function filterGroupedBySearch(grouped: AreaWithTables[], query: string): AreaWithTables[] {
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

const TablesScreen = ({ navigation }: Props) => {
  const outletId = useAuthStore(s => s.user?.outletId ?? '');
  const { grouped, isLoading, error, refetch } = useAreasAndTables();
  const { instances = [], refetch: refetchInstances } = useInstancedBills(outletId);
  const setCurrentTable = useTableStore(s => s.setCurrentTable);
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [startTableModalOpen, setStartTableModalOpen] = useState(false);
  const [instanceBillId, setInstanceBillId] = useState<string | null>(null);

  const filteredGrouped = useMemo(
    () => filterGroupedBySearch(grouped, searchQuery),
    [grouped, searchQuery],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchInstances()]);
    setRefreshing(false);
  };

  const onTablePress = (table: Table) => {
    setCurrentTable(table);
    navigation.navigate('POS');
  };

  const onStartTableSelect = (table: Table) => {
    setCurrentTable(table);
    setStartTableModalOpen(false);
    navigation.navigate('POS');
  };

  if (isLoading && grouped.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  if (error && grouped.length === 0) {
    return (
      <ErrorFallback message={error} onRetry={refetch} />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
      }
    >
      <View style={styles.headerRow}>
        <Text style={styles.header}>Tables</Text>
        <TouchableOpacity
          style={styles.startTableBtn}
          onPress={() => setStartTableModalOpen(true)}
        >
          <Text style={styles.startTableBtnText}>Start table</Text>
        </TouchableOpacity>
      </View>

      {(instances ?? []).length > 0 && (
        <View style={styles.instancesSection}>
          <Text style={styles.instancesSectionTitle}>Table instances</Text>
          <Text style={styles.instancesSectionSubtitle}>
            Tables freed for new orders with an open bill. Click to continue billing.
          </Text>
          {(instances ?? []).map((inst, index) => {
            const billId = inst.id ?? inst.billId ?? '';
            return (
              <TouchableOpacity
                key={billId || `instance-${index}`}
                style={styles.instanceCard}
                onPress={() => billId && setInstanceBillId(billId)}
              >
                <Text style={styles.instanceCardTitle}>{inst.tableName ?? 'Table'}</Text>
                <Text style={styles.instanceCardSub}>
                  {inst.captainName ? `${inst.captainName} · ` : ''}₹{inst.payable?.toFixed(0) ?? '0'}
                </Text>
              </TouchableOpacity>
            );
          })}
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
          {grouped.length === 0 ? 'No tables found' : 'No tables match your search'}
        </Text>
      ) : (
        filteredGrouped.map(({ area, tables }) => (
          <View key={area.id} style={styles.section}>
            <Text style={styles.areaName}>{area.name}</Text>
            <View style={styles.tableGrid}>
              {tables.map(t => {
                const status = (t.tableStatus ?? 'EMPTY') as TableStatusType;
                if (status === 'EMPTY') {
                  return (
                    <TableCard
                      key={t.id}
                      table={t}
                      onClick={onTablePress}
                      status="available"
                    />
                  );
                }
                return (
                  <ActiveTableCard
                    key={t.id}
                    table={t}
                    onClick={onTablePress}
                  />
                );
              })}
            </View>
          </View>
        ))
      )}

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
        onSettled={refetchInstances}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 16, paddingBottom: 32 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: { fontSize: 24, fontWeight: '800', color: '#F8FAFC' },
  startTableBtn: {
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  startTableBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 14 },
  instancesSection: { marginBottom: 16 },
  instancesSectionTitle: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginBottom: 4 },
  instancesSectionSubtitle: { fontSize: 12, color: '#64748B', marginBottom: 10 },
  instanceCard: { backgroundColor: '#1E293B', borderRadius: 10, padding: 12, marginBottom: 8 },
  instanceCardTitle: { fontSize: 14, fontWeight: '700', color: '#F8FAFC' },
  instanceCardSub: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  search: { marginBottom: 12 },
  errorText: { color: '#F87171', marginBottom: 12 },
  section: { marginBottom: 24 },
  areaName: { fontSize: 18, fontWeight: '600', color: '#94A3B8', marginBottom: 12 },
  tableGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  empty: { color: '#64748B', textAlign: 'center', marginTop: 24 },
});

export default TablesScreen;
