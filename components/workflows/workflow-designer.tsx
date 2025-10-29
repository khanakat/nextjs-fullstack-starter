"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import ReactFlow, {
  Node,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Connection,
  ReactFlowProvider,
  ReactFlowInstance,
  NodeTypes,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Play,
  Square,
  CheckCircle,
  GitBranch,
  Bell,
  Webhook,
  Zap,
  Save,
  Download,
  Upload,
  Trash2,
  Eye,
} from "lucide-react";

import { WorkflowDefinition, WorkflowStepType } from "@/lib/types/workflows";

// ============================================================================
// CUSTOM NODE COMPONENTS
// ============================================================================

interface CustomNodeData {
  label: string;
  description?: string;
  config?: Record<string, any>;
  conditions?: Record<string, any>;
  slaHours?: number;
  isValid?: boolean;
}

interface CustomNodeProps {
  data: CustomNodeData;
  selected: boolean;
}

const StartNode: React.FC<CustomNodeProps> = ({ data, selected }) => (
  <div
    className={`px-4 py-2 shadow-md rounded-md bg-green-100 border-2 ${
      selected ? "border-green-500" : "border-green-300"
    } ${!data.isValid ? "border-red-400" : ""}`}
  >
    <div className="flex items-center">
      <Play className="w-4 h-4 mr-2 text-green-600" />
      <div className="text-sm font-medium text-green-800">{data.label}</div>
    </div>
    {data.description && (
      <div className="text-xs text-green-600 mt-1">{data.description}</div>
    )}
  </div>
);

const TaskNode: React.FC<CustomNodeProps> = ({ data, selected }) => (
  <div
    className={`px-4 py-2 shadow-md rounded-md bg-blue-100 border-2 ${
      selected ? "border-blue-500" : "border-blue-300"
    } ${!data.isValid ? "border-red-400" : ""}`}
  >
    <div className="flex items-center">
      <Square className="w-4 h-4 mr-2 text-blue-600" />
      <div className="text-sm font-medium text-blue-800">{data.label}</div>
    </div>
    {data.description && (
      <div className="text-xs text-blue-600 mt-1">{data.description}</div>
    )}
    {data.slaHours && (
      <Badge variant="secondary" className="mt-1 text-xs">
        SLA: {data.slaHours}h
      </Badge>
    )}
  </div>
);

const ApprovalNode: React.FC<CustomNodeProps> = ({ data, selected }) => (
  <div
    className={`px-4 py-2 shadow-md rounded-md bg-yellow-100 border-2 ${
      selected ? "border-yellow-500" : "border-yellow-300"
    } ${!data.isValid ? "border-red-400" : ""}`}
  >
    <div className="flex items-center">
      <CheckCircle className="w-4 h-4 mr-2 text-yellow-600" />
      <div className="text-sm font-medium text-yellow-800">{data.label}</div>
    </div>
    {data.description && (
      <div className="text-xs text-yellow-600 mt-1">{data.description}</div>
    )}
    {data.slaHours && (
      <Badge variant="secondary" className="mt-1 text-xs">
        SLA: {data.slaHours}h
      </Badge>
    )}
  </div>
);

const ConditionNode: React.FC<CustomNodeProps> = ({ data, selected }) => (
  <div
    className={`px-4 py-2 shadow-md rounded-md bg-purple-100 border-2 ${
      selected ? "border-purple-500" : "border-purple-300"
    } ${!data.isValid ? "border-red-400" : ""}`}
  >
    <div className="flex items-center">
      <GitBranch className="w-4 h-4 mr-2 text-purple-600" />
      <div className="text-sm font-medium text-purple-800">{data.label}</div>
    </div>
    {data.description && (
      <div className="text-xs text-purple-600 mt-1">{data.description}</div>
    )}
    {data.conditions?.expression && (
      <div className="text-xs text-purple-500 mt-1 font-mono">
        {data.conditions.expression}
      </div>
    )}
  </div>
);

