import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import type { Item, ItemVariant, ItemAddon, CartConfig } from '../../api/types';

interface ItemCustomiseModalProps {
  visible: boolean;
  item: Item | null;
  onClose: () => void;
  onAdd: (config: CartConfig, quantity: number) => void;
}

export default function ItemCustomiseModal({
  visible,
  item,
  onClose,
  onAdd,
}: ItemCustomiseModalProps) {
  const [variantId, setVariantId] = useState<string | null>(null);
  const [variantName, setVariantName] = useState<string | null>(null);
  const [addons, setAddons] = useState<{ addonChoiceId: string; quantity: number }[]>([]);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  const variants = item?.itemVariants ?? [];
  const itemAddons = item?.itemAddons ?? [];

  const basePrice = useMemo(() => {
    if (!item) return 0;
    if (variantId) {
      const v = item.itemVariants?.find(x => x.id === variantId);
      return v ? (v.price ?? item.price + (v.priceModifier ?? 0)) : item.price;
    }
    return item.price;
  }, [item, variantId]);

  const reset = () => {
    setVariantId(null);
    setVariantName(null);
    setAddons([]);
    setNotes('');
    setQuantity(1);
  };

  const handleAdd = () => {
    if (!item) return;
    const config: CartConfig = {
      variantId: variantId ?? undefined,
      variantName: variantName ?? undefined,
      addons: addons.filter(a => a.quantity > 0),
      notes: notes.trim() || undefined,
    };
    onAdd(config, quantity);
    reset();
    onClose();
  };

  const toggleAddon = (choiceId: string, name: string, maxQty = 5) => {
    setAddons(prev => {
      const i = prev.findIndex(a => a.addonChoiceId === choiceId);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity >= maxQty ? 0 : next[i].quantity + 1 };
        if (next[i].quantity === 0) return next.filter((_, j) => j !== i);
        return next;
      }
      return [...prev, { addonChoiceId: choiceId, quantity: 1 }];
    });
  };

  if (!item) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.itemName}>{item.name}</Text>

        {variants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Variant</Text>
            <View style={styles.variantRow}>
              {variants.map(v => (
                <TouchableOpacity
                  key={v.id}
                  style={[
                    styles.variantBtn,
                    variantId === v.id && styles.variantBtnActive,
                  ]}
                  onPress={() => {
                    setVariantId(v.id);
                    setVariantName(v.name);
                  }}
                >
                  <Text style={styles.variantText}>{v.name}</Text>
                  <Text style={styles.variantPrice}>
                    ₹{v.price ?? item.price + (v.priceModifier ?? 0)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {itemAddons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Add-ons</Text>
            <ScrollView style={styles.addonList}>
              {itemAddons.map(addon => (
                <View key={addon.id} style={styles.addonGroup}>
                  <Text style={styles.addonName}>{addon.name}</Text>
                  {addon.itemAddonChoices.map(choice => {
                    const entry = addons.find(a => a.addonChoiceId === choice.id);
                    const q = entry?.quantity ?? 0;
                    return (
                      <TouchableOpacity
                        key={choice.id}
                        style={[styles.addonChoice, q > 0 && styles.addonChoiceActive]}
                        onPress={() => toggleAddon(choice.id, choice.name)}
                      >
                        <Text style={styles.addonChoiceText}>{choice.name}</Text>
                        <Text style={styles.addonChoicePrice}>₹{choice.price}</Text>
                        {q > 0 && <Text style={styles.addonQty}>×{q}</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Special instructions"
          placeholderTextColor="#64748B"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <View style={styles.quantityRow}>
          <Text style={styles.label}>Quantity</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setQuantity(q => Math.max(1, q - 1))}
            >
              <Text style={styles.stepperText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setQuantity(q => q + 1)}
            >
              <Text style={styles.stepperText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.total}>₹{(basePrice * quantity).toFixed(0)}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>Add to cart</Text>
          </TouchableOpacity>
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
  sheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  itemName: { fontSize: 20, fontWeight: '700', color: '#F8FAFC', marginBottom: 16 },
  section: { marginBottom: 16 },
  label: { fontSize: 12, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase' },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variantBtn: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  variantBtnActive: { backgroundColor: '#FFD700' },
  variantText: { color: '#F8FAFC', fontWeight: '600' },
  variantPrice: { fontSize: 12, color: '#94A3B8' },
  addonList: { maxHeight: 160 },
  addonGroup: { marginBottom: 12 },
  addonName: { fontSize: 14, fontWeight: '600', color: '#F8FAFC', marginBottom: 6 },
  addonChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  addonChoiceActive: { backgroundColor: '#334155', borderWidth: 2, borderColor: '#FFD700' },
  addonChoiceText: { flex: 1, color: '#F8FAFC' },
  addonChoicePrice: { color: '#FFD700', marginRight: 8 },
  addonQty: { color: '#94A3B8', fontWeight: '700' },
  notesInput: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    color: '#F8FAFC',
    minHeight: 60,
    marginBottom: 16,
  },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  stepperText: { fontSize: 20, color: '#F8FAFC', fontWeight: '700' },
  quantityText: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  total: { fontSize: 20, fontWeight: '800', color: '#FFD700' },
  addBtn: { flex: 1, backgroundColor: '#FFD700', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  addBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 16 },
});
