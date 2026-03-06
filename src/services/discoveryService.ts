import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkInfo } from 'react-native-network-info';
import { updateApiClientBaseUrl } from '../api/apiClient';
import { setDynamicBaseUrl } from '../config/env';
import { findServerConnection } from './connection';

let pendingScan: Promise<string | null> | null = null;

/**
 * Centiralized service to handle server discovery and configuration updates.
 */
export const discoveryService = {
  /**
   * Performs a full discovery scan with concurrency control.
   */
  reDiscoverServer: async (): Promise<string | null> => {
    if (pendingScan) {
      console.log(
        '[DiscoveryService] Discovery already in progress, waiting...',
      );
      return pendingScan;
    }

    pendingScan = discoveryService._performDiscovery();
    try {
      return await pendingScan;
    } finally {
      pendingScan = null;
    }
  },

  /**
   * Internal discovery logic with multiple attempts
   */
  _performDiscovery: async (): Promise<string | null> => {
    console.log('[DiscoveryService] Starting organized re-discovery...');

    // Attempt 1-2: Aggressive Broadcast Discovery
    for (let i = 1; i <= 2; i++) {
      try {
        console.log(`[DiscoveryService] Broadcast Attempt ${i}/2...`);
        const deviceIp = await NetworkInfo.getIPV4Address();
        const result = await findServerConnection(deviceIp || undefined);

        if (result.success && result.ip) {
          const fullUrl = `http://${result.ip}`;
          console.log(
            '🌟 [DiscoveryService] Server found via broadcast at:',
            fullUrl,
          );
          await discoveryService.applyNewUrl(fullUrl);
          return fullUrl;
        }
      } catch (err) {
        console.warn(`[DiscoveryService] Broadcast ${i} failed:`, err);
      }
      if (i < 2) await new Promise(r => setTimeout(r, 1000));
    }

    // Attempt 3: Fallback to Origin IP (Fixed)
    try {
      const { FIXED_SERVER_BASE_URL } = require('../config/env');
      if (FIXED_SERVER_BASE_URL) {
        console.log(
          '[DiscoveryService] Checking Origin IP fallback:',
          FIXED_SERVER_BASE_URL,
        );
        const urlWithoutProtocol = FIXED_SERVER_BASE_URL.replace('http://', '');
        const [oIp, oPort] = urlWithoutProtocol.split(':');
        const originCheck = await require('./connection').pingIp(
          oIp,
          oPort ? parseInt(oPort) : 3333,
          3000,
        );
        if (originCheck.success) {
          console.log('🌟 [DiscoveryService] Found server at Origin IP!');
          await discoveryService.applyNewUrl(FIXED_SERVER_BASE_URL);
          return FIXED_SERVER_BASE_URL;
        }
      }
    } catch (e) {}

    console.error('❌ [DiscoveryService] All re-discovery attempts failed.');
    return null;
  },

  /**
   * Helper to update all URL-dependent layers
   */
  applyNewUrl: async (url: string) => {
    console.log('[DiscoveryService] Applying new URL:', url);
    setDynamicBaseUrl(url);
    updateApiClientBaseUrl(url);
    await AsyncStorage.setItem('server_url', url);
  },
};