const NotificationNode: React.FC<CustomNodeProps> = ({ data, selected }) => (
  <div
    className={`px-4 py-2 shadow-md rounded-md bg-orange-100 border-2 ${
      selected ? "border-orange-500" : "border-orange-300"
    } ${!data.isValid ? "border-red-400" : ""}`}
  >
    <div className="flex items-center">
      <Bell className="w-4 h-4 mr-2 text-orange-600" />
      <div className="text-sm font-medium text-orange-800">{data.label}</div>
    </div>
    {data.description && (
      <div className="text-xs text-orange-600 mt-1">{data.description}</div>
    )}
  </div>
);

const WebhookNode: React.FC<CustomNodeProps> = ({ data, selected }) => (
  <div
    className={`px-4 py-2 shadow-md rounded-md bg-indigo-100 border-2 ${
      selected ? "border-indigo-500" : "border-indigo-300"
    } ${!data.isValid ? "border-red-400" : ""}`}
  >
    <div className="flex items-center">
      <Webhook className="w-4 h-4 mr-2 text-indigo-600" />
      <div className="text-sm font-medium text-indigo-800">{data.label}</div>
    </div>
    {data.description && (
      <div className="text-xs text-indigo-600 mt-1">{data.description}</div>
    )}
    {data.config?.url && (
      <div className="text-xs text-indigo-500 mt-1 font-mono truncate">
        {data.config.url}
      </div>
    )}
  </div>
);

const IntegrationNode: React.FC<CustomNodeProps> = ({ data, selected }) => (
  <div
    className={`px-4 py-2 shadow-md rounded-md bg-cyan-100 border-2 ${
      selected ? "border-cyan-500" : "border-cyan-300"
    } ${!data.isValid ? "border-red-400" : ""}`}
  >
    <div className="flex items-center">
      <Zap className="w-4 h-4 mr-2 text-cyan-600" />
      <div className="text-sm font-medium text-cyan-800">{data.label}</div>
    </div>
    {data.description && (
      <div className="text-xs text-cyan-600 mt-1">{data.description}</div>
    )}
    {data.config?.integrationId && (
      <div className="text-xs text-cyan-500 mt-1">
        Integration: {data.config.integrationName || data.config.integrationId}
      </div>
    )}
  </div>
);

const EndNode: React.FC<CustomNodeProps> = ({ data, selected }) => (
  <div
    className={`px-4 py-2 shadow-md rounded-md bg-red-100 border-2 ${
      selected ? "border-red-500" : "border-red-300"
    } ${!data.isValid ? "border-red-400" : ""}`}
  >
    <div className="flex items-center">
      <Square className="w-4 h-4 mr-2 text-red-600" />
      <div className="text-sm font-medium text-red-800">{data.label}</div>
    </div>
    {data.description && (
      <div className="text-xs text-red-600 mt-1">{data.description}</div>
    )}
  </div>
);

// Node types mapping
const nodeTypes: NodeTypes = {
  start: StartNode,
  task: TaskNode,
  approval: ApprovalNode,
  condition: ConditionNode,
  notification: NotificationNode,
  webhook: WebhookNode,
  integration: IntegrationNode,
  end: EndNode,
};

// ============================================================================
// STEP PALETTE
// ============================================================================

interface StepPaletteProps {
  onAddStep: (stepType: WorkflowStepType) => void;
}

