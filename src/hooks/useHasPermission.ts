import { usePermissionStore } from '../store/permissionStore';

/**
 * Hook to check if the current staff has a specific permission.
 * Matches by both ODN and Name.
 */
export function useHasPermission(permissionOdn: string): boolean {
  return usePermissionStore(state => state.hasPermission(permissionOdn));
}
