import { ValueObject } from '../../../../shared/domain/base/value-object';
import { AuditId } from '../value-objects/audit-id';
import { AuditAction } from '../value-objects/audit-action';

/**
 * Audit Log Entity
 * Represents an audit log entry for activity tracking and compliance
 */
export class AuditLog extends ValueObject<{
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
  retentionDate: Date | null;
  isArchived: boolean;
  createdAt: Date;
}> {
  private constructor(props: {
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
    retentionDate: Date | null;
    isArchived: boolean;
    createdAt: Date;
  }) {
    super(props);
  }

  public getId(): string {
    return this._value.id;
  }

  public getAction(): string {
    return this._value.action;
  }

  public getResource(): string {
    return this._value.resource;
  }

  public getResourceId(): string | null {
    return this._value.resourceId;
  }

  public getUserId(): string | null {
    return this._value.userId;
  }

  public getOrganizationId(): string | null {
    return this._value.organizationId;
  }

  public getSessionId(): string | null {
    return this._value.sessionId;
  }

  public getIpAddress(): string | null {
    return this._value.ipAddress;
  }

  public getUserAgent(): string | null {
    return this._value.userAgent;
  }

  public getEndpoint(): string | null {
    return this._value.endpoint;
  }

  public getMethod(): string | null {
    return this._value.method;
  }

  public getOldValues(): string | null {
    return this._value.oldValues;
  }

  public getNewValues(): string | null {
    return this._value.newValues;
  }

  public getMetadata(): string {
    return this._value.metadata;
  }

  public getStatus(): string {
    return this._value.status;
  }

  public getSeverity(): string {
    return this._value.severity;
  }

  public getCategory(): string {
    return this._value.category;
  }

  public getRetentionDate(): Date | null {
    return this._value.retentionDate;
  }

  public isArchived(): boolean {
    return this._value.isArchived;
  }

  public getCreatedAt(): Date {
    return this._value.createdAt;
  }

  public archive(): AuditLog {
    return new AuditLog({
      ...this._value,
      isArchived: true,
    });
  }

  public unarchive(): AuditLog {
    return new AuditLog({
      ...this._value,
      isArchived: false,
    });
  }

  public static create(props: {
    id: string;
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
    isArchived?: boolean;
    createdAt?: Date;
  }): AuditLog {
    return new AuditLog({
      id: props.id,
      action: props.action,
      resource: props.resource,
      resourceId: props.resourceId ?? null,
      userId: props.userId ?? null,
      organizationId: props.organizationId ?? null,
      sessionId: props.sessionId ?? null,
      ipAddress: props.ipAddress ?? null,
      userAgent: props.userAgent ?? null,
      endpoint: props.endpoint ?? null,
      method: props.method ?? null,
      oldValues: props.oldValues ?? null,
      newValues: props.newValues ?? null,
      metadata: props.metadata ?? '{}',
      status: props.status ?? 'success',
      severity: props.severity ?? 'info',
      category: props.category ?? 'general',
      retentionDate: props.retentionDate ?? null,
      isArchived: props.isArchived ?? false,
      createdAt: props.createdAt ?? new Date(),
    });
  }

  protected validate(value: {
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
    retentionDate: Date | null;
    isArchived: boolean;
    createdAt: Date;
  }): void {
    if (!value.id || value.id.trim().length === 0) {
      throw new Error('Audit log ID is required');
    }
    if (!value.action || value.action.trim().length === 0) {
      throw new Error('Audit log action is required');
    }
    if (!value.resource || value.resource.trim().length === 0) {
      throw new Error('Audit log resource is required');
    }
  }
}
