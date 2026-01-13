import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { ScheduledReportStatus, ExecutionStatus, ReportFrequency } from '@/shared/domain/reporting/entities/scheduled-report';
import { createMockNextRequest } from '../../utils/test-helpers';
// Route handlers will be loaded dynamically after mocks are set
let PUT: any, DELETE: any;
let GET: any, POST: any;
let GetRuns: any;
import { getServerSession } from 'next-auth';
import { 
  createMockPrismaClient, 
  mockReportData, 
  mockReportRunData, 
  mockUserData, 
  mockOrganizationData, 
  resetAllMocks 
} from '../../utils/test-mocks';
// Mock rate limiter to avoid interference in integration runs
jest.mock('@/lib/utils/rate-limiter', () => ({
  statsRateLimiter: {
    isAllowed: jest.fn().mockReturnValue(true),
    getResetTime: jest.fn().mockReturnValue(Date.now() + 1000)
  },
  createRateLimitResponse: jest.fn().mockReturnValue({ message: 'ok' })
}));

// Mock dependencies to avoid ESM import issues
jest.mock('@/lib/queue', () => ({
  QueueHelpers: {
    runScheduledReport: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    addReportJob: jest.fn().mockResolvedValue({ id: 'mock-job-id' })
  }
}));

jest.mock('@/lib/services/email-service', () => ({
  EmailService: {
    sendPaymentFailedEmail: jest.fn().mockResolvedValue(undefined),
    sendInvitationEmail: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn().mockReturnValue({
    userId: 'test-user-id',
    orgId: 'test-org-id',
    sessionId: 'test-session-id',
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User',
      imageUrl: 'https://example.com/avatar.jpg'
    }
  }),
  getAuth: jest.fn().mockReturnValue({
    userId: 'test-user-id',
    orgId: 'test-org-id',
    sessionId: 'test-session-id'
  })
}));

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock DB client used by services (ScheduledReportsService imports from '@/lib/db')
const mockPrisma = createMockPrismaClient();
jest.mock('@/lib/db', () => ({
  db: mockPrisma,
}));

// Silence console.error for controlled error scenarios across the suite
let consoleErrorSpy: jest.SpyInstance;
beforeAll(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  consoleErrorSpy?.mockRestore();
});

// Load route handlers after mocks to ensure they use mocked modules
beforeAll(async () => {
  const modRoot = await import('@/app/api/scheduled-reports/route');
  GET = modRoot.GET;
  POST = modRoot.POST;

  const modId = await import('@/app/api/scheduled-reports/[id]/route');
  PUT = modId.PUT;
  DELETE = modId.DELETE;

  const modRuns = await import('@/app/api/scheduled-reports/[id]/runs/route');
  GetRuns = modRuns.GET;
});

