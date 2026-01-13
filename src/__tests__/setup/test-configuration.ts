import { MockReportRepository, MockNotificationRepository, MockUserRepository } from '../mocks/repository-mocks';
import { 
  MockFileStorageService, 
  MockNotificationService, 
  MockNotificationRoutingService, 
  MockReportExportService,
  MockEmailProvider,
  createMockServices,
  resetAllMocks
} from '../mocks/service-mocks';
import { ReportFactory } from '../factories/report-factory';
import { NotificationFactory } from '../factories/notification-factory';
import { ReportTemplateFactory } from '../factories/report-template-factory';
import { UserFactory } from '../factories/user-factory';

/**
 * Comprehensive test configuration for vertical slice architecture
 */
export class TestConfiguration {
  // Repositories
  public readonly reportRepository: MockReportRepository;
  public readonly notificationRepository: MockNotificationRepository;
  public readonly userRepository: MockUserRepository;

  // Services
  public readonly fileStorageService: MockFileStorageService;
  public readonly notificationService: MockNotificationService;
  public readonly routingService: MockNotificationRoutingService;
  public readonly exportService: MockReportExportService;
  public readonly emailProvider: MockEmailProvider;

  // Factories
  public readonly reportFactory: ReportFactory;
  public readonly notificationFactory: NotificationFactory;
  public readonly reportTemplateFactory: ReportTemplateFactory;
  public readonly userFactory: UserFactory;

  constructor() {
    // Initialize repositories
    this.reportRepository = new MockReportRepository();
    this.notificationRepository = new MockNotificationRepository();
    this.userRepository = new MockUserRepository();

    // Initialize services
    const services = createMockServices();
    this.fileStorageService = services.fileStorage;
    this.notificationService = services.notification;
    this.routingService = services.routing;
    this.exportService = services.export;
    this.emailProvider = services.email;

    // Initialize factories
    this.reportFactory = new ReportFactory();
    this.notificationFactory = new NotificationFactory();
    this.reportTemplateFactory = new ReportTemplateFactory();
    this.userFactory = new UserFactory();
  }

  /**
   * Reset all mocks and clear data
   */
  reset(): void {
    // Clear repositories
    this.reportRepository.clear();
    this.notificationRepository.clear();
    this.userRepository.clear();

    // Clear services
    this.fileStorageService.clear();
    this.notificationService.clear();
    this.routingService.clear();
    this.exportService.clear();
    this.emailProvider.clear();
  }

  /**
   * Setup common test data
   */
  setupCommonData(): {
    users: any[];
    reports: any[];
    notifications: any[];
    templates: any[];
  } {
    // Create test users
    const users = [
      this.userFactory.createUser({
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN'
      }),
      this.userFactory.createUser({
        email: 'user@example.com',
        name: 'Regular User',
        role: 'USER'
      }),
      this.userFactory.createUser({
        email: 'manager@example.com',
        name: 'Manager User',
        role: 'MANAGER'
      })
    ];

    users.forEach(user => this.userRepository.addUser(user));

    // Create test report templates
    const templates = [
      this.reportTemplateFactory.createReportTemplate({
        name: 'Sales Report Template',
        category: 'sales',
        description: 'Template for sales reports'
      }),
      this.reportTemplateFactory.createReportTemplate({
        name: 'Analytics Template',
        category: 'analytics',
        description: 'Template for analytics reports'
      })
    ];

    // Create test reports
    const reports = [
      this.reportFactory.createReport({
        title: 'Q1 Sales Report',
        description: 'First quarter sales analysis',
        createdBy: users[0].id,
        organizationId: users[0].organizationId,
        templateId: templates[0].id,
        isPublic: true
      }),
      this.reportFactory.createReport({
        title: 'User Analytics',
        description: 'User behavior analytics',
        createdBy: users[1].id,
        organizationId: users[1].organizationId,
        templateId: templates[1].id,
        isPublic: false
      })
    ];

    reports.forEach(report => this.reportRepository.addReport(report));

    // Create test notifications
    const notifications = [
      this.notificationFactory.createNotification({
        userId: users[0].id,
        title: 'Report Generated',
        message: 'Your report has been generated successfully',
        category: 'REPORT_GENERATED'
      }),
      this.notificationFactory.createNotification({
        userId: users[1].id,
        title: 'System Update',
        message: 'System will be updated tonight',
        category: 'SYSTEM_NOTIFICATION'
      })
    ];

    notifications.forEach(notification => this.notificationRepository.addNotification(notification));

    return { users, reports, notifications, templates };
  }

