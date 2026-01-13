import { IFileStorageService } from '@/slices/reporting/domain/services/file-storage-service';
import { INotificationService } from '@/slices/reporting/domain/services/notification-service';
import { NotificationRoutingService } from '@/slices/notifications/application/services/notification-routing-service';
import { ReportExportService } from '@/slices/reporting/application/services/report-export-service';
import { UniqueId } from '@/shared/domain/value-objects/unique-id';
import { NotificationChannel } from '@/shared/domain/notifications/value-objects/notification-channel';
import { NotificationCategory } from '@/shared/domain/notifications/value-objects/notification-category';
import { NotificationPreferences } from '@/shared/domain/notifications/entities/notification-preferences';
import { Report } from '@/shared/domain/reporting/entities/report';

/**
 * Mock implementation of IFileStorageService for testing
 */
export class MockFileStorageService implements IFileStorageService {
  private files: Map<string, { content: Buffer; metadata: any }> = new Map();

  async uploadFile(
    fileName: string,
    content: Buffer,
    metadata?: Record<string, any>
  ): Promise<{ url: string; key: string }> {
    const key = `mock-files/${fileName}`;
    this.files.set(key, { content, metadata: metadata || {} });
    
    return {
      url: `https://mock-storage.example.com/${key}`,
      key
    };
  }

  async downloadFile(key: string): Promise<{ content: Buffer; metadata: any }> {
    const file = this.files.get(key);
    if (!file) {
      throw new Error(`File not found: ${key}`);
    }
    return file;
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.files.has(key)) {
      throw new Error(`File not found: ${key}`);
    }
    this.files.delete(key);
  }

  async getFileUrl(key: string, expiresIn?: number): Promise<string> {
    if (!this.files.has(key)) {
      throw new Error(`File not found: ${key}`);
    }
    const expiry = expiresIn ? `?expires=${Date.now() + expiresIn * 1000}` : '';
    return `https://mock-storage.example.com/${key}${expiry}`;
  }

  async fileExists(key: string): Promise<boolean> {
    return this.files.has(key);
  }

  async getFileMetadata(key: string): Promise<Record<string, any>> {
    const file = this.files.get(key);
    if (!file) {
      throw new Error(`File not found: ${key}`);
    }
    return file.metadata;
  }

  // Test helpers
  clear(): void {
    this.files.clear();
  }

  getStoredFiles(): string[] {
    return Array.from(this.files.keys());
  }

  addFile(key: string, content: Buffer, metadata?: any): void {
    this.files.set(key, { content, metadata: metadata || {} });
  }
}

// (Removed legacy MockNotificationService to avoid duplicate class definition)

/**
 * Mock implementation of NotificationRoutingService for testing
 */
export class MockNotificationRoutingService extends NotificationRoutingService {
  private routingDecisions: Map<string, {
    shouldDeliver: boolean;
    channels: NotificationChannel[];
    delayUntil?: Date;
    reason?: string;
  }> = new Map();

  constructor() {
    super(null as any, null as any); // Mock dependencies
  }

  async determineRouting(
    userId: UniqueId,
    category: NotificationCategory,
    channels: NotificationChannel[],
    preferences?: NotificationPreferences
  ): Promise<{
    shouldDeliver: boolean;
    channels: NotificationChannel[];
    delayUntil?: Date;
    reason?: string;
  }> {
    const key = `${userId.value}-${category.value}`;
    
    // Return pre-configured decision if exists
    if (this.routingDecisions.has(key)) {
      return this.routingDecisions.get(key)!;
    }

    // Default behavior
    const shouldDeliver = preferences ? 
      preferences.isChannelEnabled(channels[0]) : 
      true;

    const enabledChannels = preferences ?
      channels.filter(channel => preferences.isChannelEnabled(channel)) :
      channels;

    return {
      shouldDeliver,
      channels: enabledChannels,
      reason: shouldDeliver ? 'Default routing' : 'Channel disabled in preferences'
    };
  }

  // Test helpers
  setRoutingDecision(
    userId: string,
    category: string,
    decision: {
      shouldDeliver: boolean;
      channels: NotificationChannel[];
      delayUntil?: Date;
      reason?: string;
    }
  ): void {
    this.routingDecisions.set(`${userId}-${category}`, decision);
  }

