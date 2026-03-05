import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useBillStore } from '../../store/billStore';
import type { Table } from '../../api/types';
import type { AreaWithTables } from '../../hooks/useAreasAndTables';
import TableTransferModal from './TableTransferModal';
import MergeTableModal from './MergeTableModal';

interface TableActionsModalProps {
  visible: boolean;
  onClose: () => void;
  currentTable: Table;
  grouped: AreaWithTables[];
  onSwitchTable: () => void;
  onTransferOrMergeSuccess?: () => void;
}

export default function TableActionsModal({
  visible,
  onClose,
  currentTable,
  grouped,
  onSwitchTable,
  onTransferOrMergeSuccess,
}: TableActionsModalProps) {
  const staffId = useAuthStore(s => s.user?.id ?? '');
  const outletId = useAuthStore(s => s.user?.outletId ?? '');
  const hasBillGenerated = useBillStore(s => s.hasBillForTable(currentTable.id));

  const [transferVisible, setTransferVisible] = useState(false);
  const [mergeVisible, setMergeVisible] = useState(false);

  const allTables = grouped.flatMap(g => g.tables).filter(t => t.id !== currentTable.id);
  const tablesSameArea = (grouped.find(g => g.area.id === currentTable.areaId)?.tables ?? []).filter(
    t => t.id !== currentTable.id,
  );

  const handleSwitch = () => {
    onClose();
    onSwitchTable();
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>Table actions</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.action} onPress={handleSwitch}>
              <Text style={styles.actionText}>Switch table</Text>
              <Text style={styles.actionSubtext}>Go back to table list</Text>
            </TouchableOpacity>
            {!hasBillGenerated && (
              <>
                <TouchableOpacity
                  style={styles.action}
                  onPress={() => {
                    onClose();
                    setTransferVisible(true);
                  }}
                >
                  <Text style={styles.actionText}>Transfer table</Text>
                  <Text style={styles.actionSubtext}>Move entire order to another table</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.action}
                  onPress={() => {
                    onClose();
                    setMergeVisible(true);
                  }}
                >
                  <Text style={styles.actionText}>Merge table</Text>
                  <Text style={styles.actionSubtext}>Combine orders from other tables into this one</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <TableTransferModal
        visible={transferVisible}
        onClose={() => setTransferVisible(false)}
        fromTable={currentTable}
        tables={allTables}
        staffId={staffId}
        outletId={outletId}
        onSuccess={() => {
          onTransferOrMergeSuccess?.();
          setTransferVisible(false);
        }}
      />
      <MergeTableModal
        visible={mergeVisible}
        onClose={() => setMergeVisible(false)}
        destinationTable={currentTable}
        tablesSameArea={tablesSameArea}
        staffId={staffId}
        onSuccess={() => {
          onTransferOrMergeSuccess?.();
          setMergeVisible(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 32,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800', color: '#F8FAFC' },
  closeText: { color: '#FFD700', fontWeight: '600' },
  action: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  actionText: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  actionSubtext: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
});
