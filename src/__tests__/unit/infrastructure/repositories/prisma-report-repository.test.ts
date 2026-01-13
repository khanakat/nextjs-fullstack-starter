import { PrismaClient } from '@prisma/client';
import { PrismaReportRepository } from '../../../../slices/reporting/infrastructure/repositories/prisma-report-repository';
import { Report } from '../../../../shared/domain/reporting/entities/report';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ReportStatus } from '../../../../shared/domain/reporting/value-objects/report-status';
import { ReportConfig } from '../../../../shared/domain/reporting/value-objects/report-config';
import { ReportLayout } from '../../../../shared/domain/reporting/value-objects/report-layout';
import { ReportStyling } from '../../../../shared/domain/reporting/value-objects/report-styling';

// Mock Prisma Client
const mockPrismaClient = {
  report: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as unknown as PrismaClient;

describe('PrismaReportRepository', () => {
  let repository: PrismaReportRepository;
  let mockReport: Report;
  let mockReportData: any;

  beforeEach(() => {
    repository = new PrismaReportRepository(mockPrismaClient);
    jest.clearAllMocks();

    // Create mock report
    const reportId = UniqueId.generate();
    const createdBy = UniqueId.generate();
    const templateId = UniqueId.generate();

    const layout = ReportLayout.create({
      components: [],
      grid: { columns: 12, rows: 10, gap: 8 }
    });

    const styling = ReportStyling.create({
      theme: 'light',
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      fontFamily: 'Arial',
      fontSize: 14
    });

    const config = ReportConfig.create({
      title: 'Test Report',
      description: 'Test Description',
      templateId: templateId.value,
      filters: {},
      parameters: {},
      layout,
      styling
    });

    mockReport = Report.create({
      title: 'Test Report',
      description: 'Test Description',
      config,
      templateId,
      createdBy,
      organizationId: UniqueId.generate()
    }, reportId);

    mockReportData = {
      id: reportId.value,
      title: 'Test Report',
      description: 'Test Description',
      config: JSON.stringify(config.value),
      status: 'DRAFT',
      templateId: templateId.value,
      createdBy: createdBy.value,
      organizationId: mockReport.organizationId?.value,
      isPublic: false,
      publishedAt: null,
      archivedAt: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      template: {
        id: templateId.value,
        name: 'Test Template',
        description: 'Test Template Description'
      },
      scheduledReports: []
    };
  });

  describe('findById', () => {
    it('should return report when found', async () => {
      mockPrismaClient.report.findUnique = jest.fn().mockResolvedValue(mockReportData);

      const result = await repository.findById(UniqueId.fromString(mockReportData.id));

      expect(result).toBeDefined();
      expect(result?.id.value).toBe(mockReportData.id);
      expect(result?.title).toBe(mockReportData.title);
      expect(mockPrismaClient.report.findUnique).toHaveBeenCalledWith({
        where: { id: mockReportData.id },
        include: {
          template: true,
          scheduledReports: true,
        },
      });
    });

    it('should return null when report not found', async () => {
      mockPrismaClient.report.findUnique = jest.fn().mockResolvedValue(null);

      const result = await repository.findById(UniqueId.generate());

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockPrismaClient.report.findUnique = jest.fn().mockRejectedValue(error);

      await expect(repository.findById(UniqueId.generate())).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByTitle', () => {
    it('should return report when found by title', async () => {
      mockPrismaClient.report.findFirst = jest.fn().mockResolvedValue(mockReportData);

      const result = await repository.findByTitle('Test Report');

      expect(result).toBeDefined();
      expect(result?.title).toBe('Test Report');
      expect(mockPrismaClient.report.findFirst).toHaveBeenCalledWith({
        where: { title: 'Test Report' },
        include: {
          template: true,
          scheduledReports: true,
        },
      });
    });

    it('should return report when found by title and organization', async () => {
      const organizationId = UniqueId.generate().value;
      mockPrismaClient.report.findFirst = jest.fn().mockResolvedValue(mockReportData);

      const result = await repository.findByTitle('Test Report', organizationId);

      expect(result).toBeDefined();
      expect(mockPrismaClient.report.findFirst).toHaveBeenCalledWith({
        where: { 
          title: 'Test Report',
          organizationId 
        },
        include: {
          template: true,
          scheduledReports: true,
        },
      });
    });

    it('should return null when report not found', async () => {
      mockPrismaClient.report.findFirst = jest.fn().mockResolvedValue(null);

      const result = await repository.findByTitle('Non-existent Report');

      expect(result).toBeNull();
    });
  });

  describe('findManyWithPagination', () => {
    it('should return paginated results', async () => {
      const reports = [mockReportData];
      const totalCount = 1;

      mockPrismaClient.report.findMany = jest.fn().mockResolvedValue(reports);
      mockPrismaClient.report.count = jest.fn().mockResolvedValue(totalCount);

      const result = await repository.findManyWithPagination({}, 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(mockPrismaClient.report.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: undefined,
        include: {
          template: true,
          scheduledReports: true,
        },
      });
    });

    it('should handle filters and sorting', async () => {
      const filters = { status: 'PUBLISHED' };
      mockPrismaClient.report.findMany = jest.fn().mockResolvedValue([]);
      mockPrismaClient.report.count = jest.fn().mockResolvedValue(0);

      await repository.findManyWithPagination(filters, 2, 5, 'title', 'asc');

      expect(mockPrismaClient.report.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining(filters),
        skip: 5,
        take: 5,
        orderBy: { title: 'asc' },
        include: {
          template: true,
          scheduledReports: true,
        },
      });
    });

    it('should handle empty results', async () => {
      mockPrismaClient.report.findMany = jest.fn().mockResolvedValue([]);
      mockPrismaClient.report.count = jest.fn().mockResolvedValue(0);

      const result = await repository.findManyWithPagination({}, 1, 10);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('save', () => {
    it('should save new report', async () => {
      mockPrismaClient.report.upsert = jest.fn().mockResolvedValue(mockReportData);

      await repository.save(mockReport);

      expect(mockPrismaClient.report.upsert).toHaveBeenCalledWith({
        where: { id: mockReport.id.value },
        update: expect.objectContaining({
          title: mockReport.title,
          description: mockReport.description,
          status: mockReport.status.value,
        }),
        create: expect.objectContaining({
          id: mockReport.id.value,
          title: mockReport.title,
          description: mockReport.description,
        }),
      });
    });

    it('should update existing report', async () => {
      // Simulate updating an existing report
      mockReport.updateTitle('Updated Title');
      mockPrismaClient.report.upsert = jest.fn().mockResolvedValue(mockReportData);

      await repository.save(mockReport);

      expect(mockPrismaClient.report.upsert).toHaveBeenCalledWith({
        where: { id: mockReport.id.value },
        update: expect.objectContaining({
          title: 'Updated Title',
        }),
        create: expect.any(Object),
      });
    });

    it('should handle save errors', async () => {
      const error = new Error('Save failed');
      mockPrismaClient.report.upsert = jest.fn().mockRejectedValue(error);

      await expect(repository.save(mockReport)).rejects.toThrow('Save failed');
    });
  });

  describe('delete', () => {
    it('should soft delete report', async () => {
      mockPrismaClient.report.update = jest.fn().mockResolvedValue(mockReportData);

      await repository.delete(mockReport.id);

      expect(mockPrismaClient.report.update).toHaveBeenCalledWith({
        where: { id: mockReport.id.value },
        data: {
          deletedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should handle delete errors', async () => {
      const error = new Error('Delete failed');
      mockPrismaClient.report.update = jest.fn().mockRejectedValue(error);

      await expect(repository.delete(mockReport.id)).rejects.toThrow('Delete failed');
    });
  });

  describe('permanentlyDelete', () => {
    it('should permanently delete report', async () => {
      mockPrismaClient.report.delete = jest.fn().mockResolvedValue(mockReportData);

      await repository.permanentlyDelete(mockReport.id);

      expect(mockPrismaClient.report.delete).toHaveBeenCalledWith({
        where: { id: mockReport.id.value },
      });
    });

    it('should handle permanent delete errors', async () => {
      const error = new Error('Permanent delete failed');
      mockPrismaClient.report.delete = jest.fn().mockRejectedValue(error);

      await expect(repository.permanentlyDelete(mockReport.id)).rejects.toThrow('Permanent delete failed');
    });
  });

  describe('findByStatus', () => {
    it('should return reports by status', async () => {
      const reports = [mockReportData];
      const totalCount = 1;

      mockPrismaClient.report.findMany = jest.fn().mockResolvedValue(reports);
      mockPrismaClient.report.count = jest.fn().mockResolvedValue(totalCount);

      const status = ReportStatus.draft();
      const result = await repository.findByStatus(status);

      expect(result.reports).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
      expect(mockPrismaClient.report.findMany).toHaveBeenCalledWith({
        where: {
          status: status.value,
          deletedAt: null,
        },
        include: {
          template: true,
          scheduledReports: true,
        },
        take: 20,
        skip: 0,
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('should handle pagination options', async () => {
      mockPrismaClient.report.findMany = jest.fn().mockResolvedValue([]);
      mockPrismaClient.report.count = jest.fn().mockResolvedValue(0);

      const status = ReportStatus.published();
      const options = { limit: 5, offset: 10, sortBy: 'title', sortOrder: 'asc' as const };

      await repository.findByStatus(status, options);

      expect(mockPrismaClient.report.findMany).toHaveBeenCalledWith({
        where: {
          status: status.value,
          deletedAt: null,
        },
        include: {
          template: true,
          scheduledReports: true,
        },
        take: 5,
        skip: 10,
        orderBy: { title: 'asc' },
      });
    });
  });

  describe('findByCreator', () => {
    it('should return reports by creator', async () => {
      const reports = [mockReportData];
      const totalCount = 1;

      mockPrismaClient.report.findMany = jest.fn().mockResolvedValue(reports);
      mockPrismaClient.report.count = jest.fn().mockResolvedValue(totalCount);

      const createdBy = UniqueId.generate();
      const result = await repository.findByCreator(createdBy);

      expect(result.reports).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrismaClient.report.findMany).toHaveBeenCalledWith({
        where: {
          createdBy: createdBy.value,
          deletedAt: null,
        },
        include: {
          template: true,
          scheduledReports: true,
        },
        take: 20,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findPublicReports', () => {
    it('should return public reports', async () => {
      const publicReportData = { ...mockReportData, isPublic: true, status: 'published' };
      const reports = [publicReportData];
      const totalCount = 1;

      mockPrismaClient.report.findMany = jest.fn().mockResolvedValue(reports);
      mockPrismaClient.report.count = jest.fn().mockResolvedValue(totalCount);

      const result = await repository.findPublicReports();

      expect(result.reports).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrismaClient.report.findMany).toHaveBeenCalledWith({
        where: {
          isPublic: true,
          status: 'published',
          deletedAt: null,
        },
        include: {
          template: true,
          scheduledReports: true,
        },
        take: 20,
        skip: 0,
        orderBy: { publishedAt: 'desc' },
      });
    });
  });

  describe('Domain mapping', () => {
    it('should correctly map persistence data to domain entity', async () => {
      mockPrismaClient.report.findUnique = jest.fn().mockResolvedValue(mockReportData);

      const result = await repository.findById(UniqueId.fromString(mockReportData.id));

      expect(result).toBeInstanceOf(Report);
      expect(result?.id.value).toBe(mockReportData.id);
      expect(result?.title).toBe(mockReportData.title);
      expect(result?.description).toBe(mockReportData.description);
      expect(result?.status.value).toBe(mockReportData.status);
    });

    it('should handle malformed persistence data gracefully', async () => {
      const malformedData = {
        ...mockReportData,
        config: 'invalid-json',
      };

      mockPrismaClient.report.findUnique = jest.fn().mockResolvedValue(malformedData);

      await expect(repository.findById(UniqueId.fromString(mockReportData.id)))
        .rejects.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.name = 'TimeoutError';
      mockPrismaClient.report.findUnique = jest.fn().mockRejectedValue(timeoutError);

      await expect(repository.findById(UniqueId.generate())).rejects.toThrow('Connection timeout');
    });

    it('should handle constraint violations', async () => {
      const constraintError = new Error('Unique constraint violation');
      constraintError.name = 'PrismaClientKnownRequestError';
      mockPrismaClient.report.upsert = jest.fn().mockRejectedValue(constraintError);

      await expect(repository.save(mockReport)).rejects.toThrow('Unique constraint violation');
    });
  });
});