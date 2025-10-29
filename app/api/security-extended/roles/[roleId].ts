import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";
import { db as prisma } from "@/lib/db";
import { RBACService } from "@/lib/security/rbac";
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

    const { roleId } = req.query;

    if (!roleId || typeof roleId !== "string") {
      return res.status(400).json({ message: "Role ID is required" });
    }

    // Check if user has permission to manage roles
    const canManageRoles = await RBACService.canManageRoles(userId);
    if (!canManageRoles) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    if (req.method === "GET") {
      // Get specific role with details
      const role = await prisma.securityRole.findUnique({
        where: { id: roleId },
        include: {
          permissions: true,
          userRoles: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      const formattedRole = {
        id: role.id,
        name: role.name,
        description: role.description,
        organizationId: role.organizationId,
        level: role.level,
        isSystem: role.isSystem,
        permissions: role.permissions.map((rp) => ({
          id: rp.id,
          resource: rp.resource,
          action: rp.action,
          conditions: rp.conditions,
        })),
        users: role.userRoles.map((ur) => ur.user),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      };

      res.status(200).json({ role: formattedRole });
    } else if (req.method === "PUT") {
      // Update role
      const { name, description, hierarchy, permissions } = req.body;

      const role = await prisma.securityRole.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      if (role.isSystem) {
        return res.status(400).json({ message: "Cannot modify system roles" });
      }

      // Update role basic info
      const updatedRole = await prisma.securityRole.update({
        where: { id: roleId },
        data: {
          name: name || role.name,
          description:
            description !== undefined ? description : role.description,
          level: hierarchy !== undefined ? hierarchy : role.level,
          updatedAt: new Date(),
        },
      });

      // Update permissions if provided
      if (permissions) {
        // Remove existing permissions
        await prisma.securityPermission.deleteMany({
          where: { roleId },
        });

        // Add new permissions
        if (permissions.length > 0) {
          const rolePermissions = permissions.map((permission: any) => ({
            roleId,
            resource: permission.resource,
            action: permission.action,
            resourceId: permission.resourceId,
            conditions: permission.conditions
              ? JSON.stringify(permission.conditions)
              : null,
            createdAt: new Date(),
          }));

          await prisma.securityPermission.createMany({
            data: rolePermissions,
          });
        }
      }

      // Log role update
      await SecurityAuditService.logSecurityEvent(
        "ROLE_UPDATED",
        "medium",
        `Role ${updatedRole.name} updated`,
        `Security role ${updatedRole.name} was updated with changes: ${JSON.stringify({ name, description, hierarchy, permissions: permissions?.length })}`,
        userId,
        undefined,
        {
          roleName: updatedRole.name,
          changes: {
            name,
            description,
            hierarchy,
            permissions: permissions?.length,
          },
          ipAddress:
            (req.headers["x-forwarded-for"] as string) ||
            req.socket.remoteAddress,
          userAgent: req.headers["user-agent"],
        },
      );

      res.status(200).json({
        message: "Role updated successfully",
        role: updatedRole,
      });
    } else if (req.method === "DELETE") {
      // Delete role
      const role = await prisma.securityRole.findUnique({
        where: { id: roleId },
        include: {
          userRoles: true,
        },
      });

      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      if (role.isSystem) {
        return res.status(400).json({ message: "Cannot delete system roles" });
      }

      if (role.userRoles.length > 0) {
        return res.status(400).json({
          message:
            "Cannot delete role with assigned users. Remove users first.",
        });
      }

      // Delete role permissions first
      await prisma.securityPermission.deleteMany({
        where: { roleId },
      });

      // Delete role
      await prisma.securityRole.delete({
        where: { id: roleId },
      });

      // Log role deletion
      await SecurityAuditService.logSecurityEvent(
        "ROLE_DELETED",
        "high",
        `Role ${role.name} deleted`,
        `Security role ${role.name} was deleted`,
        userId,
        undefined,
        {
          roleName: role.name,
          ipAddress:
            (req.headers["x-forwarded-for"] as string) ||
            req.socket.remoteAddress,
          userAgent: req.headers["user-agent"],
        },
      );

      res.status(200).json({ message: "Role deleted successfully" });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Role API error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
