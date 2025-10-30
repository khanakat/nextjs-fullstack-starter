/**
 * Tests for Scheduled Reports API Endpoints
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/scheduled-reports/route';
import { ScheduledReportsService } from '@/lib/services/scheduled-reports-service';
import { auth } from '@clerk/nextjs/server';

// Mock dependencies
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/services/scheduled-reports-service');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockScheduledReportsService = ScheduledReportsService as jest.Mocked<typeof ScheduledReportsService>;

// Helper to create proper auth mock objects
const createAuthMock = (userId: string | null, orgId?: string | null) => {
  if (!userId) {
    // Signed out auth object
    return {
      userId: null,
      orgId: null,
      sessionClaims: null,
      sessionId: null,
      actor: null,
      orgRole: null,
      orgSlug: null,
      orgPermissions: null,
      has: jest.fn(),
      protect: jest.fn(),
      redirectToSignIn: jest.fn(),
      __experimental_factorVerificationAge: null,
      getToken: jest.fn(),
      debug: jest.fn(),
    } as any;
  }

  // Signed in auth object
  return {
    userId,
    orgId: orgId || undefined,
    sessionClaims: {
      __raw: 'mock-raw-token',
      iss: 'https://clerk.dev',
      sub: userId,
      sid: 'mock-session-id',
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 3600,
      nbf: Date.now() / 1000,
    },
    sessionId: 'session_123',
    actor: null,
    orgRole: orgId ? 'org:member' : undefined,
    orgSlug: null,
    orgPermissions: [],
    has: jest.fn(),
    protect: jest.fn(),
    redirectToSignIn: jest.fn(),
    __experimental_factorVerificationAge: null,
    getToken: jest.fn(),
    debug: jest.fn(),
  } as any;
};

describe('/api/scheduled-reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/scheduled-reports', () => {
    const mockUser = createAuthMock('user_123', 'org_456');

    beforeEach(() => {
      mockAuth.mockReturnValue(mockUser);
    });

    test('should return scheduled reports successfully', async () => {
      const mockReports = {
        scheduledReports: [
          {
            id: 'report_1',
            name: 'Test Report',
            reportId: 'base_report_1',
            userId: 'user_123',
            organizationId: 'org_456',
            schedule: '0 9 * * 1',
            timezone: 'UTC',
            recipients: ['test@example.com'],
            format: 'pdf' as const,
            options: {
              includeCharts: true,
              includeData: true,
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockScheduledReportsService.getScheduledReports.mockResolvedValue(mockReports);

      const request = new NextRequest('http://localhost:3000/api/scheduled-reports');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockReports);
      expect(mockScheduledReportsService.getScheduledReports).toHaveBeenCalledWith(
        'user_123',
        'org_456',
        expect.any(Object)
      );
    });

    test('should return 401 when user is not authenticated', async () => {
      mockAuth.mockReturnValue(createAuthMock(null));

      const request = new NextRequest('http://localhost:3000/api/scheduled-reports');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('should return 400 when organizationId is missing', async () => {
      mockAuth.mockReturnValue(createAuthMock('user_123', null));

      const request = new NextRequest('http://localhost:3000/api/scheduled-reports');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Organization ID is required');
    });

    test('should handle service errors', async () => {
      const serviceError = new Error('Database connection failed');
      mockScheduledReportsService.getScheduledReports.mockRejectedValue(serviceError);

      const request = new NextRequest('http://localhost:3000/api/scheduled-reports');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    test('should handle query parameters correctly', async () => {
      const mockReports = {
        scheduledReports: [],
        total: 0,
        page: 1,
        limit: 5,
        totalPages: 0,
      };

      mockScheduledReportsService.getScheduledReports.mockResolvedValue(mockReports);

      const url = new URL('http://localhost:3000/api/scheduled-reports');
      url.searchParams.set('limit', '5');
      url.searchParams.set('isActive', 'true');
      url.searchParams.set('format', 'pdf');

      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockScheduledReportsService.getScheduledReports).toHaveBeenCalledWith(
        'user_123',
        'org_456',
        expect.objectContaining({
          limit: 5,
          isActive: true,
          format: 'pdf',
        })
      );
    });
  });

  describe('POST /api/scheduled-reports', () => {
    const mockUser = createAuthMock('user_123', 'org_456');

    beforeEach(() => {
      mockAuth.mockReturnValue(mockUser);
    });

    const validCreateRequest = {
      name: 'Test Scheduled Report',
      description: 'A test scheduled report',
      reportId: '123e4567-e89b-12d3-a456-426614174000',
      schedule: '0 9 * * 1',
      timezone: 'UTC',
      recipients: ['test@example.com'],
      format: 'pdf' as const,
      options: {
        includeCharts: true,
        includeData: true,
      },
    };

    test('should create scheduled report successfully', async () => {
      const mockCreatedReport = {
        id: 'new_report_1',
        ...validCreateRequest,
        userId: 'user_123',
        organizationId: 'org_456',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockScheduledReportsService.createScheduledReport.mockResolvedValue(mockCreatedReport);

      const request = new NextRequest('http://localhost:3000/api/scheduled-reports', {
        method: 'POST',
        body: JSON.stringify(validCreateRequest),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCreatedReport);
      expect(mockScheduledReportsService.createScheduledReport).toHaveBeenCalledWith(
        'user_123',
        'org_456',
        validCreateRequest
      );
    });

    test('should return 401 when user is not authenticated', async () => {
      mockAuth.mockReturnValue(createAuthMock(null));

      const request = new NextRequest('http://localhost:3000/api/scheduled-reports', {
        method: 'POST',
        body: JSON.stringify(validCreateRequest),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    test('should return 400 for invalid request body', async () => {
      const invalidRequest = {
        name: '', // Invalid: empty name
        reportId: 'invalid-uuid', // Invalid: not a UUID
        schedule: 'invalid-cron', // Invalid: not a valid cron expression
        recipients: [], // Invalid: empty recipients
        format: 'invalid-format', // Invalid: unsupported format
      };

      const request = new NextRequest('http://localhost:3000/api/scheduled-reports', {
        method: 'POST',
        body: JSON.stringify(invalidRequest),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details.validationErrors).toBeDefined();
      expect(Array.isArray(data.details.validationErrors)).toBe(true);
    });

    test('should return 400 for missing required fields', async () => {
      const incompleteRequest = {
        name: 'Test Report',
        // Missing required fields: reportId, schedule, recipients, format
      };

      const request = new NextRequest('http://localhost:3000/api/scheduled-reports', {
        method: 'POST',
        body: JSON.stringify(incompleteRequest),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    test('should handle service validation errors', async () => {
      const validationError = new Error('Invalid cron expression');
      validationError.name = 'ScheduledReportValidationError';
      
      mockScheduledReportsService.createScheduledReport.mockRejectedValue(validationError);

      const request = new NextRequest('http://localhost:3000/api/scheduled-reports', {
        method: 'POST',
        body: JSON.stringify(validCreateRequest),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    test('should handle service errors', async () => {
      const serviceError = new Error('Database connection failed');
      mockScheduledReportsService.createScheduledReport.mockRejectedValue(serviceError);

      const request = new NextRequest('http://localhost:3000/api/scheduled-reports', {
        method: 'POST',
        body: JSON.stringify(validCreateRequest),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    test('should validate email recipients', async () => {
      const requestWithInvalidEmails = {
        ...validCreateRequest,
        recipients: ['invalid-email', 'test@example.com', 'another-invalid'],
      };

      const request = new NextRequest('http://localhost:3000/api/scheduled-reports', {
        method: 'POST',
        body: JSON.stringify(requestWithInvalidEmails),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    test('should validate cron expression format', async () => {
      const requestWithInvalidCron = {
        ...validCreateRequest,
        schedule: '* * * * * *', // Invalid: 6 fields instead of 5
      };

      const request = new NextRequest('http://localhost:3000/api/scheduled-reports', {
        method: 'POST',
        body: JSON.stringify(requestWithInvalidCron),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });
});