/**
 * Authentication Helpers
 *
 * Helper functions for authentication and authorization
 */

import { getServerSession } from "next-auth";
import { authOptions } from "./auth-nextauth";
import { db } from "./db";
import { UserRole } from "./permissions";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  role?: UserRole;
  organizationId?: string;
}

/**
 * Get the current authenticated user with role and organization information
 * @returns Promise resolving to authenticated user or null if not authenticated
 */
export async function getCurrentAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  // Get user from database with role and organization
  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      organizationMemberships: {
        select: {
          organizationId: true,
          role: true,
        },
        take: 1, // Get the first organization membership
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    organizationId: user.organizationMemberships[0]?.organizationId,
  };
}

/**
 * Check if the current user is authenticated
 * @returns Promise resolving to true if user is authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentAuthenticatedUser();
  return user !== null;
}

/**
 * Require authentication - throws error if user is not authenticated
 * @returns Promise resolving to authenticated user
 * @throws Error if user is not authenticated
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

/**
 * Check if the current user has a specific role
 * @param role - Role to check for
 * @returns Promise resolving to true if user has the role, false otherwise
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentAuthenticatedUser();
  return user?.role === role;
}

/**
 * Check if the current user is an admin
 * @returns Promise resolving to true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole("ADMIN");
}

/**
 * Check if the current user is a moderator or admin
 */
export async function isModerator(): Promise<boolean> {
  const user = await getCurrentAuthenticatedUser();
  // Note: MODERATOR role doesn't exist in UserRole type, using MANAGER instead
  return user?.role === "MANAGER" || user?.role === "ADMIN";
}

/**
 * Get user session from server-side
 * @returns Promise resolving to session or null if not authenticated
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Check if user belongs to a specific organization
 * @param organizationId - Organization ID to check
 * @returns Promise resolving to true if user belongs to organization, false otherwise
 */
export async function belongsToOrganization(
  organizationId: string,
): Promise<boolean> {
  const user = await getCurrentAuthenticatedUser();
  return user?.organizationId === organizationId;
}

/**
 * Get organization ID from the current session
 * Returns the user's organization ID or null if not available
 */
export async function getCurrentOrganizationId(): Promise<string | null> {
  const user = await getCurrentAuthenticatedUser();
  return user?.organizationId || null;
}

/**
 * Check if the current user has access to a specific organization
 */
export async function hasOrganizationAccess(
  organizationId: string,
): Promise<boolean> {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    return false;
  }

  // Admins have access to all organizations
  if (user.role === "ADMIN") {
    return true;
  }

  // Users can only access their own organization
  return user.organizationId === organizationId;
}

/**
 * Validate organization access and return the organization ID
 * Throws an error if access is denied
 */
export async function validateOrganizationAccess(
  organizationId?: string,
): Promise<string | null> {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // If no organization ID is provided, use the user's organization
  if (!organizationId) {
    return user.organizationId || null;
  }

  // Check if user has access to the requested organization
  const hasAccess = await hasOrganizationAccess(organizationId);

  if (!hasAccess) {
    throw new Error("Access denied to organization");
  }

  return organizationId;
}
