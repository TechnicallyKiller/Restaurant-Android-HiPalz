import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FIXED_SERVER_BASE_URL } from '../config/env';
import type { RootStackParamList } from '../navigation/types';
import { colors, neoCard, neoButtonTertiary, textUppercase } from '../theme/neoBrutalism';
import { NetworkInfo } from 'react-native-network-info';
import { findServerConnection, pingIp } from '../services/connection';
import AsyncStorage from '@react-native-async-storage/async-storage';

type WelcomeNav = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

const WelcomeScreen = () => {
  const navigation = useNavigation<WelcomeNav>();
  const [serverUrl, setServerUrl] = useState<string>(FIXED_SERVER_BASE_URL);
  const [isSearching, setIsSearching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    discoverServer();
  }, []);

  const discoverServer = async () => {
    if (isSearching && serverUrl !== FIXED_SERVER_BASE_URL) return;
    setIsSearching(true);
    setError(null);
    try {
      const { discoveryService } = require('../services/discoveryService');
      const newUrl = await discoveryService.reDiscoverServer();
      console.log('New URL:', newUrl);

      if (newUrl) {
        setServerUrl(newUrl);
        await discoveryService.applyNewUrl(newUrl);
        setIsSearching(false);
      } else {
        setError('Could not find server on local network.');
        setIsSearching(false);
      }
    } catch (err) {
      console.error('[Discovery] Error during discovery:', err);
      setError('An error occurred while searching for the server.');
      setIsSearching(false);
    }
  };

  const handleEnterTerminal = () => {
    navigation.replace('Login');
  };

  const renderStatus = () => {
    if (isSearching) {
      return (
        <View style={[styles.statusCard, cardStyle]}>
          <ActivityIndicator size="large" color={colors.tertiary} />
          <Text style={styles.statusText}>Searching for Server...</Text>
          <Text style={styles.ipLabel}>Scanning local network...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.statusCard, cardStyle]}>
          <View style={[styles.successIcon, { backgroundColor: colors.error }]}>
            <Text style={styles.check}>✕</Text>
          </View>
          <Text style={styles.statusText}>Server Not Found</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={[styles.button, btnStyle, { marginTop: 20 }]}
            onPress={discoverServer}
          >
            <Text style={styles.buttonText}>Retry Scan</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.statusCard, cardStyle]}>
        <View style={styles.successIcon}>
          <Text style={styles.check}>✓</Text>
        </View>
        <Text style={styles.statusText}>Connected to Server</Text>
        <Text style={styles.ipLabel}>Server URL:</Text>
        <Text style={styles.ipText}>{serverUrl}</Text>
        <TouchableOpacity style={[styles.button, btnStyle]} onPress={handleEnterTerminal}>
          <Text style={styles.buttonText}>Enter Terminal</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const cardStyle = { ...neoCard, width: '100%', padding: 40, alignItems: 'center' as const };
  const btnStyle = { ...neoButtonTertiary, paddingVertical: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center' as const };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <Text style={styles.brand}>HiPalz</Text>
        <Text style={styles.title}>HiPalz Restaurant Terminal</Text>
        {renderStatus()}
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          v1.1.0 •{' '}
          {isSearching ? 'Detecting Network...' : 'Connected to Local Network'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.tertiary,
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 40,
  },
  statusCard: {},
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: 20,
    marginBottom: 10,
  },
  ipLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ipText: {
    fontSize: 18,
    fontFamily: 'monospace',
    color: colors.tertiary,
    marginBottom: 30,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 10,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  check: {
    color: colors.primaryForeground,
    fontSize: 30,
    fontWeight: 'bold',
  },
  button: {},
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    ...textUppercase,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
});

export default WelcomeScreen;
