/*
 * Centralized Test Mocks Utility
 * Provides Jest-friendly mocks for queue (BullMQ), email providers (Resend/SendGrid/Svix),
 * and other external dependencies that cause ESM/friction in tests.
 */

import type { EmailOptions, EmailResult } from '@/lib/email/types';

// Queue service mock interface
export interface QueueServiceMock {
  addJob: jest.Mock<Promise<{ id: string }>, [any, any?]>;
  getJobStatus: jest.Mock<Promise<string>, [string]>;
  getQueueStats: jest.Mock<Promise<{ waiting: number; active: number; completed: number; failed: number }>, []>;
  pauseQueue: jest.Mock<Promise<void>, [string?]>;
  resumeQueue: jest.Mock<Promise<void>, [string?]>;
  cleanQueue: jest.Mock<Promise<void>, [string?, number?]>;
}

// Email service mock interface
export interface EmailServiceMock {
  sendEmail: jest.Mock<Promise<EmailResult>, [EmailOptions]>;
  sendBulkEmails: jest.Mock<Promise<EmailResult[]>, [EmailOptions[]]>;
  getEmailStatus: jest.Mock<Promise<{ status: string }>, [string?]>;
  validateEmail: jest.Mock<boolean, [string]>;
}

// Instances
export const queueServiceMock: QueueServiceMock = {
  addJob: jest.fn(async () => ({ id: 'mock-job-id' })),
  getJobStatus: jest.fn(async () => 'completed'),
  getQueueStats: jest.fn(async () => ({ waiting: 0, active: 0, completed: 10, failed: 0 })),
  pauseQueue: jest.fn(async () => undefined),
  resumeQueue: jest.fn(async () => undefined),
  cleanQueue: jest.fn(async () => undefined),
};

export const emailServiceMock: EmailServiceMock = {
  sendEmail: jest.fn(async (options: EmailOptions) => ({
    success: true,
    messageId: 'mock-message-id',
    provider: 'mock',
    timestamp: new Date(),
  })),
  sendBulkEmails: jest.fn(async (optionsArray: EmailOptions[]) => optionsArray.map((_, idx) => ({
    success: true,
    messageId: `mock-message-${idx + 1}`,
    provider: 'mock',
    timestamp: new Date(),
  }))),
  getEmailStatus: jest.fn(async () => ({ status: 'delivered' })),
  validateEmail: jest.fn((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
};

// External dependency mocks
export const svixMock = {
  Webhook: jest.fn().mockImplementation(() => ({
    verify: jest.fn().mockReturnValue(true),
  })),
  Application: jest.fn().mockImplementation(() => ({
    create: jest.fn().mockResolvedValue({ id: 'mock-app-id' }),
    get: jest.fn().mockResolvedValue({ id: 'mock-app-id' }),
    update: jest.fn().mockResolvedValue({ id: 'mock-app-id' }),
    delete: jest.fn().mockResolvedValue(undefined),
  })),
};

// Install mocks
export function installTestMocks() {
  // Queue
  jest.mock('@/lib/queue', () => ({
    queueService: queueServiceMock,
    QueueService: jest.fn().mockImplementation(() => queueServiceMock),
  }), { virtual: true });

  // Email service and index
  jest.mock('@/lib/email/email-service', () => ({
    emailService: emailServiceMock,
    EmailService: jest.fn().mockImplementation(() => emailServiceMock),
  }), { virtual: true });

  jest.mock('@/lib/email', () => ({
    sendEmail: emailServiceMock.sendEmail,
    sendBulkEmails: emailServiceMock.sendBulkEmails,
    getEmailStatus: emailServiceMock.getEmailStatus,
    validateEmail: emailServiceMock.validateEmail,
  }), { virtual: true });

  // Svix
  jest.mock('svix', () => svixMock, { virtual: true });
}

// Reset mocks (to be called in beforeEach/afterEach)
export function resetTestMocks() {
  jest.clearAllMocks();
  queueServiceMock.addJob.mockClear();
  queueServiceMock.getJobStatus.mockClear();
  queueServiceMock.getQueueStats.mockClear();
  queueServiceMock.pauseQueue.mockClear();
  queueServiceMock.resumeQueue.mockClear();
  queueServiceMock.cleanQueue.mockClear();

  emailServiceMock.sendEmail.mockClear();
  emailServiceMock.sendBulkEmails.mockClear();
  emailServiceMock.getEmailStatus.mockClear();
  emailServiceMock.validateEmail.mockClear();
}

// Helper to ensure JSON Request body is correctly set in tests
export function makeApiRequest(url: string, init?: { method?: string; headers?: Record<string, string>; body?: any }) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers || {}),
  };
  const body = init?.body !== undefined
    ? (typeof init.body === 'string' ? init.body : JSON.stringify(init.body))
    : undefined;
  const request = new Request(url, {
    method: init?.method || 'GET',
    headers: new Headers(headers),
    body,
  });
  // Ensure request.json works in tests even if environment lacks proper polyfill
  if (typeof (request as any).json !== 'function') {
    (request as any).json = async () => {
      if (typeof body === 'string') {
        try {
          return JSON.parse(body);
        } catch {
          return body;
        }
      }
      return body ?? null;
    };
  }
  return request;
}

// -----------------------------
// Prisma client test utilities
// -----------------------------
type JestFn = jest.Mock<any, any>;

export function createMockPrismaClient() {
  const fn = () => jest.fn();

  const scheduledReport = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  } as Record<string, JestFn> as any;

  const scheduledReportRun = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  } as Record<string, JestFn> as any;

  const user = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as Record<string, JestFn> as any;

  const organization = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as Record<string, JestFn> as any;

  const report = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  } as Record<string, JestFn> as any;

  return {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    scheduledReport,
    scheduledReportRun,
    user,
    organization,
    report,
  } as any;
}

// -----------------------------
// Common data builders for tests
// -----------------------------
export const mockUserData = (overrides: Partial<any> = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
});

export const mockOrganizationData = (overrides: Partial<any> = {}) => ({
  id: 'test-org-123',
  name: 'Test Organization',
  plan: 'pro',
  ...overrides,
});

export const mockReportData = (overrides: Partial<any> = {}) => ({
  id: 'report-123',
  name: 'Test Report',
  userId: 'test-user-123',
  organizationId: 'test-org-123',
  reportId: 'base-report-123',
  schedule: '0 9 * * 1',
  timezone: 'UTC',
  recipients: JSON.stringify(['test@example.com']),
  format: 'pdf',
  options: JSON.stringify({ includeCharts: true, includeData: true }),
  isActive: true,
  lastRun: null,
  nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockReportRunData = (overrides: Partial<any> = {}) => ({
  id: 'run-123',
  scheduledReportId: 'report-123',
  status: 'completed',
  startedAt: new Date(Date.now() - 60 * 1000),
  completedAt: new Date(),
  duration: 60000,
  fileSize: 1024,
  downloadUrl: '/api/download/run-123',
  errorMessage: null,
  ...overrides,
});

// Reset all mocks including local builders
export function resetAllMocks() {
  jest.clearAllMocks();
  resetTestMocks();
}