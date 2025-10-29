"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useConditionalAuth } from "@/components/conditional-clerk";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Play,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  Search,
  Plus,
  Filter,
  Eye,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
} from "lucide-react";

import { Workflow, WorkflowStatus } from "@/lib/types/workflows";

// ============================================================================
// WORKFLOW CARD COMPONENT
// ============================================================================

interface WorkflowCardProps {
  workflow: Workflow;
  onEdit: (workflow: Workflow) => void;
  onExecute: (workflow: Workflow) => void;
  onDuplicate: (workflow: Workflow) => void;
  onDelete: (workflow: Workflow) => void;
  onView: (workflow: Workflow) => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  onEdit,
  onExecute,
  onDuplicate,
  onDelete,
  onView,
}) => {
  const getStatusColor = (status: WorkflowStatus) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: WorkflowStatus) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-3 h-3" />;
      case "inactive":
        return <XCircle className="w-3 h-3" />;
      case "draft":
        return <Pause className="w-3 h-3" />;
      default:
        return <XCircle className="w-3 h-3" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">
              {workflow.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {workflow.description || "No description provided"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={`${getStatusColor(workflow.status)} flex items-center gap-1`}
            >
              {getStatusIcon(workflow.status)}
              {workflow.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(workflow)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(workflow)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onExecute(workflow)}
                  disabled={workflow.status !== "active"}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Execute
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(workflow)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(workflow)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>v{workflow.version}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(workflow.updatedAt), "MMM d, yyyy")}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView(workflow)}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              onClick={() => onExecute(workflow)}
              disabled={workflow.status !== "active"}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Play className="w-4 h-4 mr-1" />
              Execute
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// WORKFLOW LIST COMPONENT
// ============================================================================

interface WorkflowListProps {
  onCreateNew: () => void;
  onEditWorkflow: (workflow: Workflow) => void;
  onViewWorkflow: (workflow: Workflow) => void;
}

