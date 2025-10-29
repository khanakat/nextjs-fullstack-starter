import { z } from "zod";

// ============================================================================
// CORE INTEGRATION SCHEMAS
// ============================================================================

// Base enums
export const IntegrationProviderSchema = z.enum([
  // Communication
  "slack",
  "discord",
  "microsoft_teams",
  "telegram",
  // CRM
  "salesforce",
  "hubspot",
  "pipedrive",
  "zoho",
  // Project Management
  "jira",
  "asana",
  "trello",
  "monday",
  // Storage
  "google_drive",
  "dropbox",
  "onedrive",
  "aws_s3",
  // Analytics
  "google_analytics",
  "mixpanel",
  "amplitude",
  // Payment
  "stripe",
  "paypal",
  "square",
  // Email
  "sendgrid",
  "mailchimp",
  "convertkit",
  // Custom
  "webhook",
  "custom",
]);

export const IntegrationTypeSchema = z.enum([
  "communication",
  "crm",
  "project_management",
  "storage",
  "analytics",
  "payment",
  "email",
  "webhook",
  "custom",
]);

export const IntegrationCategorySchema = z.enum([
  "productivity",
  "business",
  "developer",
  "marketing",
  "sales",
  "support",
  "finance",
  "hr",
  "operations",
  "other",
]);

export const IntegrationStatusSchema = z.enum([
  "inactive",
  "active",
  "error",
  "suspended",
  "configuring",
]);

export const ConnectionTypeSchema = z.enum([
  "oauth",
  "api_key",
  "basic_auth",
  "bearer_token",
  "custom",
]);

export const ConnectionStatusSchema = z.enum([
  "connected",
  "disconnected",
  "expired",
  "error",
  "refreshing",
]);

// Core integration schema
export const IntegrationSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  provider: IntegrationProviderSchema,
  type: IntegrationTypeSchema,
  category: IntegrationCategorySchema,
  config: z.record(z.any()).default({}),
  settings: z.record(z.any()).default({}),
  status: IntegrationStatusSchema.default("inactive"),
  isEnabled: z.boolean().default(true),
  lastSync: z.date().optional(),
  lastError: z.string().optional(),
  organizationId: z.string(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const IntegrationConnectionSchema = z.object({
  id: z.string(),
  integrationId: z.string(),
  connectionName: z.string().min(1).max(100),
  connectionType: ConnectionTypeSchema.default("oauth"),
  credentials: z.record(z.any()).default({}),
  refreshToken: z.string().optional(),
  tokenExpiry: z.date().optional(),
  settings: z.record(z.any()).default({}),
  scopes: z.array(z.string()).default([]),
  status: ConnectionStatusSchema.default("connected"),
  lastConnected: z.date().optional(),
  lastError: z.string().optional(),
  retryCount: z.number().int().min(0).default(0),
  rateLimitRemaining: z.number().int().min(0).optional(),
  rateLimitReset: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Type exports
export type IntegrationProvider = z.infer<typeof IntegrationProviderSchema>;
export type IntegrationType = z.infer<typeof IntegrationTypeSchema>;
export type IntegrationCategory = z.infer<typeof IntegrationCategorySchema>;
export type IntegrationStatus = z.infer<typeof IntegrationStatusSchema>;
export type ConnectionType = z.infer<typeof ConnectionTypeSchema>;
export type ConnectionStatus = z.infer<typeof ConnectionStatusSchema>;
export type Integration = z.infer<typeof IntegrationSchema>;
export type IntegrationConnection = z.infer<typeof IntegrationConnectionSchema>;
