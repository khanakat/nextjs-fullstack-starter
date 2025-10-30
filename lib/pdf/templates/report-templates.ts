/**
 * PDF Report Templates
 * Predefined templates for different report types
 */

import { PDFOptions } from '../pdf-generator';

export interface ReportTemplate {
  name: string;
  title: string;
  description: string;
  options: Partial<PDFOptions>;
}

/**
 * User Report Template
 */
export const userReportTemplate: ReportTemplate = {
  name: 'user-report',
  title: 'User Report',
  description: 'Comprehensive user activity and statistics report',
  options: {
    options: {
      format: 'A4',
      orientation: 'portrait',
      includeCharts: true,
      includeImages: false,
      margins: { top: 25, right: 20, bottom: 25, left: 20 },
      fontSize: 10,
    },
    metadata: {
      subject: 'User Activity Report',
      keywords: 'users, activity, statistics, report',
    },
  },
};

/**
 * Analytics Report Template
 */
export const analyticsReportTemplate: ReportTemplate = {
  name: 'analytics-report',
  title: 'Analytics Report',
  description: 'System analytics and performance metrics report',
  options: {
    options: {
      format: 'A4',
      orientation: 'landscape',
      includeCharts: true,
      includeImages: true,
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      fontSize: 9,
    },
    metadata: {
      subject: 'Analytics and Performance Report',
      keywords: 'analytics, performance, metrics, statistics',
    },
  },
};

/**
 * Export Summary Template
 */
export const exportSummaryTemplate: ReportTemplate = {
  name: 'export-summary',
  title: 'Export Summary Report',
  description: 'Summary of export activities and job statuses',
  options: {
    options: {
      format: 'A4',
      orientation: 'portrait',
      includeCharts: false,
      includeImages: false,
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      fontSize: 10,
    },
    metadata: {
      subject: 'Export Activity Summary',
      keywords: 'exports, jobs, summary, activity',
    },
  },
};

/**
 * Financial Report Template
 */
export const financialReportTemplate: ReportTemplate = {
  name: 'financial-report',
  title: 'Financial Report',
  description: 'Financial data and transaction summary report',
  options: {
    options: {
      format: 'A4',
      orientation: 'portrait',
      includeCharts: true,
      includeImages: false,
      margins: { top: 30, right: 20, bottom: 30, left: 20 },
      fontSize: 10,
    },
    metadata: {
      subject: 'Financial Summary Report',
      keywords: 'financial, transactions, revenue, summary',
    },
  },
};

/**
 * System Health Report Template
 */
export const systemHealthTemplate: ReportTemplate = {
  name: 'system-health',
  title: 'System Health Report',
  description: 'System performance and health monitoring report',
  options: {
    options: {
      format: 'A4',
      orientation: 'landscape',
      includeCharts: true,
      includeImages: true,
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      fontSize: 9,
    },
    metadata: {
      subject: 'System Health and Performance',
      keywords: 'system, health, performance, monitoring',
    },
  },
};

/**
 * Custom Report Template
 */
export const customReportTemplate: ReportTemplate = {
  name: 'custom-report',
  title: 'Custom Report',
  description: 'Customizable report template',
  options: {
    options: {
      format: 'A4',
      orientation: 'portrait',
      includeCharts: false,
      includeImages: false,
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      fontSize: 10,
    },
    metadata: {
      subject: 'Custom Report',
      keywords: 'custom, report, data',
    },
  },
};

/**
 * All available templates
 */
export const reportTemplates: Record<string, ReportTemplate> = {
  'user-report': userReportTemplate,
  'analytics-report': analyticsReportTemplate,
  'export-summary': exportSummaryTemplate,
  'financial-report': financialReportTemplate,
  'system-health': systemHealthTemplate,
  'custom-report': customReportTemplate,
};

/**
 * Get template by name
 */
export function getReportTemplate(templateName: string): ReportTemplate | null {
  return reportTemplates[templateName] || null;
}

