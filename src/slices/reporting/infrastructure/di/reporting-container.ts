import { Container } from 'inversify';
import { ReportTypes } from '@/shared/infrastructure/di/reporting.types';

// Domain Repositories
import { IReportRepository } from '@/shared/domain/reporting/repositories/report-repository';
import { IReportTemplateRepository } from '@/shared/domain/reporting/repositories/report-template-repository';

// Infrastructure Repositories
import { PrismaReportRepository } from '@/shared/infrastructure/reporting/repositories/prisma-report-repository';
import { PrismaReportTemplateRepository } from '@/shared/infrastructure/reporting/repositories/prisma-template.repository';

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

// Presentation Controllers
import { ReportsApiController } from '../../../reports/presentation/controllers/reports-api.controller';
import { ReportTemplatesApiController } from '../../../reports/presentation/controllers/report-templates-api.controller';

// External
import { PrismaClient } from '@prisma/client';

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
}
