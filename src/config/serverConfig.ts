/** Default API base URL (localhost for dev; override via env/CONFIG in app). */
export const BASE_URL = 'http://localhost:3333';

/**
 * Server security headers - must match backend middleware.
 * Sent on every API request.
 */
export const API_SERVER_SECRET = 'API_SERVER_SECRET';
export const TOKEN = 'TOKEN';

/** Cloud backend URL for terminal installation (internet). Used only during first-time installation. */
export const INSTALLATION_BACKEND_URL = 'http://localhost:4500';

/** Server secret for cloud terminal login verification (installation flow). */
export const SERVER_SECRET = 'SERVER_SECRET';

/** @deprecated Use BASE_URL */
export const apiUrl = BASE_URL;
/** @deprecated Use API_SERVER_SECRET */
export const apiServerSecret = API_SERVER_SECRET;
