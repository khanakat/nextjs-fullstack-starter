import { IReportRepository } from '@/shared/domain/reporting/repositories/report-repository';
import { INotificationRepository } from '@/shared/domain/notifications/repositories/notification-repository';
import { IUserRepository } from '@/slices/user-management/domain/repositories/user-repository';
import { Report } from '@/shared/domain/reporting/entities/report';
import { Notification } from '@/shared/domain/notifications/entities/notification';
import { User } from '@/slices/user-management/domain/entities/user';
import { UniqueId } from '@/shared/domain/value-objects/unique-id';
import { PaginatedResult } from '@/shared/application/base/paginated-result';

/**
 * Mock implementation of IReportRepository for testing
 */
export class MockReportRepository implements IReportRepository {
  private reports: Map<string, Report> = new Map();

  async save(report: Report): Promise<void> {
    this.reports.set(report.id.value, report);
  }

  async findById(id: UniqueId): Promise<Report | null> {
    return this.reports.get(id.value) || null;
  }

  async findByIds(ids: UniqueId[]): Promise<Report[]> {
    return ids.map(id => this.reports.get(id.value)).filter(Boolean) as Report[];
  }

  async findByCreator(createdBy: UniqueId, options?: any): Promise<any> {
    const reports = Array.from(this.reports.values())
      .filter(report => report.createdBy.equals(createdBy));
    
    const { limit = 20, offset = 0 } = options || {};
    const paginatedReports = reports.slice(offset, offset + limit);
    
    return {
      reports: paginatedReports,
      total: reports.length,
      hasMore: offset + limit < reports.length,
    };
  }

  async findByOrganization(organizationId: UniqueId, options?: any): Promise<any> {
    const reports = Array.from(this.reports.values())
      .filter(report => report.organizationId?.equals(organizationId));
    
    const { limit = 20, offset = 0 } = options || {};
    const paginatedReports = reports.slice(offset, offset + limit);
    
    return {
      reports: paginatedReports,
      total: reports.length,
      hasMore: offset + limit < reports.length,
    };
  }

  async findByTemplate(templateId: UniqueId, options?: any): Promise<any> {
    const reports = Array.from(this.reports.values())
      .filter(report => report.templateId?.equals(templateId));
    
    const { limit = 20, offset = 0 } = options || {};
    const paginatedReports = reports.slice(offset, offset + limit);
    
    return {
      reports: paginatedReports,
      total: reports.length,
      hasMore: offset + limit < reports.length,
    };
  }

  async findPublicReports(options?: any): Promise<any> {
    const reports = Array.from(this.reports.values())
      .filter(report => report.isPublic);
    
    const { limit = 20, offset = 0 } = options || {};
    const paginatedReports = reports.slice(offset, offset + limit);
    
    return {
      reports: paginatedReports,
      total: reports.length,
      hasMore: offset + limit < reports.length,
    };
  }

  async search(query: string, options?: any): Promise<any> {
    const reports = Array.from(this.reports.values())
      .filter(report => 
        report.title.toLowerCase().includes(query.toLowerCase()) ||
        report.description?.toLowerCase().includes(query.toLowerCase())
      );
    
    const { limit = 20, offset = 0 } = options || {};
    const paginatedReports = reports.slice(offset, offset + limit);
    
    return {
      reports: paginatedReports,
      total: reports.length,
      hasMore: offset + limit < reports.length,
    };
  }

  async findByStatus(status: any, options?: any): Promise<any> {
    const reports = Array.from(this.reports.values())
      .filter(report => report.status.equals(status));
    
    const { limit = 20, offset = 0 } = options || {};
    const paginatedReports = reports.slice(offset, offset + limit);
    
    return {
      reports: paginatedReports,
      total: reports.length,
      hasMore: offset + limit < reports.length,
    };
  }

