import AsyncStorage from '@react-native-async-storage/async-storage';

/** Fixed server URL for the mini server (ping: http://10.71.176.213:3333/ping) */
export const FIXED_SERVER_BASE_URL = 'http://10.71.176.213:3333';

export const CONFIG = {
  SOCKET_URL: 'http://192.168.1.50:3000',
  API_BASE_URL: FIXED_SERVER_BASE_URL,
};

export const setDynamicBaseUrl = (url: string) => {
  console.log('[Config] Setting API Base URL to:', url);
  CONFIG.API_BASE_URL = url;
};

export const loadSavedConfig = async () => {
  try {
    const savedUrl = await AsyncStorage.getItem('server_url');
    if (savedUrl) {
      setDynamicBaseUrl(savedUrl);
      return savedUrl;
    }
  } catch (err) {
    console.error('[Config] Failed to load saved config:', err);
  }
  return FIXED_SERVER_BASE_URL;
};
