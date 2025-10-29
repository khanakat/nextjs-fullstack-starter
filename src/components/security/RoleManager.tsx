import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Users,
  Key,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";

interface Permission {
  id: string;
  resource: string;
  action: string;
  conditions?: string;
  description?: string;
}

interface SecurityRole {
  id: string;
  name: string;
  description?: string;
  organizationId?: string;
  level: number;
  parentRoleId?: string;
  permissions: Permission[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

interface RoleManagerProps {
  organizationId?: string;
  onRoleChange?: (roles: SecurityRole[]) => void;
}

export default function RoleManager({
  organizationId,
  onRoleChange,
}: RoleManagerProps) {
  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<SecurityRole | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentRoleId: "",
    selectedPermissions: new Set<string>(),
  });

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (organizationId) params.append("organizationId", organizationId);

      const response = await fetch(`/api/security/roles?${params}`);
      if (response.ok) {
        const rolesData = await response.json();
        setRoles(rolesData);
        onRoleChange?.(rolesData);
      } else {
        setError("Failed to load roles");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  }, [organizationId, onRoleChange]);

  const loadPermissions = useCallback(async () => {
    try {
      const response = await fetch("/api/security/permissions");
      if (response.ok) {
        const permissionsData = await response.json();
        setPermissions(permissionsData);
      }
    } catch (error) {
      console.error("Error loading permissions:", error);
    }
  }, []);

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, [organizationId, loadRoles, loadPermissions]);

  const handleCreateRole = async () => {
    if (!formData.name.trim()) {
      setError("Role name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/security/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          organizationId,
          parentRoleId: formData.parentRoleId || null,
          permissions: Array.from(formData.selectedPermissions),
        }),
      });

      if (response.ok) {
        setSuccess("Role created successfully");
        setIsCreating(false);
        resetForm();
        loadRoles();
      } else {
        const error = await response.json();
        setError(error.message || "Failed to create role");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole || !formData.name.trim()) {
      setError("Role name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/security/roles/${selectedRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          parentRoleId: formData.parentRoleId || null,
          permissions: Array.from(formData.selectedPermissions),
        }),
      });

      if (response.ok) {
        setSuccess("Role updated successfully");
        setIsEditing(false);
        setSelectedRole(null);
        resetForm();
        loadRoles();
      } else {
        const error = await response.json();
        setError(error.message || "Failed to update role");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this role? This action cannot be undone.",
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/security/roles/${roleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Role deleted successfully");
        loadRoles();
      } else {
        const error = await response.json();
        setError(error.message || "Failed to delete role");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      parentRoleId: "",
      selectedPermissions: new Set(),
    });
  };

  const startEdit = (role: SecurityRole) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      parentRoleId: role.parentRoleId || "",
      selectedPermissions: new Set(role.permissions.map((p) => p.id)),
    });
    setIsEditing(true);
  };

  const toggleRoleExpansion = (roleId: string) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId);
    } else {
      newExpanded.add(roleId);
    }
    setExpandedRoles(newExpanded);
  };

  const togglePermission = (permissionId: string) => {
    const newSelected = new Set(formData.selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setFormData({ ...formData, selectedPermissions: newSelected });
  };

  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === null || role.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const groupPermissionsByResource = (permissions: Permission[]) => {
    const grouped: { [resource: string]: Permission[] } = {};
    permissions.forEach((permission) => {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = [];
      }
      grouped[permission.resource].push(permission);
    });
    return grouped;
  };

  const renderRoleHierarchy = (role: SecurityRole, level: number = 0) => {
    const childRoles = roles.filter((r) => r.parentRoleId === role.id);
    const isExpanded = expandedRoles.has(role.id);

    return (
      <div key={role.id} className={`ml-${level * 4}`}>
        <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg mb-2">
          <div className="flex items-center space-x-3">
            {childRoles.length > 0 && (
              <button
                onClick={() => toggleRoleExpansion(role.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-gray-900">{role.name}</h3>
              <p className="text-sm text-gray-500">
                {role.description} • {role.permissions.length} permissions •{" "}
                {role.userCount} users
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              Level {role.level}
            </span>
            <button
              onClick={() => startEdit(role)}
              className="text-blue-600 hover:text-blue-800"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteRole(role.id)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isExpanded &&
          childRoles.map((childRole) =>
            renderRoleHierarchy(childRole, level + 1),
          )}
      </div>
    );
  };

  const renderRoleForm = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {isEditing ? "Edit Role" : "Create New Role"}
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter role name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Enter role description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parent Role
          </label>
          <select
            value={formData.parentRoleId}
            onChange={(e) =>
              setFormData({ ...formData, parentRoleId: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">No parent role</option>
            {roles
              .filter((role) => role.id !== selectedRole?.id)
              .map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Permissions
          </label>
          <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
            {Object.entries(groupPermissionsByResource(permissions)).map(
              ([resource, resourcePermissions]) => (
                <div
                  key={resource}
                  className="border-b border-gray-200 last:border-b-0"
                >
                  <div className="bg-gray-50 px-3 py-2 font-medium text-gray-700">
                    {resource}
                  </div>
                  <div className="p-3 space-y-2">
                    {resourcePermissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedPermissions.has(
                            permission.id,
                          )}
                          onChange={() => togglePermission(permission.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {permission.action}
                          {permission.description && (
                            <span className="text-gray-500 ml-1">
                              - {permission.description}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={() => {
            setIsCreating(false);
            setIsEditing(false);
            setSelectedRole(null);
            resetForm();
          }}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={isEditing ? handleUpdateRole : handleCreateRole}
          disabled={loading || !formData.name.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : isEditing ? "Update Role" : "Create Role"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
          <p className="text-gray-600">Manage security roles and permissions</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Create Role</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800">{success}</p>
            <button
              onClick={() => setSuccess("")}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Role Form */}
      {(isCreating || isEditing) && renderRoleForm()}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search roles..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-gray-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterLevel || ""}
              onChange={(e) =>
                setFilterLevel(e.target.value ? parseInt(e.target.value) : null)
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Levels</option>
              <option value="0">Level 0</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roles List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading roles...</p>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No roles found</p>
          </div>
        ) : (
          filteredRoles
            .filter((role) => !role.parentRoleId) // Show only top-level roles
            .map((role) => renderRoleHierarchy(role))
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Total Roles</p>
              <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Key className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Total Permissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {permissions.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Users with Roles</p>
              <p className="text-2xl font-bold text-gray-900">
                {roles.reduce((sum, role) => sum + role.userCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
