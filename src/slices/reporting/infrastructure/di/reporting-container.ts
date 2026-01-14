import { Container } from 'inversify';
import { ReportTypes } from '@/shared/infrastructure/di/reporting.types';

// Domain Repositories
import { IReportRepository } from '@/shared/domain/reporting/repositories/report-repository';
import { IReportTemplateRepository } from '@/shared/domain/reporting/repositories/report-template-repository';
import { IScheduledReportRepository } from '@/shared/domain/reporting/repositories/scheduled-report-repository';

// Infrastructure Repositories
import { PrismaReportRepository } from '@/shared/infrastructure/reporting/repositories/prisma-report-repository';
import { PrismaReportTemplateRepository } from '@/shared/infrastructure/reporting/repositories/prisma-template.repository';
import { PrismaScheduledReportRepository } from '../../infrastructure/repositories/prisma-scheduled-report-repository';

// Application Handlers (Commands) - Reports
import { CreateReportHandler } from '@/shared/application/reporting/handlers/create-report.handler';
import { UpdateReportHandler } from '@/shared/application/reporting/handlers/update-report.handler';
import { DeleteReportHandler } from '@/shared/application/reporting/handlers/delete-report.handler';
import { PublishReportHandler } from '@/shared/application/reporting/handlers/publish-report.handler';
import { ArchiveReportHandler } from '@/shared/application/reporting/handlers/archive-report.handler';

// Application Handlers (Queries) - Reports
import { GetReportHandler } from '@/shared/application/reporting/handlers/get-report.handler';
import { ListReportsHandler } from '@/shared/application/reporting/handlers/list-reports.handler';
import { GetReportDataHandler } from '@/shared/application/reporting/handlers/get-report-data.handler';

// Application Handlers (Commands) - Templates
import { CreateTemplateHandler } from '@/shared/application/reporting/templates/handlers/create-template.handler';
import { UpdateTemplateHandler } from '@/shared/application/reporting/templates/handlers/update-template.handler';
import { DeleteTemplateHandler } from '@/shared/application/reporting/templates/handlers/delete-template.handler';
import { UseTemplateHandler } from '@/shared/application/reporting/templates/handlers/use-template.handler';

// Application Handlers (Queries) - Templates
import { GetTemplateHandler } from '@/shared/application/reporting/templates/handlers/get-template.handler';
import { ListTemplatesHandler } from '@/shared/application/reporting/templates/handlers/list-templates.handler';

// Application Handlers (Commands) - Scheduled Reports
import { CreateScheduledReportHandler } from '../../../application/handlers/create-scheduled-report-handler';
import { ActivateScheduledReportHandler } from '../../../application/handlers/activate-scheduled-report-handler';
import { CancelScheduledReportHandler } from '../../../application/handlers/cancel-scheduled-report-handler';
import { ExecuteScheduledReportHandler } from '../../../application/handlers/execute-scheduled-report-handler';
import { GetScheduledReportRunsHandler } from '../../../application/handlers/get-scheduled-report-runs-handler';
import { GetScheduledReportStatsHandler } from '../../../application/handlers/get-scheduled-report-stats-handler';

// Presentation Controllers
import { ReportsApiController } from '../../../reports/presentation/controllers/reports-api.controller';
import { ReportTemplatesApiController } from '../../../reports/presentation/controllers/report-templates-api.controller';
import { ScheduledReportsApiController } from '../../../presentation/api/scheduled-reports-api.controller';
import { ExportsApiController } from '../../../presentation/controllers/exports-api.controller';

// Export Handlers
import { CreateExportJobHandler } from '../../../application/handlers/create-export-job-handler';
import { CancelExportJobHandler } from '../../../application/handlers/cancel-export-job-handler';
import { RetryExportJobHandler } from '../../../application/handlers/retry-export-job-handler';
import { DeleteExportJobHandler } from '../../../application/handlers/delete-export-job-handler';
import { BulkDeleteExportJobsHandler } from '../../../application/handlers/bulk-delete-export-jobs-handler';
import { GenerateDirectExportHandler } from '../../../application/handlers/generate-direct-export-handler';
import { GetExportJobHandler } from '../../../application/handlers/get-export-job-handler';
import { GetExportJobsHandler } from '../../../application/handlers/get-export-jobs-handler';
import { DownloadExportFileHandler } from '../../../application/handlers/download-export-file-handler';

// Export Repository
import { IExportJobRepository } from '@/shared/domain/reporting/repositories/export-job-repository';
import { PrismaExportJobRepository } from '@/shared/infrastructure/reporting/repositories/prisma-export-job-repository';

// External
import { PrismaClient } from '@prisma/client';
import { TYPES } from '@/shared/infrastructure/di/types';

