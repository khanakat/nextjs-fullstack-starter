// Internal types
import {
  WorkflowInstanceWithDetails,
  WorkflowNode,
  WorkflowStepType,
  WorkflowPriority,
} from "@/lib/types/workflows";

// Services
import { NotificationService } from "@/lib/notifications";
import { workflowTaskService } from "./tasks";

// ============================================================================
// WORKFLOW STEP PROCESSORS - Handle different types of workflow steps
// ============================================================================

/**
 * Result interface for workflow step processing
 */
export interface StepProcessorResult {
  completed: boolean;
  nextStepId?: string;
  error?: string;
  data?: Record<string, any>;
}

/**
 * Abstract base class for workflow step processors
 */
export abstract class StepProcessor {
  /**
   * Process a workflow step
   * @param instance - Workflow instance with details
   * @param step - Workflow step to process
   * @returns Promise resolving to step processing result
   */
  abstract process(
    instance: WorkflowInstanceWithDetails,
    step: WorkflowNode,
  ): Promise<StepProcessorResult>;
}

// ========================================
// STEP PROCESSOR IMPLEMENTATIONS
// ========================================

/**
 * Processor for start workflow steps
 */
export class StartStepProcessor extends StepProcessor {
  /**
   * Process a start step - simply moves to the next step
   * @param _instance - Workflow instance (unused)
   * @param _step - Start step (unused)
   * @returns Promise resolving to completion result
   */
  async process(
    _instance: WorkflowInstanceWithDetails,
    _step: WorkflowNode,
  ): Promise<StepProcessorResult> {
    return { completed: true };
  }
}

/**
 * Processor for task workflow steps
 */
