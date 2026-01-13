import { UniqueId } from '../../value-objects/unique-id';
import { Report } from '../entities/report';
import { ReportTemplate } from '../entities/report-template';
import { ReportConfig } from '../value-objects/report-config';
import { ReportLayout } from '../value-objects/report-layout';
import { ReportStyling } from '../value-objects/report-styling';
import { ValidationError } from '../../exceptions/validation-error';
import { BusinessRuleViolationError } from '../../exceptions/business-rule-violation-error';

export interface ReportGenerationRequest {
  title: string;
  description?: string;
  templateId?: UniqueId;
  config?: ReportConfig;
  layout?: ReportLayout;
  styling?: ReportStyling;
  isPublic?: boolean;
  createdBy: UniqueId;
  organizationId?: UniqueId;
}

export interface ReportFromTemplateRequest {
  templateId: UniqueId;
  title: string;
  description?: string;
  configOverrides?: Partial<ReportConfig>;
  layoutOverrides?: Partial<ReportLayout>;
  stylingOverrides?: Partial<ReportStyling>;
  isPublic?: boolean;
  createdBy: UniqueId;
  organizationId?: UniqueId;
}

export interface ReportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Domain service for report generation and validation
 * Handles complex business logic for creating reports from templates
 */
export class ReportGenerationService {
  /**
   * Generate a new report from scratch or template
   */
  public static generateReport(request: ReportGenerationRequest): Report {
    this.validateGenerationRequest(request);

    // Create default config if not provided, or merge with provided layout/styling
    let config = request.config || ReportConfig.createDefault();
    
    // If layout or styling are provided separately, update the config
    if (request.layout || request.styling) {
      const layout = request.layout || config.layout;
      const styling = request.styling || config.styling;
      
      config = ReportConfig.create({
        title: config.title,
        description: config.description,
        filters: config.filters,
        parameters: config.parameters,
        layout,
        styling,
      });
    }

    return Report.create({
      title: request.title,
      description: request.description,
      config,
      isPublic: request.isPublic ?? false,
      templateId: request.templateId,
      createdBy: request.createdBy,
      organizationId: request.organizationId,
    });
  }

  /**
   * Generate a report from a template with customizations
   */
  public static generateReportFromTemplate(
    template: ReportTemplate,
    request: ReportFromTemplateRequest
  ): Report {
    this.validateTemplateGenerationRequest(request);
    this.validateTemplateUsage(template, request.createdBy, request.organizationId);

    // Start with template's configuration
    let config = template.config;
    let layout = template.config.layout;
    let styling = template.config.styling;

    // Apply overrides if provided
    if (request.configOverrides) {
      config = this.mergeReportConfig(config, request.configOverrides);
    }

    if (request.layoutOverrides) {
      layout = this.mergeReportLayout(layout, request.layoutOverrides);
    }

    if (request.stylingOverrides) {
      styling = this.mergeReportStyling(styling, request.stylingOverrides);
    }

    // Create final config with potentially updated layout and styling
    const finalConfig = ReportConfig.create({
      title: config.title,
      description: config.description,
      filters: config.filters,
      parameters: config.parameters,
      layout,
      styling,
    });

    return Report.create({
      title: request.title,
      description: request.description || template.description,
      config: finalConfig,
      isPublic: request.isPublic ?? false,
      templateId: template.id,
      createdBy: request.createdBy,
      organizationId: request.organizationId,
    });
  }

  /**
   * Validate a report configuration for completeness and correctness
   */
  public static validateReportConfiguration(
    config: ReportConfig,
    layout: ReportLayout,
    styling: ReportStyling
  ): ReportValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate config using public methods
    if (!config.isValidForPublishing()) {
      errors.push('Config validation: Configuration is not valid for publishing');
    }

    // Validate layout using public methods
    if (!layout.isValid()) {
      errors.push('Layout validation: Layout is not valid');
    }

    // Validate styling using public methods
    if (!styling.isValid()) {
      errors.push('Styling validation: Styling is not valid');
    }

    // Cross-validation between components
    this.validateLayoutComponentsWithConfig(layout, config, errors, warnings);
    this.validateStylingCompatibility(styling, layout, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Clone a report with modifications
   */
  public static cloneReport(
    originalReport: Report,
    newTitle: string,
    createdBy: UniqueId,
    modifications?: {
      description?: string;
      config?: Partial<ReportConfig>;
      layout?: Partial<ReportLayout>;
      styling?: Partial<ReportStyling>;
      isPublic?: boolean;
    }
  ): Report {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new ValidationError('title', 'New report title is required for cloning');
    }

    let config = originalReport.config;
    let layout = originalReport.config.layout;
    let styling = originalReport.config.styling;

    // Apply modifications if provided
    if (modifications?.config) {
      config = this.mergeReportConfig(config, modifications.config);
    }

    if (modifications?.layout) {
      layout = this.mergeReportLayout(layout, modifications.layout);
    }

    if (modifications?.styling) {
      styling = this.mergeReportStyling(styling, modifications.styling);
    }

    // Create final config with potentially updated layout and styling
    const finalConfig = ReportConfig.create({
      title: config.title,
      description: config.description,
      filters: config.filters,
      parameters: config.parameters,
      layout,
      styling,
    });

    return Report.create({
      title: newTitle,
      description: modifications?.description || originalReport.description,
      config: finalConfig,
      isPublic: modifications?.isPublic ?? originalReport.isPublic,
      templateId: originalReport.templateId || undefined,
      createdBy,
      organizationId: originalReport.organizationId || undefined,
    });
  }

