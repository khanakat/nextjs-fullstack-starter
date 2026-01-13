import { ApplicationService } from '../../../../shared/application/base/application-service';
import { Result } from '../../../../shared/application/base/result';
import { ReportDto } from '../dtos/report-dto';
import { ReportTemplateDto } from '../dtos/report-template-dto';
import { ScheduledReportDto, DeliveryConfigDto } from '../dtos/scheduled-report-dto';
import { CreateReportCommand } from '../commands/create-report-command';
import { CreateTemplateCommand } from '../commands/create-template-command';
import { CreateScheduledReportCommand } from '../commands/create-scheduled-report-command';
import { TemplateManagementUseCase } from '../use-cases/template-management-use-case';
import { ScheduledReportUseCase } from '../use-cases/scheduled-report-use-case';
import { CreateReportHandler } from '../handlers/create-report-handler';
import { IReportRepository } from '../../../../shared/domain/reporting/repositories/report-repository';
import { IReportTemplateRepository } from '../../../../shared/domain/reporting/repositories/report-template-repository';
import { IScheduledReportRepository } from '../../../../shared/domain/reporting/repositories/scheduled-report-repository';
import { UniqueId } from '../../../../shared/domain/value-objects/unique-id';
import { PaginatedResult } from '../../../../shared/application/base/paginated-result';
import { TemplateType, TemplateCategory } from '../../../../shared/domain/reporting/entities/report-template';
import { ReportStatus } from '../../../../shared/domain/reporting/value-objects/report-status';
import { ScheduleFrequency, ScheduledReportStatus } from '../../../../shared/domain/reporting/entities/scheduled-report';

/**
 * Application service for orchestrating complex reporting operations
 * Coordinates multiple use cases and handles cross-cutting concerns
 */
export class ReportOrchestrationService extends ApplicationService {
  constructor(
    private readonly reportRepository: IReportRepository,
    private readonly templateRepository: IReportTemplateRepository,
    private readonly scheduledReportRepository: IScheduledReportRepository,
    private readonly templateManagementUseCase: TemplateManagementUseCase,
    private readonly scheduledReportUseCase: ScheduledReportUseCase,
    private readonly createReportHandler: CreateReportHandler
  ) {
    super();
  }

