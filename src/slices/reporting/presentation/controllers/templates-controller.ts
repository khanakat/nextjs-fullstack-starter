import { NextRequest, NextResponse } from 'next/server';
import { TemplateManagementUseCase } from '../../application/use-cases/template-management-use-case';
import { CreateTemplateCommand } from '../../application/commands/create-template-command';
import { UpdateTemplateCommand } from '../../application/commands/update-template-command';
import { DeleteTemplateCommand } from '../../application/commands/delete-template-command';
import { GetTemplateQuery } from '../../application/queries/get-template-query';
import { GetTemplatesQuery } from '../../application/queries/get-templates-query';
import { TemplateCategory, TemplateType } from '../../../../shared/domain/reporting/entities/report-template';
import { z } from 'zod';
import { 
  ReportConfigDto, 
  ReportLayoutDto, 
  ReportStylingDto, 
  ReportComponentDto, 
  PositionDto, 
  SizeDto, 
  GridLayoutDto, 
  ColorSchemeDto, 
  FontConfigDto, 
  SpacingConfigDto 
} from '../../application/dtos/report-dto';
import { DIContainer } from '@/shared/infrastructure/di/container';
import { TYPES } from '@/shared/infrastructure/di/types';
import { ReportOrchestrationService } from '../../application/services/report-orchestration-service';

// Validation schemas
const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['DASHBOARD', 'ANALYTICS', 'FINANCIAL', 'OPERATIONAL', 'CUSTOM']).default('CUSTOM'),
  category: z.string().min(1).max(100),
  config: z.record(z.any()),
  tags: z.array(z.string()).default([]),
  organizationId: z.string().optional(),
});

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.string().min(1).max(100).optional(),
  config: z.record(z.any()).optional(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const CreateReportFromTemplateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  isPublic: z.boolean().optional().default(false),
  customizations: z.record(z.any()).optional(),
  organizationId: z.string().optional(),
});

const GetTemplatesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  category: z.string().optional(),
  name: z.string().optional(),
  createdBy: z.string().optional(),
  organizationId: z.string().optional(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
});

/**
 * API Controller for Template management
 */
export class TemplatesController {
  constructor(
    private readonly templateManagementUseCase: TemplateManagementUseCase
  ) {}

