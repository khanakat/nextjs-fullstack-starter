/**
 * Barrel exports for common utilities and services
 * This file provides centralized exports to reduce import statements
 */

// Database client (primary export)
export { db, testConnection } from "./db";

// Common utilities
export {
  cn,
  formatDate,
  formatRelativeTime,
  generateRandomString,
  // debounce,
  throttle,
  capitalize,
  generateSlug,
  truncate,
  formatCurrency,
  formatNumber,
  isValidEmail,
  isValidUrl,
  generateRandomColor,
  sleep,
  deepClone,
  isEqual,
  generateRequestId,
} from "./utils";

// Authentication helpers - commented out problematic exports
// export {
//   getCurrentAuthenticatedUser,
//   isAuthenticated,
//   requireAuth,
//   hasRole,
//   isAdmin,
//   isModerator,
//   getSession,
//   belongsToOrganization,
//   getCurrentOrganizationId,
//   hasOrganizationAccess,
//   validateOrganizationAccess,
// } from "./auth-helpers";

// API utilities
export type { ApiResponse, ErrorType } from "./api-utils";
export { ApiError } from "./api-utils";
