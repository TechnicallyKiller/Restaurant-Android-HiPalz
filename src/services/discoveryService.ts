import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkInfo } from 'react-native-network-info';
import { updateApiClientBaseUrl } from '../api/apiClient';
import { setDynamicBaseUrl } from '../config/env';
import { findServerConnection } from './connection';

/**
 * Centiralized service to handle server discovery and configuration updates.
 */
export const discoveryService = {
  /**
   * Performs a full discovery scan and updates all relevant configurations.
   * @returns The discovered server URL or null if failed.
   */
  reDiscoverServer: async (): Promise<string | null> => {
    console.log('[DiscoveryService] Starting re-discovery...');
    try {
      const deviceIp = await NetworkInfo.getIPV4Address();
      const result = await findServerConnection(deviceIp || undefined);

      if (result.success && result.ip) {
        const fullUrl = `http://${result.ip}`;
        console.log('[DiscoveryService] Server re-discovered at:', fullUrl);

        // Update all configuration layers
        setDynamicBaseUrl(fullUrl);
        updateApiClientBaseUrl(fullUrl);
        await AsyncStorage.setItem('server_url', fullUrl);

        return fullUrl;
      }
    } catch (err) {
      console.error('[DiscoveryService] Re-discovery failed:', err);
    }
    return null;
  },
};
