/**
 * PDF Service
 * High-level service for PDF generation and management
 */

import { generatePDF, PDFOptions, PDFResult } from './pdf-generator';
import { 
  getReportTemplate, 
  createPDFOptionsFromTemplate, 
  getDataProcessor,
  ReportTemplate 
} from './templates/report-templates';

export interface PDFGenerationRequest {
  templateName?: string;
  title: string;
  data: any[];
  options?: Partial<PDFOptions>;
  fileName?: string;
  processData?: boolean;
}

export interface PDFServiceResult extends PDFResult {
  templateUsed?: string;
  dataProcessed?: boolean;
  recordCount?: number;
}

export class PDFService {
  /**
   * Generate PDF using template
   */
  async generateFromTemplate(
    templateName: string,
    data: any[],
    customOptions?: Partial<PDFOptions>
  ): Promise<PDFServiceResult> {
    try {
      console.log(`[PDFService] Generating PDF from template: ${templateName}`);

      // Get template
      const template = getReportTemplate(templateName);
      if (!template) {
        return {
          success: false,
          error: `Template not found: ${templateName}`,
        };
      }

      // Process data if processor exists
      let processedData = data;
      const processor = getDataProcessor(templateName);
      if (processor) {
        processedData = processor(data);
        console.log(`[PDFService] Data processed for template: ${templateName}`);
      }

      // Create PDF options from template
      const pdfOptions = createPDFOptionsFromTemplate(templateName, processedData, customOptions);
      if (!pdfOptions) {
        return {
          success: false,
          error: `Failed to create PDF options from template: ${templateName}`,
        };
      }

      // Generate PDF
      const result = await generatePDF(pdfOptions);

      return {
        ...result,
        templateUsed: templateName,
        dataProcessed: !!processor,
        recordCount: data.length,
      };

    } catch (error) {
      console.error(`[PDFService] Template generation failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        templateUsed: templateName,
      };
    }
  }

  /**
   * Generate PDF with custom options
   */
  async generateCustom(request: PDFGenerationRequest): Promise<PDFServiceResult> {
    try {
      console.log(`[PDFService] Generating custom PDF: ${request.title}`);

      let pdfOptions: PDFOptions;
      let templateUsed: string | undefined;
      let dataProcessed = false;

      if (request.templateName) {
        // Use template as base
        const baseOptions = createPDFOptionsFromTemplate(
          request.templateName,
          request.data,
          request.options
        );

        if (!baseOptions) {
          return {
            success: false,
            error: `Template not found: ${request.templateName}`,
          };
        }

        pdfOptions = {
          ...baseOptions,
          title: request.title,
          fileName: request.fileName || baseOptions.fileName,
        };

        templateUsed = request.templateName;

        // Process data if requested and processor exists
        if (request.processData !== false) {
          const processor = getDataProcessor(request.templateName);
          if (processor) {
            pdfOptions.data = processor(request.data);
            dataProcessed = true;
          }
        }

      } else {
        // Create custom options
        pdfOptions = {
          title: request.title,
          data: request.data,
          fileName: request.fileName,
          ...request.options,
        };
      }

      // Generate PDF
      const result = await generatePDF(pdfOptions);

      return {
        ...result,
        templateUsed,
        dataProcessed,
        recordCount: request.data.length,
      };

    } catch (error) {
      console.error(`[PDFService] Custom generation failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate multiple PDFs in batch
   */
  async generateBatch(requests: PDFGenerationRequest[]): Promise<PDFServiceResult[]> {
    console.log(`[PDFService] Generating batch of ${requests.length} PDFs`);

    const results: PDFServiceResult[] = [];

    for (const request of requests) {
      try {
        const result = await this.generateCustom(request);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[PDFService] Batch completed: ${successCount}/${requests.length} successful`);

    return results;
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(): ReportTemplate[] {
    const templateNames = ['user-report', 'analytics-report', 'export-summary', 'financial-report', 'system-health', 'custom-report'];
    return templateNames
      .map(name => getReportTemplate(name))
      .filter((template): template is ReportTemplate => template !== null);
  }

  /**
   * Validate PDF generation request
   */
  validateRequest(request: PDFGenerationRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.title || request.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!request.data || !Array.isArray(request.data)) {
      errors.push('Data must be an array');
    }

    if (request.templateName && !getReportTemplate(request.templateName)) {
      errors.push(`Template not found: ${request.templateName}`);
    }

    if (request.fileName && !/^[a-zA-Z0-9._-]+\.pdf$/i.test(request.fileName)) {
      errors.push('Invalid file name format');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get PDF generation statistics
   */
  async getStats(): Promise<{
    templatesAvailable: number;
    templatesUsed: Record<string, number>;
    totalGenerated: number;
    averageFileSize: string;
  }> {
    // This would typically come from a database or cache
    // For now, return mock statistics
    return {
      templatesAvailable: this.getAvailableTemplates().length,
      templatesUsed: {
        'user-report': 45,
        'analytics-report': 32,
        'export-summary': 28,
        'financial-report': 15,
        'system-health': 12,
        'custom-report': 8,
      },
      totalGenerated: 140,
      averageFileSize: '2.3 MB',
    };
  }
}

// Create and export singleton instance
export const pdfService = new PDFService();

// Export helper functions
export const PDFHelpers = {
  /**
   * Generate user report
   */
  async generateUserReport(users: any[], fileName?: string): Promise<PDFServiceResult> {
    return await pdfService.generateFromTemplate('user-report', users, {
      fileName: fileName || `user-report-${Date.now()}.pdf`,
    });
  },

  /**
   * Generate analytics report
   */
  async generateAnalyticsReport(analytics: any[], fileName?: string): Promise<PDFServiceResult> {
    return await pdfService.generateFromTemplate('analytics-report', analytics, {
      fileName: fileName || `analytics-report-${Date.now()}.pdf`,
    });
  },

  /**
   * Generate export summary
   */
  async generateExportSummary(exports: any[], fileName?: string): Promise<PDFServiceResult> {
    return await pdfService.generateFromTemplate('export-summary', exports, {
      fileName: fileName || `export-summary-${Date.now()}.pdf`,
    });
  },

  /**
   * Generate financial report
   */
  async generateFinancialReport(transactions: any[], fileName?: string): Promise<PDFServiceResult> {
    return await pdfService.generateFromTemplate('financial-report', transactions, {
      fileName: fileName || `financial-report-${Date.now()}.pdf`,
    });
  },

  /**
   * Generate system health report
   */
  async generateSystemHealthReport(healthData: any[], fileName?: string): Promise<PDFServiceResult> {
    return await pdfService.generateFromTemplate('system-health', healthData, {
      fileName: fileName || `system-health-${Date.now()}.pdf`,
    });
  },

  /**
   * Generate custom report
   */
  async generateCustomReport(
    title: string,
    data: any[],
    options?: Partial<PDFOptions>
  ): Promise<PDFServiceResult> {
    return await pdfService.generateCustom({
      title,
      data,
      options,
      fileName: options?.fileName || `custom-report-${Date.now()}.pdf`,
    });
  },
};