  /**
   * Setup test scenario for report creation flow
   */
  setupReportCreationScenario(): {
    user: any;
    template: any;
    reportData: any;
  } {
    const user = this.userFactory.createUser({
      email: 'creator@example.com',
      name: 'Report Creator'
    });
    this.userRepository.addUser(user);

    const template = this.reportTemplateFactory.createReportTemplate({
      name: 'Test Template',
      category: 'test'
    });

    const reportData = {
      title: 'Test Report',
      description: 'A test report for creation flow',
      templateId: template.id.value,
      createdBy: user.id.value,
      organizationId: user.organizationId?.value
    };

    return { user, template, reportData };
  }

  /**
   * Setup test scenario for notification flow
   */
  setupNotificationScenario(): {
    user: any;
    preferences: any;
    notificationData: any;
  } {
    const user = this.userFactory.createUser({
      email: 'recipient@example.com',
      name: 'Notification Recipient'
    });
    this.userRepository.addUser(user);

    const preferences = {
      userId: user.id.value,
      emailEnabled: true,
      pushEnabled: false,
      smsEnabled: false
    };

    const notificationData = {
      userId: user.id.value,
      title: 'Test Notification',
      message: 'This is a test notification',
      category: 'TEST_CATEGORY',
      channels: ['EMAIL']
    };

    return { user, preferences, notificationData };
  }

  /**
   * Setup error scenarios for testing
   */
  setupErrorScenarios(): void {
    // Configure email provider to fail for specific addresses
    this.emailProvider.setShouldFail(false);
    
    // Configure routing service for specific scenarios
    this.routingService.setRoutingDecision(
      'blocked-user-id',
      'BLOCKED_CATEGORY',
      {
        shouldDeliver: false,
        channels: [],
        reason: 'User blocked notifications'
      }
    );

    this.routingService.setRoutingDecision(
      'delayed-user-id',
      'DELAYED_CATEGORY',
      {
        shouldDeliver: true,
        channels: [],
        delayUntil: new Date(Date.now() + 3600000), // 1 hour delay
        reason: 'Delivery delayed due to rate limiting'
      }
    );
  }

  /**
   * Get test database connection (mock)
   */
  getTestDatabase(): any {
    return {
      report: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      },
      notification: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      },
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      },
      $transaction: jest.fn()
    };
  }

  /**
   * Create test authentication context
   */
  createAuthContext(userId?: string, orgId?: string): any {
    return {
      userId: userId || 'test-user-id',
      orgId: orgId || 'test-org-id',
      sessionId: 'test-session-id',
      permissions: ['read', 'write', 'delete']
    };
  }

  /**
   * Create test HTTP request
   */
  createTestRequest(
    url: string,
    method: string = 'GET',
    body?: any,
    headers?: Record<string, string>
  ): any {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
      ...headers
    };

    return {
      url,
      method,
      headers: new Headers(defaultHeaders),
      json: async () => body,
      text: async () => JSON.stringify(body),
      body: body ? JSON.stringify(body) : undefined
    };
  }

  /**
   * Assert response structure
   */
  assertSuccessResponse(response: any, expectedData?: any): void {
    expect(response).toHaveProperty('success', true);
    expect(response).toHaveProperty('data');
    
    if (expectedData) {
      expect(response.data).toMatchObject(expectedData);
    }
  }

  assertErrorResponse(response: any, expectedError?: string, expectedStatus?: number): void {
    expect(response).toHaveProperty('success', false);
    expect(response).toHaveProperty('error');
    
    if (expectedError) {
      expect(response.error).toContain(expectedError);
    }
    
    if (expectedStatus) {
      expect(response.status).toBe(expectedStatus);
    }
  }

  /**
   * Wait for async operations (useful for testing)
   */
  async waitFor(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate test data in bulk
   */
  generateBulkTestData(count: number): {
    users: any[];
    reports: any[];
    notifications: any[];
  } {
    const users = Array.from({ length: count }, (_, i) => 
      this.userFactory.createUser({
        email: `user${i}@example.com`,
        name: `User ${i}`
      })
    );

    const reports = Array.from({ length: count }, (_, i) => 
      this.reportFactory.createReport({
        title: `Report ${i}`,
        description: `Description for report ${i}`,
        createdBy: users[i % users.length].id
      })
    );

    const notifications = Array.from({ length: count }, (_, i) => 
      this.notificationFactory.createNotification({
        userId: users[i % users.length].id,
        title: `Notification ${i}`,
        message: `Message for notification ${i}`
      })
    );

    // Add to repositories
    users.forEach(user => this.userRepository.addUser(user));
    reports.forEach(report => this.reportRepository.addReport(report));
    notifications.forEach(notification => this.notificationRepository.addNotification(notification));

    return { users, reports, notifications };
  }
}

