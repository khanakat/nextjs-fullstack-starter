import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { db as prisma } from "@/lib/db";
import { RBACService, PERMISSIONS } from "@/lib/security/rbac";
import { SecurityAuditService } from "@/lib/security/audit";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user has permission to manage roles
    const canManageRoles = await RBACService.canManageRoles(userId);
    if (!canManageRoles) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    if (req.method === "GET") {
      // Get all available permissions
      const permissions = await prisma.securityPermission.findMany({
        orderBy: [{ resource: "asc" }, { action: "asc" }],
      });

      // Group permissions by resource
      const groupedPermissions = permissions.reduce(
        (acc, permission) => {
          if (!acc[permission.resource]) {
            acc[permission.resource] = [];
          }
          acc[permission.resource].push({
            id: permission.id,
            action: permission.action,
            resource: permission.resource,
            conditions: permission.conditions,
          });
          return acc;
        },
        {} as Record<string, any[]>,
      );

      // Also return predefined permissions structure
      const predefinedPermissions = Object.entries(PERMISSIONS).map(
        ([resource, actions]) => ({
          resource,
          actions: Object.keys(actions),
        }),
      );

      res.status(200).json({
        permissions: groupedPermissions,
        predefined: predefinedPermissions,
        total: permissions.length,
      });
    } else if (req.method === "POST") {
      // Create new permission
      const { resource, action, conditions } = req.body;

      if (!resource || !action) {
        return res
          .status(400)
          .json({ message: "Resource and action are required" });
      }

      // Check if permission already exists
      const existingPermission = await prisma.securityPermission.findFirst({
        where: {
          resource,
          action,
        },
      });

      if (existingPermission) {
        return res.status(400).json({ message: "Permission already exists" });
      }

      const permission = await prisma.securityPermission.create({
        data: {
          resource,
          action,
          resourceId: null,
          conditions: conditions || null,
          roleId: "",
          createdAt: new Date(),
        },
      });

      // Log permission creation
      await SecurityAuditService.logSecurityEvent(
        "permission_created",
        "medium",
        "Permission Created",
        `Permission "${permission.action}" for resource "${permission.resource}" was created`,
        userId,
        undefined,
        {
          resource: permission.resource,
          action: permission.action,
          ipAddress:
            (req.headers["x-forwarded-for"] as string) ||
            req.socket.remoteAddress,
          userAgent: req.headers["user-agent"],
        },
      );

      res.status(201).json({
        message: "Permission created successfully",
        permission,
      });
    } else if (req.method === "PUT") {
      // Assign/remove permissions to/from role
      const { roleId, permissionIds, action: permissionAction } = req.body;

      if (!roleId || !permissionIds || !Array.isArray(permissionIds)) {
        return res
          .status(400)
          .json({ message: "Role ID and permission IDs array are required" });
      }

      if (!["add", "remove"].includes(permissionAction)) {
        return res
          .status(400)
          .json({ message: 'Action must be "add" or "remove"' });
      }

      const role = await prisma.securityRole.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      if (role.isSystem) {
        return res
          .status(400)
          .json({ message: "Cannot modify system role permissions" });
      }

      if (permissionAction === "add") {
        // Add permissions to role
        const existingPermissions = await prisma.securityPermission.findMany({
          where: {
            roleId,
            id: { in: permissionIds },
          },
        });

        const existingPermissionIds = existingPermissions.map((rp) => rp.id);
        const newPermissionIds = permissionIds.filter(
          (id) => !existingPermissionIds.includes(id),
        );

        if (newPermissionIds.length > 0) {
          const rolePermissions = newPermissionIds.map((permissionId) => ({
            roleId,
            resource: "role",
            action: "assign",
            resourceId: permissionId,
            conditions: null,
            createdAt: new Date(),
          }));

          await prisma.securityPermission.createMany({
            data: rolePermissions,
          });
        }

        // Log permission assignment
        await SecurityAuditService.logSecurityEvent(
          "permissions_assigned",
          "medium",
          "Permissions Assigned",
          `${newPermissionIds.length} permissions assigned to role "${role.name}"`,
          userId,
          undefined,
          {
            roleName: role.name,
            permissionsAdded: newPermissionIds.length,
            permissionIds: newPermissionIds,
            ipAddress:
              (req.headers["x-forwarded-for"] as string) ||
              req.socket.remoteAddress,
            userAgent: req.headers["user-agent"],
          },
        );

        res.status(200).json({
          message: `${newPermissionIds.length} permissions added to role`,
          added: newPermissionIds.length,
          skipped: permissionIds.length - newPermissionIds.length,
        });
      } else {
        // Remove permissions from role
        await prisma.securityPermission.deleteMany({
          where: {
            roleId,
            id: { in: permissionIds },
          },
        });

        // Log permission removal
        await SecurityAuditService.logSecurityEvent(
          "permissions_removed",
          "medium",
          "Permissions Removed",
          `${permissionIds.length} permissions removed from role "${role.name}"`,
          userId,
          undefined,
          {
            roleName: role.name,
            permissionsRemoved: permissionIds.length,
            permissionIds,
            ipAddress:
              (req.headers["x-forwarded-for"] as string) ||
              req.socket.remoteAddress,
            userAgent: req.headers["user-agent"],
          },
        );

        res.status(200).json({
          message: `${permissionIds.length} permissions removed from role`,
          removed: permissionIds.length,
        });
      }
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Permissions API error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
