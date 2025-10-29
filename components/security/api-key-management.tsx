"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Key,
  Plus,
  MoreHorizontal,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  CheckCircle,
} from "lucide-react";
import { ApiKey, ApiKeyPermission } from "@/lib/types/security";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface ApiKeyManagementProps {
  organizationId: string;
}

interface CreateApiKeyData {
  name: string;
  permissions: ApiKeyPermission[];
  expiresAt?: Date;
  rateLimit: {
    requests: number;
    windowMs: number;
  };
}

export function ApiKeyManagement({ organizationId }: ApiKeyManagementProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const [createData, setCreateData] = useState<CreateApiKeyData>({
    name: "",
    permissions: [],
    rateLimit: {
      requests: 1000,
      windowMs: 3600000, // 1 hour
    },
  });

  const fetchApiKeys = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/security/api-keys?organizationId=${organizationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      }
    } catch (error) {
      toast.error("Failed to fetch API keys");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleCreateApiKey = async () => {
    if (!createData.name.trim()) {
      toast.error("API key name is required");
      return;
    }

    if (createData.permissions.length === 0) {
      toast.error("At least one permission is required");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/security/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          ...createData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewApiKey(data.secretKey);
        setApiKeys((prev) => [...prev, data.apiKey]);
        setCreateData({
          name: "",
          permissions: [],
          rateLimit: {
            requests: 1000,
            windowMs: 3600000,
          },
        });
        toast.success("API key created successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create API key");
      }
    } catch (error) {
      toast.error("Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/security/api-keys/${keyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setApiKeys((prev) => prev.filter((key) => key.id !== keyId));
        toast.success("API key deleted successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete API key");
      }
    } catch (error) {
      toast.error("Failed to delete API key");
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) {
        next.delete(keyId);
      } else {
        next.add(keyId);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const permissionOptions = Object.values(ApiKeyPermission).map(
    (permission) => ({
      value: permission,
      label: permission
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase()),
    }),
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>API Keys</CardTitle>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for external integrations.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={createData.name}
                  onChange={(e) =>
                    setCreateData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="My API Key"
                />
              </div>
              <div className="grid gap-2">
                <Label>Permissions</Label>
                <Select
                  onValueChange={(value) => {
                    const permission = value as ApiKeyPermission;
                    if (!createData.permissions.includes(permission)) {
                      setCreateData((prev) => ({
                        ...prev,
                        permissions: [...prev.permissions, permission],
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select permissions" />
                  </SelectTrigger>
                  <SelectContent>
                    {permissionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1 mt-2">
                  {createData.permissions.map((permission) => (
                    <Badge
                      key={permission}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => {
                        setCreateData((prev) => ({
                          ...prev,
                          permissions: prev.permissions.filter(
                            (p) => p !== permission,
                          ),
                        }));
                      }}
                    >
                      {permission
                        .replace(/_/g, " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                      ×
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rateLimit">
                  Rate Limit (requests per hour)
                </Label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={createData.rateLimit.requests}
                  onChange={(e) =>
                    setCreateData((prev) => ({
                      ...prev,
                      rateLimit: {
                        ...prev.rateLimit,
                        requests: parseInt(e.target.value) || 1000,
                      },
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateApiKey} disabled={creating}>
                {creating ? "Creating..." : "Create API Key"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {newApiKey && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-yellow-800">
                  New API Key Created
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Make sure to copy your API key now. You won't be able to see
                  it again!
                </p>
                <code className="block mt-2 p-2 bg-yellow-100 rounded text-sm font-mono">
                  {newApiKey}
                </code>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(newApiKey)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2"
              onClick={() => setNewApiKey(null)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              I've saved the key
            </Button>
          </div>
        )}

        {apiKeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No API keys found</p>
            <p className="text-sm">Create your first API key to get started</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm font-mono">
                          {visibleKeys.has(apiKey.id)
                            ? `sk_${apiKey.id.slice(0, 8)}...${apiKey.id.slice(-8)}`
                            : "••••••••••••••••"}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                        >
                          {visibleKeys.has(apiKey.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {apiKey.permissions.slice(0, 2).map((permission) => (
                          <Badge
                            key={permission}
                            variant="outline"
                            className="text-xs"
                          >
                            {permission
                              .replace(/_/g, " ")
                              .toLowerCase()
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Badge>
                        ))}
                        {apiKey.permissions.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{apiKey.permissions.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{apiKey.usageCount} requests</div>
                        <div className="text-muted-foreground">
                          {apiKey.rateLimit.requests}/hr limit
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {apiKey.lastUsedAt
                        ? formatDistanceToNow(new Date(apiKey.lastUsedAt), {
                            addSuffix: true,
                          })
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={apiKey.isActive ? "default" : "secondary"}
                      >
                        {apiKey.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeleteApiKey(apiKey.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
