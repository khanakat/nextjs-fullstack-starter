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

    // Check if user has permission to manage roles
    const canManageRoles = await RBACService.canManageRoles(userId);
    if (!canManageRoles) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    if (req.method === "GET") {
      // Get all roles with permissions
      const { organizationId } = req.query;

      const roles = await prisma.securityRole.findMany({
        where: organizationId
          ? { organizationId: organizationId as string }
          : {},
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
          _count: {
            select: {
              userRoles: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      const formattedRoles = roles.map((role) => ({
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
        userCount: role._count.userRoles,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      }));

      res.status(200).json({ roles: formattedRoles });
    } else if (req.method === "POST") {
      // Create new role
      const { name, description, organizationId, hierarchy, permissions } =
        req.body;

      if (!name) {
        return res.status(400).json({ message: "Role name is required" });
      }

      // Check if role name already exists
      const existingRole = await prisma.securityRole.findFirst({
        where: {
          name,
          organizationId: organizationId || null,
        },
      });

      if (existingRole) {
        return res.status(400).json({ message: "Role name already exists" });
      }

      const role = await prisma.securityRole.create({
        data: {
          name,
          description: description || "",
          organizationId: organizationId || null,
          level: hierarchy || 0,
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Add permissions if provided
      if (permissions && permissions.length > 0) {
        const rolePermissions = permissions.map((permissionId: string) => ({
          roleId: role.id,
          permissionId,
          createdAt: new Date(),
        }));

        await prisma.securityPermission.createMany({
          data: rolePermissions,
        });
      }

      // Log role creation
      await SecurityAuditService.logSecurityEvent(
        "role_created",
        "medium",
        "Role Created",
        `Role "${name}" was created`,
        userId,
        undefined,
        {
          roleName: name,
          organizationId,
          permissionCount: permissions?.length || 0,
          ipAddress:
            (req.headers["x-forwarded-for"] as string) ||
            req.socket.remoteAddress,
          userAgent: req.headers["user-agent"],
        },
      );

      res.status(201).json({
        message: "Role created successfully",
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          organizationId: role.organizationId,
          level: role.level,
        },
      });
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Roles API error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
