/**
 * Centralized error handling utilities for Claude Forge.
 * All client-side - no data leaves the device.
 */

export interface ErrorContext {
  action: string;
  component?: string;
  timestamp: Date;
}

export interface AppError extends Error {
  code?: string;
  context?: ErrorContext;
  recoverable?: boolean;
}

/**
 * Create a standardized application error
 */
export function createError(
  message: string,
  code?: string,
  context?: Partial<ErrorContext>
): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.context = {
    action: context?.action || 'unknown',
    component: context?.component,
    timestamp: new Date(),
  };
  error.recoverable = true;
  return error;
}

/**
 * Error codes for different types of errors
 */
export const ErrorCodes = {
  // Network errors
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_FAILED: 'NETWORK_FAILED',

  // API errors
  API_KEY_MISSING: 'API_KEY_MISSING',
  API_KEY_INVALID: 'API_KEY_INVALID',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_QUOTA_EXCEEDED: 'API_QUOTA_EXCEEDED',
  API_RESPONSE_INVALID: 'API_RESPONSE_INVALID',

  // Generation errors
  GENERATION_FAILED: 'GENERATION_FAILED',
  GENERATION_TIMEOUT: 'GENERATION_TIMEOUT',
  GENERATION_CANCELLED: 'GENERATION_CANCELLED',

  // File system errors
  SAVE_FAILED: 'SAVE_FAILED',
  SAVE_PERMISSION_DENIED: 'SAVE_PERMISSION_DENIED',
  SAVE_INVALID_PATH: 'SAVE_INVALID_PATH',

  // Settings errors
  SETTINGS_LOAD_FAILED: 'SETTINGS_LOAD_FAILED',
  SETTINGS_SAVE_FAILED: 'SETTINGS_SAVE_FAILED',

  // History errors
  HISTORY_LOAD_FAILED: 'HISTORY_LOAD_FAILED',
  HISTORY_SAVE_FAILED: 'HISTORY_SAVE_FAILED',
  HISTORY_FULL: 'HISTORY_FULL',

  // Encryption errors
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED: 'DECRYPTION_FAILED',
  PASSWORD_REQUIRED: 'PASSWORD_REQUIRED',
  PASSWORD_INVALID: 'PASSWORD_INVALID',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Get a user-friendly error message based on error code
 */
export function getUserMessage(error: AppError | Error | string): string {
  if (typeof error === 'string') {
    return error;
  }

  const appError = error as AppError;
  if (appError.code) {
    const messages: Record<string, string> = {
      [ErrorCodes.NETWORK_OFFLINE]: 'You appear to be offline. Please check your internet connection.',
      [ErrorCodes.NETWORK_TIMEOUT]: 'The request timed out. Please try again.',
      [ErrorCodes.NETWORK_FAILED]: 'Network request failed. Please check your connection.',
      [ErrorCodes.API_KEY_MISSING]: 'API key is required. Please configure it in settings.',
      [ErrorCodes.API_KEY_INVALID]: 'API key appears to be invalid. Please check your settings.',
      [ErrorCodes.API_RATE_LIMIT]: 'Rate limit exceeded. Please wait a moment before trying again.',
      [ErrorCodes.API_QUOTA_EXCEEDED]: 'API quota exceeded. Please check your account.',
      [ErrorCodes.API_RESPONSE_INVALID]: 'Received an invalid response from the API.',
      [ErrorCodes.GENERATION_FAILED]: 'Failed to generate artifact. Please try again.',
      [ErrorCodes.GENERATION_TIMEOUT]: 'Generation timed out. Please try again.',
      [ErrorCodes.GENERATION_CANCELLED]: 'Generation was cancelled.',
      [ErrorCodes.SAVE_FAILED]: 'Failed to save artifact. Please try again.',
      [ErrorCodes.SAVE_PERMISSION_DENIED]: 'Permission denied. Please choose a different location.',
      [ErrorCodes.SAVE_INVALID_PATH]: 'Invalid save path. Please check the location.',
      [ErrorCodes.SETTINGS_LOAD_FAILED]: 'Failed to load settings. Using defaults.',
      [ErrorCodes.SETTINGS_SAVE_FAILED]: 'Failed to save settings.',
      [ErrorCodes.HISTORY_LOAD_FAILED]: 'Failed to load history.',
      [ErrorCodes.HISTORY_SAVE_FAILED]: 'Failed to save history item.',
      [ErrorCodes.HISTORY_FULL]: 'History is full. Oldest items will be removed.',
      [ErrorCodes.ENCRYPTION_FAILED]: 'Failed to encrypt data.',
      [ErrorCodes.DECRYPTION_FAILED]: 'Failed to decrypt data. Check your password.',
      [ErrorCodes.PASSWORD_REQUIRED]: 'Password required to unlock.',
      [ErrorCodes.PASSWORD_INVALID]: 'Incorrect password.',
    };

    return messages[appError.code] || appError.message || 'An unexpected error occurred.';
  }

  return error.message || 'An unexpected error occurred.';
}

/**
 * Safely execute an async function with error handling
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context?: Partial<ErrorContext>
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await fn();
    return { data };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    const appError = createError(
      error.message,
      (error as AppError).code,
      context
    );
    return { error: appError };
  }
}

/**
 * Log error to console (client-side only, no external logging)
 */
export function logError(error: AppError | Error | unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const prefix = context ? `[${context}]` : '[Error]';

  if (error instanceof Error) {
    console.error(prefix, timestamp, error.message, error);
  } else {
    console.error(prefix, timestamp, error);
  }
}

/**
 * Check if an error is recoverable (user can retry)
 */
export function isRecoverable(error: AppError | Error): boolean {
  const appError = error as AppError;
  if (appError.recoverable !== undefined) {
    return appError.recoverable;
  }

  // Most errors are recoverable except for critical ones
  const unrecoverableCodes: string[] = [
    ErrorCodes.SAVE_PERMISSION_DENIED,
    ErrorCodes.SAVE_INVALID_PATH,
  ];

  return !unrecoverableCodes.includes(appError.code || '');
}

/**
 * Retry logic for async operations
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        onRetry?.(attempt, lastError);
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
