import { NextRequest, NextResponse } from 'next/server';
import { ReportManagementUseCase } from '../../application/use-cases/report-management-use-case';
import { CreateReportCommand } from '../../application/commands/create-report-command';
import { UpdateReportCommand } from '../../application/commands/update-report-command';
import { PublishReportCommand } from '../../application/commands/publish-report-command';
import { ArchiveReportCommand } from '../../application/commands/archive-report-command';
import { DeleteReportCommand } from '../../application/commands/delete-report-command';
import { GetReportQuery } from '../../application/queries/get-report-query';
import { GetReportsQuery } from '../../application/queries/get-reports-query';
import { ReportExportService } from '../../application/services/report-export-service';
import { z } from 'zod';

// Validation schemas
const CreateReportSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  config: z.record(z.any()),
  isPublic: z.boolean().optional(),
  templateId: z.string().optional(),
  organizationId: z.string().optional(),
});

const UpdateReportSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  config: z.record(z.any()).optional(),
  isPublic: z.boolean().optional(),
});

const GetReportsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.string().optional(),
  title: z.string().optional(),
  createdBy: z.string().optional(),
  organizationId: z.string().optional(),
  isPublic: z.boolean().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
});

const ExportReportSchema = z.object({
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML']),
  parameters: z.record(z.any()).optional(),
});

/**
 * API Controller for Report management
 */
export class ReportsController {
  constructor(
    private readonly reportManagementUseCase: ReportManagementUseCase,
    private readonly reportExportService: ReportExportService
  ) {}