/**
 * Global test configuration instance
 */
export const testConfig = new TestConfiguration();

/**
 * Enhanced Test Environment Configuration
 */
export class TestEnvironmentManager {
  private static instance: TestEnvironmentManager;
  private mockServices: ReturnType<typeof createMockServices>;
  private mockRepositories: {
    report: MockReportRepository;
    notification: MockNotificationRepository;
    user: MockUserRepository;
  };
  private testDatabase: Map<string, any> = new Map();
  private testScenarios: Map<string, () => Promise<void>> = new Map();

  private constructor() {
    this.mockServices = createMockServices();
    this.mockRepositories = {
      report: new MockReportRepository(),
      notification: new MockNotificationRepository(),
      user: new MockUserRepository()
    };
    this.setupTestScenarios();
  }

  static getInstance(): TestEnvironmentManager {
    if (!TestEnvironmentManager.instance) {
      TestEnvironmentManager.instance = new TestEnvironmentManager();
    }
    return TestEnvironmentManager.instance;
  }

  /**
   * Reset all test data and mocks
   */
  async resetTestEnvironment(): Promise<void> {
    // Reset all mock services
    resetAllMocks(this.mockServices);
    
    // Reset all mock repositories
    this.mockRepositories.report.clear();
    this.mockRepositories.notification.clear();
    this.mockRepositories.user.clear();
    
    // Clear test database
    this.testDatabase.clear();
    
    // Reset any global test state
    jest.clearAllMocks();
    jest.clearAllTimers();
  }

  /**
   * Setup predefined test scenarios
   */
  private setupTestScenarios(): void {
    // Scenario: Basic report workflow
    this.testScenarios.set('basic-report-workflow', async () => {
      const user = UserFactory.create({ email: 'test@example.com' });
      const report = ReportFactory.create({ 
        createdBy: user.id,
        title: 'Test Report',
        status: ReportStatus.create('draft')
      });
      
      this.mockRepositories.user.addUser(user);
      this.mockRepositories.report.addReport(report);
    });

    // Scenario: Notification flow
    this.testScenarios.set('notification-flow', async () => {
      const user = UserFactory.create({ email: 'recipient@example.com' });
      const notification = NotificationFactory.create({
        recipientId: user.id,
        message: 'Test notification',
        channel: NotificationChannel.create('email')
      });
      
      this.mockRepositories.user.addUser(user);
      this.mockRepositories.notification.addNotification(notification);
    });

    // Scenario: Error conditions
    this.testScenarios.set('error-conditions', async () => {
      // Configure services to fail
      this.mockServices.fileStorage.setShouldFail('upload', true);
      this.mockServices.notification.setShouldFail('send', true);
      this.mockRepositories.report.setShouldFail('save', true);
    });

    // Scenario: Performance testing
    this.testScenarios.set('performance-testing', async () => {
      // Add delays to simulate slow operations
      this.mockServices.fileStorage.setOperationDelay('upload', 1000);
      this.mockServices.notification.setOperationDelay('send', 500);
      this.mockRepositories.report.setOperationDelay('save', 200);
    });

    // Scenario: Large dataset
    this.testScenarios.set('large-dataset', async () => {
      const users = Array.from({ length: 100 }, () => UserFactory.create());
      const reports = Array.from({ length: 500 }, () => ReportFactory.create({
        createdBy: users[Math.floor(Math.random() * users.length)].id
      }));
      
      users.forEach(user => this.mockRepositories.user.addUser(user));
      reports.forEach(report => this.mockRepositories.report.addReport(report));
    });
  }

