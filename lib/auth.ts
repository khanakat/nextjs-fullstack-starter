/**
 * Authentication Configuration
 *
 * This file exports the authentication configuration for the application.
 * It can be configured to use either NextAuth.js or Clerk based on your preference.
 */

// Export Clerk configuration as default
export { auth, currentUser } from "./auth-clerk";

// Alternative: Export NextAuth configuration
export { authOptions } from "./auth-nextauth";
// export { getServerSession, getCurrentUser, isCurrentUserAdmin } from './auth-nextauth'
