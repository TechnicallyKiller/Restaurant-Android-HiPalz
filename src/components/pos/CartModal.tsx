import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { CartItem } from '../../api/types';
import CartListSection from './CartListSection';

interface CartModalProps {
  visible: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onUpdateNotes: (cartId: string, notes: string) => void;
  onPlaceOrder: () => void;
  isPlacing?: boolean;
  onDecrementRequest?: (line: CartItem) => void;
}

export default function CartModal({
  visible,
  items,
  onClose,
  onUpdateQuantity,
  onUpdateNotes,
  onPlaceOrder,
  isPlacing = false,
  onDecrementRequest,
}: CartModalProps) {
  const grandTotal = items.reduce((s, i) => s + i.totalPrice, 0);

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Cart</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listWrap}>
            <CartListSection
              items={items}
              onUpdateQuantity={onUpdateQuantity}
              onUpdateNotes={onUpdateNotes}
              onDecrementRequest={onDecrementRequest}
            />
          </View>
          {items.length > 0 && (
            <View style={styles.footer}>
              <Text style={styles.totalLabel}>Total: ₹{grandTotal.toFixed(0)}</Text>
              <TouchableOpacity
                style={[styles.placeBtn, isPlacing && styles.placeBtnDisabled]}
                onPress={onPlaceOrder}
                disabled={isPlacing}
              >
                {isPlacing ? (
                  <ActivityIndicator color="#0F172A" size="small" />
                ) : (
                  <Text style={styles.placeBtnText}>Place order</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#334155' },
  title: { fontSize: 20, fontWeight: '800', color: '#F8FAFC' },
  closeText: { color: '#FFD700', fontWeight: '600' },
  listWrap: { maxHeight: 400 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#334155' },
  totalLabel: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 12 },
  placeBtn: { backgroundColor: '#FFD700', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  placeBtnDisabled: { opacity: 0.6 },
  placeBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 16 },
});
