import { PrismaScheduledReportRepository } from '../../../../slices/reporting/infrastructure/repositories/prisma-scheduled-report-repository';
import { ScheduledReport } from '../../../../shared/domain/reporting/entities/scheduled-report';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ScheduleFrequency } from '../../../../shared/domain/reporting/entities/scheduled-report';
import { DeliveryConfig } from '../../../../shared/domain/reporting/entities/scheduled-report';
import { PaginatedResult } from '../../../../shared/application/base/paginated-result';

// Helper function to generate CUID-like IDs for testing
const generateCuid = () => {
  return 'cl' + Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
};

// Mock PrismaClient
const mockPrismaClient = {
  scheduledReport: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
};

describe('PrismaScheduledReportRepository', () => {
  let repository: PrismaScheduledReportRepository;
  let mockScheduledReportData: any;
  let mockScheduledReport: ScheduledReport;

  beforeEach(() => {
    repository = new PrismaScheduledReportRepository(mockPrismaClient as any);
    jest.clearAllMocks();

    // Generate valid CUIDs for testing
    const scheduledReportId = 'cl5xi2613520yj8s810b';
    const reportId = generateCuid();
    const userId = generateCuid();
    const orgId = generateCuid();

    // Mock scheduled report data (Prisma format)
    mockScheduledReportData = {
      id: scheduledReportId,
      name: 'Weekly Sales Report',
      description: 'Weekly sales summary',
      reportId: reportId,
      createdBy: userId,
      organizationId: orgId,
      frequency: 'WEEKLY',
      deliveryConfig: JSON.stringify({
        method: 'EMAIL',
        recipients: ['user@example.com'],
        format: 'PDF',
        includeCharts: true
      }),
      isActive: true,
      lastExecution: new Date('2024-01-08T09:00:00Z'),
      nextExecution: new Date('2024-01-15T09:00:00Z'),
      executionCount: 5,
      lastExecutionStatus: 'COMPLETED',
      lastExecutionError: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-08T09:05:00Z'),
      report: {
        id: reportId,
        title: 'Sales Report',
      },
    };

    // Create mock domain object
    mockScheduledReport = ScheduledReport.create(
      {
        name: mockScheduledReportData.name,
        description: mockScheduledReportData.description,
        reportId: UniqueId.create(mockScheduledReportData.reportId),
        scheduleConfig: {
          frequency: ScheduleFrequency.WEEKLY,
          dayOfWeek: 1, // Monday
          hour: 9,
          minute: 0,
          timezone: 'UTC'
        },
        deliveryConfig: {
          method: 'EMAIL' as any,
          recipients: ['user@example.com'],
          format: 'PDF',
          includeCharts: true
        },
        status: 'ACTIVE' as any,
        createdBy: UniqueId.create(mockScheduledReportData.createdBy),
        organizationId: UniqueId.create(mockScheduledReportData.organizationId),
      },
      UniqueId.create(mockScheduledReportData.id)
    );
  });

  describe('findById', () => {
    it('should find scheduled report by id', async () => {
      mockPrismaClient.scheduledReport.findUnique.mockResolvedValue(mockScheduledReportData);

      const result = await repository.findById(UniqueId.create('cl5xi2613520yj8s810b'));

      expect(result).toBeDefined();
      expect(result!.id.value).toBe(mockScheduledReportData.id);
      expect(result!.name).toBe('Weekly Sales Report');
      expect(mockPrismaClient.scheduledReport.findUnique).toHaveBeenCalledWith({
        where: { id: mockScheduledReportData.id },
        include: { report: true },
      });
    });

    it('should return null when scheduled report not found', async () => {
      mockPrismaClient.scheduledReport.findUnique.mockResolvedValue(null);

      const result = await repository.findById(UniqueId.create(generateCuid()));

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockPrismaClient.scheduledReport.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(repository.findById(UniqueId.create('cl5xi2613520yj8s810b')))
        .rejects.toThrow('Database error');
    });
  });

  describe('findByName', () => {
    it('should find scheduled report by name', async () => {
      mockPrismaClient.scheduledReport.findFirst.mockResolvedValue(mockScheduledReportData);

      const result = await repository.findByName('Weekly Sales Report');

      expect(result).toBeDefined();
      expect(result!.name).toBe('Weekly Sales Report');
      expect(mockPrismaClient.scheduledReport.findFirst).toHaveBeenCalledWith({
        where: { name: 'Weekly Sales Report' },
        include: { report: true },
      });
    });

    it('should find scheduled report by name with organization filter', async () => {
      mockPrismaClient.scheduledReport.findFirst.mockResolvedValue(mockScheduledReportData);

      const result = await repository.findByName('Weekly Sales Report', mockScheduledReportData.organizationId);

      expect(result).toBeDefined();
      expect(mockPrismaClient.scheduledReport.findFirst).toHaveBeenCalledWith({
        where: { name: 'Weekly Sales Report', organizationId: mockScheduledReportData.organizationId },
        include: { report: true },
      });
    });

    it('should return null when scheduled report not found by name', async () => {
      mockPrismaClient.scheduledReport.findFirst.mockResolvedValue(null);

      const result = await repository.findByName('Non-existent Report');

      expect(result).toBeNull();
    });
  });

  describe('findManyWithPagination', () => {
    it('should return paginated scheduled reports', async () => {
      const scheduledReports = [mockScheduledReportData];
      mockPrismaClient.scheduledReport.findMany.mockResolvedValue(scheduledReports);
      mockPrismaClient.scheduledReport.count.mockResolvedValue(1);

      const result = await repository.findManyWithPagination({}, 1, 10);

      expect(result).toBeInstanceOf(PaginatedResult);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should apply filters correctly', async () => {
      const filters = { name: 'Sales', isActive: true, organizationId: mockScheduledReportData.organizationId };
      mockPrismaClient.scheduledReport.findMany.mockResolvedValue([]);
      mockPrismaClient.scheduledReport.count.mockResolvedValue(0);

      await repository.findManyWithPagination(filters, 1, 10);

      expect(mockPrismaClient.scheduledReport.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: 'Sales', mode: 'insensitive' },
          isActive: true,
          organizationId: mockScheduledReportData.organizationId,
        },
        skip: 0,
        take: 10,
        orderBy: { nextRun: 'asc' },
        include: { report: true },
      });
    });

    it('should apply sorting correctly', async () => {
      mockPrismaClient.scheduledReport.findMany.mockResolvedValue([]);
      mockPrismaClient.scheduledReport.count.mockResolvedValue(0);

      await repository.findManyWithPagination({}, 1, 10, 'name', 'desc');

      expect(mockPrismaClient.scheduledReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'desc' },
        })
      );
    });

    it('should handle empty results', async () => {
      mockPrismaClient.scheduledReport.findMany.mockResolvedValue([]);
      mockPrismaClient.scheduledReport.count.mockResolvedValue(0);

      const result = await repository.findManyWithPagination({}, 1, 10);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('save', () => {
    it('should save new scheduled report', async () => {
      mockPrismaClient.scheduledReport.upsert.mockResolvedValue(mockScheduledReportData);

      await repository.save(mockScheduledReport);

      expect(mockPrismaClient.scheduledReport.upsert).toHaveBeenCalledWith({
        where: { id: mockScheduledReport.id.value },
        update: expect.objectContaining({
          name: mockScheduledReport.name,
          description: mockScheduledReport.description,
          updatedAt: expect.any(Date),
        }),
        create: expect.objectContaining({
          id: mockScheduledReport.id.value,
          name: mockScheduledReport.name,
          description: mockScheduledReport.description,
          reportId: mockScheduledReport.reportId.value,
          userId: mockScheduledReport.createdBy.value,
        }),
      });
    });

    it('should handle save errors', async () => {
      mockPrismaClient.scheduledReport.upsert.mockRejectedValue(new Error('Save failed'));

      await expect(repository.save(mockScheduledReport))
        .rejects.toThrow('Save failed');
    });
  });

  describe('delete', () => {
    it('should delete scheduled report', async () => {
      mockPrismaClient.scheduledReport.delete.mockResolvedValue(mockScheduledReportData);

      await repository.delete(UniqueId.create(mockScheduledReportData.id));

      expect(mockPrismaClient.scheduledReport.delete).toHaveBeenCalledWith({
        where: { id: mockScheduledReportData.id },
      });
    });

    it('should handle delete errors', async () => {
      mockPrismaClient.scheduledReport.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(repository.delete(UniqueId.create(mockScheduledReportData.id)))
        .rejects.toThrow('Delete failed');
    });
  });

  describe('findByReportId', () => {
    it('should find scheduled reports by report id', async () => {
      mockPrismaClient.scheduledReport.findMany.mockResolvedValue([mockScheduledReportData]);

      const result = await repository.findByReportId(UniqueId.create(mockScheduledReportData.reportId));

      expect(result.scheduledReports).toHaveLength(1);
      expect(result.scheduledReports[0].reportId.value).toBe(mockScheduledReportData.reportId);
      expect(mockPrismaClient.scheduledReport.findMany).toHaveBeenCalledWith({
        where: { reportId: mockScheduledReportData.reportId },
        include: { report: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no scheduled reports found', async () => {
      mockPrismaClient.scheduledReport.findMany.mockResolvedValue([]);

      const result = await repository.findByReportId(UniqueId.create(generateCuid()));

      expect(result.scheduledReports).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('findActiveScheduledReports', () => {
    it('should find active scheduled reports', async () => {
      mockPrismaClient.scheduledReport.findMany.mockResolvedValue([mockScheduledReportData]);

      const result = await repository.findActiveScheduledReports();

      expect(result.scheduledReports).toHaveLength(1);
      expect(result.scheduledReports[0].status).toBe('ACTIVE');
      expect(mockPrismaClient.scheduledReport.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        include: { report: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should find active scheduled reports with organization filter', async () => {
      mockPrismaClient.scheduledReport.findMany.mockResolvedValue([mockScheduledReportData]);

      const result = await repository.findActiveScheduledReports('org-1');

      expect(result.scheduledReports).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrismaClient.scheduledReport.findMany).toHaveBeenCalledWith({
        where: { isActive: true, organizationId: 'org-1' },
        include: { report: true },
        orderBy: { nextExecution: 'asc' },
      });
    });

    it('should return empty array when no active scheduled reports found', async () => {
      mockPrismaClient.scheduledReport.findMany.mockResolvedValue([]);

      const result = await repository.findActiveScheduledReports();

      expect(result.scheduledReports).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('findDueForExecution', () => {
    it('should find scheduled reports due for execution', async () => {
      const currentTime = new Date('2024-01-15T10:00:00Z');
      mockPrismaClient.scheduledReport.findMany.mockResolvedValue([mockScheduledReportData]);

      const result = await repository.findDueForExecution(currentTime);

      expect(result.scheduledReports).toHaveLength(1);
      expect(result.scheduledReports[0].status).toBe('ACTIVE');
      expect(mockPrismaClient.scheduledReport.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          nextRun: { lte: currentTime },
        },
        include: { report: true },
        orderBy: { nextRun: 'asc' },
      });
    });

    it('should return empty array when no reports are due', async () => {
      const currentTime = new Date('2024-01-01T00:00:00Z');
      mockPrismaClient.scheduledReport.findMany.mockResolvedValue([]);

      const result = await repository.findDueForExecution(currentTime);

      expect(result).toHaveLength(0);
    });
  });

  describe('findByFrequency', () => {
    it('should find scheduled reports by frequency', async () => {
      mockPrismaClient.scheduledReport.findMany.mockResolvedValue([mockScheduledReportData]);

      const result = await repository.findByFrequency(ScheduleFrequency.WEEKLY);

      expect(result.scheduledReports).toHaveLength(1);
      expect(result.scheduledReports[0].scheduleConfig.frequency).toBe('WEEKLY');
      expect(mockPrismaClient.scheduledReport.findMany).toHaveBeenCalledWith({
        where: { schedule: { path: ['frequency'], equals: 'WEEKLY' } },
        include: { report: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should find scheduled reports by frequency with organization filter', async () => {
      const frequency = ReportFrequency.create('daily');
      mockPrismaClient.scheduledReport.findMany.mockResolvedValue([]);

      const result = await repository.findByFrequency(frequency, 'org-1');

      expect(result).toHaveLength(0);
      expect(mockPrismaClient.scheduledReport.findMany).toHaveBeenCalledWith({
        where: { frequency: 'daily', isActive: true, organizationId: 'org-1' },
        include: { report: true },
        orderBy: { nextExecution: 'asc' },
      });
    });
  });

  describe('updateExecutionStatus', () => {
    it('should update execution status with success', async () => {
      const nextExecution = new Date('2024-01-22T09:00:00Z');
      mockPrismaClient.scheduledReport.update.mockResolvedValue(mockScheduledReportData);

      await repository.updateExecutionStatus(
        UniqueId.create('scheduled-report-1'),
        'success',
        nextExecution
      );

      expect(mockPrismaClient.scheduledReport.update).toHaveBeenCalledWith({
        where: { id: 'scheduled-report-1' },
        data: {
          lastRun: expect.any(Date),
          executionStatus: 'success',
          nextRun: nextExecution,
        },
      });
    });

    it('should update execution status with failure and error message', async () => {
      const errorMessage = 'Failed to generate report';
      mockPrismaClient.scheduledReport.update.mockResolvedValue(mockScheduledReportData);

      await repository.updateExecutionStatus(
        UniqueId.create('scheduled-report-1'),
        'failed',
        undefined,
        errorMessage
      );

      expect(mockPrismaClient.scheduledReport.update).toHaveBeenCalledWith({
        where: { id: 'scheduled-report-1' },
        data: {
          lastRun: expect.any(Date),
          executionStatus: 'failed',
          lastExecutionError: errorMessage,
        },
      });
    });

    it('should handle update execution status errors', async () => {
      mockPrismaClient.scheduledReport.update.mockRejectedValue(new Error('Update failed'));

      await expect(repository.updateExecutionStatus(
        UniqueId.create('cl5xi2613520yj8s810b'),
        'failed',
        undefined,
        'Update failed'
      )).rejects.toThrow('Update failed');
    });
  });

  describe('getExecutionStatistics', () => {
    it('should return execution statistics for successful report', async () => {
      const statsData = {
        ...mockScheduledReportData,
        lastExecutionStatus: 'success',
        runs: [
          { status: 'completed', completedAt: new Date() },
          { status: 'completed', completedAt: new Date() },
          { status: 'failed', completedAt: new Date() },
        ],
      };
      mockPrismaClient.scheduledReport.findUnique.mockResolvedValue(statsData);

      const result = await repository.getExecutionStatistics(UniqueId.create('cl5xi2613520yj8s810d'));

      expect(result).toEqual({
        executionCount: 3,
        lastExecution: statsData.lastRun,
        lastExecutionStatus: 'completed',
        nextExecution: statsData.nextRun,
        successRate: 0.6666666666666666,
      });
    });

    it('should return execution statistics for failed report', async () => {
      const statsData = {
        ...mockScheduledReportData,
        lastExecutionStatus: 'failed',
        runs: [
          { status: 'failed', completedAt: new Date() },
          { status: 'failed', completedAt: new Date() },
        ],
      };
      mockPrismaClient.scheduledReport.findUnique.mockResolvedValue(statsData);

      const result = await repository.getExecutionStatistics(UniqueId.create('cl5xi2613520yj8s810b'));

      expect(result.successRate).toBe(0);
    });

    it('should return execution statistics for report with mixed results', async () => {
      const statsData = {
        ...mockScheduledReportData,
        lastExecutionStatus: 'completed',
        runs: [
          { status: 'completed', completedAt: new Date() },
          { status: 'completed', completedAt: new Date() },
          { status: 'failed', completedAt: new Date() },
          { status: 'completed', completedAt: new Date() },
        ],
      };
      mockPrismaClient.scheduledReport.findUnique.mockResolvedValue(statsData);

      const result = await repository.getExecutionStatistics(UniqueId.create('cl5xi2613520yj8s810b'));

      expect(result.successRate).toBe(0.75); // 3 successful out of 4 total
    });

    it('should return execution statistics for report with failures', async () => {
      const statsData = {
        ...mockScheduledReportData,
        lastExecutionStatus: 'failed',
        runs: [
          { status: 'failed', completedAt: new Date() },
          { status: 'failed', completedAt: new Date() },
          { status: 'failed', completedAt: new Date() },
        ],
      };
      mockPrismaClient.scheduledReport.findUnique.mockResolvedValue(statsData);

      const result = await repository.getExecutionStatistics(UniqueId.create('cl5xi2613520yj8s810b'));

      expect(result.successRate).toBe(0);
    });

    it('should throw error when scheduled report not found', async () => {
      mockPrismaClient.scheduledReport.findUnique.mockResolvedValue(null);

      await expect(repository.getExecutionStatistics(UniqueId.create('cl5xi2613520yj8s810c')))
        .rejects.toThrow('Scheduled report with ID cl5xi2613520yj8s810c not found');
    });

    it('should handle statistics with null values', async () => {
      const statsData = {
        ...mockScheduledReportData,
        lastRun: null,
        lastExecutionStatus: null,
        nextRun: null,
        runs: [],
      };
      mockPrismaClient.scheduledReport.findUnique.mockResolvedValue(statsData);

      const result = await repository.getExecutionStatistics(UniqueId.create('cl5xi2613520yj8s810b'));

      expect(result.lastExecution).toBeUndefined();
      expect(result.lastExecutionStatus).toBeUndefined();
      expect(result.nextExecution).toBeUndefined();
    });
  });

  describe('Domain mapping', () => {
    it('should correctly map persistence data to domain object', async () => {
      mockPrismaClient.scheduledReport.findUnique.mockResolvedValue(mockScheduledReportData);

      const result = await repository.findById(UniqueId.create('cl5xi2613520yj8s810e'));

      expect(result).toBeDefined();
      expect(result!.id.value).toBe(mockScheduledReportData.id);
      expect(result!.name).toBe(mockScheduledReportData.name);
      expect(result!.description).toBe(mockScheduledReportData.description);
      expect(result!.reportId.value).toBe(mockScheduledReportData.reportId);
      expect(result!.scheduleConfig.frequency).toBe('WEEKLY');
      expect(result!.deliveryConfig).toEqual({
        method: 'EMAIL',
        recipients: ['test@example.com'],
        format: 'PDF',
        includeCharts: true,
      });
      expect(result!.status).toBe('ACTIVE');
      expect(result!.nextExecutionAt).toEqual(mockScheduledReportData.nextRun);
      expect(result!.lastExecutedAt).toEqual(mockScheduledReportData.lastRun);
      expect(result!.executionCount).toBe(0); // Default value from reconstitute
      expect(result!.failureCount).toBe(0); // Default value from reconstitute
      expect(result!.createdBy.value).toBe(mockScheduledReportData.createdBy);
      expect(result!.organizationId).toBe(mockScheduledReportData.organizationId);
      expect(result!.createdAt).toEqual(mockScheduledReportData.createdAt);
      expect(result!.updatedAt).toEqual(mockScheduledReportData.updatedAt);
    });

    it('should handle malformed persistence data gracefully', async () => {
      const malformedData = {
        ...mockScheduledReportData,
        recipients: 'invalid-json',
      };
      mockPrismaClient.scheduledReport.findUnique.mockResolvedValue(malformedData);

      await expect(repository.findById(UniqueId.create('cl5xi2613520yj8s810b')))
        .rejects.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle network timeouts', async () => {
      mockPrismaClient.scheduledReport.findUnique.mockRejectedValue(new Error('Network timeout'));

      await expect(repository.findById(UniqueId.create(mockScheduledReportData.id)))
        .rejects.toThrow('Network timeout');
    });

    it('should handle constraint violations', async () => {
      mockPrismaClient.scheduledReport.upsert.mockRejectedValue(
        new Error('Unique constraint violation')
      );

      await expect(repository.save(mockScheduledReport))
        .rejects.toThrow('Unique constraint violation');
    });

    it('should handle foreign key violations', async () => {
      mockPrismaClient.scheduledReport.upsert.mockRejectedValue(
        new Error('Foreign key constraint violation')
      );

      await expect(repository.save(mockScheduledReport))
        .rejects.toThrow('Foreign key constraint violation');
    });
  });

  describe('Filter and sorting logic', () => {
    it('should build complex where clauses correctly', async () => {
      const complexFilters = {
        name: 'Sales',
        reportId: 'report-1',
        frequency: 'weekly',
        isActive: true,
        createdBy: 'user-1',
        organizationId: 'org-1',
        createdAt: { gte: new Date('2024-01-01') },
        nextExecution: { lte: new Date('2024-01-31') },
      };

      mockPrismaClient.scheduledReport.findMany.mockResolvedValue([]);
      mockPrismaClient.scheduledReport.count.mockResolvedValue(0);

      await repository.findManyWithPagination(complexFilters, 1, 10);

      expect(mockPrismaClient.scheduledReport.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: 'Sales', mode: 'insensitive' },
          reportId: 'report-1',
          frequency: 'weekly',
          isActive: true,
          createdBy: 'user-1',
          organizationId: 'org-1',
          createdAt: { gte: new Date('2024-01-01') },
          nextRun: { lte: new Date('2024-01-31') },
        },
        skip: 0,
        take: 10,
        orderBy: { nextRun: 'asc' },
        include: { report: true },
      });
    });

    it('should handle all supported sort fields', async () => {
      const sortFields = [
        'name', 'frequency', 'nextExecution', 'lastExecution', 'createdAt', 'updatedAt'
      ];

      mockPrismaClient.scheduledReport.findMany.mockResolvedValue([]);
      mockPrismaClient.scheduledReport.count.mockResolvedValue(0);

      for (const field of sortFields) {
        await repository.findManyWithPagination({}, 1, 10, field, 'asc');
        
        let orderByField = field;
        if (field === 'nextExecution') orderByField = 'nextRun';
        if (field === 'lastExecution') orderByField = 'lastRun';
        
        expect(mockPrismaClient.scheduledReport.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: { [orderByField]: 'asc' },
          })
        );
      }
    });

    it('should use default sorting for unsupported fields', async () => {
      mockPrismaClient.scheduledReport.findMany.mockResolvedValue([]);
      mockPrismaClient.scheduledReport.count.mockResolvedValue(0);

      await repository.findManyWithPagination({}, 1, 10, 'unsupported-field', 'desc');

      expect(mockPrismaClient.scheduledReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { nextRun: 'asc' },
        })
      );
    });
  });
});