import { injectable } from 'inversify';
import { CreateTemplateHandler } from '../../../../shared/application/reporting/templates/handlers/create-template.handler';
import { UpdateTemplateHandler } from '../../../../shared/application/reporting/templates/handlers/update-template.handler';
import { DeleteTemplateHandler } from '../../../../shared/application/reporting/templates/handlers/delete-template.handler';
import { UseTemplateHandler } from '../../../../shared/application/reporting/templates/handlers/use-template.handler';
import { GetTemplateHandler } from '../../../../shared/application/reporting/templates/handlers/get-template.handler';
import { ListTemplatesHandler } from '../../../../shared/application/reporting/templates/handlers/list-templates.handler';
import { CreateTemplateCommand } from '../../../../shared/application/reporting/templates/commands/create-template.command';
import { UpdateTemplateCommand } from '../../../../shared/application/reporting/templates/commands/update-template.command';
import { DeleteTemplateCommand } from '../../../../shared/application/reporting/templates/commands/delete-template.command';
import { UseTemplateCommand } from '../../../../shared/application/reporting/templates/commands/use-template.command';
import { GetTemplateQuery } from '../../../../shared/application/reporting/templates/queries/get-template.query';
import { ListTemplatesQuery } from '../../../../shared/application/reporting/templates/queries/list-templates.query';
import { toTemplateDto, TemplateSearchResultDto } from '../../../../shared/application/reporting/templates/dto/template.dto';

/**
 * Request/Response types for Report Templates API
 */
export interface CreateTemplateRequest {
  name: string;
  description?: string;
  type?: string;
  category?: string;
  config: any;
  layout?: any;
  styling?: any;
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  type?: string;
  category?: string;
  config?: any;
  layout?: any;
  styling?: any;
  isPublic?: boolean;
  isActive?: boolean;
  tags?: string[];
}

export interface ListTemplatesOptions {
  name?: string;
  category?: string;
  isActive?: boolean;
  isSystem?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Report Templates API Controller
 * Handles HTTP requests for report template operations following Clean Architecture principles
 */
@injectable()
export class ReportTemplatesApiController {
  constructor(
    private readonly createTemplateHandler: CreateTemplateHandler,
    private readonly updateTemplateHandler: UpdateTemplateHandler,
    private readonly deleteTemplateHandler: DeleteTemplateHandler,
    private readonly useTemplateHandler: UseTemplateHandler,
    private readonly getTemplateHandler: GetTemplateHandler,
    private readonly listTemplatesHandler: ListTemplatesHandler
  ) {}

  /**
   * Create a new report template
   * POST /api/report-templates
   */
  async createTemplate(
    userId: string,
    organizationId: string | undefined,
    request: CreateTemplateRequest
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const command = new CreateTemplateCommand({
        name: request.name,
        description: request.description,
        type: request.type as any,
        category: request.category as any,
        config: request.config,
        layout: request.layout,
        styling: request.styling,
        isPublic: request.isPublic,
        tags: request.tags,
        createdBy: userId,
        organizationId,
      });

      const result = await this.createTemplateHandler.handle(command);

      if (result.isFailure || !result.value) {
        return {
          success: false,
          error: result.error?.message || 'Failed to create template',
        };
      }

      const templateData = toTemplateDto(result.value);

      return {
        success: true,
        data: templateData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      };
    }
  }

  /**
   * Get a single template by ID
   * GET /api/report-templates/[id]
   */
  async getTemplate(templateId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const query = new GetTemplateQuery(templateId);

      const result = await this.getTemplateHandler.handle(query);

      if (result.isFailure) {
        return {
          success: false,
          error: result.error?.message || 'Failed to get template',
        };
      }

      if (!result.value) {
        return {
          success: true,
          data: null,
        };
      }

      const templateData = toTemplateDto(result.value);

      return {
        success: true,
        data: templateData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      };
    }
  }

  /**
   * List templates with filtering and pagination
   * GET /api/report-templates
   */
  async listTemplates(
    options: ListTemplatesOptions
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const criteria: any = {};

      if (options.name) {
        criteria.name = options.name;
      }

      if (options.category) {
        criteria.category = options.category;
      }

      if (options.isActive !== undefined) {
        criteria.isActive = options.isActive;
      }

      if (options.isSystem !== undefined) {
        criteria.isSystem = options.isSystem;
      }

      const query = new ListTemplatesQuery(
        criteria,
        {
          limit: options.limit || 20,
          offset: options.offset || 0,
          sortBy: (options.sortBy || 'createdAt') as any,
          sortOrder: options.sortOrder || 'desc',
        }
      );

      const result = await this.listTemplatesHandler.handle(query);

      if (result.isFailure || !result.value) {
        return {
          success: false,
          error: result.error?.message || 'Failed to list templates',
        };
      }

      const templatesData = result.value.templates.map((template: any) => toTemplateDto(template));

      return {
        success: true,
        data: {
          templates: templatesData,
          pagination: {
            total: result.value.total,
            hasMore: result.value.hasMore,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      };
    }
  }

  /**
   * Update a template
   * PUT /api/report-templates/[id]
   */
  async updateTemplate(
    templateId: string,
    userId: string,
    request: UpdateTemplateRequest
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const command = new UpdateTemplateCommand({
        templateId,
        ...request,
        userId,
      });

      const result = await this.updateTemplateHandler.handle(command);

      if (result.isFailure || !result.value) {
        return {
          success: false,
          error: result.error?.message || 'Failed to update template',
        };
      }

      const templateData = toTemplateDto(result.value);

      return {
        success: true,
        data: templateData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      };
    }
  }

  /**
   * Delete a template
   * DELETE /api/report-templates/[id]
   */
  async deleteTemplate(
    templateId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const command = new DeleteTemplateCommand(templateId, userId);

      const result = await this.deleteTemplateHandler.handle(command);

      if (result.isFailure) {
        return {
          success: false,
          error: result.error?.message || 'Failed to delete template',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      };
    }
  }

  /**
   * Use a template to create a new report
   * POST /api/templates/[id]/use
   */
  async useTemplate(
    templateId: string,
    userId: string,
    organizationId: string | undefined,
    title: string,
    description?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const command = new UseTemplateCommand({
        templateId,
        title,
        description,
        userId,
        organizationId,
      });

      const result = await this.useTemplateHandler.handle(command);

      if (result.isFailure || !result.value) {
        return {
          success: false,
          error: result.error?.message || 'Failed to use template',
        };
      }

      return {
        success: true,
        data: {
          report: result.value.report,
          template: result.value.template,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      };
    }
  }
}
