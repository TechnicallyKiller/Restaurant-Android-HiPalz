import { useAuthStore } from './authStore';
import { usePermissionStore } from './permissionStore';
import { useCartStore } from './cartStore';
import { useBillStore } from './billStore';
// Import other stores as they are added

/**
 * Reset all stores to their initial state.
 * Useful for logout or during testing.
 */
export const resetAllStores = async () => {
  // 1. Clear Auth (this will trigger reactive resets in Permission, Cart, and Bill stores)
  await useAuthStore.getState().logout();

  // 2. Explicitly clear any other stores that don't have subscriptions yet
  // useOtherStore.getState().reset();
};