/**
 * Get all template names
 */
export function getTemplateNames(): string[] {
  return Object.keys(reportTemplates);
}

/**
 * Create PDF options from template
 */
export function createPDFOptionsFromTemplate(
  templateName: string,
  data: any[],
  customOptions?: Partial<PDFOptions>
): PDFOptions | null {
  const template = getReportTemplate(templateName);
  if (!template) return null;

  return {
    title: template.title,
    data,
    ...template.options,
    ...customOptions,
    options: {
      ...template.options.options,
      ...customOptions?.options,
    },
    metadata: {
      ...template.options.metadata,
      ...customOptions?.metadata,
    },
  };
}

/**
 * Template-specific data processors
 */
export const templateProcessors = {
  /**
   * Process user report data
   */
  processUserReportData(rawData: any[]): any[] {
    return rawData.map(user => ({
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email,
      status: user.active ? 'Active' : 'Inactive',
      joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
      lastLogin: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never',
      role: user.role || 'User',
    }));
  },

  /**
   * Process analytics report data
   */
  processAnalyticsReportData(rawData: any[]): any[] {
    return rawData.map(metric => ({
      metric: metric.name || metric.metric,
      value: typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value,
      change: metric.change || 'N/A',
      period: metric.period || 'Current',
      lastUpdated: metric.updatedAt ? new Date(metric.updatedAt).toLocaleDateString() : 'N/A',
    }));
  },

  /**
   * Process export summary data
   */
  processExportSummaryData(rawData: any[]): any[] {
    return rawData.map(exportJob => ({
      id: exportJob.id,
      type: exportJob.type || 'Unknown',
      status: exportJob.status,
      fileName: exportJob.fileName || 'N/A',
      fileSize: exportJob.fileSize || 'N/A',
      createdAt: exportJob.createdAt ? new Date(exportJob.createdAt).toLocaleDateString() : 'N/A',
      completedAt: exportJob.completedAt ? new Date(exportJob.completedAt).toLocaleDateString() : 'Pending',
      duration: exportJob.completedAt && exportJob.createdAt 
        ? `${Math.round((new Date(exportJob.completedAt).getTime() - new Date(exportJob.createdAt).getTime()) / 1000)}s`
        : 'N/A',
    }));
  },

  /**
   * Process financial report data
   */
  processFinancialReportData(rawData: any[]): any[] {
    return rawData.map(transaction => ({
      id: transaction.id,
      date: transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A',
      description: transaction.description || 'N/A',
      amount: typeof transaction.amount === 'number' 
        ? `$${transaction.amount.toFixed(2)}` 
        : transaction.amount,
      type: transaction.type || 'N/A',
      status: transaction.status || 'N/A',
      category: transaction.category || 'Uncategorized',
    }));
  },

  /**
   * Process system health data
   */
  processSystemHealthData(rawData: any[]): any[] {
    return rawData.map(health => ({
      component: health.component || health.name,
      status: health.status,
      uptime: health.uptime || 'N/A',
      responseTime: health.responseTime ? `${health.responseTime}ms` : 'N/A',
      errorRate: health.errorRate ? `${health.errorRate}%` : '0%',
      lastCheck: health.lastCheck ? new Date(health.lastCheck).toLocaleString() : 'N/A',
      alerts: health.alerts || 0,
    }));
  },
};

/**
 * Get data processor for template
 */
export function getDataProcessor(templateName: string): ((data: any[]) => any[]) | null {
  switch (templateName) {
    case 'user-report':
      return templateProcessors.processUserReportData;
    case 'analytics-report':
      return templateProcessors.processAnalyticsReportData;
    case 'export-summary':
      return templateProcessors.processExportSummaryData;
    case 'financial-report':
      return templateProcessors.processFinancialReportData;
    case 'system-health':
      return templateProcessors.processSystemHealthData;
    default:
      return null;
  }
}