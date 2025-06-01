/**
 * Centralized error handling utilities
 */

// Type definitions for API errors
export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  context?: Record<string, unknown>;
}

/**
 * Creates a standardized API error object
 */
export function createApiError(
  message: string,
  statusCode = 500,
  code?: string,
  context?: Record<string, unknown>,
): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  if (code) error.code = code;
  if (context) error.context = context;
  return error;
}

/**
 * Handles API errors in a consistent way
 */
export function handleApiError(error: unknown): {
  error: string;
  statusCode: number;
} {
  console.error("[API Error]", error);

  // Handle known API errors
  if ((error as ApiError).statusCode) {
    const apiError = error as ApiError;
    return {
      error:
        process.env.NODE_ENV === "production"
          ? "An error occurred"
          : apiError.message,
      statusCode: apiError.statusCode ?? 500,
    };
  }

  // Handle unknown errors
  return {
    error:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : (error as Error).message || "Unknown error",
    statusCode: 500,
  };
}

/**
 * Wraps async functions with consistent error handling
 * Supports both generic functions with specific parameters and functions with unknown args
 */
export function withErrorHandling<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
): (
  ...args: Args
) => Promise<{ data?: T; error?: string; success: boolean }> {
  return async (...args) => {
    try {
      const data = await fn(...args);
      return { data, success: true };
    } catch (error) {
      const { error: errorMessage } = handleApiError(error);
      return { error: errorMessage, success: false };
    }
  };
}
