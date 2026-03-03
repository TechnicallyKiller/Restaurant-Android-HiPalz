import axios from 'axios';
import { CONFIG } from '../config/env';

const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const updateApiClientBaseUrl = (url: string) => {
  apiClient.defaults.baseURL = url;
};

export default apiClient;
