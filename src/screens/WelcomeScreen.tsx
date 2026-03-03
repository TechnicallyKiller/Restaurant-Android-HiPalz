import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { findServerConnection } from '../services/connection';
import { setDynamicBaseUrl } from '../config/env';
import { updateApiClientBaseUrl } from '../api/apiClient';

const WelcomeScreen = () => {
  const [status, setStatus] = useState<'scanning' | 'found' | 'not_found'>(
    'scanning',
  );
  const [serverIp, setServerIp] = useState('');

  const startScan = async () => {
    setStatus('scanning');
    // In a real Android app, we'd get the device IP here.
    // For now, we'll let it scan common ranges.
    const result = await findServerConnection();

    if (result.success) {
      setServerIp(result.ip);
      setDynamicBaseUrl(`http://${result.ip}`);
      updateApiClientBaseUrl(`http://${result.ip}`);
      setStatus('found');
    } else {
      console.log('[Welcome] Server search failed or timed out.');
      setStatus('not_found');
    }
  };

  useEffect(() => {
    startScan();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <Text style={styles.brand}>HiPalz</Text>
        <Text style={styles.title}>Restaurant Terminal</Text>

        <View style={styles.statusCard}>
          {status === 'scanning' && (
            <>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.statusText}>
                Searching for local server...
              </Text>
              <Text style={styles.subStatusText}>
                Please ensure you are on the restaurant Wi-Fi
              </Text>
            </>
          )}

          {status === 'found' && (
            <>
              <View style={styles.successIcon}>
                <Text style={styles.check}>✓</Text>
              </View>
              <Text style={styles.statusText}>Connected to Server</Text>
              <Text style={styles.ipLabel}>Server URL:</Text>
              <Text style={styles.ipText}>{serverIp}</Text>
              <TouchableOpacity style={styles.button} onPress={() => {}}>
                <Text style={styles.buttonText}>Enter Terminal</Text>
              </TouchableOpacity>
            </>
          )}

          {status === 'not_found' && (
            <>
              <View style={styles.errorIcon}>
                <Text style={styles.cross}>×</Text>
              </View>
              <Text style={styles.statusText}>Server Not Found</Text>
              <Text style={styles.subStatusText}>
                Could not detect HiPalz server on this network.
              </Text>
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={startScan}
              >
                <Text style={styles.buttonText}>Retry Scan</Text>
              </TouchableOpacity>
            </>
          )}
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
  subStatusText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
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
  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cross: {
    color: '#FFFFFF',
    fontSize: 40,
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
  retryButton: {
    backgroundColor: '#334155',
    marginTop: 20,
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
