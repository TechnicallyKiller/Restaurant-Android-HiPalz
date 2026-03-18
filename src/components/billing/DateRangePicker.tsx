import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Dimensions,
  TextInput,
  ScrollView,
} from 'react-native';
import { colors, neoCard, borderBrutal, neoInput, shadowBrutal } from '../../theme/neoBrutalism';
import { getRangeForPreset, formatDate, validateRange } from '../../utils/dateUtils';

const { width } = Dimensions.get('window');

type DatePreset = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'custom';

interface DateRange {
  from: number;
  to: number;
}

interface DateRangePickerProps {
  onRangeChange: (range: DateRange) => void;
  preset?: DatePreset;
  initialRange?: DateRange;
}

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'Week' },
  { key: 'thisMonth', label: 'Month' },
  { key: 'custom', label: 'Custom' },
];

export default function DateRangePicker({ 
  onRangeChange, 
  preset: initialPreset = 'today', 
  initialRange 
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>(initialPreset);
  const [currentRange, setCurrentRange] = useState<DateRange>(
    initialRange || getRangeForPreset('today')
  );

  // For custom range inputs
  const [customFrom, setCustomFrom] = useState(formatDate(currentRange.from));
  const [customTo, setCustomTo] = useState(formatDate(currentRange.to));
  const [error, setError] = useState<string | null>(null);

  const triggerLabel = useMemo(() => {
    const rangeStr = `${formatDate(currentRange.from)} to ${formatDate(currentRange.to)}`;
    if (selectedPreset === 'custom') return rangeStr;
    const label = PRESETS.find(p => p.key === selectedPreset)?.label;
    return `${label} (${rangeStr})`;
  }, [selectedPreset, currentRange]);

  const handleSelectPreset = (preset: DatePreset) => {
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      const range = getRangeForPreset(preset);
      setCurrentRange(range);
      onRangeChange(range);
      setIsOpen(false);
    }
  };

  const handleCustomConfirm = () => {
    // Basic date parsing (DD-MMM-YYYY)
    const parse = (str: string) => {
      const parts = str.split('-');
      if (parts.length !== 3) return NaN;
      const day = parseInt(parts[0]);
      const monthStr = parts[1];
      const year = parseInt(parts[2]);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = months.findIndex(m => m.toLowerCase() === monthStr.toLowerCase());
      if (monthIdx === -1) return NaN;
      return new Date(year, monthIdx, day).getTime();
    };

    const fromTs = parse(customFrom);
    const toTs = parse(customTo);

    if (isNaN(fromTs) || isNaN(toTs)) {
      setError('Invalid date format (DD-MMM-YYYY)');
      return;
    }

    const { valid, error: validationError } = validateRange(fromTs, toTs);
    if (!valid) {
      setError(validationError || 'Unknown validation error');
      return;
    }

    const range = { from: fromTs, to: toTs };
    setCurrentRange(range);
    onRangeChange(range);
    setError(null);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* Trigger Button */}
      <Pressable
        style={({ pressed }) => [
          styles.trigger,
          neoCard,
          { opacity: pressed ? 0.8 : 1 }
        ]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <View style={styles.triggerContent}>
          <Text style={styles.calendarIcon}>📅</Text>
          <Text style={styles.triggerText} numberOfLines={1}>
            {triggerLabel}
          </Text>
          <Text style={[styles.chevron, { transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }]}>
            ▼
          </Text>
        </View>
      </Pressable>

      <Modal transparent visible={isOpen} animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
          <View style={[styles.dropdown, neoCard]}>
            <View style={styles.presetsRow}>
              {PRESETS.map(p => (
                <Pressable
                  key={p.key}
                  style={({ pressed }) => [
                    styles.presetBtn,
                    selectedPreset === p.key && styles.presetBtnActive,
                    { opacity: pressed ? 0.7 : 1 }
                  ]}
                  onPress={() => handleSelectPreset(p.key)}
                >
                  <Text style={[
                    styles.presetBtnText,
                    selectedPreset === p.key && styles.presetBtnTextActive
                  ]}>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {selectedPreset === 'custom' && (
              <View style={styles.customSection}>
                <View style={styles.dateInputs}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>FROM</Text>
                    <TextInput
                      style={styles.brutalInput}
                      value={customFrom}
                      onChangeText={v => { setCustomFrom(v); setError(null); }}
                      placeholder="DD-MMM-YYYY"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>TO</Text>
                    <TextInput
                      style={styles.brutalInput}
                      value={customTo}
                      onChangeText={v => { setCustomTo(v); setError(null); }}
                      placeholder="DD-MMM-YYYY"
                    />
                  </View>
                </View>
                
                {error && <Text style={styles.errorText}>{error}</Text>}

                <Pressable
                  style={({ pressed }) => [
                    styles.confirmBtn,
                    { opacity: pressed ? 0.7 : 1 }
                  ]}
                  onPress={handleCustomConfirm}
                >
                  <Text style={styles.confirmBtnText}>Apply Custom Range</Text>
                </Pressable>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    zIndex: 100,
  },
  trigger: {
    backgroundColor: colors.base200,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.brutalBorder,
    ...shadowBrutal,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: colors.foreground,
    letterSpacing: 0.5,
  },
  chevron: {
    fontSize: 12,
    color: colors.foreground,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingTop: 100, // Adjust based on layout
    alignItems: 'center',
  },
  dropdown: {
    width: width - 32,
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 16,
    ...borderBrutal,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.base200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.brutalBorder,
  },
  presetBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  presetBtnTextActive: {
    color: colors.background,
  },
  customSection: {
    borderTopWidth: 2,
    borderTopColor: colors.brutalBorder,
    paddingTop: 16,
  },
  dateInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.mutedForeground,
    marginBottom: 4,
    letterSpacing: 1,
  },
  brutalInput: {
    ...neoInput,
    backgroundColor: colors.base100,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '800',
    color: colors.foreground,
  },
  errorText: {
    color: colors.error,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
  },
  confirmBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    ...borderBrutal,
    borderColor: colors.brutalBorder,
  },
  confirmBtnText: {
    color: colors.foreground,
    fontWeight: '900',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
