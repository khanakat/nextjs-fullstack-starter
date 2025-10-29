/**
 * Permissions System
 *
 * This file contains the permissions system for role-based access control.
 * It provides functions to check user permissions for various resources and actions.
 */

// Define UserRole type since SQLite doesn't support enums
export type UserRole = "ADMIN" | "OWNER" | "MANAGER" | "MEMBER" | "VIEWER";

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  role?: UserRole;
  organizationId?: string;
}

export type Resource =
  | "audit"
  | "reports"
  | "templates"
  | "users"
  | "organizations"
  | "settings"
  | "posts"
  | "subscription";
export type Action = "create" | "read" | "update" | "delete" | "admin";

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

const ROLE_PERMISSIONS: Record<UserRole, Record<Resource, Action[]>> = {
  ADMIN: {
    audit: ["create", "read", "update", "delete", "admin"],
    reports: ["create", "read", "update", "delete", "admin"],
    templates: ["create", "read", "update", "delete", "admin"],
    users: ["create", "read", "update", "delete", "admin"],
    organizations: ["create", "read", "update", "delete", "admin"],
    settings: ["create", "read", "update", "delete", "admin"],
    posts: ["create", "read", "update", "delete", "admin"],
    subscription: ["create", "read", "update", "delete", "admin"],
  },
  OWNER: {
    audit: ["create", "read", "update", "delete", "admin"],
    reports: ["create", "read", "update", "delete", "admin"],
    templates: ["create", "read", "update", "delete", "admin"],
    users: ["create", "read", "update", "delete"],
    organizations: ["read", "update"],
    settings: ["read", "update"],
    posts: ["create", "read", "update", "delete", "admin"],
    subscription: ["create", "read", "update", "delete", "admin"],
  },
  MANAGER: {
    audit: ["read", "update"],
    reports: ["create", "read", "update", "delete"],
    templates: ["create", "read", "update", "delete"],
    users: ["read", "update"],
    organizations: ["read"],
    settings: ["read"],
    posts: ["create", "read", "update", "delete"],
    subscription: ["create", "read", "update", "delete"],
  },
  MEMBER: {
    audit: ["read"],
    reports: ["create", "read", "update"],
    templates: ["read"],
    users: ["read"],
    organizations: ["read"],
    settings: ["read"],
    posts: ["create", "read", "update"],
    subscription: ["read"],
  },
  VIEWER: {
    audit: ["read"],
    reports: ["read"],
    templates: ["read"],
    users: ["read"],
    organizations: ["read"],
    settings: ["read"],
    posts: ["read"],
    subscription: ["read"],
  },
};

// ============================================================================
// PERMISSION FUNCTIONS
// ============================================================================

/**
 * Check if a user has permission to perform an action on a resource
 */
export function hasPermission(
  user: User | null | undefined,
  action: Action,
  resource: Resource,
): boolean {
  if (!user) return false;

  // Default to VIEWER role if no role is specified
  const userRole = user.role || "VIEWER";

  // Get permissions for the user's role
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) return false;

  // Get permissions for the specific resource
  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;

  // Check if the user has the required permission
  return resourcePermissions.includes(action);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  user: User | null | undefined,
  actions: Action[],
  resource: Resource,
): boolean {
  return actions.some((action) => hasPermission(user, action, resource));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  user: User | null | undefined,
  actions: Action[],
  resource: Resource,
): boolean {
  return actions.every((action) => hasPermission(user, action, resource));
}

/**
 * Get all permissions for a user and resource
 */
export function getUserPermissions(
  user: User | null | undefined,
  resource: Resource,
): Action[] {
  if (!user) return [];

  const userRole = user.role || "VIEWER";
  const rolePermissions = ROLE_PERMISSIONS[userRole];

  if (!rolePermissions) return [];

  return rolePermissions[resource] || [];
}

/**
 * Check if a user is an admin (has admin role)
 */
export function isAdmin(user: User | null | undefined): boolean {
  return user?.role === "ADMIN";
}

/**
 * Check if a user is an owner (has owner role)
 */
export function isOwner(user: User | null | undefined): boolean {
  return user?.role === "OWNER";
}

/**
 * Check if a user is an admin or owner
 */
export function isAdminOrOwner(user: User | null | undefined): boolean {
  return isAdmin(user) || isOwner(user);
}

/**
 * Check if a user can manage other users
 */
export function canManageUsers(user: User | null | undefined): boolean {
  return (
    hasPermission(user, "admin", "users") ||
    hasPermission(user, "update", "users")
  );
}

/**
 * Check if a user can access audit logs
 */
export function canAccessAuditLogs(user: User | null | undefined): boolean {
  return hasPermission(user, "read", "audit");
}

/**
 * Check if a user can manage audit logs
 */
export function canManageAuditLogs(user: User | null | undefined): boolean {
  return hasPermission(user, "admin", "audit");
}

/**
 * Get the highest role in the hierarchy
 */
export function getHighestRole(roles: UserRole[]): UserRole {
  const roleHierarchy: Record<UserRole, number> = {
    ADMIN: 5,
    OWNER: 4,
    MANAGER: 3,
    MEMBER: 2,
    VIEWER: 1,
  };

  return roles.reduce((highest, current) => {
    return roleHierarchy[current] > roleHierarchy[highest] ? current : highest;
  }, "VIEWER");
}

/**
 * Check if one role is higher than another in the hierarchy
 */
export function isRoleHigher(role1: UserRole, role2: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    ADMIN: 5,
    OWNER: 4,
    MANAGER: 3,
    MEMBER: 2,
    VIEWER: 1,
  };

  return roleHierarchy[role1] > roleHierarchy[role2];
}
