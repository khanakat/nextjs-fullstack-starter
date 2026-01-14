import { injectable } from 'inversify';
import { GenerateDirectExportCommand } from '../commands/generate-direct-export-command';
import { Result } from '../../../../shared/application/base/result';
import { CommandHandler } from '../../../../shared/application/base/command-handler';
import { ValidationError } from '../../../../shared/domain/exceptions/validation-error';
import { PDFHelpers } from '@/lib/pdf';

export interface DirectExportResult {
  success: boolean;
  buffer?: Buffer;
  fileName?: string;
  error?: string;
}

@injectable()
export class GenerateDirectExportHandler extends CommandHandler<GenerateDirectExportCommand, DirectExportResult> {
  constructor() {
    super();
  }

  async handle(command: GenerateDirectExportCommand): Promise<Result<DirectExportResult>> {
    // Validate input
    if (!command.props.exportType) {
      return Result.failure(new ValidationError('exportType', 'Export type is required'));
    }

    if (!command.props.reportType) {
      return Result.failure(new ValidationError('reportType', 'Report type is required'));
    }

    if (!command.props.userId || command.props.userId.trim().length === 0) {
      return Result.failure(new ValidationError('userId', 'User ID is required'));
    }

    // Only PDF is supported for direct export
    if (command.props.exportType !== 'pdf') {
      return Result.failure(new Error('Direct export only supported for PDF format. Use queue for CSV/Excel exports.'));
    }

    try {
      let pdfBuffer;
      const fileName = command.props.options?.fileName || `${command.props.reportType}-report.pdf`;

      // Use appropriate PDF helper method based on report type
      switch (command.props.reportType) {
        case 'users':
          pdfBuffer = await PDFHelpers.generateUserReport([], fileName);
          break;
        case 'analytics':
          pdfBuffer = await PDFHelpers.generateAnalyticsReport([], fileName);
          break;
        case 'financial':
          pdfBuffer = await PDFHelpers.generateFinancialReport([], fileName);
          break;
        case 'system-health':
          pdfBuffer = await PDFHelpers.generateSystemHealthReport([], fileName);
          break;
        case 'custom':
        default:
          pdfBuffer = await PDFHelpers.generateCustomReport(
            command.props.reportType || 'Export Report',
            [],
            command.props.options
          );
      }

      if (!pdfBuffer.success || !pdfBuffer.buffer) {
        return Result.failure(new Error(`PDF generation failed: ${pdfBuffer.error || 'Unknown error'}`));
      }

      return Result.success({
        success: true,
        buffer: Buffer.from(pdfBuffer.buffer),
        fileName,
      });
    } catch (error) {
      return Result.failure(new Error(`Failed to generate export: ${error instanceof Error ? error.message : error}`));
    }
  }
}