export const WorkflowList: React.FC<WorkflowListProps> = ({
  onCreateNew,
  onEditWorkflow,
  onViewWorkflow,
}) => {
  const router = useRouter();
  const { getToken, isSignedIn, isLoaded } = useConditionalAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | "all">(
    "all",
  );
  const [sortBy, setSortBy] = useState<"name" | "updatedAt" | "createdAt">(
    "updatedAt",
  );

  const fetchWorkflows = useCallback(async () => {
    // Don't fetch if not loaded
    if (!isLoaded) {
      return;
    }

    // If not signed in, provide mock data for showcase
    if (!isSignedIn) {
      setLoading(true);
      // Simulate API delay
      setTimeout(() => {
        const mockWorkflows: Workflow[] = [
          {
            id: "demo-1",
            name: "Customer Onboarding",
            description: "Automated workflow for new customer registration and setup",
            status: "active" as WorkflowStatus,
            version: 1,
            definition: "{}",
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: "demo-user",
            organizationId: "demo-org",
          },
          {
            id: "demo-2",
            name: "Invoice Processing",
            description: "Automated invoice validation and approval workflow",
            status: "active" as WorkflowStatus,
            version: 2,
            definition: "{}",
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: "demo-user",
            organizationId: "demo-org",
          },
          {
            id: "demo-3",
            name: "Content Review",
            description: "Multi-step content review and approval process",
            status: "draft" as WorkflowStatus,
            version: 1,
            definition: "{}",
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            createdBy: "demo-user",
            organizationId: "demo-org",
          },
        ];
        setWorkflows(mockWorkflows);
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      params.append("sortBy", sortBy);
      params.append("sortOrder", "desc");

      const response = await fetch(`/api/workflows?${params}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Please sign in to access workflows");
          router.push("/sign-in");
          return;
        }
        throw new Error(`Failed to fetch workflows: ${response.status}`);
      }

      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      toast.error("Failed to load workflows. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sortBy, isLoaded, isSignedIn, getToken, router]);

  // Fetch workflows
  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleExecute = async (workflow: Workflow) => {
    if (!isSignedIn) {
      // In showcase mode, simulate execution
      toast.success(`Demo: Workflow "${workflow.name}" would be executed`);
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`/api/workflows/${workflow.id}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          data: {},
          triggeredBy: "manual",
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Please sign in to execute workflows");
          router.push("/sign-in");
          return;
        }
        throw new Error(`Failed to execute workflow: ${response.status}`);
      }

      const result = await response.json();
      toast.success(`Workflow "${workflow.name}" executed successfully`);

      // Navigate to the workflow instance
      router.push(`/workflows/instances/${result.instance.id}`);
    } catch (error) {
      console.error("Error executing workflow:", error);
      toast.error("Failed to execute workflow. Please try again.");
    }
  };

  const handleDuplicate = async (workflow: Workflow) => {
    if (!isSignedIn) {
      // In showcase mode, simulate duplication
      toast.success(`Demo: Workflow "${workflow.name}" would be duplicated`);
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          name: `${workflow.name} (Copy)`,
          description: workflow.description,
          definition: workflow.definition,
          status: "draft",
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Please sign in to duplicate workflows");
          router.push("/sign-in");
          return;
        }
        throw new Error(`Failed to duplicate workflow: ${response.status}`);
      }

      toast.success("Workflow duplicated successfully");
      fetchWorkflows();
    } catch (error) {
      console.error("Error duplicating workflow:", error);
      toast.error("Failed to duplicate workflow. Please try again.");
    }
  };

  const handleDelete = async (workflow: Workflow) => {
    if (!isSignedIn) {
      // In showcase mode, simulate deletion
      if (confirm(`Demo: Delete "${workflow.name}"? (This is just a demo)`)) {
        toast.success(`Demo: Workflow "${workflow.name}" would be deleted`);
      }
      return;
    }

    if (!confirm(`Are you sure you want to delete "${workflow.name}"?`)) {
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Please sign in to delete workflows");
          router.push("/sign-in");
          return;
        }
        throw new Error(`Failed to delete workflow: ${response.status}`);
      }

      toast.success("Workflow deleted successfully");
      fetchWorkflows();
    } catch (error) {
      console.error("Error deleting workflow:", error);
      toast.error("Failed to delete workflow. Please try again.");
    }
  };

  // Filter workflows based on search term
  const filteredWorkflows = workflows.filter(
    (workflow) =>
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (workflow.description?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false),
  );

  // Show loading state while authentication is loading
  if (!isLoaded || loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show authentication required message if not signed in
  if (!isSignedIn) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Workflows</h1>
            <p className="text-muted-foreground">
              Manage and execute your business process workflows
            </p>
          </div>
        </div>
        <Card className="p-8 text-center">
          <CardContent>
            <div className="space-y-4">
              <div className="text-muted-foreground">
                Please sign in to access your workflows
              </div>
              <Button onClick={() => router.push("/sign-in")}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">
            Manage and execute your business process workflows
          </p>
        </div>
        <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: WorkflowStatus | "all") =>
            setStatusFilter(value)
          }
        >
          <SelectTrigger className="w-32">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(value: "name" | "updatedAt" | "createdAt") =>
            setSortBy(value)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updatedAt">Last Updated</SelectItem>
            <SelectItem value="createdAt">Date Created</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Workflow Grid */}
      {filteredWorkflows.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Play className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by creating your first workflow"}
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Button
              onClick={onCreateNew}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Workflow
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onEdit={onEditWorkflow}
              onExecute={handleExecute}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onView={onViewWorkflow}
            />
          ))}
        </div>
      )}

      {/* Stats */}
      {filteredWorkflows.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
          <span>
            Showing {filteredWorkflows.length} of {workflows.length} workflows
          </span>
          <div className="flex items-center gap-4">
            <span>
              Active: {workflows.filter((w) => w.status === "active").length}
            </span>
            <span>
              Draft: {workflows.filter((w) => w.status === "draft").length}
            </span>
            <span>
              Inactive:{" "}
              {workflows.filter((w) => w.status === "inactive").length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowList;