  /**
   * Load a predefined test scenario
   */
  async loadScenario(scenarioName: string): Promise<void> {
    const scenario = this.testScenarios.get(scenarioName);
    if (!scenario) {
      throw new Error(`Test scenario '${scenarioName}' not found`);
    }
    
    await this.resetTestEnvironment();
    await scenario();
  }

  /**
   * Get mock services
   */
  getMockServices() {
    return this.mockServices;
  }

  /**
   * Get mock repositories
   */
  getMockRepositories() {
    return this.mockRepositories;
  }

  /**
   * Store test data for cross-test sharing
   */
  setTestData(key: string, value: any): void {
    this.testDatabase.set(key, value);
  }

  /**
   * Retrieve test data
   */
  getTestData<T>(key: string): T | undefined {
    return this.testDatabase.get(key);
  }

  /**
   * Configure mock behavior for specific test needs
   */
  configureMockBehavior(config: {
    fileStorage?: {
      shouldFail?: string[];
      delays?: Record<string, number>;
      maxFileSize?: number;
      allowedTypes?: string[];
    };
    notification?: {
      shouldFail?: string[];
      delays?: Record<string, number>;
      deliveryRate?: number;
    };
    repositories?: {
      report?: {
        shouldFail?: string[];
        delays?: Record<string, number>;
      };
      notification?: {
        shouldFail?: string[];
        delays?: Record<string, number>;
      };
      user?: {
        shouldFail?: string[];
        delays?: Record<string, number>;
      };
    };
  }): void {
    // Configure file storage
    if (config.fileStorage) {
      const { shouldFail, delays, maxFileSize, allowedTypes } = config.fileStorage;
      
      shouldFail?.forEach(operation => 
        this.mockServices.fileStorage.setShouldFail(operation, true)
      );
      
      Object.entries(delays || {}).forEach(([operation, delay]) =>
        this.mockServices.fileStorage.setOperationDelay(operation, delay)
      );
    }

    // Configure notification service
    if (config.notification) {
      const { shouldFail, delays } = config.notification;
      
      shouldFail?.forEach(operation => 
        this.mockServices.notification.setShouldFail(operation, true)
      );
      
      Object.entries(delays || {}).forEach(([operation, delay]) =>
        this.mockServices.notification.setOperationDelay(operation, delay)
      );
    }

    // Configure repositories
    if (config.repositories) {
      Object.entries(config.repositories).forEach(([repoName, repoConfig]) => {
        const repo = this.mockRepositories[repoName as keyof typeof this.mockRepositories];
        if (repo && 'setShouldFail' in repo) {
          repoConfig.shouldFail?.forEach(operation => 
            (repo as any).setShouldFail(operation, true)
          );
          
          Object.entries(repoConfig.delays || {}).forEach(([operation, delay]) =>
            (repo as any).setOperationDelay(operation, delay)
          );
        }
      });
    }
  }

