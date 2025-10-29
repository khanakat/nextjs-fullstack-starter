import { z } from "zod";

// ============================================================================
// WORKFLOW SYSTEM TYPES
// ============================================================================

// Base workflow types
export type WorkflowStatus = "draft" | "active" | "inactive" | "archived";
export type WorkflowStepType =
  | "start"
  | "task"
  | "approval"
  | "condition"
  | "notification"
  | "webhook"
  | "integration"
  | "end";
export type WorkflowInstanceStatus =
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "paused";
export type WorkflowTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "rejected"
  | "cancelled";
export type WorkflowTaskType =
  | "manual"
  | "approval"
  | "review"
  | "form"
  | "automated";
export type WorkflowPriority = "low" | "normal" | "high" | "urgent";
export type WorkflowTriggerType = "manual" | "scheduled" | "webhook" | "event";
export type WorkflowAssignmentType =
  | "manual"
  | "automatic"
  | "role_based"
  | "rule_based";
export type WorkflowPermissionType = "view" | "edit" | "execute" | "admin";

// Workflow definition interfaces
export interface WorkflowNode {
  id: string;
  type: WorkflowStepType;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config: Record<string, any>;
    conditions?: Record<string, any>;
    assignmentRule?: Record<string, any>;
    slaHours?: number;
    escalationRule?: Record<string, any>;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: {
    condition?: string;
    label?: string;
  };
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables?: Record<string, any>;
  settings?: Record<string, any>;
}

// Core workflow interfaces
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  status: WorkflowStatus;
  definition: WorkflowDefinition;
  settings: Record<string, any>;
  variables: Record<string, any>;
  createdBy: string;
  organizationId?: string;
  isTemplate: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  executionCount: number;
  successRate?: number;
  avgDuration?: number;
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  stepType: WorkflowStepType;
  name: string;
  description?: string;
  config: Record<string, any>;
  conditions: Record<string, any>;
  position: { x: number; y: number };
  nextSteps: string[];
  previousSteps: string[];
  assignmentType: WorkflowAssignmentType;
  assignmentRule: Record<string, any>;
  slaHours?: number;
  escalationRule: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  status: WorkflowInstanceStatus;
  currentStepId?: string;
  data: Record<string, any>;
  variables: Record<string, any>;
  context: Record<string, any>;
  triggeredBy?: string;
  triggerType: WorkflowTriggerType;
  triggerData: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  pausedAt?: Date;
  duration?: number;
  errorMessage?: string;
  errorStep?: string;
  retryCount: number;
  priority: WorkflowPriority;
  slaDeadline?: Date;
}

export interface WorkflowTask {
  id: string;
  instanceId: string;
  stepId: string;
  name: string;
  description?: string;
  taskType: WorkflowTaskType;
  status: WorkflowTaskStatus;
  priority: WorkflowPriority;
  assigneeId?: string;
  assignedBy?: string;
  assignmentType: WorkflowAssignmentType;
  formData: Record<string, any>;
  attachments: string[];
  comments: Array<{
    id: string;
    userId: string;
    message: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  dueDate?: Date;
  slaHours?: number;
  isOverdue: boolean;
  escalatedAt?: Date;
  outcome?: string;
  completionNote?: string;
}

export interface WorkflowTemplate {
  id: string;
  workflowId?: string;
  name: string;
  description?: string;
  category: string;
  template: WorkflowDefinition;
  variables: Record<string, any>;
  settings: Record<string, any>;
  isBuiltIn: boolean;
  isPublic: boolean;
  tags: string[];
  usageCount: number;
  rating?: number;
  createdBy?: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowPermission {
  id: string;
  workflowId: string;
  userId: string;
  permissionType: WorkflowPermissionType;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

// Extended interfaces with relations
export interface WorkflowWithDetails extends Workflow {
  steps: WorkflowStep[];
  instances: WorkflowInstance[];
  templates: WorkflowTemplate[];
  permissions: WorkflowPermission[];
  totalInstances: number;
  recentInstances: WorkflowInstance[];
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  creator?: {
    id: string;
    name?: string;
    email: string;
  };
}

export interface WorkflowInstanceWithDetails extends WorkflowInstance {
  workflow: Workflow;
  tasks: WorkflowTask[];
  currentStep?: WorkflowStep;
}

export interface WorkflowTaskWithDetails extends WorkflowTask {
  instance: WorkflowInstance;
  step: WorkflowStep;
  assignee?: {
    id: string;
    name?: string;
    email: string;
  };
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

// Workflow schemas
export const WorkflowNodeSchema = z.object({
  id: z.string(),
  type: z.enum([
    "start",
    "task",
    "approval",
    "condition",
    "notification",
    "webhook",
    "end",
  ]),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    label: z.string(),
    description: z.string().optional(),
    config: z.record(z.any()).default({}),
    conditions: z.record(z.any()).optional(),
    assignmentRule: z.record(z.any()).optional(),
    slaHours: z.number().optional(),
    escalationRule: z.record(z.any()).optional(),
  }),
});

export const WorkflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
  data: z
    .object({
      condition: z.string().optional(),
      label: z.string().optional(),
    })
    .optional(),
});

