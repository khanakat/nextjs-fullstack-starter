import { z } from "zod";

// ============================================================================
// INTEGRATION HUB SCHEMAS
// ============================================================================

// Base schemas for enums
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

export const WebhookMethodSchema = z.enum(["POST", "PUT", "PATCH"]);

export const WebhookStatusSchema = z.enum([
  "active",
  "inactive",
  "failed",
  "suspended",
]);

export const LogStatusSchema = z.enum([
  "success",
  "error",
  "timeout",
  "rate_limited",
  "pending",
  "cancelled",
]);

// ============================================================================
// CORE MODEL SCHEMAS
// ============================================================================

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

export const IntegrationLogSchema = z.object({
  id: z.string(),
  integrationId: z.string(),
  webhookId: z.string().optional(),
  action: z.string().min(1),
  method: z.string().optional(),
  endpoint: z.string().optional(),
  requestData: z.record(z.any()).optional(),
  responseData: z.record(z.any()).optional(),
  requestHeaders: z.record(z.string()).optional(),
  responseHeaders: z.record(z.string()).optional(),
  status: LogStatusSchema,
  statusCode: z.number().int().min(100).max(599).optional(),
  duration: z.number().int().min(0).optional(),
  errorMessage: z.string().optional(),
  errorCode: z.string().optional(),
  errorDetails: z.record(z.any()).optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.date(),
});

export const IntegrationTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  provider: IntegrationProviderSchema,
  type: IntegrationTypeSchema,
  category: IntegrationCategorySchema,
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

// ============================================================================
// CONFIGURATION SCHEMAS
// ============================================================================

export const OAuthConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url(),
  scopes: z.array(z.string()).min(1),
  authUrl: z.string().url(),
  tokenUrl: z.string().url(),
  refreshUrl: z.string().url().optional(),
});

export const ApiKeyConfigSchema = z.object({
  keyName: z.string().min(1),
  keyLocation: z.enum(["header", "query", "body"]),
  prefix: z.string().optional(),
});

export const BasicAuthConfigSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// ============================================================================
// PROVIDER-SPECIFIC CONFIGURATION SCHEMAS
// ============================================================================

export const SlackConfigSchema = z.object({
  workspaceId: z.string().optional(),
  botToken: z.string().optional(),
  userToken: z.string().optional(),
  signingSecret: z.string().optional(),
  defaultChannel: z.string().optional(),
  features: z
    .object({
      messages: z.boolean().default(true),
      files: z.boolean().default(true),
      channels: z.boolean().default(true),
      users: z.boolean().default(true),
      reactions: z.boolean().default(true),
    })
    .default({}),
});

export const SalesforceConfigSchema = z.object({
  instanceUrl: z.string().url().optional(),
  apiVersion: z.string().default("v58.0"),
  sandbox: z.boolean().default(false),
  features: z
    .object({
      leads: z.boolean().default(true),
      contacts: z.boolean().default(true),
      accounts: z.boolean().default(true),
      opportunities: z.boolean().default(true),
      cases: z.boolean().default(true),
      customObjects: z.array(z.string()).default([]),
    })
    .default({}),
});

export const JiraConfigSchema = z.object({
  baseUrl: z.string().url().optional(),
  projectKey: z.string().optional(),
  features: z
    .object({
      issues: z.boolean().default(true),
      projects: z.boolean().default(true),
      users: z.boolean().default(true),
      comments: z.boolean().default(true),
      attachments: z.boolean().default(true),
    })
    .default({}),
});

export const GoogleDriveConfigSchema = z.object({
  folderId: z.string().optional(),
  features: z
    .object({
      files: z.boolean().default(true),
      folders: z.boolean().default(true),
      sharing: z.boolean().default(true),
      comments: z.boolean().default(true),
    })
    .default({}),
});

export const StripeConfigSchema = z.object({
  webhookEndpointSecret: z.string().optional(),
  features: z
    .object({
      customers: z.boolean().default(true),
      subscriptions: z.boolean().default(true),
      invoices: z.boolean().default(true),
      payments: z.boolean().default(true),
      products: z.boolean().default(true),
    })
    .default({}),
});

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

export const CreateIntegrationRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  provider: IntegrationProviderSchema,
  type: IntegrationTypeSchema,
  category: IntegrationCategorySchema,
  config: z.record(z.any()).default({}),
  settings: z.record(z.any()).default({}),
});

export const UpdateIntegrationRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  config: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
  isEnabled: z.boolean().optional(),
});

export const CreateConnectionRequestSchema = z.object({
  connectionName: z.string().min(1).max(100),
  connectionType: ConnectionTypeSchema,
  credentials: z.record(z.any()),
  settings: z.record(z.any()).default({}),
  scopes: z.array(z.string()).default([]),
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

export const OAuthCallbackRequestSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export const TestConnectionRequestSchema = z
  .object({
    connectionId: z.string().optional(),
    credentials: z.record(z.any()).optional(),
  })
  .refine((data) => data.connectionId || data.credentials, {
    message: "Either connectionId or credentials must be provided",
  });

export const SyncRequestSchema = z.object({
  integrationId: z.string(),
  syncType: z.enum(["full", "incremental"]).default("incremental"),
  options: z.record(z.any()).default({}),
});

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

export const ConnectionTestResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  details: z.record(z.any()).optional(),
  capabilities: z.array(z.string()).optional(),
  rateLimits: z
    .object({
      remaining: z.number().int().min(0),
      reset: z.date(),
      limit: z.number().int().min(0),
    })
    .optional(),
});

