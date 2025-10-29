import { AuditLog, User, Organization } from "@prisma/client";

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

// Audit log with relations
export interface AuditLogWithRelations extends AuditLog {
  user?: User | null;
  organization?: Organization | null;
}

// Audit log creation data
export interface CreateAuditLogData {
  action: AuditLogAction | string;
  resource: string;
  resourceId?: string;
  userId?: string;
  organizationId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  status?: AuditLogStatus;
  severity?: AuditLogSeverity;
  category?: AuditLogCategory;
  retentionDate?: Date;
}

// ============================================================================
// AUDIT LOG ENUMS
// ============================================================================

export enum AuditLogAction {
  // User actions
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  REGISTER = "REGISTER",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  PASSWORD_RESET = "PASSWORD_RESET",
  PROFILE_UPDATE = "PROFILE_UPDATE",

  // CRUD operations
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",

  // Organization actions
  ORG_CREATE = "ORG_CREATE",
  ORG_UPDATE = "ORG_UPDATE",
  ORG_DELETE = "ORG_DELETE",
  ORG_INVITE = "ORG_INVITE",
  ORG_JOIN = "ORG_JOIN",
  ORG_LEAVE = "ORG_LEAVE",
  ORG_ROLE_CHANGE = "ORG_ROLE_CHANGE",

  // Security actions
  SECURITY_ALERT = "SECURITY_ALERT",
  RATE_LIMIT_HIT = "RATE_LIMIT_HIT",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",

  // Data actions
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
  BACKUP = "BACKUP",
  RESTORE = "RESTORE",

  // System actions
  SYSTEM_START = "SYSTEM_START",
  SYSTEM_STOP = "SYSTEM_STOP",
  MAINTENANCE = "MAINTENANCE",

  // Report actions
  REPORT_CREATE = "REPORT_CREATE",
  REPORT_UPDATE = "REPORT_UPDATE",
  REPORT_DELETE = "REPORT_DELETE",
  REPORT_EXPORT = "REPORT_EXPORT",
  REPORT_SHARE = "REPORT_SHARE",
}

export enum AuditLogStatus {
  SUCCESS = "success",
  FAILURE = "failure",
  WARNING = "warning",
  PENDING = "pending",
}

export enum AuditLogSeverity {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  INFO = "info",
}

export enum AuditLogCategory {
  SECURITY = "security",
  DATA = "data",
  SYSTEM = "system",
  USER = "user",
  ORGANIZATION = "organization",
  REPORT = "report",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  GENERAL = "general",
  WORKFLOW = "workflow",
  COMPLIANCE = "compliance",
}

export enum AuditLogResource {
  USER = "User",
  ORGANIZATION = "Organization",
  ORGANIZATION_MEMBER = "OrganizationMember",
  ORGANIZATION_INVITE = "OrganizationInvite",
  REPORT = "Report",
  TEMPLATE = "Template",
  NOTIFICATION = "Notification",
  SYSTEM = "System",
  SESSION = "Session",
  API_KEY = "ApiKey",
  WORKFLOW = "Workflow",
  WORKFLOW_INSTANCE = "WorkflowInstance",
  WORKFLOW_TASK = "WorkflowTask",
  WORKFLOW_TEMPLATE = "WorkflowTemplate",
}

// ============================================================================
// AUDIT LOG FILTERS & QUERIES
// ============================================================================

export interface AuditLogFilters {
  userId?: string;
  organizationId?: string;
  action?: string | string[];
  resource?: string | string[];
  category?: AuditLogCategory | AuditLogCategory[];
  severity?: AuditLogSeverity | AuditLogSeverity[];
  status?: AuditLogStatus | AuditLogStatus[];
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "action" | "resource" | "severity";
  sortOrder?: "asc" | "desc";
}

