import { NextRequest, NextResponse } from 'next/server';
import { ReportExportService } from '../../application/services/report-export-service';
import { z } from 'zod';

// Validation schemas
const GetExportsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON', 'HTML']).optional(),
  reportId: z.string().optional(),
  createdBy: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
});

/**
 * API Controller for Export management
 */
export class ExportsController {
  constructor(
    private readonly reportExportService: ReportExportService
  ) {}

  /**
   * GET /api/exports
   * Get export jobs with filtering and pagination
   */
  async getExports(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const queryParams = Object.fromEntries(searchParams.entries());
      
      // Validate query parameters
      const validatedParams = GetExportsSchema.parse(queryParams);
      
      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Get export jobs
      const result = await this.reportExportService.getExportJobs(
        {
          status: validatedParams.status as any,
          format: validatedParams.format as any,
          reportId: validatedParams.reportId,
          createdBy: validatedParams.createdBy || userId,
          createdAfter: validatedParams.createdAfter ? new Date(validatedParams.createdAfter) : undefined,
          createdBefore: validatedParams.createdBefore ? new Date(validatedParams.createdBefore) : undefined,
        },
        {
          page: validatedParams.page,
          limit: validatedParams.limit,
          sortBy: validatedParams.sortBy,
          sortOrder: validatedParams.sortOrder,
        }
      );
      
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
          limit: result.value.limit,
          totalCount: result.value.totalCount,
          totalPages: result.value.totalPages,
        },
      });
    } catch (error) {
      console.error('Error in getExports:', error);
      
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
   * GET /api/exports/[id]
   * Get a specific export job by ID
   */
  async getExport(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const exportId = params.id;
      
      if (!exportId) {
        return NextResponse.json(
          { error: 'Export ID is required' },
          { status: 400 }
        );
      }

      // Get export job
      const result = await this.reportExportService.getExportJob(exportId);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error.message?.includes('not found') ? 404 : 400 }
        );
      }

      return NextResponse.json({ data: result.value });
    } catch (error) {
      console.error('Error in getExport:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/exports/[id]/cancel
   * Cancel an export job
   */
  async cancelExport(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const exportId = params.id;
      
      if (!exportId) {
        return NextResponse.json(
          { error: 'Export ID is required' },
          { status: 400 }
        );
      }

      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Cancel export job
      const result = await this.reportExportService.cancelExportJob(exportId, userId);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error.message?.includes('not found') ? 404 : 400 }
        );
      }

      return NextResponse.json({ data: result.value });
    } catch (error) {
      console.error('Error in cancelExport:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/exports/[id]/download
   * Download an export file
   */
  async downloadExport(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const exportId = params.id;
      
      if (!exportId) {
        return NextResponse.json(
          { error: 'Export ID is required' },
          { status: 400 }
        );
      }

      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Download export
      const result = await this.reportExportService.downloadExportFile(exportId, userId);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error.message?.includes('not found') ? 404 : 400 }
        );
      }

      const exportData = result.value;
      
      // Return download information for client-side handling
      return NextResponse.json({
        downloadUrl: exportData.fileUrl,
        fileName: exportData.fileName,
        fileSize: exportData.fileSize,
        contentType: exportData.contentType,
      }, { status: 200 });
    } catch (error) {
      console.error('Error in downloadExport:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/exports/[id]/download-url
   * Get a signed download URL for an export
   */
  async getDownloadUrl(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const exportId = params.id;
      const { searchParams } = new URL(request.url);
      const expiresIn = parseInt(searchParams.get('expiresIn') || '3600'); // Default 1 hour
      
      if (!exportId) {
        return NextResponse.json(
          { error: 'Export ID is required' },
          { status: 400 }
        );
      }

      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Get signed download URL
      const result = await this.reportExportService.getDownloadUrl(exportId, userId, expiresIn);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error.message?.includes('not found') ? 404 : 400 }
        );
      }

      return NextResponse.json({ 
        data: {
          downloadUrl: result.value,
          expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
        }
      });
    } catch (error) {
      console.error('Error in getDownloadUrl:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /api/exports/[id]
   * Delete an export job and its files
   */
  async deleteExport(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const exportId = params.id;
      
      if (!exportId) {
        return NextResponse.json(
          { error: 'Export ID is required' },
          { status: 400 }
        );
      }

      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Delete export
      const result = await this.reportExportService.deleteExport(exportId, userId);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error.message?.includes('not found') ? 404 : 400 }
        );
      }

      return NextResponse.json({ message: 'Export deleted successfully' });
    } catch (error) {
      console.error('Error in deleteExport:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/exports/cleanup
   * Clean up old export files
   */
  async cleanupOldExports(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const olderThanDays = body.olderThanDays || 30; // Default 30 days
      
      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Clean up old exports
      const result = await this.reportExportService.cleanupOldExports(olderThanDays);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({ 
        message: 'Cleanup completed successfully',
        data: {
          jobsDeleted: result.value.jobsDeleted,
          filesDeleted: result.value.filesDeleted,
        }
      });
    } catch (error) {
      console.error('Error in cleanupOldExports:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/exports/statistics
   * Get export statistics for the current user
   */
  async getExportStatistics(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const days = parseInt(searchParams.get('days') || '30'); // Default last 30 days
      
      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Get export statistics
      const result = await this.reportExportService.getExportStatistics(userId, days);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({ data: result.value });
    } catch (error) {
      console.error('Error in getExportStatistics:', error);
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