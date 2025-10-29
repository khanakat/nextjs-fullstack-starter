import { z } from "zod";

// Workflow integration schemas
export const IntegrationWorkflowStepSchema = z.object({
  id: z.string(),
  type: z.enum(["integration_action", "integration_trigger"]),
  integrationId: z.string(),
  action: z.string().min(1),
  config: z.record(z.any()).default({}),
  inputMapping: z.record(z.string()).default({}),
  outputMapping: z.record(z.string()).default({}),
  errorHandling: z
    .object({
      onError: z.enum(["fail", "continue", "retry"]).default("fail"),
      retryCount: z.number().int().min(0).max(10).optional(),
      retryDelay: z.number().int().min(1000).max(300000).optional(),
    })
    .default({}),
});

export const IntegrationTriggerSchema = z.object({
  id: z.string(),
  integrationId: z.string(),
  event: z.string().min(1),
  filters: z.record(z.any()).default({}),
  workflowId: z.string(),
  isEnabled: z.boolean().default(true),
  lastTriggered: z.date().optional(),
  triggerCount: z.number().int().min(0).default(0),
});

export const IntegrationTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  provider: z.string(),
  type: z.string(),
  category: z.string(),
  template: z.record(z.any()).default({}),
  defaultConfig: z.record(z.any()).default({}),
  requiredScopes: z.array(z.string()).default([]),
  isBuiltIn: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  version: z.string().default("1.0.0"),
  setupGuide: z.string().optional(),
  apiDocs: z.string().optional(),
  supportUrl: z.string().optional(),
  usageCount: z.number().int().min(0).default(0),
  rating: z.number().min(0).max(5).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Types
export type IntegrationWorkflowStep = z.infer<
  typeof IntegrationWorkflowStepSchema
>;
export type IntegrationTrigger = z.infer<typeof IntegrationTriggerSchema>;
export type IntegrationTemplate = z.infer<typeof IntegrationTemplateSchema>;
