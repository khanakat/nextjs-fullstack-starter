// ============================================================================
// INTEGRATION HUB TYPES
// ============================================================================

export interface Integration {
  id: string;
  name: string;
  description?: string;
  provider: IntegrationProvider;
  type: IntegrationType;
  category: IntegrationCategory;
  config: Record<string, any>;
  settings: Record<string, any>;
  status: IntegrationStatus;
  isEnabled: boolean;
  lastSync?: Date;
  lastError?: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  connections?: IntegrationConnection[];
  webhooks?: IntegrationWebhook[];
  logs?: IntegrationLog[];
}

export interface IntegrationConnection {
  id: string;
  integrationId: string;
  connectionName: string;
  connectionType: ConnectionType;
  credentials: Record<string, any>;
  refreshToken?: string;
  tokenExpiry?: Date;
  settings: Record<string, any>;
  scopes: string[];
  status: ConnectionStatus;
  lastConnected?: Date;
  lastError?: string;
  retryCount: number;
  rateLimitRemaining?: number;
  rateLimitReset?: Date;
  createdAt: Date;
  updatedAt: Date;
  integration?: Integration;
}

export interface IntegrationWebhook {
  id: string;
  integrationId: string;
  name: string;
  url: string;
  method: WebhookMethod;
  events: string[];
  filters: Record<string, any>;
  secret?: string;
  headers: Record<string, string>;
  retryPolicy: WebhookRetryPolicy;
  timeout: number;
  status: WebhookStatus;
  isEnabled: boolean;
  lastTriggered?: Date;
  lastError?: string;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
  integration?: Integration;
  logs?: IntegrationLog[];
}

export interface IntegrationLog {
  id: string;
  integrationId: string;
  webhookId?: string;
  action: string;
  method?: string;
  endpoint?: string;
  requestData?: Record<string, any>;
  responseData?: Record<string, any>;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  status: LogStatus;
  statusCode?: number;
  duration?: number;
  errorMessage?: string;
  errorCode?: string;
  errorDetails?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  integration?: Integration;
  webhook?: IntegrationWebhook;
}

