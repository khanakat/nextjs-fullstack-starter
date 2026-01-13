/**
 * Create Audit Log Command
 * Command for creating a new audit log entry
 */
export class CreateAuditLogCommand {
  public readonly action: string;
  public readonly resource: string;
  public readonly resourceId: string | null;
  public readonly userId: string | null;
  public readonly organizationId: string | null;
  public readonly sessionId: string | null;
  public readonly ipAddress: string | null;
  public readonly userAgent: string | null;
  public readonly endpoint: string | null;
  public readonly method: string | null;
  public readonly oldValues: string | null;
  public readonly newValues: string | null;
  public readonly metadata: string;
  public readonly status: string;
  public readonly severity: string;
  public readonly category: string;
  public readonly retentionDate: Date | null;

  constructor(props: {
    action: string;
    resource: string;
    resourceId?: string;
    userId?: string;
    organizationId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
    oldValues?: string;
    newValues?: string;
    metadata?: string;
    status?: string;
    severity?: string;
    category?: string;
    retentionDate?: Date;
  }) {
    this.action = props.action;
    this.resource = props.resource;
    this.resourceId = props.resourceId || null;
    this.userId = props.userId || null;
    this.organizationId = props.organizationId || null;
    this.sessionId = props.sessionId || null;
    this.ipAddress = props.ipAddress || null;
    this.userAgent = props.userAgent || null;
    this.endpoint = props.endpoint || null;
    this.method = props.method || null;
    this.oldValues = props.oldValues || null;
    this.newValues = props.newValues || null;
    this.metadata = props.metadata || '{}';
    this.status = props.status || 'success';
    this.severity = props.severity || 'info';
    this.category = props.category || 'general';
    this.retentionDate = props.retentionDate || null;
  }
}

/**
 * Update Audit Log Command
 * Command for updating an existing audit log entry
 */
export class UpdateAuditLogCommand {
  public readonly id: string;
  public readonly status?: string;
  public readonly metadata?: string;
  public readonly retentionDate?: Date | null;
  public readonly isArchived?: boolean;

  constructor(props: {
    id: string;
    status?: string;
    metadata?: string;
    retentionDate?: Date;
    isArchived?: boolean;
  }) {
    this.id = props.id;
    this.status = props.status;
    this.metadata = props.metadata;
    this.retentionDate = props.retentionDate || null;
    this.isArchived = props.isArchived;
  }
}

/**
 * Archive Audit Log Command
 * Command for archiving an audit log entry
 */
export class ArchiveAuditLogCommand {
  public readonly id: string;

  constructor(props: { id: string }) {
    this.id = props.id;
  }
}

/**
 * Delete Audit Log Command
 * Command for deleting an audit log entry
 */
export class DeleteAuditLogCommand {
  public readonly id: string;

  constructor(props: { id: string }) {
    this.id = props.id;
  }
}

/**
 * Get Audit Log Query
 * Query for retrieving a single audit log entry
 */
export class GetAuditLogQuery {
  public readonly id: string;

  constructor(props: { id: string }) {
    this.id = props.id;
  }
}

/**
 * List Audit Logs Query
 * Query for retrieving audit logs with filters
 */
export class ListAuditLogsQuery {
  public readonly userId?: string;
  public readonly organizationId?: string;
  public readonly action?: string;
  public readonly resource?: string;
  public readonly category?: string;
  public readonly severity?: string;
  public readonly startDate?: Date;
  public readonly endDate?: Date;
  public readonly limit?: number;
  public readonly offset?: number;

  constructor(props: {
    userId?: string;
    organizationId?: string;
    action?: string;
    resource?: string;
    category?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    this.userId = props.userId;
    this.organizationId = props.organizationId;
    this.action = props.action;
    this.resource = props.resource;
    this.category = props.category;
    this.severity = props.severity;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.limit = props.limit;
    this.offset = props.offset;
  }
}

/**
 * Get Audit Statistics Query
 * Query for retrieving audit statistics
 */
export class GetAuditStatisticsQuery {
  public readonly userId?: string;
  public readonly organizationId?: string;
  public readonly startDate?: Date;
  public readonly endDate?: Date;

  constructor(props: {
    userId?: string;
    organizationId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    this.userId = props.userId;
    this.organizationId = props.organizationId;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
  }
}
