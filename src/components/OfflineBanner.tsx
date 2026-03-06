import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useErrorStore } from '../store/errorStore';
import { colors } from '../theme/neoBrutalism';

export default function OfflineBanner() {
  const isOffline = useErrorStore(s => s.isOffline);
  if (!isOffline) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>No connection. Check your network.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warning,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: colors.brutalBorder,
  },
  text: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
