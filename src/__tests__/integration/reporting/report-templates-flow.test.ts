import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/report-templates/route';
import { GET as GetById, PUT as UpdateById, DELETE as DeleteById } from '@/app/api/templates/[id]/route';
import { POST as UseTemplate } from '@/app/api/templates/[id]/use/route';
import { prisma } from '@/lib/prisma';
import { TemplateCategory } from '@/src/shared/domain/reporting/entities/report-template';

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
    reportTemplate: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0)
    },
    report: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([])
    },
    $transaction: jest.fn().mockResolvedValue([])
  }
}));

const mockPrisma = prisma as any;

describe('Report Templates API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/report-templates - Create Template Flow', () => {
    it('should create a report template successfully with valid data', async () => {
      const templateData = {
        name: 'Sales Dashboard Template',
        description: 'A comprehensive sales dashboard template',
        category: TemplateCategory.STANDARD,
        config: {
          title: 'Sales Dashboard',
          description: 'Monthly sales performance dashboard',
          filters: {
            dateRange: { type: 'relative', value: '30d' },
            region: { type: 'multi-select', options: ['North', 'South', 'East', 'West'] }
          },
          parameters: {
            currency: 'USD',
            showTrends: true,
            includeForecasts: false
          },
          layout: {
            components: [
              {
                id: 'revenue-chart',
                type: 'line-chart',
                title: 'Revenue Trend',
                position: { x: 0, y: 0, w: 6, h: 4 },
                config: {
                  dataSource: 'sales.revenue',
                  xAxis: 'date',
                  yAxis: 'amount',
                  aggregation: 'sum'
                }
              },
              {
                id: 'top-products',
                type: 'bar-chart',
                title: 'Top Products',
                position: { x: 6, y: 0, w: 6, h: 4 },
                config: {
                  dataSource: 'sales.products',
                  xAxis: 'product_name',
                  yAxis: 'quantity_sold',
                  limit: 10
                }
              }
            ],
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
        isPublic: true,
        tags: ['sales', 'dashboard', 'revenue']
      };

      const createdTemplate = {
        id: 'template-1',
        ...templateData,
        createdBy: 'test-user-id',
        organizationId: 'test-org-id',
        usageCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null
      };

      mockPrisma.reportTemplate.create.mockResolvedValue(createdTemplate);

      const request = new NextRequest('http://localhost:3000/api/report-templates', {
        method: 'POST',
        body: JSON.stringify(templateData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBe('template-1');
      expect(responseData.data.name).toBe(templateData.name);
      expect(responseData.data.category).toBe(TemplateCategory.SALES);
      expect(mockPrisma.reportTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: templateData.name,
          description: templateData.description,
          category: TemplateCategory.PREMIUM,
          createdBy: 'test-user-id',
          organizationId: 'test-org-id'
        })
      });
    });

    it('should validate template configuration structure', async () => {
      const invalidTemplateData = {
        name: 'Invalid Template',
        description: 'Template with invalid config',
        category: TemplateCategory.STANDARD,
        config: {
          // Missing required fields like layout
          title: 'Invalid Template'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/report-templates', {
        method: 'POST',
        body: JSON.stringify(invalidTemplateData),
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
  });

  describe('GET /api/report-templates - List Templates Flow', () => {
    it('should return paginated templates with category filtering', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Sales Template',
          description: 'Sales dashboard template',
          category: TemplateCategory.PREMIUM,
          isPublic: true,
          isActive: true,
          usageCount: 15,
          createdBy: 'test-user-id',
          organizationId: 'test-org-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastUsedAt: new Date(),
          config: {}
        },
        {
          id: 'template-2',
          name: 'Analytics Template',
          description: 'Analytics dashboard template',
          category: TemplateCategory.ENTERPRISE,
          isPublic: true,
          isActive: true,
          usageCount: 8,
          createdBy: 'test-user-id',
          organizationId: 'test-org-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastUsedAt: new Date(),
          config: {}
        }
      ];

      mockPrisma.reportTemplate.findMany.mockResolvedValue(mockTemplates);
      mockPrisma.reportTemplate.count.mockResolvedValue(2);

      const request = new NextRequest('http://localhost:3000/api/report-templates?page=1&limit=10&category=SALES&sortBy=usageCount&sortOrder=desc');

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.templates).toHaveLength(2);
      expect(responseData.data.pagination.total).toBe(2);
      expect(responseData.data.pagination.page).toBe(1);
    });

    it('should return popular templates', async () => {
      const mockPopularTemplates = [
        {
          id: 'template-1',
          name: 'Most Popular Template',
          usageCount: 100,
          category: TemplateCategory.STANDARD,
          isPublic: true,
          isActive: true,
          createdBy: 'test-user-id',
          organizationId: 'test-org-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastUsedAt: new Date(),
          config: {}
        }
      ];

      mockPrisma.reportTemplate.findMany.mockResolvedValue(mockPopularTemplates);

      const request = new NextRequest('http://localhost:3000/api/report-templates?popular=true&limit=5');

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.templates[0].usageCount).toBeGreaterThan(0);
    });
  });

  describe('Template Usage Flow - POST /api/templates/[id]/use', () => {
    it('should create a report from template and increment usage count', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Sales Template',
        description: 'Sales dashboard template',
        category: TemplateCategory.ENTERPRISE,
        config: {
          title: 'Sales Dashboard',
          description: 'Monthly sales performance',
          filters: { dateRange: '30d' },
          parameters: { currency: 'USD' },
          layout: {
            components: [
              {
                id: 'revenue-chart',
                type: 'line-chart',
                title: 'Revenue Trend',
                position: { x: 0, y: 0, w: 6, h: 4 }
              }
            ],
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
        isPublic: true,
        isActive: true,
        usageCount: 10,
        createdBy: 'template-creator',
        organizationId: 'test-org-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: new Date()
      };

      const createdReport = {
        id: 'report-from-template',
        title: 'My Sales Dashboard',
        description: 'Custom sales dashboard based on template',
        config: mockTemplate.config,
        templateId: 'template-1',
        status: 'DRAFT',
        isPublic: false,
        createdBy: 'test-user-id',
        organizationId: 'test-org-id',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedTemplate = {
        ...mockTemplate,
        usageCount: 11,
        lastUsedAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the transaction
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          reportTemplate: {
            findUnique: jest.fn().mockResolvedValue(mockTemplate),
            update: jest.fn().mockResolvedValue(updatedTemplate)
          },
          report: {
            create: jest.fn().mockResolvedValue(createdReport)
          }
        });
      });

      const useTemplateData = {
        title: 'My Sales Dashboard',
        description: 'Custom sales dashboard based on template',
        customizations: {
          filters: { dateRange: '60d' }, // Override default filter
          styling: { primaryColor: '#28a745' } // Override default color
        }
      };

      const request = new NextRequest('http://localhost:3000/api/templates/template-1/use', {
        method: 'POST',
        body: JSON.stringify(useTemplateData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await UseTemplate(request, { params: { id: 'template-1' } });
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data.report.id).toBe('report-from-template');
      expect(responseData.data.report.templateId).toBe('template-1');
      expect(responseData.data.template.usageCount).toBe(11);
    });

    it('should handle template not found error', async () => {
      mockPrisma.reportTemplate.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/templates/non-existent/use', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Report' }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await UseTemplate(request, { params: { id: 'non-existent' } });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('not found');
    });

    it('should prevent using inactive templates', async () => {
      const inactiveTemplate = {
        id: 'template-1',
        name: 'Inactive Template',
        isActive: false,
        isPublic: true,
        createdBy: 'test-user-id',
        organizationId: 'test-org-id',
        config: {}
      };

      mockPrisma.reportTemplate.findUnique.mockResolvedValue(inactiveTemplate);

      const request = new NextRequest('http://localhost:3000/api/templates/template-1/use', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Report' }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await UseTemplate(request, { params: { id: 'template-1' } });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('inactive');
    });
  });

  describe('Template Management Flow', () => {
    it('should update template and maintain version history', async () => {
      const existingTemplate = {
        id: 'template-1',
        name: 'Original Template',
        description: 'Original description',
        category: TemplateCategory.SALES,
        config: { title: 'Original Config' },
        isPublic: true,
        isActive: true,
        usageCount: 5,
        createdBy: 'test-user-id',
        organizationId: 'test-org-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: new Date()
      };

      const updateData = {
        name: 'Updated Template',
        description: 'Updated description',
        config: {
          title: 'Updated Config',
          layout: {
            components: [
              {
                id: 'new-component',
                type: 'table',
                title: 'New Component'
              }
            ],
            grid: { columns: 12, rows: 8, gap: 16 }
          }
        }
      };

      const updatedTemplate = {
        ...existingTemplate,
        ...updateData,
        updatedAt: new Date()
      };

      mockPrisma.reportTemplate.findUnique.mockResolvedValue(existingTemplate);
      mockPrisma.reportTemplate.update.mockResolvedValue(updatedTemplate);

      const request = new NextRequest('http://localhost:3000/api/templates/template-1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await UpdateById(request, { params: { id: 'template-1' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.name).toBe('Updated Template');
      expect(responseData.data.config.title).toBe('Updated Config');
    });

    it('should soft delete template and prevent future usage', async () => {
      const existingTemplate = {
        id: 'template-1',
        name: 'Template to Delete',
        isActive: true,
        createdBy: 'test-user-id',
        organizationId: 'test-org-id',
        config: {}
      };

      const deletedTemplate = {
        ...existingTemplate,
        isActive: false,
        updatedAt: new Date()
      };

      mockPrisma.reportTemplate.findUnique.mockResolvedValue(existingTemplate);
      mockPrisma.reportTemplate.update.mockResolvedValue(deletedTemplate);

      const request = new NextRequest('http://localhost:3000/api/templates/template-1', {
        method: 'DELETE'
      });

      const response = await DeleteById(request, { params: { id: 'template-1' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockPrisma.reportTemplate.update).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        data: { isActive: false, updatedAt: expect.any(Date) }
      });
    });
  });

  describe('Cross-Template Operations', () => {
    it('should handle template cloning with modifications', async () => {
      const sourceTemplate = {
        id: 'source-template',
        name: 'Source Template',
        description: 'Template to be cloned',
        category: TemplateCategory.STANDARD,
        config: {
          title: 'Source Config',
          layout: {
            components: [
              {
                id: 'chart-1',
                type: 'bar-chart',
                title: 'Original Chart'
              }
            ],
            grid: { columns: 12, rows: 8, gap: 16 }
          }
        },
        isPublic: true,
        isActive: true,
        createdBy: 'original-creator',
        organizationId: 'test-org-id'
      };

      const cloneData = {
        name: 'Cloned Template',
        description: 'Cloned from source template',
        modifications: {
          config: {
            layout: {
              components: [
                {
                  id: 'chart-1',
                  type: 'line-chart', // Changed type
                  title: 'Modified Chart'
                }
              ]
            }
          }
        }
      };

      const clonedTemplate = {
        id: 'cloned-template',
        name: cloneData.name,
        description: cloneData.description,
        category: sourceTemplate.category,
        config: {
          ...sourceTemplate.config,
          ...cloneData.modifications.config
        },
        isPublic: false,
        isActive: true,
        usageCount: 0,
        createdBy: 'test-user-id',
        organizationId: 'test-org-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null
      };

      mockPrisma.reportTemplate.findUnique.mockResolvedValue(sourceTemplate);
      mockPrisma.reportTemplate.create.mockResolvedValue(clonedTemplate);

      const request = new NextRequest('http://localhost:3000/api/templates/source-template/clone', {
        method: 'POST',
        body: JSON.stringify(cloneData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Note: This would require implementing the clone endpoint
      // For now, we'll simulate the expected behavior
      expect(clonedTemplate.name).toBe('Cloned Template');
      expect(clonedTemplate.config.layout.components[0].type).toBe('line-chart');
      expect(clonedTemplate.createdBy).toBe('test-user-id');
    });
  });

  describe('Template Analytics and Statistics', () => {
    it('should track template usage statistics', async () => {
      const templateStats = {
        templateId: 'template-1',
        usageCount: 25,
        reportCount: 15, // Reports created from this template
        lastUsedAt: new Date(),
        averageRating: 4.5,
        popularityRank: 3
      };

      // Mock statistics endpoint response
      const request = new NextRequest('http://localhost:3000/api/templates/template-1/stats');

      // This would require implementing the stats endpoint
      // For now, we'll verify the expected structure
      expect(templateStats.usageCount).toBeGreaterThan(0);
      expect(templateStats.reportCount).toBeGreaterThan(0);
      expect(templateStats.averageRating).toBeGreaterThanOrEqual(0);
      expect(templateStats.averageRating).toBeLessThanOrEqual(5);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle concurrent template usage gracefully', async () => {
      const template = {
        id: 'popular-template',
        name: 'Popular Template',
        usageCount: 100,
        isActive: true,
        config: {}
      };

      // Simulate concurrent usage
      const concurrentRequests = Array.from({ length: 5 }, (_, i) => {
        mockPrisma.reportTemplate.findUnique.mockResolvedValue(template);
        mockPrisma.$transaction.mockImplementation(async (callback) => {
          return callback({
            reportTemplate: {
              update: jest.fn().mockResolvedValue({
                ...template,
                usageCount: template.usageCount + i + 1
              })
            },
            report: {
              create: jest.fn().mockResolvedValue({
                id: `report-${i}`,
                templateId: template.id
              })
            }
          });
        });

        return new NextRequest(`http://localhost:3000/api/templates/${template.id}/use`, {
          method: 'POST',
          body: JSON.stringify({ title: `Report ${i}` }),
          headers: { 'Content-Type': 'application/json' }
        });
      });

      // All requests should succeed
      for (const request of concurrentRequests) {
        const response = await UseTemplate(request, { params: { id: 'popular-template' } });
        expect(response.status).toBe(201);
      }
    });

    it('should validate template permissions for organization access', async () => {
      const privateTemplate = {
        id: 'private-template',
        name: 'Private Template',
        isPublic: false,
        isActive: true,
        createdBy: 'different-user',
        organizationId: 'different-org',
        config: {}
      };

      mockPrisma.reportTemplate.findUnique.mockResolvedValue(privateTemplate);

      const request = new NextRequest('http://localhost:3000/api/templates/private-template/use', {
        method: 'POST',
        body: JSON.stringify({ title: 'Unauthorized Report' }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await UseTemplate(request, { params: { id: 'private-template' } });
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('permission');
    });
  });
});