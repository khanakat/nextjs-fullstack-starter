/**
 * PDF Generator
 * Generates PDF reports using jsPDF
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface PDFOptions {
  title: string;
  data: any[];
  options?: {
    format?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    includeCharts?: boolean;
    includeImages?: boolean;
    margins?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    fontSize?: number;
    fontFamily?: string;
  };
  fileName?: string;
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
  };
}

export interface PDFResult {
  success: boolean;
  filePath?: string;
  downloadUrl?: string;
  fileSize?: string;
  error?: string;
  buffer?: Buffer;
}

export interface TableColumn {
  header: string;
  dataKey: string;
  width?: number;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: Array<{ label: string; value: number; color?: string }>;
  width?: number;
  height?: number;
}

/**
 * Generate PDF report
 */
export async function generatePDF(options: PDFOptions): Promise<PDFResult> {
  try {
    console.log(`[PDFGenerator] Generating PDF: ${options.title}`);

    const {
      title,
      data,
      options: pdfOptions = {},
      fileName = `report-${Date.now()}.pdf`,
      metadata = {},
    } = options;

    // Create PDF document
    const doc = new jsPDF({
      orientation: pdfOptions.orientation || 'portrait',
      unit: 'mm',
      format: pdfOptions.format || 'A4',
    });

    // Set metadata
    doc.setProperties({
      title,
      author: metadata.author || 'System',
      subject: metadata.subject || title,
      keywords: metadata.keywords || '',
      creator: metadata.creator || 'PDF Generator',
    });

    // Set margins
    const margins = pdfOptions.margins || { top: 20, right: 20, bottom: 20, left: 20 };
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margins.left - margins.right;

    let currentY = margins.top;

    // Add header
    currentY = addHeader(doc, title, margins.left, currentY, contentWidth);

    // Add summary if data is available
    if (data && data.length > 0) {
      currentY = addSummary(doc, data, margins.left, currentY, contentWidth);
    }

    // Add data table
    if (data && data.length > 0) {
      currentY = await addDataTable(doc, data, margins.left, currentY, contentWidth);
    }

    // Add charts if requested
    if (pdfOptions.includeCharts && data && data.length > 0) {
      currentY = await addCharts(doc, data, margins.left, currentY, contentWidth);
    }

    // Add footer
    addFooter(doc, margins.left, pageHeight - margins.bottom, contentWidth);

    // Generate buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const fileSize = formatFileSize(pdfBuffer.length);

    // In a real implementation, you would save to file system or cloud storage
    const filePath = `/tmp/${fileName}`;
    const downloadUrl = `/api/downloads/${fileName}`;

    console.log(`[PDFGenerator] PDF generated successfully:`, {
      fileName,
      fileSize,
      pages: doc.getNumberOfPages(),
    });

    return {
      success: true,
      filePath,
      downloadUrl,
      fileSize,
      buffer: pdfBuffer,
    };

  } catch (error) {
    console.error(`[PDFGenerator] Failed to generate PDF:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Add header to PDF
 */
function addHeader(doc: jsPDF, title: string, x: number, y: number, width: number): number {
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, x, y);
  y += 10;

  // Date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Generated on: ${date}`, x, y);
  y += 5;

  // Line separator
  doc.setLineWidth(0.5);
  doc.line(x, y, x + width, y);
  y += 10;

  return y;
}

/**
 * Add summary section to PDF
 */
function addSummary(doc: jsPDF, data: any[], x: number, y: number, width: number): number {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', x, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Basic statistics
  const stats = calculateStats(data);
  const summaryLines = [
    `Total Records: ${stats.totalRecords}`,
    `Date Range: ${stats.dateRange}`,
    `Last Updated: ${new Date().toLocaleString()}`,
  ];

  summaryLines.forEach(line => {
    doc.text(line, x, y);
    y += 5;
  });

  y += 5;
  return y;
}

/**
 * Add data table to PDF
 */
async function addDataTable(doc: jsPDF, data: any[], x: number, y: number, width: number): Promise<number> {
  if (!data || data.length === 0) return y;

  // Determine columns from data
  const columns = generateTableColumns(data);
  
  // Prepare table data
  const tableData = data.map(row => 
    columns.map(col => formatCellValue(row[col.dataKey]))
  );

  // Add table
  (doc as any).autoTable({
    head: [columns.map(col => col.header)],
    body: tableData,
    startY: y,
    margin: { left: x, right: x },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: generateColumnStyles(columns),
  });

  return (doc as any).lastAutoTable.finalY + 10;
}

/**
 * Add charts to PDF
 */
async function addCharts(doc: jsPDF, data: any[], x: number, y: number, width: number): Promise<number> {
  // This is a placeholder for chart generation
  // In a real implementation, you would use a charting library
  // and convert charts to images to embed in PDF

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Charts', x, y);
  y += 10;

  // Placeholder chart
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Chart generation would be implemented here using a charting library.', x, y);
  y += 5;
  doc.text('Charts would be converted to images and embedded in the PDF.', x, y);
  y += 15;

  return y;
}

/**
 * Add footer to PDF
 */
function addFooter(doc: jsPDF, x: number, y: number, width: number): void {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.line(x, y - 5, x + width, y - 5);
    
    // Footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${pageCount}`, x, y);
    
    // Timestamp
    const timestamp = new Date().toLocaleString();
    const timestampWidth = doc.getTextWidth(timestamp);
    doc.text(timestamp, x + width - timestampWidth, y);
  }
}

