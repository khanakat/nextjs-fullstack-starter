/**
 * Audit Log DTO
 * Data transfer object for audit log entries
 */
export class AuditLogDto {
  constructor(
    public readonly id: string,
    public readonly action: string,
    public readonly resource: string,
    public readonly resourceId: string | null,
    public readonly userId: string | null,
    public readonly organizationId: string | null,
    public readonly sessionId: string | null,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    public readonly endpoint: string | null,
    public readonly method: string | null,
    public readonly oldValues: string | null,
    public readonly newValues: string | null,
    public readonly metadata: string,
    public readonly status: string,
    public readonly severity: string,
    public readonly category: string,
    public readonly retentionDate: Date | null,
    public readonly isArchived: boolean,
    public readonly createdAt: Date,
  ) {}

  public static fromObject(obj: {
    id: string;
    action: string;
    resource: string;
    resourceId: string | null;
    userId: string | null;
    organizationId: string | null;
    sessionId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    endpoint: string | null;
    method: string | null;
    oldValues: string | null;
    newValues: string | null;
    metadata: string;
    status: string;
    severity: string;
    category: string;
    retentionDate: string | null;
    isArchived: boolean;
    createdAt: string;
  }): AuditLogDto {
    return new AuditLogDto(
      obj.id,
      obj.action,
      obj.resource,
      obj.resourceId,
      obj.userId,
      obj.organizationId,
      obj.sessionId,
      obj.ipAddress,
      obj.userAgent,
      obj.endpoint,
      obj.method,
      obj.oldValues,
      obj.newValues,
      obj.metadata,
      obj.status,
      obj.severity,
      obj.category,
      obj.retentionDate ? new Date(obj.retentionDate) : null,
      obj.isArchived,
      new Date(obj.createdAt),
    );
  }

  public toObject(): {
    id: string;
    action: string;
    resource: string;
    resourceId: string | null;
    userId: string | null;
    organizationId: string | null;
    sessionId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    endpoint: string | null;
    method: string | null;
    oldValues: string | null;
    newValues: string | null;
    metadata: string;
    status: string;
    severity: string;
    category: string;
    retentionDate: string | null;
    isArchived: boolean;
    createdAt: string;
  } {
    return {
      id: this.id,
      action: this.action,
      resource: this.resource,
      resourceId: this.resourceId,
      userId: this.userId,
      organizationId: this.organizationId,
      sessionId: this.sessionId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      endpoint: this.endpoint,
      method: this.method,
      oldValues: this.oldValues,
      newValues: this.newValues,
      metadata: this.metadata,
      status: this.status,
      severity: this.severity,
      category: this.category,
      retentionDate: this.retentionDate ? this.retentionDate.toISOString() : null,
      isArchived: this.isArchived,
      createdAt: this.createdAt.toISOString(),
    };
  }
}

/**
 * Audit Statistics DTO
 * Data transfer object for audit statistics
 */
export class AuditStatisticsDto {
  constructor(
    public readonly totalLogs: number,
    public readonly byAction: Record<string, number>,
    public readonly byResource: Record<string, number>,
    public readonly byCategory: Record<string, number>,
    public readonly bySeverity: Record<string, number>,
    public readonly successCount: number,
    public readonly failureCount: number,
    public readonly warningCount: number,
  ) {}

  public toObject() {
    return {
      totalLogs: this.totalLogs,
      byAction: this.byAction,
      byResource: this.byResource,
      byCategory: this.byCategory,
      bySeverity: this.bySeverity,
      successCount: this.successCount,
      failureCount: this.failureCount,
      warningCount: this.warningCount,
    };
  }
}

/**
 * Paginated Audit Logs DTO
 * Data transfer object for paginated audit log results
 */
export class PaginatedAuditLogsDto {
  constructor(
    public readonly logs: AuditLogDto[],
    public readonly total: number,
    public readonly limit: number,
    public readonly offset: number,
  ) {}

  public toObject() {
    return {
      logs: this.logs.map(log => log.toObject()),
      total: this.total,
      limit: this.limit,
      offset: this.offset,
    };
  }
}