const StepPalette: React.FC<StepPaletteProps> = ({ onAddStep }) => {
  const stepTypes = [
    {
      type: "start" as WorkflowStepType,
      label: "Start",
      icon: Play,
      color: "text-green-600",
    },
    {
      type: "task" as WorkflowStepType,
      label: "Task",
      icon: Square,
      color: "text-blue-600",
    },
    {
      type: "approval" as WorkflowStepType,
      label: "Approval",
      icon: CheckCircle,
      color: "text-yellow-600",
    },
    {
      type: "condition" as WorkflowStepType,
      label: "Condition",
      icon: GitBranch,
      color: "text-purple-600",
    },
    {
      type: "notification" as WorkflowStepType,
      label: "Notification",
      icon: Bell,
      color: "text-orange-600",
    },
    {
      type: "webhook" as WorkflowStepType,
      label: "Webhook",
      icon: Webhook,
      color: "text-indigo-600",
    },
    {
      type: "integration" as WorkflowStepType,
      label: "Integration",
      icon: Zap,
      color: "text-cyan-600",
    },
    {
      type: "end" as WorkflowStepType,
      label: "End",
      icon: Square,
      color: "text-red-600",
    },
  ];

  return (
    <Card className="w-64">
      <CardHeader>
        <CardTitle className="text-sm">Step Palette</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {stepTypes.map((step) => {
            const Icon = step.icon;
            return (
              <Button
                key={step.type}
                variant="outline"
                size="sm"
                className="h-auto p-2 flex flex-col items-center gap-1"
                onClick={() => onAddStep(step.type)}
              >
                <Icon className={`w-4 h-4 ${step.color}`} />
                <span className="text-xs">{step.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// NODE CONFIGURATION PANEL
// ============================================================================

interface NodeConfigPanelProps {
  node: Node | null;
  onUpdateNode: (nodeId: string, data: Partial<CustomNodeData>) => void;
  onDeleteNode: (nodeId: string) => void;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  onUpdateNode,
  onDeleteNode,
}) => {
  const [formData, setFormData] = useState<CustomNodeData>({
    label: "",
    description: "",
    config: {},
    conditions: {},
    slaHours: undefined,
  });

  useEffect(() => {
    if (node) {
      setFormData(node.data);
    }
  }, [node]);

  const handleUpdate = (field: keyof CustomNodeData, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    if (node) {
      onUpdateNode(node.id, newData);
    }
  };

  const handleConfigUpdate = (key: string, value: any) => {
    const newConfig = { ...formData.config, [key]: value };
    handleUpdate("config", newConfig);
  };

  const handleConditionUpdate = (key: string, value: any) => {
    const newConditions = { ...formData.conditions, [key]: value };
    handleUpdate("conditions", newConditions);
  };

  if (!node) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-sm">Node Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a node to configure its properties.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Node Configuration
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteNode(node.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={formData.label}
            onChange={(e) => handleUpdate("label", e.target.value)}
            placeholder="Enter step label"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => handleUpdate("description", e.target.value)}
            placeholder="Enter step description"
            rows={2}
          />
        </div>

        {(node.type === "task" || node.type === "approval") && (
          <>
            <div>
              <Label htmlFor="slaHours">SLA Hours</Label>
              <Input
                id="slaHours"
                type="number"
                value={formData.slaHours || ""}
                onChange={(e) =>
                  handleUpdate(
                    "slaHours",
                    parseInt(e.target.value) || undefined,
                  )
                }
                placeholder="Enter SLA in hours"
              />
            </div>

            <div>
              <Label htmlFor="assigneeId">Assignee ID</Label>
              <Input
                id="assigneeId"
                value={formData.config?.assigneeId || ""}
                onChange={(e) =>
                  handleConfigUpdate("assigneeId", e.target.value)
                }
                placeholder="Enter assignee user ID"
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.config?.dueDate || ""}
                onChange={(e) => handleConfigUpdate("dueDate", e.target.value)}
              />
            </div>
          </>
        )}

        {node.type === "condition" && (
          <div>
            <Label htmlFor="expression">Condition Expression</Label>
            <Textarea
              id="expression"
              value={formData.conditions?.expression || ""}
              onChange={(e) =>
                handleConditionUpdate("expression", e.target.value)
              }
              placeholder="e.g., ${data.amount} > 1000"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use ${"{"}data.field{"}"} or ${"{"}variables.field{"}"} syntax
            </p>
          </div>
        )}

        {node.type === "notification" && (
          <>
            <div>
              <Label htmlFor="recipients">Recipients</Label>
              <Input
                id="recipients"
                value={formData.config?.recipients || ""}
                onChange={(e) =>
                  handleConfigUpdate("recipients", e.target.value)
                }
                placeholder="email1@example.com,email2@example.com"
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.config?.subject || ""}
                onChange={(e) => handleConfigUpdate("subject", e.target.value)}
                placeholder="Notification subject"
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.config?.message || ""}
                onChange={(e) => handleConfigUpdate("message", e.target.value)}
                placeholder="Notification message"
                rows={3}
              />
            </div>
          </>
        )}

        {node.type === "webhook" && (
          <>
            <div>
              <Label htmlFor="url">Webhook URL</Label>
              <Input
                id="url"
                value={formData.config?.url || ""}
                onChange={(e) => handleConfigUpdate("url", e.target.value)}
                placeholder="https://api.example.com/webhook"
              />
            </div>

            <div>
              <Label htmlFor="method">HTTP Method</Label>
              <Select
                value={formData.config?.method || "POST"}
                onValueChange={(value) => handleConfigUpdate("method", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="headers">Headers (JSON)</Label>
              <Textarea
                id="headers"
                value={
                  formData.config?.headers
                    ? JSON.stringify(formData.config.headers, null, 2)
                    : "{}"
                }
                onChange={(e) => {
                  try {
                    const headers = JSON.parse(e.target.value);
                    handleConfigUpdate("headers", headers);
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{"Authorization": "Bearer token"}'
                rows={3}
              />
            </div>
          </>
        )}

        {node.type === "integration" && (
          <>
            <div>
              <Label htmlFor="integrationId">Integration</Label>
              <Select
                value={formData.config?.integrationId || ""}
                onValueChange={(value) => {
                  handleConfigUpdate("integrationId", value);
                  // You could also set integrationName here if you have access to integration data
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select integration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slack-001">Slack - General</SelectItem>
                  <SelectItem value="salesforce-001">
                    Salesforce - CRM
                  </SelectItem>
                  <SelectItem value="google-sheets-001">
                    Google Sheets - Data
                  </SelectItem>
                  <SelectItem value="github-001">
                    GitHub - Development
                  </SelectItem>
                  <SelectItem value="jira-001">
                    Jira - Project Management
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="action">Action</Label>
              <Select
                value={formData.config?.action || ""}
                onValueChange={(value) => handleConfigUpdate("action", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="send_message">Send Message</SelectItem>
                  <SelectItem value="create_record">Create Record</SelectItem>
                  <SelectItem value="update_record">Update Record</SelectItem>
                  <SelectItem value="get_data">Get Data</SelectItem>
                  <SelectItem value="sync_data">Sync Data</SelectItem>
                  <SelectItem value="trigger_webhook">
                    Trigger Webhook
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="actionConfig">Action Configuration (JSON)</Label>
              <Textarea
                id="actionConfig"
                value={
                  formData.config?.actionConfig
                    ? JSON.stringify(formData.config.actionConfig, null, 2)
                    : "{}"
                }
                onChange={(e) => {
                  try {
                    const actionConfig = JSON.parse(e.target.value);
                    handleConfigUpdate("actionConfig", actionConfig);
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{"channel": "#general", "message": "Hello from workflow!"}'
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Configuration specific to the selected action
              </p>
            </div>

            <div>
              <Label htmlFor="dataMapping">Data Mapping (JSON)</Label>
              <Textarea
                id="dataMapping"
                value={
                  formData.config?.dataMapping
                    ? JSON.stringify(formData.config.dataMapping, null, 2)
                    : "{}"
                }
                onChange={(e) => {
                  try {
                    const dataMapping = JSON.parse(e.target.value);
                    handleConfigUpdate("dataMapping", dataMapping);
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder='{"workflowData.customerName": "integration.contact.name"}'
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Map workflow data to integration fields
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// MAIN WORKFLOW DESIGNER COMPONENT
// ============================================================================

interface WorkflowDesignerProps {
  initialDefinition?: WorkflowDefinition;
  onSave?: (definition: WorkflowDefinition) => void;
  onPreview?: (definition: WorkflowDefinition) => void;
  readOnly?: boolean;
}

const WorkflowDesignerInner: React.FC<WorkflowDesignerProps> = ({
  initialDefinition,
  onSave,
  onPreview,
  readOnly = false,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialDefinition?.nodes || [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialDefinition?.edges || [],
  );
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [isValidWorkflow, setIsValidWorkflow] = useState(false);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Validate workflow
  useEffect(() => {
    const hasStart = nodes.some((node) => node.type === "start");
    const hasEnd = nodes.some((node) => node.type === "end");
    const allNodesValid = nodes.every(() => true); // Simplified validation

    setIsValidWorkflow(
      hasStart && hasEnd && allNodesValid && nodes.length >= 2,
    );
  }, [nodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: "smoothstep",
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addStep = useCallback(
    (stepType: WorkflowStepType) => {
      if (readOnly) return;

      const id = `${stepType}-${Date.now()}`;
      const position = reactFlowInstance?.project({
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      }) || { x: 100, y: 100 };

      const newNode: Node = {
        id,
        type: stepType,
        position,
        data: {
          label: `${stepType.charAt(0).toUpperCase() + stepType.slice(1)} Step`,
          description: "",
          config: {},
          conditions: {},
          isValid: stepType === "start" || stepType === "end", // Start and end are valid by default
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes, readOnly],
  );

  const updateNode = useCallback(
    (nodeId: string, data: Partial<CustomNodeData>) => {
      if (readOnly) return;

      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const updatedData = { ...node.data, ...data };
            // Basic validation
            updatedData.isValid = Boolean(updatedData.label?.trim());
            return { ...node, data: updatedData };
          }
          return node;
        }),
      );
    },
    [setNodes, readOnly],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      if (readOnly) return;

      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      );
      setSelectedNode(null);
    },
    [setNodes, setEdges, readOnly],
  );

  const handleSave = useCallback(() => {
    if (!onSave) return;

    const definition: WorkflowDefinition = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type as WorkflowStepType,
        position: node.position,
        data: node.data,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        data: edge.data,
      })),
    };

    onSave(definition);
  }, [nodes, edges, onSave]);

  const handlePreview = useCallback(() => {
    if (!onPreview) return;

    const definition: WorkflowDefinition = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type as WorkflowStepType,
        position: node.position,
        data: node.data,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        data: edge.data,
      })),
    };

    onPreview(definition);
  }, [nodes, edges, onPreview]);

  const exportWorkflow = useCallback(() => {
    const definition: WorkflowDefinition = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type as WorkflowStepType,
        position: node.position,
        data: node.data,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        data: edge.data,
      })),
    };

    const dataStr = JSON.stringify(definition, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = "workflow-definition.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }, [nodes, edges]);

  const importWorkflow = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (readOnly) return;

      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const definition = JSON.parse(
            e.target?.result as string,
          ) as WorkflowDefinition;
          setNodes(definition.nodes || []);
          setEdges(definition.edges || []);
        } catch (error) {
          console.error("Failed to import workflow:", error);
        }
      };
      reader.readAsText(file);
    },
    [setNodes, setEdges, readOnly],
  );

  return (
    <div className="flex h-full">
      {/* Step Palette */}
      {!readOnly && (
        <div className="flex-shrink-0 p-4 border-r">
          <StepPalette onAddStep={addStep} />
        </div>
      )}

      {/* Main Flow Area */}
      <div className="flex-1 relative">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          {!readOnly && (
            <>
              <Button
                onClick={handleSave}
                disabled={!isValidWorkflow}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button onClick={exportWorkflow} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={importWorkflow}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
              </div>
            </>
          )}
          {onPreview && (
            <Button
              onClick={handlePreview}
              disabled={!isValidWorkflow}
              variant="outline"
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}
          {!isValidWorkflow && (
            <Badge variant="destructive" className="ml-2">
              Invalid Workflow
            </Badge>
          )}
        </div>

        {/* React Flow */}
        <div ref={reactFlowWrapper} className="w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            nodesDraggable={!readOnly}
            nodesConnectable={!readOnly}
            elementsSelectable={!readOnly}
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>
      </div>

      {/* Configuration Panel */}
      {!readOnly && (
        <div className="flex-shrink-0 p-4 border-l">
          <NodeConfigPanel
            node={selectedNode}
            onUpdateNode={updateNode}
            onDeleteNode={deleteNode}
          />
        </div>
      )}
    </div>
  );
};

// Wrapper component with ReactFlowProvider
export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowDesignerInner {...props} />
    </ReactFlowProvider>
  );
};

export default WorkflowDesigner;
