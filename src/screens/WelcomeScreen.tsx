import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FIXED_SERVER_BASE_URL } from '../config/env';
import type { RootStackParamList } from '../navigation/types';

type WelcomeNav = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

const WelcomeScreen = () => {
  const navigation = useNavigation<WelcomeNav>();

  const handleEnterTerminal = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <Text style={styles.brand}>HiPalz</Text>
        <Text style={styles.title}>Restaurant Terminal</Text>

        <View style={styles.statusCard}>
          <View style={styles.successIcon}>
            <Text style={styles.check}>✓</Text>
          </View>
          <Text style={styles.statusText}>Connected to Server</Text>
          <Text style={styles.ipLabel}>Server URL:</Text>
          <Text style={styles.ipText}>{FIXED_SERVER_BASE_URL}</Text>
          <TouchableOpacity style={styles.button} onPress={handleEnterTerminal}>
            <Text style={styles.buttonText}>Enter Terminal</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          v1.0.0 • Connected to Local Network
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  brand: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 40,
  },
  statusCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  ipLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ipText: {
    fontSize: 18,
    fontFamily: 'monospace',
    color: '#FFD700',
    marginBottom: 30,
    fontWeight: '700',
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  check: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#475569',
    fontSize: 12,
  },
});

export default WelcomeScreen;
