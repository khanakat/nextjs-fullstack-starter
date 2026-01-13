import { AuditLog } from '../entities/audit-log';

/**
 * Audit Log Repository Interface
 * Defines contract for audit log data access
 */
export interface IAuditLogRepository {
  /**
   * Find audit log by ID
   */
  findById(id: string): Promise<AuditLog | null>;

  /**
   * Find all audit logs
   */
  findAll(): Promise<AuditLog[]>;

  /**
   * Find audit logs by user ID
   */
  findByUserId(userId: string): Promise<AuditLog[]>;

  /**
   * Find audit logs by organization ID
   */
  findByOrganizationId(organizationId: string): Promise<AuditLog[]>;

  /**
   * Find audit logs by action type
   */
  findByAction(action: string): Promise<AuditLog[]>;

  /**
   * Find audit logs by resource type
   */
  findByResource(resource: string): Promise<AuditLog[]>;

  /**
   * Find audit logs by category
   */
  findByCategory(category: string): Promise<AuditLog[]>;

  /**
   * Find audit logs by severity
   */
  findBySeverity(severity: string): Promise<AuditLog[]>;

  /**
   * Find audit logs with filters
   */
  findByFilters(filters: {
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
  }): Promise<{ logs: AuditLog[]; total: number }>;

  /**
   * Save audit log
   */
  save(auditLog: AuditLog): Promise<AuditLog>;

  /**
   * Update audit log
   */
  update(auditLog: AuditLog): Promise<AuditLog>;

  /**
   * Delete audit log
   */
  delete(id: string): Promise<boolean>;

  /**
   * Delete audit logs by user ID
   */
  deleteByUserId(userId: string): Promise<number>;

  /**
   * Delete audit logs by organization ID
   */
  deleteByOrganizationId(organizationId: string): Promise<number>;

  /**
   * Archive audit log
   */
  archive(id: string): Promise<AuditLog | null>;

  /**
   * Archive audit logs by retention date
   */
  archiveByRetentionDate(retentionDate: Date): Promise<number>;

  /**
   * Count audit logs
   */
  count(filters?: {
    userId?: string;
    organizationId?: string;
    action?: string;
    resource?: string;
    category?: string;
    severity?: string;
    isArchived?: boolean;
  }): Promise<number>;
}
