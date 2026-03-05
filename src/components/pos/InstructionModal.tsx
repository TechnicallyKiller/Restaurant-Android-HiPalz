import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

const MAX_LENGTH = 50;
const CHIPS = ['Less spicy', 'Extra spicy', 'No salt', 'Well done', 'No onion'];

interface InstructionModalProps {
  visible: boolean;
  initialNote: string;
  onClose: () => void;
  onSave: (note: string) => void;
}

export default function InstructionModal({
  visible,
  initialNote,
  onClose,
  onSave,
}: InstructionModalProps) {
  const [text, setText] = useState(initialNote);

  useEffect(() => {
    if (visible) setText(initialNote);
  }, [visible, initialNote]);

  const appendChip = (chip: string) => {
    const trimmed = text.trim();
    const add = trimmed ? `, ${chip}` : chip;
    const next = (trimmed + add).slice(0, MAX_LENGTH);
    setText(next);
  };

  const handleSave = () => {
    onSave(text.trim());
    onClose();
  };

  if (!visible) return null;

  const isEdit = initialNote.trim().length > 0;

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{isEdit ? 'Edit instruction' : 'Add instruction'}</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Less spicy, no onion"
            placeholderTextColor="#64748B"
            value={text}
            onChangeText={t => setText(t.slice(0, MAX_LENGTH))}
            maxLength={MAX_LENGTH}
            multiline
          />
          <Text style={styles.chars}>{text.length}/{MAX_LENGTH}</Text>
          <View style={styles.chipRow}>
            {CHIPS.map(c => (
              <TouchableOpacity key={c} style={styles.chip} onPress={() => appendChip(c)}>
                <Text style={styles.chipText}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  title: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 12 },
  input: {
    backgroundColor: '#334155',
    borderRadius: 10,
    padding: 14,
    color: '#F8FAFC',
    minHeight: 56,
    marginBottom: 4,
  },
  chars: { fontSize: 11, color: '#64748B', marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { backgroundColor: '#334155', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  chipText: { color: '#94A3B8', fontSize: 13 },
  footer: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#334155', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#F8FAFC', fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: '#FFD700', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#0F172A', fontWeight: '700' },
});
