/**
 * DTO for Security Audit operations
 */

export interface AuditAnalyticsRequest {
  type: 'analytics';
  startDate?: Date;
  endDate?: Date;
  organizationId?: string;
}

export interface AuditViolationsRequest {
  type: 'violations';
  limit?: number;
  organizationId?: string;
}

export interface UserAuditRequest {
  type: 'user-audit';
  userId: string;
}

export interface ComplianceReportRequest {
  type: 'compliance';
  organizationId?: string;
}

export interface ResolveViolationRequest {
  action: 'resolve_violation';
  data: {
    violationId: string;
    resolution?: string;
  };
}

export interface LogPermissionCheckRequest {
  action: 'log_permission_check';
  data: {
    targetUserId: string;
    targetUserEmail: string;
    targetUserRole: string;
    resource: string;
    action: string;
    granted: boolean;
    context?: Record<string, any>;
  };
}

export interface CreateViolationRequest {
  action: 'create_violation';
  data: Record<string, any>;
}
