import { NextRequest, NextResponse } from 'next/server';
import { ScheduledReportUseCase } from '../../application/use-cases/scheduled-report-use-case';
import { CreateScheduledReportCommand } from '../../application/commands/create-scheduled-report-command';
import { UpdateScheduledReportCommand } from '../../application/commands/update-scheduled-report-command';
import { DeleteScheduledReportCommand } from '../../application/commands/delete-scheduled-report-command';
import { ExecuteScheduledReportCommand } from '../../application/commands/execute-scheduled-report-command';
import { PauseScheduledReportCommand } from '../../application/commands/pause-scheduled-report-command';
import { ResumeScheduledReportCommand } from '../../application/commands/resume-scheduled-report-command';
import { GetScheduledReportsQuery } from '../../application/queries/get-scheduled-reports-query';
import { ScheduleFrequency, ReportFrequency } from '../../../../shared/domain/reporting/entities/scheduled-report';
import { DeliveryConfigDto } from '../../application/dtos/scheduled-report-dto';
import { z } from 'zod';

// Validation schemas
const CreateScheduledReportSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  reportId: z.string().min(1),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  timezone: z.string().default('UTC'),
  recipients: z.array(z.string().email()).min(1),
  format: z.enum(['pdf', 'excel', 'csv', 'json']).default('pdf'),
  method: z.enum(['email', 'webhook', 'file_system', 'cloud_storage']).default('email'),
  settings: z.record(z.any()).default({}),
  organizationId: z.string().optional(),
});

const UpdateScheduledReportSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  timezone: z.string().optional(),
  deliveryConfig: z.object({
    method: z.enum(['email', 'webhook', 'file_system', 'cloud_storage']).optional(),
    recipients: z.array(z.string().email()).optional(),
    format: z.enum(['pdf', 'excel', 'csv', 'json']).optional(),
    settings: z.record(z.any()).optional(),
  }).optional(),
  isActive: z.boolean().optional(),
}).refine((data) => {
  return data.name !== undefined ||
    data.description !== undefined ||
    data.frequency !== undefined ||
    data.timezone !== undefined ||
    data.deliveryConfig !== undefined ||
    data.isActive !== undefined;
}, {
  message: 'At least one field must be provided for update',
  path: ['root']
});

const GetScheduledReportsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  name: z.string().optional(),
  reportId: z.string().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  isActive: z.boolean().optional(),
  createdBy: z.string().optional(),
  organizationId: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
});

/**
 * API Controller for Scheduled Report management
 */
export class ScheduledReportsController {
  constructor(
    private readonly scheduledReportUseCase: ScheduledReportUseCase
  ) {}

