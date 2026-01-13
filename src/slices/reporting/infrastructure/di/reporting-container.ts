import { Container } from 'inversify';
import { TYPES } from '@/shared/infrastructure/di/types';

// Domain Repositories
import { IReportRepository } from '@/shared/domain/reporting/repositories/report-repository';
import { IReportTemplateRepository } from '@/shared/domain/reporting/repositories/report-template-repository';
import { IScheduledReportRepository } from '@/shared/domain/reporting/repositories/scheduled-report-repository';

// Infrastructure Repositories
import { PrismaReportRepository } from '../repositories/prisma-report-repository';
import { PrismaReportTemplateRepository } from '../repositories/prisma-report-template-repository';
import { PrismaScheduledReportRepository } from '../repositories/prisma-scheduled-report-repository';

// Application Handlers (Commands)
import { CreateReportHandler } from '../../application/handlers/create-report-handler';
import { UpdateReportHandler } from '../../application/handlers/update-report-handler';
import { PublishReportHandler } from '../../application/handlers/publish-report-handler';
import { ArchiveReportHandler } from '../../application/handlers/archive-report-handler';
import { DeleteReportHandler } from '../../application/handlers/delete-report-handler';
import { CreateScheduledReportHandler } from '../../application/handlers/create-scheduled-report-handler';
import { CreateTemplateHandler } from '../../application/handlers/create-template-handler';

// Application Handlers (Queries)
import { GetReportHandler } from '../../application/query-handlers/get-report-handler';
import { GetReportsHandler } from '../../application/query-handlers/get-reports-handler';
import { GetScheduledReportHandler } from '../../application/query-handlers/get-scheduled-report-handler';
import { GetScheduledReportsHandler } from '../../application/query-handlers/get-scheduled-reports-handler';
import { GetTemplateHandler } from '../../application/query-handlers/get-template-handler';
import { GetTemplatesHandler } from '../../application/query-handlers/get-templates-handler';

// Application Use Cases
import { ReportManagementUseCase } from '../../application/use-cases/report-management-use-case';
import { ScheduledReportUseCase } from '../../application/use-cases/scheduled-report-use-case';
import { TemplateManagementUseCase } from '../../application/use-cases/template-management-use-case';

// Application Services
import { ReportExportService } from '../../application/services/report-export-service';
import { ReportOrchestrationService } from '../../application/services/report-orchestration-service';

// Infrastructure Services
import { ReportSchedulerService } from '../services/report-scheduler-service';
import { EmailNotificationService } from '../services/email-notification-service';
import { FileStorageService } from '../services/file-storage-service';

// Presentation Controllers
import { ReportsController } from '../../presentation/controllers/reports-controller';
import { TemplatesController } from '../../presentation/controllers/templates-controller';
import { ScheduledReportsController } from '../../presentation/controllers/scheduled-reports-controller';
import { ExportsController } from '../../presentation/controllers/exports-controller';

// External
import { PrismaClient } from '@prisma/client';

/**
 * Reporting Dependency Injection Container
 * Configures all dependencies for the reporting vertical slice
 */
export function configureReportingContainer(container: Container): void {
  // Repositories
  container.bind<IReportRepository>(TYPES.ReportRepository).to(PrismaReportRepository);
  container.bind<IReportTemplateRepository>(TYPES.ReportTemplateRepository).to(PrismaReportTemplateRepository);
  container.bind<IScheduledReportRepository>(TYPES.ScheduledReportRepository).to(PrismaScheduledReportRepository);

  // Command Handlers
  container.bind<CreateReportHandler>(TYPES.CreateReportHandler).to(CreateReportHandler);
  container.bind<UpdateReportHandler>(TYPES.UpdateReportHandler).to(UpdateReportHandler);
  container.bind<PublishReportHandler>(TYPES.PublishReportHandler).to(PublishReportHandler);
  container.bind<ArchiveReportHandler>(TYPES.ArchiveReportHandler).to(ArchiveReportHandler);
  container.bind<DeleteReportHandler>(TYPES.DeleteReportHandler).to(DeleteReportHandler);
  container.bind<CreateScheduledReportHandler>(TYPES.CreateScheduledReportHandler).to(CreateScheduledReportHandler);
  container.bind<CreateTemplateHandler>(TYPES.CreateTemplateHandler).to(CreateTemplateHandler);

  // Query Handlers
  container.bind<GetReportHandler>(TYPES.GetReportHandler).to(GetReportHandler);
  container.bind<GetReportsHandler>(TYPES.GetReportsHandler).to(GetReportsHandler);
  container.bind<GetScheduledReportHandler>(TYPES.GetScheduledReportHandler).to(GetScheduledReportHandler);
  container.bind<GetScheduledReportsHandler>(TYPES.GetScheduledReportsHandler).to(GetScheduledReportsHandler);
  container.bind<GetTemplateHandler>(TYPES.GetTemplateHandler).to(GetTemplateHandler);
  container.bind<GetTemplatesHandler>(TYPES.GetTemplatesHandler).to(GetTemplatesHandler);

  // Use Cases
  container.bind<ReportManagementUseCase>(TYPES.ReportManagementUseCase).to(ReportManagementUseCase);
  container.bind<ScheduledReportUseCase>(TYPES.ScheduledReportUseCase).to(ScheduledReportUseCase);
  container.bind<TemplateManagementUseCase>(TYPES.TemplateManagementUseCase).to(TemplateManagementUseCase);

  // Services
  container.bind<ReportExportService>(TYPES.ReportExportService).to(ReportExportService);
  container.bind<ReportOrchestrationService>(TYPES.ReportOrchestrationService).to(ReportOrchestrationService);
  container.bind<ReportSchedulerService>(TYPES.ReportSchedulerService).to(ReportSchedulerService).inSingletonScope();

  // Infrastructure services bindings as constants (simple constructors)
  container.bind<FileStorageService>(TYPES.FileStorageService).toDynamicValue(() => {
    const baseUrl = process.env.STORAGE_BASE_URL || 'http://localhost:3000/storage';
    const bucket = process.env.STORAGE_BUCKET_NAME || 'reports-bucket';
    return new FileStorageService(null, bucket, baseUrl);
  });

  container.bind<EmailNotificationService>(TYPES.EmailNotificationService).toDynamicValue(() => {
    const fromAddress = process.env.EMAIL_FROM || 'noreply@example.com';
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return new EmailNotificationService(null, fromAddress, baseUrl);
  });

  // Controllers
  container.bind<ReportsController>(TYPES.ReportsController).to(ReportsController);
  container.bind<TemplatesController>(TYPES.TemplatesController).to(TemplatesController);
  container.bind<ScheduledReportsController>(TYPES.ScheduledReportsController).to(ScheduledReportsController);
  container.bind<ExportsController>(TYPES.ExportsController).to(ExportsController);
}