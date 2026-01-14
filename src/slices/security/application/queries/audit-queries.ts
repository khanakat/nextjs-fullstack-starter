/**
 * Query for permission analytics
 */
export class GetPermissionAnalyticsQuery {
  public readonly type = 'analytics' as const;
  public readonly startDate: Date;
  public readonly endDate: Date;
  public readonly organizationId?: string;

  constructor(params: {
    startDate?: Date;
    endDate?: Date;
    organizationId?: string;
  }) {
    this.startDate = params.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.endDate = params.endDate || new Date();
    this.organizationId = params.organizationId;
  }
}

/**
 * Query to get violations
 */
export class GetViolationsQuery {
  public readonly type = 'violations' as const;
  public readonly limit: number;
  public readonly organizationId?: string;

  constructor(params: { limit?: number; organizationId?: string }) {
    this.limit = params.limit || 50;
    this.organizationId = params.organizationId;
  }
}

/**
 * Query to audit user permissions
 */
export class AuditUserPermissionsQuery {
  public readonly type = 'user-audit' as const;
  public readonly userId: string;

  constructor(params: { userId: string }) {
    this.userId = params.userId;
  }
}

/**
 * Query to generate compliance report
 */
export class GetComplianceReportQuery {
  public readonly type = 'compliance' as const;
  public readonly organizationId?: string;

  constructor(params: { organizationId?: string }) {
    this.organizationId = params.organizationId;
  }
}
