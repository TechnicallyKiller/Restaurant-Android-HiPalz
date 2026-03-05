import apiClient, { parseApiResponse } from './apiClient';
import type {
  StaffLoginPayload,
  StaffLoginResponse,
  ApiResponse,
} from './types';

export async function staffLogin(
  phone: string,
  password: string,
): Promise<StaffLoginResponse> {
  const payload: StaffLoginPayload = { phone, password };
  const res = await apiClient.post<ApiResponse<StaffLoginResponse>>(
    '/r/auth/login/staff',
    payload,
  );
  return parseApiResponse(res);
}
