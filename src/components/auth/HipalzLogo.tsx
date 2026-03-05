import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HipalzLogoProps {
  showIcon?: boolean;
}

export default function HipalzLogo({ showIcon = true }: HipalzLogoProps) {
  return (
    <View style={styles.wrapper}>
      {showIcon ? (
        <View style={styles.icon} />
      ) : null}
      <Text style={styles.brand}>HiPalz</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', marginBottom: 8 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFD700',
    marginBottom: 8,
  },
  brand: { fontSize: 28, fontWeight: '800', color: '#FFD700' },
});