  /**
   * GET /api/templates
   * Get templates with filtering and pagination
   */
  async getTemplates(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const queryParams = Object.fromEntries(searchParams.entries());
      
      // Validate query parameters
      const validatedParams = GetTemplatesSchema.parse(queryParams);
      
      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Execute query
      const result = await this.templateManagementUseCase.getTemplates(
        {
          category: validatedParams.category as TemplateCategory,
          name: validatedParams.name,
          createdBy: validatedParams.createdBy || userId,
          organizationId: validatedParams.organizationId,
          isActive: validatedParams.isActive,
          createdAfter: validatedParams.createdAfter ? new Date(validatedParams.createdAfter) : undefined,
          createdBefore: validatedParams.createdBefore ? new Date(validatedParams.createdBefore) : undefined,
        },
        {
          page: validatedParams.page,
          pageSize: validatedParams.limit,
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
          limit: result.value.pageSize,
          totalCount: result.value.totalCount,
          totalPages: result.value.totalPages,
        },
      });
    } catch (error) {
      console.error('Error in getTemplates:', error);
      
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
   * GET /api/templates/[id]
   * Get a specific template by ID
   */
  async getTemplate(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const templateId = params.id;
      
      if (!templateId) {
        return NextResponse.json(
          { error: 'Template ID is required' },
          { status: 400 }
        );
      }

      // Execute query
      const result = await this.templateManagementUseCase.getTemplate(templateId);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error.message?.includes('not found') ? 404 : 400 }
        );
      }

      return NextResponse.json({ data: result.value });
    } catch (error) {
      console.error('Error in getTemplate:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/templates
   * Create a new template
   */
  async createTemplate(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      
      // Validate request body
      const validatedData = CreateTemplateSchema.parse(body);
      
      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);
      
      // Convert config to proper DTO
      const configDto = this.convertToReportConfigDto(validatedData.config);

      // Create command
      const command = new CreateTemplateCommand(
        validatedData.name,
        validatedData.type as TemplateType,
        validatedData.category as TemplateCategory,
        configDto,
        validatedData.tags,
        userId,
        validatedData.description,
        undefined, // previewImageUrl
        validatedData.organizationId
      );

      // Execute command
      const result = await this.templateManagementUseCase.createTemplate(command);
      
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
      console.error('Error in createTemplate:', error);
      
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
   * PUT /api/templates/[id]
   * Update an existing template
   */
  async updateTemplate(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const templateId = params.id;
      const body = await request.json();
      
      if (!templateId) {
        return NextResponse.json(
          { error: 'Template ID is required' },
          { status: 400 }
        );
      }

      // Validate request body
      const validatedData = UpdateTemplateSchema.parse(body);
      
      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);

      // Convert config to proper DTO if provided
      const configDto = validatedData.config ? this.convertToReportConfigDto(validatedData.config) : undefined;

      // Create command
      const command = new UpdateTemplateCommand(
        templateId,
        userId,
        {
          name: validatedData.name,
          description: validatedData.description,
          category: validatedData.category as TemplateCategory,
          config: configDto,
          isActive: validatedData.isActive,
        }
      );

      // Execute command
      const result = await this.templateManagementUseCase.toggleTemplateStatus(templateId, validatedData.isActive ?? true, userId);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({ data: result.value });
    } catch (error) {
      console.error('Error in updateTemplate:', error);
      
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
   * DELETE /api/templates/[id]
   * Delete a template
   */
  async deleteTemplate(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const templateId = params.id;
      
      if (!templateId) {
        return NextResponse.json(
          { error: 'Template ID is required' },
          { status: 400 }
        );
      }

      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);

      // Create command
      const command = new DeleteTemplateCommand(templateId, userId);

      // Execute command
      const result = await this.templateManagementUseCase.deleteTemplate(command);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({ message: 'Template deleted successfully' });
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/templates/[id]/duplicate
   * Duplicate a template
   */
  async duplicateTemplate(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const templateId = params.id;
      const body = await request.json().catch(() => ({}));
      
      if (!templateId) {
        return NextResponse.json(
          { error: 'Template ID is required' },
          { status: 400 }
        );
      }

      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);

      // Get optional new name from request body
      const newName = body.name;

      // Execute duplication
      const result = await this.templateManagementUseCase.duplicateTemplate(templateId, userId, newName);
      
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
      console.error('Error in duplicateTemplate:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/templates/categories
   * Get all template categories
   */
  async getTemplateCategories(request: NextRequest): Promise<NextResponse> {
    try {
      const result = await this.templateManagementUseCase.getTemplateCategories();
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({ data: result.value });
    } catch (error) {
      console.error('Error in getTemplateCategories:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * GET /api/templates/[id]/usage-statistics
   * Get template usage statistics
   */
  async getTemplateUsageStatistics(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const templateId = params.id;
      
      if (!templateId) {
        return NextResponse.json(
          { error: 'Template ID is required' },
          { status: 400 }
        );
      }

      // Get usage statistics
      const result = await this.templateManagementUseCase.getTemplateStatistics(templateId);
      
      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error.message?.includes('not found') ? 404 : 400 }
        );
      }

      return NextResponse.json({ data: result.value });
    } catch (error) {
      console.error('Error in getTemplateUsageStatistics:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/templates/[id]/create-report
   * Create a report from a template
   */
  async createReportFromTemplate(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const templateId = params.id;
      const body = await request.json();

      if (!templateId) {
        return NextResponse.json(
          { error: 'Template ID is required' },
          { status: 400 }
        );
      }

      const validated = CreateReportFromTemplateSchema.parse(body);

      // Get user ID from authentication context
      const userId = this.getUserIdFromRequest(request);

      // Resolve orchestration service and required dependencies from the DI container
      const container = DIContainer.getInstance();
      const orchestrationService = new ReportOrchestrationService(
        container.get(TYPES.ReportRepository),
        container.get(TYPES.ReportTemplateRepository),
        container.get(TYPES.ScheduledReportRepository),
        container.get(TYPES.TemplateManagementUseCase),
        container.get(TYPES.ScheduledReportUseCase),
        container.get(TYPES.CreateReportHandler),
      );

      const result = await orchestrationService.createReportFromTemplate(templateId, {
        title: validated.title,
        description: validated.description,
        isPublic: validated.isPublic ?? false,
        userId,
        organizationId: validated.organizationId,
        customizations: validated.customizations,
      });

      if (!result.isSuccess) {
        return NextResponse.json(
          { error: result.error?.toString?.() || 'Failed to create report from template' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { data: result.value },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error in createReportFromTemplate:', error);
      
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

  private convertToReportConfigDto(config: Record<string, any>): ReportConfigDto {
    // Create default layout if not provided
    const layoutData = config.layout || {
      type: 'grid',
      components: [],
      grid: { columns: 12, rows: 8, gap: 16 }
    };

    // Create layout DTO
    const layoutDto = new ReportLayoutDto(
      layoutData.type || 'grid',
      (layoutData.components || []).map((comp: any) => new ReportComponentDto(
        comp.id || 'default-component',
        comp.type || 'TEXT',
        new PositionDto(comp.position?.x || 0, comp.position?.y || 0),
        new SizeDto(comp.size?.width || 4, comp.size?.height || 2),
        comp.config || {}
      )),
      new GridLayoutDto(
        layoutData.grid?.columns || 12,
        layoutData.grid?.rows || 8,
        layoutData.grid?.gap || 16
      )
    );

    // Create default styling if not provided
    const stylingData = config.styling || {
      theme: 'light',
      colors: { primary: '#007bff', secondary: '#6c757d', accent: '#28a745', background: '#ffffff', text: '#212529' },
      fonts: { family: 'Inter', sizes: { medium: 14 }, weights: { normal: 400 } },
      spacing: { unit: 8, scale: [4, 8, 16, 24, 32] }
    };

    // Create styling DTO
    const stylingDto = new ReportStylingDto(
      stylingData.theme || 'light',
      new ColorSchemeDto(
        stylingData.colors?.primary || '#007bff',
        stylingData.colors?.secondary || '#6c757d',
        stylingData.colors?.accent || '#28a745',
        stylingData.colors?.background || '#ffffff',
        stylingData.colors?.text || '#212529'
      ),
      new FontConfigDto(
        stylingData.fonts?.family || 'Inter',
        stylingData.fonts?.sizes || { medium: 14 },
        stylingData.fonts?.weights || { normal: 400 }
      ),
      new SpacingConfigDto(
        stylingData.spacing?.unit || 8,
        stylingData.spacing?.scale || [4, 8, 16, 24, 32]
      )
    );

    return new ReportConfigDto(
      config.title || 'Untitled Report',
      config.filters || {},
      config.parameters || {},
      layoutDto,
      stylingDto,
      config.description
    );
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
