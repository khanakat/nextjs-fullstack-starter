import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// RBAC Service for role-based access control
export class RBACService {
  // Check if user has permission for a resource and action
  static async hasPermission(
    userId: string,
    resource: string,
    action: string,
    resourceId?: string,
    organizationId?: string,
  ): Promise<boolean> {
    try {
      // Get user's active roles
      const userRoles = await prisma.userSecurityRole.findMany({
        where: {
          userId,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      });

      // Check each role's permissions
      for (const userRole of userRoles) {
        const role = userRole.role;

        // Skip if role is for different organization
        if (
          organizationId &&
          role.organizationId &&
          role.organizationId !== organizationId
        ) {
          continue;
        }

        // Check permissions
        for (const permission of role.permissions) {
          if (
            permission.resource === resource &&
            permission.action === action
          ) {
            // Check resource-specific permission
            if (
              resourceId &&
              permission.resourceId &&
              permission.resourceId !== resourceId
            ) {
              continue;
            }

            // Check conditional access
            if (permission.conditions) {
              const conditions = JSON.parse(permission.conditions);
              if (
                !this.evaluateConditions(conditions, {
                  userId,
                  organizationId,
                  resourceId,
                })
              ) {
                continue;
              }
            }

            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  }

  // Get user's effective permissions
  static async getUserPermissions(
    userId: string,
    organizationId?: string,
  ): Promise<
    {
      resource: string;
      action: string;
      resourceId?: string;
      conditions?: any;
    }[]
  > {
    try {
      const userRoles = await prisma.userSecurityRole.findMany({
        where: {
          userId,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      });

      const permissions: any[] = [];

      for (const userRole of userRoles) {
        const role = userRole.role;

        // Skip if role is for different organization
        if (
          organizationId &&
          role.organizationId &&
          role.organizationId !== organizationId
        ) {
          continue;
        }

        for (const permission of role.permissions) {
          permissions.push({
            resource: permission.resource,
            action: permission.action,
            resourceId: permission.resourceId,
            conditions: permission.conditions
              ? JSON.parse(permission.conditions)
              : null,
          });
        }
      }

      return permissions;
    } catch (error) {
      console.error("Error getting user permissions:", error);
      return [];
    }
  }

  // Assign role to user
  static async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    expiresAt?: Date,
  ): Promise<boolean> {
    try {
      await prisma.userSecurityRole.create({
        data: {
          userId,
          roleId,
          assignedBy,
          expiresAt,
        },
      });
      return true;
    } catch (error) {
      console.error("Error assigning role:", error);
      return false;
    }
  }

  // Remove role from user
  static async removeRole(userId: string, roleId: string): Promise<boolean> {
    try {
      await prisma.userSecurityRole.updateMany({
        where: {
          userId,
          roleId,
        },
        data: {
          isActive: false,
        },
      });
      return true;
    } catch (error) {
      console.error("Error removing role:", error);
      return false;
    }
  }

  // Create new role
  static async createRole(
    name: string,
    description: string,
    level: number,
    scope: string = "organization",
    organizationId?: string,
  ): Promise<string | null> {
    try {
      const role = await prisma.securityRole.create({
        data: {
          name,
          description,
          level,
          scope,
          organizationId,
        },
      });
      return role.id;
    } catch (error) {
      console.error("Error creating role:", error);
      return null;
    }
  }

  // Add permission to role
  static async addPermissionToRole(
    roleId: string,
    resource: string,
    action: string,
    resourceId?: string,
    conditions?: any,
  ): Promise<boolean> {
    try {
      await prisma.securityPermission.create({
        data: {
          roleId,
          resource,
          action,
          resourceId,
          conditions: conditions ? JSON.stringify(conditions) : null,
        },
      });
      return true;
    } catch (error) {
      console.error("Error adding permission to role:", error);
      return false;
    }
  }

  // Remove permission from role
  static async removePermissionFromRole(
    roleId: string,
    resource: string,
    action: string,
    resourceId?: string,
  ): Promise<boolean> {
    try {
      await prisma.securityPermission.deleteMany({
        where: {
          roleId,
          resource,
          action,
          resourceId,
        },
      });
      return true;
    } catch (error) {
      console.error("Error removing permission from role:", error);
      return false;
    }
  }

  // Get role hierarchy
  static async getRoleHierarchy(organizationId?: string): Promise<any[]> {
    try {
      const roles = await prisma.securityRole.findMany({
        where: {
          organizationId,
        },
        include: {
          permissions: true,
          userRoles: {
            where: {
              isActive: true,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          level: "desc",
        },
      });

      return roles;
    } catch (error) {
      console.error("Error getting role hierarchy:", error);
      return [];
    }
  }

  // Evaluate conditional access rules
  private static evaluateConditions(conditions: any, context: any): boolean {
    try {
      // IP address restrictions
      if (conditions.allowedIPs && context.ipAddress) {
        if (!conditions.allowedIPs.includes(context.ipAddress)) {
          return false;
        }
      }

      // Time-based restrictions
      if (conditions.timeRestrictions) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

        if (conditions.timeRestrictions.allowedHours) {
          const [startHour, endHour] = conditions.timeRestrictions.allowedHours;
          if (currentHour < startHour || currentHour > endHour) {
            return false;
          }
        }

        if (conditions.timeRestrictions.allowedDays) {
          if (!conditions.timeRestrictions.allowedDays.includes(currentDay)) {
            return false;
          }
        }
      }

      // Location-based restrictions
      if (conditions.allowedLocations && context.location) {
        if (!conditions.allowedLocations.includes(context.location)) {
          return false;
        }
      }

      // Custom conditions can be added here

      return true;
    } catch (error) {
      console.error("Error evaluating conditions:", error);
      return false;
    }
  }

  // Check if user has any admin role
  static async isAdmin(
    userId: string,
    organizationId?: string,
  ): Promise<boolean> {
    return this.hasPermission(userId, "*", "admin", undefined, organizationId);
  }

  // Check if user can manage roles
  static async canManageRoles(
    userId: string,
    organizationId?: string,
  ): Promise<boolean> {
    return this.hasPermission(
      userId,
      "roles",
      "admin",
      undefined,
      organizationId,
    );
  }

  // Check if user can manage users
  static async canManageUsers(
    userId: string,
    organizationId?: string,
  ): Promise<boolean> {
    return this.hasPermission(
      userId,
      "users",
      "admin",
      undefined,
      organizationId,
    );
  }

  // Get default roles for new users
  static async getDefaultRoles(organizationId?: string): Promise<string[]> {
    try {
      const defaultRoles = await prisma.securityRole.findMany({
        where: {
          isDefault: true,
          organizationId,
        },
        select: {
          id: true,
        },
      });

      return defaultRoles.map((role) => role.id);
    } catch (error) {
      console.error("Error getting default roles:", error);
      return [];
    }
  }

  // Bulk assign roles to user
  static async bulkAssignRoles(
    userId: string,
    roleIds: string[],
    assignedBy: string,
  ): Promise<boolean> {
    try {
      const assignments = roleIds.map((roleId) => ({
        userId,
        roleId,
        assignedBy,
      }));

      await prisma.userSecurityRole.createMany({
        data: assignments,
      });

      return true;
    } catch (error) {
      console.error("Error bulk assigning roles:", error);
      return false;
    }
  }
}

// Permission constants for easy reference
export const PERMISSIONS = {
  USERS: {
    CREATE: "users:create",
    READ: "users:read",
    UPDATE: "users:update",
    DELETE: "users:delete",
    ADMIN: "users:admin",
  },
  ORGANIZATIONS: {
    CREATE: "organizations:create",
    READ: "organizations:read",
    UPDATE: "organizations:update",
    DELETE: "organizations:delete",
    ADMIN: "organizations:admin",
  },
  WORKFLOWS: {
    CREATE: "workflows:create",
    READ: "workflows:read",
    UPDATE: "workflows:update",
    DELETE: "workflows:delete",
    EXECUTE: "workflows:execute",
    ADMIN: "workflows:admin",
  },
  ANALYTICS: {
    READ: "analytics:read",
    EXPORT: "analytics:export",
    ADMIN: "analytics:admin",
  },
  INTEGRATIONS: {
    CREATE: "integrations:create",
    READ: "integrations:read",
    UPDATE: "integrations:update",
    DELETE: "integrations:delete",
    ADMIN: "integrations:admin",
  },
  SECURITY: {
    READ: "security:read",
    AUDIT: "security:audit",
    ADMIN: "security:admin",
  },
} as const;
