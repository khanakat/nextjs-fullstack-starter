/**
 * Session Management Utilities
 *
 * Helper functions for managing user sessions and authentication state
 */

import { getServerSession } from "next-auth";
import { authOptions } from "./auth-nextauth";
import { getCurrentAuthenticatedUser } from "./auth-helpers";
import { auth } from "./auth";

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  organizationId?: string;
}

/**
 * Get the current user ID from session
 * Returns null if user is not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    // Try NextAuth first
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      return session.user.id;
    }

    // Fallback to Clerk auth
    const { userId } = auth();
    if (userId) {
      return userId;
    }

    return null;
  } catch (error) {
    console.error("Error getting current user ID:", error);
    return null;
  }
}

/**
 * Get the current user with organization info
 * Returns null if user is not authenticated
 */
export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  try {
    const user = await getCurrentAuthenticatedUser();

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
    };
  } catch (error) {
    console.error("Error getting current session user:", error);
    return null;
  }
}

/**
 * Require authenticated user - throws error if not authenticated
 * Use this in API routes where authentication is mandatory
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentSessionUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

/**
 * Get user ID or throw error if not authenticated
 * Convenience function for API routes
 */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("Authentication required");
  }

  return userId;
}
