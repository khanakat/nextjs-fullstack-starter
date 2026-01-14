import { injectable, inject } from 'inversify';
import { NextRequest, NextResponse } from 'next/server';
import { CreateExportJobCommand } from '../../application/commands/create-export-job-command';
import { CancelExportJobCommand } from '../../application/commands/cancel-export-job-command';
import { RetryExportJobCommand } from '../../application/commands/retry-export-job-command';
import { DeleteExportJobCommand } from '../../application/commands/delete-export-job-command';
import { BulkDeleteExportJobsCommand } from '../../application/commands/bulk-delete-export-jobs-command';
import { GenerateDirectExportCommand } from '../../application/commands/generate-direct-export-command';
import { GetExportJobQuery } from '../../application/queries/get-export-job-query';
import { GetExportJobsQuery } from '../../application/queries/get-export-jobs-query';
import { DownloadExportFileQuery } from '../../application/queries/download-export-file-query';
import { CreateExportJobHandler } from '../../application/handlers/create-export-job-handler';
import { CancelExportJobHandler } from '../../application/handlers/cancel-export-job-handler';
import { RetryExportJobHandler } from '../../application/handlers/retry-export-job-handler';
import { DeleteExportJobHandler } from '../../application/handlers/delete-export-job-handler';
import { BulkDeleteExportJobsHandler } from '../../application/handlers/bulk-delete-export-jobs-handler';
import { GenerateDirectExportHandler } from '../../application/handlers/generate-direct-export-handler';
import { GetExportJobHandler } from '../../application/handlers/get-export-job-handler';
import { GetExportJobsHandler } from '../../application/handlers/get-export-jobs-handler';
import { DownloadExportFileHandler } from '../../application/handlers/download-export-file-handler';
import { ExportFormat } from '../../domain/entities/export-job';
import { TYPES } from '@/shared/infrastructure/di/types';
import { auth } from '@clerk/nextjs/server';
import { StandardErrorResponse, StandardSuccessResponse } from '@/lib/standardized-error-responses';
import { generateRequestId } from '@/lib/utils';
import { z } from 'zod';
import { handleZodError } from '@/lib/error-handlers';

// Validation schemas
const CreateExportJobSchema = z.object({
  reportId: z.string().min(1, 'Report ID is required'),
  format: z.nativeEnum(ExportFormat),
  options: z.object({
    includeCharts: z.boolean().default(true),
    includeData: z.boolean().default(true),
    pageSize: z.enum(['A4', 'A3', 'LETTER']).default('A4'),
    orientation: z.enum(['portrait', 'landscape']).default('portrait'),
    quality: z.enum(['low', 'medium', 'high']).default('medium'),
  }).optional(),
  notifyOnCompletion: z.boolean().optional(),
  notificationEmail: z.string().email().optional(),
});

const GenerateDirectExportSchema = z.object({
  exportType: z.enum(['pdf', 'csv', 'excel']),
  reportType: z.enum(['users', 'analytics', 'financial', 'system-health', 'custom']),
  filters: z.record(z.any()).optional(),
  options: z.object({
    includeCharts: z.boolean().default(false),
    includeImages: z.boolean().default(false),
    format: z.enum(['A4', 'Letter']).default('A4'),
    orientation: z.enum(['portrait', 'landscape']).default('portrait'),
    fileName: z.string().optional(),
  }).optional(),
});

const BulkDeleteSchema = z.object({
  jobIds: z.array(z.string()).min(1, 'At least one job ID is required'),
});

/**
 * Exports API Controller
 * Handles HTTP requests for export management
 */
@injectable()
export class ExportsApiController {
  constructor(
    @inject(TYPES.CreateExportJobHandler) private createExportJobHandler: CreateExportJobHandler,
    @inject(TYPES.CancelExportJobHandler) private cancelExportJobHandler: CancelExportJobHandler,
    @inject(TYPES.RetryExportJobHandler) private retryExportJobHandler: RetryExportJobHandler,
    @inject(TYPES.DeleteExportJobHandler) private deleteExportJobHandler: DeleteExportJobHandler,
    @inject(TYPES.BulkDeleteExportJobsHandler) private bulkDeleteExportJobsHandler: BulkDeleteExportJobsHandler,
    @inject(TYPES.GenerateDirectExportHandler) private generateDirectExportHandler: GenerateDirectExportHandler,
    @inject(TYPES.GetExportJobHandler) private getExportJobHandler: GetExportJobHandler,
    @inject(TYPES.GetExportJobsHandler) private getExportJobsHandler: GetExportJobsHandler,
    @inject(TYPES.DownloadExportFileHandler) private downloadExportFileHandler: DownloadExportFileHandler
  ) {}

