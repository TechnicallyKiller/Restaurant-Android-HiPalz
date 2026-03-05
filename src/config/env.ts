/** Fixed server URL for the mini server (ping: http://10.71.176.213:3333/ping) */
export const FIXED_SERVER_BASE_URL = 'http://10.71.176.213:3333';

export const CONFIG = {
  SOCKET_URL: 'http://192.168.1.50:3000',
  API_BASE_URL: FIXED_SERVER_BASE_URL,
};

export const setDynamicBaseUrl = (url: string) => {
  CONFIG.API_BASE_URL = url;
};