export const WorkflowDefinitionSchema = z.object({
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
  variables: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(1000).optional(),
  definition: WorkflowDefinitionSchema.optional(),
  settings: z.record(z.any()).default({}),
  variables: z.record(z.any()).default({}),
  isTemplate: z.boolean().default(false),
  isPublic: z.boolean().default(false),
});

export const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  definition: WorkflowDefinitionSchema.optional(),
  settings: z.record(z.any()).optional(),
  variables: z.record(z.any()).optional(),
  status: z.enum(["draft", "active", "inactive", "archived"]).optional(),
  isTemplate: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

// Workflow instance schemas
export const CreateWorkflowInstanceSchema = z.object({
  workflowId: z.string(),
  data: z.record(z.any()).default({}),
  variables: z.record(z.any()).default({}),
  context: z.record(z.any()).default({}),
  triggerType: z
    .enum(["manual", "scheduled", "webhook", "event"])
    .default("manual"),
  triggerData: z.record(z.any()).default({}),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  slaDeadline: z.date().optional(),
});

export const UpdateWorkflowInstanceSchema = z.object({
  status: z
    .enum(["running", "completed", "failed", "cancelled", "paused"])
    .optional(),
  currentStepId: z.string().optional(),
  data: z.record(z.any()).optional(),
  variables: z.record(z.any()).optional(),
  context: z.record(z.any()).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  slaDeadline: z.date().optional(),
  errorMessage: z.string().optional(),
  errorStep: z.string().optional(),
});

