import { Dto } from '../../../../shared/application/base/dto';
import { TemplateType, TemplateCategory, ReportTemplate } from '../../../../shared/domain/reporting/entities/report-template';
import { 
  ReportConfigDto, 
  ReportLayoutDto, 
  ReportStylingDto, 
  ReportComponentDto, 
  PositionDto, 
  SizeDto, 
  GridLayoutDto, 
  ColorSchemeDto, 
  FontConfigDto, 
  SpacingConfigDto 
} from './report-dto';
import { ReportConfig } from '../../../../shared/domain/reporting/value-objects/report-config';

/**
 * Report Template DTO for data transfer between layers
 */
export class ReportTemplateDto extends Dto {
  public readonly name: string;
  public readonly description?: string;
  public readonly type: TemplateType;
  public readonly category: TemplateCategory;
  public readonly config: ReportConfigDto;
  public readonly isSystem: boolean;
  public readonly isActive: boolean;
  public readonly tags: string[];
  public readonly previewImageUrl?: string;
  public readonly createdBy: string;
  public readonly organizationId?: string;
  public readonly usageCount: number;
  public readonly lastUsedAt?: Date;

  constructor(
    id: string,
    name: string,
    type: TemplateType,
    category: TemplateCategory,
    config: ReportConfigDto,
    isSystem: boolean,
    isActive: boolean,
    tags: string[],
    createdBy: string,
    usageCount: number,
    createdAt: Date,
    updatedAt?: Date,
    description?: string,
    previewImageUrl?: string,
    organizationId?: string,
    lastUsedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.name = name;
    this.description = description;
    this.type = type;
    this.category = category;
    this.config = config;
    this.isSystem = isSystem;
    this.isActive = isActive;
    this.tags = tags;
    this.previewImageUrl = previewImageUrl;
    this.createdBy = createdBy;
    this.organizationId = organizationId;
    this.usageCount = usageCount;
    this.lastUsedAt = lastUsedAt;
  }

  /**
   * Creates a ReportTemplateDto from a domain ReportTemplate entity
   */
  public static fromDomain(template: ReportTemplate): ReportTemplateDto {
    return new ReportTemplateDto(
      template.id.id,
      template.name,
      template.type,
      template.category,
      ReportTemplateDto.convertConfigToDto(template.config),
      template.isSystem,
      template.isActive,
      template.tags,
      template.createdBy.id,
      template.usageCount,
      template.createdAt,
      template.updatedAt,
      template.description,
      template.previewImageUrl,
      template.organizationId?.id,
      undefined // lastUsedAt is not available on ReportTemplate entity
    );
  }

  /**
   * Converts a ReportConfig domain object to a DTO
   */
  private static convertConfigToDto(config: ReportConfig): ReportConfigDto {
    // Safely handle possibly undefined components or grid
    const components = Array.isArray((config as any)?.layout?.components)
      ? config.layout.components
      : [];

    const grid = (config as any)?.layout?.grid ?? {
      columns: 12,
      rows: 8,
      gap: 16,
    };

    // Create layout DTO
    const layoutDto = new ReportLayoutDto(
      'grid', // Default to grid type since ReportLayout doesn't have a type property
      components.map(comp => new ReportComponentDto(
        comp.id,
        comp.type,
        new PositionDto(comp.position.x, comp.position.y),
        new SizeDto(comp.size.width, comp.size.height),
        comp.config ?? {}
      )),
      new GridLayoutDto(
        grid.columns ?? 12,
        grid.rows ?? 8,
        grid.gap ?? 16
      )
    );

    // Create styling DTO with sensible defaults
    const theme = (config as any)?.styling?.theme ?? 'light';
    const primaryColor = (config as any)?.styling?.primaryColor ?? '#3b82f6';
    const secondaryColor = (config as any)?.styling?.secondaryColor ?? '#64748b';
    const fontFamily = (config as any)?.styling?.fontFamily ?? 'Inter';
    const fontSize = (config as any)?.styling?.fontSize ?? 14;

    const stylingDto = new ReportStylingDto(
      theme,
      new ColorSchemeDto(
        primaryColor,
        secondaryColor,
        theme === 'dark' ? '#f59e0b' : '#8b5cf6', // accent fallback
        theme === 'dark' ? '#1f2937' : '#ffffff', // background fallback
        theme === 'dark' ? '#f9fafb' : '#111827'  // text fallback
      ),
      new FontConfigDto(
        fontFamily,
        { medium: fontSize },
        { normal: 400 }
      ),
      new SpacingConfigDto(8, [0, 4, 8, 12, 16, 20])
    );

    return new ReportConfigDto(
      config.title,
      config.filters ?? {},
      config.parameters ?? {},
      layoutDto,
      stylingDto,
      config.description
    );
  }

