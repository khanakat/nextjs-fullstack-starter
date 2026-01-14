import { ReportTemplate, TemplateType, TemplateCategory } from '../../../../domain/reporting/entities/report-template';

/**
 * Report Template Data Transfer Object
 */
export interface ReportTemplateDto {
  id: string;
  name: string;
  description?: string;
  type: TemplateType;
  category: TemplateCategory;
  config: any;
  layout?: any;
  styling?: any;
  isSystem: boolean;
  isActive: boolean;
  isPublic?: boolean;
  tags: string[];
  previewImageUrl?: string;
  createdBy: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  lastUsedAt?: string;
}

/**
 * Template Search Result DTO
 */
export interface TemplateSearchResultDto {
  templates: ReportTemplateDto[];
  total: number;
  hasMore: boolean;
}

/**
 * Template Statistics DTO
 */
export interface TemplateStatisticsDto {
  totalTemplates: number;
  activeTemplates: number;
  systemTemplates: number;
  customTemplates: number;
  templatesThisMonth: number;
  templatesThisWeek: number;
  averageUsagePerTemplate: number;
}

/**
 * Helper to convert domain entity to DTO
 */
export function toTemplateDto(template: ReportTemplate): ReportTemplateDto {
  return {
    id: template.id.id,
    name: template.name,
    description: template.description,
    type: template.type,
    category: template.category,
    config: template.config.toJSON(),
    layout: template.layout?.toJSON(),
    styling: template.styling?.toJSON(),
    isSystem: template.isSystem,
    isActive: template.isActive,
    isPublic: template.isPublic,
    tags: template.tags,
    previewImageUrl: template.previewImageUrl,
    createdBy: template.createdBy.id,
    organizationId: template.organizationId?.id,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
    usageCount: template.usageCount,
    lastUsedAt: template.lastUsedAt?.toISOString(),
  };
}
