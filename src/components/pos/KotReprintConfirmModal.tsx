import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface KotReprintConfirmModalProps {
  visible: boolean;
  kotNumber?: number;
  onClose: () => void;
  onConfirm: () => void;
  isReprinting?: boolean;
}

export default function KotReprintConfirmModal({
  visible,
  kotNumber,
  onClose,
  onConfirm,
  isReprinting = false,
}: KotReprintConfirmModalProps) {
  if (!visible) return null;

  return (
    <Modal visible animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Reprint KOT</Text>
          <Text style={styles.message}>
            Do you want to reprint {kotNumber != null ? `KOT #${kotNumber}` : 'this KOT'}?
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isReprinting}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, isReprinting && styles.btnDisabled]}
              onPress={onConfirm}
              disabled={isReprinting}
            >
              <Text style={styles.confirmBtnText}>{isReprinting ? 'Reprinting…' : 'Reprint'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: { backgroundColor: '#1E293B', borderRadius: 16, padding: 24, width: '100%', maxWidth: 320 },
  title: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 8 },
  message: { fontSize: 14, color: '#94A3B8', marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#334155', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#F8FAFC', fontWeight: '600' },
  confirmBtn: { flex: 1, backgroundColor: '#FFD700', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#0F172A', fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
