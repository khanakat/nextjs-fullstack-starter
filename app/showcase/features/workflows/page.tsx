"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Play,
  FileText,
  Clock,
  Search,
  Filter,
  LayoutTemplate as Template,
  Workflow,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import { WorkflowList } from "@/components/workflows/workflow-list";
import { TaskDashboard } from "@/components/workflows/task-dashboard";
import { WorkflowDesigner } from "@/components/workflows/workflow-designer";
import {
  Workflow as WorkflowType,
  WorkflowDefinition,
  WorkflowStatus,
} from "@/lib/types/workflows";
import {
  workflowTemplates,
  getTemplateCategories,
} from "@/lib/workflow-templates";

// ============================================================================
// WORKFLOW CREATION DIALOG
// ============================================================================

interface CreateWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkflowCreated: (workflow: WorkflowType) => void;
}

const CreateWorkflowDialog: React.FC<CreateWorkflowDialogProps> = ({
  open,
  onOpenChange,
  onWorkflowCreated,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "draft" as WorkflowStatus,
    templateId: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Workflow name is required");
      return;
    }

    try {
      setLoading(true);

      // Get template definition if selected
      let definition: WorkflowDefinition | undefined;
      if (formData.templateId) {
        const template = workflowTemplates.find(
          (t) => t.id === formData.templateId,
        );
        definition = template?.definition;
      }

      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          status: formData.status,
          definition: definition || {
            nodes: [],
            edges: [],
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create workflow");
      }

      const workflow = await response.json();
      toast.success("Workflow created successfully");
      onWorkflowCreated(workflow);
      onOpenChange(false);

      // Reset form
      setFormData({
        name: "",
        description: "",
        status: "draft",
        templateId: "",
      });
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast.error("Failed to create workflow");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Workflow</DialogTitle>
          <DialogDescription>
            Create a new workflow from scratch or use a predefined template.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Workflow Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter workflow name"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe what this workflow does"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="template">Template (Optional)</Label>
            <Select
              value={formData.templateId}
              onValueChange={(value) =>
                setFormData({ ...formData, templateId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a template or start from scratch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Start from scratch</SelectItem>
                {workflowTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} - {template.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Initial Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: WorkflowStatus) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Creating..." : "Create Workflow"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// TEMPLATE GALLERY
// ============================================================================

const TemplateGallery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = ["all", ...getTemplateCategories()];
  const filteredTemplates = workflowTemplates.filter((template) => {
    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = async (templateId: string) => {
    const template = workflowTemplates.find((t) => t.id === templateId);
    if (!template) return;

    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          status: "draft",
          definition: template.definition,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create workflow from template");
      }

      toast.success("Workflow created from template");
      // Refresh the page or navigate to the new workflow
      window.location.reload();
    } catch (error) {
      console.error("Error creating workflow from template:", error);
      toast.error("Failed to create workflow from template");
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "simple":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "complex":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Workflow Templates</h2>
        <p className="text-muted-foreground">
          Get started quickly with pre-built workflow templates for common
          business processes.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {template.description}
                  </CardDescription>
                </div>
                <Badge className={getComplexityColor(template.complexity)}>
                  {template.complexity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{template.category}</Badge>
                  {template.estimatedDuration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{template.estimatedDuration}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.tags.length - 3} more
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={() => handleUseTemplate(template.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Template className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Template className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or category filter.
          </p>
        </Card>
      )}
    </div>
  );
};

// ============================================================================
// MAIN WORKFLOWS PAGE
// ============================================================================

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState("workflows");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(
    null,
  );
  const [designerMode, setDesignerMode] = useState<
    "create" | "edit" | "view" | null
  >(null);

  const handleCreateNew = () => {
    setShowCreateDialog(true);
  };

  const handleWorkflowCreated = (workflow: WorkflowType) => {
    // Navigate to edit the new workflow
    setSelectedWorkflow(workflow);
    setDesignerMode("edit");
    setActiveTab("designer");
  };

  const handleEditWorkflow = (workflow: WorkflowType) => {
    setSelectedWorkflow(workflow);
    setDesignerMode("edit");
    setActiveTab("designer");
  };

  const handleViewWorkflow = (workflow: WorkflowType) => {
    setSelectedWorkflow(workflow);
    setDesignerMode("view");
    setActiveTab("designer");
  };

  const handleSaveWorkflow = async (definition: WorkflowDefinition) => {
    if (!selectedWorkflow) return;

    try {
      const response = await fetch(`/api/workflows/${selectedWorkflow.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          definition,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save workflow");
      }

      toast.success("Workflow saved successfully");
    } catch (error) {
      console.error("Error saving workflow:", error);
      toast.error("Failed to save workflow");
    }
  };

  const handlePreviewWorkflow = (definition: WorkflowDefinition) => {
    console.log("Preview workflow:", definition);
    toast.info("Workflow preview - check console for details");
  };

  // Stats for dashboard
  const stats = [
    {
      title: "Active Workflows",
      value: "12",
      icon: Workflow,
      color: "text-blue-600",
      change: "+2 this week",
    },
    {
      title: "Pending Tasks",
      value: "34",
      icon: Clock,
      color: "text-orange-600",
      change: "+5 today",
    },
    {
      title: "Completed Tasks",
      value: "128",
      icon: CheckCircle,
      color: "text-green-600",
      change: "+12 today",
    },
    {
      title: "Overdue Tasks",
      value: "3",
      icon: AlertTriangle,
      color: "text-red-600",
      change: "-1 today",
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Management</h1>
          <p className="text-muted-foreground">
            Design, manage, and execute business process workflows
          </p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.change}
                    </p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows">
            <Workflow className="w-4 h-4 mr-2" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <FileText className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Template className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="designer">
            <Play className="w-4 h-4 mr-2" />
            Designer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="mt-6">
          <WorkflowList
            onCreateNew={handleCreateNew}
            onEditWorkflow={handleEditWorkflow}
            onViewWorkflow={handleViewWorkflow}
          />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <TaskDashboard />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplateGallery />
        </TabsContent>

        <TabsContent value="designer" className="mt-6">
          <div className="h-[800px] border rounded-lg">
            {selectedWorkflow ? (
              <WorkflowDesigner
                initialDefinition={selectedWorkflow.definition}
                onSave={handleSaveWorkflow}
                onPreview={handlePreviewWorkflow}
                readOnly={designerMode === "view"}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Workflow className="w-24 h-24 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Workflow Selected
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Select a workflow to edit or create a new one to get
                    started.
                  </p>
                  <Button
                    onClick={handleCreateNew}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Workflow
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Workflow Dialog */}
      <CreateWorkflowDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onWorkflowCreated={handleWorkflowCreated}
      />
    </div>
  );
}