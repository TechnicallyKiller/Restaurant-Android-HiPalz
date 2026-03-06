import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import type { AreaWithTables } from '../../hooks/useAreasAndTables';
import type { Table } from '../../api/types';
import SearchInput from '../SearchInput';

interface EmptyTablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupedTables: AreaWithTables[];
  onSelectTable: (table: Table) => void;
}

export default function EmptyTablesModal({
  isOpen,
  onClose,
  groupedTables,
  onSelectTable,
}: EmptyTablesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const emptyGrouped = useMemo(
    () =>
      groupedTables
        .map(({ area, tables }) => ({
          area,
          tables: tables.filter(t => (t.tableStatus ?? 'EMPTY') === 'EMPTY'),
        }))
        .filter(g => g.tables.length > 0),
    [groupedTables],
  );

  const filteredGrouped = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return emptyGrouped;
    return emptyGrouped
      .map(({ area, tables }) => ({
        area,
        tables: tables.filter(
          t =>
            t.name.toLowerCase().includes(q) ||
            (t.hiCode?.toLowerCase().includes(q) ?? false),
        ),
      }))
      .filter(g => g.tables.length > 0);
  }, [emptyGrouped, searchQuery]);

  const handleSelect = (table: Table) => {
    onSelectTable(table);
    onClose();
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Start table</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchWrap}>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search tables by name or code…"
              style={styles.searchInput}
            />
          </View>
          {filteredGrouped.length === 0 ? (
            <Text style={styles.empty}>
              {emptyGrouped.length === 0 ? 'No empty tables.' : 'No tables match your search.'}
            </Text>
          ) : (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              {filteredGrouped.map(({ area, tables }) => (
                <View key={area.id} style={styles.section}>
                  <Text style={styles.areaName}>{area.name}</Text>
                  <View style={styles.grid}>
                    {tables.map(t => (
                      <TouchableOpacity
                        key={t.id}
                        style={styles.tableBtn}
                        onPress={() => handleSelect(t)}
                      >
                        <Text style={styles.tableBtnName}>{t.name}</Text>
                        <Text style={styles.tableBtnSeats}>{t.capacity} seats</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#F8FAFC' },
  closeBtn: { padding: 8 },
  closeBtnText: { color: '#FFD700', fontWeight: '600' },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  searchInput: {},
  empty: { padding: 24, color: '#64748B', textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  section: { marginBottom: 20 },
  areaName: { fontSize: 16, fontWeight: '600', color: '#94A3B8', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tableBtn: {
    width: '47%',
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
  },
  tableBtnName: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  tableBtnSeats: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
});