/**
 * Reporting Dependency Injection Container
 * Configures all dependencies for the reporting vertical slice
 */
export function configureReportingContainer(container: Container): void {
  // Get Prisma client from container
  const prismaClient = container.get<PrismaClient>(Symbol.for('PrismaClient'));

  // Repository
  container.bind<IReportRepository>(ReportTypes.ReportRepository).toDynamicValue(() => {
    return new PrismaReportRepository();
  });

  // Template Repository
  container.bind<IReportTemplateRepository>(ReportTypes.ReportTemplateRepository).toDynamicValue(() => {
    return new PrismaReportTemplateRepository();
  });

  // Command Handlers - Reports
  container.bind<CreateReportHandler>(ReportTypes.CreateReportHandler).toDynamicValue(() => {
    const repo = container.get<IReportRepository>(ReportTypes.ReportRepository);
    return new CreateReportHandler(repo);
  });

  container.bind<UpdateReportHandler>(ReportTypes.UpdateReportHandler).toDynamicValue(() => {
    const repo = container.get<IReportRepository>(ReportTypes.ReportRepository);
    return new UpdateReportHandler(repo);
  });

  container.bind<DeleteReportHandler>(ReportTypes.DeleteReportHandler).toDynamicValue(() => {
    const repo = container.get<IReportRepository>(ReportTypes.ReportRepository);
    return new DeleteReportHandler(repo);
  });

  container.bind<PublishReportHandler>(ReportTypes.PublishReportHandler).toDynamicValue(() => {
    const repo = container.get<IReportRepository>(ReportTypes.ReportRepository);
    return new PublishReportHandler(repo);
  });

  container.bind<ArchiveReportHandler>(ReportTypes.ArchiveReportHandler).toDynamicValue(() => {
    const repo = container.get<IReportRepository>(ReportTypes.ReportRepository);
    return new ArchiveReportHandler(repo);
  });

  // Query Handlers
  container.bind<GetReportHandler>(ReportTypes.GetReportHandler).toDynamicValue(() => {
    const repo = container.get<IReportRepository>(ReportTypes.ReportRepository);
    return new GetReportHandler(repo);
  });

  container.bind<ListReportsHandler>(ReportTypes.ListReportsHandler).toDynamicValue(() => {
    const repo = container.get<IReportRepository>(ReportTypes.ReportRepository);
    return new ListReportsHandler(repo);
  });

  container.bind<GetReportDataHandler>(ReportTypes.GetReportDataHandler).toDynamicValue(() => {
    const repo = container.get<IReportRepository>(ReportTypes.ReportRepository);
    return new GetReportDataHandler(repo);
  });

  // Command Handlers - Templates
  container.bind<CreateTemplateHandler>(ReportTypes.CreateTemplateHandler).toDynamicValue(() => {
    const repo = container.get<IReportTemplateRepository>(ReportTypes.ReportTemplateRepository);
    return new CreateTemplateHandler(repo);
  });

  container.bind<UpdateTemplateHandler>(ReportTypes.UpdateTemplateHandler).toDynamicValue(() => {
    const repo = container.get<IReportTemplateRepository>(ReportTypes.ReportTemplateRepository);
    return new UpdateTemplateHandler(repo);
  });

  container.bind<DeleteTemplateHandler>(ReportTypes.DeleteTemplateHandler).toDynamicValue(() => {
    const repo = container.get<IReportTemplateRepository>(ReportTypes.ReportTemplateRepository);
    return new DeleteTemplateHandler(repo);
  });

  container.bind<UseTemplateHandler>(ReportTypes.UseTemplateHandler).toDynamicValue(() => {
    const templateRepo = container.get<IReportTemplateRepository>(ReportTypes.ReportTemplateRepository);
    const reportRepo = container.get<IReportRepository>(ReportTypes.ReportRepository);
    return new UseTemplateHandler(templateRepo, reportRepo);
  });

  // Query Handlers - Templates
  container.bind<GetTemplateHandler>(ReportTypes.GetTemplateHandler).toDynamicValue(() => {
    const repo = container.get<IReportTemplateRepository>(ReportTypes.ReportTemplateRepository);
    return new GetTemplateHandler(repo);
  });

  container.bind<ListTemplatesHandler>(ReportTypes.ListTemplatesHandler).toDynamicValue(() => {
    const repo = container.get<IReportTemplateRepository>(ReportTypes.ReportTemplateRepository);
    return new ListTemplatesHandler(repo);
  });

  // Controllers
  container.bind<ReportsApiController>(ReportTypes.ReportsApiController).toDynamicValue(() => {
    const createHandler = container.get<CreateReportHandler>(ReportTypes.CreateReportHandler);
    const updateHandler = container.get<UpdateReportHandler>(ReportTypes.UpdateReportHandler);
    const deleteHandler = container.get<DeleteReportHandler>(ReportTypes.DeleteReportHandler);
    const listHandler = container.get<ListReportsHandler>(ReportTypes.ListReportsHandler);
    const getHandler = container.get<GetReportHandler>(ReportTypes.GetReportHandler);

    return new ReportsApiController(
      createHandler,
      updateHandler,
      deleteHandler,
      listHandler,
      getHandler
    );
  });

  // Templates Controller
  container.bind<ReportTemplatesApiController>(ReportTypes.ReportTemplatesApiController).toDynamicValue(() => {
    const createTemplateHandler = container.get<CreateTemplateHandler>(ReportTypes.CreateTemplateHandler);
    const updateTemplateHandler = container.get<UpdateTemplateHandler>(ReportTypes.UpdateTemplateHandler);
    const deleteTemplateHandler = container.get<DeleteTemplateHandler>(ReportTypes.DeleteTemplateHandler);
    const useTemplateHandler = container.get<UseTemplateHandler>(ReportTypes.UseTemplateHandler);
    const getTemplateHandler = container.get<GetTemplateHandler>(ReportTypes.GetTemplateHandler);
    const listTemplatesHandler = container.get<ListTemplatesHandler>(ReportTypes.ListTemplatesHandler);

    return new ReportTemplatesApiController(
      createTemplateHandler,
      updateTemplateHandler,
      deleteTemplateHandler,
      useTemplateHandler,
      getTemplateHandler,
      listTemplatesHandler
    );
  });

  // Scheduled Reports Repository
  container.bind<IScheduledReportRepository>(ReportTypes.ScheduledReportRepository).toDynamicValue(() => {
    return new PrismaScheduledReportRepository();
  });

  // Command Handlers - Scheduled Reports
  container.bind<CreateScheduledReportHandler>(ReportTypes.CreateScheduledReportHandler).toDynamicValue(() => {
    const scheduledReportRepo = container.get<IScheduledReportRepository>(ReportTypes.ScheduledReportRepository);
    const reportRepo = container.get<IReportRepository>(ReportTypes.ReportRepository);
    return new CreateScheduledReportHandler(scheduledReportRepo, reportRepo);
  });

  container.bind<ActivateScheduledReportHandler>(ReportTypes.ActivateScheduledReportHandler).toDynamicValue(() => {
    const scheduledReportRepo = container.get<IScheduledReportRepository>(ReportTypes.ScheduledReportRepository);
    return new ActivateScheduledReportHandler(scheduledReportRepo);
  });

  container.bind<CancelScheduledReportHandler>(ReportTypes.CancelScheduledReportHandler).toDynamicValue(() => {
    const scheduledReportRepo = container.get<IScheduledReportRepository>(ReportTypes.ScheduledReportRepository);
    return new CancelScheduledReportHandler(scheduledReportRepo);
  });

  container.bind<ExecuteScheduledReportHandler>(ReportTypes.ExecuteScheduledReportHandler).toDynamicValue(() => {
    const scheduledReportRepo = container.get<IScheduledReportRepository>(ReportTypes.ScheduledReportRepository);
    return new ExecuteScheduledReportHandler(scheduledReportRepo);
  });

  container.bind<GetScheduledReportRunsHandler>(ReportTypes.GetScheduledReportRunsHandler).toDynamicValue(() => {
    const scheduledReportRepo = container.get<IScheduledReportRepository>(ReportTypes.ScheduledReportRepository);
    return new GetScheduledReportRunsHandler(scheduledReportRepo);
  });

  container.bind<GetScheduledReportStatsHandler>(ReportTypes.GetScheduledReportStatsHandler).toDynamicValue(() => {
    const scheduledReportRepo = container.get<IScheduledReportRepository>(ReportTypes.ScheduledReportRepository);
    return new GetScheduledReportStatsHandler(scheduledReportRepo);
  });

  // Scheduled Reports Controller
  container.bind<ScheduledReportsApiController>(ReportTypes.ScheduledReportsApiController).toDynamicValue(() => {
    const createScheduledReportHandler = container.get<CreateScheduledReportHandler>(ReportTypes.CreateScheduledReportHandler);
    const activateScheduledReportHandler = container.get<ActivateScheduledReportHandler>(ReportTypes.ActivateScheduledReportHandler);
    const cancelScheduledReportHandler = container.get<CancelScheduledReportHandler>(ReportTypes.CancelScheduledReportHandler);
    const executeScheduledReportHandler = container.get<ExecuteScheduledReportHandler>(ReportTypes.ExecuteScheduledReportHandler);
    const getScheduledReportRunsHandler = container.get<GetScheduledReportRunsHandler>(ReportTypes.GetScheduledReportRunsHandler);
    const getScheduledReportStatsHandler = container.get<GetScheduledReportStatsHandler>(ReportTypes.GetScheduledReportStatsHandler);

    return new ScheduledReportsApiController(
      createScheduledReportHandler,
      activateScheduledReportHandler,
      cancelScheduledReportHandler,
      executeScheduledReportHandler,
      getScheduledReportRunsHandler,
      getScheduledReportStatsHandler
    );
  });

  // Export Repository
  container.bind<IExportJobRepository>(TYPES.ExportJobRepository).toDynamicValue(() => {
    const prismaClient = container.get<PrismaClient>(Symbol.for('PrismaClient'));
    return new PrismaExportJobRepository(prismaClient);
  });

  // Export Command Handlers
  container.bind<CreateExportJobHandler>(TYPES.CreateExportJobHandler).toDynamicValue(() => {
    const exportJobRepository = container.get<IExportJobRepository>(TYPES.ExportJobRepository);
    return new CreateExportJobHandler(exportJobRepository);
  });

  container.bind<CancelExportJobHandler>(TYPES.CancelExportJobHandler).toDynamicValue(() => {
    const exportJobRepository = container.get<IExportJobRepository>(TYPES.ExportJobRepository);
    return new CancelExportJobHandler(exportJobRepository);
  });

  container.bind<RetryExportJobHandler>(TYPES.RetryExportJobHandler).toDynamicValue(() => {
    const exportJobRepository = container.get<IExportJobRepository>(TYPES.ExportJobRepository);
    return new RetryExportJobHandler(exportJobRepository);
  });

  container.bind<DeleteExportJobHandler>(TYPES.DeleteExportJobHandler).toDynamicValue(() => {
    const exportJobRepository = container.get<IExportJobRepository>(TYPES.ExportJobRepository);
    return new DeleteExportJobHandler(exportJobRepository);
  });

  container.bind<BulkDeleteExportJobsHandler>(TYPES.BulkDeleteExportJobsHandler).toDynamicValue(() => {
    const exportJobRepository = container.get<IExportJobRepository>(TYPES.ExportJobRepository);
    return new BulkDeleteExportJobsHandler(exportJobRepository);
  });

  container.bind<GenerateDirectExportHandler>(TYPES.GenerateDirectExportHandler).toDynamicValue(() => {
    return new GenerateDirectExportHandler();
  });

  // Export Query Handlers
  container.bind<GetExportJobHandler>(TYPES.GetExportJobHandler).toDynamicValue(() => {
    const exportJobRepository = container.get<IExportJobRepository>(TYPES.ExportJobRepository);
    return new GetExportJobHandler(exportJobRepository);
  });

  container.bind<GetExportJobsHandler>(TYPES.GetExportJobsHandler).toDynamicValue(() => {
    const exportJobRepository = container.get<IExportJobRepository>(TYPES.ExportJobRepository);
    return new GetExportJobsHandler(exportJobRepository);
  });

  container.bind<DownloadExportFileHandler>(TYPES.DownloadExportFileHandler).toDynamicValue(() => {
    const exportJobRepository = container.get<IExportJobRepository>(TYPES.ExportJobRepository);
    return new DownloadExportFileHandler(exportJobRepository);
  });

  // Exports API Controller
  container.bind<ExportsApiController>(TYPES.ExportsApiController).toDynamicValue(() => {
    const createExportJobHandler = container.get<CreateExportJobHandler>(TYPES.CreateExportJobHandler);
    const cancelExportJobHandler = container.get<CancelExportJobHandler>(TYPES.CancelExportJobHandler);
    const retryExportJobHandler = container.get<RetryExportJobHandler>(TYPES.RetryExportJobHandler);
    const deleteExportJobHandler = container.get<DeleteExportJobHandler>(TYPES.DeleteExportJobHandler);
    const bulkDeleteExportJobsHandler = container.get<BulkDeleteExportJobsHandler>(TYPES.BulkDeleteExportJobsHandler);
    const generateDirectExportHandler = container.get<GenerateDirectExportHandler>(TYPES.GenerateDirectExportHandler);
    const getExportJobHandler = container.get<GetExportJobHandler>(TYPES.GetExportJobHandler);
    const getExportJobsHandler = container.get<GetExportJobsHandler>(TYPES.GetExportJobsHandler);
    const downloadExportFileHandler = container.get<DownloadExportFileHandler>(TYPES.DownloadExportFileHandler);

    return new ExportsApiController(
      createExportJobHandler,
      cancelExportJobHandler,
      retryExportJobHandler,
      deleteExportJobHandler,
      bulkDeleteExportJobsHandler,
      generateDirectExportHandler,
      getExportJobHandler,
      getExportJobsHandler,
      downloadExportFileHandler
    );
  });
}