  /**
   * Calculate report complexity score for performance optimization
   */
  public static calculateComplexityScore(
    config: ReportConfig,
    layout: ReportLayout
  ): number {
    let score = 0;

    // Base score from filters
    score += config.filters.length * 2;

    // Score from parameters
    score += config.parameters.length * 1;

    // Score from layout components
    score += layout.components.length * 3;

    // Additional score for complex component types
    layout.components.forEach(component => {
      switch (component.type) {
        case 'CHART':
          score += 5;
          break;
        case 'TABLE':
          score += 3;
          break;
        case 'IMAGE':
          score += 8;
          break;
        case 'METRIC':
          score += 10;
          break;
        default:
          score += 1;
      }
    });

    return score;
  }

  /**
   * Suggest optimizations for report performance
   */
  public static suggestOptimizations(
    config: ReportConfig,
    layout: ReportLayout
  ): string[] {
    const suggestions: string[] = [];
    const complexityScore = this.calculateComplexityScore(config, layout);

    if (complexityScore > 50) {
      suggestions.push('Consider reducing the number of components for better performance');
    }

    if (config.filters.length > 10) {
      suggestions.push('Too many filters may impact performance - consider grouping related filters');
    }

    if (layout.components.length > 15) {
      suggestions.push('Consider splitting this report into multiple smaller reports');
    }

    // Check for expensive component combinations
    const hasMultipleCharts = layout.components.filter(c => c.type === 'CHART').length > 3;
    const hasMetricComponents = layout.components.some(c => c.type === 'METRIC');
    
    if (hasMultipleCharts && hasMetricComponents) {
      suggestions.push('Multiple charts with metric components can be resource-intensive - consider pagination');
    }

    return suggestions;
  }

  // Private helper methods
  private static validateGenerationRequest(request: ReportGenerationRequest): void {
    if (!request.title || request.title.trim().length === 0) {
      throw new ValidationError('title', 'Report title is required');
    }

    if (!request.createdBy) {
      throw new ValidationError('createdBy', 'Creator is required');
    }
  }

  private static validateTemplateGenerationRequest(request: ReportFromTemplateRequest): void {
    if (!request.templateId) {
      throw new ValidationError('templateId', 'Template ID is required');
    }

    if (!request.title || request.title.trim().length === 0) {
      throw new ValidationError('title', 'Report title is required');
    }

    if (!request.createdBy) {
      throw new ValidationError('createdBy', 'Creator is required');
    }
  }

  private static validateTemplateUsage(
    template: ReportTemplate,
    createdBy: UniqueId,
    organizationId?: UniqueId
  ): void {
    if (!template.isActive) {
      throw new BusinessRuleViolationError('TEMPLATE_INACTIVE', 'Cannot create report from inactive template');
    }

    // Check if user has access to this template
    if (!template.isSystem) {
      const hasAccess = template.isCreatedBy(createdBy) || 
                       (organizationId && template.belongsToOrganization(organizationId));
      
      if (!hasAccess) {
        throw new BusinessRuleViolationError('TEMPLATE_ACCESS_DENIED', 'User does not have access to this template');
      }
    }
  }

  private static mergeReportConfig(base: ReportConfig, overrides: Partial<ReportConfig>): ReportConfig {
    return ReportConfig.create({
      title: overrides.title ?? base.title,
      description: overrides.description ?? base.description,
      filters: overrides.filters ?? base.filters,
      parameters: overrides.parameters ?? base.parameters,
      layout: overrides.layout ?? base.layout,
      styling: overrides.styling ?? base.styling,
    });
  }

  private static mergeReportLayout(base: ReportLayout, overrides: Partial<ReportLayout>): ReportLayout {
    return ReportLayout.create({
      components: overrides.components ?? base.components,
      grid: overrides.grid ?? base.grid,
    });
  }

  private static mergeReportStyling(base: ReportStyling, overrides: Partial<ReportStyling>): ReportStyling {
    return ReportStyling.create({
      theme: overrides.theme ?? base.theme,
      primaryColor: overrides.primaryColor ?? base.primaryColor,
      secondaryColor: overrides.secondaryColor ?? base.secondaryColor,
      fontFamily: overrides.fontFamily ?? base.fontFamily,
      fontSize: overrides.fontSize ?? base.fontSize,
    });
  }

  private static validateLayoutComponentsWithConfig(
    layout: ReportLayout,
    config: ReportConfig,
    errors: string[],
    warnings: string[]
  ): void {
    // Check if layout components reference valid config elements
    layout.components.forEach((component, index) => {
      if (component.config?.dataSource && !config.parameters.some((p: any) => p.name === component.config.dataSource)) {
        warnings.push(`Component ${index + 1} references unknown data source: ${component.config.dataSource}`);
      }
    });

    // Check for overlapping components
    const positions = layout.components.map(c => c.position);
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (this.positionsOverlap(positions[i], positions[j])) {
          warnings.push(`Components ${i + 1} and ${j + 1} have overlapping positions`);
        }
      }
    }
  }

  private static validateStylingCompatibility(
    styling: ReportStyling,
    layout: ReportLayout,
    errors: string[],
    warnings: string[]
  ): void {
    // Check color contrast
    if (styling.primaryColor === styling.secondaryColor) {
      warnings.push('Primary and secondary colors are the same - this may affect readability');
    }

    // Check font size for component density
    if (styling.fontSize < 12 && layout.components.length > 10) {
      warnings.push('Small font size with many components may affect readability');
    }
  }

  private static positionsOverlap(pos1: any, pos2: any): boolean {
    // Simple overlap detection - this would need to be implemented based on the actual Position interface
    return pos1.x < pos2.x + pos2.width &&
           pos1.x + pos1.width > pos2.x &&
           pos1.y < pos2.y + pos2.height &&
           pos1.y + pos1.height > pos2.y;
  }
}