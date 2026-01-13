import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/reports/route';
import { GET as GetById, PUT as UpdateById, DELETE as DeleteById } from '@/app/api/reports/[id]/route';
import { prisma } from '@/lib/prisma';
import { ReportStatus } from '@/src/shared/domain/reporting/value-objects/report-status';
import { ReportConfiguration } from '@/src/shared/domain/reporting/value-objects/report-configuration';

// Mock authentication
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => ({
    userId: 'test-user-id',
    orgId: 'test-org-id'
  }))
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    report: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    $transaction: jest.fn()
  }
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Report API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/reports - Create Report Flow', () => {
    it('should create a report successfully with valid data', async () => {
      const reportData = {
        title: 'Test Report',
        description: 'A test report',
        config: {
          title: 'Test Report',
          description: 'A test report',
          templateId: 'template-1',
          filters: { status: 'active' },
          parameters: { dateRange: '30d' },
          layout: {
            components: [{ type: 'chart', id: 'chart-1' }],
            grid: { columns: 12, rows: 8, gap: 16 }
          },
          styling: {
            theme: 'light' as const,
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            fontFamily: 'Arial',
            fontSize: 14
          }
        },
        isPublic: false
      };

      const createdReport = {
        id: 'report-1',
        title: reportData.title,
        description: reportData.description,
        config: reportData.config,
        status: ReportStatus.DRAFT,
        isPublic: reportData.isPublic,
        createdBy: 'test-user-id',
        organizationId: 'test-org-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.report.create.mockResolvedValue(createdReport);

      const request = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        body: JSON.stringify(reportData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe('report-1');
      expect(responseData.data.title).toBe(reportData.title);
      expect(mockPrisma.report.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: reportData.title,
          description: reportData.description,
          config: reportData.config,
          createdBy: 'test-user-id',
          organizationId: 'test-org-id'
        })
      });
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        title: '', // Empty title should fail validation
        config: {}
      };

      const request = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('validation');
    });

    it('should handle database errors gracefully', async () => {
      const reportData = {
        title: 'Test Report',
        description: 'A test report',
        config: {
          title: 'Test Report',
          filters: {},
          parameters: {},
          layout: {
            components: [],
            grid: { columns: 12, rows: 8, gap: 16 }
          },
          styling: {
            theme: 'light' as const,
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            fontFamily: 'Arial',
            fontSize: 14
          }
        }
      };

      mockPrisma.report.create.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        body: JSON.stringify(reportData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Internal server error');
    });
  });

  describe('GET /api/reports - List Reports Flow', () => {
    it('should return paginated reports with filters', async () => {
      const mockReports = [
        {
          id: 'report-1',
          title: 'Report 1',
          description: 'First report',
          status: ReportStatus.PUBLISHED,
          isPublic: true,
          createdBy: 'test-user-id',
          organizationId: 'test-org-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          config: {}
        },
        {
          id: 'report-2',
          title: 'Report 2',
          description: 'Second report',
          status: ReportStatus.DRAFT,
          isPublic: false,
          createdBy: 'test-user-id',
          organizationId: 'test-org-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          config: {}
        }
      ];

      mockPrisma.report.findMany.mockResolvedValue(mockReports);
      mockPrisma.report.count.mockResolvedValue(2);

      const request = new NextRequest('http://localhost:3000/api/reports?page=1&limit=10&status=published');

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.reports).toHaveLength(2);
      expect(responseData.data.pagination.total).toBe(2);
      expect(responseData.data.pagination.page).toBe(1);
    });

    it('should handle empty results', async () => {
      mockPrisma.report.findMany.mockResolvedValue([]);
      mockPrisma.report.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/reports');

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.reports).toHaveLength(0);
      expect(responseData.data.pagination.total).toBe(0);
    });
  });

  describe('GET /api/reports/[id] - Get Report by ID Flow', () => {
    it('should return report by ID successfully', async () => {
      const mockReport = {
        id: 'report-1',
        title: 'Test Report',
        description: 'A test report',
        status: ReportStatus.PUBLISHED,
        isPublic: true,
        createdBy: 'test-user-id',
        organizationId: 'test-org-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {
          title: 'Test Report',
          filters: {},
          parameters: {},
          layout: {
            components: [],
            grid: { columns: 12, rows: 8, gap: 16 }
          },
          styling: {
            theme: 'light' as const,
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            fontFamily: 'Arial',
            fontSize: 14
          }
        }
      };

      mockPrisma.report.findUnique.mockResolvedValue(mockReport);

      const request = new NextRequest('http://localhost:3000/api/reports/report-1');

      const response = await GetById(request, { params: { id: 'report-1' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe('report-1');
      expect(responseData.data.title).toBe('Test Report');
    });

    it('should return 404 for non-existent report', async () => {
      mockPrisma.report.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/reports/non-existent');

      const response = await GetById(request, { params: { id: 'non-existent' } });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('not found');
    });
  });

  describe('PUT /api/reports/[id] - Update Report Flow', () => {
    it('should update report successfully', async () => {
      const existingReport = {
        id: 'report-1',
        title: 'Original Title',
        description: 'Original description',
        status: ReportStatus.DRAFT,
        isPublic: false,
        createdBy: 'test-user-id',
        organizationId: 'test-org-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {}
      };

      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        isPublic: true
      };

      const updatedReport = {
        ...existingReport,
        ...updateData,
        updatedAt: new Date()
      };

      mockPrisma.report.findUnique.mockResolvedValue(existingReport);
      mockPrisma.report.update.mockResolvedValue(updatedReport);

      const request = new NextRequest('http://localhost:3000/api/reports/report-1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await UpdateById(request, { params: { id: 'report-1' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.title).toBe('Updated Title');
      expect(responseData.data.isPublic).toBe(true);
    });

    it('should prevent unauthorized updates', async () => {
      const existingReport = {
        id: 'report-1',
        title: 'Original Title',
        description: 'Original description',
        status: ReportStatus.DRAFT,
        isPublic: false,
        createdBy: 'different-user-id', // Different user
        organizationId: 'test-org-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {}
      };

      mockPrisma.report.findUnique.mockResolvedValue(existingReport);

      const updateData = {
        title: 'Updated Title'
      };

      const request = new NextRequest('http://localhost:3000/api/reports/report-1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await UpdateById(request, { params: { id: 'report-1' } });
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('permission');
    });
  });

  describe('DELETE /api/reports/[id] - Delete Report Flow', () => {
    it('should delete report successfully', async () => {
      const existingReport = {
        id: 'report-1',
        title: 'Test Report',
        description: 'A test report',
        status: ReportStatus.DRAFT,
        isPublic: false,
        createdBy: 'test-user-id',
        organizationId: 'test-org-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {}
      };

      mockPrisma.report.findUnique.mockResolvedValue(existingReport);
      mockPrisma.report.delete.mockResolvedValue(existingReport);

      const request = new NextRequest('http://localhost:3000/api/reports/report-1', {
        method: 'DELETE'
      });

      const response = await DeleteById(request, { params: { id: 'report-1' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockPrisma.report.delete).toHaveBeenCalledWith({
        where: { id: 'report-1' }
      });
    });

    it('should prevent deletion of published reports', async () => {
      const existingReport = {
        id: 'report-1',
        title: 'Test Report',
        description: 'A test report',
        status: ReportStatus.PUBLISHED, // Published report
        isPublic: true,
        createdBy: 'test-user-id',
        organizationId: 'test-org-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        config: {}
      };

      mockPrisma.report.findUnique.mockResolvedValue(existingReport);

      const request = new NextRequest('http://localhost:3000/api/reports/report-1', {
        method: 'DELETE'
      });

      const response = await DeleteById(request, { params: { id: 'report-1' } });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('published');
    });
  });

  describe('Complete Report Lifecycle Flow', () => {
    it('should handle complete CRUD lifecycle', async () => {
      // 1. Create report
      const createData = {
        title: 'Lifecycle Test Report',
        description: 'Testing complete lifecycle',
        config: {
          title: 'Lifecycle Test Report',
          filters: {},
          parameters: {},
          layout: {
            components: [],
            grid: { columns: 12, rows: 8, gap: 16 }
          },
          styling: {
            theme: 'light' as const,
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            fontFamily: 'Arial',
            fontSize: 14
          }
        }
      };

      const createdReport = {
        id: 'lifecycle-report',
        ...createData,
        status: ReportStatus.DRAFT,
        isPublic: false,
        createdBy: 'test-user-id',
        organizationId: 'test-org-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.report.create.mockResolvedValue(createdReport);

      const createRequest = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        body: JSON.stringify(createData),
        headers: { 'Content-Type': 'application/json' }
      });

      const createResponse = await POST(createRequest);
      expect(createResponse.status).toBe(201);

      // 2. Read report
      mockPrisma.report.findUnique.mockResolvedValue(createdReport);

      const readRequest = new NextRequest('http://localhost:3000/api/reports/lifecycle-report');
      const readResponse = await GetById(readRequest, { params: { id: 'lifecycle-report' } });
      expect(readResponse.status).toBe(200);

      // 3. Update report
      const updateData = {
        title: 'Updated Lifecycle Report',
        status: ReportStatus.PUBLISHED
      };

      const updatedReport = {
        ...createdReport,
        ...updateData,
        updatedAt: new Date()
      };

      mockPrisma.report.update.mockResolvedValue(updatedReport);

      const updateRequest = new NextRequest('http://localhost:3000/api/reports/lifecycle-report', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });

      const updateResponse = await UpdateById(updateRequest, { params: { id: 'lifecycle-report' } });
      expect(updateResponse.status).toBe(200);

      // 4. List reports (should include updated report)
      mockPrisma.report.findMany.mockResolvedValue([updatedReport]);
      mockPrisma.report.count.mockResolvedValue(1);

      const listRequest = new NextRequest('http://localhost:3000/api/reports');
      const listResponse = await GET(listRequest);
      expect(listResponse.status).toBe(200);

      // 5. Delete would fail for published report
      const deleteRequest = new NextRequest('http://localhost:3000/api/reports/lifecycle-report', {
        method: 'DELETE'
      });

      const deleteResponse = await DeleteById(deleteRequest, { params: { id: 'lifecycle-report' } });
      expect(deleteResponse.status).toBe(400); // Should fail for published report
    });
  });
});