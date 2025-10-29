import { z } from "zod";

// Webhook-related schemas
export const WebhookMethodSchema = z.enum(["POST", "PUT", "PATCH"]);

export const WebhookStatusSchema = z.enum([
  "active",
  "inactive",
  "failed",
  "suspended",
]);

export const WebhookRetryPolicySchema = z.object({
  maxRetries: z.number().int().min(0).max(10).default(3),
  retryDelay: z.number().int().min(1000).max(300000).default(5000), // 1s to 5min
  backoffMultiplier: z.number().min(1).max(5).default(2),
  maxDelay: z.number().int().min(5000).max(3600000).default(300000), // 5s to 1h
});

export const IntegrationWebhookSchema = z.object({
  id: z.string(),
  integrationId: z.string(),
  name: z.string().min(1).max(100),
  url: z.string().url(),
  method: WebhookMethodSchema.default("POST"),
  events: z.array(z.string()).min(1),
  filters: z.record(z.any()).default({}),
  secret: z.string().optional(),
  headers: z.record(z.string()).default({}),
  retryPolicy: WebhookRetryPolicySchema.default({}),
  timeout: z.number().int().min(5).max(300).default(30), // 5s to 5min
  status: WebhookStatusSchema.default("active"),
  isEnabled: z.boolean().default(true),
  lastTriggered: z.date().optional(),
  lastError: z.string().optional(),
  successCount: z.number().int().min(0).default(0),
  failureCount: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateWebhookRequestSchema = z.object({
  integrationId: z.string(),
  name: z.string().min(1).max(100),
  url: z.string().url(),
  method: WebhookMethodSchema.default("POST"),
  events: z.array(z.string()).min(1),
  filters: z.record(z.any()).default({}),
  secret: z.string().optional(),
  headers: z.record(z.string()).default({}),
  retryPolicy: WebhookRetryPolicySchema.partial().default({}),
  timeout: z.number().int().min(5).max(300).default(30),
});

export const UpdateWebhookRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  method: WebhookMethodSchema.optional(),
  events: z.array(z.string()).min(1).optional(),
  filters: z.record(z.any()).optional(),
  secret: z.string().optional(),
  headers: z.record(z.string()).optional(),
  retryPolicy: WebhookRetryPolicySchema.partial().optional(),
  timeout: z.number().int().min(5).max(300).optional(),
  isEnabled: z.boolean().optional(),
});

export const ListWebhooksRequestSchema = z.object({
  integrationId: z.string(),
});

// Types
export type IntegrationWebhook = z.infer<typeof IntegrationWebhookSchema>;
export type CreateWebhookRequest = z.infer<typeof CreateWebhookRequestSchema>;
export type UpdateWebhookRequest = z.infer<typeof UpdateWebhookRequestSchema>;
export type ListWebhooksRequest = z.infer<typeof ListWebhooksRequestSchema>;
