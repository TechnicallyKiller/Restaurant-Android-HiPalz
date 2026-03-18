import React from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { CartItem } from '../../api/types';

interface DecrementLineModalProps {
  visible: boolean;
  itemName: string;
  lines: CartItem[];
  onClose: () => void;
  onSelectLine: (cartId: string) => void;
}

function lineDescription(line: CartItem): string {
  const parts: string[] = [];
  if (line.variantName) parts.push(line.variantName);
  if (line.addons.length > 0) {
    const addonStr = line.addons.map(a => `${a.addonName}${a.quantity > 1 ? ` ×${a.quantity}` : ''}`).join(', ');
    parts.push(addonStr);
  }
  if (line.notes?.trim()) parts.push(line.notes.trim());
  return parts.length ? parts.join(' · ') : 'Default';
}

export default function DecrementLineModal({
  visible,
  itemName,
  lines,
  onClose,
  onSelectLine,
}: DecrementLineModalProps) {
  if (!visible) return null;

  return (
    <Modal visible animationType="fade" transparent>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>Multiple {itemName} found</Text>
        <Text style={styles.subtitle}>Select which one to remove</Text>
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {lines.map(line => (
            <Pressable
              key={line.cartId}
              style={({ pressed }) => [styles.lineBtn, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => { onSelectLine(line.cartId); onClose(); }}
            >
              <Text style={styles.lineDesc}>{lineDescription(line)}</Text>
              <Text style={styles.lineQty}>Qty: {line.quantity} · ₹{line.totalPrice.toFixed(0)}</Text>
              <Text style={styles.removeOneLabel}>Remove one</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable
          style={({ pressed }) => [styles.cancelBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={onClose}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
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
    top: '25%',
    maxHeight: '50%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 16 },
  list: { maxHeight: 240, marginBottom: 12 },
  lineBtn: { backgroundColor: '#334155', padding: 14, borderRadius: 10, marginBottom: 8 },
  lineDesc: { color: '#F8FAFC', fontWeight: '600', fontSize: 14 },
  lineQty: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  removeOneLabel: { color: '#FFD700', fontSize: 12, fontWeight: '600', marginTop: 4 },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#94A3B8', fontWeight: '600' },
});
