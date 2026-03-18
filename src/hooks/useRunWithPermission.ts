import { useCallback } from 'react';
import { usePermissionStore } from '../store/permissionStore';
import { useHasPermission } from './useHasPermission';

/**
 * Hook to run an action only if the user has the permission.
 * If the permission requires a password, it opens the PIN modal.
 */
export function useRunWithPermission(permissionOdn: string) {
  const hasPermission = useHasPermission(permissionOdn);
  const getPermission = usePermissionStore(state => state.getPermission);
  const openPasswordModal = usePermissionStore(state => state.openPasswordModal);

  const run = useCallback(
    (action: () => void) => {
      const perm = getPermission(permissionOdn);
      if (!perm) return;

      if (perm.isHasPassword) {
        openPasswordModal(perm, action);
      } else {
        action();
      }
    },
    [permissionOdn, getPermission, openPasswordModal],
  );

  return { hasPermission, run };
}
