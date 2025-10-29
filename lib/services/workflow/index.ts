// External dependencies
// (none currently)

// Internal services
export { WorkflowCoreService, workflowCoreService } from "./core";
export {
  WorkflowExecutionService,
  workflowExecutionService,
} from "./execution";
export { WorkflowTaskService, workflowTaskService } from "./tasks";
export { WorkflowTemplateService, workflowTemplateService } from "./templates";

// Step processors
export {
  StepProcessor,
  getStepProcessor,
  StartStepProcessor,
  TaskStepProcessor,
  ApprovalStepProcessor,
  ConditionStepProcessor,
  NotificationStepProcessor,
  WebhookStepProcessor,
  EndStepProcessor,
} from "./processors";
export type { StepProcessorResult } from "./processors";

// Internal imports for unified service
import { workflowCoreService } from "./core";
import { workflowExecutionService } from "./execution";
import { workflowTaskService } from "./tasks";
import { workflowTemplateService } from "./templates";
import { getStepProcessor } from "./processors";

/**
 * Unified workflow service that combines all workflow functionality
 * Provides a single interface for all workflow operations including:
 * - Core workflow management
 * - Workflow execution and instances
 * - Task management
 * - Template management
 */
export class WorkflowService {
  // ========================================================================
  // Core workflow operations
  // ========================================================================

  /** Create a new workflow */
  createWorkflow = workflowCoreService.createWorkflow.bind(workflowCoreService);

  /** Get a workflow by ID */
  getWorkflow = workflowCoreService.getWorkflow.bind(workflowCoreService);

  /** Get all workflows with optional filtering */
  getWorkflows = workflowCoreService.getWorkflows.bind(workflowCoreService);

  /** Update an existing workflow */
  updateWorkflow = workflowCoreService.updateWorkflow.bind(workflowCoreService);

  /** Delete a workflow */
  deleteWorkflow = workflowCoreService.deleteWorkflow.bind(workflowCoreService);

  // ========================================================================
  // Workflow execution operations
  // ========================================================================

  /** Execute a workflow and create a new instance */
  executeWorkflow = workflowExecutionService.executeWorkflow.bind(
    workflowExecutionService,
  );

  /** Process a workflow instance through its steps */
  processWorkflowInstance =
    workflowExecutionService.processWorkflowInstance.bind(
      workflowExecutionService,
    );

  /** Create a new workflow instance */
  createWorkflowInstance = workflowExecutionService.createWorkflowInstance.bind(
    workflowExecutionService,
  );

  /** Get a workflow instance by ID */
  getWorkflowInstance = workflowExecutionService.getWorkflowInstance.bind(
    workflowExecutionService,
  );

  /** Get all workflow instances with optional filtering */
  getWorkflowInstances = workflowExecutionService.getWorkflowInstances.bind(
    workflowExecutionService,
  );

  /** Update a workflow instance */
  updateWorkflowInstance = workflowExecutionService.updateWorkflowInstance.bind(
    workflowExecutionService,
  );

  /** Perform an action on a workflow instance */
  performWorkflowAction = workflowExecutionService.performWorkflowAction.bind(
    workflowExecutionService,
  );

  // ========================================================================
  // Workflow task operations
  // ========================================================================

  /** Create a new workflow task */
  createWorkflowTask =
    workflowTaskService.createWorkflowTask.bind(workflowTaskService);

  /** Get a workflow task by ID */
  getWorkflowTask =
    workflowTaskService.getWorkflowTask.bind(workflowTaskService);

  /** Get all workflow tasks with optional filtering */
  getWorkflowTasks =
    workflowTaskService.getWorkflowTasks.bind(workflowTaskService);

  /** Update a workflow task */
  updateWorkflowTask =
    workflowTaskService.updateWorkflowTask.bind(workflowTaskService);

  /** Complete a workflow task */
  completeWorkflowTask =
    workflowTaskService.completeWorkflowTask.bind(workflowTaskService);

  // ========================================================================
  // Workflow template operations
  // ========================================================================

  /** Create a new workflow template */
  createWorkflowTemplate = workflowTemplateService.createWorkflowTemplate.bind(
    workflowTemplateService,
  );

  /** Get a workflow template by ID */
  getWorkflowTemplate = workflowTemplateService.getWorkflowTemplate.bind(
    workflowTemplateService,
  );

  /** Get all workflow templates with optional filtering */
  getWorkflowTemplates = workflowTemplateService.getWorkflowTemplates.bind(
    workflowTemplateService,
  );

  /** Update a workflow template */
  updateWorkflowTemplate = workflowTemplateService.updateWorkflowTemplate.bind(
    workflowTemplateService,
  );

  /** Delete a workflow template */
  deleteWorkflowTemplate = workflowTemplateService.deleteWorkflowTemplate.bind(
    workflowTemplateService,
  );
}

/** Singleton instance of the unified workflow service */
export const workflowService = new WorkflowService();

// Internal types
export type {
  Workflow,
  WorkflowInstance,
  WorkflowTask,
  WorkflowTemplate,
  WorkflowStep,
  WorkflowStatus,
  WorkflowTaskStatus,
  WorkflowPriority,
  WorkflowTaskType,
  WorkflowAssignmentType,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  WorkflowQueryRequest,
  CreateWorkflowInstanceRequest,
  UpdateWorkflowInstanceRequest,
  WorkflowInstanceQueryRequest,
  CreateWorkflowTaskRequest,
  UpdateWorkflowTaskRequest,
  CompleteWorkflowTaskRequest,
  WorkflowTaskQueryRequest,
  CreateWorkflowTemplateRequest,
  WorkflowTemplateQueryRequest,
} from "@/lib/types/workflows";

// ============================================================================
// WORKFLOW SYSTEM EXPORTS - Main entry point for workflow functionality
// ============================================================================

/**
 * Main workflow system interface providing access to all workflow services
 */
export const WorkflowSystem = {
  // Core workflow management
  workflows: workflowService,

  // Workflow execution engine
  execution: workflowExecutionService,

  // Step processors
  processors: { getStepProcessor },

  // Task management
  tasks: workflowTaskService,

  // Template management
  templates: workflowTemplateService,
} as const;