  public toPlainObject(): Record<string, any> {
    return {
      ...super.toPlainObject(),
      name: this.name,
      description: this.description,
      type: this.type,
      category: this.category,
      config: this.config.toPlainObject(),
      isSystem: this.isSystem,
      isActive: this.isActive,
      tags: this.tags,
      previewImageUrl: this.previewImageUrl,
      createdBy: this.createdBy,
      organizationId: this.organizationId,
      usageCount: this.usageCount,
      lastUsedAt: this.lastUsedAt,
    };
  }
}

/**
 * Template Usage Statistics DTO
 */
export class TemplateUsageStatsDto {
  public readonly templateId: string;
  public readonly totalUsage: number;
  public readonly usageThisMonth: number;
  public readonly usageThisWeek: number;
  public readonly lastUsedAt?: Date;
  public readonly popularityRank: number;

  constructor(
    templateId: string,
    totalUsage: number,
    usageThisMonth: number,
    usageThisWeek: number,
    popularityRank: number,
    lastUsedAt?: Date
  ) {
    this.templateId = templateId;
    this.totalUsage = totalUsage;
    this.usageThisMonth = usageThisMonth;
    this.usageThisWeek = usageThisWeek;
    this.popularityRank = popularityRank;
    this.lastUsedAt = lastUsedAt;
  }

  public toPlainObject(): Record<string, any> {
    return {
      templateId: this.templateId,
      totalUsage: this.totalUsage,
      usageThisMonth: this.usageThisMonth,
      usageThisWeek: this.usageThisWeek,
      popularityRank: this.popularityRank,
      lastUsedAt: this.lastUsedAt,
    };
  }
}

/**
 * Template Statistics DTO
 */
export class TemplateStatisticsDto {
  public readonly totalTemplates: number;
  public readonly activeTemplates: number;
  public readonly systemTemplates: number;
  public readonly customTemplates: number;
  public readonly templatesThisMonth: number;
  public readonly templatesThisWeek: number;
  public readonly averageUsagePerTemplate: number;
  public readonly organizationId?: string;

  constructor(
    totalTemplates: number,
    activeTemplates: number,
    systemTemplates: number,
    customTemplates: number,
    templatesThisMonth: number,
    templatesThisWeek: number,
    averageUsagePerTemplate: number,
    organizationId?: string
  ) {
    this.totalTemplates = totalTemplates;
    this.activeTemplates = activeTemplates;
    this.systemTemplates = systemTemplates;
    this.customTemplates = customTemplates;
    this.templatesThisMonth = templatesThisMonth;
    this.templatesThisWeek = templatesThisWeek;
    this.averageUsagePerTemplate = averageUsagePerTemplate;
    this.organizationId = organizationId;
  }

  public toPlainObject(): Record<string, any> {
    return {
      totalTemplates: this.totalTemplates,
      activeTemplates: this.activeTemplates,
      systemTemplates: this.systemTemplates,
      customTemplates: this.customTemplates,
      templatesThisMonth: this.templatesThisMonth,
      templatesThisWeek: this.templatesThisWeek,
      averageUsagePerTemplate: this.averageUsagePerTemplate,
      organizationId: this.organizationId,
    };
  }
}