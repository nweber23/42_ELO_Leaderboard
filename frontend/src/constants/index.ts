/**
 * Shared validation constants for the application.
 * Keep these in sync with backend validation rules.
 */

// Comment validation
export const COMMENT_MAX_LENGTH = 280;
export const COMMENT_MIN_LENGTH = 1;

// Score validation
export const SCORE_MIN = 0;
export const SCORE_MAX = 999;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

// Rate limiting hints (for UI feedback)
export const API_THROTTLE_MS = 300;

// ELO defaults (for display purposes)
export const DEFAULT_ELO = 1000;

// Local storage keys - centralized to avoid typos
export const STORAGE_KEYS = {
  TOKEN: 'token',
  THEME: 'theme',
} as const;

// API error messages - standardized for consistency
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
} as const;
