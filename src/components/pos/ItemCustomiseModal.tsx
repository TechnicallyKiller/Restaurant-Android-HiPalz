import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  SafeAreaView,
} from 'react-native';
import type { Item, ItemVariant, ItemAddon, CartConfig } from '../../api/types';
import { colors, borderBrutal, shadowBrutal } from '../../theme/neoBrutalism';

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

  useEffect(() => {
    if (visible && item) {
      setVariantId(null);
      setVariantName(null);
      setAddons([]);
      setNotes('');
      setQuantity(1);

      // Pre-select first variant if available
      if (item.itemVariants && item.itemVariants.length > 0) {
        const first = item.itemVariants[0];
        setVariantId(first.id);
        setVariantName(first.name);
      }
    }
  }, [visible, item]);

  const variants = item?.itemVariants || [];
  const itemAddons = item?.itemAddons || [];

  // Validation logic
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!item) return errors;

    // Check variant
    if (item.itemVariants && item.itemVariants.length > 0 && !variantId) {
      errors.push('Please select a variant');
    }

    // Check addon min/max
    itemAddons.forEach(group => {
      const groupChoiceIds = group.itemAddonChoices.map(c => c.id);
      const selectedInGroup = addons.filter(a => groupChoiceIds.includes(a.addonChoiceId));
      const totalSelected = selectedInGroup.reduce((sum, a) => sum + a.quantity, 0);

      const min = group.minQuantity ?? 0;
      const max = group.maxQuantity ?? 0;

      if (min > 0 && totalSelected < min) {
        errors.push(`Select at least ${min} from ${group.name}`);
      }
      if (max > 0 && totalSelected > max) {
        errors.push(`Maximum ${max} allowed for ${group.name}`);
      }
    });

    return errors;
  }, [item, variantId, addons, itemAddons]);

  const isConfigValid = validationErrors.length === 0;

  const basePrice = useMemo(() => {
    if (!item) return 0;
    let total = item.price;

    if (variantId) {
      const v = variants.find(v => v.id === variantId);
      if (v) {
        total = v.price ?? (item.price + (v.priceModifier ?? 0));
      }
    }

    addons.forEach(a => {
      const group = itemAddons.find(g =>
        g.itemAddonChoices.some(c => c.id === a.addonChoiceId)
      );
      const choice = group?.itemAddonChoices.find(c => c.id === a.addonChoiceId);
      if (choice) {
        total += (choice.price ?? 0) * a.quantity;
      }
    });

    return total;
  }, [item, variantId, addons, variants, itemAddons]);

  const updateAddonQuantity = (groupId: string, choiceId: string, delta: number) => {
    const group = itemAddons.find(g => g.id === groupId);
    if (!group) return;

    setAddons(prev => {
      const existingIdx = prev.findIndex(a => a.addonChoiceId === choiceId);
      const next = [...prev];

      if (delta > 0) {
        // Max quantity check for the group
        const groupChoiceIds = group.itemAddonChoices.map(c => c.id);
        const totalInGroup = prev.filter(a => groupChoiceIds.includes(a.addonChoiceId))
                                 .reduce((s, a) => s + a.quantity, 0);
        
        if (group.maxQuantity && totalInGroup >= group.maxQuantity) {
          if (group.addOnChoiceType !== 'SINGLE') return prev;
        }

        if (group.addOnChoiceType === 'SINGLE') {
          const filtered = next.filter(a => !groupChoiceIds.includes(a.addonChoiceId) || a.addonChoiceId === choiceId);
          const idx = filtered.findIndex(a => a.addonChoiceId === choiceId);
          if (idx >= 0) {
            filtered[idx] = { ...filtered[idx], quantity: filtered[idx].quantity + delta };
          } else {
            filtered.push({ addonChoiceId: choiceId, quantity: delta });
          }
          return filtered;
        }

        if (existingIdx >= 0) {
          next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + delta };
        } else {
          next.push({ addonChoiceId: choiceId, quantity: delta });
        }
      } else {
        if (existingIdx >= 0) {
          const newQty = next[existingIdx].quantity + delta;
          if (newQty <= 0) {
            return next.filter((_, i) => i !== existingIdx);
          }
          next[existingIdx] = { ...next[existingIdx], quantity: newQty };
        }
      }
      return next;
    });
  };

  const handleAdd = () => {
    if (!item || !isConfigValid) return;

    const config: CartConfig = {
      variantId: variantId || undefined,
      variantName: variantName || undefined,
      addons: addons.map(a => ({
        addonChoiceId: a.addonChoiceId,
        quantity: a.quantity,
      })),
      notes: notes || undefined,
    };

    onAdd(config, quantity);
    onClose();
  };


  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.itemName} numberOfLines={1}>{item?.name}</Text>
          <Pressable
            style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={onClose}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {item && variants.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.label}>Variant Selection</Text>
              <View style={styles.variantRow}>
                {variants.map(v => (
                  <Pressable
                    key={v.id}
                    style={({ pressed }) => [
                      styles.variantBtn,
                      variantId === v.id && styles.variantBtnActive,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={() => {
                      setVariantId(v.id);
                      setVariantName(v.name);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.variantText}>{v.name}</Text>
                      <Text style={styles.variantPrice}>
                        ₹{v.price ?? item.price + (v.priceModifier ?? 0)}
                      </Text>
                    </View>
                    {variantId === v.id && <View style={styles.checkIcon} />}
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {item && itemAddons.length > 0 && (
            <View style={styles.section}>
              <View style={styles.addonList}>
                {itemAddons.map(addon => (
                  <View key={addon.id} style={styles.addonGroup}>
                    <View style={styles.addonGroupHeader}>
                      <Text style={styles.addonGroupName}>
                        {addon.name}
                        <Text style={styles.addonGroupInfo}>
                          {addon.minQuantity ? ` • Required (${addon.minQuantity})` : ' • Optional'}
                          {addon.maxQuantity ? ` • Max: ${addon.maxQuantity}` : ''}
                        </Text>
                      </Text>
                    </View>
                    {addon.itemAddonChoices.map(choice => {
                      const entry = addons.find(a => a.addonChoiceId === choice.id);
                      const q = entry?.quantity ?? 0;
                      const isSelected = q > 0;
                      
                      return (
                        <View
                          key={choice.id}
                          style={[
                            styles.addonChoice,
                            isSelected && styles.addonChoiceSelected,
                          ]}
                        >
                          <View style={styles.addonChoiceInfo}>
                            <Text style={styles.addonChoiceName}>{choice.name}</Text>
                            <Text style={styles.addonChoicePrice}>+ ₹{choice.price}</Text>
                          </View>
                          
                          <View style={styles.addonActionContainer}>
                            {isSelected ? (
                              <View style={styles.stepperContainer}>
                                <Pressable
                                  style={styles.circularBtn}
                                  onPress={() => updateAddonQuantity(addon.id, choice.id, -1)}
                                  hitSlop={10}
                                >
                                  <Text style={styles.stepperIcon}>−</Text>
                                </Pressable>
                                <View style={styles.qtyDisplay}>
                                  <Text style={styles.qtyValue}>{q}</Text>
                                </View>
                                <Pressable
                                  style={styles.circularBtn}
                                  onPress={() => updateAddonQuantity(addon.id, choice.id, 1)}
                                  hitSlop={10}
                                >
                                  <Text style={styles.stepperIcon}>+</Text>
                                </Pressable>
                              </View>
                            ) : (
                              <Pressable
                                style={styles.addBtnSmall}
                                onPress={() => updateAddonQuantity(addon.id, choice.id, 1)}
                              >
                                <Text style={styles.addBtnSmallText}>ADD</Text>
                              </Pressable>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Instructions</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. No onion, extra spicy..."
              placeholderTextColor="#64748B"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          <View style={styles.quantitySection}>
            <Text style={styles.label}>Quantity</Text>
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setQuantity(q => Math.max(1, q - 1))}
                hitSlop={10}
              >
                <Text style={styles.stepperText}>−</Text>
              </Pressable>
              <Text style={styles.quantityText}>{quantity}</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={() => setQuantity(q => q + 1)}
                hitSlop={10}
              >
                <Text style={styles.stepperText}>+</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {item && (
          <View style={styles.footer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.total}>₹{(basePrice * quantity).toFixed(0)}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.addBtn,
                !isConfigValid && styles.addBtnDisabled,
                { opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={handleAdd}
              disabled={!isConfigValid}
            >
              <Text style={[styles.addBtnText, !isConfigValid && styles.addBtnTextDisabled]}>
                {isConfigValid ? 'Confirm Item' : 'Required'}
              </Text>
            </Pressable>
          </View>
        )}

        {validationErrors.length > 0 && (
          <View style={styles.errorBanner}>
            {validationErrors.map((err, idx) => (
              <Text key={idx} style={styles.errorText}>
                • {err}
              </Text>
            ))}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#0F172A',
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  closeBtnText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  itemName: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: '#FFF', 
    flex: 1,
    marginRight: 10,
  },
  section: { marginBottom: 30 },
  label: { 
    fontSize: 13, 
    color: '#94A3B8', 
    marginBottom: 12, 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  variantBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    minWidth: '47%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  variantBtnActive: {
    backgroundColor: '#2A3A4A',
    borderColor: '#475569',
    borderWidth: 2,
  },
  variantText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  variantPrice: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginTop: 2 },
  checkIcon: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.tertiary,
  },
  addonList: { marginTop: 4 },
  addonGroup: { marginBottom: 28 },
  addonGroupHeader: {
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  addonGroupName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  addonGroupInfo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'none',
  },
  addonChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addonChoiceSelected: {
    backgroundColor: '#2A3A4A',
    borderColor: '#475569',
    borderWidth: 2,
  },
  addonChoiceInfo: { flex: 1 },
  addonChoiceName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  addonChoicePrice: { fontSize: 12, color: colors.tertiary, marginTop: 2, fontWeight: '700' },
  addonActionContainer: { width: 120, alignItems: 'flex-end' },
  addBtnSmall: {
    backgroundColor: '#334155',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 85,
    alignItems: 'center',
  },
  addBtnSmallText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.tertiary,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 4,
  },
  circularBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperIcon: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
  },
  qtyDisplay: {
    minWidth: 36,
    alignItems: 'center',
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFF',
  },
  notesInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    minHeight: 100,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 15,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 16,
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 16,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  stepperBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#334155', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  stepperText: { fontSize: 20, color: '#FFF', fontWeight: '800' },
  quantityText: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  footer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingVertical: 20,
    backgroundColor: '#0F172A',
  },
  totalLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '900',
    letterSpacing: 1,
  },
  total: { fontSize: 24, fontWeight: '900', color: colors.tertiary },
  addBtn: { 
    flex: 1, 
    backgroundColor: colors.tertiary, 
    paddingVertical: 18, 
    borderRadius: 16, 
    alignItems: 'center',
    ...shadowBrutal,
  },
  addBtnDisabled: { backgroundColor: '#334155', opacity: 0.5 },
  addBtnText: { color: '#000', fontWeight: '900', fontSize: 16, textTransform: 'uppercase' },
  addBtnTextDisabled: { color: '#94A3B8' },
  errorBanner: {
    marginBottom: 10,
    padding: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
});
