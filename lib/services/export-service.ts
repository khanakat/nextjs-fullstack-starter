import { db } from '@/lib/db';
import { 
  ExportJobWithReport, 
  ExportReportRequest,
  ExportFormat,
  ExportStatus
} from '@/lib/types/reports';
import puppeteer from 'puppeteer';
import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import path from 'path';

export class ExportService {
  // Create a new export job
  static async createExportJob(
    userId: string, 
    data: ExportReportRequest
  ): Promise<ExportJobWithReport> {
    // Verify report exists and user has access
    const report = await db.report.findFirst({
      where: {
        id: data.reportId,
        OR: [
          { createdBy: userId },
          { isPublic: true },
          {
            permissions: {
              some: {
                userId: userId,
                permissionType: {
                  in: ['VIEW', 'EDIT', 'ADMIN']
                }
              }
            }
          }
        ]
      }
    });

    if (!report) {
      throw new Error('Report not found or access denied');
    }

    // Create export job
    const exportJob = await db.exportJob.create({
      data: {
        reportId: data.reportId,
        format: data.format,
        options: JSON.stringify(data.options || {}),
        status: ExportStatus.PENDING,
        userId: userId
      },
      include: {
        report: {
          select: {
            id: true,
            name: true,
            description: true,
            config: true,
            createdAt: true,
            updatedAt: true,
            status: true,
            templateId: true,
            createdBy: true,
            isPublic: true
          }
        }
      }
    });

    // Queue the export job for processing
    this.processExportJobAsync(exportJob.id);

    return exportJob;
  }

