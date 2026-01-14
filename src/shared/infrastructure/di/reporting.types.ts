/**
 * Reporting Slice - Dependency Injection Types
 * Defines service identifiers for the Reporting IoC container bindings
 */

export const ReportTypes = {
  // Repositories
  ReportRepository: Symbol.for('ReportRepository'),
  ReportTemplateRepository: Symbol.for('ReportTemplateRepository'),

  // Handlers - Reports
  CreateReportHandler: Symbol.for('CreateReportHandler'),
  UpdateReportHandler: Symbol.for('UpdateReportHandler'),
  DeleteReportHandler: Symbol.for('DeleteReportHandler'),
  PublishReportHandler: Symbol.for('PublishReportHandler'),
  ArchiveReportHandler: Symbol.for('ArchiveReportHandler'),
  GetReportHandler: Symbol.for('GetReportHandler'),
  ListReportsHandler: Symbol.for('ListReportsHandler'),
  GetReportDataHandler: Symbol.for('GetReportDataHandler'),

  // Handlers - Templates
  CreateTemplateHandler: Symbol.for('CreateTemplateHandler'),
  UpdateTemplateHandler: Symbol.for('UpdateTemplateHandler'),
  DeleteTemplateHandler: Symbol.for('DeleteTemplateHandler'),
  GetTemplateHandler: Symbol.for('GetTemplateHandler'),
  ListTemplatesHandler: Symbol.for('ListTemplatesHandler'),
  UseTemplateHandler: Symbol.for('UseTemplateHandler'),

  // Controllers
  ReportsApiController: Symbol.for('ReportsApiController'),
  ReportTemplatesApiController: Symbol.for('ReportTemplatesApiController'),
};
