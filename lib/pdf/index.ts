/**
 * PDF System Index
 * Main entry point for PDF generation system
 */

export { generatePDF, generateSampleReport } from './pdf-generator';
export type { PDFOptions, PDFResult, TableColumn, ChartData } from './pdf-generator';

export { pdfService, PDFService, PDFHelpers } from './pdf-service';
export type { PDFGenerationRequest, PDFServiceResult } from './pdf-service';

export {
  reportTemplates,
  getReportTemplate,
  getTemplateNames,
  createPDFOptionsFromTemplate,
  templateProcessors,
  getDataProcessor,
} from './templates/report-templates';
export type { ReportTemplate } from './templates/report-templates';

// Re-export specific templates for convenience
export {
  userReportTemplate,
  analyticsReportTemplate,
  exportSummaryTemplate,
  financialReportTemplate,
  systemHealthTemplate,
  customReportTemplate,
} from './templates/report-templates';