export class TaskStepProcessor extends StepProcessor {
  /**
   * Process a task step by creating a workflow task
   * @param instance - Workflow instance with details
   * @param step - Task step to process
   * @returns Promise resolving to step processing result
   */
  async process(
    instance: WorkflowInstanceWithDetails,
    step: WorkflowNode,
  ): Promise<StepProcessorResult> {
    try {
      await workflowTaskService.createWorkflowTask(
        {
          instanceId: instance.id,
          stepId: step.id,
          name: step.data?.label || step.id,
          description: step.data?.description || "",
          taskType: "manual",
          priority:
            (step.data?.config?.priority as WorkflowPriority) || "normal",
          assigneeId: step.data?.config?.assigneeId,
          assignmentType: "manual",
          dueDate: step.data?.config?.dueDate
            ? new Date(step.data.config.dueDate)
            : undefined,
          formData: {},
          attachments: [],
        },
        instance.triggeredBy || "system",
      );

      return { completed: false }; // Task needs to be completed manually
    } catch (error) {
      return {
        completed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

/**
 * Processor for approval workflow steps
 */
export class ApprovalStepProcessor extends StepProcessor {
  /**
   * Process an approval step by creating an approval task
   * @param instance - Workflow instance with details
   * @param step - Approval step to process
   * @returns Promise resolving to step processing result
   */
  async process(
    instance: WorkflowInstanceWithDetails,
    step: WorkflowNode,
  ): Promise<StepProcessorResult> {
    try {
      await workflowTaskService.createWorkflowTask(
        {
          instanceId: instance.id,
          stepId: step.id,
          name: `Approval: ${step.data?.label || step.id}`,
          description: step.data?.description || "Approval required",
          taskType: "approval",
          priority: (step.data?.config?.priority as WorkflowPriority) || "high",
          assigneeId: step.data?.config?.assigneeId,
          assignmentType: "manual",
          dueDate: step.data?.config?.dueDate
            ? new Date(step.data.config.dueDate)
            : undefined,
          formData: {},
          attachments: [],
        },
        instance.triggeredBy || "system",
      );

      return { completed: false }; // Approval needs to be completed manually
    } catch (error) {
      return {
        completed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

/**
 * Processor for condition workflow steps
 */
export class ConditionStepProcessor extends StepProcessor {
  /**
   * Process a condition step by evaluating conditions
   * @param _instance - Workflow instance (unused for now)
   * @param step - Condition step to process
   * @returns Promise resolving to step processing result
   */
  async process(
    _instance: WorkflowInstanceWithDetails,
    step: WorkflowNode,
  ): Promise<StepProcessorResult> {
    try {
      // Simple condition evaluation - in a real implementation,
      // this would evaluate the condition against instance data
      const condition = step.data?.conditions;
      if (condition) {
        // For now, just return the first connection
        const connections = step.data?.config?.connections || [];
        if (connections.length > 0) {
          return {
            completed: true,
            nextStepId: connections[0].targetId,
          };
        }
      }

      return { completed: true };
    } catch (error) {
      return {
        completed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

/**
 * Processor for notification workflow steps
 */
export class NotificationStepProcessor extends StepProcessor {
  /**
   * Process a notification step by sending notifications
   * @param instance - Workflow instance with details
   * @param step - Notification step to process
   * @returns Promise resolving to step processing result
   */
  async process(
    instance: WorkflowInstanceWithDetails,
    step: WorkflowNode,
  ): Promise<StepProcessorResult> {
    try {
      const notificationData = step.data?.config?.notification;
      if (notificationData) {
        await NotificationService.notify(
          notificationData.userId || instance.triggeredBy || "system",
          {
            title: notificationData.title || "Workflow Notification",
            message: notificationData.message || "",
            type: notificationData.type || "info",
            priority: notificationData.priority || "medium",
            channels: {
              inApp: true,
              email: false,
              push: false,
            },
          },
        );
      }

      return { completed: true };
    } catch (error) {
      return {
        completed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

/**
 * Processor for webhook workflow steps
 */
export class WebhookStepProcessor extends StepProcessor {
  /**
   * Process a webhook step by making HTTP requests
   * @param instance - Workflow instance with details
   * @param step - Webhook step to process
   * @returns Promise resolving to step processing result
   */
  async process(
    instance: WorkflowInstanceWithDetails,
    step: WorkflowNode,
  ): Promise<StepProcessorResult> {
    try {
      const webhookData = step.data?.config?.webhook;
      if (webhookData) {
        const response = await fetch(webhookData.url, {
          method: webhookData.method || "POST",
          headers: {
            "Content-Type": "application/json",
            ...webhookData.headers,
          },
          body: JSON.stringify({
            workflowInstanceId: instance.id,
            stepId: step.id,
            data: instance.data,
            ...webhookData.payload,
          }),
        });

        if (!response.ok) {
          throw new Error(`Webhook failed with status ${response.status}`);
        }

        const responseData = await response.json();
        return {
          completed: true,
          data: responseData,
        };
      }

      return { completed: true };
    } catch (error) {
      return {
        completed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

/**
 * Processor for end workflow steps
 */
export class EndStepProcessor extends StepProcessor {
  /**
   * Process an end step - marks workflow as completed
   * @param _instance - Workflow instance (unused)
   * @param _step - End step (unused)
   * @returns Promise resolving to completion result
   */
  async process(
    _instance: WorkflowInstanceWithDetails,
    _step: WorkflowNode,
  ): Promise<StepProcessorResult> {
    return { completed: true };
  }
}

// ========================================
// PROCESSOR FACTORY
// ========================================

/**
 * Get the appropriate step processor for a given workflow step type
 * @param stepType - The type of workflow step to process
 * @returns The step processor instance for the given type
 * @throws Error if the step type is not supported
 */
export function getStepProcessor(stepType: WorkflowStepType): StepProcessor {
  switch (stepType) {
    case "start":
      return new StartStepProcessor();
    case "task":
      return new TaskStepProcessor();
    case "approval":
      return new ApprovalStepProcessor();
    case "condition":
      return new ConditionStepProcessor();
    case "notification":
      return new NotificationStepProcessor();
    case "webhook":
      return new WebhookStepProcessor();
    case "end":
      return new EndStepProcessor();
    default:
      throw new Error(`Unsupported step type: ${stepType}`);
  }
}
