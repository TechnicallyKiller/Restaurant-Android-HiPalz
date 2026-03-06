import axios, { AxiosError } from 'axios';
import { CONFIG } from '../config/env';
import { API_SERVER_SECRET, TOKEN } from '../config/serverConfig';
import { ApiError } from './ApiError';
import type { ApiResponse } from './types';

const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'api-server-secret': API_SERVER_SECRET,
  },
});

export const updateApiClientBaseUrl = (url: string) => {
  apiClient.defaults.baseURL = url;
};

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

apiClient.interceptors.request.use(config => {
  config.headers['api-server-secret'] = API_SERVER_SECRET;
  config.headers['x-pos-token'] = TOKEN;
  return config;
});

apiClient.interceptors.response.use(
  res => {
    try {
      require('../store/errorStore').useErrorStore.getState().setOffline(false);
    } catch {
      // ignore if store not ready
    }
    return res;
  },
  (err: AxiosError<ApiResponse<unknown>>) => {
    const config = err.config;
    const isNetworkError = !err.response && !err.code?.includes('ABORT');

    // Auto-discovery on network error
    if (isNetworkError && config && !(config as any)._isRetry) {
      (config as any)._isRetry = true;
      console.log(
        '[API] Network error detected, trying to re-discover server...',
      );

      // Dynamic import to avoid circular dependency
      return require('../services/discoveryService')
        .discoveryService.reDiscoverServer()
        .then((newUrl: string | null) => {
          if (newUrl) {
            console.log('[API] Server re-discovered, retrying request...');
            config.baseURL = newUrl;
            return apiClient(config);
          }
          throw err;
        })
        .catch(() => {
          throw err;
        });
    }

    const status = err.response?.status;
    const body = err.response?.data;
    const code = body?.statusCode ?? status ?? 500;
    const message = body?.message ?? err.message ?? 'Request failed';
    if (typeof code === 'number' && code >= 400) {
      throw new ApiError(code, message, body);
    }
    if (
      body &&
      typeof body === 'object' &&
      'success' in body &&
      body.success === false
    ) {
      throw new ApiError(code, message, body);
    }
    throw new ApiError(status ?? 500, message, body);
  },
);

export function parseApiResponse<T>(res: { data: ApiResponse<T> }): T {
  const { success, data, message, statusCode } = res.data;
  if (!success) {
    const code = statusCode ?? 500;
    throw new ApiError(code, message ?? 'Request failed', res.data);
  }
  const code = statusCode ?? 200;
  if (code >= 400) {
    throw new ApiError(code, message ?? 'Request failed', res.data);
  }
  return data;
}

export { ApiError };
export default apiClient;
