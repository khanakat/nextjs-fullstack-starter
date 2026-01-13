import { NotificationDeliveryService } from 'src/shared/domain/notifications/services/notification-delivery-service';
import { NotificationRoutingService } from 'src/shared/domain/notifications/services/notification-routing-service';
import { ReportGenerationService } from 'src/shared/domain/reporting/services/report-generation-service';
import { ReportPermissionService } from 'src/shared/domain/reporting/services/report-permission-service';
import { ReportSchedulingService } from 'src/shared/domain/reporting/services/report-scheduling-service';
import { NotificationFactory } from './notification-factory';
import { ReportFactory } from './report-factory';
import { UserFactory } from './user-factory';

/**
 * Factory for creating Domain Service test instances with mocked dependencies
 */
export class DomainServiceFactory {
  // Notification Services
  static createNotificationDeliveryService(overrides: Partial<{
    emailService: any;
    pushService: any;
    smsService: any;
    inAppService: any;
  }> = {}): NotificationDeliveryService {
    const mockEmailService = {
      send: jest.fn().mockResolvedValue({ success: true, messageId: 'email-123' }),
      validateAddress: jest.fn().mockReturnValue(true),
      ...overrides.emailService,
    };

    const mockPushService = {
      send: jest.fn().mockResolvedValue({ success: true, messageId: 'push-123' }),
      registerDevice: jest.fn().mockResolvedValue(true),
      ...overrides.pushService,
    };

    const mockSmsService = {
      send: jest.fn().mockResolvedValue({ success: true, messageId: 'sms-123' }),
      validatePhoneNumber: jest.fn().mockReturnValue(true),
      ...overrides.smsService,
    };

    const mockInAppService = {
      send: jest.fn().mockResolvedValue({ success: true, messageId: 'inapp-123' }),
      markAsRead: jest.fn().mockResolvedValue(true),
      ...overrides.inAppService,
    };

    return new NotificationDeliveryService(
      mockEmailService,
      mockPushService,
      mockSmsService,
      mockInAppService
    );
  }

  static createNotificationRoutingService(overrides: Partial<{
    userPreferencesService: any;
    channelAvailabilityService: any;
  }> = {}): NotificationRoutingService {
    const mockUserPreferencesService = {
      getPreferences: jest.fn().mockResolvedValue({
        email: true,
        push: true,
        sms: false,
        inApp: true,
      }),
      updatePreferences: jest.fn().mockResolvedValue(true),
      ...overrides.userPreferencesService,
    };

    const mockChannelAvailabilityService = {
      isChannelAvailable: jest.fn().mockReturnValue(true),
      getAvailableChannels: jest.fn().mockReturnValue(['email', 'push', 'inApp']),
      ...overrides.channelAvailabilityService,
    };

    return new NotificationRoutingService(
      mockUserPreferencesService,
      mockChannelAvailabilityService
    );
  }

  // Report Services
  static createReportGenerationService(overrides: Partial<{
    templateEngine: any;
    dataService: any;
    exportService: any;
  }> = {}): ReportGenerationService {
    const mockTemplateEngine = {
      render: jest.fn().mockResolvedValue('<html>Report Content</html>'),
      compile: jest.fn().mockReturnValue({ render: jest.fn() }),
      validateTemplate: jest.fn().mockReturnValue(true),
      ...overrides.templateEngine,
    };

    const mockDataService = {
      fetchData: jest.fn().mockResolvedValue([
        { id: 1, name: 'Item 1', value: 100 },
        { id: 2, name: 'Item 2', value: 200 },
      ]),
      validateQuery: jest.fn().mockReturnValue(true),
      executeQuery: jest.fn().mockResolvedValue({ rows: [], metadata: {} }),
      ...overrides.dataService,
    };

    const mockExportService = {
      exportToPdf: jest.fn().mockResolvedValue(Buffer.from('PDF content')),
      exportToExcel: jest.fn().mockResolvedValue(Buffer.from('Excel content')),
      exportToCsv: jest.fn().mockResolvedValue('CSV content'),
      exportToJson: jest.fn().mockResolvedValue('{"data": []}'),
      ...overrides.exportService,
    };

    return new ReportGenerationService(
      mockTemplateEngine,
      mockDataService,
      mockExportService
    );
  }

