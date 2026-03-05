/**
 * Thrown when the API returns an error (4xx/5xx or body.success === false).
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly data?: unknown;

  constructor(statusCode: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
