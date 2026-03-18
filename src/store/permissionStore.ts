import { create } from 'zustand';
import type { StaffPermission } from '../api/types';
import { permissionApi } from '../api/permissionApi';
import { useAuthStore } from './authStore';

interface PermissionState {
  permissions: StaffPermission[];
  isLoading: boolean;
  error: string | null;

  // Password Modal State
  isPasswordModalOpen: boolean;
  pendingPermission: StaffPermission | null;
  onConfirm: (() => void) | null;

  setPermissions: (permissions: StaffPermission[]) => void;
  fetchPermissions: (outletId: string, staffId: string) => Promise<void>;
  hasPermission: (permissionOdn: string) => boolean;
  getPermission: (permissionOdn: string) => StaffPermission | undefined;
  clearPermissions: () => void;

  openPasswordModal: (
    permission: StaffPermission,
    onConfirm: () => void,
  ) => void;
  closePasswordModal: () => void;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: [],
  isLoading: false,
  error: null,

  isPasswordModalOpen: false,
  pendingPermission: null,
  onConfirm: null,

  setPermissions: permissions => set({ permissions }),

  fetchPermissions: async (outletId, staffId) => {
    set({ isLoading: true, error: null });
    try {
      const perms = await permissionApi.listByStaffAndOutlet(outletId, staffId);
      // Only keep active permissions
      set({ permissions: perms.filter(p => p.status), isLoading: false });
    } catch (err: any) {
      set({
        error: err.message || 'Failed to fetch permissions',
        isLoading: false,
      });
    }
  },

  hasPermission: permissionOdn => {
    const { permissions } = get();
    return permissions.some(
      p =>
        p.status &&
        (p.permissionOdn === permissionOdn || p.permissionName === permissionOdn),
    );
  },

  getPermission: permissionOdn => {
    const { permissions } = get();
    return permissions.find(
      p =>
        p.status &&
        (p.permissionOdn === permissionOdn || p.permissionName === permissionOdn),
    );
  },

  clearPermissions: () =>
    set({ permissions: [], error: null, isLoading: false }),

  openPasswordModal: (pendingPermission, onConfirm) =>
    set({ isPasswordModalOpen: true, pendingPermission, onConfirm }),

  closePasswordModal: () =>
    set({
      isPasswordModalOpen: false,
      pendingPermission: null,
      onConfirm: null,
    }),
}));

// Polling logic: check permissions every 15 seconds if logged in
let pollingInterval: any = null;

const startPolling = (outletId: string, staffId: string) => {
  if (pollingInterval) return;
  pollingInterval = setInterval(() => {
    usePermissionStore.getState().fetchPermissions(outletId, staffId);
  }, 15000);
};

const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
};

// Reactive: Manage polling and clear permissions based on auth state
useAuthStore.subscribe(
  state => ({ token: state.token, user: state.user }),
  ({ token, user }) => {
    if (!token || !user) {
      stopPolling();
      usePermissionStore.getState().clearPermissions();
    } else {
      // Start/Continue polling with current user info
      startPolling(user.outletId, user.id);
    }
  },
  { fireImmediately: true },
);
