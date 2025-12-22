import axios, { AxiosError } from 'axios';
import { ERROR_MESSAGES } from '../constants';

/**
 * Extracts a user-friendly error message from various error types.
 * Handles Axios errors, standard Error objects, and unknown error types.
 */
export function getErrorMessage(error: unknown): string {
  // Handle Axios errors with response data
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;

    // Check for custom error message from backend
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    // Map HTTP status codes to user-friendly messages
    switch (axiosError.response?.status) {
      case 400:
        return ERROR_MESSAGES.VALIDATION_ERROR;
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 500:
      case 502:
      case 503:
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        break;
    }

    // Network errors (no response)
    if (axiosError.code === 'ERR_NETWORK' || !axiosError.response) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Fallback for unknown error types
  return ERROR_MESSAGES.SERVER_ERROR;
}

/**
 * Type guard to check if an error is an Axios error
 */
export function isNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    return axiosError.code === 'ERR_NETWORK' || !axiosError.response;
  }
  return false;
}

/**
 * Check if error is an authentication error (401)
 */
export function isAuthError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    return axiosError.response?.status === 401;
  }
  return false;
}
