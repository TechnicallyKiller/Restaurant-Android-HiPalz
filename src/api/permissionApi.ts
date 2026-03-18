import apiClient, { parseApiResponse } from './apiClient';
import type { StaffPermission, VerifyPasswordPayload, VerifyPasswordResponse, ApiResponse } from './types';

export const permissionApi = {
  /**
   * List permissions for a staff member at an outlet.
   */
  listByStaffAndOutlet: async (outletId: string, staffId: string): Promise<StaffPermission[]> => {
    const response = await apiClient.get<ApiResponse<StaffPermission[]>>(`/r/staff-permissions`, {
      params: { outletId, staffId },
    });
    return parseApiResponse<StaffPermission[]>(response);
  },

  /**
   * Verify a PIN for a password-protected permission.
   */
  verifyPassword: async (payload: VerifyPasswordPayload): Promise<boolean> => {
    const response = await apiClient.post<ApiResponse<VerifyPasswordResponse>>(
      '/r/staff-permissions/verify-password',
      payload
    );
    const data = parseApiResponse<VerifyPasswordResponse>(response);
    return data.valid;
  },
};