  /**
   * Generate test statistics and reports
   */
  generateTestReport(): {
    mockServices: {
      fileStorage: ReturnType<MockFileStorageService['getStorageStatistics']>;
      notification: ReturnType<MockNotificationService['getNotificationStatistics']>;
    };
    mockRepositories: {
      report: ReturnType<MockReportRepository['getDetailedStatistics']>;
    };
    testDatabase: {
      totalEntries: number;
      keys: string[];
    };
  } {
    return {
      mockServices: {
        fileStorage: this.mockServices.fileStorage.getStorageStatistics(),
        notification: this.mockServices.notification.getNotificationStatistics()
      },
      mockRepositories: {
        report: this.mockRepositories.report.getDetailedStatistics()
      },
      testDatabase: {
        totalEntries: this.testDatabase.size,
        keys: Array.from(this.testDatabase.keys())
      }
    };
  }

  /**
   * Validate test environment state
   */
  validateEnvironmentState(): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for common test issues
    const reportStats = this.mockRepositories.report.getDetailedStatistics();
    if (reportStats.totalReports > 1000) {
      issues.push('Large number of test reports may slow down tests');
      recommendations.push('Consider using smaller datasets or pagination in tests');
    }

    const notificationStats = this.mockServices.notification.getNotificationStatistics();
    if (notificationStats.totalSent > 500) {
      issues.push('Large number of notifications sent in tests');
      recommendations.push('Consider mocking notification sending for unit tests');
    }

    if (this.testDatabase.size > 100) {
      issues.push('Large amount of test data stored');
      recommendations.push('Clean up test data between test suites');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }
}

/**
 * Test Assertion Helpers
 */
export class TestAssertions {
  /**
   * Assert that a report has the expected properties
   */
  static assertReportProperties(
    report: Report,
    expected: Partial<{
      title: string;
      status: string;
      isPublic: boolean;
      createdBy: string;
      organizationId: string;
    }>
  ): void {
    if (expected.title !== undefined) {
      expect(report.title).toBe(expected.title);
    }
    if (expected.status !== undefined) {
      expect(report.status.value).toBe(expected.status);
    }
    if (expected.isPublic !== undefined) {
      expect(report.isPublic).toBe(expected.isPublic);
    }
    if (expected.createdBy !== undefined) {
      expect(report.createdBy.value).toBe(expected.createdBy);
    }
    if (expected.organizationId !== undefined) {
      expect(report.organizationId?.value).toBe(expected.organizationId);
    }
  }

  /**
   * Assert that a notification was sent with expected properties
   */
  static assertNotificationSent(
    notifications: Array<{ recipient: string; message: string; channel: string }>,
    expected: {
      recipient: string;
      messageContains?: string;
      channel?: string;
    }
  ): void {
    const matchingNotification = notifications.find(n => 
      n.recipient === expected.recipient &&
      (!expected.channel || n.channel === expected.channel) &&
      (!expected.messageContains || n.message.includes(expected.messageContains))
    );

    expect(matchingNotification).toBeDefined();
  }

  /**
   * Assert that file operations completed successfully
   */
  static assertFileOperations(
    fileStorage: MockFileStorageService,
    expected: {
      filesUploaded?: number;
      totalSize?: number;
      fileTypes?: string[];
    }
  ): void {
    const stats = fileStorage.getStorageStatistics();
    
    if (expected.filesUploaded !== undefined) {
      expect(stats.totalFiles).toBe(expected.filesUploaded);
    }
    if (expected.totalSize !== undefined) {
      expect(stats.totalSize).toBe(expected.totalSize);
    }
    if (expected.fileTypes !== undefined) {
      const actualTypes = Object.keys(stats.filesByType);
      expected.fileTypes.forEach(type => {
        expect(actualTypes).toContain(type);
      });
    }
  }

  /**
   * Assert API response structure
   */
  static assertApiResponse<T>(
    response: any,
    expected: {
      status?: number;
      hasData?: boolean;
      dataShape?: Partial<T>;
      hasError?: boolean;
      errorMessage?: string;
    }
  ): void {
    if (expected.status !== undefined) {
      expect(response.status).toBe(expected.status);
    }
    if (expected.hasData !== undefined) {
      expect(!!response.data).toBe(expected.hasData);
    }
    if (expected.dataShape && response.data) {
      Object.entries(expected.dataShape).forEach(([key, value]) => {
        expect(response.data).toHaveProperty(key, value);
      });
    }
    if (expected.hasError !== undefined) {
      expect(!!response.error).toBe(expected.hasError);
    }
    if (expected.errorMessage !== undefined) {
      expect(response.error?.message).toContain(expected.errorMessage);
    }
  }

