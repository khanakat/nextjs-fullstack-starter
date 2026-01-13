import { ReportRepository } from 'src/shared/infrastructure/repositories/report-repository';
import { ReportFactory } from '../../../factories/report-factory';
import { UserFactory } from '../../../factories/user-factory';
import { ValueObjectFactory } from '../../../factories/value-object-factory';

describe('ReportRepository', () => {
  let repository: ReportRepository;
  let mockPrismaClient: any;
  let mockLogger: any;

  beforeEach(() => {
    mockPrismaClient = {
      report: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    repository = new ReportRepository(mockPrismaClient, mockLogger);
  });

  describe('Save Operations', () => {
    it('should save new report', async () => {
      const report = ReportFactory.create();
      const mockDbReport = {
        id: report.getId().getValue(),
        title: report.getTitle(),
        description: report.getDescription(),
        ownerId: report.getOwnerId(),
        organizationId: report.getOrganizationId(),
        config: report.getConfig(),
        layout: report.getLayout(),
        styling: report.getStyling(),
        createdAt: report.getCreatedAt(),
      };

      mockPrismaClient.report.create.mockResolvedValue(mockDbReport);

      await repository.save(report);

      expect(mockPrismaClient.report.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: report.getId().getValue(),
          title: report.getTitle(),
          description: report.getDescription(),
          ownerId: report.getOwnerId(),
          organizationId: report.getOrganizationId(),
        }),
      });
    });

    it('should update existing report', async () => {
      const report = ReportFactory.create();
      report.updateTitle('Updated Title');

      const mockDbReport = {
        id: report.getId().getValue(),
        title: report.getTitle(),
        updatedAt: new Date(),
      };

      mockPrismaClient.report.findUnique.mockResolvedValue(mockDbReport);
      mockPrismaClient.report.update.mockResolvedValue(mockDbReport);

      await repository.save(report);

      expect(mockPrismaClient.report.update).toHaveBeenCalledWith({
        where: { id: report.getId().getValue() },
        data: expect.objectContaining({
          title: 'Updated Title',
        }),
      });
    });

    it('should handle save failures', async () => {
      const report = ReportFactory.create();
      mockPrismaClient.report.create.mockRejectedValue(new Error('Database error'));

      await expect(repository.save(report)).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save report',
        expect.objectContaining({
          reportId: report.getId().getValue(),
          error: 'Database error',
        })
      );
    });
  });

  describe('Find Operations', () => {
    it('should find report by id', async () => {
      const report = ReportFactory.create();
      const mockDbReport = {
        id: report.getId().getValue(),
        title: report.getTitle(),
        description: report.getDescription(),
        ownerId: report.getOwnerId(),
        organizationId: report.getOrganizationId(),
        config: report.getConfig(),
        layout: report.getLayout(),
        styling: report.getStyling(),
        createdAt: report.getCreatedAt(),
        updatedAt: report.getUpdatedAt(),
        isPublic: report.getIsPublic(),
        tags: report.getTags(),
      };

      mockPrismaClient.report.findUnique.mockResolvedValue(mockDbReport);

      const result = await repository.findById(report.getId());

      expect(result).toBeDefined();
      expect(result?.getId().getValue()).toBe(report.getId().getValue());
      expect(mockPrismaClient.report.findUnique).toHaveBeenCalledWith({
        where: { id: report.getId().getValue() },
      });
    });

    it('should return null when report not found', async () => {
      const reportId = ValueObjectFactory.createUniqueId();
      mockPrismaClient.report.findUnique.mockResolvedValue(null);

      const result = await repository.findById(reportId);

      expect(result).toBeNull();
    });

    it('should find reports by owner id', async () => {
      const user = UserFactory.create();
      const reports = ReportFactory.createMany(3, {
        ownerId: user.getId().getValue(),
      });

      const mockDbReports = reports.map(r => ({
        id: r.getId().getValue(),
        title: r.getTitle(),
        description: r.getDescription(),
        ownerId: r.getOwnerId(),
        organizationId: r.getOrganizationId(),
        createdAt: r.getCreatedAt(),
      }));

      mockPrismaClient.report.findMany.mockResolvedValue(mockDbReports);

      const result = await repository.findByOwnerId(user.getId());

      expect(result).toHaveLength(3);
      expect(mockPrismaClient.report.findMany).toHaveBeenCalledWith({
        where: { ownerId: user.getId().getValue() },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should find reports by organization id', async () => {
      const organizationId = ValueObjectFactory.createUniqueId();
      const reports = ReportFactory.createMany(5, {
        organizationId: organizationId.getValue(),
      });

      const mockDbReports = reports.map(r => ({
        id: r.getId().getValue(),
        title: r.getTitle(),
        organizationId: r.getOrganizationId(),
        createdAt: r.getCreatedAt(),
      }));

      mockPrismaClient.report.findMany.mockResolvedValue(mockDbReports);

      const result = await repository.findByOrganizationId(organizationId);

      expect(result).toHaveLength(5);
      expect(mockPrismaClient.report.findMany).toHaveBeenCalledWith({
        where: { organizationId: organizationId.getValue() },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should find public reports', async () => {
      const publicReports = ReportFactory.createMany(3, { isPublic: true });

      const mockDbReports = publicReports.map(r => ({
        id: r.getId().getValue(),
        title: r.getTitle(),
        isPublic: true,
        createdAt: r.getCreatedAt(),
      }));

      mockPrismaClient.report.findMany.mockResolvedValue(mockDbReports);

      const result = await repository.findPublicReports();

      expect(result).toHaveLength(3);
      expect(mockPrismaClient.report.findMany).toHaveBeenCalledWith({
        where: { isPublic: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('Search and Filtering', () => {
    it('should search reports by title', async () => {
      const searchTerm = 'Sales Report';
      const mockDbReports = [
        {
          id: 'report-1',
          title: 'Monthly Sales Report',
          description: 'Sales data for the month',
        },
        {
          id: 'report-2',
          title: 'Annual Sales Report',
          description: 'Yearly sales summary',
        },
      ];

      mockPrismaClient.report.findMany.mockResolvedValue(mockDbReports);

      const result = await repository.searchByTitle(searchTerm);

      expect(result).toHaveLength(2);
      expect(mockPrismaClient.report.findMany).toHaveBeenCalledWith({
        where: {
          title: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter reports by tags', async () => {
      const tags = ['sales', 'monthly'];
      const mockDbReports = [
        {
          id: 'report-1',
          title: 'Sales Report',
          tags: ['sales', 'monthly', 'revenue'],
        },
      ];

      mockPrismaClient.report.findMany.mockResolvedValue(mockDbReports);

      const result = await repository.findByTags(tags);

      expect(result).toHaveLength(1);
      expect(mockPrismaClient.report.findMany).toHaveBeenCalledWith({
        where: {
          tags: {
            hasEvery: tags,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter reports by date range', async () => {
      const dateRange = ValueObjectFactory.createDateRange();
      const mockDbReports = [
        {
          id: 'report-1',
          title: 'Recent Report',
          createdAt: new Date(),
        },
      ];

      mockPrismaClient.report.findMany.mockResolvedValue(mockDbReports);

      const result = await repository.findByDateRange(dateRange);

      expect(result).toHaveLength(1);
      expect(mockPrismaClient.report.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: dateRange.getStartDate(),
            lte: dateRange.getEndDate(),
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should find reports with complex filters', async () => {
      const user = UserFactory.create();
      const organizationId = ValueObjectFactory.createUniqueId();
      const tags = ['important'];

      const mockDbReports = [
        {
          id: 'report-1',
          title: 'Important Report',
          ownerId: user.getId().getValue(),
          organizationId: organizationId.getValue(),
          tags: ['important', 'urgent'],
          isPublic: false,
        },
      ];

      mockPrismaClient.report.findMany.mockResolvedValue(mockDbReports);

      const result = await repository.findWithFilters({
        ownerId: user.getId(),
        organizationId,
        tags,
        isPublic: false,
      });

      expect(result).toHaveLength(1);
      expect(mockPrismaClient.report.findMany).toHaveBeenCalledWith({
        where: {
          ownerId: user.getId().getValue(),
          organizationId: organizationId.getValue(),
          tags: { hasEvery: tags },
          isPublic: false,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('Pagination', () => {
    it('should support paginated queries', async () => {
      const user = UserFactory.create();
      const mockDbReports = ReportFactory.createMany(10).map(r => ({
        id: r.getId().getValue(),
        title: r.getTitle(),
        ownerId: user.getId().getValue(),
        createdAt: r.getCreatedAt(),
      }));

      mockPrismaClient.report.findMany.mockResolvedValue(mockDbReports.slice(0, 5));
      mockPrismaClient.report.count.mockResolvedValue(10);

      const result = await repository.findByOwnerIdPaginated(
        user.getId(),
        { page: 1, limit: 5 }
      );

      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(2);

      expect(mockPrismaClient.report.findMany).toHaveBeenCalledWith({
        where: { ownerId: user.getId().getValue() },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 5,
      });
    });

    it('should handle empty paginated results', async () => {
      const user = UserFactory.create();
      mockPrismaClient.report.findMany.mockResolvedValue([]);
      mockPrismaClient.report.count.mockResolvedValue(0);

      const result = await repository.findByOwnerIdPaginated(
        user.getId(),
        { page: 1, limit: 10 }
      );

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('Delete Operations', () => {
    it('should delete report by id', async () => {
      const report = ReportFactory.create();
      mockPrismaClient.report.delete.mockResolvedValue({
        id: report.getId().getValue(),
      });

      await repository.delete(report.getId());

      expect(mockPrismaClient.report.delete).toHaveBeenCalledWith({
        where: { id: report.getId().getValue() },
      });
    });

    it('should handle delete failures', async () => {
      const reportId = ValueObjectFactory.createUniqueId();
      mockPrismaClient.report.delete.mockRejectedValue(new Error('Not found'));

      await expect(repository.delete(reportId)).rejects.toThrow('Not found');
    });

    it('should delete reports by owner', async () => {
      const user = UserFactory.create();
      mockPrismaClient.report.delete.mockResolvedValue({ count: 3 });

      await repository.deleteByOwnerId(user.getId());

      expect(mockPrismaClient.report.delete).toHaveBeenCalledWith({
        where: { ownerId: user.getId().getValue() },
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should update multiple reports', async () => {
      const reportIds = ValueObjectFactory.createUniqueIds(3);
      const updateData = { isPublic: true };

      mockPrismaClient.report.update.mockResolvedValue({ count: 3 });

      await repository.updateMultiple(reportIds, updateData);

      expect(mockPrismaClient.report.update).toHaveBeenCalledWith({
        where: {
          id: { in: reportIds.map(id => id.getValue()) },
        },
        data: updateData,
      });
    });

    it('should clone report', async () => {
      const originalReport = ReportFactory.create();
      const user = UserFactory.create();

      const clonedReportData = {
        id: expect.any(String),
        title: `Copy of ${originalReport.getTitle()}`,
        description: originalReport.getDescription(),
        ownerId: user.getId().getValue(),
        config: originalReport.getConfig(),
        layout: originalReport.getLayout(),
        styling: originalReport.getStyling(),
        isPublic: false,
      };

      mockPrismaClient.report.create.mockResolvedValue(clonedReportData);

      const result = await repository.cloneReport(originalReport.getId(), user.getId());

      expect(result).toBeDefined();
      expect(mockPrismaClient.report.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: `Copy of ${originalReport.getTitle()}`,
          ownerId: user.getId().getValue(),
          isPublic: false,
        }),
      });
    });
  });

  describe('Statistics and Analytics', () => {
    it('should get report count by owner', async () => {
      const user = UserFactory.create();
      mockPrismaClient.report.count.mockResolvedValue(15);

      const count = await repository.getCountByOwnerId(user.getId());

      expect(count).toBe(15);
      expect(mockPrismaClient.report.count).toHaveBeenCalledWith({
        where: { ownerId: user.getId().getValue() },
      });
    });

    it('should get report count by organization', async () => {
      const organizationId = ValueObjectFactory.createUniqueId();
      mockPrismaClient.report.count.mockResolvedValue(25);

      const count = await repository.getCountByOrganizationId(organizationId);

      expect(count).toBe(25);
      expect(mockPrismaClient.report.count).toHaveBeenCalledWith({
        where: { organizationId: organizationId.getValue() },
      });
    });

    it('should get most popular reports', async () => {
      const mockDbReports = [
        {
          id: 'report-1',
          title: 'Popular Report 1',
          viewCount: 100,
        },
        {
          id: 'report-2',
          title: 'Popular Report 2',
          viewCount: 85,
        },
      ];

      mockPrismaClient.report.findMany.mockResolvedValue(mockDbReports);

      const result = await repository.getMostPopular(10);

      expect(result).toHaveLength(2);
      expect(mockPrismaClient.report.findMany).toHaveBeenCalledWith({
        orderBy: { viewCount: 'desc' },
        take: 10,
      });
    });
  });

  describe('Transaction Support', () => {
    it('should support transactional operations', async () => {
      const reports = ReportFactory.createMany(3);
      
      mockPrismaClient.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrismaClient);
      });

      await repository.saveMultiple(reports);

      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
    });

    it('should rollback on transaction failure', async () => {
      const reports = ReportFactory.createMany(3);
      
      mockPrismaClient.$transaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(repository.saveMultiple(reports)).rejects.toThrow('Transaction failed');
    });
  });

  describe('Performance', () => {
    it('should handle large result sets efficiently', async () => {
      const user = UserFactory.create();
      const largeResultSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `report-${i}`,
        title: `Report ${i}`,
        ownerId: user.getId().getValue(),
      }));

      mockPrismaClient.report.findMany.mockResolvedValue(largeResultSet);

      const startTime = Date.now();
      const result = await repository.findByOwnerId(user.getId());
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should use database indexes effectively', async () => {
      const user = UserFactory.create();
      
      await repository.findByOwnerId(user.getId());

      expect(mockPrismaClient.report.findMany).toHaveBeenCalledWith({
        where: { ownerId: user.getId().getValue() },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const report = ReportFactory.create();
      mockPrismaClient.report.create.mockRejectedValue(
        new Error('Connection timeout')
      );

      await expect(repository.save(report)).rejects.toThrow('Connection timeout');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle constraint violations', async () => {
      const report = ReportFactory.create();
      mockPrismaClient.report.create.mockRejectedValue(
        new Error('Unique constraint violation')
      );

      await expect(repository.save(report)).rejects.toThrow('Unique constraint violation');
    });

    it('should handle invalid JSON data', async () => {
      const report = ReportFactory.create();
      mockPrismaClient.report.create.mockRejectedValue(
        new Error('Invalid JSON format')
      );

      await expect(repository.save(report)).rejects.toThrow('Invalid JSON format');
    });
  });
});