// Workflow task schemas
export const CreateWorkflowTaskSchema = z.object({
  instanceId: z.string(),
  stepId: z.string(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  taskType: z
    .enum(["manual", "approval", "review", "form", "automated"])
    .default("manual"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  assigneeId: z.string().optional(),
  assignmentType: z
    .enum(["manual", "automatic", "role_based"])
    .default("manual"),
  formData: z.record(z.any()).default({}),
  attachments: z.array(z.string()).default([]),
  dueDate: z.date().optional(),
  slaHours: z.number().optional(),
});

export const UpdateWorkflowTaskSchema = z.object({
  status: z
    .enum(["pending", "in_progress", "completed", "rejected", "cancelled"])
    .optional(),
  assigneeId: z.string().optional(),
  formData: z.record(z.any()).optional(),
  attachments: z.array(z.string()).optional(),
  dueDate: z.date().optional(),
  outcome: z.string().optional(),
  completionNote: z.string().max(1000).optional(),
});

export const CompleteWorkflowTaskSchema = z.object({
  outcome: z.string().min(1),
  completionNote: z.string().max(1000).optional(),
  formData: z.record(z.any()).optional(),
});

// Workflow template schemas
export const CreateWorkflowTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(100),
  template: WorkflowDefinitionSchema,
  variables: z.record(z.any()).default({}),
  settings: z.record(z.any()).default({}),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export const UpdateWorkflowTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(100).optional(),
  template: WorkflowDefinitionSchema.optional(),
  variables: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// Query schemas
export const WorkflowQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(["draft", "active", "inactive", "archived"]).optional(),
  createdBy: z.string().optional(),
  isTemplate: z.coerce.boolean().optional(),
  isPublic: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["name", "createdAt", "updatedAt", "executionCount"])
    .default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const WorkflowInstanceQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  workflowId: z.string().optional(),
  status: z
    .enum(["running", "completed", "failed", "cancelled", "paused"])
    .optional(),
  triggeredBy: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  sortBy: z.enum(["startedAt", "completedAt", "priority"]).default("startedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const WorkflowTaskQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  instanceId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z
    .enum(["pending", "in_progress", "completed", "rejected", "cancelled"])
    .optional(),
  taskType: z
    .enum(["manual", "approval", "review", "form", "automated"])
    .optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  isOverdue: z.coerce.boolean().optional(),
  sortBy: z.enum(["createdAt", "dueDate", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const WorkflowTemplateQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  isBuiltIn: z.coerce.boolean().optional(),
  isPublic: z.coerce.boolean().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z
    .enum(["name", "createdAt", "usageCount", "rating"])
    .default("usageCount"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Permission schemas
export const CreateWorkflowPermissionSchema = z.object({
  workflowId: z.string(),
  userId: z.string(),
  permissionType: z.enum(["view", "edit", "execute", "admin"]),
  expiresAt: z.date().optional(),
});

export const UpdateWorkflowPermissionSchema = z.object({
  permissionType: z.enum(["view", "edit", "execute", "admin"]).optional(),
  expiresAt: z.date().optional(),
});

// Execution schemas
export const ExecuteWorkflowSchema = z.object({
  workflowId: z.string(),
  data: z.record(z.any()).default({}),
  variables: z.record(z.any()).default({}),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  slaDeadline: z.date().optional(),
});

export const WorkflowActionSchema = z.object({
  action: z.enum(["start", "pause", "resume", "cancel", "retry"]),
  reason: z.string().optional(),
});

// Analytics schemas
export const WorkflowAnalyticsSchema = z.object({
  workflowId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  groupBy: z.enum(["day", "week", "month"]).default("day"),
  metrics: z
    .array(
      z.enum([
        "executions",
        "completions",
        "failures",
        "avgDuration",
        "successRate",
      ]),
    )
    .default(["executions"]),
});

// Export types for API responses
export type CreateWorkflowRequest = z.infer<typeof CreateWorkflowSchema>;
export type UpdateWorkflowRequest = z.infer<typeof UpdateWorkflowSchema>;
export type CreateWorkflowInstanceRequest = z.infer<
  typeof CreateWorkflowInstanceSchema
>;
export type UpdateWorkflowInstanceRequest = z.infer<
  typeof UpdateWorkflowInstanceSchema
>;
export type CreateWorkflowTaskRequest = z.infer<
  typeof CreateWorkflowTaskSchema
>;
export type UpdateWorkflowTaskRequest = z.infer<
  typeof UpdateWorkflowTaskSchema
>;
export type CompleteWorkflowTaskRequest = z.infer<
  typeof CompleteWorkflowTaskSchema
>;
export type CreateWorkflowTemplateRequest = z.infer<
  typeof CreateWorkflowTemplateSchema
>;
export type UpdateWorkflowTemplateRequest = z.infer<
  typeof UpdateWorkflowTemplateSchema
>;
export type WorkflowQueryRequest = z.infer<typeof WorkflowQuerySchema>;
export type WorkflowInstanceQueryRequest = z.infer<
  typeof WorkflowInstanceQuerySchema
>;
export type WorkflowTaskQueryRequest = z.infer<typeof WorkflowTaskQuerySchema>;
export type WorkflowTemplateQueryRequest = z.infer<
  typeof WorkflowTemplateQuerySchema
>;
export type CreateWorkflowPermissionRequest = z.infer<
  typeof CreateWorkflowPermissionSchema
>;
export type UpdateWorkflowPermissionRequest = z.infer<
  typeof UpdateWorkflowPermissionSchema
>;
export type ExecuteWorkflowRequest = z.infer<typeof ExecuteWorkflowSchema>;
export type WorkflowActionRequest = z.infer<typeof WorkflowActionSchema>;
export type WorkflowAnalyticsRequest = z.infer<typeof WorkflowAnalyticsSchema>;

// Export the actual schemas (not just types)
export { CreateWorkflowSchema as CreateWorkflowRequestSchema };
export { UpdateWorkflowSchema as UpdateWorkflowRequestSchema };
export { ExecuteWorkflowSchema as ExecuteWorkflowRequestSchema };
export { WorkflowQuerySchema as WorkflowQueryRequestSchema };
export { CreateWorkflowInstanceSchema as CreateWorkflowInstanceRequestSchema };
export { UpdateWorkflowInstanceSchema as UpdateWorkflowInstanceRequestSchema };
export { WorkflowInstanceQuerySchema as WorkflowInstanceQueryRequestSchema };
export { WorkflowActionSchema as WorkflowActionRequestSchema };
export { CreateWorkflowTaskSchema as CreateWorkflowTaskRequestSchema };
export { UpdateWorkflowTaskSchema as UpdateWorkflowTaskRequestSchema };
export { WorkflowTemplateQuerySchema as WorkflowTemplateQueryRequestSchema };
export { CreateWorkflowTemplateSchema as CreateWorkflowTemplateRequestSchema };
export { CompleteWorkflowTaskSchema as CompleteWorkflowTaskRequestSchema };
export { WorkflowTaskQuerySchema as WorkflowTaskQueryRequestSchema };