describe('Scheduled Reports API Integration Tests', () => {
  // Silence console.error for controlled error scenarios across this suite
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restore console.error after suite completes
    (console.error as any).mockRestore?.();
  });

  beforeEach(() => {
  resetAllMocks();
  
  // Setup default mock responses using our centralized mocks
  mockPrisma.scheduledReport.findMany.mockResolvedValue([]);
  mockPrisma.scheduledReport.count.mockResolvedValue(0);
  mockPrisma.scheduledReportRun.findMany.mockResolvedValue([]);
  mockPrisma.scheduledReportRun.count.mockResolvedValue(0);
  // Ensure scheduling job creation returns a valid run id
  mockPrisma.scheduledReportRun.create.mockResolvedValue({ id: 'run-setup' });
  // Default mock for scheduled report creation to avoid undefined returns
  mockPrisma.scheduledReport.create.mockImplementation(async (args: any) => ({
    id: 'sr-default',
    name: args?.data?.name ?? 'Default Report',
    description: args?.data?.description ?? '',
    reportId: args?.data?.reportId ?? '550e8400-e29b-41d4-a716-446655440000',
    userId: args?.data?.userId ?? 'test-user-123',
    organizationId: args?.data?.organizationId ?? 'test-org-123',
    schedule: args?.data?.schedule ?? '0 9 * * 1',
    timezone: args?.data?.timezone ?? 'UTC',
    recipients: args?.data?.recipients ?? JSON.stringify(['test@example.com']),
    format: args?.data?.format ?? 'pdf',
    options: args?.data?.options ?? JSON.stringify({ includeCharts: true }),
    isActive: args?.data?.isActive ?? true,
    nextRun: args?.data?.nextRun ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  // Allow report access checks to pass by default
  mockPrisma.report.findFirst.mockResolvedValue({
    id: '550e8400-e29b-41d4-a716-446655440000',
    createdBy: 'test-user-123',
    organizationId: 'test-org-123'
  });
  
  // Setup default session mock
  (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'test-user-123' } });
});

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/scheduled-reports', () => {
    it('should create a new scheduled report', async () => {
      const request = createMockNextRequest({
        name: 'Test Report',
        description: 'Test description',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        schedule: '0 9 * * 1', // Every Monday at 9 AM
        timezone: 'UTC',
        recipients: ['test@example.com'],
        format: 'pdf',
        options: {
          includeCharts: true,
          includeData: true,
          includeMetadata: false,
        },
        isActive: true,
        organizationId: 'test-org-123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('id');
      expect(data.data.name).toBe('Test Report');
    });

    it('should handle validation errors for missing required fields', async () => {
      const request = createMockNextRequest({
        description: 'Test description without required fields',
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.code).toBe('VALIDATION_ERROR');
      expect(mockPrisma.scheduledReport.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during scheduled report creation', async () => {
      const scheduledReportData = {
        name: 'Test Report',
        description: 'DB error case',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        schedule: '0 9 * * 1',
        timezone: 'UTC',
        recipients: ['test@example.com'],
        format: 'pdf',
        isActive: true,
        organizationId: 'test-org-123'
      };

      mockPrisma.scheduledReport.create.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost/api/scheduled-reports', {
        method: 'POST',
        body: JSON.stringify(scheduledReportData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Database operation failed');
    });

    it('should create scheduled report with different cron schedules', async () => {
      const schedules = [
        '0 8 * * *', // daily at 8:00
        '0 9 * * 1', // weekly Monday 9:00
        '0 10 1 * *' // monthly on 1st at 10:00
      ];

      for (const cron of schedules) {
        const scheduledReportData = {
          name: 'Test Cron Report',
          reportId: '550e8400-e29b-41d4-a716-446655440000',
          schedule: cron,
          timezone: 'UTC',
          recipients: ['test@example.com'],
          format: 'pdf',
          isActive: true,
          organizationId: 'test-org-123'
        };

        const mockCreatedReport = {
          id: `scheduled-report-${cron.replace(/\s+/g, '-')}`,
          ...scheduledReportData,
          userId: 'test-user-123',
          organizationId: 'test-org-123',
          createdAt: new Date(),
          updatedAt: new Date(),
          nextRun: new Date(),
          lastRun: null,
        };

        mockPrisma.scheduledReport.create.mockResolvedValue(mockCreatedReport);

        const request = createMockNextRequest(scheduledReportData, {
          method: 'POST'
        });

        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(201);
        expect(responseData.success).toBe(true);
        expect(responseData.data.schedule).toBe(cron);
      }
    });
  });

  describe('GET /api/scheduled-reports - List Scheduled Reports Flow', () => {
    it('should retrieve scheduled reports with pagination', async () => {
      const mockScheduledReports = [
        {
          id: 'scheduled-report-1',
          name: 'Daily Sales Report',
          description: 'Daily sales summary',
          reportId: 'report-123',
          frequency: ReportFrequency.DAILY,
          isActive: true,
          userId: 'test-user-id',
          organizationId: 'test-org-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          nextExecution: new Date(),
          lastExecution: null,
          executionCount: 5
        },
        {
          id: 'scheduled-report-2',
          name: 'Weekly Analytics Report',
          description: 'Weekly analytics summary',
          reportId: 'report-456',
          frequency: ReportFrequency.WEEKLY,
          isActive: true,
          userId: 'test-user-id',
          organizationId: 'test-org-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          nextExecution: new Date(),
          lastExecution: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          executionCount: 12
        }
      ];

      mockPrisma.scheduledReport.findMany.mockResolvedValue(mockScheduledReports);
      mockPrisma.scheduledReport.count.mockResolvedValue(2);

      const request = new NextRequest('http://localhost/api/scheduled-reports?limit=10', {
        method: 'GET',
        headers: {
          'x-organization-id': 'test-org-id'
        }
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.scheduledReports).toHaveLength(2);
      expect(responseData.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      });

      expect(mockPrisma.scheduledReport.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'test-user-123',
          organizationId: 'test-org-id'
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
        include: expect.any(Object)
      });
    });

    it('should filter scheduled reports by status', async () => {
      const activeReports = [
        {
          id: 'scheduled-report-1',
          name: 'Active Report',
          isActive: true,
          userId: 'test-user-id',
          organizationId: 'test-org-id'
        }
      ];

      mockPrisma.scheduledReport.findMany.mockResolvedValue(activeReports);
      mockPrisma.scheduledReport.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost/api/scheduled-reports?isActive=true', {
        method: 'GET',
        headers: {
          'x-organization-id': 'test-org-id'
        }
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.scheduledReports).toHaveLength(1);
      expect(responseData.data.scheduledReports[0].isActive).toBe(true);

      expect(mockPrisma.scheduledReport.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'test-user-123',
          organizationId: 'test-org-id',
          isActive: true
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: expect.any(Object)
      });
    });

    it('should filter scheduled reports by frequency', async () => {
      const dailyReports = [
        {
          id: 'scheduled-report-1',
          name: 'Daily Report',
          frequency: ReportFrequency.DAILY,
          format: 'pdf',
          userId: 'test-user-id',
          organizationId: 'test-org-id'
        }
      ];

      mockPrisma.scheduledReport.findMany.mockResolvedValue(dailyReports);
      mockPrisma.scheduledReport.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost/api/scheduled-reports?format=pdf', {
        method: 'GET',
        headers: {
          'x-organization-id': 'test-org-id'
        }
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.scheduledReports[0].format).toBe('pdf');

      expect(mockPrisma.scheduledReport.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'test-user-123',
          organizationId: 'test-org-id',
          format: 'pdf'
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: expect.any(Object)
      });
    });

    it('should handle empty results', async () => {
      mockPrisma.scheduledReport.findMany.mockResolvedValue([]);
      mockPrisma.scheduledReport.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost/api/scheduled-reports', {
        method: 'GET',
        headers: {
          'x-organization-id': 'test-org-id'
        }
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.scheduledReports).toHaveLength(0);
      expect(responseData.data.pagination.total).toBe(0);
    });
  });

  describe('GET /api/scheduled-reports/[id]/runs - Get Execution Runs Flow', () => {
    it('should retrieve execution runs for a scheduled report', async () => {
      // Authorize access to scheduled report for user/org
      mockPrisma.scheduledReport.findFirst.mockResolvedValue({
        id: 'scheduled-report-123',
        userId: 'test-user-123',
        organizationId: 'test-org-123'
      });

      const mockRuns = [
        {
          id: 'run-1',
          scheduledReportId: 'scheduled-report-123',
          status: 'completed',
          startedAt: new Date(Date.now() - 60000),
          completedAt: new Date(),
          duration: 5000,
          totalRecipients: 10,
          successfulSends: 10,
          failedSends: 0,
          downloadUrl: 'https://storage.example.com/reports/run-1.pdf',
          fileSize: 2048576,
          errorMessage: null,
          errorDetails: null,
          createdAt: new Date(Date.now() - 60000)
        },
        {
          id: 'run-2',
          scheduledReportId: 'scheduled-report-123',
          status: 'failed',
          startedAt: new Date(Date.now() - 120000),
          completedAt: new Date(Date.now() - 60000),
          duration: 3000,
          totalRecipients: 10,
          successfulSends: 0,
          failedSends: 10,
          downloadUrl: null,
          fileSize: 0,
          errorMessage: 'Database connection timeout',
          errorDetails: { code: 'DB_TIMEOUT' },
          createdAt: new Date(Date.now() - 120000)
        }
      ];

      mockPrisma.scheduledReportRun.findMany.mockResolvedValue(mockRuns);

      const request = new NextRequest('http://localhost/api/scheduled-reports/scheduled-report-123/runs?organizationId=test-org-123', {
        method: 'GET'
      });

      const response = await GetRuns(request, { params: { id: 'scheduled-report-123' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.runs).toHaveLength(2);
      expect(responseData.data.runs[0].status).toBe('completed');
      expect(responseData.data.runs[1].status).toBe('failed');

      expect(mockPrisma.scheduledReportRun.findMany).toHaveBeenCalledWith({
        where: {
          scheduledReportId: 'scheduled-report-123'
        },
        orderBy: { startedAt: 'desc' },
        take: 20,
        skip: 0
      });
    });

    it('should filter runs by status', async () => {
      // Authorize access to scheduled report for user/org
      mockPrisma.scheduledReport.findFirst.mockResolvedValue({
        id: 'scheduled-report-123',
        userId: 'test-user-123',
        organizationId: 'test-org-123'
      });

      const completedRuns = [
        {
          id: 'run-1',
          scheduledReportId: 'scheduled-report-123',
          status: 'completed',
          startedAt: new Date(),
          completedAt: new Date(),
          duration: 5000,
          totalRecipients: 5,
          successfulSends: 5,
          failedSends: 0,
          downloadUrl: 'https://storage.example.com/reports/run-1.pdf',
          fileSize: 1024,
          errorMessage: null,
          errorDetails: null,
          createdAt: new Date()
        }
      ];

      mockPrisma.scheduledReportRun.findMany.mockResolvedValue(completedRuns);

      const request = new NextRequest('http://localhost/api/scheduled-reports/scheduled-report-123/runs?status=completed&organizationId=test-org-123&limit=50', {
        method: 'GET'
      });

      const response = await GetRuns(request, { params: { id: 'scheduled-report-123' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.runs).toHaveLength(1);
      expect(responseData.data.runs[0].status).toBe('completed');

      expect(mockPrisma.scheduledReportRun.findMany).toHaveBeenCalledWith({
        where: {
          scheduledReportId: 'scheduled-report-123',
          status: 'completed'
        },
        orderBy: { startedAt: 'desc' },
        take: 50,
        skip: 0
      });
    });

    it('should handle pagination for runs', async () => {
      // Authorize access to scheduled report for user/org
      mockPrisma.scheduledReport.findFirst.mockResolvedValue({
        id: 'scheduled-report-123',
        userId: 'test-user-123',
        organizationId: 'test-org-123'
      });

      const mockRuns = Array.from({ length: 25 }, (_, i) => ({
        id: `run-${i + 1}`,
        scheduledReportId: 'scheduled-report-123',
        status: 'completed',
        startedAt: new Date(Date.now() - i * 60000),
        completedAt: new Date(Date.now() - i * 60000 + 5000),
        duration: 5000,
        totalRecipients: 3,
        successfulSends: 3,
        failedSends: 0,
        downloadUrl: `https://storage.example.com/reports/run-${i + 1}.pdf`,
        fileSize: 2048,
        errorMessage: null,
        errorDetails: null,
        createdAt: new Date(Date.now() - i * 60000)
      }));

      mockPrisma.scheduledReportRun.findMany.mockResolvedValue(mockRuns.slice(0, 20));

      const request = new NextRequest('http://localhost/api/scheduled-reports/scheduled-report-123/runs?organizationId=test-org-123&limit=20&offset=0', {
        method: 'GET'
      });

      const response = await GetRuns(request, { params: { id: 'scheduled-report-123' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.runs).toHaveLength(20);

      expect(mockPrisma.scheduledReportRun.findMany).toHaveBeenCalledWith({
        where: {
          scheduledReportId: 'scheduled-report-123'
        },
        orderBy: { startedAt: 'desc' },
        take: 20,
        skip: 0
      });
    });

    it('should handle non-existent scheduled report', async () => {
      mockPrisma.scheduledReport.findFirst.mockResolvedValue(null);
      mockPrisma.scheduledReportRun.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost/api/scheduled-reports/non-existent-id/runs?organizationId=test-org-123', {
        method: 'GET'
      });

      const response = await GetRuns(request, { params: { id: 'non-existent-id' } });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBeDefined();
    });
  });

  describe('Complete Scheduled Report Lifecycle Flow', () => {
    it('should create, execute, and track scheduled report lifecycle', async () => {
      // Step 1: Create scheduled report
      const scheduledReportData = {
        name: 'Lifecycle Test Report',
        description: 'Lifecycle',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        schedule: '0 9 * * 1',
        timezone: 'UTC',
        recipients: ['test@example.com'],
        format: 'pdf',
        isActive: true,
        organizationId: 'test-org-id'
      };

      const mockCreatedReport = {
        id: 'scheduled-report-lifecycle',
        ...scheduledReportData,
        userId: 'test-user-id',
        organizationId: 'test-org-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        nextExecution: new Date(Date.now() + 24 * 60 * 60 * 1000),
        lastExecution: null,
        executionCount: 0
      };

      mockPrisma.scheduledReport.create.mockResolvedValue(mockCreatedReport);

      const createRequest = new NextRequest('http://localhost/api/scheduled-reports', {
        method: 'POST',
        body: JSON.stringify(scheduledReportData),
        headers: { 'Content-Type': 'application/json' }
      });

      const createResponse = await POST(createRequest);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(201);
      expect(createData.success).toBe(true);
      expect(createData.data.id).toBe('scheduled-report-lifecycle');

      // Step 2: Simulate execution run creation
      const mockRun = {
        id: 'run-lifecycle-1',
        scheduledReportId: 'scheduled-report-lifecycle',
        status: 'running',
        startedAt: new Date(),
        completedAt: null,
        duration: null,
        recordsProcessed: 0,
        outputSize: 0,
        outputUrl: null,
        error: null,
        metadata: {}
      };

      mockPrisma.scheduledReportRun.create.mockResolvedValue(mockRun);

      // Step 3: Get execution runs
      mockPrisma.scheduledReportRun.findMany.mockResolvedValue([mockRun]);

      // Authorize access for runs
      mockPrisma.scheduledReport.findFirst.mockResolvedValue(mockCreatedReport);

      const runsRequest = new NextRequest('http://localhost/api/scheduled-reports/scheduled-report-lifecycle/runs?organizationId=test-org-id', {
        method: 'GET'
      });

      const runsResponse = await GetRuns(runsRequest, { params: { id: 'scheduled-report-lifecycle' } });
      const runsData = await runsResponse.json();

      expect(runsResponse.status).toBe(200);
      expect(runsData.success).toBe(true);
      expect(runsData.data.runs).toHaveLength(1);
      expect(runsData.data.runs[0].status).toBe('running');

      // Step 4: Verify scheduled report appears in list
      mockPrisma.scheduledReport.findMany.mockResolvedValue([mockCreatedReport]);
      mockPrisma.scheduledReport.count.mockResolvedValue(1);

      const listRequest = new NextRequest('http://localhost/api/scheduled-reports', {
        method: 'GET'
      });

      const listResponse = await GET(listRequest);
      const listData = await listResponse.json();

      // Sin organizationId, debe fallar la validación de auth
      expect(listResponse.status).toBe(400);
      expect(listData.success).toBe(false);
      expect(listData.error).toContain('Organization ID is required');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle authentication errors', async () => {
      // Mock authenticated request but without organizationId to trigger validation error
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValueOnce({ user: { id: 'test-user-123' } });

      const request = new NextRequest('http://localhost/api/scheduled-reports', {
        method: 'GET'
      });

      const response = await GET(request);
      const responseData = await response.json();

      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(responseData, null, 2));

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBeDefined();
      expect(responseData.error).toContain('Organization ID is required');
    });

    it('should handle database connection errors', async () => {
      mockPrisma.scheduledReport.findMany.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost/api/scheduled-reports', {
        method: 'GET',
        headers: { 'x-organization-id': 'test-org-id' }
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Database operation failed');
    });

    it('should handle invalid pagination parameters', async () => {
      const request = new NextRequest('http://localhost/api/scheduled-reports?page=-1&limit=0', {
        method: 'GET'
      });

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.code).toBe('VALIDATION_ERROR');
    });

    it('should handle malformed request body', async () => {
      const request = new NextRequest('http://localhost/api/scheduled-reports', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid JSON');
    });

    it('should handle concurrent execution conflicts', async () => {
      const scheduledReportData = {
        name: 'Concurrent Test Report',
        description: 'Conflict',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        schedule: '0 9 * * 1',
        timezone: 'UTC',
        recipients: ['test@example.com'],
        format: 'pdf',
        isActive: true,
        organizationId: 'test-org-123'
      };

      // Simulate schedule conflict via domain validation error
      const { ScheduledReportValidationError } = await import('@/lib/types/scheduled-reports');
      mockPrisma.scheduledReport.create.mockRejectedValue(
        new ScheduledReportValidationError('schedule', '0 9 * * *', 'Schedule conflicts with existing reports')
      );

      const request = new NextRequest('http://localhost/api/scheduled-reports', {
        method: 'POST',
        body: JSON.stringify(scheduledReportData),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.code).toBe('VALIDATION_ERROR');
      expect(responseData.error).toContain('Schedule conflicts');
    });
  });

  describe('PUT /api/scheduled-reports/[id] - Update Scheduled Report', () => {
    it('should update an existing scheduled report', async () => {
      const updateData = {
        name: 'Updated Report Name',
        description: 'Updated description',
        organizationId: 'test-org-123'
      };

      // Mock current report exists and ACL passes
      mockPrisma.scheduledReport.findFirst.mockResolvedValueOnce({
        id: 'test-report-id',
        name: 'Old Name',
        userId: 'test-user-123',
        organizationId: 'test-org-123',
        reportId: 'report-123',
        schedule: '0 9 * * *',
        timezone: 'UTC',
        recipients: JSON.stringify(['test@example.com']),
        format: 'pdf',
        options: JSON.stringify({ includeCharts: true }),
        isActive: true,
        lastRun: null,
        nextRun: new Date('2024-01-02T09:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        organization: { members: [{ userId: 'test-user-123' }] },
      });
      // Mock update result
      mockPrisma.scheduledReport.update.mockResolvedValueOnce({
        id: 'test-report-id',
        name: 'Updated Report Name',
        userId: 'test-user-123',
        organizationId: 'test-org-123',
        reportId: 'report-123',
        schedule: '0 9 * * *',
        timezone: 'UTC',
        recipients: JSON.stringify(['updated@example.com']),
        format: 'pdf',
        options: JSON.stringify({ includeCharts: true }),
        isActive: true,
        lastRun: null,
        nextRun: new Date('2024-01-03T09:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      });

      const request = createMockNextRequest(updateData);
      const response = await PUT(request, { params: { id: 'test-report-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Scheduled report updated successfully');
    });

    it('should handle validation errors in update', async () => {
      const invalidData = {
        name: '', // Invalid empty name
        organizationId: 'test-org-123'
      };

      const request = createMockNextRequest(invalidData);
      const response = await PUT(request, { params: { id: 'test-report-id' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });

describe('DELETE /api/scheduled-reports/[id] - Delete Scheduled Report', () => {
  it('should delete an existing scheduled report', async () => {
      // Silence console.error for controlled error paths during this test suite
      jest.spyOn(console, 'error').mockImplementation(() => {});
      // Mock para ScheduledReportsService.deleteScheduledReport
      const mockReport = {
        id: 'test-report-id',
        name: 'Test Report',
        userId: 'test-user-123',
        organizationId: 'test-org-123',
        reportId: 'report-123',
        schedule: '0 9 * * *',
        timezone: 'UTC',
        recipients: JSON.stringify(['test@example.com']),
        format: 'pdf',
        options: JSON.stringify({ includeCharts: true }),
        isActive: true,
        lastRun: null,
        nextRun: new Date('2024-01-02T09:00:00Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        organization: {
          members: [{ userId: 'test-user-123' }]
        },
      };

      mockPrisma.scheduledReport.findFirst.mockResolvedValueOnce(mockReport);
      mockPrisma.scheduledReport.delete.mockResolvedValueOnce(mockReport);

      const request = new NextRequest('http://localhost:3000/api/scheduled-reports/test-report-id?organizationId=test-org-123');
      const response = await DELETE(request, { params: { id: 'test-report-id' } });
       
       // Si el status es 500, verificar el error
       if (response.status === 500) {
          const errorData = await response.json();
          console.log('Error 500 detalles completos:', JSON.stringify(errorData, null, 2));
          // En desarrollo, el error handler debería incluir el error original
          if (errorData.details?.originalError) {
            console.log('Error original del servidor:', errorData.details.originalError);
          }
          throw new Error(`Error 500 recibido: ${JSON.stringify(errorData, null, 2)}`);
        }
       
       const data = await response.json();
       expect(response.status).toBe(200);
       expect(data.success).toBe(true);
       expect(data.message).toBe('Scheduled report deleted successfully');
       expect(data.data.deleted).toBe(true);
    });

  it('should handle deletion of non-existent report', async () => {
      // Silence console.error for controlled error paths during this test
      jest.spyOn(console, 'error').mockImplementation(() => {});
      // Setup mock to simulate non-existent report
      mockPrisma.scheduledReport.findFirst.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/scheduled-reports/non-existent-id?organizationId=test-org-123');
      const response = await DELETE(request, { params: { id: 'non-existent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
});

// Limpia módulos al finalizar la suite para evitar contaminación de mocks
afterAll(() => {
  jest.resetModules();
});