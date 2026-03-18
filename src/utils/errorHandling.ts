import { ApiError } from '../api/ApiError';
import { useErrorStore } from '../store/errorStore';

/**
 * Extract a user-facing error message from any thrown value.
 * Use everywhere the UI needs a single short error string (toast, inline, etc.).
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return 'Something went wrong';
}

export type ErrorActionType =
  | 'go_to_login'
  | 'refresh'
  | 'go_home'
  | 'dismiss'
  | 'reconnect';

export interface ErrorAction {
  type: ErrorActionType;
  label: string;
}

export interface ErrorState {
  isOpen: boolean;
  title: string;
  message: string;
  code: number | null;
  actions: ErrorAction[];
}

/**
 * Central API error handler. Call from query/mutation catch blocks.
 * 401 → Session expired, Go to Login
 * 403 → Access denied, Refresh / Go Home
 * 400/422 → Show message, OK
 * 500/502/503 → Server error, Refresh / Go Home
 * Other 4xx/5xx → Error + message, Refresh / Go Home
 * Network errors → set offline state (no blocking modal)
 */
export function handleApiError(error: unknown): void {
  const { setError, setOffline } = useErrorStore.getState();

  if (error instanceof ApiError) {
    const { statusCode, message } = error;
    switch (statusCode) {
      case 401:
        setError({
          isOpen: true,
          title: 'Session Expired',
          message: 'Please login again.',
          code: 401,
          actions: [{ type: 'go_to_login', label: 'Go to Login' }],
        });
        return;
      case 403:
        setError({
          isOpen: true,
          title: 'Access Denied',
          message: 'You do not have permission to perform this action.',
          code: 403,
          actions: [
            { type: 'refresh', label: 'Refresh' },
            { type: 'go_home', label: 'Go Home' },
          ],
        });
        return;
      case 400:
      case 422:
        setError({
          isOpen: true,
          title: 'Error',
          message,
          code: statusCode,
          actions: [{ type: 'dismiss', label: 'OK' }],
        });
        return;
      case 500:
      case 502:
      case 503:
        setError({
          isOpen: true,
          title: 'Server Error',
          message: 'Something went wrong on our end. Please try again.',
          code: statusCode,
          actions: [
            { type: 'refresh', label: 'Refresh' },
            { type: 'go_home', label: 'Go Home' },
          ],
        });
        return;
      default:
        if (statusCode >= 400) {
          setError({
            isOpen: true,
            title: 'Error',
            message,
            code: statusCode,
            actions: [
              { type: 'refresh', label: 'Refresh' },
              { type: 'go_home', label: 'Go Home' },
            ],
          });
        }
        return;
    }
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes('failed to fetch') ||
      msg.includes('network request failed') ||
      msg.includes('network error') ||
      msg.includes('socket is closed')
    ) {
      setOffline(true);
      setError({
        isOpen: true,
        title: 'Connection Lost',
        message:
          'The app lost connection to the server. This happens if the server moves to a new IP or the Wi-Fi changed.',
        code: 0,
        actions: [
          { type: 'reconnect', label: 'Reconnect Now' },
          { type: 'dismiss', label: 'Wait' },
        ],
      });
      return;
    }
  }

  setError({
    isOpen: true,
    title: 'Error',
    message: getErrorMessage(error),
    code: null,
    actions: [{ type: 'dismiss', label: 'OK' }],
  });
}
