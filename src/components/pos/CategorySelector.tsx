import React from 'react';
import { View, ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import type { Category } from '../../api/types';
import { colors, borderBrutal } from '../../theme/neoBrutalism';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export default function CategorySelector({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategorySelectorProps) {
  return (
    <View style={styles.categoryListWrap}>
      <ScrollView
        style={styles.categoryList}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={({ pressed }) => [
            styles.categoryChip,
            !selectedCategoryId && styles.categoryChipActive,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => onSelectCategory(null)}
        >
          <Text
            style={[
              styles.categoryChipText,
              !selectedCategoryId && styles.categoryChipTextActive,
            ]}
            numberOfLines={1}
          >
            All
          </Text>
        </Pressable>
        {categories.map(cat => (
          <Pressable
            key={cat.id}
            style={({ pressed }) => [
              styles.categoryChip,
              selectedCategoryId === cat.id && styles.categoryChipActive,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => onSelectCategory(cat.id)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategoryId === cat.id && styles.categoryChipTextActive,
              ]}
              numberOfLines={2}
            >
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  categoryListWrap: {
    width: 100,
    borderRightWidth: 3,
    borderRightColor: colors.brutalBorder,
    paddingVertical: 8,
  },
  categoryList: { paddingHorizontal: 8 },
  categoryChip: {
    ...borderBrutal,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: colors.base200,
    marginBottom: 6,
    borderRadius: 12,
  },
  categoryChipActive: { backgroundColor: colors.tertiary },
  categoryChipText: {
    color: colors.foreground,
    fontWeight: '600',
    fontSize: 13,
  },
  categoryChipTextActive: { color: colors.background },
});