  /**
   * Create a report from a template with validation and setup
   */
  async createReportFromTemplate(
    templateId: string,
    reportData: {
      title: string;
      description?: string;
      isPublic: boolean;
      userId: string;
      organizationId?: string;
      customizations?: any;
    }
  ): Promise<Result<ReportDto>> {
    try {
      return await this.execute(async () => {
        // Get the template
        const templateResult = await this.templateManagementUseCase.getTemplate(templateId);
        if (templateResult.isFailure) {
          throw new Error('Template not found');
        }

        // Merge template configuration with customizations
        const mergedConfig = this.mergeTemplateConfig(
          templateResult.value.config,
          reportData.customizations
        );

        // Create report command
        const createCommand = new CreateReportCommand(
          reportData.title,
          mergedConfig,
          reportData.isPublic,
          reportData.userId,
          reportData.organizationId,
          reportData.description
        );

        // Create the report
        return await this.createReportHandler.handle(createCommand);
      });
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error('Failed to create report from template'));
    }
  }

  /**
   * Create a template from an existing report
   */
  async createTemplateFromReport(
    reportId: string,
    templateData: {
      name: string;
      description?: string;
      type: string;
      category: string;
      tags?: string[];
      previewImageUrl?: string;
      userId: string;
      organizationId?: string;
    }
  ): Promise<Result<ReportTemplateDto>> {
    try {
      const result = await this.execute(async () => {
        // Get the report
        const report = await this.reportRepository.findById(UniqueId.create(reportId));
        if (!report) {
          throw new Error(`Report with ID ${reportId} not found`);
        }

        // Check if user has permission to create template from this report
        if (report.createdBy.id !== templateData.userId) {
          throw new Error('You do not have permission to create a template from this report');
        }

        // Create template command with report's configuration
        const createTemplateCommand = new CreateTemplateCommand(
          templateData.name,
          templateData.type as TemplateType,
          templateData.category as TemplateCategory,
          this.convertConfigToDto(report.config),
          templateData.tags || [],
          templateData.userId,
          templateData.description,
          templateData.previewImageUrl,
          templateData.organizationId
        );

        // Create the template
        return await this.templateManagementUseCase.createTemplate(createTemplateCommand);
      });
      
      return result;
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error('Failed to create template from report'));
    }
  }

  /**
   * Setup automated reporting workflow
   */
  async setupAutomatedReporting(
    reportId: string,
    scheduleConfig: {
      name: string;
      frequency: string;
      timezone: string;
      deliveryConfig: {
        method: string;
        recipients: string[];
        subject?: string;
        message?: string;
        format: string;
        includeData: boolean;
        compression?: string;
      };
      userId: string;
      organizationId?: string;
    }
  ): Promise<Result<{
    report: ReportDto;
    scheduledReport: ScheduledReportDto;
  }>> {
    try {
      const result = await this.execute(async () => {
        // Verify report exists and user has access
        const report = await this.reportRepository.findById(UniqueId.create(reportId));
        if (!report) {
          throw new Error(`Report with ID ${reportId} not found`);
        }

        if (report.createdBy.id !== scheduleConfig.userId) {
          throw new Error('You do not have permission to schedule this report');
        }

        // Ensure report is published before scheduling
        if (!report.status.isPublished()) {
          throw new Error('Only published reports can be scheduled');
        }

        // Create scheduled report command
        const createScheduledCommand = new CreateScheduledReportCommand(
          scheduleConfig.name,
          reportId,
          scheduleConfig.frequency as ScheduleFrequency,
          scheduleConfig.timezone,
          this.convertToDeliveryConfigDto(scheduleConfig.deliveryConfig),
          scheduleConfig.userId,
          scheduleConfig.organizationId
        );

        // Create the scheduled report
        const scheduledReportResult = await this.scheduledReportUseCase.createScheduledReport(createScheduledCommand);
        if (!scheduledReportResult.isSuccess) {
          throw new Error(`Failed to create scheduled report: ${scheduledReportResult.error}`);
        }

        // Convert report to DTO
        const reportDto = this.convertReportToDto(report);

        return {
          report: reportDto,
          scheduledReport: scheduledReportResult.value,
        };
      });
      
      return Result.success(result);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error('Failed to setup automated reporting'));
    }
  }

  /**
   * Get comprehensive reporting dashboard data
   */
  async getReportingDashboard(
    userId: string,
    organizationId?: string
  ): Promise<Result<{
    recentReports: ReportDto[];
    popularTemplates: ReportTemplateDto[];
    activeScheduledReports: ScheduledReportDto[];
    statistics: {
      totalReports: number;
      publishedReports: number;
      totalTemplates: number;
      activeSchedules: number;
      reportsThisMonth: number;
      executionsThisMonth: number;
    };
  }>> {
    try {
      const result = await this.execute(async () => {
        // Get recent reports
        const recentReports = await this.reportRepository.getRecentReports(
          10,
          organizationId ? UniqueId.create(organizationId) : undefined
        );

        // Get popular templates
        const popularTemplates = await this.templateRepository.findPopularTemplates(
          10,
          organizationId ? UniqueId.create(organizationId) : undefined
        );

        // Get active scheduled reports
        const activeScheduledResult = await this.scheduledReportRepository.findActiveReports({
          limit: 10,
          sortBy: 'nextExecutionAt',
          sortOrder: 'asc',
        });

        // Get statistics
        const statistics = await this.getReportingStatistics(userId, organizationId);

        return {
          recentReports: recentReports.map(r => this.convertReportToDto(r)),
          popularTemplates: popularTemplates.map(t => this.convertTemplateToDto(t)),
          activeScheduledReports: activeScheduledResult.scheduledReports.map(s => this.convertScheduledReportToDto(s)),
          statistics,
        };
      });
      
      return Result.success(result);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error('Failed to get reporting dashboard'));
    }
  }

  /**
   * Bulk operations for reports
   */
  async bulkUpdateReports(
    reportIds: string[],
    updates: {
      isPublic?: boolean;
      status?: string;
      tags?: string[];
    },
    userId: string
  ): Promise<Result<{
    updated: string[];
    failed: { id: string; reason: string }[];
  }>> {
    try {
      const result = await this.execute(async () => {
        const updated: string[] = [];
        const failed: { id: string; reason: string }[] = [];

        for (const reportId of reportIds) {
          try {
            const report = await this.reportRepository.findById(UniqueId.create(reportId));
            
            if (!report) {
              failed.push({ id: reportId, reason: 'Report not found' });
              continue;
            }

            if (report.createdBy.id !== userId) {
              failed.push({ id: reportId, reason: 'Permission denied' });
              continue;
            }

            // Apply updates
            if (updates.isPublic !== undefined) {
              report.updateVisibility(updates.isPublic);
            }

            if (updates.status) {
              // Apply status changes based on current state
              switch (updates.status) {
                case 'PUBLISHED':
                  report.publish();
                  break;
                case 'ARCHIVED':
                  report.archive();
                  break;
                // Add other status transitions as needed
              }
            }

            // Save the updated report
            await this.reportRepository.save(report);
            updated.push(reportId);

          } catch (error) {
            failed.push({ 
              id: reportId, 
              reason: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        }

        return { updated, failed };
      });
      
      return Result.success(result);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error('Failed to bulk update reports'));
    }
  }

  private async getReportingStatistics(userId: string, organizationId?: string): Promise<{
    totalReports: number;
    publishedReports: number;
    totalTemplates: number;
    activeSchedules: number;
    reportsThisMonth: number;
    executionsThisMonth: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get counts from repositories
    const userIdObj = UniqueId.create(userId);
    const totalReports = await this.reportRepository.count({
      createdBy: userIdObj,
      organizationId: organizationId ? UniqueId.create(organizationId) : undefined,
    });

    const publishedReports = await this.reportRepository.count({
      createdBy: userIdObj,
      status: ReportStatus.published(),
      organizationId: organizationId ? UniqueId.create(organizationId) : undefined,
    });

    const totalTemplates = await this.templateRepository.count({
      createdBy: userIdObj,
      isActive: true,
      organizationId: organizationId ? UniqueId.create(organizationId) : undefined,
    });

    const activeSchedules = await this.scheduledReportRepository.count({
      createdBy: userIdObj,
      status: ScheduledReportStatus.ACTIVE,
      organizationId: organizationId ? UniqueId.create(organizationId) : undefined,
    });

    const reportsThisMonth = await this.reportRepository.count({
      createdBy: userIdObj,
      createdAfter: startOfMonth,
      organizationId: organizationId ? UniqueId.create(organizationId) : undefined,
    });

    // Get execution count from scheduled reports
    const scheduledReportStats = await this.scheduledReportRepository.getScheduledReportStatistics(
      organizationId ? UniqueId.create(organizationId) : undefined
    );
    const executionsThisMonth = scheduledReportStats.executionsThisMonth;

    return {
      totalReports,
      publishedReports,
      totalTemplates,
      activeSchedules,
      reportsThisMonth,
      executionsThisMonth,
    };
  }

  private mergeTemplateConfig(templateConfig: any, customizations?: any): any {
    if (!customizations) {
      return templateConfig;
    }

    // Deep merge template config with customizations
    return {
      ...templateConfig,
      ...customizations,
      layout: {
        ...templateConfig.layout,
        ...customizations.layout,
      },
      styling: {
        ...templateConfig.styling,
        ...customizations.styling,
      },
    };
  }

  private convertReportToDto(report: any): ReportDto {
    return new ReportDto(
      report.id.value,
      report.title,
      report.status?.toString ? report.status.toString() : report.status,
      report.isPublic,
      report.createdBy.value,
      this.convertConfigToDto(report.config),
      report.createdAt,
      report.updatedAt,
      report.description,
      report.templateId?.value,
      report.organizationId?.value,
      report.publishedAt,
      report.archivedAt
    );
  }

  private convertTemplateToDto(template: any): ReportTemplateDto {
    return new ReportTemplateDto(
      template.id.value,
      template.name,
      template.type,
      template.category,
      template.isSystem,
      template.isActive,
      template.createdBy.value,
      template.config,
      template.createdAt,
      template.updatedAt,
      template.description,
      template.tags,
      template.previewImageUrl,
      template.organizationId?.value,
      template.usageCount,
      template.lastUsedAt
    );
  }

  private convertScheduledReportToDto(scheduledReport: any): ScheduledReportDto {
    return new ScheduledReportDto(
      scheduledReport.id.value,
      scheduledReport.name,
      scheduledReport.reportId.value,
      scheduledReport.frequency,
      scheduledReport.isActive,
      scheduledReport.nextExecutionAt,
      scheduledReport.createdBy.value,
      scheduledReport.organizationId?.value,
      scheduledReport.timezone,
      scheduledReport.deliveryConfig,
      scheduledReport.createdAt,
      scheduledReport.updatedAt,
      scheduledReport.lastExecutionAt,
      scheduledReport.executionCount,
      scheduledReport.failureCount,
      scheduledReport.executionHistory
    );
  }

  private convertConfigToDto(config: any): any {
    return {
      layout: config.layout ? {
        type: config.layout.type,
        columns: config.layout.columns,
        rows: config.layout.rows,
        components: config.layout.components
      } : undefined,
      styling: config.styling ? {
        theme: config.styling.theme,
        colors: config.styling.colors,
        fonts: config.styling.fonts,
        spacing: config.styling.spacing
      } : undefined,
      dataSource: config.dataSource,
      filters: config.filters,
      parameters: config.parameters,
      exportOptions: config.exportOptions,
      caching: config.caching,
      security: config.security
    };
  }

  private convertToDeliveryConfigDto(deliveryConfig: any): DeliveryConfigDto {
    // Map method to expected DTO format
    const methodMapping: Record<string, 'email' | 'webhook' | 'file_system' | 'cloud_storage'> = {
      'EMAIL': 'email',
      'WEBHOOK': 'webhook',
      'DOWNLOAD': 'file_system',
      'CLOUD_STORAGE': 'cloud_storage'
    };

    // Map format to expected DTO format
    const formatMapping: Record<string, 'pdf' | 'excel' | 'csv' | 'json'> = {
      'PDF': 'pdf',
      'EXCEL': 'excel',
      'CSV': 'csv',
      'JSON': 'json'
    };

    return new DeliveryConfigDto(
      methodMapping[deliveryConfig.method?.toUpperCase()] || 'email',
      deliveryConfig.recipients || [],
      formatMapping[deliveryConfig.format?.toUpperCase()] || 'pdf',
      {
        includeData: deliveryConfig.includeData || false,
        compression: deliveryConfig.compression,
        subject: deliveryConfig.subject,
        message: deliveryConfig.message
      }
    );
  }
}