"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface ReportPermission {
  id: string;
  reportId: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: "viewer" | "editor" | "admin";
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
}

export interface PermissionRequest {
  userId: string;
  userEmail: string;
  role: "viewer" | "editor" | "admin";
  expiresAt?: string;
}

export interface PermissionsResponse {
  permissions: ReportPermission[];
  total: number;
}

export function useReportPermissions(reportId?: string) {
  const [permissions, setPermissions] = useState<ReportPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchPermissions = useCallback(async () => {
    if (!reportId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/reports/permissions?reportId=${reportId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch permissions");
      }

      const data: PermissionsResponse = await response.json();
      setPermissions(data.permissions);
      setTotal(data.total);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    fetchPermissions();
  }, [reportId, fetchPermissions]);

  const addPermission = async (permission: PermissionRequest) => {
    if (!reportId) {
      throw new Error("Report ID is required");
    }

    try {
      const response = await fetch("/api/reports/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportId,
          ...permission,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add permission");
      }

      const newPermission: ReportPermission = await response.json();
      setPermissions((prev) => [...prev, newPermission]);
      setTotal((prev) => prev + 1);
      toast.success(`Permission granted to ${permission.userEmail}`);
      return newPermission;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add permission";
      toast.error(errorMessage);
      throw err;
    }
  };

  const updatePermission = async (
    permissionId: string,
    updates: Partial<Pick<ReportPermission, "role" | "expiresAt">>,
  ) => {
    try {
      const response = await fetch(`/api/reports/permissions/${permissionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update permission");
      }

      const updatedPermission: ReportPermission = await response.json();
      setPermissions((prev) =>
        prev.map((p) => (p.id === permissionId ? updatedPermission : p)),
      );
      toast.success("Permission updated successfully");
      return updatedPermission;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update permission";
      toast.error(errorMessage);
      throw err;
    }
  };

  const removePermission = async (permissionId: string) => {
    try {
      const response = await fetch(`/api/reports/permissions/${permissionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove permission");
      }

      const removedPermission = permissions.find((p) => p.id === permissionId);
      setPermissions((prev) => prev.filter((p) => p.id !== permissionId));
      setTotal((prev) => prev - 1);
      toast.success(
        `Permission removed from ${removedPermission?.userEmail || "user"}`,
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove permission";
      toast.error(errorMessage);
      throw err;
    }
  };

  const bulkUpdatePermissions = async (
    permissionIds: string[],
    updates: Partial<Pick<ReportPermission, "role" | "expiresAt">>,
  ) => {
    try {
      const updatePromises = permissionIds.map((id) =>
        updatePermission(id, updates),
      );
      const results = await Promise.allSettled(updatePromises);

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0) {
        toast.success(`Updated ${successful} permissions`);
      }
      if (failed > 0) {
        toast.error(`Failed to update ${failed} permissions`);
      }

      return { successful, failed };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update permissions";
      toast.error(errorMessage);
      throw err;
    }
  };

  const bulkRemovePermissions = async (permissionIds: string[]) => {
    try {
      const removePromises = permissionIds.map((id) => removePermission(id));
      const results = await Promise.allSettled(removePromises);

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0) {
        toast.success(`Removed ${successful} permissions`);
      }
      if (failed > 0) {
        toast.error(`Failed to remove ${failed} permissions`);
      }

      return { successful, failed };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove permissions";
      toast.error(errorMessage);
      throw err;
    }
  };

  const checkUserPermission = (userId: string): ReportPermission | null => {
    return permissions.find((p) => p.userId === userId) || null;
  };

  const hasPermission = (
    userId: string,
    requiredRole: "viewer" | "editor" | "admin",
  ): boolean => {
    const permission = checkUserPermission(userId);
    if (!permission) return false;

    // Check if permission has expired
    if (permission.expiresAt && new Date(permission.expiresAt) < new Date()) {
      return false;
    }

    // Role hierarchy: admin > editor > viewer
    const roleHierarchy = { viewer: 1, editor: 2, admin: 3 };
    return roleHierarchy[permission.role] >= roleHierarchy[requiredRole];
  };

  const getPermissionsByRole = (role: "viewer" | "editor" | "admin") => {
    return permissions.filter((p) => p.role === role);
  };

  const getExpiredPermissions = () => {
    const now = new Date();
    return permissions.filter(
      (p) => p.expiresAt && new Date(p.expiresAt) < now,
    );
  };

  const getExpiringPermissions = (days: number = 7) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return permissions.filter((p) => {
      if (!p.expiresAt) return false;
      const expiryDate = new Date(p.expiresAt);
      return expiryDate > new Date() && expiryDate <= futureDate;
    });
  };

  const refresh = () => {
    fetchPermissions();
  };

  // Get permission statistics
  const getStats = () => {
    const stats = permissions.reduce(
      (acc, permission) => {
        acc[permission.role] = (acc[permission.role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const expired = getExpiredPermissions().length;
    const expiring = getExpiringPermissions().length;

    return {
      viewer: stats.viewer || 0,
      editor: stats.editor || 0,
      admin: stats.admin || 0,
      total: permissions.length,
      expired,
      expiring,
    };
  };

  return {
    permissions,
    loading,
    error,
    total,
    addPermission,
    updatePermission,
    removePermission,
    bulkUpdatePermissions,
    bulkRemovePermissions,
    checkUserPermission,
    hasPermission,
    getPermissionsByRole,
    getExpiredPermissions,
    getExpiringPermissions,
    refresh,
    stats: getStats(),
  };
}