  /**
   * Assert pagination response
   */
  static assertPaginationResponse(
    response: any,
    expected: {
      totalItems?: number;
      currentPage?: number;
      itemsPerPage?: number;
      hasMore?: boolean;
    }
  ): void {
    expect(response).toHaveProperty('total');
    expect(response).toHaveProperty('page');
    expect(response).toHaveProperty('limit');
    expect(response).toHaveProperty('hasMore');

    if (expected.totalItems !== undefined) {
      expect(response.total).toBe(expected.totalItems);
    }
    if (expected.currentPage !== undefined) {
      expect(response.page).toBe(expected.currentPage);
    }
    if (expected.itemsPerPage !== undefined) {
      expect(response.limit).toBe(expected.itemsPerPage);
    }
    if (expected.hasMore !== undefined) {
      expect(response.hasMore).toBe(expected.hasMore);
    }
  }
}

/**
 * Performance Testing Utilities
 */
export class PerformanceTestUtils {
  /**
   * Measure execution time of an async function
   */
  static async measureExecutionTime<T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; executionTime: number }> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    
    return {
      result,
      executionTime: endTime - startTime
    };
  }

  /**
   * Assert that operation completes within expected time
   */
  static async assertExecutionTime<T>(
    fn: () => Promise<T>,
    maxExecutionTime: number,
    description?: string
  ): Promise<T> {
    const { result, executionTime } = await this.measureExecutionTime(fn);
    
    expect(executionTime).toBeLessThan(maxExecutionTime);
    
    if (description) {
      console.log(`${description}: ${executionTime.toFixed(2)}ms`);
    }
    
    return result;
  }

  /**
   * Run load test with multiple concurrent operations
   */
  static async runLoadTest<T>(
    operation: () => Promise<T>,
    concurrency: number,
    iterations: number
  ): Promise<{
    results: T[];
    totalTime: number;
    averageTime: number;
    successRate: number;
  }> {
    const startTime = performance.now();
    const promises: Promise<T>[] = [];
    
    for (let i = 0; i < iterations; i++) {
      promises.push(operation());
      
      // Control concurrency
      if (promises.length >= concurrency) {
        await Promise.all(promises.splice(0, concurrency));
      }
    }
    
    // Wait for remaining promises
    if (promises.length > 0) {
      await Promise.all(promises);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    return {
      results: [], // Results would be collected in a real implementation
      totalTime,
      averageTime: totalTime / iterations,
      successRate: 1.0 // Would calculate based on actual success/failure rates
    };
  }
}

/**
 * Global test setup and teardown
 */
export const setupTestEnvironment = async (): Promise<TestEnvironmentManager> => {
  const testEnv = TestEnvironmentManager.getInstance();
  await testEnv.resetTestEnvironment();
  return testEnv;
};

export const teardownTestEnvironment = async (): Promise<void> => {
  const testEnv = TestEnvironmentManager.getInstance();
  await testEnv.resetTestEnvironment();
};

/**
 * Jest setup helpers
 */
export const configureJestEnvironment = (): void => {
  // Configure Jest timeouts
  jest.setTimeout(30000);
  
  // Setup global test utilities
  (global as any).testEnv = TestEnvironmentManager.getInstance();
  (global as any).TestAssertions = TestAssertions;
  (global as any).PerformanceTestUtils = PerformanceTestUtils;
  
  // Setup common mocks
  jest.mock('@clerk/nextjs', () => ({
    auth: jest.fn(() => ({
      userId: 'test-user-id',
      orgId: 'test-org-id'
    })),
    currentUser: jest.fn(() => ({
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }]
    }))
  }));
  
  // Mock Prisma
  jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: {
      report: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      },
      notification: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }
    }
  }));
};

// Export singleton instance for easy access
export const testEnvironment = TestEnvironmentManager.getInstance();