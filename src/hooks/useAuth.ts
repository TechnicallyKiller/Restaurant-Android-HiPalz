import { useCallback } from 'react';
import { staffLogin } from '../api/authApi';
import { getErrorMessage } from '../utils/errorHandling';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const {
    token,
    user,
    isLoading,
    error,
    setError,
    setLoading,
    loginSuccess,
    logout: storeLogout,
  } = useAuthStore();

  const login = useCallback(
    async (phone: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await staffLogin(phone, password);
        await loginSuccess(res.token, res.staff);
        return { success: true as const };
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        return { success: false as const, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [loginSuccess, setError, setLoading],
  );

  const logout = useCallback(async () => {
    await storeLogout();
  }, [storeLogout]);

  return {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    isLoading,
    error,
    login,
    logout,
  };
}
