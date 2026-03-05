import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
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
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>Remove one</Text>
        <Text style={styles.subtitle}>{itemName} — which line?</Text>
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {lines.map(line => (
            <TouchableOpacity
              key={line.cartId}
              style={styles.lineBtn}
              onPress={() => { onSelectLine(line.cartId); onClose(); }}
            >
              <Text style={styles.lineDesc}>{lineDescription(line)}</Text>
              <Text style={styles.lineQty}>Qty: {line.quantity} · ₹{line.totalPrice.toFixed(0)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#94A3B8', fontWeight: '600' },
});
