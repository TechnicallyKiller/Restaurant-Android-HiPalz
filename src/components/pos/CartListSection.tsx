import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import type { CartItem } from '../../api/types';
import type { AttributeValueType } from '../../api/types';
import InstructionModal from './InstructionModal';

const ATTR_COLORS: Record<AttributeValueType, { border: string; fill: string }> = {
  1: { border: '#22C55E', fill: '#22C55E' },
  2: { border: '#EF4444', fill: '#EF4444' },
  3: { border: '#EAB308', fill: '#EAB308' },
};

export interface CartListSectionProps {
  items: CartItem[];
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onUpdateNotes: (cartId: string, notes: string) => void;
  /** When provided, called on minus tap so parent can show "which line" modal if multiple for same item */
  onDecrementRequest?: (line: CartItem) => void;
}

function CartLineRow({
  line,
  onUpdateQuantity,
  onDecrementRequest,
  onAddInstruction,
}: {
  line: CartItem;
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onDecrementRequest?: (line: CartItem) => void;
  onAddInstruction: () => void;
}) {
  const attrStyle = line.attribute ? ATTR_COLORS[line.attribute] : null;
  const portion = line.variantName
    ? `Portion: ${line.variantName} (₹${line.basePrice.toFixed(0)})`
    : null;
  const addonLines =
    line.addons.length > 0
      ? line.addons.map(
          a => `Extra: ${a.addonName}${a.quantity > 1 ? ` ×${a.quantity}` : ''} (₹${a.price.toFixed(0)})`,
        )
      : [];

  const handleMinus = () => {
    if (onDecrementRequest) onDecrementRequest(line);
    else onUpdateQuantity(line.cartId, -1);
  };

  return (
    <View style={styles.lineCard}>
      <View style={styles.lineHeader}>
        <View style={[styles.attrDot, attrStyle && { borderColor: attrStyle.border }]}>
          {attrStyle ? <View style={[styles.attrInner, { backgroundColor: attrStyle.fill }]} /> : null}
        </View>
        <View style={styles.lineTitleBlock}>
          <Text style={styles.lineName}>{line.name}</Text>
          {portion ? <Text style={styles.lineMeta}>{portion}</Text> : null}
          {addonLines.map((t, i) => (
            <Text key={i} style={styles.lineMeta}>{t}</Text>
          ))}
        </View>
        <Text style={styles.linePrice}>₹{line.totalPrice.toFixed(0)}</Text>
      </View>
      <View style={styles.lineActions}>
        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={handleMinus} accessibilityLabel="Decrease quantity">
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{line.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onUpdateQuantity(line.cartId, 1)}
            accessibilityLabel="Increase quantity"
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        {line.notes?.trim() ? (
          <TouchableOpacity style={styles.noteBtn} onPress={onAddInstruction}>
            <Text style={styles.noteText} numberOfLines={1}>{line.notes.trim()}</Text>
            <Text style={styles.editHint}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.addNoteBtn} onPress={onAddInstruction}>
            <Text style={styles.addNoteText}>Add instruction</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function CartListSection({
  items,
  onUpdateQuantity,
  onUpdateNotes,
  onDecrementRequest,
}: CartListSectionProps) {
  const [instructionCartId, setInstructionCartId] = useState<string | null>(null);
  const lineForInstruction = instructionCartId ? items.find(i => i.cartId === instructionCartId) : null;

  return (
    <>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {items.length === 0 ? (
          <Text style={styles.empty}>Cart is empty</Text>
        ) : (
          items.map(line => (
            <CartLineRow
              key={line.cartId}
              line={line}
              onUpdateQuantity={onUpdateQuantity}
              onDecrementRequest={onDecrementRequest}
              onAddInstruction={() => setInstructionCartId(line.cartId)}
            />
          ))
        )}
      </ScrollView>
      <InstructionModal
        visible={Boolean(instructionCartId && lineForInstruction)}
        initialNote={lineForInstruction?.notes ?? ''}
        onClose={() => setInstructionCartId(null)}
        onSave={note => {
          if (instructionCartId) {
            onUpdateNotes(instructionCartId, note);
            setInstructionCartId(null);
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 24 },
  empty: { color: '#64748B', textAlign: 'center', padding: 24 },
  lineCard: { backgroundColor: '#334155', borderRadius: 12, padding: 14, marginBottom: 12 },
  lineHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  attrDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#64748B', marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  attrInner: { width: 6, height: 6, borderRadius: 3 },
  lineTitleBlock: { flex: 1 },
  lineName: { fontSize: 15, fontWeight: '700', color: '#F8FAFC' },
  lineMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  linePrice: { fontSize: 15, fontWeight: '700', color: '#FFD700' },
  lineActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { color: '#F8FAFC', fontWeight: '700', fontSize: 16 },
  qtyValue: { fontSize: 14, fontWeight: '700', color: '#F8FAFC', minWidth: 20, textAlign: 'center' },
  addNoteBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  addNoteText: { color: '#FFD700', fontSize: 13, fontWeight: '600' },
  noteBtn: { flex: 1, marginLeft: 12 },
  noteText: { color: '#94A3B8', fontSize: 12 },
  editHint: { color: '#FFD700', fontSize: 11, marginTop: 2 },
});