export interface AuditLogQueryResult {
  logs: AuditLogWithRelations[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// AUDIT LOG ANALYTICS
// ============================================================================

export interface AuditLogStats {
  totalLogs: number;
  logsByCategory: Record<AuditLogCategory, number>;
  logsBySeverity: Record<AuditLogSeverity, number>;
  logsByStatus: Record<AuditLogStatus, number>;
  topActions: Array<{ action: string; count: number }>;
  topResources: Array<{ resource: string; count: number }>;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
  recentActivity: AuditLogWithRelations[];
  timeSeriesData: Array<{ date: string; count: number }>;
}

export interface AuditLogTrends {
  period: "hour" | "day" | "week" | "month";
  data: Array<{
    timestamp: string;
    total: number;
    byCategory: Record<AuditLogCategory, number>;
    bySeverity: Record<AuditLogSeverity, number>;
  }>;
}

// ============================================================================
// COMPLIANCE & REPORTING
// ============================================================================

export interface ComplianceReport {
  id: string;
  title: string;
  description: string;
  standard: ComplianceStandard;
  period: {
    start: Date;
    end: Date;
  };
  generatedAt: Date;
  generatedBy: string;
  organizationId?: string;
  summary: ComplianceReportSummary;
  findings: ComplianceFinding[];
  recommendations: string[];
  exportFormats: ExportFormat[];
}

export enum ComplianceStandard {
  SOX = "SOX",
  GDPR = "GDPR",
  HIPAA = "HIPAA",
  PCI_DSS = "PCI_DSS",
  ISO_27001 = "ISO_27001",
  CUSTOM = "CUSTOM",
}

export interface ComplianceReportSummary {
  totalEvents: number;
  criticalEvents: number;
  securityEvents: number;
  dataAccessEvents: number;
  userActivityEvents: number;
  systemEvents: number;
  complianceScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface ComplianceFinding {
  id: string;
  type: "violation" | "warning" | "observation";
  severity: AuditLogSeverity;
  title: string;
  description: string;
  relatedLogs: string[];
  recommendation: string;
  status: "open" | "acknowledged" | "resolved";
}

export enum ExportFormat {
  CSV = "csv",
  JSON = "json",
  PDF = "pdf",
  XLSX = "xlsx",
}

// ============================================================================
// AUDIT LOG CONFIGURATION
// ============================================================================

export interface AuditLogConfig {
  enabled: boolean;
  retentionDays: number;
  archiveAfterDays: number;
  enableRealTimeAlerts: boolean;
  alertThresholds: {
    criticalEvents: number;
    failedLogins: number;
    suspiciousActivity: number;
  };
  categories: {
    [key in AuditLogCategory]: {
      enabled: boolean;
      retentionDays?: number;
      alertOnSeverity?: AuditLogSeverity[];
    };
  };
  exportLimits: {
    maxRecords: number;
    maxFileSize: number;
  };
}

// ============================================================================
// AUDIT LOG CONTEXT
// ============================================================================

export interface AuditContext {
  userId?: string;
  organizationId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  requestId?: string;
  correlationId?: string;
}

// ============================================================================
// AUDIT LOG EVENTS
// ============================================================================

export interface AuditLogEvent {
  action: AuditLogAction | string;
  resource: AuditLogResource | string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  status?: AuditLogStatus;
  severity?: AuditLogSeverity;
  category?: AuditLogCategory;
  context?: AuditContext;
}

// ============================================================================
// AUDIT LOG MIDDLEWARE TYPES
// ============================================================================

export interface AuditMiddlewareConfig {
  enabled: boolean;
  excludePaths?: string[];
  includePaths?: string[];
  logRequestBody?: boolean;
  logResponseBody?: boolean;
  sensitiveFields?: string[];
  maxBodySize?: number;
}

export interface AuditRequestInfo {
  method: string;
  url: string;
  path: string;
  query: Record<string, any>;
  headers: Record<string, string>;
  body?: any;
  ip: string;
  userAgent: string;
  userId?: string;
  organizationId?: string;
  sessionId?: string;
}

export interface AuditResponseInfo {
  statusCode: number;
  headers: Record<string, string>;
  body?: any;
  duration: number;
  error?: string;
}
