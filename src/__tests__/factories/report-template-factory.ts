import { ReportTemplate, TemplateType, TemplateCategory } from '../../shared/domain/reporting/entities/report-template';
import { UniqueId } from '../../shared/domain/value-objects/unique-id';
import { ReportConfig } from '../../shared/domain/reporting/value-objects/report-config';
import { ReportLayout } from '../../shared/domain/reporting/value-objects/report-layout';
import { ReportStyling } from '../../shared/domain/reporting/value-objects/report-styling';
import { ReportTemplateDto } from '../../slices/reporting/application/dtos/report-template-dto';

/**
 * Factory for creating ReportTemplate instances for testing
 */
export class ReportTemplateFactory {
  private static counter = 1;

  /**
   * Create a ReportTemplate with default or custom properties
   */
  static create(overrides: Partial<{
    id: UniqueId | string;
    name: string;
    description: string;
    type: TemplateType;
    category: TemplateCategory;
    config: ReportConfig;
    isSystem: boolean;
    // Alias used by some tests
    isSystemTemplate: boolean;
    isActive: boolean;
    tags: string[];
    previewImageUrl: string;
    createdBy: UniqueId | string;
    organizationId: UniqueId | string;
    usageCount: number;
    lastUsedAt: Date;
  }> = {}): ReportTemplate {
    const name = overrides.name || `Test Report Template ${ReportTemplateFactory.counter++}`;
    const description = overrides.description || `Description for ${name}`;
    const type = overrides.type || TemplateType.ANALYTICS;
    const category = overrides.category || TemplateCategory.STANDARD;
    const defaultLayout = ReportLayout.create({
      components: [],
      grid: {
        columns: 12,
        rows: 8,
        gap: 16,
      },
    });
    const defaultStyling = ReportStyling.create({
      theme: 'light',
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      fontFamily: 'Arial',
      fontSize: 12,
    });
    const config = overrides.config || ReportConfig.create({
      title: name,
      description: description,
      filters: {},
      parameters: {},
      layout: defaultLayout,
      styling: defaultStyling,
    });
    const isSystem = (overrides.isSystemTemplate ?? overrides.isSystem) ?? false;
    const tags = overrides.tags || ['test', 'analytics'];
    const createdBy = typeof overrides.createdBy === 'string'
      ? UniqueId.create(overrides.createdBy)
      : (overrides.createdBy || UniqueId.generate());
    const organizationId = typeof overrides.organizationId === 'string'
      ? UniqueId.create(overrides.organizationId)
      : overrides.organizationId;

    const explicitId = typeof overrides.id === 'string'
      ? UniqueId.create(overrides.id)
      : overrides.id;

    const created = ReportTemplate.create({
      name,
      description,
      type,
      category,
      config,
      isSystem,
      tags,
      previewImageUrl: overrides.previewImageUrl,
      createdBy,
      organizationId,
    }, explicitId);

    // Apply overrides that require reconstitution (usageCount, lastUsedAt, isActive)
    const finalUsage = overrides.usageCount ?? created.usageCount;
    const finalIsActive = overrides.isActive ?? created.isActive;
    const finalLastUsedAt = overrides.lastUsedAt ?? created.lastUsedAt;

    if (
      overrides.usageCount !== undefined ||
      overrides.lastUsedAt !== undefined ||
      overrides.isActive !== undefined
    ) {
      return ReportTemplate.reconstitute(created.id, {
        name: created.name,
        description: created.description,
        type: created.type,
        category: created.category,
        config: created.config,
        isSystem: created.isSystem,
        isActive: finalIsActive,
        tags: created.tags,
        previewImageUrl: created.previewImageUrl,
        createdBy: created.createdBy,
        organizationId: created.organizationId,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        usageCount: finalUsage,
        lastUsedAt: finalLastUsedAt,
      });
    }

    return created;
  }

  /**
   * Create a ReportTemplateDto for handler/use-case tests
   */
  static createDto(overrides: Partial<{
    id: string;
    name: string;
    description: string;
    type: TemplateType;
    category: TemplateCategory;
    isSystem: boolean;
    isActive: boolean;
    tags: string[];
    previewImageUrl: string;
    createdBy: string;
    organizationId?: string;
    usageCount: number;
    lastUsedAt: Date;
  }> = {}): ReportTemplateDto {
    const domain = ReportTemplateFactory.create({
      id: overrides.id ? UniqueId.create(overrides.id) : undefined,
      name: overrides.name,
      description: overrides.description,
      type: overrides.type,
      category: overrides.category,
      isSystem: overrides.isSystem,
      isActive: overrides.isActive,
      tags: overrides.tags,
      previewImageUrl: overrides.previewImageUrl,
      createdBy: overrides.createdBy ? UniqueId.create(overrides.createdBy) : undefined,
      organizationId: overrides.organizationId ? UniqueId.create(overrides.organizationId) : undefined,
      usageCount: overrides.usageCount,
      lastUsedAt: overrides.lastUsedAt,
    });

    return ReportTemplateDto.fromDomain(domain);
  }

  /**
   * Create a system template
   */
  static createSystemTemplate(overrides: Partial<{
    name: string;
    type: TemplateType;
    category: TemplateCategory;
  }> = {}): ReportTemplate {
    return ReportTemplateFactory.create({
      name: overrides.name || 'System Analytics Template',
      type: overrides.type || TemplateType.ANALYTICS,
      category: overrides.category || TemplateCategory.STANDARD,
      isSystem: true,
      tags: ['system', 'analytics'],
    });
  }

