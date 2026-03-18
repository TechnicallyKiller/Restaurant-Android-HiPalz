import { usePermissionStore } from '../store/permissionStore';
import type { StaffPermission } from '../api/types';

/**
 * Hook to get the full permission record for a specific ODN or Name.
 */
export function usePermission(permissionOdn: string): StaffPermission | undefined {
  return usePermissionStore(state => state.getPermission(permissionOdn));
}
