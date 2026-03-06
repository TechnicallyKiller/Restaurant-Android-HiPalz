import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface RepeatLastOrNewModalProps {
  visible: boolean;
  itemName: string;
  onClose: () => void;
  onRepeatLast: () => void;
  onAddNew: () => void;
}

export default function RepeatLastOrNewModal({
  visible,
  itemName,
  onClose,
  onRepeatLast,
  onAddNew,
}: RepeatLastOrNewModalProps) {
  if (!visible) return null;

  return (
    <Modal visible animationType="fade" transparent>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>Add {itemName}</Text>
        <Text style={styles.subtitle}>
          Same dish with same options (including note) or choose new variant/addons?
        </Text>
        <TouchableOpacity style={styles.optionBtn} onPress={onRepeatLast}>
          <Text style={styles.optionBtnText}>Repeat last</Text>
          <Text style={styles.optionHint}>Same portion, add-ons & note</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionBtn} onPress={onAddNew}>
          <Text style={styles.optionBtnText}>Add new</Text>
          <Text style={styles.optionHint}>Choose portion & add-ons</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: '30%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 20 },
  optionBtn: { backgroundColor: '#334155', padding: 16, borderRadius: 12, marginBottom: 10 },
  optionBtnText: { color: '#FFD700', fontWeight: '700', fontSize: 16 },
  optionHint: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { color: '#94A3B8', fontWeight: '600' },
});
