import axios from 'axios';
import { CONFIG } from '../config/env';

const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Template function for the client to fetch loyalty points
export const getLoyaltyStatus = async (customerPhone) => {
  const response = await apiClient.get(`/loyalty/${customerPhone}`);
  return response.data;
};

export default apiClient;