  // Get export jobs for a user
  static async getExportJobs(
    userId: string,
    filters: {
      status?: ExportStatus;
      reportId?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { createdBy: userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.reportId) {
      where.reportId = filters.reportId;
    }

    const [exportJobs, total] = await Promise.all([
      db.exportJob.findMany({
        where,
        include: {
          report: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.exportJob.count({ where })
    ]);

    return {
      exportJobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get a specific export job
  static async getExportJobById(exportJobId: string, userId: string): Promise<ExportJobWithReport | null> {
    return db.exportJob.findFirst({
      where: {
        id: exportJobId,
        userId: userId
      },
      include: {
        report: {
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            name: true,
            status: true,
            description: true,
            templateId: true,
            config: true,
            createdBy: true,
            isPublic: true
          }
        }
      }
    });
  }

  // Delete an export job
  static async deleteExportJob(exportJobId: string, userId: string): Promise<void> {
    const exportJob = await db.exportJob.findFirst({
      where: {
        id: exportJobId,
        userId: userId
      }
    });

    if (!exportJob) {
      throw new Error('Export job not found');
    }

    // Delete the actual file if it exists
    if (exportJob.downloadUrl) {
      try {
        const filePath = path.join(process.cwd(), 'public', exportJob.downloadUrl);
        await fs.unlink(filePath);
      } catch (error) {
        console.warn('Failed to delete export file:', error);
      }
    }

    await db.exportJob.delete({
      where: { id: exportJobId }
    });
  }

  // Process export job asynchronously
  private static async processExportJobAsync(exportJobId: string): Promise<void> {
    // Add a small delay to simulate queue processing
    setTimeout(async () => {
      try {
        await this.processExportJob(exportJobId);
      } catch (error) {
        console.error('Error processing export job:', error);
        await db.exportJob.update({
          where: { id: exportJobId },
          data: {
            status: ExportStatus.FAILED,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    }, 1000);
  }

  // Process export job
  private static async processExportJob(exportJobId: string): Promise<void> {
    // Update status to processing
    await db.exportJob.update({
      where: { id: exportJobId },
      data: { status: ExportStatus.PROCESSING }
    });

    // Get the export job with report data
    const exportJob = await db.exportJob.findUnique({
      where: { id: exportJobId },
      include: {
        report: true
      }
    });

    if (!exportJob) {
      throw new Error('Export job not found');
    }

    let fileUrl: string;
    let fileName: string;

    // Generate the export based on format
    switch (exportJob.format) {
      case ExportFormat.PDF:
        const pdfResult = await this.generatePDFExport(exportJob);
        fileUrl = pdfResult.fileUrl;
        fileName = pdfResult.fileName;
        break;
      case ExportFormat.EXCEL:
        const excelResult = await this.generateExcelExport(exportJob);
        fileUrl = excelResult.fileUrl;
        fileName = excelResult.fileName;
        break;
      case ExportFormat.CSV:
        const csvResult = await this.generateCSVExport(exportJob);
        fileUrl = csvResult.fileUrl;
        fileName = csvResult.fileName;
        break;
      case ExportFormat.PNG:
        const pngResult = await this.generatePNGExport(exportJob);
        fileUrl = pngResult.fileUrl;
        fileName = pngResult.fileName;
        break;
      default:
        throw new Error(`Unsupported export format: ${exportJob.format}`);
    }

    // Update export job with success
    await db.exportJob.update({
      where: { id: exportJobId },
      data: {
        status: ExportStatus.COMPLETED,
        downloadUrl: fileUrl,
        completedAt: new Date()
      }
    });
  }

  // Generate PDF export
  private static async generatePDFExport(exportJob: any) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Generate HTML content for the report
      const htmlContent = this.generateReportHTML(exportJob.report, exportJob.options);
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Ensure exports directory exists
      const exportsDir = path.join(process.cwd(), 'public', 'exports');
      await fs.mkdir(exportsDir, { recursive: true });
      
      const fileName = `${exportJob.report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
      const filePath = path.join(exportsDir, fileName);
      
      await page.pdf({
        path: filePath,
        format: exportJob.options?.pageSize || 'A4',
        landscape: exportJob.options?.orientation === 'landscape',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      return {
        fileUrl: `/exports/${fileName}`,
        fileName
      };
    } finally {
      await browser.close();
    }
  }

  // Generate Excel export
  private static async generateExcelExport(exportJob: any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(exportJob.report.title);

    // Add report metadata
    worksheet.addRow(['Report Title', exportJob.report.title]);
    worksheet.addRow(['Description', exportJob.report.description || '']);
    worksheet.addRow(['Generated At', new Date().toISOString()]);
    worksheet.addRow([]); // Empty row

    // Add sample data (in a real implementation, this would come from the report config)
    const headers = ['Date', 'Category', 'Value', 'Status'];
    worksheet.addRow(headers);

    // Style the header row
    const headerRow = worksheet.lastRow;
    if (headerRow) {
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }

    // Add sample data rows
    const sampleData = [
      [new Date(), 'Sales', 1000, 'Active'],
      [new Date(), 'Marketing', 750, 'Active'],
      [new Date(), 'Support', 500, 'Inactive']
    ];

    sampleData.forEach(row => {
      worksheet.addRow(row);
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15;
    });

    // Ensure exports directory exists
    const exportsDir = path.join(process.cwd(), 'public', 'exports');
    await fs.mkdir(exportsDir, { recursive: true });

    const fileName = `${exportJob.report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.xlsx`;
    const filePath = path.join(exportsDir, fileName);

    await workbook.xlsx.writeFile(filePath);

    return {
      fileUrl: `/exports/${fileName}`,
      fileName
    };
  }

  // Generate CSV export
  private static async generateCSVExport(exportJob: any) {
    const headers = ['Date', 'Category', 'Value', 'Status'];
    const sampleData = [
      [new Date().toISOString(), 'Sales', '1000', 'Active'],
      [new Date().toISOString(), 'Marketing', '750', 'Active'],
      [new Date().toISOString(), 'Support', '500', 'Inactive']
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');

    // Ensure exports directory exists
    const exportsDir = path.join(process.cwd(), 'public', 'exports');
    await fs.mkdir(exportsDir, { recursive: true });

    const fileName = `${exportJob.report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.csv`;
    const filePath = path.join(exportsDir, fileName);

    await fs.writeFile(filePath, csvContent, 'utf-8');

    return {
      fileUrl: `/exports/${fileName}`,
      fileName
    };
  }

  // Generate PNG export
  private static async generatePNGExport(exportJob: any) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Set viewport size
      await page.setViewport({ width: 1200, height: 800 });
      
      // Generate HTML content for the report
      const htmlContent = this.generateReportHTML(exportJob.report, exportJob.options);
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Ensure exports directory exists
      const exportsDir = path.join(process.cwd(), 'public', 'exports');
      await fs.mkdir(exportsDir, { recursive: true });
      
      const fileName = `${exportJob.report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
      const filePath = path.join(exportsDir, fileName);
      
      await page.screenshot({
        path: filePath,
        fullPage: true,
        type: 'png'
      });

      return {
        fileUrl: `/exports/${fileName}`,
        fileName
      };
    } finally {
      await browser.close();
    }
  }

  // Generate HTML content for reports
  private static generateReportHTML(report: any, options: any = {}): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${report.title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: #333;
          }
          .header {
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            margin: 0 0 10px 0;
            color: #1f2937;
          }
          .description {
            font-size: 16px;
            color: #6b7280;
            margin: 0;
          }
          .metadata {
            display: flex;
            gap: 20px;
            margin-top: 15px;
            font-size: 14px;
            color: #9ca3af;
          }
          .content {
            margin-top: 30px;
          }
          .chart-placeholder {
            width: 100%;
            height: 300px;
            background: #f3f4f6;
            border: 2px dashed #d1d5db;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 20px 0;
            border-radius: 8px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .table th,
          .table td {
            border: 1px solid #e5e7eb;
            padding: 12px;
            text-align: left;
          }
          .table th {
            background: #f9fafb;
            font-weight: 600;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${report.title}</h1>
          ${report.description ? `<p class="description">${report.description}</p>` : ''}
          <div class="metadata">
            <span>Generated: ${new Date().toLocaleString()}</span>
            <span>Format: ${options.format || 'PDF'}</span>
          </div>
        </div>
        
        <div class="content">
          ${options.includeCharts !== false ? `
            <div class="chart-placeholder">
              <span>Chart Visualization</span>
            </div>
          ` : ''}
          
          ${options.includeData !== false ? `
            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${new Date().toLocaleDateString()}</td>
                  <td>Sales</td>
                  <td>$1,000</td>
                  <td>Active</td>
                </tr>
                <tr>
                  <td>${new Date().toLocaleDateString()}</td>
                  <td>Marketing</td>
                  <td>$750</td>
                  <td>Active</td>
                </tr>
                <tr>
                  <td>${new Date().toLocaleDateString()}</td>
                  <td>Support</td>
                  <td>$500</td>
                  <td>Inactive</td>
                </tr>
              </tbody>
            </table>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>Generated by Reports System - ${new Date().toISOString()}</p>
        </div>
      </body>
      </html>
    `;
  }
}