  static createReportPermissionService(overrides: Partial<{
    userService: any;
    organizationService: any;
    roleService: any;
  }> = {}): ReportPermissionService {
    const mockUserService = {
      findById: jest.fn().mockResolvedValue(UserFactory.create()),
      hasPermission: jest.fn().mockReturnValue(true),
      getUserRoles: jest.fn().mockReturnValue(['viewer', 'editor']),
      ...overrides.userService,
    };

    const mockOrganizationService = {
      findById: jest.fn().mockResolvedValue({ id: 'org-1', name: 'Test Org' }),
      getUserMembership: jest.fn().mockResolvedValue({ role: 'admin', permissions: [] }),
      ...overrides.organizationService,
    };

    const mockRoleService = {
      getPermissions: jest.fn().mockReturnValue(['read', 'write', 'delete']),
      hasPermission: jest.fn().mockReturnValue(true),
      ...overrides.roleService,
    };

    return new ReportPermissionService(
      mockUserService,
      mockOrganizationService,
      mockRoleService
    );
  }

  static createReportSchedulingService(overrides: Partial<{
    scheduler: any;
    notificationService: any;
    reportGenerationService: any;
  }> = {}): ReportSchedulingService {
    const mockScheduler = {
      schedule: jest.fn().mockResolvedValue({ jobId: 'job-123' }),
      cancel: jest.fn().mockResolvedValue(true),
      reschedule: jest.fn().mockResolvedValue({ jobId: 'job-456' }),
      getStatus: jest.fn().mockReturnValue('scheduled'),
      ...overrides.scheduler,
    };

    const mockNotificationService = {
      send: jest.fn().mockResolvedValue(true),
      sendBulk: jest.fn().mockResolvedValue([]),
      ...overrides.notificationService,
    };

    const mockReportGenerationService = overrides.reportGenerationService || 
      this.createReportGenerationService();

    return new ReportSchedulingService(
      mockScheduler,
      mockNotificationService,
      mockReportGenerationService
    );
  }

  // Helper methods for creating service combinations
  static createAllNotificationServices(): {
    deliveryService: NotificationDeliveryService;
    routingService: NotificationRoutingService;
  } {
    return {
      deliveryService: this.createNotificationDeliveryService(),
      routingService: this.createNotificationRoutingService(),
    };
  }

  static createAllReportServices(): {
    generationService: ReportGenerationService;
    permissionService: ReportPermissionService;
    schedulingService: ReportSchedulingService;
  } {
    const generationService = this.createReportGenerationService();
    
    return {
      generationService,
      permissionService: this.createReportPermissionService(),
      schedulingService: this.createReportSchedulingService({
        reportGenerationService: generationService,
      }),
    };
  }

  // Mock service builders for testing specific scenarios
  static createFailingNotificationDeliveryService(): NotificationDeliveryService {
    return this.createNotificationDeliveryService({
      emailService: {
        send: jest.fn().mockRejectedValue(new Error('Email service unavailable')),
      },
      pushService: {
        send: jest.fn().mockRejectedValue(new Error('Push service unavailable')),
      },
    });
  }

  static createSlowReportGenerationService(): ReportGenerationService {
    return this.createReportGenerationService({
      templateEngine: {
        render: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve('<html>Slow Report</html>'), 2000))
        ),
      },
      dataService: {
        fetchData: jest.fn().mockImplementation(() =>
          new Promise(resolve => setTimeout(() => resolve([]), 1500))
        ),
      },
    });
  }

  static createUnauthorizedReportPermissionService(): ReportPermissionService {
    return this.createReportPermissionService({
      userService: {
        hasPermission: jest.fn().mockReturnValue(false),
        getUserRoles: jest.fn().mockReturnValue([]),
      },
      roleService: {
        hasPermission: jest.fn().mockReturnValue(false),
        getPermissions: jest.fn().mockReturnValue([]),
      },
    });
  }
}

// Placeholder test to ensure jest treats this file as a valid suite when matched
describe('DomainServiceFactory helpers', () => {
  it('creates combined services', () => {
    const services = DomainServiceFactory.createAllReportServices();
    expect(services.generationService).toBeDefined();
    expect(services.permissionService).toBeDefined();
    expect(services.schedulingService).toBeDefined();
  });
});