export const OAuthAuthorizationUrlSchema = z.object({
  authUrl: z.string().url(),
  state: z.string(),
  codeVerifier: z.string().optional(),
});

export const SyncResultSchema = z.object({
  success: z.boolean(),
  recordsProcessed: z.number().int().min(0),
  recordsCreated: z.number().int().min(0),
  recordsUpdated: z.number().int().min(0),
  recordsDeleted: z.number().int().min(0),
  errors: z.array(
    z.object({
      record: z.any(),
      error: z.string(),
    }),
  ),
  duration: z.number().int().min(0),
  nextSyncAt: z.date().optional(),
});

// ============================================================================
// MARKETPLACE SCHEMAS
// ============================================================================

export const IntegrationSetupStepSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  type: z.enum(["oauth", "api_key", "config", "test", "complete"]),
  required: z.boolean().default(true),
  completed: z.boolean().default(false),
  data: z.record(z.any()).optional(),
});

export const IntegrationSetupWizardSchema = z.object({
  integrationId: z.string(),
  provider: IntegrationProviderSchema,
  steps: z.array(IntegrationSetupStepSchema),
  currentStep: z.number().int().min(0),
  progress: z.number().min(0).max(100),
  canProceed: z.boolean(),
  canGoBack: z.boolean(),
});

// ============================================================================
// ANALYTICS SCHEMAS
// ============================================================================

export const IntegrationAnalyticsSchema = z.object({
  integrationId: z.string(),
  period: z.object({
    start: z.date(),
    end: z.date(),
  }),
  metrics: z.object({
    totalRequests: z.number().int().min(0),
    successfulRequests: z.number().int().min(0),
    failedRequests: z.number().int().min(0),
    averageResponseTime: z.number().min(0),
    dataTransferred: z.number().min(0),
    webhooksTriggered: z.number().int().min(0),
    syncOperations: z.number().int().min(0),
  }),
  trends: z.object({
    requestsOverTime: z.array(
      z.object({
        timestamp: z.date(),
        count: z.number().int().min(0),
      }),
    ),
    errorRateOverTime: z.array(
      z.object({
        timestamp: z.date(),
        rate: z.number().min(0).max(100),
      }),
    ),
  }),
  topErrors: z.array(
    z.object({
      error: z.string(),
      count: z.number().int().min(0),
      lastOccurred: z.date(),
    }),
  ),
});

// ============================================================================
// WORKFLOW INTEGRATION SCHEMAS
// ============================================================================

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

// ============================================================================
// UTILITY SCHEMAS
// ============================================================================

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const FilterSchema = z.object({
  provider: IntegrationProviderSchema.optional(),
  type: IntegrationTypeSchema.optional(),
  category: IntegrationCategorySchema.optional(),
  status: IntegrationStatusSchema.optional(),
  search: z.string().optional(),
});

// List request schemas
export const ListIntegrationsRequestSchema =
  PaginationSchema.merge(FilterSchema);

export const ListWebhooksRequestSchema = z
  .object({
    integrationId: z.string(),
  })
  .merge(PaginationSchema);

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

// ============================================================================
// EXPORT TYPES FOR RUNTIME VALIDATION
// ============================================================================

export type CreateIntegrationRequest = z.infer<
  typeof CreateIntegrationRequestSchema
>;
export type UpdateIntegrationRequest = z.infer<
  typeof UpdateIntegrationRequestSchema
>;
export type CreateConnectionRequest = z.infer<
  typeof CreateConnectionRequestSchema
>;
export type CreateWebhookRequest = z.infer<typeof CreateWebhookRequestSchema>;
export type OAuthCallbackRequest = z.infer<typeof OAuthCallbackRequestSchema>;
export type TestConnectionRequest = z.infer<typeof TestConnectionRequestSchema>;
export type SyncRequest = z.infer<typeof SyncRequestSchema>;
export type ConnectionTestResult = z.infer<typeof ConnectionTestResultSchema>;
export type OAuthAuthorizationUrl = z.infer<typeof OAuthAuthorizationUrlSchema>;
export type SyncResult = z.infer<typeof SyncResultSchema>;
export type IntegrationSetupStep = z.infer<typeof IntegrationSetupStepSchema>;
export type IntegrationSetupWizard = z.infer<
  typeof IntegrationSetupWizardSchema
>;
export type IntegrationAnalytics = z.infer<typeof IntegrationAnalyticsSchema>;
export type IntegrationWorkflowStep = z.infer<
  typeof IntegrationWorkflowStepSchema
>;
export type IntegrationTrigger = z.infer<typeof IntegrationTriggerSchema>;
export type PaginationParams = z.infer<typeof PaginationSchema>;
export type FilterParams = z.infer<typeof FilterSchema>;
export type ListIntegrationsRequest = z.infer<
  typeof ListIntegrationsRequestSchema
>;
export type ListWebhooksRequest = z.infer<typeof ListWebhooksRequestSchema>;
export type UpdateWebhookRequest = z.infer<typeof UpdateWebhookRequestSchema>;

// ============================================================================
// INTEGRATION HUB SCHEMAS - Legacy compatibility layer
// This file is kept for backward compatibility. New code should use the
// modular schemas from ./integration/ directory.
// ============================================================================

// Re-export all schemas from modular structure
export * from "./integration/core";
export * from "./integration/webhooks";
export * from "./integration/auth";
export * from "./integration/providers";
export * from "./integration/requests";
export * from "./integration/responses";
export * from "./integration/analytics";
export * from "./integration/workflow";

// Legacy compatibility - deprecated
// All schemas are now available through the modular structure above