/**
 * Generate table columns from data
 */
function generateTableColumns(data: any[]): TableColumn[] {
  if (!data || data.length === 0) return [];

  const firstRow = data[0];
  const columns: TableColumn[] = [];

  Object.keys(firstRow).forEach(key => {
    columns.push({
      header: formatColumnHeader(key),
      dataKey: key,
    });
  });

  return columns;
}

/**
 * Generate column styles for autoTable
 */
function generateColumnStyles(columns: TableColumn[]): Record<string, any> {
  const styles: Record<string, any> = {};

  columns.forEach((col, index) => {
    // Set specific styles based on data type
    if (col.dataKey.includes('date') || col.dataKey.includes('time')) {
      styles[index] = { cellWidth: 25 };
    } else if (col.dataKey.includes('id')) {
      styles[index] = { cellWidth: 15 };
    } else if (col.dataKey.includes('email')) {
      styles[index] = { cellWidth: 35 };
    }
  });

  return styles;
}

/**
 * Format column header
 */
function formatColumnHeader(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Format cell value
 */
function formatCellValue(value: any): string {
  if (value === null || value === undefined) return '';
  
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  
  return String(value);
}

/**
 * Calculate basic statistics from data
 */
function calculateStats(data: any[]): {
  totalRecords: number;
  dateRange: string;
} {
  const totalRecords = data.length;
  
  // Try to find date fields for range calculation
  let dateRange = 'N/A';
  const dateFields = ['createdAt', 'updatedAt', 'date', 'timestamp'];
  
  for (const field of dateFields) {
    const dates = data
      .map(row => row[field])
      .filter(date => date)
      .map(date => new Date(date))
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (dates.length > 0) {
      const earliest = dates[0].toLocaleDateString();
      const latest = dates[dates.length - 1].toLocaleDateString();
      dateRange = earliest === latest ? earliest : `${earliest} - ${latest}`;
      break;
    }
  }

  return {
    totalRecords,
    dateRange,
  };
}

/**
 * Format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate sample report for testing
 */
export async function generateSampleReport(): Promise<PDFResult> {
  const sampleData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', createdAt: new Date('2024-01-15'), active: true },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date('2024-01-20'), active: true },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', createdAt: new Date('2024-01-25'), active: false },
  ];

  return await generatePDF({
    title: 'Sample User Report',
    data: sampleData,
    fileName: 'sample-report.pdf',
    metadata: {
      author: 'System',
      subject: 'Sample Report',
      keywords: 'users, sample, report',
    },
  });
}