  /**
   * GET /api/scheduled-reports
   * Get scheduled reports with filtering and pagination
   */
  async getScheduledReports(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const queryParams = Object.fromEntries(searchParams.entries());
      
      // Validate query parameters
      const validatedParams = GetScheduledReportsSchema.parse(queryParams);
      
      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Create criteria and pagination
      const criteria = {
        name: validatedParams.name,
        reportId: validatedParams.reportId,
        frequency: validatedParams.frequency as unknown as ReportFrequency,
        isActive: validatedParams.isActive,
        createdBy: validatedParams.createdBy || userId,
        organizationId: validatedParams.organizationId,
        createdAfter: validatedParams.createdAfter ? new Date(validatedParams.createdAfter) : undefined,
        createdBefore: validatedParams.createdBefore ? new Date(validatedParams.createdBefore) : undefined,
      };

      const pagination = {
        page: validatedParams.page,
        pageSize: validatedParams.limit,
        sortBy: validatedParams.sortBy,
        sortOrder: validatedParams.sortOrder,
      };

      // Execute query
      const result = await this.scheduledReportUseCase.getScheduledReports(criteria, pagination);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        data: result.value.items,
        pagination: {
          page: result.value.page,
          limit: result.value.pageSize,
          totalCount: result.value.totalCount,
          totalPages: result.value.totalPages,
        },
      });
    } catch (error) {
      console.error('Error in getScheduledReports:', error);
      
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
   * GET /api/scheduled-reports/[id]
   * Get a specific scheduled report by ID
   */
  async getScheduledReport(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const scheduledReportId = params.id;
      
      if (!scheduledReportId) {
        return NextResponse.json(
          { error: 'Scheduled report ID is required' },
          { status: 400 }
        );
      }

      // Execute query
      const result = await this.scheduledReportUseCase.getScheduledReport(scheduledReportId);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error.message?.includes('not found') ? 404 : 400 }
        );
      }

      return NextResponse.json({ data: result.value });
    } catch (error) {
      console.error('Error in getScheduledReport:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/scheduled-reports
   * Create a new scheduled report
   */
  async createScheduledReport(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      
      // Validate request body
      const validatedData = CreateScheduledReportSchema.parse(body);
      
      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Create delivery configuration
      const deliveryConfig = new DeliveryConfigDto(
        validatedData.method,
        validatedData.recipients,
        validatedData.format,
        validatedData.settings
      );
      
      // Create command
      const command = new CreateScheduledReportCommand(
        validatedData.name,
        validatedData.reportId,
        validatedData.frequency as ScheduleFrequency,
        validatedData.timezone,
        deliveryConfig,
        userId,
        validatedData.organizationId
      );

      // Execute command
      const result = await this.scheduledReportUseCase.createScheduledReport(command);
      
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
      console.error('Error in createScheduledReport:', error);
      
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
   * PUT /api/scheduled-reports/[id]
   * Update an existing scheduled report
   */
  async updateScheduledReport(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const scheduledReportId = params.id;
      if (!scheduledReportId) {
        return NextResponse.json({ error: 'Scheduled report ID is required' }, { status: 400 });
      }

      const body = await request.json();
      const validated = UpdateScheduledReportSchema.parse(body);

      const userId = this.getUserIdFromRequest(request);

      const command = new UpdateScheduledReportCommand(
        scheduledReportId,
        userId,
        validated.name,
        validated.description,
        validated.frequency as ScheduleFrequency | undefined,
        validated.timezone,
        validated.deliveryConfig ? new DeliveryConfigDto(
          validated.deliveryConfig.method || 'email',
          validated.deliveryConfig.recipients || [],
          validated.deliveryConfig.format || 'pdf',
          validated.deliveryConfig.settings || {}
        ) : undefined,
        validated.isActive
      );

      const result = await this.scheduledReportUseCase.updateScheduledReport(command);
      if (!result.isSuccess) {
        const msg = typeof result.error === 'string' ? result.error : (result.error as Error)?.message || 'Update failed';
        const status = msg.includes('not found') ? 404 : 400;
        return NextResponse.json({ error: msg }, { status });
      }

      return NextResponse.json({ data: result.value }, { status: 200 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Error in updateScheduledReport:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  /**
   * DELETE /api/scheduled-reports/[id]
   * Delete a scheduled report
   */
  async deleteScheduledReport(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const scheduledReportId = params.id;
      if (!scheduledReportId) {
        return NextResponse.json(
          { error: 'Scheduled report ID is required' },
          { status: 400 }
        );
      }

      const userId = this.getUserIdFromRequest(request);

      // Determine soft vs hard delete via query param ?permanent=true
      let permanent = false;
      try {
        const url = typeof (request as any).url === 'string' ? new URL((request as any).url) : undefined;
        permanent = url ? url.searchParams.get('permanent') === 'true' : false;
      } catch {}

      const command = new DeleteScheduledReportCommand(scheduledReportId, userId, permanent);
      const result = await this.scheduledReportUseCase.deleteScheduledReport(command);

      if (!result.isSuccess) {
        const msg = typeof result.error === 'string' ? result.error : (result.error as Error)?.message || 'Delete failed';
        const status = msg.includes('not found') ? 404 : 400;
        return NextResponse.json({ error: msg }, { status });
      }

      return NextResponse.json({ success: true }, { status: permanent ? 200 : 202 });
    } catch (error) {
      console.error('Error in deleteScheduledReport:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/scheduled-reports/[id]/execute
   * Execute a scheduled report immediately
   */
  async executeScheduledReport(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const scheduledReportId = params.id;
      
      if (!scheduledReportId) {
        return NextResponse.json(
          { error: 'Scheduled report ID is required' },
          { status: 400 }
        );
      }

      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);

      // Execute scheduled report
      const result = await this.scheduledReportUseCase.executeScheduledReport(scheduledReportId, userId);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error.message?.includes('not found') ? 404 : 400 }
        );
      }

      return NextResponse.json(
        { data: result.value },
        { status: 202 } // Accepted - processing asynchronously
      );
    } catch (error) {
      console.error('Error in executeScheduledReport:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/scheduled-reports/[id]/pause
   * Pause a scheduled report
   */
  async pauseScheduledReport(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const scheduledReportId = params.id;
      
      if (!scheduledReportId) {
        return NextResponse.json(
          { error: 'Scheduled report ID is required' },
          { status: 400 }
        );
      }

      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);

      // Pause scheduled report
      const result = await this.scheduledReportUseCase.pauseScheduledReport(scheduledReportId, userId);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error.message?.includes('not found') ? 404 : 400 }
        );
      }

      return NextResponse.json({ data: result.value });
    } catch (error) {
      console.error('Error in pauseScheduledReport:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/scheduled-reports/[id]/resume
   * Resume a paused scheduled report
   */
  async resumeScheduledReport(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const scheduledReportId = params.id;
      
      if (!scheduledReportId) {
        return NextResponse.json(
          { error: 'Scheduled report ID is required' },
          { status: 400 }
        );
      }

      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);

      // Resume scheduled report
      const result = await this.scheduledReportUseCase.resumeScheduledReport(scheduledReportId, userId);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error.message?.includes('not found') ? 404 : 400 }
        );
      }

      return NextResponse.json({ data: result.value });
    } catch (error) {
      console.error('Error in resumeScheduledReport:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/scheduled-reports/[id]/execution-history
   * Get execution history for a scheduled report
   */
  async getExecutionHistory(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const scheduledReportId = params.id;
      const { searchParams } = new URL(request.url);
      const page = Number(searchParams.get('page') || '1');
      const limit = Number(searchParams.get('limit') || '20');

      if (!scheduledReportId) {
        return NextResponse.json(
          { error: 'Scheduled report ID is required' },
          { status: 400 }
        );
      }

      const result = await this.scheduledReportUseCase.getExecutionHistory(scheduledReportId, page, limit);

      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error?.message || 'Failed to fetch execution history' },
          { status: result.error?.message?.includes('not found') ? 404 : 400 }
        );
      }

      const paginated = result.value;
      return NextResponse.json({
        executions: paginated.items,
        total: paginated.totalCount,
        page: paginated.page,
        limit: paginated.pageSize,
        totalPages: paginated.totalPages,
      });
    } catch (error) {
      console.error('Error in getExecutionHistory:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/scheduled-reports/statistics
   * Get scheduled report statistics for the current user
   */
  async getScheduledReportStatistics(request: NextRequest): Promise<NextResponse> {
    try {
      const userId = this.getUserIdFromRequest(request);

      // Optional organizationId from query
      let organizationId: string | undefined;
      try {
        const url = typeof (request as any).url === 'string' ? new URL((request as any).url) : undefined;
        organizationId = url?.searchParams.get('organizationId') || undefined;
      } catch {}

      const result = await this.scheduledReportUseCase.getScheduledReportStatistics(organizationId);
      if (!result.isSuccess) {
        const msg = typeof result.error === 'string' ? result.error : (result.error as Error)?.message || 'Failed to get statistics';
        return NextResponse.json({ error: msg }, { status: 400 });
      }

      return NextResponse.json({ data: result.value }, { status: 200 });
    } catch (error) {
      console.error('Error in getScheduledReportStatistics:', error);
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