  /**
   * Create a dashboard template
   */
  static createDashboardTemplate(overrides: Partial<{
    name: string;
    createdBy: UniqueId;
    organizationId: UniqueId;
  }> = {}): ReportTemplate {
    return ReportTemplateFactory.create({
      name: overrides.name || 'Dashboard Template',
      type: TemplateType.DASHBOARD,
      category: TemplateCategory.STANDARD,
      createdBy: overrides.createdBy,
      organizationId: overrides.organizationId,
      tags: ['dashboard', 'visualization'],
    });
  }

  /**
   * Create a financial template
   */
  static createFinancialTemplate(overrides: Partial<{
    name: string;
    createdBy: UniqueId;
    organizationId: UniqueId;
  }> = {}): ReportTemplate {
    return ReportTemplateFactory.create({
      name: overrides.name || 'Financial Report Template',
      type: TemplateType.FINANCIAL,
      category: TemplateCategory.PREMIUM,
      createdBy: overrides.createdBy,
      organizationId: overrides.organizationId,
      tags: ['financial', 'accounting'],
    });
  }

  /**
   * Create an operational template
   */
  static createOperationalTemplate(overrides: Partial<{
    name: string;
    createdBy: UniqueId;
    organizationId: UniqueId;
  }> = {}): ReportTemplate {
    return ReportTemplateFactory.create({
      name: overrides.name || 'Operational Report Template',
      type: TemplateType.OPERATIONAL,
      category: TemplateCategory.STANDARD,
      createdBy: overrides.createdBy,
      organizationId: overrides.organizationId,
      tags: ['operational', 'metrics'],
    });
  }

  /**
   * Create a public template
   */
  static createPublicTemplate(overrides: Partial<{
    name: string;
    type: TemplateType;
    category: TemplateCategory;
    createdBy: UniqueId;
  }> = {}): ReportTemplate {
    return ReportTemplateFactory.create({
      name: overrides.name || 'Public Template',
      type: overrides.type || TemplateType.ANALYTICS,
      category: overrides.category || TemplateCategory.STANDARD,
      createdBy: overrides.createdBy,
      organizationId: undefined, // Public templates don't belong to specific organizations
      tags: ['public', 'shared'],
    });
  }

  /**
   * Create a private template
   */
  static createPrivateTemplate(overrides: Partial<{
    name: string;
    type: TemplateType;
    category: TemplateCategory;
    createdBy: UniqueId;
    organizationId: UniqueId;
  }> = {}): ReportTemplate {
    return ReportTemplateFactory.create({
      name: overrides.name || 'Private Template',
      type: overrides.type || TemplateType.CUSTOM,
      category: overrides.category || TemplateCategory.STANDARD,
      createdBy: overrides.createdBy || UniqueId.generate(),
      organizationId: overrides.organizationId || UniqueId.generate(),
      tags: ['private', 'custom'],
    });
  }

  /**
   * Create multiple templates
   */
  static createMany(
    count: number,
    overrides: Partial<{
      namePrefix: string;
      type: TemplateType;
      category: TemplateCategory;
      createdBy: UniqueId;
      organizationId: UniqueId;
    }> = {}
  ): ReportTemplate[] {
    const templates: ReportTemplate[] = [];
    const namePrefix = overrides.namePrefix || 'Template';

    for (let i = 1; i <= count; i++) {
      templates.push(
        ReportTemplateFactory.create({
          name: `${namePrefix} ${i}`,
          type: overrides.type,
          category: overrides.category,
          createdBy: overrides.createdBy,
          organizationId: overrides.organizationId,
        })
      );
    }

    return templates;
  }

  /**
   * Create templates by categories
   */
  static createByCategories(
    categories: TemplateCategory[],
    overrides: Partial<{
      createdBy: UniqueId;
      organizationId: UniqueId;
    }> = {}
  ): ReportTemplate[] {
    return categories.map((category, index) =>
      ReportTemplateFactory.create({
        name: `${category} Template ${index + 1}`,
        category,
        createdBy: overrides.createdBy,
        organizationId: overrides.organizationId,
      })
    );
  }

  /**
   * Reset the counter for consistent testing
   */
  static resetCounter(): void {
    ReportTemplateFactory.counter = 1;
  }

  /**
   * Create an invalid template for error testing
   */
  static createInvalid(): any {
    return {
      name: '', // Invalid: empty name
      description: 'a'.repeat(1001), // Invalid: too long description
      type: 'INVALID_TYPE' as any,
      category: 'INVALID_CATEGORY' as any,
      config: null,
      isSystem: 'not-boolean' as any,
      tags: ['a'.repeat(51)], // Invalid: tag too long
      createdBy: 'invalid-id',
      organizationId: 'invalid-id',
    };
  }
}

export default ReportTemplateFactory;

// Minimal smoke tests so Jest treats this file as a proper suite
describe('ReportTemplateFactory', () => {
  it('creates a template with a name and id', () => {
    const template = ReportTemplateFactory.create();
    expect(template.name).toBeTruthy();
    expect(template.id).toBeDefined();
  });
});
