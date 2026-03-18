import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useBillStore } from '../../store/billStore';
import type { Table } from '../../api/types';
import type { AreaWithTables } from '../../hooks/useAreasAndTables';
import TableTransferModal from './TableTransferModal';
import MergeTableModal from './MergeTableModal';
import BillGeneratedWarningModal from './BillGeneratedWarningModal';

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

  const [modal, setModal] = useState<{
    type: 'transfer' | 'merge' | 'warning' | null;
    warningContext: 'transfer' | 'merge';
  }>({
    type: null,
    warningContext: 'transfer',
  });

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
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>
            <Pressable
              style={({ pressed }) => [styles.action, { opacity: pressed ? 0.7 : 1 }]}
              onPress={handleSwitch}
            >
              <Text style={styles.actionText}>Switch table</Text>
              <Text style={styles.actionSubtext}>Go back to table list</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.action, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => {
                if (hasBillGenerated) {
                  setModal({ type: 'warning', warningContext: 'transfer' });
                } else {
                  onClose();
                  setModal({ ...modal, type: 'transfer' });
                }
              }}
            >
              <View style={styles.actionHeader}>
                <Text style={styles.actionText}>Transfer table</Text>
                {hasBillGenerated && <Text style={styles.lockIcon}>🔒</Text>}
              </View>
              <Text style={styles.actionSubtext}>Move entire order to another table</Text>
              {hasBillGenerated && <Text style={styles.blockedText}>Blocked: Bill already generated</Text>}
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.action, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => {
                if (hasBillGenerated) {
                  setModal({ type: 'warning', warningContext: 'merge' });
                } else {
                  onClose();
                  setModal({ ...modal, type: 'merge' });
                }
              }}
            >
              <View style={styles.actionHeader}>
                <Text style={styles.actionText}>Merge table</Text>
                {hasBillGenerated && <Text style={styles.lockIcon}>🔒</Text>}
              </View>
              <Text style={styles.actionSubtext}>Combine orders from other tables into this one</Text>
              {hasBillGenerated && <Text style={styles.blockedText}>Blocked: Bill already generated</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>

      <TableTransferModal
        visible={modal.type === 'transfer'}
        onClose={() => setModal({ ...modal, type: null })}
        fromTable={currentTable}
        tables={allTables}
        staffId={staffId}
        outletId={outletId}
        onSuccess={() => {
          onTransferOrMergeSuccess?.();
          setModal({ ...modal, type: null });
        }}
      />
      <MergeTableModal
        visible={modal.type === 'merge'}
        onClose={() => setModal({ ...modal, type: null })}
        destinationTable={currentTable}
        tablesSameArea={tablesSameArea}
        staffId={staffId}
        onSuccess={() => {
          onTransferOrMergeSuccess?.();
          setModal({ ...modal, type: null });
        }}
      />
      <BillGeneratedWarningModal
        visible={modal.type === 'warning'}
        onClose={() => setModal({ ...modal, type: null })}
        actionType={modal.warningContext}
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
  actionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionText: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  actionSubtext: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  lockIcon: { fontSize: 16 },
  blockedText: { fontSize: 11, color: '#ef4444', fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
});