  clear(): void {
    this.routingDecisions.clear();
  }

  getRoutingDecisions(): Map<string, {
    shouldDeliver: boolean;
    channels: NotificationChannel[];
    delayUntil?: Date;
    reason?: string;
  }> {
    return new Map(this.routingDecisions);
  }
}

/**
 * Mock implementation of ReportExportService for testing
 */
export class MockReportExportService extends ReportExportService {
  private exportResults: Map<string, {
    format: string;
    content: Buffer;
    metadata: any;
  }> = new Map();

  constructor() {
    super(null as any); // Mock repository dependency
  }

  async exportToPDF(report: Report, options?: any): Promise<{
    content: Buffer;
    filename: string;
    metadata: any;
  }> {
    const content = Buffer.from(`Mock PDF content for report: ${report.title}`);
    const filename = `${report.title.replace(/\s+/g, '_')}.pdf`;
    const metadata = {
      format: 'PDF',
      reportId: report.id.value,
      exportedAt: new Date(),
      options
    };

    this.exportResults.set(report.id.value, {
      format: 'PDF',
      content,
      metadata
    });

    return { content, filename, metadata };
  }

  async exportToExcel(report: Report, options?: any): Promise<{
    content: Buffer;
    filename: string;
    metadata: any;
  }> {
    const content = Buffer.from(`Mock Excel content for report: ${report.title}`);
    const filename = `${report.title.replace(/\s+/g, '_')}.xlsx`;
    const metadata = {
      format: 'Excel',
      reportId: report.id.value,
      exportedAt: new Date(),
      options
    };

    this.exportResults.set(report.id.value, {
      format: 'Excel',
      content,
      metadata
    });

    return { content, filename, metadata };
  }

  async exportToCSV(report: Report, options?: any): Promise<{
    content: Buffer;
    filename: string;
    metadata: any;
  }> {
    const content = Buffer.from(`Mock CSV content for report: ${report.title}`);
    const filename = `${report.title.replace(/\s+/g, '_')}.csv`;
    const metadata = {
      format: 'CSV',
      reportId: report.id.value,
      exportedAt: new Date(),
      options
    };

    this.exportResults.set(report.id.value, {
      format: 'CSV',
      content,
      metadata
    });

    return { content, filename, metadata };
  }

  // Test helpers
  getExportResult(reportId: string): {
    format: string;
    content: Buffer;
    metadata: any;
  } | null {
    return this.exportResults.get(reportId) || null;
  }

  getAllExports(): Map<string, {
    format: string;
    content: Buffer;
    metadata: any;
  }> {
    return new Map(this.exportResults);
  }

  clear(): void {
    this.exportResults.clear();
  }

  hasExported(reportId: string): boolean {
    return this.exportResults.has(reportId);
  }
}

/**
 * Mock Email Provider for testing email functionality
 */
export class MockEmailProvider {
  private emails: Array<{
    to: string | string[];
    from: string;
    subject: string;
    html?: string;
    text?: string;
    attachments?: any[];
    sentAt: Date;
    messageId: string;
  }> = [];

  private shouldFail = false;
  private failureReason = 'Mock email failure';