export interface IntegrationTemplate {
  id: string;
  name: string;
  description?: string;
  provider: IntegrationProvider;
  type: IntegrationType;
  category: IntegrationCategory;
  template: Record<string, any>;
  defaultConfig: Record<string, any>;
  requiredScopes: string[];
  isBuiltIn: boolean;
  isPublic: boolean;
  tags: string[];
  version: string;
  setupGuide?: string;
  apiDocs?: string;
  supportUrl?: string;
  usageCount: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// ENUMS AND TYPES
// ============================================================================

export type IntegrationProvider =
  // Communication
  | "slack"
  | "discord"
  | "microsoft_teams"
  | "telegram"
  // CRM
  | "salesforce"
  | "hubspot"
  | "pipedrive"
  | "zoho"
  // Project Management
  | "jira"
  | "asana"
  | "trello"
  | "monday"
  // Storage
  | "google_drive"
  | "dropbox"
  | "onedrive"
  | "aws_s3"
  // Analytics
  | "google_analytics"
  | "mixpanel"
  | "amplitude"
  // Payment
  | "stripe"
  | "paypal"
  | "square"
  // Email
  | "sendgrid"
  | "mailchimp"
  | "convertkit"
  // Custom
  | "webhook"
  | "custom";

export type IntegrationType =
  | "communication"
  | "crm"
  | "project_management"
  | "storage"
  | "analytics"
  | "payment"
  | "email"
  | "webhook"
  | "custom";

export type IntegrationCategory =
  | "productivity"
  | "business"
  | "developer"
  | "marketing"
  | "sales"
  | "support"
  | "finance"
  | "hr"
  | "operations"
  | "other";

export type IntegrationStatus =
  | "inactive"
  | "active"
  | "error"
  | "suspended"
  | "configuring";

export type ConnectionType =
  | "oauth"
  | "api_key"
  | "basic_auth"
  | "bearer_token"
  | "custom";

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "expired"
  | "error"
  | "refreshing";

export type WebhookMethod = "POST" | "PUT" | "PATCH";

export type WebhookStatus = "active" | "inactive" | "failed" | "suspended";

export type LogStatus =
  | "success"
  | "error"
  | "timeout"
  | "rate_limited"
  | "pending"
  | "cancelled";

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface WebhookRetryPolicy {
  maxRetries: number;
  retryDelay: number; // milliseconds
  backoffMultiplier: number;
  maxDelay: number; // milliseconds
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
  refreshUrl?: string;
}

export interface ApiKeyConfig {
  keyName: string;
  keyLocation: "header" | "query" | "body";
  prefix?: string;
}

export interface BasicAuthConfig {
  username: string;
  password: string;
}

// ============================================================================
// PROVIDER-SPECIFIC CONFIGURATIONS
// ============================================================================

export interface SlackConfig {
  workspaceId?: string;
  botToken?: string;
  userToken?: string;
  signingSecret?: string;
  defaultChannel?: string;
  features: {
    messages: boolean;
    files: boolean;
    channels: boolean;
    users: boolean;
    reactions: boolean;
  };
}

export interface SalesforceConfig {
  instanceUrl?: string;
  apiVersion: string;
  sandbox: boolean;
  features: {
    leads: boolean;
    contacts: boolean;
    accounts: boolean;
    opportunities: boolean;
    cases: boolean;
    customObjects: string[];
  };
}

export interface JiraConfig {
  baseUrl?: string;
  projectKey?: string;
  features: {
    issues: boolean;
    projects: boolean;
    users: boolean;
    comments: boolean;
    attachments: boolean;
  };
}

export interface GoogleDriveConfig {
  folderId?: string;
  features: {
    files: boolean;
    folders: boolean;
    sharing: boolean;
    comments: boolean;
  };
}

export interface StripeConfig {
  webhookEndpointSecret?: string;
  features: {
    customers: boolean;
    subscriptions: boolean;
    invoices: boolean;
    payments: boolean;
    products: boolean;
  };
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateIntegrationRequest {
  name: string;
  description?: string;
  provider: IntegrationProvider;
  type: IntegrationType;
  category: IntegrationCategory;
  config?: Record<string, any>;
  settings?: Record<string, any>;
}

export interface UpdateIntegrationRequest {
  name?: string;
  description?: string;
  config?: Record<string, any>;
  settings?: Record<string, any>;
  isEnabled?: boolean;
}

export interface CreateConnectionRequest {
  connectionName: string;
  connectionType: ConnectionType;
  credentials: Record<string, any>;
  settings?: Record<string, any>;
  scopes?: string[];
}

export interface CreateWebhookRequest {
  name: string;
  url: string;
  method?: WebhookMethod;
  events: string[];
  filters?: Record<string, any>;
  secret?: string;
  headers?: Record<string, string>;
  retryPolicy?: Partial<WebhookRetryPolicy>;
  timeout?: number;
}

export interface OAuthCallbackRequest {
  code: string;
  state: string;
  error?: string;
  error_description?: string;
}

export interface TestConnectionRequest {
  connectionId?: string;
  credentials?: Record<string, any>;
}

export interface SyncRequest {
  integrationId: string;
  syncType: "full" | "incremental";
  options?: Record<string, any>;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface IntegrationResponse {
  integration: Integration;
  connections: IntegrationConnection[];
  webhooks: IntegrationWebhook[];
  health: {
    status: IntegrationStatus;
    lastSync?: Date;
    nextSync?: Date;
    errorCount: number;
    successRate: number;
  };
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
  capabilities?: string[];
  rateLimits?: {
    remaining: number;
    reset: Date;
    limit: number;
  };
}

export interface OAuthAuthorizationUrl {
  authUrl: string;
  state: string;
  codeVerifier?: string; // For PKCE
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  errors: Array<{
    record: any;
    error: string;
  }>;
  duration: number;
  nextSyncAt?: Date;
}

// ============================================================================
// MARKETPLACE TYPES
// ============================================================================

export interface IntegrationMarketplaceItem {
  template: IntegrationTemplate;
  isInstalled: boolean;
  installedIntegration?: Integration;
  popularity: number;
  lastUpdated: Date;
  screenshots?: string[];
  features: string[];
  pricing?: {
    free: boolean;
    plans: Array<{
      name: string;
      price: number;
      features: string[];
    }>;
  };
}

export interface IntegrationSetupStep {
  id: string;
  title: string;
  description: string;
  type: "oauth" | "api_key" | "config" | "test" | "complete";
  required: boolean;
  completed: boolean;
  data?: Record<string, any>;
}

export interface IntegrationSetupWizard {
  integrationId: string;
  provider: IntegrationProvider;
  steps: IntegrationSetupStep[];
  currentStep: number;
  progress: number;
  canProceed: boolean;
  canGoBack: boolean;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface IntegrationAnalytics {
  integrationId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    dataTransferred: number;
    webhooksTriggered: number;
    syncOperations: number;
  };
  trends: {
    requestsOverTime: Array<{
      timestamp: Date;
      count: number;
    }>;
    errorRateOverTime: Array<{
      timestamp: Date;
      rate: number;
    }>;
  };
  topErrors: Array<{
    error: string;
    count: number;
    lastOccurred: Date;
  }>;
}

// ============================================================================
// WORKFLOW INTEGRATION TYPES
// ============================================================================

export interface IntegrationWorkflowStep {
  id: string;
  type: "integration_action" | "integration_trigger";
  integrationId: string;
  action: string;
  config: Record<string, any>;
  inputMapping: Record<string, string>;
  outputMapping: Record<string, string>;
  errorHandling: {
    onError: "fail" | "continue" | "retry";
    retryCount?: number;
    retryDelay?: number;
  };
}

export interface IntegrationTrigger {
  id: string;
  integrationId: string;
  event: string;
  filters: Record<string, any>;
  workflowId: string;
  isEnabled: boolean;
  lastTriggered?: Date;
  triggerCount: number;
}
