import { PrismaReportTemplateRepository } from '../../../../slices/reporting/infrastructure/repositories/prisma-report-template-repository';
import { ReportTemplate } from '../../../../shared/domain/reporting/entities/report-template';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { ReportConfig } from '../../../../shared/domain/reporting/value-objects/report-config';
import { ReportLayout } from '../../../../shared/domain/reporting/value-objects/report-layout';
import { ReportStyling } from '../../../../shared/domain/reporting/value-objects/report-styling';
import { PaginatedResult } from '../../../../shared/application/base/paginated-result';

// Mock PrismaClient
const mockPrismaClient = {
  reportTemplate: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
};

describe('PrismaReportTemplateRepository', () => {
  let repository: PrismaReportTemplateRepository;
  let mockTemplateData: any;
  let mockTemplate: ReportTemplate;

  beforeEach(() => {
    repository = new PrismaReportTemplateRepository(mockPrismaClient as any);
    jest.clearAllMocks();

    // Mock template data
    mockTemplateData = {
      id: 'template-1',
      name: 'Sales Report Template',
      description: 'Standard sales report template',
      category: 'sales',
      config: {
        dataSource: 'sales_data',
        filters: ['date_range', 'region'],
        aggregations: ['sum', 'avg'],
        groupBy: ['region', 'product'],
      },
      layout: {
        orientation: 'portrait',
        pageSize: 'A4',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        sections: [
          { type: 'header', height: 100 },
          { type: 'content', height: 600 },
          { type: 'footer', height: 50 },
        ],
      },
      styling: {
        theme: 'light',
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        fontFamily: 'Arial',
        fontSize: 12,
      },
      isActive: true,
      usageCount: 15,
      lastUsedAt: new Date('2024-01-10T10:00:00Z'),
      createdBy: 'user-1',
      organizationId: 'org-1',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-10T10:00:00Z'),
      reports: [],
      _count: { reports: 5 },
    };

    // Create mock domain object
    mockTemplate = ReportTemplate.create(
      {
        name: mockTemplateData.name,
        description: mockTemplateData.description,
        category: mockTemplateData.category,
        config: ReportConfig.create(mockTemplateData.config),
        layout: ReportLayout.create(mockTemplateData.layout),
        styling: ReportStyling.create(mockTemplateData.styling),
        isActive: mockTemplateData.isActive,
        usageCount: mockTemplateData.usageCount,
        lastUsedAt: mockTemplateData.lastUsedAt,
        createdBy: UniqueId.create(mockTemplateData.createdBy),
        organizationId: mockTemplateData.organizationId,
        createdAt: mockTemplateData.createdAt,
        updatedAt: mockTemplateData.updatedAt,
      },
      UniqueId.create(mockTemplateData.id)
    );
  });

  describe('findById', () => {
    it('should find template by id', async () => {
      mockPrismaClient.reportTemplate.findUnique.mockResolvedValue(mockTemplateData);

      const result = await repository.findById(UniqueId.create('template-1'));

      expect(result).toBeDefined();
      expect(result!.id.value).toBe('template-1');
      expect(result!.name).toBe('Sales Report Template');
      expect(mockPrismaClient.reportTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        include: { reports: true },
      });
    });

    it('should return null when template not found', async () => {
      mockPrismaClient.reportTemplate.findUnique.mockResolvedValue(null);

      const result = await repository.findById(UniqueId.create('non-existent'));

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockPrismaClient.reportTemplate.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(repository.findById(UniqueId.create('template-1')))
        .rejects.toThrow('Database error');
    });
  });

  describe('findByName', () => {
    it('should find template by name', async () => {
      mockPrismaClient.reportTemplate.findFirst.mockResolvedValue(mockTemplateData);

      const result = await repository.findByName('Sales Report Template');

      expect(result).toBeDefined();
      expect(result!.name).toBe('Sales Report Template');
      expect(mockPrismaClient.reportTemplate.findFirst).toHaveBeenCalledWith({
        where: { name: 'Sales Report Template' },
        include: { reports: true },
      });
    });

    it('should find template by name with organization filter', async () => {
      mockPrismaClient.reportTemplate.findFirst.mockResolvedValue(mockTemplateData);

      const result = await repository.findByName('Sales Report Template', 'org-1');

      expect(result).toBeDefined();
      expect(mockPrismaClient.reportTemplate.findFirst).toHaveBeenCalledWith({
        where: { name: 'Sales Report Template', organizationId: 'org-1' },
        include: { reports: true },
      });
    });

    it('should return null when template not found by name', async () => {
      mockPrismaClient.reportTemplate.findFirst.mockResolvedValue(null);

      const result = await repository.findByName('Non-existent Template');

      expect(result).toBeNull();
    });
  });

  describe('findManyWithPagination', () => {
    it('should return paginated templates', async () => {
      const templates = [mockTemplateData];
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue(templates);
      mockPrismaClient.reportTemplate.count.mockResolvedValue(1);

      const result = await repository.findManyWithPagination({}, 1, 10);

      expect(result).toBeInstanceOf(PaginatedResult);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should apply filters correctly', async () => {
      const filters = { name: 'Sales', category: 'sales', isActive: true, organizationId: 'org-1' };
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([]);
      mockPrismaClient.reportTemplate.count.mockResolvedValue(0);

      await repository.findManyWithPagination(filters, 1, 10);

      expect(mockPrismaClient.reportTemplate.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: 'Sales', mode: 'insensitive' },
          category: 'sales',
          isActive: true,
          organizationId: 'org-1',
        },
        skip: 0,
        take: 10,
        orderBy: { updatedAt: 'desc' },
        include: { reports: true },
      });
    });

    it('should apply sorting correctly', async () => {
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([]);
      mockPrismaClient.reportTemplate.count.mockResolvedValue(0);

      await repository.findManyWithPagination({}, 1, 10, 'name', 'asc');

      expect(mockPrismaClient.reportTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });

    it('should handle empty results', async () => {
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([]);
      mockPrismaClient.reportTemplate.count.mockResolvedValue(0);

      const result = await repository.findManyWithPagination({}, 1, 10);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('save', () => {
    it('should save new template', async () => {
      mockPrismaClient.reportTemplate.upsert.mockResolvedValue(mockTemplateData);

      await repository.save(mockTemplate);

      expect(mockPrismaClient.reportTemplate.upsert).toHaveBeenCalledWith({
        where: { id: mockTemplate.id.value },
        update: expect.objectContaining({
          name: mockTemplate.name,
          description: mockTemplate.description,
          category: mockTemplate.category,
          config: mockTemplate.config.value,
          layout: mockTemplate.layout.value,
          styling: mockTemplate.styling.value,
          isActive: mockTemplate.isActive,
          usageCount: mockTemplate.usageCount,
          lastUsedAt: mockTemplate.lastUsedAt,
          updatedAt: expect.any(Date),
        }),
        create: expect.objectContaining({
          id: mockTemplate.id.value,
          name: mockTemplate.name,
          description: mockTemplate.description,
          category: mockTemplate.category,
          config: mockTemplate.config.value,
          layout: mockTemplate.layout.value,
          styling: mockTemplate.styling.value,
          isActive: mockTemplate.isActive,
          usageCount: mockTemplate.usageCount,
          lastUsedAt: mockTemplate.lastUsedAt,
          createdBy: mockTemplate.createdBy.value,
          organizationId: mockTemplate.organizationId,
          createdAt: mockTemplate.createdAt,
          updatedAt: mockTemplate.updatedAt,
        }),
      });
    });

    it('should handle save errors', async () => {
      mockPrismaClient.reportTemplate.upsert.mockRejectedValue(new Error('Save failed'));

      await expect(repository.save(mockTemplate))
        .rejects.toThrow('Save failed');
    });
  });

  describe('delete', () => {
    it('should delete template', async () => {
      mockPrismaClient.reportTemplate.delete.mockResolvedValue(mockTemplateData);

      await repository.delete(UniqueId.create('template-1'));

      expect(mockPrismaClient.reportTemplate.delete).toHaveBeenCalledWith({
        where: { id: 'template-1' },
      });
    });

    it('should handle delete errors', async () => {
      mockPrismaClient.reportTemplate.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(repository.delete(UniqueId.create('template-1')))
        .rejects.toThrow('Delete failed');
    });
  });

  describe('findByCategory', () => {
    it('should find templates by category', async () => {
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([mockTemplateData]);

      const result = await repository.findByCategory('sales');

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('sales');
      expect(mockPrismaClient.reportTemplate.findMany).toHaveBeenCalledWith({
        where: { category: 'sales', isActive: true },
        take: undefined,
        orderBy: { usageCount: 'desc' },
        include: { reports: true },
      });
    });

    it('should find templates by category with organization filter', async () => {
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([mockTemplateData]);

      const result = await repository.findByCategory('sales', 'org-1');

      expect(result).toHaveLength(1);
      expect(mockPrismaClient.reportTemplate.findMany).toHaveBeenCalledWith({
        where: { category: 'sales', isActive: true, organizationId: 'org-1' },
        take: undefined,
        orderBy: { usageCount: 'desc' },
        include: { reports: true },
      });
    });

    it('should respect limit parameter', async () => {
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([mockTemplateData]);

      const result = await repository.findByCategory('sales', undefined, 5);

      expect(result).toHaveLength(1);
      expect(mockPrismaClient.reportTemplate.findMany).toHaveBeenCalledWith({
        where: { category: 'sales', isActive: true },
        take: 5,
        orderBy: { usageCount: 'desc' },
        include: { reports: true },
      });
    });

    it('should return empty array when no templates found', async () => {
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([]);

      const result = await repository.findByCategory('non-existent');

      expect(result).toHaveLength(0);
    });
  });

  describe('findActiveTemplates', () => {
    it('should find active templates', async () => {
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([mockTemplateData]);

      const result = await repository.findActiveTemplates();

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
      expect(mockPrismaClient.reportTemplate.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        take: undefined,
        orderBy: { usageCount: 'desc' },
        include: { reports: true },
      });
    });

    it('should find active templates with organization filter', async () => {
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([mockTemplateData]);

      const result = await repository.findActiveTemplates('org-1');

      expect(result).toHaveLength(1);
      expect(mockPrismaClient.reportTemplate.findMany).toHaveBeenCalledWith({
        where: { isActive: true, organizationId: 'org-1' },
        take: undefined,
        orderBy: { usageCount: 'desc' },
        include: { reports: true },
      });
    });

    it('should respect limit parameter', async () => {
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([mockTemplateData]);

      const result = await repository.findActiveTemplates(undefined, 3);

      expect(result).toHaveLength(1);
      expect(mockPrismaClient.reportTemplate.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        take: 3,
        orderBy: { usageCount: 'desc' },
        include: { reports: true },
      });
    });
  });

  describe('findPopularTemplates', () => {
    it('should find popular templates', async () => {
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([mockTemplateData]);

      const result = await repository.findPopularTemplates();

      expect(result).toHaveLength(1);
      expect(result[0].usageCount).toBeGreaterThan(0);
      expect(mockPrismaClient.reportTemplate.findMany).toHaveBeenCalledWith({
        where: { isActive: true, usageCount: { gt: 0 } },
        take: 10,
        orderBy: { usageCount: 'desc' },
        include: { reports: true },
      });
    });

    it('should find popular templates with organization filter', async () => {
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([mockTemplateData]);

      const result = await repository.findPopularTemplates('org-1');

      expect(result).toHaveLength(1);
      expect(mockPrismaClient.reportTemplate.findMany).toHaveBeenCalledWith({
        where: { isActive: true, usageCount: { gt: 0 }, organizationId: 'org-1' },
        take: 10,
        orderBy: { usageCount: 'desc' },
        include: { reports: true },
      });
    });

    it('should respect custom limit parameter', async () => {
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([mockTemplateData]);

      const result = await repository.findPopularTemplates(undefined, 5);

      expect(result).toHaveLength(1);
      expect(mockPrismaClient.reportTemplate.findMany).toHaveBeenCalledWith({
        where: { isActive: true, usageCount: { gt: 0 } },
        take: 5,
        orderBy: { usageCount: 'desc' },
        include: { reports: true },
      });
    });

    it('should return empty array when no popular templates found', async () => {
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([]);

      const result = await repository.findPopularTemplates();

      expect(result).toHaveLength(0);
    });
  });

  describe('incrementUsageCount', () => {
    it('should increment usage count', async () => {
      mockPrismaClient.reportTemplate.update.mockResolvedValue(mockTemplateData);

      await repository.incrementUsageCount(UniqueId.create('template-1'));

      expect(mockPrismaClient.reportTemplate.update).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should handle increment usage count errors', async () => {
      mockPrismaClient.reportTemplate.update.mockRejectedValue(new Error('Update failed'));

      await expect(repository.incrementUsageCount(UniqueId.create('template-1')))
        .rejects.toThrow('Update failed');
    });
  });

  describe('getTemplateStatistics', () => {
    it('should return template statistics', async () => {
      mockPrismaClient.reportTemplate.findUnique.mockResolvedValue(mockTemplateData);

      const result = await repository.getTemplateStatistics(UniqueId.create('template-1'));

      expect(result).toEqual({
        usageCount: 15,
        reportCount: 5,
        lastUsedAt: mockTemplateData.lastUsedAt,
      });
      expect(mockPrismaClient.reportTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        include: { _count: { select: { reports: true } } },
      });
    });

    it('should handle statistics with null lastUsedAt', async () => {
      const templateDataWithoutLastUsed = {
        ...mockTemplateData,
        lastUsedAt: null,
      };
      mockPrismaClient.reportTemplate.findUnique.mockResolvedValue(templateDataWithoutLastUsed);

      const result = await repository.getTemplateStatistics(UniqueId.create('template-1'));

      expect(result.lastUsedAt).toBeUndefined();
    });

    it('should throw error when template not found', async () => {
      mockPrismaClient.reportTemplate.findUnique.mockResolvedValue(null);

      await expect(repository.getTemplateStatistics(UniqueId.create('non-existent')))
        .rejects.toThrow('Template with ID non-existent not found');
    });
  });

  describe('Domain mapping', () => {
    it('should correctly map persistence data to domain object', async () => {
      mockPrismaClient.reportTemplate.findUnique.mockResolvedValue(mockTemplateData);

      const result = await repository.findById(UniqueId.create('template-1'));

      expect(result).toBeDefined();
      expect(result!.id.value).toBe(mockTemplateData.id);
      expect(result!.name).toBe(mockTemplateData.name);
      expect(result!.description).toBe(mockTemplateData.description);
      expect(result!.category).toBe(mockTemplateData.category);
      expect(result!.config.value).toEqual(mockTemplateData.config);
      expect(result!.layout.value).toEqual(mockTemplateData.layout);
      expect(result!.styling.value).toEqual(mockTemplateData.styling);
      expect(result!.isActive).toBe(mockTemplateData.isActive);
      expect(result!.usageCount).toBe(mockTemplateData.usageCount);
      expect(result!.lastUsedAt).toEqual(mockTemplateData.lastUsedAt);
      expect(result!.createdBy.value).toBe(mockTemplateData.createdBy);
      expect(result!.organizationId).toBe(mockTemplateData.organizationId);
      expect(result!.createdAt).toEqual(mockTemplateData.createdAt);
      expect(result!.updatedAt).toEqual(mockTemplateData.updatedAt);
    });

    it('should handle malformed persistence data gracefully', async () => {
      const malformedData = {
        ...mockTemplateData,
        config: 'invalid-json',
      };
      mockPrismaClient.reportTemplate.findUnique.mockResolvedValue(malformedData);

      await expect(repository.findById(UniqueId.create('template-1')))
        .rejects.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle network timeouts', async () => {
      mockPrismaClient.reportTemplate.findUnique.mockRejectedValue(new Error('Network timeout'));

      await expect(repository.findById(UniqueId.create('template-1')))
        .rejects.toThrow('Network timeout');
    });

    it('should handle constraint violations', async () => {
      mockPrismaClient.reportTemplate.upsert.mockRejectedValue(
        new Error('Unique constraint violation')
      );

      await expect(repository.save(mockTemplate))
        .rejects.toThrow('Unique constraint violation');
    });

    it('should handle foreign key violations', async () => {
      mockPrismaClient.reportTemplate.upsert.mockRejectedValue(
        new Error('Foreign key constraint violation')
      );

      await expect(repository.save(mockTemplate))
        .rejects.toThrow('Foreign key constraint violation');
    });
  });

  describe('Filter and sorting logic', () => {
    it('should build complex where clauses correctly', async () => {
      const complexFilters = {
        name: 'Sales',
        category: 'sales',
        isActive: true,
        createdBy: 'user-1',
        organizationId: 'org-1',
        createdAt: { gte: new Date('2024-01-01') },
        updatedAt: { lte: new Date('2024-01-31') },
        lastUsedAt: { gte: new Date('2024-01-01') },
      };

      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([]);
      mockPrismaClient.reportTemplate.count.mockResolvedValue(0);

      await repository.findManyWithPagination(complexFilters, 1, 10);

      expect(mockPrismaClient.reportTemplate.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: 'Sales', mode: 'insensitive' },
          category: 'sales',
          isActive: true,
          createdBy: 'user-1',
          organizationId: 'org-1',
          createdAt: { gte: new Date('2024-01-01') },
          updatedAt: { lte: new Date('2024-01-31') },
          lastUsedAt: { gte: new Date('2024-01-01') },
        },
        skip: 0,
        take: 10,
        orderBy: { updatedAt: 'desc' },
        include: { reports: true },
      });
    });

    it('should handle all supported sort fields', async () => {
      const sortFields = [
        'name', 'category', 'usageCount', 'createdAt', 'updatedAt', 'lastUsedAt'
      ];

      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([]);
      mockPrismaClient.reportTemplate.count.mockResolvedValue(0);

      for (const field of sortFields) {
        await repository.findManyWithPagination({}, 1, 10, field, 'asc');
        
        expect(mockPrismaClient.reportTemplate.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: { [field]: 'asc' },
          })
        );
      }
    });

    it('should use default sorting for unsupported fields', async () => {
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([]);
      mockPrismaClient.reportTemplate.count.mockResolvedValue(0);

      await repository.findManyWithPagination({}, 1, 10, 'unsupported-field', 'asc');

      expect(mockPrismaClient.reportTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { updatedAt: 'desc' },
        })
      );
    });
  });

  describe('Performance and concurrency', () => {
    it('should handle concurrent template operations', async () => {
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([mockTemplateData]);

      const operations = [
        repository.findActiveTemplates(),
        repository.findPopularTemplates(),
        repository.findByCategory('sales'),
      ];

      const results = await Promise.all(operations);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveLength(1);
      });
    });

    it('should handle concurrent usage count increments', async () => {
      mockPrismaClient.reportTemplate.update.mockResolvedValue(mockTemplateData);

      const increments = Array.from({ length: 5 }, () =>
        repository.incrementUsageCount(UniqueId.create('template-1'))
      );

      await Promise.all(increments);

      expect(mockPrismaClient.reportTemplate.update).toHaveBeenCalledTimes(5);
    });
  });

  describe('Business logic validation', () => {
    it('should only return active templates in category search', async () => {
      const activeTemplate = { ...mockTemplateData, isActive: true };
      const inactiveTemplate = { ...mockTemplateData, id: 'template-2', isActive: false };
      
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([activeTemplate]);

      const result = await repository.findByCategory('sales');

      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
      expect(mockPrismaClient.reportTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      );
    });

    it('should only return templates with usage count &gt; 0 for popular templates', async () => {
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([mockTemplateData]);

      await repository.findPopularTemplates();

      expect(mockPrismaClient.reportTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ 
            usageCount: { gt: 0 },
            isActive: true,
          }),
        })
      );
    });

    it('should order templates by usage count in descending order', async () => {
      mockPrismaClient.reportTemplate.findMany.mockResolvedValue([mockTemplateData]);

      await repository.findPopularTemplates();

      expect(mockPrismaClient.reportTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { usageCount: 'desc' },
        })
      );
    });
  });
});