  async sendEmail(params: {
    to: string | string[];
    from: string;
    subject: string;
    html?: string;
    text?: string;
    attachments?: any[];
  }): Promise<{ messageId: string; success: boolean; error?: string }> {
    if (this.shouldFail) {
      return {
        messageId: '',
        success: false,
        error: this.failureReason
      };
    }

    const messageId = `mock-email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.emails.push({
      ...params,
      sentAt: new Date(),
      messageId
    });

    return {
      messageId,
      success: true
    };
  }

  // Test helpers
  setShouldFail(shouldFail: boolean, reason?: string): void {
    this.shouldFail = shouldFail;
    if (reason) {
      this.failureReason = reason;
    }
  }

  getSentEmails(): Array<{
    to: string | string[];
    from: string;
    subject: string;
    html?: string;
    text?: string;
    attachments?: any[];
    sentAt: Date;
    messageId: string;
  }> {
    return [...this.emails];
  }

  getEmailsSentTo(recipient: string): Array<{
    to: string | string[];
    from: string;
    subject: string;
    html?: string;
    text?: string;
    attachments?: any[];
    sentAt: Date;
    messageId: string;
  }> {
    return this.emails.filter(email => {
      if (Array.isArray(email.to)) {
        return email.to.includes(recipient);
      }
      return email.to === recipient;
    });
  }

  clear(): void {
    this.emails = [];
    this.shouldFail = false;
    this.failureReason = 'Mock email failure';
  }

  getLastEmail(): {
    to: string | string[];
    from: string;
    subject: string;
    html?: string;
    text?: string;
    attachments?: any[];
    sentAt: Date;
    messageId: string;
  } | null {
    return this.emails[this.emails.length - 1] || null;
  }
}

/**
 * Factory functions for creating configured mock services
 */
export const createMockServices = () => {
  return {
    fileStorage: new MockFileStorageService(),
    notification: new MockNotificationService(),
    routing: new MockNotificationRoutingService(),
    export: new MockReportExportService(),
    email: new MockEmailProvider()
  };
};

/**
 * Helper function to reset all mock services
 */
export const resetAllMocks = (services: ReturnType<typeof createMockServices>) => {
  services.fileStorage.clear();
  services.notification.clear();
  services.routing.clear();
  services.export.clear();
  services.email.clear();
};

/**
 * Enhanced Mock File Storage Service with advanced testing capabilities
 */
export class MockFileStorageService implements IFileStorageService {
  private files: Map<string, { content: Buffer; metadata: any }> = new Map();
  private shouldFailOperations: Set<string> = new Set();
  private operationDelays: Map<string, number> = new Map();
  private uploadCallbacks: Array<(file: any) => void> = [];
  private deleteCallbacks: Array<(key: string) => void> = [];

  async upload(file: any, key: string, options?: any): Promise<string> {
    await this.simulateDelay('upload');
    this.checkShouldFail('upload');
    
    // Simulate file validation
    if (options?.maxSize && file.size > options.maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${options.maxSize} bytes`);
    }
    
    if (options?.allowedTypes && !options.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    const url = `https://mock-storage.com/${key}`;
    this.files.set(key, { 
      content: Buffer.from(file.content || 'mock-content'), 
      metadata: { 
        originalName: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        ...options 
      }
    });

    // Trigger upload callbacks
    this.uploadCallbacks.forEach(callback => callback(file));
    
    return url;
  }

  async delete(key: string): Promise<void> {
    await this.simulateDelay('delete');
    this.checkShouldFail('delete');
    
    if (!this.files.has(key)) {
      throw new Error(`File with key ${key} not found`);
    }
    
    this.files.delete(key);
    
    // Trigger delete callbacks
    this.deleteCallbacks.forEach(callback => callback(key));
  }

  async getUrl(key: string): Promise<string> {
    await this.simulateDelay('getUrl');
    this.checkShouldFail('getUrl');
    
    if (!this.files.has(key)) {
      throw new Error(`File with key ${key} not found`);
    }
    
    return `https://mock-storage.com/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    await this.simulateDelay('exists');
    this.checkShouldFail('exists');
    return this.files.has(key);
  }

  async getMetadata(key: string): Promise<any> {
    await this.simulateDelay('getMetadata');
    this.checkShouldFail('getMetadata');
    
    const file = this.files.get(key);
    if (!file) {
      throw new Error(`File with key ${key} not found`);
    }
    
    return file.metadata;
  }

  async listFiles(prefix?: string): Promise<string[]> {
    await this.simulateDelay('listFiles');
    this.checkShouldFail('listFiles');
    
    const keys = Array.from(this.files.keys());
    return prefix ? keys.filter(key => key.startsWith(prefix)) : keys;
  }

  async getFileContent(key: string): Promise<Buffer> {
    await this.simulateDelay('getFileContent');
    this.checkShouldFail('getFileContent');
    
    const file = this.files.get(key);
    if (!file) {
      throw new Error(`File with key ${key} not found`);
    }
    
    return file.content;
  }

  // Enhanced testing capabilities
  setShouldFail(operation: string, shouldFail: boolean = true): void {
    if (shouldFail) {
      this.shouldFailOperations.add(operation);
    } else {
      this.shouldFailOperations.delete(operation);
    }
  }

  setOperationDelay(operation: string, delayMs: number): void {
    this.operationDelays.set(operation, delayMs);
  }

  onUpload(callback: (file: any) => void): void {
    this.uploadCallbacks.push(callback);
  }

  onDelete(callback: (key: string) => void): void {
    this.deleteCallbacks.push(callback);
  }

  private async simulateDelay(operation: string): Promise<void> {
    const delay = this.operationDelays.get(operation);
    if (delay) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  private checkShouldFail(operation: string): void {
    if (this.shouldFailOperations.has(operation)) {
      throw new Error(`Mock ${operation} operation failed`);
    }
  }

  // Test utilities
  clear(): void {
    this.files.clear();
    this.shouldFailOperations.clear();
    this.operationDelays.clear();
    this.uploadCallbacks = [];
    this.deleteCallbacks = [];
  }

  getStoredFiles(): Map<string, { content: Buffer; metadata: any }> {
    return new Map(this.files);
  }

  getStorageStatistics(): {
    totalFiles: number;
    totalSize: number;
    filesByType: Record<string, number>;
    averageFileSize: number;
  } {
    const files = Array.from(this.files.values());
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + (file.metadata.size || 0), 0);
    const filesByType: Record<string, number> = {};
    
    files.forEach(file => {
      const type = file.metadata.type || 'unknown';
      filesByType[type] = (filesByType[type] || 0) + 1;
    });
    
    return {
      totalFiles,
      totalSize,
      filesByType,
      averageFileSize: totalFiles > 0 ? totalSize / totalFiles : 0
    };
  }
}

/**
 * Enhanced Mock Notification Service with advanced testing capabilities
 */
export class MockNotificationService implements INotificationService {
  private sentNotifications: Array<{
    id: string;
    recipient: string;
    message: string;
    channel: string;
    sentAt: Date;
    metadata?: any;
  }> = [];
  private shouldFailOperations: Set<string> = new Set();
  private operationDelays: Map<string, number> = new Map();
  private deliveryCallbacks: Array<(notification: any) => void> = [];
  private failureCallbacks: Array<(error: Error, notification: any) => void> = [];

  async send(notification: {
    recipient: string;
    message: string;
    channel: string;
    metadata?: any;
  }): Promise<void> {
    await this.simulateDelay('send');
    
    const notificationWithId = {
      id: `mock-notification-${Date.now()}-${Math.random()}`,
      ...notification,
      sentAt: new Date()
    };

    try {
      this.checkShouldFail('send');
      
      // Simulate channel-specific validation
      if (notification.channel === 'email' && !this.isValidEmail(notification.recipient)) {
        throw new Error('Invalid email address');
      }
      
      if (notification.channel === 'sms' && !this.isValidPhoneNumber(notification.recipient)) {
        throw new Error('Invalid phone number');
      }

      this.sentNotifications.push(notificationWithId);
      
      // Trigger delivery callbacks
      this.deliveryCallbacks.forEach(callback => callback(notificationWithId));
      
    } catch (error) {
      // Trigger failure callbacks
      this.failureCallbacks.forEach(callback => callback(error as Error, notificationWithId));
      throw error;
    }
  }

  async sendBatch(notifications: Array<{
    recipient: string;
    message: string;
    channel: string;
    metadata?: any;
  }>): Promise<void> {
    await this.simulateDelay('sendBatch');
    this.checkShouldFail('sendBatch');
    
    const results = await Promise.allSettled(
      notifications.map(notification => this.send(notification))
    );
    
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      throw new Error(`Batch send failed: ${failures.length} out of ${notifications.length} notifications failed`);
    }
  }

  async getDeliveryStatus(notificationId: string): Promise<'pending' | 'delivered' | 'failed'> {
    await this.simulateDelay('getDeliveryStatus');
    this.checkShouldFail('getDeliveryStatus');
    
    const notification = this.sentNotifications.find(n => n.id === notificationId);
    if (!notification) {
      throw new Error(`Notification with id ${notificationId} not found`);
    }
    
    // Simulate random delivery status for testing
    const statuses: Array<'pending' | 'delivered' | 'failed'> = ['delivered', 'delivered', 'delivered', 'pending', 'failed'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPhoneNumber(phone: string): boolean {
    return /^\+?[\d\s\-\(\)]+$/.test(phone);
  }

  // Enhanced testing capabilities
  setShouldFail(operation: string, shouldFail: boolean = true): void {
    if (shouldFail) {
      this.shouldFailOperations.add(operation);
    } else {
      this.shouldFailOperations.delete(operation);
    }
  }

  setOperationDelay(operation: string, delayMs: number): void {
    this.operationDelays.set(operation, delayMs);
  }

  onDelivery(callback: (notification: any) => void): void {
    this.deliveryCallbacks.push(callback);
  }

  onFailure(callback: (error: Error, notification: any) => void): void {
    this.failureCallbacks.push(callback);
  }

  private async simulateDelay(operation: string): Promise<void> {
    const delay = this.operationDelays.get(operation);
    if (delay) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  private checkShouldFail(operation: string): void {
    if (this.shouldFailOperations.has(operation)) {
      throw new Error(`Mock ${operation} operation failed`);
    }
  }

  // Test utilities
  clear(): void {
    this.sentNotifications = [];
    this.shouldFailOperations.clear();
    this.operationDelays.clear();
    this.deliveryCallbacks = [];
    this.failureCallbacks = [];
  }

  getSentNotifications(): Array<{
    id: string;
    recipient: string;
    message: string;
    channel: string;
    sentAt: Date;
    metadata?: any;
  }> {
    return [...this.sentNotifications];
  }

  getNotificationStatistics(): {
    totalSent: number;
    byChannel: Record<string, number>;
    byRecipient: Record<string, number>;
    averagePerDay: number;
    oldestNotification?: Date;
    newestNotification?: Date;
  } {
    const byChannel: Record<string, number> = {};
    const byRecipient: Record<string, number> = {};
    let oldestDate: Date | undefined;
    let newestDate: Date | undefined;

    this.sentNotifications.forEach(notification => {
      // Count by channel
      byChannel[notification.channel] = (byChannel[notification.channel] || 0) + 1;
      
      // Count by recipient
      byRecipient[notification.recipient] = (byRecipient[notification.recipient] || 0) + 1;
      
      // Track date range
      if (!oldestDate || notification.sentAt < oldestDate) {
        oldestDate = notification.sentAt;
      }
      if (!newestDate || notification.sentAt > newestDate) {
        newestDate = notification.sentAt;
      }
    });

    // Calculate average notifications per day
    let averagePerDay = 0;
    if (oldestDate && newestDate && this.sentNotifications.length > 0) {
      const daysDiff = Math.max(1, Math.ceil((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24)));
      averagePerDay = this.sentNotifications.length / daysDiff;
    }

    return {
      totalSent: this.sentNotifications.length,
      byChannel,
      byRecipient,
      averagePerDay,
      oldestNotification: oldestDate,
      newestNotification: newestDate
    };
  }

  findNotificationsByRecipient(recipient: string): Array<{
    id: string;
    recipient: string;
    message: string;
    channel: string;
    sentAt: Date;
    metadata?: any;
  }> {
    return this.sentNotifications.filter(n => n.recipient === recipient);
  }

  findNotificationsByChannel(channel: string): Array<{
    id: string;
    recipient: string;
    message: string;
    channel: string;
    sentAt: Date;
    metadata?: any;
  }> {
    return this.sentNotifications.filter(n => n.channel === channel);
  }

  findNotificationsByDateRange(startDate: Date, endDate: Date): Array<{
    id: string;
    recipient: string;
    message: string;
    channel: string;
    sentAt: Date;
    metadata?: any;
  }> {
    return this.sentNotifications.filter(n => 
      n.sentAt >= startDate && n.sentAt <= endDate
    );
  }
}