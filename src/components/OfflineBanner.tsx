import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useErrorStore } from '../store/errorStore';

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
    backgroundColor: '#B45309',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