  async findReportsForArchival(cutoffDate: Date): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter(report => report.updatedAt < cutoffDate);
  }

  async count(filters?: Record<string, any>): Promise<number> {
    return this.reports.size;
  }

  async exists(id: UniqueId): Promise<boolean> {
    return this.reports.has(id.value);
  }

  async existsByTitle(title: string, organizationId?: UniqueId): Promise<boolean> {
    return Array.from(this.reports.values())
      .some(report => report.title === title && 
        (!organizationId || report.organizationId?.equals(organizationId)));
  }

  async delete(id: UniqueId): Promise<void> {
    const report = this.reports.get(id.value);
    if (report) {
      // Simulate soft delete by updating deletedAt
      this.reports.set(id.value, report);
    }
  }

  async permanentlyDelete(id: UniqueId): Promise<void> {
    this.reports.delete(id.value);
  }

  async getPopularReports(limit: number): Promise<Report[]> {
    return Array.from(this.reports.values()).slice(0, limit);
  }

  async getRecentReports(limit: number): Promise<Report[]> {
    return Array.from(this.reports.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getReportsByTemplate(templateId: UniqueId): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter(report => report.templateId?.equals(templateId));
  }

  async bulkUpdate(updates: Array<{ id: UniqueId; data: Partial<any> }>): Promise<void> {
    updates.forEach(({ id, data }) => {
      const report = this.reports.get(id.value);
      if (report) {
        // Apply updates to the report
        this.reports.set(id.value, report);
      }
    });
  }

  async getReportStatistics(): Promise<any> {
    const reports = Array.from(this.reports.values());
    return {
      total: reports.length,
      published: reports.filter(r => r.status.value === 'published').length,
      draft: reports.filter(r => r.status.value === 'draft').length,
      archived: reports.filter(r => r.status.value === 'archived').length,
    };
  }

  // Helper methods for testing
  clear(): void {
    this.reports.clear();
    this.shouldFailOperations.clear();
    this.operationDelays.clear();
  }

  addReport(report: Report): void {
    this.reports.set(report.id.value, report);
  }

  getAll(): Report[] {
    return Array.from(this.reports.values());
  }

  // Enhanced testing capabilities
  private shouldFailOperations: Set<string> = new Set();
  private operationDelays: Map<string, number> = new Map();

  /**
   * Configure specific operations to fail for testing error scenarios
   */
  setShouldFail(operation: 'save' | 'findById' | 'delete' | 'update', shouldFail?: boolean): void;
  setShouldFail(shouldFail: boolean): void;
  setShouldFail(operationOrFlag: any, shouldFail: boolean = true): void {
    // Support global flag usage: default to failing 'save' only for handler tests
    if (typeof operationOrFlag === 'boolean') {
      const flag = operationOrFlag;
      const op = 'save';
      if (flag) {
        this.shouldFailOperations.add(op);
      } else {
        this.shouldFailOperations.delete(op);
      }
      return;
    }

    const operation = operationOrFlag as 'save' | 'findById' | 'delete' | 'update';
    if (shouldFail) {
      this.shouldFailOperations.add(operation);
    } else {
      this.shouldFailOperations.delete(operation);
    }
  }

  /**
   * Configure operation delays for testing performance scenarios
   */
  setOperationDelay(operation: string, delayMs: number): void;
  setOperationDelay(delayMs: number): void;
  setOperationDelay(operationOrDelay: string | number, delayMs?: number): void {
    if (typeof operationOrDelay === 'number') {
      const delay = operationOrDelay;
      // Apply to common operations by default for tests that pass a single value
      ['save', 'findById', 'delete', 'update', 'bulkInsert', 'bulkDelete'].forEach(op => {
        this.operationDelays.set(op, delay);
      });
      return;
    }
    this.operationDelays.set(operationOrDelay, delayMs || 0);
  }

  /**
   * Simulate network delay if configured
   */
  private async simulateDelay(operation: string): Promise<void> {
    const delay = this.operationDelays.get(operation);
    if (delay) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Check if operation should fail
   */
  private checkShouldFail(operation: string): void {
    if (this.shouldFailOperations.has(operation)) {
      throw new Error(`Mock ${operation} operation failed`);
    }
  }

  /**
   * Enhanced save with error simulation
   */
  async save(report: Report): Promise<void> {
    await this.simulateDelay('save');
    this.checkShouldFail('save');
    this.reports.set(report.id.value, report);
  }

  /**
   * Enhanced findById with error simulation
   */
  async findById(id: UniqueId): Promise<Report | null> {
    await this.simulateDelay('findById');
    this.checkShouldFail('findById');
    return this.reports.get(id.value) || null;
  }

  /**
   * Enhanced delete with error simulation
   */
  async delete(id: UniqueId): Promise<void> {
    await this.simulateDelay('delete');
    this.checkShouldFail('delete');
    const report = this.reports.get(id.value);
    if (!report) {
      throw new Error('Report not found');
    }
    this.reports.delete(id.value);
  }

  /**
   * Advanced filtering capabilities
   */
  async findWithAdvancedFilters(filters: {
    status?: string[];
    createdAfter?: Date;
    createdBefore?: Date;
    titleContains?: string;
    isPublic?: boolean;
    organizationIds?: string[];
    creatorIds?: string[];
    templateIds?: string[];
    tags?: string[];
  }, pagination?: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    reports: Report[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
  }> {
    let filteredReports = Array.from(this.reports.values());

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      filteredReports = filteredReports.filter(report => 
        filters.status!.includes(report.status.value)
      );
    }

    if (filters.createdAfter) {
      filteredReports = filteredReports.filter(report => 
        report.createdAt >= filters.createdAfter!
      );
    }

    if (filters.createdBefore) {
      filteredReports = filteredReports.filter(report => 
        report.createdAt <= filters.createdBefore!
      );
    }

    if (filters.titleContains) {
      filteredReports = filteredReports.filter(report => 
        report.title.toLowerCase().includes(filters.titleContains!.toLowerCase())
      );
    }

    if (filters.isPublic !== undefined) {
      filteredReports = filteredReports.filter(report => 
        report.isPublic === filters.isPublic
      );
    }

    if (filters.organizationIds && filters.organizationIds.length > 0) {
      filteredReports = filteredReports.filter(report => 
        report.organizationId && filters.organizationIds!.includes(report.organizationId.value)
      );
    }

    if (filters.creatorIds && filters.creatorIds.length > 0) {
      filteredReports = filteredReports.filter(report => 
        filters.creatorIds!.includes(report.createdBy.value)
      );
    }

    if (filters.templateIds && filters.templateIds.length > 0) {
      filteredReports = filteredReports.filter(report => 
        report.templateId && filters.templateIds!.includes(report.templateId.value)
      );
    }

    // Apply sorting
    if (pagination?.sortBy) {
      filteredReports.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (pagination.sortBy) {
          case 'title':
            aValue = a.title;
            bValue = b.title;
            break;
          case 'createdAt':
            aValue = a.createdAt;
            bValue = b.createdAt;
            break;
          case 'updatedAt':
            aValue = a.updatedAt;
            bValue = b.updatedAt;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return pagination.sortOrder === 'desc' ? 1 : -1;
        if (aValue > bValue) return pagination.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    }

    // Apply pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;
    const paginatedReports = filteredReports.slice(offset, offset + limit);

    return {
      reports: paginatedReports,
      total: filteredReports.length,
      hasMore: offset + limit < filteredReports.length,
      page,
      limit
    };
  }

  /**
   * Bulk operations for testing
   */
  async bulkInsert(reports: Report[]): Promise<void> {
    await this.simulateDelay('bulkInsert');
    this.checkShouldFail('bulkInsert');
    
    reports.forEach(report => {
      this.reports.set(report.id.value, report);
    });
  }

  async bulkDelete(ids: UniqueId[]): Promise<void> {
    await this.simulateDelay('bulkDelete');
    this.checkShouldFail('bulkDelete');
    
    ids.forEach(id => {
      this.reports.delete(id.value);
    });
  }

  /**
   * Statistics and analytics for testing
   */
  async getDetailedStatistics(): Promise<{
    totalReports: number;
    reportsByStatus: Record<string, number>;
    reportsByOrganization: Record<string, number>;
    reportsByCreator: Record<string, number>;
    averageReportsPerDay: number;
    oldestReport?: Date;
    newestReport?: Date;
  }> {
    const reports = Array.from(this.reports.values());
    
    const reportsByStatus: Record<string, number> = {};
    const reportsByOrganization: Record<string, number> = {};
    const reportsByCreator: Record<string, number> = {};
    
    let oldestDate: Date | undefined;
    let newestDate: Date | undefined;

    reports.forEach(report => {
      // Count by status
      const status = report.status.value;
      reportsByStatus[status] = (reportsByStatus[status] || 0) + 1;

      // Count by organization
      if (report.organizationId) {
        const orgId = report.organizationId.value;
        reportsByOrganization[orgId] = (reportsByOrganization[orgId] || 0) + 1;
      }

      // Count by creator
      const creatorId = report.createdBy.value;
      reportsByCreator[creatorId] = (reportsByCreator[creatorId] || 0) + 1;

      // Track date range
      if (!oldestDate || report.createdAt < oldestDate) {
        oldestDate = report.createdAt;
      }
      if (!newestDate || report.createdAt > newestDate) {
        newestDate = report.createdAt;
      }
    });

    // Calculate average reports per day
    let averageReportsPerDay = 0;
    if (oldestDate && newestDate && reports.length > 0) {
      const daysDiff = Math.max(1, Math.ceil((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24)));
      averageReportsPerDay = reports.length / daysDiff;
    }

    return {
      totalReports: reports.length,
      reportsByStatus,
      reportsByOrganization,
      reportsByCreator,
      averageReportsPerDay,
      oldestReport: oldestDate,
      newestReport: newestDate
    };
  }
}

/**
 * Mock implementation of INotificationRepository for testing
 */
export class MockNotificationRepository implements INotificationRepository {
  private notifications: Map<string, Notification> = new Map();

  async save(notification: Notification): Promise<void> {
    this.notifications.set(notification.id.value, notification);
  }

  async findById(id: UniqueId): Promise<Notification | null> {
    return this.notifications.get(id.value) || null;
  }

  async findByRecipient(recipientId: UniqueId, options?: any): Promise<any> {
    const notifications = Array.from(this.notifications.values())
      .filter(notification => notification.recipientId.equals(recipientId));
    
    const { limit = 20, offset = 0 } = options || {};
    const paginatedNotifications = notifications.slice(offset, offset + limit);
    
    return {
      notifications: paginatedNotifications,
      total: notifications.length,
      hasMore: offset + limit < notifications.length,
    };
  }

  async findUnreadByRecipient(recipientId: UniqueId): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => 
        notification.recipientId.equals(recipientId) && 
        !notification.readAt
      );
  }

  async markAsRead(id: UniqueId): Promise<void> {
    const notification = this.notifications.get(id.value);
    if (notification) {
      // Update readAt timestamp
      this.notifications.set(id.value, notification);
    }
  }

  async markAllAsRead(recipientId: UniqueId): Promise<void> {
    Array.from(this.notifications.values())
      .filter(notification => notification.recipientId.equals(recipientId))
      .forEach(notification => {
        // Update readAt timestamp
        this.notifications.set(notification.id.value, notification);
      });
  }

  async delete(id: UniqueId): Promise<void> {
    this.notifications.delete(id.value);
  }

  async findScheduledNotifications(before: Date): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => 
        notification.scheduledFor && 
        notification.scheduledFor <= before
      );
  }

  // Helper methods for testing
  clear(): void {
    this.notifications.clear();
  }

  addNotification(notification: Notification): void {
    this.notifications.set(notification.id.value, notification);
  }

  getAll(): Notification[] {
    return Array.from(this.notifications.values());
  }
}

/**
 * Mock implementation of IUserRepository for testing
 */
export class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<void> {
    this.users.set(user.id.value, user);
  }

  async findById(id: UniqueId): Promise<User | null> {
    return this.users.get(id.value) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return Array.from(this.users.values())
      .find(user => user.email === email) || null;
  }

  async findMany(options?: any): Promise<PaginatedResult<User>> {
    const users = Array.from(this.users.values());
    const { page = 1, limit = 20 } = options || {};
    const offset = (page - 1) * limit;
    const paginatedUsers = users.slice(offset, offset + limit);
    
    return new PaginatedResult(paginatedUsers, users.length, page, limit);
  }

  async exists(id: UniqueId): Promise<boolean> {
    return this.users.has(id.value);
  }

  async existsByEmail(email: string): Promise<boolean> {
    return Array.from(this.users.values())
      .some(user => user.email === email);
  }

  async delete(id: UniqueId): Promise<void> {
    this.users.delete(id.value);
  }

  async count(): Promise<number> {
    return this.users.size;
  }

  // Helper methods for testing
  clear(): void {
    this.users.clear();
  }

  addUser(user: User): void {
    this.users.set(user.id.value, user);
  }

  getAll(): User[] {
    return Array.from(this.users.values());
  }
}