  /**
   * GET /api/export-jobs - List export jobs for the current user
   */
  async getExportJobs(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      const { userId } = auth();
      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const status = searchParams.get('status') as any;
      const format = searchParams.get('format') as any;
      const reportId = searchParams.get('reportId') || undefined;
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

      const query = new GetExportJobsQuery({
        userId,
        status,
        format,
        reportId,
        page,
        limit,
        sortBy,
        sortOrder,
      });

      const result = await this.getExportJobsHandler.handle(query);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error.message, requestId);
      }

      return StandardSuccessResponse.ok({
        ...result.value,
        requestId,
      });
    } catch (error) {
      console.error('Error in ExportsApiController.getExportJobs:', error);
      return StandardErrorResponse.internal('Failed to fetch export jobs', requestId);
    }
  }

  /**
   * GET /api/export-jobs/[id] - Get a specific export job
   */
  async getExportJob(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      const { userId } = auth();
      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const query = new GetExportJobQuery({
        jobId: params.id,
        userId,
      });

      const result = await this.getExportJobHandler.handle(query);

      if (result.isFailure) {
        return StandardErrorResponse.notFound(result.error.message, requestId);
      }

      return StandardSuccessResponse.ok({
        exportJob: result.value.toPrimitives(),
        requestId,
      });
    } catch (error) {
      console.error('Error in ExportsApiController.getExportJob:', error);
      return StandardErrorResponse.internal('Failed to fetch export job', requestId);
    }
  }

  /**
   * POST /api/export-jobs - Create a new export job
   */
  async createExportJob(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      const { userId } = auth();
      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const body = await request.json();
      const validatedData = CreateExportJobSchema.parse(body);

      const command = new CreateExportJobCommand({
        reportId: validatedData.reportId,
        format: validatedData.format,
        userId,
        options: validatedData.options,
        notifyOnCompletion: validatedData.notifyOnCompletion,
        notificationEmail: validatedData.notificationEmail,
      });

      const result = await this.createExportJobHandler.handle(command);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error.message, requestId);
      }

      return StandardSuccessResponse.created({
        exportJob: result.value.toPrimitives(),
        requestId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, requestId);
      }
      console.error('Error in ExportsApiController.createExportJob:', error);
      return StandardErrorResponse.internal('Failed to create export job', requestId);
    }
  }

  /**
   * POST /api/export-jobs/[id]/cancel - Cancel an export job
   */
  async cancelExportJob(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      const { userId } = auth();
      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const command = new CancelExportJobCommand({
        jobId: params.id,
        userId,
      });

      const result = await this.cancelExportJobHandler.handle(command);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error.message, requestId);
      }

      return StandardSuccessResponse.ok({
        exportJob: result.value.toPrimitives(),
        requestId,
      });
    } catch (error) {
      console.error('Error in ExportsApiController.cancelExportJob:', error);
      return StandardErrorResponse.internal('Failed to cancel export job', requestId);
    }
  }

  /**
   * POST /api/export-jobs/[id]/retry - Retry a failed export job
   */
  async retryExportJob(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      const { userId } = auth();
      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const command = new RetryExportJobCommand({
        jobId: params.id,
        userId,
      });

      const result = await this.retryExportJobHandler.handle(command);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error.message, requestId);
      }

      return StandardSuccessResponse.ok({
        exportJob: result.value.toPrimitives(),
        requestId,
      });
    } catch (error) {
      console.error('Error in ExportsApiController.retryExportJob:', error);
      return StandardErrorResponse.internal('Failed to retry export job', requestId);
    }
  }

  /**
   * DELETE /api/export-jobs/[id] - Delete an export job
   */
  async deleteExportJob(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      const { userId } = auth();
      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const command = new DeleteExportJobCommand({
        jobId: params.id,
        userId,
      });

      const result = await this.deleteExportJobHandler.handle(command);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error.message, requestId);
      }

      return StandardSuccessResponse.ok({
        message: 'Export job deleted successfully',
        requestId,
      });
    } catch (error) {
      console.error('Error in ExportsApiController.deleteExportJob:', error);
      return StandardErrorResponse.internal('Failed to delete export job', requestId);
    }
  }

  /**
   * POST /api/export-jobs/bulk-delete - Delete multiple export jobs
   */
  async bulkDeleteExportJobs(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      const { userId } = auth();
      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const body = await request.json();
      const validatedData = BulkDeleteSchema.parse(body);

      const command = new BulkDeleteExportJobsCommand({
        jobIds: validatedData.jobIds,
        userId,
      });

      const result = await this.bulkDeleteExportJobsHandler.handle(command);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error.message, requestId);
      }

      return StandardSuccessResponse.ok({
        ...result.value,
        requestId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, requestId);
      }
      console.error('Error in ExportsApiController.bulkDeleteExportJobs:', error);
      return StandardErrorResponse.internal('Failed to delete export jobs', requestId);
    }
  }

  /**
   * GET /api/export-jobs/[id]/download - Download exported file
   */
  async downloadExportFile(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      const { userId } = auth();
      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const query = new DownloadExportFileQuery({
        jobId: params.id,
        userId,
      });

      const result = await this.downloadExportFileHandler.handle(query);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error.message, requestId);
      }

      const { filePath, fileName, contentType } = result.value;

      // Read file content
      const fs = await import('fs/promises');
      const fileContent = await fs.readFile(filePath);

      // Return file as response
      return new NextResponse(new Uint8Array(fileContent), {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Type': contentType,
          'Content-Length': fileContent.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Request-ID': requestId,
        },
      });
    } catch (error) {
      console.error('Error in ExportsApiController.downloadExportFile:', error);
      return StandardErrorResponse.internal('Failed to download export file', requestId);
    }
  }

  /**
   * POST /api/export - Generate direct export (without queue)
   */
  async generateDirectExport(request: NextRequest): Promise<NextResponse> {
    const requestId = generateRequestId();

    try {
      const { userId } = auth();
      if (!userId) {
        return StandardErrorResponse.unauthorized('Authentication required', requestId);
      }

      const body = await request.json();
      const validatedData = GenerateDirectExportSchema.parse(body);

      const command = new GenerateDirectExportCommand({
        exportType: validatedData.exportType,
        reportType: validatedData.reportType,
        userId,
        filters: validatedData.filters,
        options: validatedData.options,
      });

      const result = await this.generateDirectExportHandler.handle(command);

      if (result.isFailure) {
        return StandardErrorResponse.badRequest(result.error.message, requestId);
      }

      const { buffer, fileName } = result.value;

      // Return file as response
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Type': 'application/pdf',
          'X-Request-ID': requestId,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, requestId);
      }
      console.error('Error in ExportsApiController.generateDirectExport:', error);
      return StandardErrorResponse.internal('Failed to generate export', requestId);
    }
  }
}