  /**
   * GET /api/reports
   * Get reports with filtering and pagination
   */
  async getReports(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const queryParams = Object.fromEntries(searchParams.entries());
      
      // Validate query parameters
      const validatedParams = GetReportsSchema.parse(queryParams);
      
      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Create query
      const query = new GetReportsQuery(
        {
          status: validatedParams.status as any,
          title: validatedParams.title,
          createdBy: validatedParams.createdBy || userId,
          organizationId: validatedParams.organizationId,
          isPublic: validatedParams.isPublic,
          createdAfter: validatedParams.createdAfter ? new Date(validatedParams.createdAfter) : undefined,
          createdBefore: validatedParams.createdBefore ? new Date(validatedParams.createdBefore) : undefined,
        },
        {
          page: validatedParams.page,
          pageSize: validatedParams.limit,
          sortBy: validatedParams.sortBy,
          sortOrder: validatedParams.sortOrder,
        },
        userId
      );

      // Execute query
      const result = await this.reportManagementUseCase.getReports(query);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        data: result.value.items,
        total: result.value.totalCount,
        page: result.value.page,
        pageSize: result.value.pageSize,
      });
    } catch (error) {
      console.error('Error in getReports:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/reports/[id]
   * Get a specific report by ID
   */
  async getReport(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const reportId = params.id;
      
      if (!reportId) {
        return NextResponse.json(
          { error: 'Report ID is required' },
          { status: 400 }
        );
      }

      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);

      // Execute query
      const result = await this.reportManagementUseCase.getReport(new GetReportQuery({ id: reportId, userId }));
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error.message?.includes('not found') ? 404 : 400 }
        );
      }

      return NextResponse.json({ data: result.value });
    } catch (error) {
      console.error('Error in getReport:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/reports
   * Create a new report
   */
  async createReport(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      
      // Validate request body
      const validatedData = CreateReportSchema.parse(body);
      
      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Create command
      const command = new CreateReportCommand(
        validatedData.title,
        validatedData.config as any,
        validatedData.isPublic || false,
        userId,
        validatedData.description,
        validatedData.templateId,
        validatedData.organizationId
      );

      // Execute command
      const result = await this.reportManagementUseCase.createReport(command);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { data: result.value },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error in createReport:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * PUT /api/reports/[id]
   * Update an existing report
   */
  async updateReport(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const reportId = params.id;
      const body = await request.json();
      
      if (!reportId) {
        return NextResponse.json(
          { error: 'Report ID is required' },
          { status: 400 }
        );
      }

      // Validate request body
      const validatedData = UpdateReportSchema.parse(body);
      
      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Create command
      const command = new UpdateReportCommand(
        reportId,
        userId,
        validatedData.title,
        validatedData.description,
        validatedData.config as any,
        validatedData.isPublic
      );

      // Execute command
      const result = await this.reportManagementUseCase.updateReport(command);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error.message?.includes('not found') ? 404 : 400 }
        );
      }

      return NextResponse.json({ data: result.value });
    } catch (error) {
      console.error('Error in updateReport:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/reports/[id]/publish
   * Publish a report
   */
  async publishReport(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const reportId = params.id;
      
      if (!reportId) {
        return NextResponse.json(
          { error: 'Report ID is required' },
          { status: 400 }
        );
      }

      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Create command
      const command = new PublishReportCommand(reportId, userId);

      // Execute command
      const result = await this.reportManagementUseCase.publishReport(command);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error.message?.includes('not found') ? 404 : 400 }
        );
      }

      return NextResponse.json({ data: result.value });
    } catch (error) {
      console.error('Error in publishReport:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/reports/[id]/archive
   * Archive a report
   */
  async archiveReport(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const reportId = params.id;
      
      if (!reportId) {
        return NextResponse.json(
          { error: 'Report ID is required' },
          { status: 400 }
        );
      }

      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Create command
      const command = new ArchiveReportCommand(reportId, userId);

      // Execute command
      const result = await this.reportManagementUseCase.archiveReport(command);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error.message?.includes('not found') ? 404 : 400 }
        );
      }

      return NextResponse.json({ data: result.value });
    } catch (error) {
      console.error('Error in archiveReport:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /api/reports/[id]
   * Delete a report
   */
  async deleteReport(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const reportId = params.id;
      const { searchParams } = new URL(request.url);
      const permanent = searchParams.get('permanent') === 'true';
      
      if (!reportId) {
        return NextResponse.json(
          { error: 'Report ID is required' },
          { status: 400 }
        );
      }

      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Create command
      const command = new DeleteReportCommand(reportId, userId, permanent);

      // Execute command
      const result = await this.reportManagementUseCase.deleteReport(command);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error.message?.includes('not found') ? 404 : 400 }
        );
      }

      return NextResponse.json({ message: 'Report deleted successfully' });
    } catch (error) {
      console.error('Error in deleteReport:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/reports/[id]/export
   * Export a report
   */
  async exportReport(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const reportId = params.id;
      const body = await request.json();
      
      if (!reportId) {
        return NextResponse.json(
          { error: 'Report ID is required' },
          { status: 400 }
        );
      }

      // Validate request body
      const validatedData = ExportReportSchema.parse(body);
      
      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Create export job
      const result = await this.reportExportService.createExportJob(
        reportId,
        validatedData.format as any,
        userId,
        validatedData.parameters
      );
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { data: result.value },
        { status: 202 } // Accepted - processing asynchronously
      );
    } catch (error) {
      console.error('Error in exportReport:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/reports/[id]/duplicate
   * Duplicate a report
   */
  async duplicateReport(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const reportId = params.id;
      const body = await request.json();
      
      if (!reportId) {
        return NextResponse.json(
          { error: 'Report ID is required' },
          { status: 400 }
        );
      }

      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Duplicate the report
      const result = await this.reportManagementUseCase.duplicateReport(
        reportId,
        userId,
        body.title
      );
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error.message?.includes('not found') ? 404 : 400 }
        );
      }

      return NextResponse.json(
        { data: result.value },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error in duplicateReport:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/reports/statistics
   * Get report statistics for the current user
   */
  async getReportStatistics(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const organizationId = searchParams.get('organizationId') || undefined;
      
      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Get statistics
      const result = await this.reportManagementUseCase.getReportStatistics(userId, organizationId);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({ data: result.value });
    } catch (error) {
      console.error('Error in getReportStatistics:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  private getUserIdFromRequest(request: NextRequest): string {
    // In a real implementation, this would extract the user ID from the JWT token
    // or session. For now, we'll use a mock implementation.
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Mock: extract user ID from token
      return 'mock-user-id';
    }
    
    // Fallback to a default user ID for development
    return 'default-user-id';
  }
}