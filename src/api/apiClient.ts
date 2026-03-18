import axios, { AxiosError } from 'axios';
import { CONFIG } from '../config/env';
import { API_SERVER_SECRET, TOKEN } from '../config/serverConfig';
import { ApiError } from './ApiError';
import type { ApiResponse } from './types';
import { useErrorStore } from '../store/errorStore';
import { discoveryService } from '../services/discoveryService';

const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 5000,
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
      useErrorStore.getState().setOffline(false);
    } catch {
      // ignore if store not ready
    }
    return res;
  },
  (err: AxiosError<ApiResponse<unknown>>) => {
    const config = err.config;

    // DETECT NETWORK ERRORS (No response from server)
    const isNetworkError =
      !err.response ||
      err.code === 'ECONNABORTED' ||
      err.message === 'Network Error';
    const isAborted =
      err.code?.includes('ABORT') || err.message?.includes('abort');

    console.log('🔴 [API-Error]', {
      url: config?.url,
      code: err.code,
      message: err.message,
      isNetworkError,
      _isRetry: (config as any)?._isRetry,
    });

    // Auto-discovery on network error (but not on intentional aborts)
    if (isNetworkError && !isAborted && config && !(config as any)._isRetry) {
      (config as any)._isRetry = true;
      console.warn(
        '[API] Connection lost! Starting background re-discovery...',
      );

      // Discovery service used for re-discovery
      return discoveryService.reDiscoverServer()
        .then((newUrl: string | null) => {
          if (newUrl) {
            console.log(
              '🟢 [API] Server re-discovered! Retrying original request...',
            );
            config.baseURL = newUrl;
            return apiClient(config);
          }
          console.error('❌ [API] Re-discovery failed.');
          throw err;
        })
        .catch((discoErr: any) => {
          console.error('❌ [API] Error during re-discovery:', discoErr);
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
